import type { JSX } from "react";
import { useState, useMemo, useEffect } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Typography, Spinner } from "heroui-native";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  LinearTransition,
  ZoomIn,
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
import { CURRENCIES } from "@/types";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useAppToast } from "@/hooks/useAppToast";
import { ScreenHeader, UI, TYPO } from "@/components/ui/native-ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatAmount } from "@/components/ui/AmountDisplay";

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

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useUserExpenses(currentUser?.id);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useUserSettlements(
    currentUser?.id
  );
  const { data: combinedFriends = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);

  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const { mutateAsync: addSettlement, isPending: isAddingSettlement } = useAddSettlement();

  const [showSuccess, setShowSuccess] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: UI.color.bg },
        row: { flexDirection: "row", alignItems: "center" },
        center: { alignItems: "center", justifyContent: "center" },
        pillButton: {
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: UI.radius.pill,
          backgroundColor: UI.color.surface,
          borderWidth: 1,
          borderColor: UI.color.border,
        },
        pillButtonText: {
          ...TYPO.semi(13),
          color: UI.color.text,
        },
        surfaceCard: {
          backgroundColor: UI.color.surface,
          borderWidth: 1,
          borderColor: UI.color.border,
          borderRadius: UI.radius.lg,
          padding: 16,
        },
        submitButton: {
          backgroundColor: UI.color.brand,
          height: 56,
          borderRadius: UI.radius.pill,
          justifyContent: "center",
          alignItems: "center",
        },
        submitButtonText: {
          ...TYPO.semi(16),
          color: UI.color.textInverse,
          letterSpacing: 1,
        },
        brandPill: {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: UI.radius.pill,
          borderWidth: 1,
        },
        brandPillSelected: { backgroundColor: UI.color.brand, borderColor: UI.color.brand },
        brandPillDeselected: { backgroundColor: UI.color.surface, borderColor: UI.color.border },
        brandPillText: { fontFamily: "IBMPlexSans_600SemiBold", fontSize: 13 },
        brandPillTextSelected: { color: UI.color.textInverse },
        brandPillTextDeselected: { color: UI.color.text },
        avatarShell: { alignItems: "center" },
        avatarLabel: {
          ...TYPO.semi(13),
          marginTop: 8,
          color: UI.color.text,
        },
        swapButton: {
          backgroundColor: UI.color.surface,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: UI.radius.pill,
          borderWidth: 1,
          borderColor: UI.color.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        swapText: {
          ...TYPO.semi(12),
          color: UI.color.text,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        amountContainer: { alignItems: "center", marginVertical: 32, paddingHorizontal: 24 },
        amountLabel: {
          ...TYPO.medium(14),
          color: UI.color.muted,
          marginBottom: 8,
        },
        amountRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: 2,
          borderBottomColor: UI.color.border,
          paddingBottom: 8,
          minWidth: 200,
        },
        amountSymbol: {
          ...TYPO.medium(32),
          color: UI.color.text,
          marginRight: 8,
        },
        amountInput: {
          fontSize: 48,
          fontFamily: "IBMPlexSans_600SemiBold",
          color: UI.color.text,
          letterSpacing: -2,
          textAlign: "center",
          minWidth: 120,
          padding: 0,
        },
        quickAmountRow: { flexDirection: "row", gap: 12, marginTop: 24 },
        directionFlow: { paddingHorizontal: 24, paddingVertical: 24 },
        directionRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        flowLine: {
          height: 1,
          backgroundColor: UI.color.border,
          width: "100%",
          position: "absolute",
          top: "50%",
          zIndex: -1,
        },
        recipientSelector: { paddingHorizontal: 24, paddingBottom: 16 },
        recipientLabel: {
          ...TYPO.medium(12),
          color: UI.color.muted,
          marginBottom: 8,
        },
        recipientCard: {
          alignItems: "center",
          padding: 12,
          borderWidth: 1,
          borderRadius: UI.radius.lg,
          width: 80,
        },
        noteInput: {
          borderWidth: 1,
          borderColor: UI.color.border,
          padding: 16,
          borderRadius: UI.radius.lg,
          fontSize: 15,
          fontFamily: "IBMPlexSans_500Medium",
          backgroundColor: UI.color.surface,
        },
        summaryBox: {
          backgroundColor: UI.color.subtle,
          borderWidth: 1,
          borderColor: UI.color.border,
          borderRadius: UI.radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 12,
        },
        summaryLabel: {
          ...TYPO.medium(13),
          color: UI.color.muted,
          marginBottom: 4,
        },
        summaryText: { ...TYPO.semi(15), color: UI.color.text },
        stickySubmit: {
          paddingHorizontal: 24,
          paddingBottom: 24,
          paddingTop: 12,
          backgroundColor: UI.color.bg,
          borderTopWidth: 1,
          borderTopColor: UI.color.border,
        },
      }),
    []
  );

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

  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>(undefined);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);

  const effectiveFriendId = selectedFriendId ?? defaultFriendId;

  const friend =
    combinedFriends.find((f) => f.id === effectiveFriendId) ||
    targetGroup?.members.find((m) => m.userId === effectiveFriendId)?.user;

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

  const activeDebtOption = debtOptions.find((d) => d.friendId === effectiveFriendId);
  const netBalance = isGroupRoute
    ? activeDebtOption
      ? activeDebtOption.direction === "you"
        ? -activeDebtOption.amount
        : activeDebtOption.amount
      : 0
    : overallBalances.get(effectiveFriendId ?? "") || 0;

  const [direction, setDirection] = useState<"you" | "them">(
    (initialDirection as "you" | "them") || (netBalance < 0 ? "you" : "them")
  );

  const initialAmtStr = initialAmount
    ? initialAmount
    : Math.abs(netBalance) > 0
      ? Math.abs(netBalance).toFixed(2)
      : "";
  const [amountStr, setAmountStr] = useState(initialAmtStr === "0.00" ? "" : initialAmtStr);
  const [note, setNote] = useState("");
  const [showOptional, setShowOptional] = useState(false);

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

  const isLoading =
    isLoadingGroups || isLoadingExpenses || isLoadingSettlements || isLoadingFriends;

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        router.back();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: UI.color.bg, paddingTop: insets.top }}>
        <ThemedStatusBar />
        <ScreenHeader
          title="Settle Up"
          onBackPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        />
        <View style={{ padding: 24, gap: 24 }}>
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <View style={{ alignItems: "center", gap: 8 }}>
              <Skeleton width={80} height={80} radius={999} />
              <Skeleton width={60} height={14} />
            </View>
            <Skeleton width={100} height={36} radius={999} />
            <View style={{ alignItems: "center", gap: 8 }}>
              <Skeleton width={80} height={80} radius={999} />
              <Skeleton width={60} height={14} />
            </View>
          </View>
          <View style={{ alignItems: "center", gap: 12 }}>
            <Skeleton height={14} />
            <Skeleton width={200} height={48} />
          </View>
          <View>
            <Skeleton height={14} />
            <Skeleton height={56} />
          </View>
        </View>
      </View>
    );
  }

  if (!friend && (!isGroupRoute || debtOptions.length === 0)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: UI.color.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          style={{
            ...TYPO.medium(18),
            color: UI.color.text,
          }}
        >
          {isGroupRoute ? "All settled up!" : "Friend not found"}
        </Typography>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={{
            marginTop: 16,
            padding: 14,
            paddingHorizontal: 24,
            backgroundColor: UI.color.brand,
            borderRadius: UI.radius.pill,
          }}
        >
          <Typography
            style={{
              ...TYPO.semi(16),
              color: UI.color.textInverse,
            }}
          >
            Go Back
          </Typography>
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
        fromUserId: direction === "you" ? currentUser.id : friend!.id,
        toUserId: direction === "you" ? friend!.id : currentUser.id,
        amount: parsedAmount,
        currency: settlementCurrency,
        date: new Date(),
        note: note.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
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
  const settlementCurrency =
    isGroupRoute && targetGroup?.currency ? targetGroup.currency : preferredCurrency.code;
  const settlementCurrencyObj =
    CURRENCIES.find((c) => c.code === settlementCurrency) ?? preferredCurrency;

  const leftUser = isYouDirection ? currentUser : friend;
  const rightUser = isYouDirection ? friend : currentUser;
  const leftName = isYouDirection ? "You" : friend.name.split(" ")[0];
  const rightName = isYouDirection ? friend.name.split(" ")[0] : "You";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ThemedStatusBar />
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Settle Up"
          onBackPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        />
      </View>

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
                  ...TYPO.semi(13),
                  marginTop: 8,
                  color: UI.color.text,
                }}
              >
                {leftName}
              </Typography>
            </Animated.View>

            <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 16 }}>
              <View
                style={{
                  height: 1,
                  backgroundColor: UI.color.border,
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
                accessibilityRole="button"
                accessibilityLabel="Swap direction"
                style={({ pressed }) => ({
                  backgroundColor: UI.color.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: UI.radius.pill,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                })}
              >
                <icons.ArrowRightLeft size={16} color={UI.color.text} strokeWidth={2.5} />
                <Typography
                  style={{
                    ...TYPO.semi(12),
                    color: UI.color.text,
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
                  accessibilityRole="button"
                  style={{ alignItems: "center", opacity: showRecipientSelector ? 0.7 : 1 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <AppUserAvatar user={rightUser} size="lg" />
                    <icons.ChevronDown size={16} color={UI.color.text} />
                  </View>
                  <Typography
                    style={{
                      ...TYPO.semi(13),
                      marginTop: 8,
                      color: UI.color.text,
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
                      ...TYPO.semi(13),
                      marginTop: 8,
                      color: UI.color.text,
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
                ...TYPO.medium(12),
                color: UI.color.muted,
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
                    accessibilityRole="button"
                    style={{
                      alignItems: "center",
                      padding: 12,
                      borderWidth: 1,
                      borderRadius: UI.radius.lg,
                      borderColor: isSelected ? UI.color.brand : UI.color.border,
                      backgroundColor: isSelected ? UI.color.brand : UI.color.surface,
                      opacity: isSelected ? 1 : 0.7,
                      width: 80,
                    }}
                  >
                    <AppUserAvatar user={optFriend} size="sm" />
                    <Typography
                      style={{
                        ...TYPO.semi(11),
                        marginTop: 8,
                        color: isSelected ? UI.color.textInverse : UI.color.text,
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
              ...TYPO.medium(14),
              color: UI.color.muted,
              marginBottom: 8,
            }}
          >
            Amount ({settlementCurrency})
          </Typography>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 2,
              borderBottomColor: UI.color.border,
              paddingBottom: 8,
              minWidth: 200,
            }}
          >
            <Typography
              style={{
                ...TYPO.medium(32),
                color: UI.color.text,
                marginRight: 8,
              }}
            >
              {settlementCurrencyObj.symbol}
            </Typography>
            <TextInput
              value={amountStr}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={UI.color.muted}
              style={{
                fontSize: 48,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: amountStr ? UI.color.text : UI.color.muted,
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
                accessibilityRole="button"
                accessibilityLabel={`Set full amount: ${formatAmount(Math.abs(netBalance), preferredCurrency.code)}`}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: UI.color.surface,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  borderRadius: UI.radius.pill,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{
                    ...TYPO.semi(13),
                    color: UI.color.text,
                  }}
                >
                  Full: {formatAmount(Math.abs(netBalance), preferredCurrency.code)}
                </Typography>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmountStr((Math.abs(netBalance) / 2).toFixed(2));
                }}
                accessibilityRole="button"
                accessibilityLabel={`Set half amount: ${(Math.abs(netBalance) / 2).toFixed(2)}`}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: UI.color.surface,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  borderRadius: UI.radius.pill,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{
                    ...TYPO.semi(13),
                    color: UI.color.text,
                  }}
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
              style={{
                ...TYPO.medium(13),
                color: UI.color.brand,
              }}
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
                placeholderTextColor={UI.color.muted}
                value={note}
                onChangeText={setNote}
                style={{
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  padding: 16,
                  borderRadius: UI.radius.lg,
                  fontSize: 15,
                  fontFamily: "IBMPlexSans_500Medium",
                  backgroundColor: UI.color.surface,
                }}
              />

              {sharedGroups.length > 0 && !isGroupRoute && (
                <View>
                  <Typography
                    style={{
                      ...TYPO.medium(12),
                      color: UI.color.muted,
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
                        borderRadius: UI.radius.pill,
                        borderColor: !selectedGroupId ? UI.color.brand : UI.color.border,
                        backgroundColor: !selectedGroupId ? UI.color.brand : UI.color.surface,
                      }}
                    >
                      <Typography
                        style={{
                          ...TYPO.semi(13),
                          color: !selectedGroupId ? UI.color.textInverse : UI.color.text,
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
                            borderRadius: UI.radius.pill,
                            borderColor: isSelected ? UI.color.brand : UI.color.border,
                            backgroundColor: isSelected ? UI.color.brand : UI.color.surface,
                          }}
                        >
                          <Typography
                            style={{
                              ...TYPO.semi(13),
                              color: isSelected ? UI.color.textInverse : UI.color.text,
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
      {!showSuccess && (
        <View style={[styles.stickySubmit, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.summaryBox}>
            <Typography
              style={{
                ...TYPO.medium(13),
                color: UI.color.muted,
                marginBottom: 4,
              }}
            >
              Recording payment
            </Typography>
            <Typography
              style={{
                ...TYPO.semi(15),
                color: UI.color.text,
              }}
            >
              {leftName} pays {rightName}
            </Typography>
          </View>
          <Pressable
            onPress={handleSubmit}
            disabled={isAddingSettlement || !parsedAmount}
            accessibilityRole="button"
            accessibilityLabel="Record settlement"
            style={({ pressed }) => ({
              backgroundColor: UI.color.brand,
              height: 56,
              borderRadius: UI.radius.pill,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed || isAddingSettlement || !parsedAmount ? 0.8 : 1,
            })}
          >
            {isAddingSettlement ? (
              <Spinner color={UI.color.textInverse} size="sm" />
            ) : (
              <Typography
                style={{
                  ...TYPO.semi(16),
                  color: UI.color.textInverse,
                  letterSpacing: 1,
                }}
              >
                Record {settlementCurrencyObj.symbol}
                {parsedAmount.toFixed(2)}
              </Typography>
            )}
          </Pressable>
        </View>
      )}

      {/* Success Animation Overlay */}
      {showSuccess && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: UI.color.bg,
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: insets.bottom + 60,
          }}
        >
          <Animated.View entering={ZoomIn.duration(500).springify()}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: UI.color.success,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <icons.Check size={48} color={UI.color.textInverse} strokeWidth={3} />
            </View>
          </Animated.View>

          <Typography
            style={{
              ...TYPO.hero(28),
              color: UI.color.text,
              marginBottom: 8,
            }}
          >
            Settlement Recorded!
          </Typography>
          <Typography
            style={{
              ...TYPO.medium(16),
              color: UI.color.muted,
            }}
          >
            {settlementCurrencyObj.symbol}
            {parsedAmount.toFixed(2)} {direction === "you" ? "paid to" : "received from"}{" "}
            {friend.name.split(" ")[0]}
          </Typography>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}
