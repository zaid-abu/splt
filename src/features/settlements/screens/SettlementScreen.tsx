import type { JSX } from "react";
import { useState, useMemo, useEffect } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Typography, Spinner } from "heroui-native";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
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
import { ScreenHeader } from "@/components/ui/native-ui";
import { formatAmount } from "@/components/ui/AmountDisplay";

const BG = "#F5F0EB";
const SURFACE = "#FFFFFF";
const BORDER = "#E8E4DF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#8A8782";
const BRAND = "#8C7A6B";
const CARD_RADIUS = 18;
const PILL_RADIUS = 999;

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

  const isGroupRoute = pathname.includes("/group/");
  const routeGroupId = isGroupRoute ? id : groupId;

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);
  const { data: combinedFriends = [] } = useFriends(currentUser?.id);

  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const { mutateAsync: addSettlement, isPending: isAddingSettlement } = useAddSettlement();

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
      (p) => p.fromUserId === currentUser.id || p.toUserId === currentUser.id
    );

    return relevantDebts.map((d) => ({
      friendId: d.fromUserId === currentUser.id ? d.toUserId : d.fromUserId,
      amount: d.amount,
      direction: (d.fromUserId === currentUser.id ? "you" : "them") as "you" | "them",
    }));
  }, [
    isGroupRoute,
    targetGroup,
    expenses,
    settlements,
    currentUser.id,
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
      setSelectedFriendId(defaultFriendId);
    }
  }, [defaultFriendId, selectedFriendId]);

  const friend =
    combinedFriends.find((f) => f.id === selectedFriendId) ||
    targetGroup?.members.find((m) => m.userId === selectedFriendId)?.user;

  const overallBalances = useMemo(() => {
    if (isGroupRoute) return new Map<string, number>();
    return balancesUtil.getUserBalances(
      currentUser.id,
      undefined,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    );
  }, [
    isGroupRoute,
    currentUser.id,
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
      if (amt !== "0.00") setAmountStr(amt);
    }
  }, [netBalance, initialAmount, amountStr]);

  const sharedGroups = useMemo(() => {
    if (!friend) return [];
    return groups.filter(
      (g) =>
        g.members.some((m) => m.userId === currentUser.id) &&
        g.members.some((m) => m.userId === friend.id)
    );
  }, [groups, currentUser.id, friend]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    routeGroupId || (sharedGroups.length === 1 ? sharedGroups[0].id : undefined)
  );

  if (!friend && (!isGroupRoute || debtOptions.length === 0)) {
    return (
      <View
        style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}
      >
        <Typography
          style={{ fontSize: 18, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_500Medium" }}
        >
          {isGroupRoute ? "All settled up!" : "Friend not found"}
        </Typography>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16, padding: 14, paddingHorizontal: 24, backgroundColor: BRAND, borderRadius: PILL_RADIUS }}
        >
          <Typography style={{ color: "#FFF", fontFamily: "IBMPlexSans_600SemiBold" }}>Go Back</Typography>
        </Pressable>
      </View>
    );
  }

  if (!friend) return <View />;

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmountStr(cleaned);
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
        fromUserId: direction === "you" ? currentUser.id : friend!.id,
        toUserId: direction === "you" ? friend!.id : currentUser.id,
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScreenHeader
        title="Settle Up"
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Direction Flow Visual */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ paddingHorizontal: 24, paddingVertical: 24 }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Animated.View
              style={{ alignItems: "center", width: 80 }}
              layout={LinearTransition.springify()}
            >
              <AppUserAvatar user={leftUser} size="lg" />
              <Typography
                style={{
                  fontSize: 13,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginTop: 8,
                  color: TEXT_PRIMARY,
                }}
              >
                {leftName}
              </Typography>
            </Animated.View>

            <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 16 }}>
              <View
                style={{
                  height: 1,
                  backgroundColor: BORDER,
                  width: "100%",
                  position: "absolute",
                  top: "50%",
                  zIndex: -1,
                }}
              />
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setDirection((prev) => (prev === "you" ? "them" : "you"));
                }}
                style={({ pressed }) => ({
                  backgroundColor: SURFACE,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: PILL_RADIUS,
                  borderWidth: 1,
                  borderColor: BORDER,
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <icons.ArrowRightLeft size={16} color={TEXT_PRIMARY} strokeWidth={2.5} />
                <Typography
                  style={{
                    fontSize: 12,
                    color: TEXT_PRIMARY,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Swap
                </Typography>
              </Pressable>
            </View>

            <Animated.View
              style={{ alignItems: "center", width: 80 }}
              layout={LinearTransition.springify()}
            >
              {isGroupRoute && debtOptions.length > 1 ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowRecipientSelector(!showRecipientSelector);
                  }}
                  style={{ alignItems: "center", opacity: showRecipientSelector ? 0.7 : 1 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <AppUserAvatar user={rightUser} size="lg" />
                    <icons.ChevronDown size={16} color={TEXT_PRIMARY} />
                  </View>
                  <Typography
                    style={{
                      fontSize: 13,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      marginTop: 8,
                      color: TEXT_PRIMARY,
                    }}
                  >
                    {rightName}
                  </Typography>
                </Pressable>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <AppUserAvatar user={rightUser} size="lg" />
                  <Typography
                    style={{
                      fontSize: 13,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      marginTop: 8,
                      color: TEXT_PRIMARY,
                    }}
                  >
                    {rightName}
                  </Typography>
                </View>
              )}
            </Animated.View>
          </View>
        </Animated.View>

        {/* Recipient Selector */}
        {showRecipientSelector && debtOptions.length > 1 && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            exiting={FadeOut.duration(200)}
            style={{ paddingHorizontal: 24, paddingBottom: 16 }}
          >
            <Typography
              style={{
                fontSize: 12,
                color: TEXT_SECONDARY,
                fontFamily: "IBMPlexSans_500Medium",
                marginBottom: 8,
              }}
            >
              Select who you are settling with
            </Typography>
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
                    style={{
                      alignItems: "center",
                      padding: 12,
                      borderWidth: 1,
                      borderRadius: CARD_RADIUS,
                      borderColor: isSelected ? BRAND : BORDER,
                      backgroundColor: isSelected ? BRAND : SURFACE,
                      opacity: isSelected ? 1 : 0.7,
                      width: 80,
                    }}
                  >
                    <AppUserAvatar user={optFriend} size="sm" />
                    <Typography
                      style={{
                        fontSize: 11,
                        fontFamily: "IBMPlexSans_600SemiBold",
                        marginTop: 8,
                        color: isSelected ? "#FFF" : TEXT_PRIMARY,
                      }}
                      numberOfLines={1}
                    >
                      {optFriend.name.split(" ")[0]}
                    </Typography>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Native Amount Input */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ alignItems: "center", marginVertical: 32, paddingHorizontal: 24 }}
        >
          <Typography
            style={{
              fontSize: 14,
              color: TEXT_SECONDARY,
              fontFamily: "IBMPlexSans_500Medium",
              marginBottom: 8,
            }}
          >
            Amount ({preferredCurrency.code})
          </Typography>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 2,
              borderBottomColor: BORDER,
              paddingBottom: 8,
              minWidth: 200,
            }}
          >
            <Typography
              style={{
                fontSize: 32,
                color: TEXT_PRIMARY,
                fontFamily: "IBMPlexSans_500Medium",
                marginRight: 8,
              }}
            >
              {preferredCurrency.symbol}
            </Typography>
            <TextInput
              value={amountStr}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={TEXT_SECONDARY}
              style={{
                fontSize: 48,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: amountStr ? TEXT_PRIMARY : TEXT_SECONDARY,
                letterSpacing: -2,
                textAlign: "center",
                minWidth: 120,
                padding: 0,
              }}
              autoFocus
            />
          </View>

          {/* Quick Amount Pills */}
          {Math.abs(netBalance) > 0 && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmountStr(Math.abs(netBalance).toFixed(2));
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: SURFACE,
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: PILL_RADIUS,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{ fontSize: 13, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
                >
                  Full: {formatAmount(Math.abs(netBalance), preferredCurrency.code)}
                </Typography>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmountStr((Math.abs(netBalance) / 2).toFixed(2));
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: SURFACE,
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: PILL_RADIUS,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{ fontSize: 13, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
                >
                  Half: {(Math.abs(netBalance) / 2).toFixed(2)}
                </Typography>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Optional Note/Group */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16, alignItems: "center" }}>
          <Pressable onPress={() => setShowOptional(!showOptional)} style={{ padding: 8 }}>
            <Typography
              style={{ fontSize: 13, color: BRAND, fontFamily: "IBMPlexSans_500Medium" }}
            >
              {showOptional ? "Hide Options" : "+ Add Note or Group"}
            </Typography>
          </Pressable>

          {showOptional && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              style={{ width: "100%", marginTop: 16, gap: 16 }}
            >
              <TextInput
                placeholder="Add a note..."
                placeholderTextColor={TEXT_SECONDARY}
                value={note}
                onChangeText={setNote}
                style={{
                  borderWidth: 1,
                  borderColor: BORDER,
                  padding: 16,
                  borderRadius: CARD_RADIUS,
                  fontSize: 15,
                  fontFamily: "IBMPlexSans_500Medium",
                  backgroundColor: SURFACE,
                }}
              />

              {sharedGroups.length > 0 && !isGroupRoute && (
                <View>
                  <Typography
                    style={{
                      fontSize: 12,
                      color: TEXT_SECONDARY,
                      fontFamily: "IBMPlexSans_500Medium",
                      marginBottom: 8,
                      marginLeft: 4,
                    }}
                  >
                    Link to Group
                  </Typography>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    <Pressable
                      onPress={() => setSelectedGroupId(undefined)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderRadius: PILL_RADIUS,
                        borderColor: !selectedGroupId ? BRAND : BORDER,
                        backgroundColor: !selectedGroupId ? BRAND : SURFACE,
                      }}
                    >
                      <Typography
                        style={{
                          fontSize: 13,
                          color: !selectedGroupId ? "#FFF" : TEXT_PRIMARY,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        None
                      </Typography>
                    </Pressable>
                    {sharedGroups.map((g) => {
                      const isSelected = selectedGroupId === g.id;
                      return (
                        <Pressable
                          key={g.id}
                          onPress={() => setSelectedGroupId(g.id)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderRadius: PILL_RADIUS,
                            borderColor: isSelected ? BRAND : BORDER,
                            backgroundColor: isSelected ? BRAND : SURFACE,
                          }}
                        >
                          <Typography
                            style={{
                              fontSize: 13,
                              color: isSelected ? "#FFF" : TEXT_PRIMARY,
                              fontFamily: "IBMPlexSans_600SemiBold",
                            }}
                          >
                            {g.name}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        <View style={{ flex: 1 }} />
      </ScrollView>

      {/* Sticky Submit Button */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 24),
          paddingTop: 12,
          backgroundColor: BG,
          borderTopWidth: 1,
          borderTopColor: BORDER,
        }}
      >
        <View
          style={{
            backgroundColor: "#F5F0EB",
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: CARD_RADIUS,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 12,
          }}
        >
          <Typography
            style={{
              fontSize: 13,
              color: TEXT_SECONDARY,
              fontFamily: "IBMPlexSans_500Medium",
              marginBottom: 4,
            }}
          >
            Recording payment
          </Typography>
          <Typography
            style={{
              fontSize: 15,
              color: TEXT_PRIMARY,
              fontFamily: "IBMPlexSans_600SemiBold",
            }}
          >
            {leftName} pays {rightName}
          </Typography>
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={isAddingSettlement || !parsedAmount}
          style={({ pressed }) => ({
            backgroundColor: BRAND,
            height: 56,
            borderRadius: PILL_RADIUS,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed || isAddingSettlement || !parsedAmount ? 0.8 : 1,
          })}
        >
          {isAddingSettlement ? (
            <Spinner color="white" size="sm" />
          ) : (
            <Typography
              style={{
                fontSize: 16,
                color: "#FFF",
                fontFamily: "IBMPlexSans_600SemiBold",
                letterSpacing: 1,
              }}
            >
              Record {preferredCurrency.symbol}
              {parsedAmount.toFixed(2)}
            </Typography>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
