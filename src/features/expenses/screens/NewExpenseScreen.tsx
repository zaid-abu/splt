/**
 * Add Expense Screen
 *
 * Rewritten using Edge-to-Edge Editorial design system.
 */
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import {
  Typography,
  Spinner,
  useToast,
  Popover,
} from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExpenseNewRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, InteractionManager, Pressable, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

export default function AddExpenseScreen(): JSX.Element {
  const {
    groupId: initialGroupId,
    friendId: initialFriendId,
    expenseId,
  } = useLocalSearchParams<ExpenseNewRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Typography style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, color: TEXT_PRIMARY, lineHeight: 36 }}>
            {state.existingExpense ? "Edit Expense" : "Add Expense"}
          </Typography>
          <Pressable 
            onPress={() => router.back()} 
            accessibilityRole="button" 
            style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
          >
            <icons.X size={24} color={TEXT_SECONDARY} strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isReady ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
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
                  <Animated.View entering={FadeInUp.duration(300)} style={{ paddingHorizontal: 24, marginBottom: 40 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flex: 1 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center" }}>
                          {state.selectedGroup ? (
                            <icons.Users size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                          ) : (
                            <icons.User size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Typography numberOfLines={1} style={{ fontSize: 20, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                            {state.selectedGroup
                              ? state.selectedGroup.name
                              : state.selectedFriends.map((f) => f.name.split(" ")[0]).join(", ")}
                          </Typography>
                          <Typography style={{ fontSize: 13, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>
                            Currency: {state.expenseCurrency}
                          </Typography>
                        </View>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          actions.setSelectedGroupId("");
                          actions.setSelectedFriendIds([]);
                          actions.setSelectionConfirmed(false);
                        }}
                        style={({ pressed }) => ({ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, borderRadius: 0, opacity: pressed ? 0.5 : 1 })}
                      >
                        <Typography style={{ fontSize: 13, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                          Change
                        </Typography>
                      </Pressable>
                    </View>
                  </Animated.View>
                )}

              {/* ── Pre-selected Context Pill ── */}
              {((initialGroupId && state.selectedGroup) ||
                (initialFriendId && state.selectedFriends.length > 0)) && (
                <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
                    <View style={{ width: 48, height: 48, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                      {state.selectedGroup ? (
                        <icons.Users size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                      ) : (
                        <icons.User size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                      )}
                    </View>
                    <View>
                      <Typography numberOfLines={1} style={{ fontSize: 20, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                        {state.selectedGroup
                          ? state.selectedGroup.name
                          : state.selectedFriends[0].name}
                      </Typography>
                      <Typography style={{ fontSize: 13, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>
                        Currency: {state.selectedGroup ? state.selectedGroup.currency : preferredCurrency.code}
                      </Typography>
                    </View>
                  </View>
                </View>
              )}

              {(state.selectedGroup || state.selectedFriends.length > 0) &&
                state.selectionConfirmed && (
                  <Animated.View entering={FadeInUp.duration(300).delay(100)}>
                    
                    {/* ── Amount & Title ────────────── */}
                    <View style={{ paddingHorizontal: 24, marginBottom: 40, alignItems: "center" }}>
                      
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                        <Typography style={{ fontSize: 40, fontWeight: "800", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_800ExtraBold", marginRight: 8, marginTop: 4 }}>
                          {state.expenseCurrency}
                        </Typography>
                        <TextInput
                          placeholder="0.00"
                          placeholderTextColor={TEXT_SECONDARY}
                          value={state.amount}
                          onChangeText={actions.setAmount}
                          keyboardType="decimal-pad"
                          style={{
                            fontSize: 72,
                            fontWeight: "800",
                            color: TEXT_PRIMARY,
                            fontFamily: "PlusJakartaSans_800ExtraBold",
                            textAlign: "center",
                            minWidth: 120,
                          }}
                        />
                      </View>

                      <View style={{ width: "100%", borderBottomWidth: 1, borderBottomColor: SEPARATOR, paddingBottom: 16 }}>
                        <TextInput
                          placeholder="What was it for? (e.g. Dinner, Uber)"
                          placeholderTextColor={TEXT_SECONDARY}
                          value={state.title}
                          onChangeText={actions.setTitle}
                          autoCapitalize="sentences"
                          style={{
                            height: 48,
                            fontSize: 20,
                            color: TEXT_PRIMARY,
                            fontFamily: "PlusJakartaSans_700Bold",
                            textAlign: "center"
                          }}
                        />
                      </View>

                    </View>

                    {/* ── Currency, Date & Receipt ────────────── */}
                    <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
                        <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
                          <CurrencySelector
                            label="Currency"
                            value={state.expenseCurrency}
                            onChange={(c) => {
                              actions.setExpenseCurrency(c.code);
                              if (!state.selectedGroup) actions.setCurrency(c);
                            }}
                          />
                        </View>

                        <Popover
                          isOpen={state.showDatePicker}
                          onOpenChange={actions.setShowDatePicker}
                        >
                          <Popover.Trigger asChild>
                            <Pressable
                              accessibilityRole="button"
                              style={({ pressed }) => ({ paddingVertical: 16, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: SEPARATOR, opacity: pressed ? 0.5 : 1 })}
                            >
                              <icons.Calendar size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                              <Typography style={{ flex: 1, marginLeft: 16, fontSize: 16, color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_500Medium" }}>
                                {dayjs(state.expenseDate).format("MMMM D, YYYY")}
                              </Typography>
                              <icons.ChevronRight size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
                            </Pressable>
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Overlay />
                            <Popover.Content
                              presentation="popover"
                              placement="top"
                              width={340}
                              className="bg-[#F5F0EB] rounded-none p-2 border border-[#E8E4DF] shadow-lg"
                            >
                              <Popover.Arrow fill="#F5F0EB" />
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
                                  selected: { backgroundColor: "#8C7A6B", borderRadius: 0 },
                                  today: { backgroundColor: SEPARATOR, borderRadius: 0 },
                                  day_label: { color: TEXT_PRIMARY, fontSize: 15 },
                                  header: { paddingBottom: 12 },
                                  month_selector_label: { fontWeight: "700", color: TEXT_PRIMARY, fontSize: 16 },
                                  year_selector_label: { fontWeight: "700", color: TEXT_PRIMARY, fontSize: 16 },
                                  weekday_label: { color: TEXT_SECONDARY, fontWeight: "500" },
                                }}
                              />
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {}}
                          style={({ pressed }) => ({
                            paddingVertical: 16,
                            flexDirection: "row",
                            alignItems: "center",
                            borderBottomWidth: 1, borderBottomColor: SEPARATOR,
                            opacity: pressed ? 0.5 : 1
                          })}
                        >
                          <icons.Camera size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                          <Typography style={{ flex: 1, marginLeft: 16, fontSize: 16, color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_500Medium" }}>
                            Attach Receipt
                          </Typography>
                          <icons.ChevronRight size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
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
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            backgroundColor: BG,
          }}
        >
          {!state.selectionConfirmed ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (state.selectedGroupId || state.selectedFriendIds.length > 0) {
                  actions.setSelectionConfirmed(true);
                }
              }}
              disabled={!state.selectedGroup && state.selectedFriends.length === 0}
              style={({ pressed }) => ({
                height: 56,
                borderRadius: 0,
                backgroundColor: (!state.selectedGroup && state.selectedFriends.length === 0) ? SEPARATOR : TEXT_PRIMARY,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Typography style={{ fontSize: 16, fontWeight: "700", color: (!state.selectedGroup && state.selectedFriends.length === 0) ? TEXT_SECONDARY : "#FFFFFF", fontFamily: "PlusJakartaSans_700Bold" }}>
                Continue
              </Typography>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={actions.handleSubmit}
              disabled={state.loading}
              style={({ pressed }) => ({
                height: 56,
                borderRadius: 0,
                backgroundColor: "#8C7A6B",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                opacity: pressed || state.loading ? 0.8 : 1,
              })}
            >
              {state.loading && <Spinner color="white" size="sm" style={{ marginRight: 8 }} />}
              <Typography style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", fontFamily: "PlusJakartaSans_700Bold" }}>
                {state.existingExpense ? "Save Changes" : "Add Expense"}
              </Typography>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
