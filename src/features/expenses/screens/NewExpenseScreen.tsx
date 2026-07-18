import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { useUI, IconButton } from "@/components/ui";
import { useAuth } from "@/context/AppContext";
import { useExpenseForm } from "@/features/expenses/hooks/useExpenseForm";
import {
  useAddExpense,
  useExpenseDetails,
  useUpdateExpense,
  useUserExpenses,
} from "@/features/expenses/queries/useExpenses";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useAppToast } from "@/hooks/useAppToast";
import { useUIStore } from "@/store/useUIStore";
import type { ExpenseNewRouteParams } from "@/types/navigation";

import { createNewExpenseStyles, updateStyles } from "@/features/expenses/utils/styles";
import { Section } from "@/features/expenses/components/Section";
import { ContextPicker } from "@/features/expenses/components/ContextPicker";
import { ContextSummary } from "@/features/expenses/components/ContextSummary";
import { AmountCard } from "@/features/expenses/components/AmountCard";
import { PreviewCard } from "@/features/expenses/components/PreviewCard";
import { CurrencyInlineSelector } from "@/features/expenses/components/CurrencyInlineSelector";
import { DateInlinePicker } from "@/features/expenses/components/DateInlinePicker";
import { CategorySelector } from "@/features/expenses/components/CategorySelector";
import { PaidBySelector } from "@/features/expenses/components/PaidBySelector";
import { SplitMethodSelector } from "@/features/expenses/components/SplitMethodSelector";
import { ParticipantsEditor } from "@/features/expenses/components/ParticipantsEditor";

