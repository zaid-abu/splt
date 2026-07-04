/**
 * Add Expense Screen
 *
 * Refactored in Phase 20 to separate side-effects and form state using useExpenseForm
 * and splitting the UI into smaller pure components.
 */
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import {
  Alert,
  PressableFeedback,
  Typography,
  Button,
  Spinner,
  TextField,
  Label,
  Input,
  useToast,
  Popover,
} from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExpenseNewRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, InteractionManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useGroups } from "@/features/groups/queries/useGroups";
import {
  useUserExpenses,
  useAddExpense,
  useUpdateExpense,
} from "@/features/expenses/queries/useExpenses";

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import * as icons from "lucide-react-native";
import { useExpenseForm } from "@/features/expenses/hooks/useExpenseForm";
import {
  ExpenseSelectionTabs,
  ExpenseFormParticipants,
} from "@/features/expenses/components/ExpenseFormParticipants";
import { ExpenseFormSelectors } from "@/features/expenses/components/ExpenseFormSplits";

export default function AddExpenseScreen(): JSX.Element {
  const {
    groupId: initialGroupId,
    friendId: initialFriendId,
    expenseId,
  } = useLocalSearchParams<ExpenseNewRouteParams>();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { mutateAsync: addExpense } = useAddExpense();
  const { mutateAsync: updateExpense } = useUpdateExpense();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const { toast } = useToast();

  const { state, actions } = useExpenseForm({
    currentUser,
    groups,
    expenses,
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

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ───────────────────────────────── */}
          <View className="flex-row items-center justify-between px-6 pt-4 mb-4">
            <Typography type="h3" className="font-black tracking-tight text-[28px]">
              {state.existingExpense ? "Edit Expense" : "Add Expense"}
            </Typography>
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              ✕ Cancel
            </Button>
          </View>

          {/* ── Group/Friend Selection ──────────────── */}
          {!isReady ? (
            <View className="items-center justify-center py-20 mt-10">
              <Spinner />
            </View>
          ) : (
            <View>
              {!(initialGroupId || initialFriendId) && !state.selectionConfirmed && (
                <ExpenseSelectionTabs
                  selectionTab={state.selectionTab}
                  setSelectionTab={actions.setSelectionTab}
                  searchQuery={state.searchQuery}
                  setSearchQuery={actions.setSearchQuery}
                  selectedFriendIds={state.selectedFriendIds}
                  setSelectedFriendIds={actions.setSelectedFriendIds}
                  selectedGroupId={state.selectedGroupId}
                  setSelectedGroupId={actions.setSelectedGroupId}
                  filteredFriends={state.filteredFriends}
                  filteredGroups={state.filteredGroups}
                  selectedFriends={state.selectedFriends}
                  uniqueFriends={state.uniqueFriends}
                  groups={groups}
                />
              )}

              {/* ── Context pill (Selected Group/Friend) ── */}
              {(state.selectedGroup || state.selectedFriends.length > 0) &&
                state.selectionConfirmed &&
                !(initialGroupId || initialFriendId) && (
                  <Animated.View entering={FadeInUp.duration(300)} className="px-6 mb-6">
                    <View className="flex-row items-center justify-between bg-white rounded-[24px] p-4 border border-border">
                      <View className="flex-row items-center gap-4 flex-1 pr-2">
                        {state.selectedGroup ? (
                          <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
                            {(() => {
                              const GroupIcon =
                                (icons as any)[state.selectedGroup.icon] || icons.Users;
                              return (
                                <GroupIcon size={24} className="text-primary" strokeWidth={2} />
                              );
                            })()}
                          </View>
                        ) : (
                          <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
                            <icons.Users size={24} className="text-primary" strokeWidth={2} />
                          </View>
                        )}
                        <View className="flex-1">
                          <Typography
                            type="h3"
                            className="font-bold text-[18px] text-foreground"
                            numberOfLines={1}
                          >
                            {state.selectedGroup
                              ? state.selectedGroup.name
                              : state.selectedFriends.map((f) => f.name.split(" ")[0]).join(", ")}
                          </Typography>
                          <Typography
                            type="body-sm"
                            className="text-muted-foreground font-medium mt-0.5"
                          >
                            Currency: {state.expenseCurrency}
                          </Typography>
                        </View>
                      </View>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          actions.setSelectedGroupId("");
                          actions.setSelectedFriendIds([]);
                          actions.setSelectionConfirmed(false);
                        }}
                      >
                        Change
                      </Button>
                    </View>
                  </Animated.View>
                )}

              {((initialGroupId && state.selectedGroup) ||
                (initialFriendId && state.selectedFriends.length > 0)) && (
                <View className="px-6 mb-6">
                  <View className="flex-row items-center gap-4 bg-white rounded-[24px] p-4 border border-border">
                    {state.selectedGroup ? (
                      <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
                        {(() => {
                          const GroupIcon = (icons as any)[state.selectedGroup.icon] || icons.Users;
                          return <GroupIcon size={24} className="text-primary" strokeWidth={2} />;
                        })()}
                      </View>
                    ) : (
                      <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
                        <icons.Users size={24} className="text-primary" strokeWidth={2} />
                      </View>
                    )}
                    <View>
                      <Typography type="h3" className="font-bold text-[18px] text-foreground">
                        {state.selectedGroup
                          ? state.selectedGroup.name
                          : state.selectedFriends[0].name}
                      </Typography>
                      <Typography
                        type="body-sm"
                        className="text-muted-foreground font-medium mt-0.5"
                      >
                        Currency:{" "}
                        {state.selectedGroup
                          ? state.selectedGroup.currency
                          : preferredCurrency.code}
                      </Typography>
                    </View>
                  </View>
                </View>
              )}

              {(state.selectedGroup || state.selectedFriends.length > 0) &&
                state.selectionConfirmed && (
                  <Animated.View entering={FadeInUp.duration(300).delay(100)}>
                    {/* ── Title + Amount + Currency ────────────── */}
                    <View className="px-6 mb-6 gap-5">
                      <CurrencySelector
                        label="Currency"
                        value={state.expenseCurrency}
                        onChange={(c) => {
                          actions.setExpenseCurrency(c.code);
                          if (!state.selectedGroup) actions.setCurrency(c);
                        }}
                      />

                      <TextField>
                        <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                          What was it for?
                        </Label>
                        <Input
                          placeholder="e.g. Dinner, Uber, Groceries…"
                          value={state.title}
                          onChangeText={actions.setTitle}
                          autoCapitalize="sentences"
                          className="bg-white h-[56px] rounded-[20px] px-4 border border-border text-[16px]"
                        />
                      </TextField>

                      <TextField>
                        <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                          Amount ({state.expenseCurrency})
                        </Label>
                        <Input
                          placeholder="0.00"
                          value={state.amount}
                          onChangeText={actions.setAmount}
                          keyboardType="decimal-pad"
                          className="bg-white h-[56px] rounded-[20px] px-4 border border-border font-black text-[20px]"
                        />
                      </TextField>

                      {/* ── Attach Receipt ───────────────────────── */}
                      <View className="flex-row items-center gap-3 mt-2">
                        <PressableFeedback
                          accessibilityRole="button"
                          className="flex-1"
                          onPress={() => {}}
                        >
                          <View className="h-[48px] rounded-[16px] border border-border border-dashed items-center justify-center flex-row gap-2 bg-white">
                            <icons.Camera size={18} className="text-primary" />
                            <Typography type="body-sm" className="font-bold text-foreground">
                              Attach Receipt
                            </Typography>
                          </View>
                        </PressableFeedback>
                      </View>
                    </View>

                    {/* ── Date ───────────────────────────── */}
                    <View className="px-6 mb-6">
                      <Typography
                        type="body-xs"
                        className="text-muted-foreground font-bold tracking-widest mb-3 ml-2 uppercase"
                      >
                        DATE
                      </Typography>

                      <Popover
                        isOpen={state.showDatePicker}
                        onOpenChange={actions.setShowDatePicker}
                      >
                        <Popover.Trigger asChild>
                          <PressableFeedback accessibilityRole="button">
                            <View className="bg-white h-[56px] rounded-[20px] px-4 border border-border flex-row items-center gap-3">
                              <icons.Calendar size={20} color="#8A8798" />
                              <Typography type="body" className="font-medium text-foreground">
                                {dayjs(state.expenseDate).format("MMMM D, YYYY")}
                              </Typography>
                            </View>
                          </PressableFeedback>
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Overlay />
                          <Popover.Content
                            presentation="popover"
                            placement="top"
                            width={340}
                            className="bg-white rounded-[24px] p-2 border border-border shadow-lg"
                          >
                            <Popover.Arrow fill="white" />
                            <DateTimePicker
                              mode="single"
                              date={dayjs(state.expenseDate)}
                              onChange={(params: any) => {
                                if (params.date) {
                                  actions.setExpenseDate(dayjs(params.date).toDate());
                                  setTimeout(() => actions.setShowDatePicker(false), 300);
                                }
                              }}
                              styles={{
                                selected: { backgroundColor: "#6b4eff", borderRadius: 16 },
                                today: { backgroundColor: "#f3f4f6", borderRadius: 16 },
                                day_label: { color: "#11181C", fontSize: 15 },
                                header: { paddingBottom: 12 },
                                month_selector_label: {
                                  fontWeight: "600",
                                  color: "#11181C",
                                  fontSize: 16,
                                },
                                year_selector_label: {
                                  fontWeight: "600",
                                  color: "#11181C",
                                  fontSize: 16,
                                },
                                weekday_label: { color: "#71717A", fontWeight: "500" },
                              }}
                            />
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover>
                    </View>

                    <ExpenseFormSelectors
                      category={state.category}
                      setCategory={actions.setCategory}
                      paidBy={state.paidBy}
                      setPaidBy={actions.setPaidBy}
                      splitMethod={state.splitMethod}
                      setSplitMethod={actions.setSplitMethod}
                      participants={state.participants}
                      currentUserId={currentUser.id}
                    />

                    <ExpenseFormParticipants
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
                  </Animated.View>
                )}
            </View>
          )}
        </ScrollView>

        {/* ── Fixed Submit Button ─────────────────────────────── */}
        <View className="px-6 py-4 bg-background border-t border-border/50">
          {!state.selectionConfirmed ? (
            <Button
              variant="primary"
              className="w-full h-[56px] rounded-[20px]"
              isDisabled={!state.selectedGroup && state.selectedFriends.length === 0}
              onPress={() => {
                if (state.selectedGroupId || state.selectedFriendIds.length > 0) {
                  actions.setSelectionConfirmed(true);
                }
              }}
            >
              <Button.Label className="font-bold">Continue</Button.Label>
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full h-[56px] rounded-[20px]"
              onPress={actions.handleSubmit}
              isDisabled={state.loading}
            >
              {state.loading && <Spinner color="white" size="sm" className="mr-2" />}
              <Button.Label className="font-bold">Add Expense</Button.Label>
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
