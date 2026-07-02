/**
 * Add Expense Screen
 *
 * HeroUI components used:
 * - Button
 * - Card, Card.Body, Card.Title, Card.Description
 * - TextField, TextField.Label, TextField.Input, TextField.FieldError
 * - Checkbox, Checkbox.Indicator
 * - Avatar, Avatar.Fallback
 * - Chip (category + split method pills)
 * - ScrollShadow
 * - Typography
 * - Separator
 * - Alert
 */
import DateTimePicker from "react-native-ui-datepicker";
import dayjs from "dayjs";
import {
  Alert,
  Checkbox,
  PressableFeedback,
  Typography,
  Button,
  Tabs,
  Spinner,
  TextField,
  Label,
  Input,
  useToast,
  Popover,
} from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  InteractionManager,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp, FadeIn, FadeOut, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useApp } from "@/context/AppContext";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { formatAmount } from "@/components/AmountDisplay";
import { CurrencySelector } from "@/components/CurrencySelector";
import * as icons from "lucide-react-native";
import type { ExpenseCategory, SplitMethod } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";

const SPLIT_METHODS: { key: SplitMethod; label: string; desc: string }[] = [
  { key: "equal", label: "Equal", desc: "Divide equally" },
  { key: "custom", label: "Custom", desc: "Enter amounts" },
  { key: "percentage", label: "Percent", desc: "Set %" },
];

