import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralSelect } from "@/components/coral/CoralSelect";
import { CoralButton } from "@/components/coral/CoralButton";
import { CoralSheet } from "@/components/coral/CoralSheet";
import { useCoralColors } from "@/components/coral/useCoral";
import { Eyebrow } from "@/components/coral/Eyebrow";
import { useAuth } from "@/context/AppContext";
import { useExpenseSnapshot } from "@/features/expenses/hooks/useExpenseSnapshot";
import { useExpenseComposer } from "@/features/expenses/hooks/useExpenseComposer";
import type { ComposerParticipant } from "@/features/expenses/hooks/useExpenseComposer";
import { ExpenseSplitEditor } from "@/features/expenses/components/ExpenseSplitEditor";
import { useUpdateExpense } from "@/features/expenses/queries/useExpenses";
import { useAppToast } from "@/hooks/useAppToast";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/types";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { parseMinorInput, minorToMajor } from "@/features/money/splits";
import type { MoneyContext, MoneySplitMethod } from "@/features/money/types";
import type { ExpenseRouteParams } from "@/types/navigation";
import { useGroups } from "@/features/groups/queries/useGroups";

export default function EditExpenseScreen(): JSX.Element {
  const { id } = useLocalSearchParams<ExpenseRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const coral = useCoralColors();
  const { mutateAsync: updateExpense } = useUpdateExpense();
  const { toast } = useAppToast();
  const { data: groups = [] } = useGroups(currentUser?.id);

  const snapshot = useExpenseSnapshot(id);
  const { data, isInitialLoading, isError, refresh } = snapshot;

  const {
    state: composer,
    setAmount,
    setDescription,
    setPaidBy,
    setSplitMethod,
    setSource,
    setDate,
    setCategory,
    setContext,
    confirmCurrency,
    submitStart,
    submitSuccess,
    submitError,
    calculateResult,
    initEdit,
  } = useExpenseComposer();

  const [showPayerSheet, setShowPayerSheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConsequenceReview, setShowConsequenceReview] = useState(false);

  useEffect(() => {
    if (!data || !currentUser) return;

    const expense = data.expense;
    const group = expense.groupId ? groups.find((g) => g.id === expense.groupId) : undefined;

    const context: MoneyContext = expense.groupId
      ? { type: "group", groupId: expense.groupId }
      : { type: "direct", friendshipId: expense.friendshipId ?? "" };

    const participants: ComposerParticipant[] = expense.splits.map((s) => ({
      userId: s.userId,
      name: s.user.name,
      avatar: s.user.initials,
    }));

    const splitSources: Record<string, any> = {};
    for (const s of expense.splits) {
      if (expense.splitMethod === "percentage") {
        splitSources[s.userId] = { percentageUnits: Math.round((s.percentage ?? 0) * 10000) };
      } else if (expense.splitMethod === "shares") {
        splitSources[s.userId] = { shareUnits: Math.round((s.shares ?? 0) * 1000000) };
      } else if (expense.splitMethod === "custom") {
        splitSources[s.userId] = { amountMinor: s.amountMinor };
      } else {
        splitSources[s.userId] = {};
      }
    }

    initEdit({
      context,
      participants,
      currency: expense.currency,
      description: expense.title,
      amountInput: (expense.amountMinor / 100).toFixed(2),
      paidBy: expense.paidBy,
      splitMethod: expense.splitMethod as MoneySplitMethod,
      date: new Date(expense.date),
      category: expense.category,
      notes: expense.notes ?? "",
      splitSources,
    });
  }, [data, currentUser, groups, initEdit]);

  const hasChanges = useMemo(() => {
    if (!data) return false;
    const e = data.expense;
    if (composer.description !== e.title) return true;
    const originalMinor = e.amountMinor;
    const calc = calculateResult();
    if (!calc) return false;
    if (calc.totalMinor !== originalMinor) return true;
    if (composer.paidBy !== e.paidBy) return true;
    if (composer.currency !== e.currency) return true;
    if (composer.splitMethod !== e.splitMethod) return true;
    const originalUserIds = e.splits.map((s) => s.userId).sort().join(",");
    const currentUserIds = composer.participants.map((p) => p.userId).sort().join(",");
    if (originalUserIds !== currentUserIds) return true;
    return false;
  }, [data, composer, calculateResult]);

  const consequenceReview = useMemo(() => {
    if (!data || !hasChanges) return null;
    const e = data.expense;
    const calc = calculateResult();
    if (!calc) return null;

    const changes: string[] = [];
    if (composer.description !== e.title) changes.push("Title");
    if (calc.totalMinor !== e.amountMinor) {
      const sym = getCurrencySymbol(composer.currency);
      const oldMajor = minorToMajor(e.amountMinor, e.currency);
      const newMajor = minorToMajor(calc.totalMinor, composer.currency);
      changes.push(`Amount: ${sym}${oldMajor.toFixed(2)} → ${sym}${newMajor.toFixed(2)}`);
    }
    if (composer.paidBy !== e.paidBy) changes.push("Payer");
    if (composer.currency !== e.currency) changes.push("Currency");
    if (composer.splitMethod !== e.splitMethod) changes.push("Split method");
    const originalUserIds = e.splits.map((s) => s.userId).sort();
    const currentUserIds = composer.participants.map((p) => p.userId).sort();
    if (originalUserIds.join(",") !== currentUserIds.join(",")) {
      changes.push("Participants");
    }

    return changes;
  }, [data, hasChanges, composer, calculateResult]);

  const handleSubmit = useCallback(async () => {
    if (!data || !hasChanges) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (consequenceReview && consequenceReview.length > 0 && !showConsequenceReview) {
      setShowConsequenceReview(true);
      return;
    }

    const result = calculateResult();
    if (!result) {
      toast.show({
        label: "Invalid split",
        description: "Please fix the split before updating.",
        variant: "danger",
        placement: "top",
      });
      return;
    }

    setIsSubmitting(true);
    submitStart();

    try {
      const totalMinor = result.totalMinor;
      const splits = result.splits.map((s) => ({
        userId: s.userId,
        amountMinor: s.amountMinor,
        percentageUnits:
          composer.splitMethod === "percentage"
            ? (composer.splitSources[s.userId]?.percentageUnits ?? 0)
            : undefined,
        shareUnits:
          composer.splitMethod === "shares"
            ? (composer.splitSources[s.userId]?.shareUnits ?? 0)
            : undefined,
        position: s.position,
      }));

      const expenseData = {
        title: composer.description.trim() || "Expense",
        amountMinor: totalMinor,
        currency: composer.currency,
        category: composer.category,
        paidBy: composer.paidBy,
        splitMethod: composer.splitMethod,
        date: composer.date,
        notes: composer.notes || undefined,
        splits,
      };

      await updateExpense({ id, input: expenseData });
      submitSuccess();
      toast.show({ label: "Expense updated", variant: "success", placement: "top" });
      router.back();
    } catch (e: any) {
      submitError({ message: e.message || "Failed to update expense" });
      toast.show({
        label: "Error",
        description: e.message || "Something went wrong.",
        variant: "danger",
        placement: "top",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [data, hasChanges, consequenceReview, showConsequenceReview, calculateResult, composer, updateExpense, id, submitStart, submitSuccess, submitError, toast, router]);

  const handleSourceChange = useCallback(
    (userId: string, value: string) => {
      const method = composer.splitMethod;
      if (method === "custom") {
        try {
          const amountMinor = parseMinorInput(value || "0", composer.currency);
          setSource(userId, { amountMinor });
        } catch {
          setSource(userId, { amountMinor: 0 });
        }
      } else if (method === "percentage") {
        const pct = parseFloat(value) || 0;
        const percentageUnits = Math.round(pct * 10000);
        setSource(userId, { percentageUnits });
      } else if (method === "shares") {
        const shares = parseFloat(value) || 0;
        const shareUnits = Math.round(shares * 1000000);
        setSource(userId, { shareUnits });
      }
    },
    [composer.splitMethod, setSource]
  );

  const handleApplySplit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const currencyOptions = CURRENCIES.map((c) => ({
    label: `${c.symbol} ${c.code}`,
    value: c.code,
  }));

  if (isInitialLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: coral.bg, alignItems: "center", justifyContent: "center" }}>
        <AppLoader />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: coral.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <ErrorState onRetry={() => refresh()} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: coral.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 18, fontFamily: "InstrumentSans_600SemiBold", color: coral.foreground }}>
          Expense not found
        </Text>
      </View>
    );
  }

  if (!data.permissions.canEdit) {
    return (
      <View style={{ flex: 1, backgroundColor: coral.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 18, fontFamily: "InstrumentSans_600SemiBold", color: coral.foreground }}>
          You can't edit this expense
        </Text>
      </View>
    );
  }

  const dateString = composer.date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar
        title="Edit expense"
        onBack={() => router.back()}
      />

      {showConsequenceReview && consequenceReview && consequenceReview.length > 0 ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 120 }}
        >
          <View style={{ paddingTop: 24, gap: 16 }}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <icons.RefreshCw size={40} color={coral.warning} />
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.foreground, textAlign: "center" }}>
                Review changes
              </Text>
              <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 14, color: coral.muted, textAlign: "center" }}>
                The following will be updated:
              </Text>
            </View>

            <View
              style={{
                borderRadius: 16, borderWidth: 1, borderColor: coral.border,
                backgroundColor: coral.surface, padding: 16, gap: 10,
              }}
            >
              {consequenceReview.map((change, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <icons.ArrowRight size={16} color={coral.warning} />
                  <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.foreground, flex: 1 }}>
                    {change}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <CoralButton
                  label="Cancel"
                  onPress={() => router.back()}
                  variant="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <CoralButton
                  label="Save changes"
                  onPress={handleSubmit}
                  variant="primary"
                  disabled={isSubmitting || composer.status === "submitting"}
                  loading={isSubmitting || composer.status === "submitting"}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 120 }}
        >
          <View style={{ gap: 16, paddingTop: 22 }}>
            <View style={{ gap: 7 }}>
              <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, letterSpacing: 0.02 * 13, color: coral.muted }}>
                What was it?
              </Text>
              <TextInput
                placeholder="e.g. Villa groceries"
                placeholderTextColor={coral.muted}
                value={composer.description}
                onChangeText={setDescription}
                style={{
                  borderWidth: 1, borderColor: coral.border, paddingHorizontal: 15,
                  minHeight: 54, borderRadius: 14, fontSize: 16,
                  fontFamily: "InstrumentSans_400Regular", color: coral.foreground,
                  backgroundColor: coral.surface,
                }}
              />
            </View>

            <View style={{ gap: 7 }}>
              <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, letterSpacing: 0.02 * 13, color: coral.muted }}>
                Amount
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ width: 120 }}>
                  <CoralSelect
                    options={currencyOptions}
                    value={composer.currency}
                    onValueChange={(value) => confirmCurrency(value)}
                    placeholder="Currency"
                  />
                </View>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={coral.muted}
                  value={composer.amountInput}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1, borderWidth: 1, borderColor: coral.border, paddingHorizontal: 15,
                    minHeight: 54, borderRadius: 14, fontSize: 20,
                    fontFamily: "IBMPlexMono_600SemiBold", color: coral.foreground,
                    backgroundColor: coral.surface, textAlign: "right",
                  }}
                />
              </View>
            </View>

            <ExpenseSplitEditor
              state={composer}
              currentUserId={currentUser.id}
              onSplitMethodChange={setSplitMethod}
              onSourceChange={handleSourceChange}
              onApply={handleApplySplit}
            />

            <View style={{ gap: 7 }}>
              <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, letterSpacing: 0.02 * 13, color: coral.muted }}>
                Paid by
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPayerSheet(true)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingHorizontal: 15, minHeight: 54, borderRadius: 14, borderWidth: 1,
                  borderColor: coral.border, backgroundColor: coral.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 16, color: coral.foreground }}>
                  {composer.paidBy === currentUser.id
                    ? "You"
                    : composer.participants.find((p) => p.userId === composer.paidBy)?.name || "Select payer"}
                </Text>
                <icons.ChevronDown size={16} color={coral.muted} />
              </Pressable>
            </View>

            <View style={{ gap: 7 }}>
              <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, letterSpacing: 0.02 * 13, color: coral.muted }}>
                Date
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowDateSheet(true)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingHorizontal: 15, minHeight: 54, borderRadius: 14, borderWidth: 1,
                  borderColor: coral.border, backgroundColor: coral.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 16, color: coral.foreground }}>
                  {dateString}
                </Text>
                <icons.ChevronDown size={16} color={coral.muted} />
              </Pressable>
            </View>

            <View style={{ gap: 7 }}>
              <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, letterSpacing: 0.02 * 13, color: coral.muted }}>
                Category
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowCategorySheet(true)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingHorizontal: 15, minHeight: 54, borderRadius: 14, borderWidth: 1,
                  borderColor: coral.border, backgroundColor: coral.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 16, color: coral.foreground }}>
                  {EXPENSE_CATEGORIES.find((c) => c.key === composer.category)?.label || composer.category}
                </Text>
                <icons.ChevronDown size={16} color={coral.muted} />
              </Pressable>
            </View>

            <View style={{ marginTop: 8 }}>
              <CoralButton
                label="Review changes"
                onPress={handleSubmit}
                variant="primary"
                disabled={isSubmitting || composer.status === "submitting" || !hasChanges}
                loading={isSubmitting || composer.status === "submitting"}
              />
            </View>
          </View>
        </ScrollView>
      )}

      <CoralSheet visible={showPayerSheet} onClose={() => setShowPayerSheet(false)}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 8, gap: 4 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 17, color: coral.foreground, marginBottom: 12 }}>
            Paid by
          </Text>
          {composer.participants.map((p) => {
            const isSelected = composer.paidBy === p.userId;
            const isMe = p.userId === currentUser.id;
            return (
              <Pressable
                key={p.userId}
                accessibilityRole="button"
                onPress={() => {
                  setPaidBy(p.userId);
                  setShowPayerSheet(false);
                  Haptics.selectionAsync();
                }}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", gap: 12,
                  paddingVertical: 14, paddingHorizontal: 4, opacity: pressed ? 0.7 : 1,
                })}
              >
                <AppUserAvatar
                  user={{ id: p.userId, name: p.name, initials: p.name?.charAt(0).toUpperCase() ?? "?" }}
                  size="md"
                />
                <Text style={{ flex: 1, fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
                  {isMe ? "You" : p.name}
                </Text>
                {isSelected && <icons.Check size={20} color={coral.accent} strokeWidth={2.5} />}
              </Pressable>
            );
          })}
        </View>
      </CoralSheet>

      <CoralSheet visible={showDateSheet} onClose={() => setShowDateSheet(false)}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 17, color: coral.foreground, marginBottom: 12 }}>
            Date
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, marginBottom: 16 }}>
            {dateString}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setDate(new Date());
              setShowDateSheet(false);
              Haptics.selectionAsync();
            }}
          >
            <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 15, color: coral.accent }}>
              Set to today
            </Text>
          </Pressable>
        </View>
      </CoralSheet>

      <CoralSheet visible={showCategorySheet} onClose={() => setShowCategorySheet(false)}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 8, gap: 4 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 17, color: coral.foreground, marginBottom: 12 }}>
            Category
          </Text>
          {EXPENSE_CATEGORIES.map((cat) => {
            const isSelected = composer.category === cat.key;
            return (
              <Pressable
                key={cat.key}
                accessibilityRole="button"
                onPress={() => {
                  setCategory(cat.key);
                  setShowCategorySheet(false);
                  Haptics.selectionAsync();
                }}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingVertical: 14, paddingHorizontal: 4, opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 16, color: coral.foreground }}>
                  {cat.label}
                </Text>
                {isSelected && <icons.Check size={20} color={coral.accent} strokeWidth={2.5} />}
              </Pressable>
            );
          })}
        </View>
      </CoralSheet>
    </CoralScreen>
  );
}

