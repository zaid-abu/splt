import type { JSX } from "react";
import { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/context/AppContext";
import { useExpenseSnapshot } from "@/features/expenses/hooks/useExpenseSnapshot";
import { ExpenseComments } from "@/features/expenses/components/ExpenseComments";
import { formatAmount, getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { CoralButton, CoralScreen, CoralTopBar, Eyebrow, MoneyRow, useCoralColors } from "@/components/coral";
import { expensesApi } from "@/features/expenses/services/api";
import { useDeleteExpense } from "@/features/expenses/queries/useExpenses";
import { useAppToast } from "@/hooks/useAppToast";
import { useGroups } from "@/features/groups/queries/useGroups";
import type { ExpenseRouteParams } from "@/types/navigation";
import { minorToMajor } from "@/features/money/splits";
import { EXPENSE_CATEGORIES } from "@/types";

const SPLIT_METHOD_LABELS: Record<string, string> = {
  equal: "equally",
  custom: "by amount",
  percentage: "by percentage",
  shares: "by shares",
};

export default function ExpenseDetailScreenV2(): JSX.Element {
  const { id } = useLocalSearchParams<ExpenseRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const coral = useCoralColors();
  const { mutateAsync: deleteExpense } = useDeleteExpense();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { toast } = useAppToast();

  const snapshot = useExpenseSnapshot(id);
  const { data, isInitialLoading, isError, error, isNotFound, refresh } = snapshot;
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const deleteSheetRef = useRef<BottomSheetModal>(null);
  const settleSheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  const handleViewReceipt = useCallback(async () => {
    if (!data?.receiptUrl) return;
    setReceiptLoading(true);
    try {
      const signedUrl = await expensesApi.createReceiptSignedUrl(id, data.receiptUrl);
      setReceiptUrl(signedUrl);
      const canOpen = await Linking.canOpenURL(signedUrl);
      if (canOpen) {
        await Linking.openURL(signedUrl);
      }
    } catch {
      toast.show({
        label: "Failed to load receipt",
        variant: "danger",
        placement: "top",
      });
    } finally {
      setReceiptLoading(false);
    }
  }, [data?.receiptUrl, id, toast]);

  const handleDeletePress = useCallback(() => {
    Haptics.selectionAsync();
    deleteSheetRef.current?.present();
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!data) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteSheetRef.current?.dismiss();
    setDeleteLoading(true);
    try {
      await deleteExpense(data.expense.id);
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete expense";
      toast.show({ label: "Error", description: msg, variant: "danger", placement: "top" });
    } finally {
      setDeleteLoading(false);
    }
  }, [data, deleteExpense, router, toast]);

  const handleEdit = useCallback(() => {
    if (!data) return;
    Haptics.selectionAsync();
    router.push(`/expense/${data.expense.id}/edit`);
  }, [data, router]);

  const handleSettlePress = useCallback(() => {
    Haptics.selectionAsync();
    settleSheetRef.current?.present();
  }, []);

  const handleSettleSelect = useCallback(
    (counterpartyId: string) => {
      Haptics.selectionAsync();
      settleSheetRef.current?.dismiss();
      const candidate = data?.settlementCandidates.find((c) => c.counterpartyId === counterpartyId);
      if (!candidate) return;
      const symbol = getCurrencySymbol(candidate.currency);
      const major = minorToMajor(Math.abs(candidate.signedAmountMinor), candidate.currency);
      const routeParams = candidate.context.type === "group"
        ? `?groupId=${candidate.context.groupId}`
        : "";
      router.push(`/settle/${candidate.counterpartyId}${routeParams}` as any);
    },
    [data, router]
  );

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

  if (isNotFound || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: coral.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 24, fontFamily: "InstrumentSans_600SemiBold", color: coral.foreground, marginTop: 16 }}>
          Expense not found
        </Text>
        <Text style={{ fontSize: 16, fontFamily: "InstrumentSans_400Regular", color: coral.muted, textAlign: "center", marginTop: 8 }}>
          This expense may have been deleted or is unavailable.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
            backgroundColor: coral.accent, borderRadius: 14, opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontFamily: "InstrumentSans_600SemiBold", color: coral.inkOnAccent }}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const { expense, permissions, settlementCandidates } = data;
  const group = expense.groupId ? groups.find((g) => g.id === expense.groupId) : undefined;
  const paidByName = expense.paidByUser.name.split(" ")[0];
  const paidByMe = expense.paidBy === currentUser.id;
  const mySplit = expense.splits.find((s) => s.userId === currentUser.id);
  const myShareMinor = mySplit?.amountMinor ?? 0;
  const youLentMinor = paidByMe ? expense.amountMinor - myShareMinor : 0;
  const youBorrowedMinor = !paidByMe ? myShareMinor : 0;
  const splitMethodLabel = SPLIT_METHOD_LABELS[expense.splitMethod] ?? expense.splitMethod;

  const dateStr = expense.date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const relativeDate = isToday(expense.date) ? "today"
    : isYesterday(expense.date) ? "yesterday"
    : dateStr;

  return (
    <CoralScreen contentContainerStyle={{ paddingBottom: 40 }}>
      <CoralTopBar
        title="Expense"
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        rightElement={
          data.permissions.canDelete ? (
            <Pressable accessibilityRole="button" onPress={handleDeletePress} hitSlop={8}>
              <Text style={{ fontSize: 20, color: coral.muted, lineHeight: 22, letterSpacing: 2 }}>
                &#8226;&#8226;&#8226;
              </Text>
            </Pressable>
          ) : null
        }
      />

      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.foreground,
          textAlign: "center", marginTop: 8, marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {expense.title}
      </Text>

      <Text
        style={{
          fontFamily: "IBMPlexMono_600SemiBold", fontSize: 52, letterSpacing: -0.03 * 52,
          color: coral.foreground, textAlign: "center", marginTop: 35,
        }}
      >
        {formatAmount(minorToMajor(expense.amountMinor, expense.currency), expense.currency)}
      </Text>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular", fontSize: 16, color: coral.muted,
          textAlign: "center", lineHeight: 24, marginTop: 8, marginBottom: 24,
        }}
      >
        {group ? `${group.name} · ` : ""}{relativeDate} · {EXPENSE_CATEGORIES.find((c) => c.key === expense.category)?.label ?? expense.category}
      </Text>

      <View
        style={{
          borderRadius: 16, borderWidth: 1, borderColor: coral.border,
          backgroundColor: coral.surface, padding: 15, marginBottom: 20,
        }}
      >
        {[
          { label: "Paid by", value: paidByMe ? "You" : paidByName },
          {
            label: "Your actual share",
            value: formatAmount(minorToMajor(myShareMinor, expense.currency), expense.currency),
          },
          ...(youLentMinor > 0
            ? [{ label: "You lent", value: formatAmount(minorToMajor(youLentMinor, expense.currency), expense.currency), tone: "credit" as const }]
            : []),
          ...(youBorrowedMinor > 0
            ? [{ label: "You borrowed", value: formatAmount(minorToMajor(youBorrowedMinor, expense.currency), expense.currency), tone: "debt" as const }]
            : []),
          { label: "Split method", value: `${splitMethodLabel} · ${expense.splits.length} included` },
        ].map((line, i, arr) => (
          <View
            key={line.label}
            style={{
              flexDirection: "row", justifyContent: "space-between", alignItems: "baseline",
              gap: 16, minHeight: 40, paddingVertical: 8,
              borderBottomWidth: i < arr.length - 1 ? 1 : 0,
              borderBottomColor: coral.border,
            }}
          >
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 14, color: coral.muted }}>
              {line.label}
            </Text>
            <Text
              style={{
                fontFamily: "IBMPlexMono_600SemiBold", fontSize: 16,
                fontVariant: ["tabular-nums"],
                color: line.tone === "credit" ? coral.positive
                  : line.tone === "debt" ? coral.negative
                  : coral.foreground,
              }}
            >
              {line.value}
            </Text>
          </View>
        ))}
      </View>

      <Eyebrow>Split breakdown</Eyebrow>

      {expense.splits.map((split) => {
        const isMe = split.userId === currentUser.id;
        const isPayer = split.userId === expense.paidBy;
        const totalStr = formatAmount(minorToMajor(expense.amountMinor, expense.currency), expense.currency);
        const shareStr = formatAmount(minorToMajor(split.amountMinor, expense.currency), expense.currency);

        let subtitle: string;
        let amount: string;
        let amountTone: "neutral" | "positive" | "negative";

        if (isPayer) {
          const lentMinor = expense.amountMinor - split.amountMinor;
          const lentStr = formatAmount(minorToMajor(lentMinor, expense.currency), expense.currency);
          subtitle = `Paid ${totalStr} - share ${shareStr}`;
          amount = `+${lentStr} lent`;
          amountTone = "positive";
        } else if (paidByMe) {
          subtitle = "Owes you";
          amount = `${shareStr} owed`;
          amountTone = "negative";
        } else if (isMe) {
          subtitle = "Your share";
          amount = shareStr;
          amountTone = "negative";
        } else {
          subtitle = `Owes ${paidByName}`;
          amount = `${shareStr} owed`;
          amountTone = "negative";
        }

        return (
          <MoneyRow
            key={split.userId}
            avatar={<AppUserAvatar user={split.user} size="md" />}
            title={isMe ? "You" : split.user.name}
            subtitle={subtitle}
            amount={amount}
            amountTone={amountTone}
          />
        );
      })}

      <View style={{ marginTop: 18, gap: 10 }}>
        {data.permissions.canEdit && (
          <CoralButton label="Edit expense" onPress={handleEdit} variant="secondary" />
        )}

        {settlementCandidates.length > 0 && (
          <CoralButton label="Settle balance" onPress={handleSettlePress} variant="primary" />
        )}
      </View>

      {data.receiptUrl ? <MoneyRow
        avatar={
          <View
            style={{
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: coral.accentSoft, alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: coral.accentInk }}>R</Text>
          </View>
        }
        title="Receipt attached"
        subtitle={`Open receipt image${data.comments.length > 0 ? ` · ${data.comments.length} comment${data.comments.length === 1 ? "" : "s"}` : ""}`}
        amount={receiptLoading ? "Loading..." : "View"}
        onPress={receiptLoading ? undefined : handleViewReceipt}
      /> : null}

      <View style={{ marginTop: 32, marginBottom: 40 }}>
        <ExpenseComments expenseId={expense.id} currentUserId={currentUser.id} />
      </View>

      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: coral.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: coral.border, width: 38, height: 5 }}
      >
        <BottomSheetView style={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 22, color: coral.foreground, marginBottom: 8 }}>
            {data.permissions.deleteNeedsOwnerConfirmation ? "Owner confirmation required" : "Delete Expense?"}
          </Text>
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 16, color: coral.muted, marginBottom: 24 }}>
            {data.permissions.deleteNeedsOwnerConfirmation
              ? `This expense was created by ${expense.createdBy === currentUser.id ? "you" : expense.paidByUser.name}. As a group owner, you can delete it, but this action cannot be undone.`
              : `Are you sure you want to delete "${expense.title}"? This cannot be undone.`}
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                deleteSheetRef.current?.dismiss();
              }}
              style={({ pressed }) => ({
                flex: 1, height: 48, borderWidth: 1, borderColor: coral.border,
                borderRadius: 14, alignItems: "center", justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteConfirm}
              disabled={deleteLoading}
              style={({ pressed }) => ({
                flex: 1, height: 48, backgroundColor: coral.negativeSoft,
                borderRadius: 14, alignItems: "center", justifyContent: "center",
                opacity: deleteLoading ? 0.5 : pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.negative }}>
                {deleteLoading ? "Deleting..." : "Delete"}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={settleSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: coral.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: coral.border, width: 38, height: 5 }}
      >
        <BottomSheetView style={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.foreground, marginBottom: 12 }}>
            Settle with
          </Text>
          {settlementCandidates.map((candidate) => {
            const isPositive = candidate.signedAmountMinor > 0;
            const major = minorToMajor(Math.abs(candidate.signedAmountMinor), candidate.currency);
            const symbol = getCurrencySymbol(candidate.currency);
            return (
              <Pressable
                key={candidate.counterpartyId}
                accessibilityRole="button"
                onPress={() => handleSettleSelect(candidate.counterpartyId)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ flex: 1, fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
                  {candidate.counterpartyId === currentUser.id ? "You" : "Someone"}
                </Text>
                <Text style={{
                  fontFamily: "IBMPlexMono_600SemiBold", fontSize: 16,
                  color: isPositive ? coral.positive : coral.negative,
                }}>
                  {isPositive ? "" : "-"}{symbol}{major.toFixed(2)}
                </Text>
              </Pressable>
            );
          })}
        </BottomSheetView>
      </BottomSheetModal>
    </CoralScreen>
  );
}

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
}