export default function AddExpenseScreen(): JSX.Element {
  const {
    groupId: initialGroupId,
    friendId: initialFriendId,
    expenseId,
  } = useLocalSearchParams<{
    groupId?: string;
    friendId?: string;
    expenseId?: string;
  }>();
  const router = useRouter();
  const {
    getGroup,
    getExpense,
    addExpense,
    updateExpense,
    currentUser,
    groups,
    preferredCurrency,
    setCurrency,
  } = useApp();

  const existingExpense = useMemo(
    () => (expenseId ? getExpense(expenseId) : undefined),
    [expenseId, getExpense]
  );
  const { toast } = useToast();

  const initialGroup = existingExpense?.groupId || initialGroupId || "";
  const initialFriends = (() => {
    if (existingExpense && !existingExpense.groupId) {
      const other = existingExpense.splits.find((s) => s.userId !== currentUser.id);
      if (other) return [other.userId];
    }
    return initialFriendId ? [initialFriendId] : [];
  })();

  const [selectedGroupId, setSelectedGroupId] = useState(initialGroup);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(initialFriends);
  const [selectionConfirmed, setSelectionConfirmed] = useState(
    !!initialGroup || initialFriends.length > 0 || !!existingExpense
  );
  const [selectionTab, setSelectionTab] = useState<"friends" | "groups">("friends");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueFriends = useMemo(() => {
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    return Array.from(new Map(allMembers.map((user) => [user.id, user])).values()).filter(
      (user) => user.id !== currentUser.id
    );
  }, [groups, currentUser.id]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const lowerQuery = searchQuery.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(lowerQuery));
  }, [groups, searchQuery]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return uniqueFriends;
    const lowerQuery = searchQuery.toLowerCase();
    return uniqueFriends.filter((f) => f.name.toLowerCase().includes(lowerQuery));
  }, [uniqueFriends, searchQuery]);

  const selectedGroup = selectedGroupId ? getGroup(selectedGroupId) : undefined;
  const selectedFriends = useMemo(() => {
    return uniqueFriends.filter((f) => selectedFriendIds.includes(f.id));
  }, [uniqueFriends, selectedFriendIds]);

  const participants = useMemo(() => {
    if (selectedGroup) {
      return selectedGroup.members.map((m) => m.user);
    }
    if (selectedFriends.length > 0) {
      return [currentUser, ...selectedFriends];
    }
    return [];
  }, [selectedGroup, selectedFriends, currentUser]);

  const [expenseCurrency, setExpenseCurrency] = useState(preferredCurrency.code);

  useEffect(() => {
    if (selectedGroup) {
      setTimeout(() => setExpenseCurrency(selectedGroup.currency), 0);
    } else {
      setTimeout(() => setExpenseCurrency(preferredCurrency.code), 0);
    }
  }, [selectedGroup, preferredCurrency.code]);

  const [title, setTitle] = useState(existingExpense?.title || "");
  const [amount, setAmount] = useState(existingExpense?.amount.toString() || "");
  const [category, setCategory] = useState<ExpenseCategory>(existingExpense?.category || "food");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(
    existingExpense?.splitMethod || "equal"
  );
  const [paidBy, setPaidBy] = useState(existingExpense?.paidBy || currentUser.id);
  const [loading, setLoading] = useState(false);
  const [expenseDate, setExpenseDate] = useState<Date>(existingExpense?.date || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [included, setIncluded] = useState<Record<string, boolean>>(() => {
    if (!existingExpense) return {};
    const map: Record<string, boolean> = {};
    existingExpense.splits.forEach((s) => {
      map[s.userId] = true;
    });
    return map;
  });

  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (existingExpense?.splitMethod !== "custom") return {};
    const map: Record<string, string> = {};
    existingExpense.splits.forEach((s) => {
      map[s.userId] = s.amount.toString();
    });
    return map;
  });

  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>(() => {
    if (existingExpense?.splitMethod !== "percentage") return {};
    const map: Record<string, string> = {};
    existingExpense.splits.forEach((s) => {
      map[s.userId] = ((s.amount / existingExpense.amount) * 100).toString();
    });
    return map;
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    setTimeout(() => setIncluded(Object.fromEntries(participants.map((u) => [u.id, true]))), 0);
  }, [participants]);

  const includedMembers = participants.filter((u) => included[u.id]);
  const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;
  const equalShare = includedMembers.length > 0 ? parsedAmount / includedMembers.length : 0;

  const currentCustomSum = includedMembers.reduce(
    (sum, u) => sum + (parseFloat(customAmounts[u.id] ?? "0") || 0),
    0
  );
  const remainingCustom = Math.max(0, parsedAmount - currentCustomSum);

  const currentPercentSum = includedMembers.reduce(
    (sum, u) => sum + (parseFloat(customPercentages[u.id] ?? "0") || 0),
    0
  );
  const remainingPercent = Math.max(0, 100 - currentPercentSum);

  async function handleSubmit(): Promise<void> {
    if (!selectedGroup && selectedFriends.length === 0) {
      toast.show({
        label: "Error",
        description: "Please select a group or friend",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    if (!title.trim()) {
      toast.show({
        label: "Error",
        description: "Please enter a title",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast.show({
        label: "Error",
        description: "Please enter a valid amount",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    if (includedMembers.length === 0) {
      toast.show({
        label: "Error",
        description: "Include at least one member",
        variant: "danger",
        placement: "top",
      });
      return;
    }

    if (splitMethod === "custom" && Math.abs(currentCustomSum - parsedAmount) > 0.01) {
      toast.show({
        label: "Error",
        description: `Custom amounts must equal exactly ${formatAmount(parsedAmount, expenseCurrency)}.`,
        variant: "danger",
        placement: "top",
      });
      return;
    }

    if (splitMethod === "percentage" && Math.abs(currentPercentSum - 100) > 0.01) {
      toast.show({
        label: "Error",
        description: "Percentages must add up to exactly 100%.",
        variant: "danger",
        placement: "top",
      });
      return;
    }

    setLoading(true);
    try {
      const splits = includedMembers.map((u) => {
        let splitAmt = equalShare;
        if (splitMethod === "custom") {
          splitAmt = parseFloat(customAmounts[u.id] ?? "0") || 0;
        } else if (splitMethod === "percentage") {
          const pct = parseFloat(customPercentages[u.id] ?? "0") || 0;
          splitAmt = (parsedAmount * pct) / 100;
        }
        return {
          userId: u.id,
          user: u,
          amount: splitAmt,
        };
      });

      if (existingExpense) {
        await updateExpense(existingExpense.id, {
          title: title.trim(),
          amount: parsedAmount,
          currency: expenseCurrency,
          category,
          paidBy,
          splits,
          splitMethod,
          date: expenseDate,
        });
      } else {
        await addExpense({
          groupId: selectedGroup?.id,
          title: title.trim(),
          amount: parsedAmount,
          currency: expenseCurrency,
          category,
          paidBy,
          splits,
          splitMethod,
          date: expenseDate,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      toast.show({
        label: "Error",
        description: e.message || "Something went wrong. Please try again.",
        variant: "danger",
        placement: "top",
      });
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F6" }} edges={["top", "bottom"]}>
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
              {existingExpense ? "Edit Expense" : "Add Expense"}
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
              {!(initialGroupId || initialFriendId) && !selectionConfirmed && (
                <Animated.View entering={FadeInDown.duration(300)} className="mb-6">
                  <Typography
                    type="body-xs"
                    className="text-muted-foreground font-bold tracking-widest mb-3 ml-8 uppercase"
                  >
                    WHO IS THIS WITH?
                  </Typography>

                  <View className="px-6 mb-4">
                    <View className="flex-row items-center bg-white rounded-[16px] border border-border/50 h-[48px] px-4">
                      <icons.Search size={20} color="#8A8798" />
                      <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search friends or groups..."
                        placeholderTextColor="#8A8798"
                        className="flex-1 ml-2 font-medium text-foreground text-[16px]"
                      />
                      {searchQuery.length > 0 && (
                        <PressableFeedback onPress={() => setSearchQuery("")} hitSlop={8}>
                          <icons.XCircle size={18} color="#8A8798" />
                        </PressableFeedback>
                      )}
                    </View>
                  </View>

                  {selectedFriends.length > 0 && (
                    <View className="px-6 mb-4">
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {selectedFriends.map((f) => (
                          <View
                            key={f.id}
                            className="flex-row items-center bg-primary/10 pl-1.5 pr-3 py-1.5 rounded-full border border-primary/20 gap-2"
                          >
                            <AppUserAvatar user={f} size="sm" />
                            <Typography type="body-sm" className="font-bold text-primary">
                              {f.name.split(" ")[0]}
                            </Typography>
                            <PressableFeedback
                              onPress={() =>
                                setSelectedFriendIds((prev) => prev.filter((id) => id !== f.id))
                              }
                            >
                              <View className="bg-white/50 rounded-full p-1 ml-1">
                                <icons.X size={12} className="text-primary" strokeWidth={3} />
                              </View>
                            </PressableFeedback>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* ── Tabs ────────────────────────── */}
                  <Tabs
                    value={selectionTab}
                    onValueChange={setSelectionTab as any}
                    variant="primary"
                    className="px-6 gap-4"
                  >
                    <Tabs.List className="w-full bg-white rounded-[16px] p-1 border border-border">
                      <Tabs.Indicator className="bg-primary rounded-[12px]" />
                      <Tabs.Trigger value="friends" className="flex-1 h-[40px]">
                        {({ isSelected }) => (
                          <Tabs.Label
                            className={`font-bold text-sm ${isSelected ? "text-white" : "text-foreground"}`}
                          >
                            Friends
                          </Tabs.Label>
                        )}
                      </Tabs.Trigger>
                      <Tabs.Trigger value="groups" className="flex-1 h-[40px]">
                        {({ isSelected }) => (
                          <Tabs.Label
                            className={`font-bold text-sm ${isSelected ? "text-white" : "text-foreground"}`}
                          >
                            Groups
                          </Tabs.Label>
                        )}
                      </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="friends">
                      <View className="rounded-[24px]">
                        <View className="bg-white rounded-[24px] overflow-hidden border border-border">
                          {filteredFriends.length > 0 ? (
                            filteredFriends.map((f, idx) => {
                              const isSelected = selectedFriendIds.includes(f.id);
                              return (
                                <PressableFeedback
                                  key={f.id}
                                  onPress={() => {
                                    setSelectedGroupId(""); // Auto-deselect group
                                    setSelectedFriendIds((prev) =>
                                      prev.includes(f.id)
                                        ? prev.filter((id) => id !== f.id)
                                        : [...prev, f.id]
                                    );
                                  }}
                                >
                                  <View
                                    className={`flex-row items-center p-4 ${idx < filteredFriends.length - 1 ? "border-b border-border/50" : ""}`}
                                  >
                                    <AppUserAvatar user={f} size="md" />
                                    <Typography
                                      type="body"
                                      className="flex-1 font-bold text-foreground ml-4"
                                    >
                                      {f.name}
                                    </Typography>
                                    <View
                                      className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted"}`}
                                    >
                                      {isSelected && (
                                        <icons.Check size={14} color="white" strokeWidth={3} />
                                      )}
                                    </View>
                                  </View>
                                </PressableFeedback>
                              );
                            })
                          ) : (
                            <View className="p-8 items-center justify-center">
                              <Typography type="body" className="text-muted-foreground text-center">
                                No friends found.
                              </Typography>
                            </View>
                          )}
                        </View>
                      </View>
                    </Tabs.Content>

                    <Tabs.Content value="groups">
                      <View className="rounded-[24px]">
                        <View className="bg-white rounded-[24px] overflow-hidden border border-border">
                          {filteredGroups.length > 0 ? (
                            filteredGroups.map((g, idx) => {
                              const GroupIcon = (icons as any)[g.icon] || icons.Users;
                              const isSelected = selectedGroupId === g.id;
                              return (
                                <PressableFeedback
                                  key={g.id}
                                  onPress={() => {
                                    setSelectedFriendIds([]); // Auto-deselect friends
                                    setSelectedGroupId((prev) => (prev === g.id ? "" : g.id));
                                  }}
                                >
                                  <View
                                    className={`flex-row items-center p-4 ${idx < filteredGroups.length - 1 ? "border-b border-border/50" : ""}`}
                                  >
                                    <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
                                      <GroupIcon size={24} className="text-primary" />
                                    </View>
                                    <Typography
                                      type="body"
                                      className="flex-1 font-bold text-foreground ml-4"
                                    >
                                      {g.name}
                                    </Typography>
                                    <View
                                      className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted"}`}
                                    >
                                      {isSelected && (
                                        <icons.Check size={14} color="white" strokeWidth={3} />
                                      )}
                                    </View>
                                  </View>
                                </PressableFeedback>
                              );
                            })
                          ) : (
                            <View className="p-8 items-center justify-center">
                              <Typography type="body" className="text-muted-foreground text-center">
                                No groups found.
                              </Typography>
                            </View>
                          )}
                        </View>
                      </View>
                    </Tabs.Content>
                  </Tabs>

                  {groups.length === 0 && uniqueFriends.length === 0 && (
                    <View className="px-6 mt-4">
                      <Alert status="default" className="rounded-[20px]">
                        <Alert.Indicator />
                        <Alert.Content>
                          <Alert.Title>No groups or friends yet</Alert.Title>
                          <Alert.Description>
                            Create a group first to add expenses.
                          </Alert.Description>
                        </Alert.Content>
                      </Alert>
                    </View>
                  )}
                </Animated.View>
              )}

              {/* ── Context pill (Selected Group/Friend) ── */}
              {(selectedGroup || selectedFriends.length > 0) &&
                selectionConfirmed &&
                !(initialGroupId || initialFriendId) && (
                  <Animated.View entering={FadeInUp.duration(300)} className="px-6 mb-6">
                    <View className="flex-row items-center justify-between bg-white rounded-[24px] p-4 border border-border">
                      <View className="flex-row items-center gap-4 flex-1 pr-2">
                        {selectedGroup ? (
                          <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
                            {(() => {
                              const GroupIcon = (icons as any)[selectedGroup.icon] || icons.Users;
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
                            {selectedGroup
                              ? selectedGroup.name
                              : selectedFriends.map((f) => f.name.split(" ")[0]).join(", ")}
                          </Typography>
                          <Typography
                            type="body-sm"
                            className="text-muted-foreground font-medium mt-0.5"
                          >
                            Currency: {expenseCurrency}
                          </Typography>
                        </View>
                      </View>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setSelectedGroupId("");
                          setSelectedFriendIds([]);
                          setSelectionConfirmed(false);
                        }}
                      >
                        Change
                      </Button>
                    </View>
                  </Animated.View>
                )}

              {((initialGroupId && selectedGroup) ||
                (initialFriendId && selectedFriends.length > 0)) && (
                <View className="px-6 mb-6">
                  <View className="flex-row items-center gap-4 bg-white rounded-[24px] p-4 border border-border">
                    {selectedGroup ? (
                      <View className="w-12 h-12 rounded-[16px] bg-primary/10 items-center justify-center">
                        {(() => {
                          const GroupIcon = (icons as any)[selectedGroup.icon] || icons.Users;
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
                        {selectedGroup ? selectedGroup.name : selectedFriends[0].name}
                      </Typography>
                      <Typography
                        type="body-sm"
                        className="text-muted-foreground font-medium mt-0.5"
                      >
                        Currency: {selectedGroup ? selectedGroup.currency : preferredCurrency.code}
                      </Typography>
                    </View>
                  </View>
                </View>
              )}

              {(selectedGroup || selectedFriends.length > 0) && selectionConfirmed && (
                <Animated.View entering={FadeInUp.duration(300).delay(100)}>
                  {/* ── Title + Amount + Currency ────────────── */}
                  <View className="px-6 mb-6 gap-5">
                    <CurrencySelector
                      label="Currency"
                      value={expenseCurrency}
                      onChange={(c) => {
                        setExpenseCurrency(c.code);
                        if (!selectedGroup) setCurrency(c);
                      }}
                    />

                    <TextField>
                      <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                        What was it for?
                      </Label>
                      <Input
                        placeholder="e.g. Dinner, Uber, Groceries…"
                        value={title}
                        onChangeText={(t) => setTitle(t)}
                        autoCapitalize="sentences"
                        className="bg-white h-[56px] rounded-[20px] px-4 border border-border text-[16px]"
                      />
                    </TextField>

                    <TextField>
                      <Label className="ml-1 tracking-widest uppercase text-muted-foreground text-[10px]">
                        Amount ({expenseCurrency})
                      </Label>
                      <Input
                        placeholder="0.00"
                        value={amount}
                        onChangeText={(t) => setAmount(t)}
                        keyboardType="decimal-pad"
                        className="bg-white h-[56px] rounded-[20px] px-4 border border-border font-black text-[20px]"
                      />
                    </TextField>

                    {/* ── Attach Receipt ───────────────────────── */}
                    <View className="flex-row items-center gap-3 mt-2">
                      <PressableFeedback className="flex-1" onPress={() => {}}>
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

                    <Popover isOpen={showDatePicker} onOpenChange={setShowDatePicker}>
                      <Popover.Trigger asChild>
                        <PressableFeedback>
                          <View className="bg-white h-[56px] rounded-[20px] px-4 border border-border flex-row items-center gap-3">
                            <icons.Calendar size={20} color="#8A8798" />
                            <Typography type="body" className="font-medium text-foreground">
                              {dayjs(expenseDate).format("MMMM D, YYYY")}
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
                            date={dayjs(expenseDate)}
                            onChange={(params: any) => {
                              if (params.date) {
                                setExpenseDate(dayjs(params.date).toDate());
                                setTimeout(() => setShowDatePicker(false), 300);
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

                  {/* ── Category ───────────────────────────── */}
                  <View className="mb-6">
                    <Typography
                      type="body-xs"
                      className="text-muted-foreground font-bold tracking-widest mb-3 ml-8 uppercase"
                    >
                      CATEGORY
                    </Typography>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
                    >
                      {EXPENSE_CATEGORIES.map((cat) => {
                        const CatIcon = (icons as any)[cat.icon] || icons.Package;
                        const isSelected = category === cat.key;
                        return (
                          <PressableFeedback
                            key={cat.key}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCategory(cat.key);
                            }}
                          >
                            <View
                              className={`flex-row items-center gap-2 px-4 h-[44px] rounded-full border-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-transparent"}`}
                            >
                              <CatIcon
                                size={18}
                                color={isSelected ? "white" : "#8A8798"}
                                strokeWidth={isSelected ? 2.5 : 2}
                              />
                              <Typography
                                type="body-sm"
                                className={`font-bold ${isSelected ? "text-white" : "text-foreground"}`}
                              >
                                {cat.label}
                              </Typography>
                            </View>
                          </PressableFeedback>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* ── Paid by ────────────────────────────── */}
                  <View className="mb-6">
                    <Typography
                      type="body-xs"
                      className="text-muted-foreground font-bold tracking-widest mb-3 ml-8 uppercase"
                    >
                      PAID BY
                    </Typography>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
                    >
                      {participants.map((u) => {
                        const isSelected = paidBy === u.id;
                        return (
                          <PressableFeedback
                            key={u.id}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setPaidBy(u.id);
                            }}
                          >
                            <View
                              className={`flex-row items-center gap-2 px-2 pr-4 h-[44px] rounded-full border-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-transparent"}`}
                            >
                              <AppUserAvatar user={u} size="sm" />
                              <Typography
                                type="body-sm"
                                className={`font-bold ${isSelected ? "text-white" : "text-foreground"}`}
                              >
                                {u.id === currentUser.id ? "You" : u.name.split(" ")[0]}
                              </Typography>
                            </View>
                          </PressableFeedback>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* ── Split method ───────────────────────── */}
                  <View className="px-6 mb-6">
                    <Typography
                      type="body-xs"
                      className="text-muted-foreground font-bold tracking-widest mb-3 ml-2 uppercase"
                    >
                      SPLIT METHOD
                    </Typography>
                    <View className="flex-row gap-3">
                      {SPLIT_METHODS.map((method) => {
                        const isSelected = splitMethod === method.key;
                        return (
                          <View key={method.key} className="flex-1">
                            <PressableFeedback
                              onPress={() => {
                                Haptics.selectionAsync();
                                setSplitMethod(method.key);
                              }}
                            >
                              <View
                                className={`h-[48px] rounded-[16px] items-center justify-center border-2 ${isSelected ? "bg-primary border-primary" : "bg-white border-transparent"}`}
                              >
                                <Typography
                                  type="body-sm"
                                  className={`font-bold ${isSelected ? "text-white" : "text-foreground"}`}
                                >
                                  {method.label}
                                </Typography>
                              </View>
                            </PressableFeedback>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* ── Participants ───────────────────────── */}
                  <View className="px-6 mb-6">
                    <View className="flex-row justify-between items-end mb-3 ml-2 mr-2">
                      <Typography
                        type="body-xs"
                        className="text-muted-foreground font-bold tracking-widest uppercase"
                      >
                        PARTICIPANTS
                      </Typography>
                      {splitMethod === "custom" && parsedAmount > 0 && (
                        <Typography
                          type="body-xs"
                          className={`font-bold ${remainingCustom === 0 ? "text-success" : "text-danger"}`}
                        >
                          Remaining: {formatAmount(remainingCustom, expenseCurrency)}
                        </Typography>
                      )}
                      {splitMethod === "percentage" && parsedAmount > 0 && (
                        <Typography
                          type="body-xs"
                          className={`font-bold ${remainingPercent === 0 ? "text-success" : "text-danger"}`}
                        >
                          Remaining: {remainingPercent.toFixed(1)}%
                        </Typography>
                      )}
                    </View>
                    <View className="bg-white rounded-[24px] overflow-hidden border border-border">
                      {participants.map((u, idx) => {
                        const isIncluded = included[u.id] ?? true;
                        return (
                          <View key={u.id}>
                            <View
                              className={`flex-row items-center gap-4 p-4 ${idx < participants.length - 1 ? "border-b border-border/50" : ""}`}
                            >
                              <Checkbox
                                isSelected={isIncluded}
                                onSelectedChange={(v) =>
                                  setIncluded((prev) => ({ ...prev, [u.id]: v }))
                                }
                              >
                                <Checkbox.Indicator />
                              </Checkbox>

                              <AppUserAvatar user={u} size="sm" />

                              <Typography type="body" className="flex-1 font-bold text-foreground">
                                {u.id === currentUser.id ? "You" : u.name}
                              </Typography>

                              {splitMethod === "equal" && isIncluded && parsedAmount > 0 && (
                                <View className="bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
                                  <Typography type="body-sm" className="font-bold text-success">
                                    {formatAmount(equalShare, expenseCurrency)}
                                  </Typography>
                                </View>
                              )}

                              {splitMethod === "custom" && isIncluded && (
                                <View className="w-[100px]">
                                  <Input
                                    placeholder="0.00"
                                    value={customAmounts[u.id] ?? ""}
                                    onChangeText={(v) =>
                                      setCustomAmounts((prev) => ({ ...prev, [u.id]: v }))
                                    }
                                    keyboardType="decimal-pad"
                                    className="bg-background h-[44px] rounded-[14px] px-3 border border-border font-bold text-[16px] text-right"
                                  />
                                </View>
                              )}

                              {splitMethod === "percentage" && isIncluded && (
                                <View className="flex-row items-center gap-2">
                                  <View className="w-[80px]">
                                    <Input
                                      placeholder="0"
                                      value={customPercentages[u.id] ?? ""}
                                      onChangeText={(v) =>
                                        setCustomPercentages((prev) => ({ ...prev, [u.id]: v }))
                                      }
                                      keyboardType="decimal-pad"
                                      className="bg-background h-[44px] rounded-[14px] px-3 border border-border font-bold text-[16px] text-right"
                                    />
                                  </View>
                                  <Typography
                                    type="body-sm"
                                    className="font-bold text-muted-foreground"
                                  >
                                    %
                                  </Typography>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Fixed Submit Button ─────────────────────────────── */}
        <View className="px-6 py-4 bg-background border-t border-border/50">
          {!selectionConfirmed ? (
            <Button
              variant="primary"
              className="w-full h-[56px] rounded-[20px]"
              isDisabled={!selectedGroup && selectedFriends.length === 0}
              onPress={() => {
                if (selectedGroupId || selectedFriendIds.length > 0) {
                  setSelectionConfirmed(true);
                }
              }}
            >
              <Button.Label className="font-bold">Continue</Button.Label>
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full h-[56px] rounded-[20px]"
              onPress={handleSubmit}
              isDisabled={loading}
            >
              {loading && <Spinner color="white" size="sm" className="mr-2" />}
              <Button.Label className="font-bold">Add Expense</Button.Label>
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
