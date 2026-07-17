import { useState, useMemo } from "react";
import { usePathname } from "expo-router";
import type { SettleRouteParams } from "@/types/navigation";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import {
  useUserSettlements,
  useAddSettlement,
} from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useFriends } from "@/features/friends/queries/useFriends";
import type { User } from "@/types";
import { useUIStore } from "@/store/useUIStore";
import { CURRENCIES } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";
import * as Haptics from "expo-haptics";

interface SettlementInput {
  groupId?: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  date: Date;
  note: string;
}

export function useSettlement(
  currentUser: User | null | undefined,
  params: SettleRouteParams
) {
  const currentUserId = currentUser?.id;
  const pathname = usePathname();
  const { toast } = useAppToast();

  const isGroupRoute = pathname.includes("/group/");
  const routeGroupId = isGroupRoute ? params.id : params.groupId;

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUserId);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useUserExpenses(currentUserId);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useUserSettlements(
    currentUserId
  );
  const { data: combinedFriends = [], isLoading: isLoadingFriends } = useFriends(currentUserId);

  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const { mutateAsync: addSettlement, isPending: isAddingSettlement } = useAddSettlement();

  const targetGroup = groups.find((g) => g.id === routeGroupId);

  const debtOptions = useMemo(() => {
    if (!isGroupRoute || !targetGroup || !currentUserId) return [];

    const pairwiseDebts = targetGroup.simplifyDebts
      ? balancesUtil.getSimplifiedDebts(
          targetGroup.id,
          expenses,
          settlements,
          targetGroup,
          preferredCurrency,
          convertCurrency
        )
      : balancesUtil.getExactPairwiseDebts(
          targetGroup.id,
          expenses,
          settlements,
          targetGroup,
          preferredCurrency,
          convertCurrency
        );

    const relevantDebts = pairwiseDebts.filter(
      (p) => p.fromUserId === currentUserId || p.toUserId === currentUserId
    );

    return relevantDebts.map((d) => ({
      friendId: d.fromUserId === currentUserId ? d.toUserId : d.fromUserId,
      amount: d.amount,
      direction: (d.fromUserId === currentUserId ? "you" : "them") as "you" | "them",
    }));
  }, [
    isGroupRoute,
    targetGroup,
    expenses,
    settlements,
    currentUserId,
    preferredCurrency,
    convertCurrency,
  ]);

  const defaultFriendId = isGroupRoute
    ? debtOptions.length > 0
      ? debtOptions.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev)).friendId
      : undefined
    : params.id;

  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>(undefined);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);

  const effectiveFriendId = selectedFriendId ?? defaultFriendId;

  const friend =
    combinedFriends.find((f) => f.id === effectiveFriendId) ||
    targetGroup?.members.find((m) => m.userId === effectiveFriendId)?.user;

  const overallBalances = useMemo(() => {
    if (isGroupRoute || !currentUserId) return new Map<string, number>();
    return balancesUtil.getUserBalances(
      currentUserId,
      undefined,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    );
  }, [
    isGroupRoute,
    currentUserId,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency,
  ]);

  const activeDebtOption = debtOptions.find((d) => d.friendId === effectiveFriendId);
  const netBalance = isGroupRoute
    ? activeDebtOption
      ? activeDebtOption.direction === "you"
        ? -activeDebtOption.amount
        : activeDebtOption.amount
      : 0
    : overallBalances.get(effectiveFriendId ?? "") || 0;

  const initialDirection =
    (params.direction as "you" | "them") || (netBalance < 0 ? "you" : "them");
  const [direction, setDirection] = useState<"you" | "them">(initialDirection);

  const initialAmtStr = params.amount
    ? params.amount
    : Math.abs(netBalance) > 0
      ? Math.abs(netBalance).toFixed(2)
      : "";
  const [amountStr, setAmountStr] = useState(initialAmtStr === "0.00" ? "" : initialAmtStr);
  const [note, setNote] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const sharedGroups = useMemo(() => {
    if (!friend || !currentUserId) return [];
    return groups.filter(
      (g) =>
        g.members.some((m) => m.userId === currentUserId) &&
        g.members.some((m) => m.userId === friend.id)
    );
  }, [groups, currentUserId, friend]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    routeGroupId || (sharedGroups.length === 1 ? sharedGroups[0].id : undefined)
  );

  const isLoading =
    isLoadingGroups || isLoadingExpenses || isLoadingSettlements || isLoadingFriends;

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmountStr(cleaned);
  };

  const parsedAmount = parseFloat(amountStr) || 0;

  const isYouDirection = direction === "you";
  const settlementCurrency =
    isGroupRoute && targetGroup?.currency ? targetGroup.currency : preferredCurrency.code;
  const settlementCurrencyObj =
    CURRENCIES.find((c) => c.code === settlementCurrency) ?? preferredCurrency;

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.show({
        label: "Error",
        description: "Please enter a valid amount.",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    try {
      await addSettlement({
        groupId: selectedGroupId,
        fromUserId: direction === "you" ? currentUserId! : friend!.id,
        toUserId: direction === "you" ? friend!.id : currentUserId!,
        amount: parsedAmount,
        currency: settlementCurrency,
        date: new Date(),
        note: note.trim(),
      } as SettlementInput);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show({
        label: "Settlement Recorded",
        description: `${settlementCurrencyObj.symbol}${parsedAmount.toFixed(2)} ${direction === "you" ? "paid to" : "received from"} ${friend!.name.split(" ")[0]}`,
        variant: "success",
        placement: "top",
      });
      return true;
    } catch (e: any) {
      toast.show({
        label: "Error",
        description: e.message || "Failed to record settlement.",
        variant: "danger",
        placement: "top",
      });
      return false;
    }
  };

  return {
    currentUser,
    isGroupRoute,
    targetGroup,
    combinedFriends,
    isLoading,
    debtOptions,
    netBalance,
    sharedGroups,
    friend,
    effectiveFriendId,
    settlementCurrency,
    settlementCurrencyObj,
    selectedFriendId,
    setSelectedFriendId,
    showRecipientSelector,
    setShowRecipientSelector,
    direction,
    setDirection,
    amountStr,
    setAmountStr,
    note,
    setNote,
    showOptional,
    setShowOptional,
    selectedGroupId,
    setSelectedGroupId,
    parsedAmount,
    isYouDirection,
    handleAmountChange,
    handleSubmit,
    isAddingSettlement,
  };
}
