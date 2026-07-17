import { Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useCallback, useState, useMemo } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { View, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { useUI, SectionLabel, TYPO } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { Skeleton, ListRowSkeleton } from "@/components/ui/Skeleton";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroupDetailData } from "@/features/groups/hooks/useGroupDetailData";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { queryKeys } from "@/queries/keys";
import { ErrorState } from "@/components/ui/ErrorState";

function EmptyIconShell({ icon: Icon }: { icon: any }): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: radius.lg,
        backgroundColor: color.control,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <Icon size={24} color={color.text} strokeWidth={1.8} />
    </View>
  );
}

export default function GroupDetailScreen(): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const { id } = useLocalSearchParams<GroupRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const {
    group,
    expenses,
    totalExpensesInGroupCurrency,
    groupDebts,
    oweUsers,
    owedUsers,
    youOwe,
    owedToYou,
    userById,
    isLoading,
    isError,
    refetch,
  } = useGroupDetailData(id || "", currentUser?.id);

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const isAllSettled = youOwe === 0 && owedToYou === 0;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: queryKeys.groupDetails(id || "") });
    setRefreshing(false);
  }, [queryClient, id]);

  const isDark = useUIStore((s) => s.isDarkMode);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: color.bg,
        },
        screenCenter: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        },
        header: {
          paddingHorizontal: space.page,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        headerCenter: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flex: 1,
          marginHorizontal: 16,
        },
        titleText: {
          fontFamily: "Sora_600SemiBold",
          fontSize: 24,
          color: color.text,
          flexShrink: 1,
          textAlign: "center",
        },
        iconButton: {
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: color.control,
          borderWidth: 1,
          borderColor: color.border,
          alignItems: "center",
          justifyContent: "center",
        },
        pressed: {
          opacity: 0.65,
        },
        cardSurface: {
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
        },
        sectionPadding: {
          paddingHorizontal: space.page,
          marginBottom: 32,
        },
        listCard: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          backgroundColor: color.surface,
          overflow: "hidden",
        },
        emptyState: {
          paddingVertical: 32,
          alignItems: "center",
          justifyContent: "center",
        },
        iconShell: {
          width: 56,
          height: 56,
          borderRadius: radius.lg,
          backgroundColor: color.control,
          borderWidth: 1,
          borderColor: color.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        smallIconShell: {
          width: 52,
          height: 52,
          borderRadius: radius.lg,
          backgroundColor: color.control,
          borderWidth: 1,
          borderColor: color.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        textTitleBig: {
          fontSize: 18,
          color: color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          marginBottom: 8,
        },
        textTitle: {
          fontSize: 16,
          color: color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          marginBottom: 4,
        },
        textSubtitleCenter: {
          fontSize: 14,
          color: color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          textAlign: "center",
        },
        textSemi16: {
          fontSize: 16,
          color: color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
        },
        textMedium14Muted: {
          fontSize: 14,
          color: color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          marginTop: 2,
        },
        absoluteBottom: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },
        actionButtonSecondary: {
          flex: 1,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: color.control,
          borderWidth: 1,
          borderColor: color.border,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
        },
        notFoundCard: {
          alignItems: "center",
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          padding: 32,
        },
        goBackButton: {
          marginTop: 20,
          paddingVertical: 14,
          paddingHorizontal: 24,
          backgroundColor: color.text,
          borderRadius: radius.pill,
        },
        skeletonHeaderBlock: {
          paddingHorizontal: space.page,
          paddingTop: 16,
          paddingBottom: 24,
        },
        debtRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 16,
          paddingHorizontal: 20,
        },
        debtUserRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        },
        inviteCard: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          backgroundColor: color.surface,
          padding: 24,
          alignItems: "center",
        },
        transactionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        },
        emptyExpensesCard: {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          backgroundColor: color.surface,
          paddingVertical: 36,
          alignItems: "center",
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }),
    [isDark]
  );

  const memberBalances = useMemo(() => {
    const map = new Map<string, number>();
    if (!group) return map;
    group.members.forEach((m) => map.set(m.userId, 0));
    groupDebts.forEach((debt) => {
      map.set(debt.fromUserId, (map.get(debt.fromUserId) || 0) - debt.amount);
      map.set(debt.toUserId, (map.get(debt.toUserId) || 0) + debt.amount);
    });
    return map;
  }, [group, groupDebts]);

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ThemedStatusBar />
        <View style={styles.skeletonHeaderBlock}>
          <Skeleton height={44} width={44} radius={radius.pill} />
        </View>
        <View style={{ paddingHorizontal: space.page, gap: 18 }}>
          <Skeleton height={170} radius={radius.lg} />
          <View>
            <View style={{ marginBottom: 14 }}>
              <Skeleton height={18} width={120} radius={6} />
            </View>
            <View style={styles.cardSurface}>
              <ListRowSkeleton />
              <ListRowSkeleton />
              <ListRowSkeleton />
            </View>
          </View>
          <View>
            <View style={{ marginBottom: 14 }}>
              <Skeleton height={18} width={100} radius={6} />
            </View>
            <View style={styles.cardSurface}>
              <ListRowSkeleton />
              <ListRowSkeleton />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ThemedStatusBar />
        <View style={styles.screenCenter}>
          <ErrorState onRetry={() => refetch()} />
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ThemedStatusBar />
        <View style={styles.screenCenter}>
          <View style={styles.notFoundCard}>
            <EmptyIconShell icon={icons.Frown} />
            <Typography style={styles.textTitleBig}>Group not found</Typography>
            <Typography style={styles.textSubtitleCenter}>
              This group may have been deleted.
            </Typography>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                marginTop: 20,
                paddingVertical: 14,
                paddingHorizontal: 24,
                backgroundColor: color.text,
                borderRadius: radius.pill,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 14,
                  color: color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Go back
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ThemedStatusBar />

      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 24 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <icons.ArrowLeft size={20} color={color.text} strokeWidth={1.8} />
        </Pressable>

        <View style={styles.headerCenter}>
          <GroupIconBadge group={group} size="sm" />
          <Typography numberOfLines={1} style={styles.titleText}>
            {group.name}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Group settings"
          onPress={() => {
            Haptics.selectionAsync();
            router.push(`/group/${group.id}/settings`);
          }}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <icons.Settings size={20} color={color.text} strokeWidth={1.8} />
        </Pressable>
      </View>

      <FocusAwareView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={color.text}
            />
          }
        >
          {/* Member Avatars Row */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={[styles.sectionPadding, { marginBottom: 20 }]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 0,
                gap: 10,
                minHeight: 56,
                alignItems: "center",
              }}
            >
              {group.members.map((member) => {
                const isMe = member.userId === currentUser.id;
                const balance = memberBalances.get(member.userId) ?? 0;
                const hasBalance = Math.abs(balance) > 0.005;
                return (
                  <Pressable
                    key={member.userId}
                    accessibilityRole="button"
                    accessibilityLabel={isMe ? "You" : member.user.name}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/friend/${member.userId}`);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingRight: 14,
                      paddingLeft: 6,
                      paddingVertical: 6,
                      borderRadius: radius.pill,
                      backgroundColor: color.control,
                      borderWidth: 1,
                      borderColor: color.border,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <AppUserAvatar user={member.user} size="sm" />
                    <Typography
                      numberOfLines={1}
                      style={{
                        fontSize: 14,
                        color: color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {isMe ? "You" : member.user.name.split(" ")[0]}
                    </Typography>
                    {hasBalance && (
                      <Typography
                        style={{
                          fontSize: 12,
                          color: balance > 0 ? color.success : color.danger,
                          fontFamily: "IBMPlexSans_600SemiBold",
                          marginLeft: -4,
                        }}
                      >
                        {formatAmount(Math.abs(balance), group.currency)}
                      </Typography>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={styles.sectionPadding}
          >
            <BalanceCard
              youOwe={youOwe}
              owedToYou={owedToYou}
              currencyCode={group.currency}
              oweUsers={oweUsers}
              owedUsers={owedUsers}
              onOwePress={() => router.push(`/group/${group.id}/settle`)}
              onOwedPress={() => router.push(`/group/${group.id}/settle`)}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(50).springify()}
            style={[styles.sectionPadding, { marginBottom: 40 }]}
          >
            <Typography
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 14,
              }}
            >
              Group Balances
            </Typography>
            <View style={styles.listCard}>
              {groupDebts.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.smallIconShell}>
                    <icons.Check size={24} color={color.success} strokeWidth={1.8} />
                  </View>
                  <Typography style={styles.textTitle}>All settled up!</Typography>
                  <Typography style={styles.textSubtitleCenter}>No pending balances</Typography>
                </View>
              ) : (
                groupDebts.map((debt, idx) => {
                  const fromUser = group.members.find((m) => m.userId === debt.fromUserId)?.user;
                  const toUser = group.members.find((m) => m.userId === debt.toUserId)?.user;
                  if (!fromUser || !toUser) return null;

                  const isMeOwe = fromUser.id === currentUser.id;
                  const isOweMe = toUser.id === currentUser.id;
                  const amountColor = isMeOwe
                    ? color.danger
                    : isOweMe
                      ? color.success
                      : color.text;

                  return (
                    <Pressable
                      key={`${debt.fromUserId}-${debt.toUserId}`}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.debtRow,
                        idx < groupDebts.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: color.border,
                        },
                        pressed && { backgroundColor: color.subtle, opacity: 0.85 },
                      ]}
                    >
                      <View style={styles.debtUserRow}>
                        <AppUserAvatar user={fromUser} size="md" />
                        <View>
                          <Typography style={styles.textSemi16}>
                            {isMeOwe ? "You" : fromUser.name}
                          </Typography>
                          <Typography style={styles.textMedium14Muted}>
                            owes {isOweMe ? "you" : toUser.name.split(" ")[0]}
                          </Typography>
                        </View>
                      </View>
                      <Typography
                        style={{
                          fontSize: 20,
                          color: amountColor,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {formatAmount(debt.amount, group.currency)}
                      </Typography>
                    </Pressable>
                  );
                })
              )}
            </View>
          </Animated.View>

          {group.members.length < 3 && (
            <Animated.View
              entering={FadeInDown.duration(400).delay(75).springify()}
              style={[styles.sectionPadding, { marginBottom: 40 }]}
            >
              <SectionLabel>Invite Members</SectionLabel>
              <View style={styles.inviteCard}>
                <View style={styles.iconShell}>
                  <icons.UserPlus size={24} color={color.text} strokeWidth={1.5} />
                </View>
                <Typography style={styles.textTitle}>Share this group</Typography>
                <Typography style={[styles.textSubtitleCenter, { marginBottom: 16 }]}>
                  Invite friends to join &quot;{group.name}&quot; and split expenses together.
                </Typography>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/group/${group.id}/settings`);
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 20,
                    minHeight: 44,
                    backgroundColor: color.text,
                    borderRadius: radius.pill,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Typography
                    style={{
                      fontSize: 14,
                      color: color.textInverse,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    Add Members
                  </Typography>
                </Pressable>
              </View>
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            style={[styles.sectionPadding, { marginBottom: 40 }]}
          >
            <View style={styles.transactionHeader}>
              <Typography
                style={{
                  fontSize: 16,
                  color: color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Transactions
              </Typography>
              <Typography
                style={{
                  fontSize: 13,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Total: {formatAmount(totalExpensesInGroupCurrency, group.currency)}
              </Typography>
            </View>

            {expenses.length === 0 ? (
              <View style={styles.emptyExpensesCard}>
                <EmptyIconShell icon={icons.Receipt} />
                <Typography style={[styles.textTitle, { marginBottom: 8 }]}>
                  No expenses yet
                </Typography>
                <Typography style={styles.textSubtitleCenter}>
                  Add the first expense for this group
                </Typography>
              </View>
            ) : (
              <View style={styles.listCard}>
                {expenses.map((expense, idx) => {
                  const mySplit = expense.splits.find((s) => s.userId === currentUser.id);
                  const paidByUser = userById.get(expense.paidBy);
                  return (
                    <TransactionRow
                      key={expense.id}
                      expense={expense}
                      currentUserId={currentUser.id}
                      paidByUser={paidByUser}
                      myShare={mySplit?.amount ?? 0}
                      isLast={idx === expenses.length - 1}
                      onPress={() => router.push(`/expense/${expense.id}`)}
                      showAvatarBadge
                    />
                  );
                })}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </FocusAwareView>

      <View style={styles.absoluteBottom}>
        <BottomActionBar>
          {!isAllSettled && (
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/group/${group.id}/settle`);
              }}
              style={{ flex: 1, minHeight: 56 }}
            >
              <View style={styles.actionButtonSecondary}>
                <icons.Handshake size={20} color={color.ink} strokeWidth={1.8} />
                <Typography style={{ ...TYPO.semi(16), color: color.ink }}>Settle Up</Typography>
              </View>
            </PressableScale>
          )}

          <PressableScale
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/expense/new?groupId=${group.id}`);
            }}
            style={{ flex: isAllSettled ? 1 : 1.5, minHeight: 56 }}
          >
            <View
              style={{
                flex: 1,
                height: 56,
                borderRadius: radius.pill,
                backgroundColor: color.text,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 10,
              }}
            >
              <icons.Plus size={20} color={color.textInverse} strokeWidth={2.5} />
              <Typography
                style={{
                  fontSize: 16,
                  color: color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Add Expense
              </Typography>
            </View>
          </PressableScale>
        </BottomActionBar>
      </View>
    </View>
  );
}
