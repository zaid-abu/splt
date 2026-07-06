import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExpenseNewRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  InteractionManager,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useGroups } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import {
  useUserExpenses,
} from "@/features/expenses/queries/useExpenses";
import { useAddExpense, useUpdateExpense } from "@/features/expenses/mutations/useExpenseMutations";

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
import { useAppToast } from "@/hooks/useAppToast";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { BottomSheet } from "@/components/ui/BottomSheet";

export default function AddExpenseScreen(): JSX.Element {
  const {
    groupId: initialGroupId,
    friendId: initialFriendId,
    expenseId,
  } = useLocalSearchParams<ExpenseNewRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: friendsList = [] } = useFriends(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { mutateAsync: addExpense } = useAddExpense();
  const { mutateAsync: updateExpense } = useUpdateExpense();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const { toast } = useAppToast();

  const { state, actions } = useExpenseForm({
    currentUser: currentUser!,
    groups,
    friends: friendsList,
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

  if (!currentUser) return <></>;
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-row items-center justify-between px-6 pb-6"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Text variant="h2">
            {state.existingExpense ? "Edit Expense" : "Add Expense"}
          </Text>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            }}
            accessibilityRole="button"
            className="p-2 active:opacity-50"
          >
            <icons.X size={24} color="#8E8E93" strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isReady ? (
            <Spinner className="py-20" />
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

              {(state.selectedGroup || state.selectedFriends.length > 0) &&
                state.selectionConfirmed &&
                !(initialGroupId || initialFriendId) && (
                  <Animated.View
                    entering={FadeInUp.duration(300)}
                    className="px-6 mb-10"
                  >
                    <View className="flex-row items-center py-4 border-b border-border">
                      <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-12 h-12 rounded-xl bg-transparent border border-border items-center justify-center">
                          {state.selectedGroup ? (
                            <icons.Users size={24} color="#FAFAFA" strokeWidth={1.5} />
                          ) : (
                            <icons.User size={24} color="#FAFAFA" strokeWidth={1.5} />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text variant="h4" numberOfLines={1}>
                            {state.selectedGroup
                              ? state.selectedGroup.name
                              : state.selectedFriends.map((f) => f.name.split(" ")[0]).join(", ")}
                          </Text>
                          <Text variant="body-sm" color="muted" className="mt-1">
                            Currency: {state.expenseCurrency}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          actions.setSelectedGroupId("");
                          actions.setSelectedFriendIds([]);
                          actions.setSelectionConfirmed(false);
                        }}
                        className="px-4 py-2 bg-transparent border border-border rounded-xl active:opacity-50"
                      >
                        <Text variant="body-sm" weight="bold">
                          Change
                        </Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                )}

              {((initialGroupId && state.selectedGroup) ||
                (initialFriendId && state.selectedFriends.length > 0)) && (
                <View className="px-6 mb-10">
                  <View className="flex-row items-center py-4 border-b border-border">
                    <View className="w-12 h-12 rounded-xl bg-transparent border border-border items-center justify-center mr-4">
                      {state.selectedGroup ? (
                        <icons.Users size={24} color="#FAFAFA" strokeWidth={1.5} />
                      ) : (
                        <icons.User size={24} color="#FAFAFA" strokeWidth={1.5} />
                      )}
                    </View>
                    <View>
                      <Text variant="h4" numberOfLines={1}>
                        {state.selectedGroup
                          ? state.selectedGroup.name
                          : state.selectedFriends[0].name}
                      </Text>
                      <Text variant="body-sm" color="muted" className="mt-1">
                        Currency:{" "}
                        {state.selectedGroup
                          ? state.selectedGroup.currency
                          : preferredCurrency.code}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {(state.selectedGroup || state.selectedFriends.length > 0) &&
                state.selectionConfirmed && (
                  <Animated.View entering={FadeInUp.duration(300).delay(100)}>
                    <View className="px-6 mb-10 items-center">
                      <View className="flex-row items-center justify-center mb-6">
                        <Text variant="h1" color="muted" className="mr-2 mt-1">
                          {state.expenseCurrency}
                        </Text>
                        <TextInput
                          placeholder="0.00"
                          placeholderTextColor="#8E8E93"
                          value={state.amount}
                          onChangeText={actions.setAmount}
                          keyboardType="decimal-pad"
                          className="text-7xl text-foreground font-bold text-center min-w-[120px]"
                        />
                      </View>

                      <View className="w-full border-b border-border pb-4">
                        <TextInput
                          placeholder="What was it for? (e.g. Dinner, Uber)"
                          placeholderTextColor="#8E8E93"
                          value={state.title}
                          onChangeText={actions.setTitle}
                          autoCapitalize="sentences"
                          className="h-12 text-xl text-foreground font-bold text-center"
                        />
                      </View>
                    </View>

                    <View className="px-6 mb-10">
                      <View className="py-4 border-b border-border">
                        <CurrencySelector
                          label="Currency"
                          value={state.expenseCurrency}
                          onChange={(c) => {
                            actions.setExpenseCurrency(c.code);
                            if (!state.selectedGroup) actions.setCurrency(c);
                          }}
                        />
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => actions.setShowDatePicker(!state.showDatePicker)}
                        className="py-4 flex-row items-center border-b border-border active:opacity-50"
                      >
                        <icons.Calendar size={24} color="#FAFAFA" strokeWidth={1.5} />
                        <Text variant="body" weight="semibold" className="flex-1 ml-4">
                          {dayjs(state.expenseDate).format("MMMM D, YYYY")}
                        </Text>
                        <icons.ChevronRight size={20} color="#8E8E93" strokeWidth={1.5} />
                      </Pressable>

                      {state.showDatePicker && (
                        <View className="bg-surface-2 border border-border rounded-xl p-2 mt-2">
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
                              selected: { backgroundColor: "#FB923C", borderRadius: 8 },
                              today: { backgroundColor: "#26262D", borderRadius: 8 },
                              day_label: { color: "#FAFAFA", fontSize: 15 },
                              header: { paddingBottom: 12 },
                              month_selector_label: { color: "#FAFAFA", fontSize: 16 },
                              year_selector_label: { color: "#FAFAFA", fontSize: 16 },
                              weekday_label: { color: "#8E8E93" },
                            }}
                          />
                        </View>
                      )}

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {}}
                        className="py-4 flex-row items-center border-b border-border active:opacity-50"
                      >
                        <icons.Camera size={24} color="#FAFAFA" strokeWidth={1.5} />
                        <Text variant="body" weight="semibold" className="flex-1 ml-4">
                          Attach Receipt
                        </Text>
                        <icons.ChevronRight size={20} color="#8E8E93" strokeWidth={1.5} />
                      </Pressable>
                    </View>

                    <ExpenseFormSelectors
                      category={state.category}
                      setCategory={actions.setCategory}
                      paidBy={state.paidBy}
                      setPaidBy={actions.setPaidBy}
                      splitMethod={state.splitMethod}
                      setSplitMethod={actions.setSplitMethod}
                      participants={state.participants}
                      currentUserId={userId}
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
                      currentUserId={userId}
                    />
                  </Animated.View>
                )}
            </View>
          )}
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 px-6 pt-4 bg-background"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {!state.selectionConfirmed ? (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={!state.selectedGroup && state.selectedFriends.length === 0}
              onPress={() => {
                if (state.selectedGroupId || state.selectedFriendIds.length > 0) {
                  actions.setSelectionConfirmed(true);
                }
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              loading={state.loading}
              onPress={actions.handleSubmit}
            >
              {state.existingExpense ? "Save Changes" : "Add Expense"}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
