import type { JSX } from "react";
import { useState, useMemo, useEffect } from "react";
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  LinearTransition,
} from "react-native-reanimated";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";

import type { SettleRouteParams } from "@/types/navigation";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import {
  useUserSettlements,
  useAddSettlement,
} from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useAppToast } from "@/hooks/useAppToast";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";

function KeypadButton({
  val,
  onPress,
  isAction = false,
}: {
  val: string | JSX.Element;
  onPress: () => void;
  isAction?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="flex-1 h-16 items-center justify-center active:bg-surface-2"
    >
      {typeof val === "string" ? (
        <Text
          variant={isAction ? "h3" : "h2"}
          weight="semibold"
        >
          {val}
        </Text>
      ) : (
        val
      )}
    </Pressable>
  );
}

export default function SettleUpScreen(): JSX.Element {
  const {
    id,
    groupId,
    amount: initialAmount,
    direction: initialDirection,
  } = useLocalSearchParams<SettleRouteParams>();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { toast } = useAppToast();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);
  const { data: combinedFriends = [] } = useFriends(currentUser?.id);

  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const { mutateAsync: addSettlement, isPending: isAddingSettlement } = useAddSettlement();

  const isGroupRoute = pathname.includes("/group/");
  const routeGroupId = isGroupRoute ? id : groupId;

  const targetGroup = groups.find((g) => g.id === routeGroupId);

  const debtOptions = useMemo(() => {
    if (!isGroupRoute || !targetGroup) return [];

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
      (p) => p.fromUserId === userId || p.toUserId === userId
    );

    return relevantDebts.map((d) => ({
      friendId: d.fromUserId === userId ? d.toUserId : d.fromUserId,
      amount: d.amount,
      direction: (d.fromUserId === userId ? "you" : "them") as "you" | "them",
    }));
  }, [
    isGroupRoute,
    targetGroup,
    expenses,
    settlements,
    userId,
    preferredCurrency,
    convertCurrency,
  ]);

  const defaultFriendId = isGroupRoute
    ? debtOptions.length > 0
      ? debtOptions.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev)).friendId
      : undefined
    : id;

  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>(defaultFriendId);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);

  useEffect(() => {
    if (!selectedFriendId && defaultFriendId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFriendId(defaultFriendId);
    }
  }, [defaultFriendId, selectedFriendId]);

  const friend =
    combinedFriends.find((f) => f.id === selectedFriendId) ||
    targetGroup?.members.find((m) => m.userId === selectedFriendId)?.user;

  const overallBalances = useMemo(() => {
    if (isGroupRoute) return new Map<string, number>();
    return balancesUtil.getUserBalances(
      userId,
      undefined,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    );
  }, [
    isGroupRoute,
    userId,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency,
  ]);

  const activeDebtOption = debtOptions.find((d) => d.friendId === selectedFriendId);
  const netBalance = isGroupRoute
    ? activeDebtOption
      ? activeDebtOption.direction === "you"
        ? -activeDebtOption.amount
        : activeDebtOption.amount
      : 0
    : overallBalances.get(selectedFriendId ?? "") || 0;

  const defaultDirection =
    (initialDirection as "you" | "them") || (netBalance < 0 ? "you" : "them");
  const [direction, setDirection] = useState<"you" | "them">(defaultDirection);

  useEffect(() => {
    if (!initialDirection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDirection(netBalance < 0 ? "you" : "them");
    }
  }, [netBalance, initialDirection]);

  const initialAmtStr = initialAmount
    ? initialAmount
    : Math.abs(netBalance) > 0
      ? Math.abs(netBalance).toFixed(2)
      : "";
  const [amountStr, setAmountStr] = useState(initialAmtStr === "0.00" ? "" : initialAmtStr);
  const [note, setNote] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  useEffect(() => {
    if (!initialAmount && amountStr === "") {
      const amt = Math.abs(netBalance).toFixed(2);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (amt !== "0.00") setAmountStr(amt);
    }
  }, [netBalance]);

  const sharedGroups = useMemo(() => {
    if (!friend) return [];
    return groups.filter(
      (g) =>
        g.members.some((m) => m.userId === userId) &&
        g.members.some((m) => m.userId === friend.id)
    );
  }, [groups, userId, friend]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    routeGroupId || (sharedGroups.length === 1 ? sharedGroups[0].id : undefined)
  );

  if (!currentUser) return <></>;

  if (!friend && (!isGroupRoute || debtOptions.length === 0)) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text variant="h4">
          {isGroupRoute ? "All settled up!" : "Friend not found"}
        </Text>
        <Button variant="primary" className="mt-4" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  if (!friend) return <View />;

  const handleKeypad = (val: string) => {
    if (val === "C") {
      setAmountStr("");
      return;
    }
    if (val === "<") {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === ".") {
      if (amountStr.includes(".")) return;
      setAmountStr((prev) => (prev ? prev + "." : "0."));
      return;
    }
    if (amountStr.includes(".")) {
      const parts = amountStr.split(".");
      if (parts[1] && parts[1].length >= 2) return;
    }
    if (amountStr === "0" && val !== ".") {
      setAmountStr(val);
      return;
    }
    setAmountStr((prev) => prev + val);
  };

  const parsedAmount = parseFloat(amountStr) || 0;

  async function handleSubmit() {
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
        fromUserId: direction === "you" ? userId : friend!.id,
        toUserId: direction === "you" ? friend!.id : userId,
        amount: parsedAmount,
        currency: preferredCurrency.code,
        date: new Date(),
        note: note.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      toast.show({
        label: "Error",
        description: e.message || "Failed to record settlement.",
        variant: "danger",
        placement: "top",
      });
    }
  }

  const isYouDirection = direction === "you";
  const leftUser = isYouDirection ? currentUser : friend;
  const rightUser = isYouDirection ? friend : currentUser;
  const leftName = isYouDirection ? "You" : friend.name.split(" ")[0];
  const rightName = isYouDirection ? friend.name.split(" ")[0] : "You";

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <View
        className="flex-row items-center justify-between px-6 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text variant="h2">Settle Up</Text>
        <Pressable onPress={() => router.back()} hitSlop={20} className="active:opacity-50">
          <icons.X size={24} color="#FAFAFA" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-6 py-6"
        >
          <View className="flex-row items-center justify-between">
            <Animated.View
              className="items-center w-20"
              layout={LinearTransition.springify()}
            >
              <AppUserAvatar user={leftUser} size="lg" />
              <Text variant="body-sm" weight="bold" className="mt-2">
                {leftName}
              </Text>
            </Animated.View>

            <View className="flex-1 items-center px-4">
              <View className="h-px bg-border w-full absolute top-1/2 -z-10" />
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setDirection((prev) => (prev === "you" ? "them" : "you"));
                }}
                className="bg-surface px-3 py-2 flex-row items-center gap-1.5 active:opacity-60"
              >
                <icons.ArrowRightLeft size={16} color="#8E8E93" strokeWidth={2.5} />
                <Text variant="body-xs" weight="bold" color="muted" className="uppercase tracking-widest">
                  Swap
                </Text>
              </Pressable>
            </View>

            <Animated.View
              className="items-center w-20"
              layout={LinearTransition.springify()}
            >
              {isGroupRoute && debtOptions.length > 1 ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowRecipientSelector(!showRecipientSelector);
                  }}
                  className="items-center active:opacity-70"
                >
                  <View className="flex-row items-center gap-1">
                    <AppUserAvatar user={rightUser} size="lg" />
                    <icons.ChevronDown size={16} color="#FAFAFA" />
                  </View>
                  <Text variant="body-sm" weight="bold" className="mt-2">
                    {rightName}
                  </Text>
                </Pressable>
              ) : (
                <View className="items-center">
                  <AppUserAvatar user={rightUser} size="lg" />
                  <Text variant="body-sm" weight="bold" className="mt-2">
                    {rightName}
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>
        </Animated.View>

        {showRecipientSelector && debtOptions.length > 1 && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            exiting={FadeOut.duration(200)}
            className="px-6 pb-4"
          >
            <Text variant="body-xs" color="muted" weight="semibold" className="mb-2">
              Select who you are settling with
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {debtOptions.map((opt) => {
                const optFriend =
                  combinedFriends.find((f) => f.id === opt.friendId) ||
                  targetGroup?.members.find((m) => m.userId === opt.friendId)?.user;
                if (!optFriend) return null;
                const isSelected = selectedFriendId === opt.friendId;
                return (
                  <Pressable
                    key={opt.friendId}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedFriendId(opt.friendId);
                      setShowRecipientSelector(false);
                      setAmountStr(opt.amount.toFixed(2));
                    }}
                    className={`items-center p-3 w-20 border rounded-xl ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border bg-surface"
                    } active:opacity-70`}
                  >
                    <AppUserAvatar user={optFriend} size="sm" />
                    <Text
                      variant="body-xs"
                      weight="bold"
                      color={isSelected ? "foreground" : "foreground"}
                      className="mt-2"
                      numberOfLines={1}
                    >
                      {optFriend.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.duration(400)}
          className="items-center my-8"
        >
          <Text variant="body-sm" color="muted" weight="semibold" className="mb-2">
            Amount ({preferredCurrency.code})
          </Text>
          <Text
            className="text-[64px] font-bold text-foreground tracking-tight leading-[72px]"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {amountStr || "0"}
          </Text>

          {Math.abs(netBalance) > 0 && (
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmountStr(Math.abs(netBalance).toFixed(2));
                }}
                className="px-4 py-2 border border-border rounded-xl active:opacity-70"
              >
                <Text variant="body-sm" weight="bold">
                  Full: {Math.abs(netBalance).toFixed(2)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmountStr((Math.abs(netBalance) / 2).toFixed(2));
                }}
                className="px-4 py-2 border border-border rounded-xl active:opacity-70"
              >
                <Text variant="body-sm" weight="bold">
                  Half: {(Math.abs(netBalance) / 2).toFixed(2)}
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        <View className="px-6 mb-4 items-center">
          <Pressable onPress={() => setShowOptional(!showOptional)} className="p-2">
            <Text variant="body-sm" weight="semibold" color="primary">
              {showOptional ? "Hide Options" : "+ Add Note or Group"}
            </Text>
          </Pressable>

          {showOptional && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              className="w-full mt-4 gap-4"
            >
              <TextInput
                placeholder="Add a note..."
                placeholderTextColor="#8E8E93"
                value={note}
                onChangeText={setNote}
                className="border border-border p-4 rounded-xl text-base font-semibold bg-surface text-foreground"
              />

              {sharedGroups.length > 0 && !isGroupRoute && (
                <View>
                  <Text variant="body-xs" color="muted" weight="semibold" className="mb-2 ml-1">
                    Link to Group
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    <Pressable
                      onPress={() => setSelectedGroupId(undefined)}
                      className={`px-4 py-2.5 border rounded-xl ${
                        !selectedGroupId
                          ? "border-primary bg-primary"
                          : "border-border bg-surface"
                      } active:opacity-70`}
                    >
                      <Text variant="body-sm" weight="bold" color={!selectedGroupId ? "foreground" : "foreground"}>
                        None
                      </Text>
                    </Pressable>
                    {sharedGroups.map((g) => {
                      const isSelected = selectedGroupId === g.id;
                      return (
                        <Pressable
                          key={g.id}
                          onPress={() => setSelectedGroupId(g.id)}
                          className={`px-4 py-2.5 border rounded-xl ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-border bg-surface"
                          } active:opacity-70`}
                        >
                          <Text variant="body-sm" weight="bold">
                            {g.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        <View className="flex-1" />

        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          className="bg-surface border-t border-border"
        >
          <View className="flex-row">
            <KeypadButton val="1" onPress={() => handleKeypad("1")} />
            <KeypadButton val="2" onPress={() => handleKeypad("2")} />
            <KeypadButton val="3" onPress={() => handleKeypad("3")} />
          </View>
          <View className="flex-row">
            <KeypadButton val="4" onPress={() => handleKeypad("4")} />
            <KeypadButton val="5" onPress={() => handleKeypad("5")} />
            <KeypadButton val="6" onPress={() => handleKeypad("6")} />
          </View>
          <View className="flex-row">
            <KeypadButton val="7" onPress={() => handleKeypad("7")} />
            <KeypadButton val="8" onPress={() => handleKeypad("8")} />
            <KeypadButton val="9" onPress={() => handleKeypad("9")} />
          </View>
          <View className="flex-row">
            <KeypadButton val="." onPress={() => handleKeypad(".")} />
            <KeypadButton val="0" onPress={() => handleKeypad("0")} />
            <KeypadButton
              val={<icons.Delete size={24} color="#FAFAFA" />}
              onPress={() => handleKeypad("<")}
            />
          </View>
        </Animated.View>

        <View className="bg-surface" style={{ paddingBottom: insets.bottom }}>
          <Pressable
            onPress={handleSubmit}
            disabled={isAddingSettlement}
            className={`bg-primary h-16 justify-center items-center active:opacity-80 ${
              isAddingSettlement ? "opacity-80" : ""
            }`}
          >
            {isAddingSettlement ? (
              <Spinner size="sm" className="py-0" />
            ) : (
              <Text variant="h4" color="foreground" className="tracking-widest">
                PAY {preferredCurrency.symbol}
                {parsedAmount.toFixed(2)}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
