import { useState, useMemo, useEffect } from "react";
import * as Haptics from "expo-haptics";
import type { ExpenseCategory, SplitMethod, Expense, Group, User, Currency } from "@/types";
import {
  calculateEqualShare,
  calculateCustomSum,
  calculatePercentSum,
  generateSplits,
} from "@/features/expenses/utils/splits";
import { formatAmount } from "@/components/ui/AmountDisplay";

interface UseExpenseFormProps {
  currentUser: User;
  groups: Group[];
  friends: User[];
  expenses: Expense[];
  initialGroupId?: string;
  initialFriendId?: string;
  expenseId?: string;
  preferredCurrency: Currency;
  setCurrency: (c: Currency) => void;
  addExpense: (data: any) => Promise<any>;
  updateExpense: (data: any) => Promise<any>;
  router: any;
  toast: any;
}

export function useExpenseForm({
  currentUser,
  groups,
  friends,
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
}: UseExpenseFormProps) {
  const getExpense = (id: string) => expenses.find((e: any) => e.id === id);
  const getGroup = (id: string) => groups.find((g: any) => g.id === id);

  const existingExpense = useMemo(
    () => (expenseId ? getExpense(expenseId) : undefined),
    [expenseId, getExpense]
  );

  const initialGroup = existingExpense?.groupId || initialGroupId || "";
  const initialFriends = (() => {
    if (existingExpense && !existingExpense.groupId) {
      const other = existingExpense.splits.find((s: any) => s.userId !== currentUser.id);
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
    return friends.filter((user) => user.id !== currentUser.id);
  }, [friends, currentUser.id]);

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
    existingExpense.splits.forEach((s: any) => {
      map[s.userId] = true;
    });
    return map;
  });

  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (existingExpense?.splitMethod !== "custom") return {};
    const map: Record<string, string> = {};
    existingExpense.splits.forEach((s: any) => {
      map[s.userId] = s.amount.toString();
    });
    return map;
  });

  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>(() => {
    if (existingExpense?.splitMethod !== "percentage") return {};
    const map: Record<string, string> = {};
    existingExpense.splits.forEach((s: any) => {
      map[s.userId] = ((s.amount / existingExpense.amount) * 100).toString();
    });
    return map;
  });

  useEffect(() => {
    setTimeout(() => setIncluded(Object.fromEntries(participants.map((u) => [u.id, true]))), 0);
  }, [participants]);

  const includedMembers = participants.filter((u) => included[u.id]);
  const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;
  const equalShare = calculateEqualShare(includedMembers, parsedAmount);

  const currentCustomSum = calculateCustomSum(includedMembers, customAmounts);
  const remainingCustom = Math.max(0, parsedAmount - currentCustomSum);

  const currentPercentSum = calculatePercentSum(includedMembers, customPercentages);
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
      const splits = generateSplits(
        includedMembers,
        parsedAmount,
        splitMethod,
        customAmounts,
        customPercentages
      );

      if (existingExpense) {
        await updateExpense({
          id: existingExpense.id,
          updates: {
            title: title.trim(),
            amount: parsedAmount,
            currency: expenseCurrency,
            category,
            paidBy,
            splits: splits.map((s) => ({ ...s, paid: s.userId === paidBy })),
            splitMethod,
            date: expenseDate,
          },
        });
      } else {
        await addExpense({
          groupId: selectedGroup?.id,
          title: title.trim(),
          amount: parsedAmount,
          currency: expenseCurrency,
          category,
          paidBy,
          splits: splits.map((s) => ({ ...s, paid: s.userId === paidBy })),
          splitMethod,
          date: expenseDate,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
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

  return {
    state: {
      existingExpense,
      selectedGroupId,
      selectedFriendIds,
      selectionConfirmed,
      selectionTab,
      searchQuery,
      uniqueFriends,
      filteredGroups,
      filteredFriends,
      selectedGroup,
      selectedFriends,
      participants,
      expenseCurrency,
      title,
      amount,
      category,
      splitMethod,
      paidBy,
      loading,
      expenseDate,
      showDatePicker,
      included,
      customAmounts,
      customPercentages,
      includedMembers,
      parsedAmount,
      equalShare,
      currentCustomSum,
      remainingCustom,
      currentPercentSum,
      remainingPercent,
    },
    actions: {
      setSelectedGroupId,
      setSelectedFriendIds,
      setSelectionConfirmed,
      setSelectionTab,
      setSearchQuery,
      setExpenseCurrency,
      setTitle,
      setAmount,
      setCategory,
      setSplitMethod,
      setPaidBy,
      setLoading,
      setExpenseDate,
      setShowDatePicker,
      setIncluded,
      setCustomAmounts,
      setCustomPercentages,
      handleSubmit,
      setCurrency,
    },
  };
}