export default function NewExpenseScreen(): JSX.Element {
  const {
    groupId: initialGroupId,
    friendId: initialFriendId,
    expenseId,
  } = useLocalSearchParams<ExpenseNewRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: friends = [] } = useFriends(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: expenseDetail } = useExpenseDetails(expenseId);
  const { mutateAsync: addExpense } = useAddExpense();
  const { mutateAsync: updateExpense } = useUpdateExpense();
  const preferredCurrency = useUIStore((state) => state.preferredCurrency);
  const setCurrency = useUIStore((state) => state.setCurrency);
  const { toast } = useAppToast();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const styles = useMemo(() => {
    const s = createNewExpenseStyles(isDarkMode);
    updateStyles(s);
    return s;
  }, [isDarkMode]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { color, radius, space, shadow } = useUI();

  const { state, actions } = useExpenseForm({
    currentUser,
    groups,
    friends,
    expenses,
    expenseDetail,
    initialGroupId,
    initialFriendId,
    expenseId,
    preferredCurrency,
    setCurrency,
    addExpense,
    updateExpense,
    router,
    toast,
  });

  const hasSelection = !!state.selectedGroup || state.selectedFriends.length > 0;
  const hasContext = hasSelection && state.selectionConfirmed;
  const canChangeContext = !initialGroupId && !initialFriendId && !state.existingExpense;
  const primaryLabel = !hasSelection
    ? "Choose friends or a group"
    : !hasContext
      ? "Continue"
      : state.existingExpense
        ? "Save changes"
        : "Add expense";
  const primaryDisabled = !hasSelection || state.loading || isSubmitting;

  const closeScreen = useCallback(() => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  }, [router]);

  const handlePrimaryPress = useCallback(async () => {
    if (!hasSelection) return;

    if (!hasContext) {
      actions.setSelectionConfirmed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSubmitting(true);
    await actions.handleSubmit();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);
  }, [actions, hasContext, hasSelection]);

  if (!currentUser) {
    return (
      <View style={styles.loadingScreen}>
        <ThemedStatusBar />
        <ActivityIndicator color={color.text} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ThemedStatusBar />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <IconButton
            icon={icons.ChevronLeft}
            accessibilityLabel="Close expense screen"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              closeScreen();
            }}
          />
          <View style={styles.headerTitleWrap}>
            <Typography style={styles.headerKicker}>
              {state.existingExpense ? "Edit expense" : "New expense"}
            </Typography>
            <Typography numberOfLines={1} style={styles.headerTitle}>
              {hasContext ? "Expense details" : "Choose people"}
            </Typography>
          </View>
          <View style={styles.headerButtonGhost} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 104 },
          ]}
        >
          {!hasContext ? (
            <ContextPicker
              selectionTab={state.selectionTab}
              setSelectionTab={actions.setSelectionTab}
              searchQuery={state.searchQuery}
              setSearchQuery={actions.setSearchQuery}
              filteredFriends={state.filteredFriends}
              filteredGroups={state.filteredGroups}
              selectedFriendIds={state.selectedFriendIds}
              setSelectedFriendIds={actions.setSelectedFriendIds}
              selectedGroupId={state.selectedGroupId}
              setSelectedGroupId={actions.setSelectedGroupId}
              selectedFriends={state.selectedFriends}
            />
          ) : (
            <View style={styles.formStack}>
              <ContextSummary
                selectedGroup={state.selectedGroup}
                selectedFriends={state.selectedFriends}
                participants={state.participants}
                currency={state.expenseCurrency}
                canChange={canChangeContext}
                onChange={() => {
                  actions.setSelectedGroupId("");
                  actions.setSelectedFriendIds([]);
                  actions.setSelectionConfirmed(false);
                }}
              />

              {(state.errors.members || state.errors.split) && (
                <View
                  style={{
                    backgroundColor: color.dangerTint,
                    borderWidth: 1,
                    borderColor: color.danger,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <Typography
                    style={{
                      fontSize: 13,
                      color: color.danger,
                      fontFamily: "IBMPlexSans_500Medium",
                      lineHeight: 18,
                    }}
                  >
                    {state.errors.members || state.errors.split}
                  </Typography>
                </View>
              )}

              <AmountCard
                amount={state.amount}
                onAmountChange={(v) => {
                  actions.setErrors((prev) => ({ ...prev, amount: "" }));
                  actions.setAmount(v);
                }}
                currency={state.expenseCurrency}
                title={state.title}
                onTitleChange={(v) => {
                  actions.setErrors((prev) => ({ ...prev, title: "" }));
                  actions.setTitle(v);
                }}
                category={state.category}
                amountError={state.errors.amount}
                titleError={state.errors.title}
              />

              <PreviewCard
                amount={state.parsedAmount}
                currency={state.expenseCurrency}
                participantsCount={state.participants.length}
                includedCount={state.includedMembers.length}
                equalShare={state.equalShare}
                splitMethod={state.splitMethod}
                remainingCustom={state.remainingCustom}
                remainingPercent={state.remainingPercent}
              />

              <Section label="Details">
                <Card style={styles.detailCard}>
                  <CurrencyInlineSelector
                    value={state.expenseCurrency}
                    disabled={!!state.selectedGroup}
                    onChange={(currency) => {
                      actions.setExpenseCurrency(currency.code);
                      if (!state.selectedGroup) actions.setCurrency(currency);
                    }}
                  />
                  <View style={styles.detailDivider} />
                  <DateInlinePicker
                    value={state.expenseDate}
                    visible={state.showDatePicker}
                    onToggle={() => actions.setShowDatePicker(!state.showDatePicker)}
                    onChange={(date) => {
                      actions.setExpenseDate(date);
                      actions.setShowDatePicker(false);
                    }}
                  />
                </Card>
              </Section>

              <Section label="Category">
                <CategorySelector value={state.category} onChange={actions.setCategory} />
              </Section>

              <Section label="Paid by">
                <PaidBySelector
                  participants={state.participants}
                  paidBy={state.paidBy}
                  currentUserId={currentUser.id}
                  onChange={actions.setPaidBy}
                />
              </Section>

              <Section label="Split method">
                <SplitMethodSelector value={state.splitMethod} onChange={actions.setSplitMethod} />
              </Section>

              <ParticipantsEditor
                participants={state.participants}
                included={state.included}
                setIncluded={actions.setIncluded}
                splitMethod={state.splitMethod}
                parsedAmount={state.parsedAmount}
                remainingCustom={state.remainingCustom}
                remainingPercent={state.remainingPercent}
                expenseCurrency={state.expenseCurrency}
                equalShare={state.equalShare}
                customAmounts={state.customAmounts}
                setCustomAmounts={actions.setCustomAmounts}
                customPercentages={state.customPercentages}
                setCustomPercentages={actions.setCustomPercentages}
                currentUserId={currentUser.id}
              />
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.actionBar,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            disabled={primaryDisabled}
            onPress={handlePrimaryPress}
            style={({ pressed }) => [
              styles.primaryButton,
              !hasSelection && styles.primaryButtonDisabled,
              pressed && !primaryDisabled && styles.primaryButtonPressed,
            ]}
          >
            {state.loading || isSubmitting ? (
              <ActivityIndicator color={color.textInverse} style={{ marginRight: 8 }} />
            ) : null}
            <Typography
              style={[styles.primaryButtonText, !hasSelection && styles.primaryButtonTextDisabled]}
            >
              {primaryLabel}
            </Typography>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
