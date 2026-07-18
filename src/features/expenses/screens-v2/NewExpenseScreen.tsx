import type { JSX } from "react";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Text,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

import { useUI } from "@/components/ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { CoralSelect } from "@/components/coral/CoralSelect";
import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
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
import { CURRENCIES } from "@/types";
import type { SplitMethod } from "@/types";
import type { ExpenseNewRouteParams } from "@/types/navigation";

const SPLIT_METHOD_OPTIONS = [
  { label: "Equal", value: "equal" },
  { label: "Amount", value: "custom" },
  { label: "Shares", value: "percentage" },
];

export default function NewExpenseScreenV2(): JSX.Element {
  const {
    groupId: initialGroupId,
    friendId: initialFriendId,
    expenseId,
  } = useLocalSearchParams<ExpenseNewRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const coral = useCoralColors();
  const { color } = useUI();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: friends = [] } = useFriends(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: expenseDetail } = useExpenseDetails(expenseId);
  const { mutateAsync: addExpense } = useAddExpense();
  const { mutateAsync: updateExpense } = useUpdateExpense();
  const preferredCurrency = useUIStore((state) => state.preferredCurrency);
  const setCurrency = useUIStore((state) => state.setCurrency);
  const { toast } = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const isEdit = !!state.existingExpense;

  const closeScreen = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  }, [router]);

  const handleSaveDraft = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.show({
      label: "Draft saved",
      description: "Your expense draft has been saved.",
      variant: "success",
      placement: "top",
    });
  }, [toast]);

  const handleSubmit = useCallback(async () => {
    if (!hasContext) {
      actions.setSelectionConfirmed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSubmitting(true);
    await actions.handleSubmit();
    setIsSubmitting(false);
  }, [actions, hasContext]);

  const handleReceiptPress = useCallback(() => {
    Haptics.selectionAsync();
    toast.show({
      label: "Receipt Scanner",
      description: "Receipt scanner will be available soon.",
      variant: "info",
      placement: "top",
    });
  }, [toast]);

  if (!currentUser) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: coral.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={coral.foreground} />
      </View>
    );
  }

  const currencyOptions = CURRENCIES.map((c) => ({
    label: `${c.symbol} ${c.code}`,
    value: c.code,
  }));

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar
        title={isEdit ? "Edit expense" : "Add expense"}
        onBack={closeScreen}
        rightElement={
          hasContext ? (
            <Pressable accessibilityRole="button" onPress={handleSaveDraft} hitSlop={12}>
              <Text
                style={{
                  fontFamily: "InstrumentSans_500Medium",
                  fontSize: 15,
                  color: coral.accent,
                  textDecorationLine: "underline",
                }}
              >
                Save
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 120 }}
        >
          {!hasContext ? (
            <View style={{ paddingTop: 24, gap: 20 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: coral.border,
                    overflow: "hidden",
                  }}
                >
                  <View style={{ flexDirection: "row" }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => actions.setSelectionTab("friends")}
                      style={({ pressed }) => ({
                        flex: 1,
                        height: 44,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          state.selectionTab === "friends" ? coral.foreground : "transparent",
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: "InstrumentSans_600SemiBold",
                          fontSize: 14,
                          color:
                            state.selectionTab === "friends" ? coral.surface : coral.foreground,
                        }}
                      >
                        Friends
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => actions.setSelectionTab("groups")}
                      style={({ pressed }) => ({
                        flex: 1,
                        height: 44,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          state.selectionTab === "groups" ? coral.foreground : "transparent",
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: "InstrumentSans_600SemiBold",
                          fontSize: 14,
                          color: state.selectionTab === "groups" ? coral.surface : coral.foreground,
                        }}
                      >
                        Groups
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <TextInput
                placeholder={
                  state.selectionTab === "friends" ? "Search friends..." : "Search groups..."
                }
                placeholderTextColor={coral.muted}
                value={state.searchQuery}
                onChangeText={actions.setSearchQuery}
                style={{
                  borderWidth: 1,
                  borderColor: coral.border,
                  paddingHorizontal: 15,
                  minHeight: 54,
                  borderRadius: 14,
                  fontSize: 16,
                  fontFamily: "InstrumentSans_400Regular",
                  color: coral.foreground,
                  backgroundColor: coral.surface,
                }}
              />

              <View style={{ gap: 4 }}>
                {state.selectionTab === "friends"
                  ? state.filteredFriends.map((friend) => {
                      const isSelected = state.selectedFriendIds.includes(friend.id);
                      return (
                        <Pressable
                          key={friend.id}
                          accessibilityRole="button"
                          onPress={() => {
                            Haptics.selectionAsync();
                            actions.setSelectedFriendIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== friend.id)
                                : [...prev, friend.id]
                            );
                            actions.setSelectedGroupId("");
                          }}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            gap: 12,
                            borderRadius: 16,
                            backgroundColor: isSelected ? coral.accentSoft : "transparent",
                            borderWidth: 1,
                            borderColor: isSelected ? coral.accent : "transparent",
                            opacity: pressed ? 0.7 : 1,
                            minHeight: 68,
                          })}
                        >
                          <AppUserAvatar user={friend} size="md" />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_600SemiBold",
                                fontSize: 15,
                                color: coral.foreground,
                              }}
                            >
                              {friend.name}
                            </Text>
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_400Regular",
                                fontSize: 13,
                                color: coral.muted,
                                marginTop: 2,
                              }}
                            >
                              {friend.email}
                            </Text>
                          </View>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isSelected ? coral.accent : coral.border,
                              backgroundColor: isSelected ? coral.accent : coral.surface,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isSelected && <icons.Check size={14} color={coral.inkOnAccent} />}
                          </View>
                        </Pressable>
                      );
                    })
                  : state.filteredGroups.map((group) => {
                      const isSelected = state.selectedGroupId === group.id;
                      return (
                        <Pressable
                          key={group.id}
                          accessibilityRole="button"
                          onPress={() => {
                            Haptics.selectionAsync();
                            actions.setSelectedGroupId(isSelected ? "" : group.id);
                            actions.setSelectedFriendIds([]);
                          }}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            gap: 12,
                            borderRadius: 16,
                            backgroundColor: isSelected ? coral.accentSoft : "transparent",
                            borderWidth: 1,
                            borderColor: isSelected ? coral.accent : "transparent",
                            opacity: pressed ? 0.7 : 1,
                            minHeight: 68,
                          })}
                        >
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: coral.border,
                              backgroundColor: coral.surface,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_600SemiBold",
                                fontSize: 18,
                                color: coral.foreground,
                              }}
                            >
                              {group.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_600SemiBold",
                                fontSize: 15,
                                color: coral.foreground,
                              }}
                            >
                              {group.name}
                            </Text>
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_400Regular",
                                fontSize: 13,
                                color: coral.muted,
                                marginTop: 2,
                              }}
                            >
                              {group.members.length} people
                            </Text>
                          </View>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isSelected ? coral.accent : coral.border,
                              backgroundColor: isSelected ? coral.accent : coral.surface,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isSelected && <icons.Check size={14} color={coral.inkOnAccent} />}
                          </View>
                        </Pressable>
                      );
                    })}
              </View>
            </View>
          ) : (
            <View style={{ gap: 16, paddingTop: 22 }}>
              {canChangeContext && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: coral.border,
                  }}
                >
                  {state.selectedGroup ? (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: coral.border,
                        backgroundColor: coral.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <icons.Globe size={20} color={coral.foreground} strokeWidth={1.5} />
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row" }}>
                      {state.selectedFriends.slice(0, 3).map((friend, idx) => (
                        <View
                          key={friend.id}
                          style={{
                            marginLeft: idx === 0 ? 0 : -8,
                            zIndex: state.selectedFriends.length - idx,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: coral.bg,
                          }}
                        >
                          <AppUserAvatar user={friend} size="sm" />
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 12,
                        color: coral.muted,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      {state.selectedGroup ? "Group" : "Friends"}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 17,
                        color: coral.foreground,
                        marginTop: 2,
                      }}
                    >
                      {state.selectedGroup
                        ? state.selectedGroup.name
                        : state.selectedFriends.map((f) => f.name.split(" ")[0]).join(", ")}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_400Regular",
                        fontSize: 13,
                        color: coral.muted,
                        marginTop: 2,
                      }}
                    >
                      {state.participants.length} people
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      actions.setSelectedGroupId("");
                      actions.setSelectedFriendIds([]);
                      actions.setSelectionConfirmed(false);
                    }}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14,
                      height: 38,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: coral.border,
                      backgroundColor: coral.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 13,
                        color: coral.foreground,
                      }}
                    >
                      Change
                    </Text>
                  </Pressable>
                </View>
              )}

              {(state.errors.members || state.errors.split) && (
                <View
                  style={{
                    backgroundColor: coral.negativeSoft,
                    borderWidth: 1,
                    borderColor: coral.negative,
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_500Medium",
                      fontSize: 13,
                      color: coral.negative,
                      lineHeight: 18,
                    }}
                  >
                    {state.errors.members || state.errors.split}
                  </Text>
                </View>
              )}

              <View style={{ gap: 7 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 13,
                    fontWeight: "500",
                    letterSpacing: 0.02 * 13,
                    color: coral.muted,
                  }}
                >
                  What was it?
                </Text>
                <TextInput
                  placeholder="e.g. Villa groceries"
                  placeholderTextColor={coral.muted}
                  value={state.title}
                  onChangeText={(v) => {
                    actions.setErrors((prev) => ({ ...prev, title: "" }));
                    actions.setTitle(v);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: state.errors.title ? coral.negative : coral.border,
                    paddingHorizontal: 15,
                    minHeight: 54,
                    borderRadius: 14,
                    fontSize: 16,
                    fontFamily: "InstrumentSans_400Regular",
                    color: coral.foreground,
                    backgroundColor: coral.surface,
                  }}
                />
                {state.errors.title ? (
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_400Regular",
                      fontSize: 12,
                      color: coral.negative,
                      marginLeft: 14,
                    }}
                  >
                    {state.errors.title}
                  </Text>
                ) : null}
              </View>

              <View style={{ gap: 7 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 13,
                    fontWeight: "500",
                    letterSpacing: 0.02 * 13,
                    color: coral.muted,
                  }}
                >
                  Amount
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ width: 120 }}>
                    <CoralSelect
                      options={currencyOptions}
                      value={state.expenseCurrency}
                      onValueChange={(value) => {
                        actions.setExpenseCurrency(value);
                        if (!state.selectedGroup) {
                          const curr = CURRENCIES.find((c) => c.code === value);
                          if (curr) actions.setCurrency(curr);
                        }
                      }}
                      placeholder="Currency"
                    />
                  </View>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={coral.muted}
                    value={state.amount}
                    onChangeText={(v) => {
                      actions.setErrors((prev) => ({ ...prev, amount: "" }));
                      actions.setAmount(v);
                    }}
                    keyboardType="decimal-pad"
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: state.errors.amount ? coral.negative : coral.border,
                      paddingHorizontal: 15,
                      minHeight: 54,
                      borderRadius: 14,
                      fontSize: 20,
                      fontFamily: "IBMPlexMono_600SemiBold",
                      color: coral.foreground,
                      backgroundColor: coral.surface,
                      textAlign: "right",
                    }}
                  />
                </View>
                {state.errors.amount ? (
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_400Regular",
                      fontSize: 12,
                      color: coral.negative,
                      marginLeft: 14,
                    }}
                  >
                    {state.errors.amount}
                  </Text>
                ) : null}
              </View>

              <View style={{ gap: 7 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 13,
                    fontWeight: "500",
                    letterSpacing: 0.02 * 13,
                    color: coral.muted,
                  }}
                >
                  Split method
                </Text>
                <CoralSegment
                  options={SPLIT_METHOD_OPTIONS}
                  selected={state.splitMethod}
                  onSelect={(value) => actions.setSplitMethod(value as SplitMethod)}
                />
              </View>

              <View style={{ gap: 10 }}>
                {state.participants
                  .filter((u) => state.included[u.id] !== false)
                  .map((participant) => {
                    const isPayer = state.paidBy === participant.id;
                    const isMe = participant.id === currentUser.id;
                    let shareValue = "";

                    if (state.splitMethod === "equal") {
                      shareValue = `$${state.equalShare.toFixed(2)}`;
                    } else if (state.splitMethod === "custom") {
                      shareValue = state.customAmounts[participant.id] || "";
                    } else {
                      shareValue = state.customPercentages[participant.id] || "";
                    }

                    return (
                      <Pressable
                        key={participant.id}
                        accessibilityRole="button"
                        onPress={() => {
                          Haptics.selectionAsync();
                          actions.setPaidBy(participant.id);
                        }}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          minHeight: 56,
                          borderRadius: 14,
                          backgroundColor: isPayer ? coral.accentSoft : "transparent",
                          borderWidth: isPayer ? 1 : 0,
                          borderColor: isPayer ? coral.accent : "transparent",
                          paddingHorizontal: isPayer ? 11 : 2,
                          paddingVertical: 4,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <AppUserAvatar user={participant} size="md" />
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontFamily: "InstrumentSans_600SemiBold",
                              fontSize: 16,
                              color: coral.foreground,
                              letterSpacing: -0.005 * 16,
                            }}
                          >
                            {isMe ? "You" : participant.name}
                          </Text>
                          {isPayer ? (
                            <Text
                              style={{
                                fontFamily: "InstrumentSans_400Regular",
                                fontSize: 12,
                                color: coral.muted,
                                marginTop: 2,
                              }}
                            >
                              Paying
                            </Text>
                          ) : null}
                        </View>

                        {state.splitMethod === "equal" ? (
                          <Text
                            style={{
                              fontFamily: "IBMPlexMono_600SemiBold",
                              fontSize: 15,
                              color: coral.muted,
                              letterSpacing: -0.01 * 15,
                            }}
                          >
                            {shareValue}
                          </Text>
                        ) : (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            {state.splitMethod === "custom" && (
                              <Text
                                style={{
                                  fontFamily: "IBMPlexMono_600SemiBold",
                                  fontSize: 15,
                                  color: coral.muted,
                                }}
                              >
                                {state.expenseCurrency === "USD" ? "$" : state.expenseCurrency}
                              </Text>
                            )}
                            <TextInput
                              value={shareValue}
                              onChangeText={(v) => {
                                if (state.splitMethod === "custom") {
                                  actions.setCustomAmounts((prev) => ({
                                    ...prev,
                                    [participant.id]: v.replace(/[^0-9.]/g, ""),
                                  }));
                                } else {
                                  actions.setCustomPercentages((prev) => ({
                                    ...prev,
                                    [participant.id]: v.replace(/[^0-9.]/g, ""),
                                  }));
                                }
                              }}
                              keyboardType="decimal-pad"
                              placeholder={state.splitMethod === "percentage" ? "0" : "0.00"}
                              placeholderTextColor={coral.muted}
                              style={{
                                width: 88,
                                height: 42,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: coral.border,
                                backgroundColor: coral.surface,
                                fontFamily: "IBMPlexMono_600SemiBold",
                                fontSize: 14,
                                color: coral.foreground,
                                textAlign: "right",
                                paddingHorizontal: 10,
                              }}
                            />
                            {state.splitMethod === "percentage" && (
                              <Text
                                style={{
                                  fontFamily: "IBMPlexMono_600SemiBold",
                                  fontSize: 15,
                                  color: coral.muted,
                                }}
                              >
                                %
                              </Text>
                            )}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
              </View>

              {state.splitMethod !== "equal" && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 2,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_500Medium",
                      fontSize: 13,
                      color: coral.muted,
                    }}
                  >
                    {state.splitMethod === "custom"
                      ? `Total: ${state.expenseCurrency === "USD" ? "$" : state.expenseCurrency}${state.currentCustomSum.toFixed(2)} / ${state.expenseCurrency === "USD" ? "$" : state.expenseCurrency}${state.parsedAmount.toFixed(2)}`
                      : `Total: ${state.currentPercentSum.toFixed(1)}% / 100%`}
                  </Text>
                  {state.splitMethod === "custom" && state.remainingCustom > 0.01 && (
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 13,
                        color: coral.negative,
                      }}
                    >
                      Remaining: {state.expenseCurrency === "USD" ? "$" : state.expenseCurrency}
                      {state.remainingCustom.toFixed(2)}
                    </Text>
                  )}
                  {state.splitMethod === "percentage" && state.remainingPercent > 0.01 && (
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 13,
                        color: coral.negative,
                      }}
                    >
                      Remaining: {state.remainingPercent.toFixed(1)}%
                    </Text>
                  )}
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={handleReceiptPress}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  minHeight: 96,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: coral.border,
                  borderStyle: "dashed",
                  backgroundColor: coral.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <icons.ReceiptText size={20} color={coral.muted} strokeWidth={1.5} />
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 14,
                    color: coral.muted,
                  }}
                >
                  Add a receipt
                </Text>
              </Pressable>

              <View style={{ gap: 7 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_500Medium",
                    fontSize: 13,
                    fontWeight: "500",
                    letterSpacing: 0.02 * 13,
                    color: coral.muted,
                  }}
                >
                  Add to
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => actions.setSelectionConfirmed(false)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 15,
                    minHeight: 54,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: coral.border,
                    backgroundColor: coral.surface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_400Regular",
                      fontSize: 16,
                      color: state.selectedGroup ? coral.foreground : coral.muted,
                    }}
                  >
                    {state.selectedGroup
                      ? state.selectedGroup.name
                      : state.selectedFriends.length > 0
                        ? state.selectedFriends.map((f) => f.name.split(" ")[0]).join(", ")
                        : "Select a group or friends"}
                  </Text>
                  <icons.ChevronDown size={16} color={coral.muted} />
                </Pressable>
              </View>

              <View style={{ marginTop: 8 }}>
                <CoralButton
                  label={isEdit ? "Save changes" : "Add expense"}
                  onPress={handleSubmit}
                  variant="primary"
                  disabled={state.loading || isSubmitting}
                  loading={state.loading || isSubmitting}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {!hasContext && hasSelection && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopWidth: 1,
              borderTopColor: coral.border,
              backgroundColor: coral.bg,
            }}
          >
            <CoralButton
              label="Continue"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                actions.setSelectionConfirmed(true);
              }}
              variant="primary"
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </CoralScreen>
  );
}
