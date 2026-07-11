import { Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useCallback, useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { UI, SectionLabel, TYPO } from "@/components/ui/native-ui";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { Skeleton, ListRowSkeleton } from "@/components/ui/Skeleton";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useGroupDetailData } from "@/features/groups/hooks/useGroupDetailData";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { queryKeys } from "@/queries/keys";

function EmptyIconShell({ icon: Icon }: { icon: any }): JSX.Element {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: UI.radius.lg,
        backgroundColor: UI.color.control,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: UI.color.border,
      }}
    >
      <Icon size={24} color={UI.color.text} strokeWidth={1.8} />
    </View>
  );
}

export default function GroupDetailScreen(): JSX.Element {
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
  } = useGroupDetailData(id || "", currentUser?.id);

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.groupDetails(id || "") });
    setRefreshing(false);
  }, [queryClient, id]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: UI.color.bg,
        },
        screenCenter: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        },
        header: {
          paddingHorizontal: UI.space.page,
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
          color: UI.color.text,
          flexShrink: 1,
          textAlign: "center",
        },
        iconButton: {
          width: 44,
          height: 44,
          borderRadius: UI.radius.pill,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
        },
        pressed: {
          opacity: 0.65,
        },
        cardSurface: {
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
        },
        sectionPadding: {
          paddingHorizontal: UI.space.page,
          marginBottom: 32,
        },
        listCard: {
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          backgroundColor: UI.color.surface,
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
          borderRadius: UI.radius.lg,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        smallIconShell: {
          width: 52,
          height: 52,
          borderRadius: UI.radius.lg,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        textTitleBig: {
          fontSize: 18,
          color: UI.color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          marginBottom: 8,
        },
        textTitle: {
          fontSize: 16,
          color: UI.color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          marginBottom: 4,
        },
        textSubtitleCenter: {
          fontSize: 14,
          color: UI.color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          textAlign: "center",
        },
        textSemi16: {
          fontSize: 16,
          color: UI.color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
        },
        textMedium14Muted: {
          fontSize: 14,
          color: UI.color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          marginTop: 2,
        },
        textLabel: {
          fontSize: 13,
          color: UI.color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          marginBottom: 16,
        },
        whiteButtonText: {
          fontSize: 14,
          color: "#FFFFFF",
          fontFamily: "IBMPlexSans_600SemiBold",
        },
        actionButtonText: {
          fontSize: 16,
          color: "#FFFFFF",
          fontFamily: "IBMPlexSans_600SemiBold",
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
          borderRadius: UI.radius.pill,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
        },
        actionButtonPrimary: {
          flex: 1.5,
          height: 56,
          borderRadius: UI.radius.pill,
          backgroundColor: UI.color.text,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
        },
        notFoundCard: {
          alignItems: "center",
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          padding: 32,
        },
        goBackButton: {
          marginTop: 20,
          paddingVertical: 14,
          paddingHorizontal: 24,
          backgroundColor: UI.color.text,
          borderRadius: UI.radius.pill,
        },
        skeletonHeaderBlock: {
          paddingHorizontal: UI.space.page,
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
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          backgroundColor: UI.color.surface,
          padding: 24,
          alignItems: "center",
        },
        inviteButton: {
          paddingHorizontal: 20,
          minHeight: 44,
          backgroundColor: UI.color.text,
          borderRadius: UI.radius.pill,
          alignItems: "center",
          justifyContent: "center",
        },
        transactionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        },
        emptyExpensesCard: {
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          backgroundColor: UI.color.surface,
          paddingVertical: 36,
          alignItems: "center",
        },
      }),
    []
  );

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.skeletonHeaderBlock}>
          <Skeleton height={44} width={44} radius={UI.radius.pill} />
        </View>
        <View style={{ paddingHorizontal: UI.space.page, gap: 18 }}>
          <Skeleton height={170} radius={UI.radius.lg} />
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

  if (!group) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.screenCenter}>
          <View style={styles.notFoundCard}>
            <EmptyIconShell icon={icons.Frown} />
            <Typography style={styles.textTitleBig}>Group not found</Typography>
            <Typography style={styles.textSubtitleCenter}>
              This group may have been deleted.
            </Typography>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.goBackButton, pressed && { opacity: 0.75 }]}
            >
              <Typography style={styles.whiteButtonText}>Go back</Typography>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 24 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <icons.ArrowLeft size={20} color={UI.color.text} strokeWidth={1.8} />
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
          onPress={() => router.push(`/group/${group.id}/settings`)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <icons.Settings size={20} color={UI.color.text} strokeWidth={1.8} />
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
              tintColor={UI.color.text}
            />
          }
        >
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
            <SectionLabel>Group Balances</SectionLabel>
            <View style={styles.listCard}>
              {groupDebts.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.smallIconShell}>
                    <icons.Check size={24} color={UI.color.success} strokeWidth={1.8} />
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
                    ? UI.color.danger
                    : isOweMe
                      ? UI.color.success
                      : UI.color.text;

                  return (
                    <Pressable
                      key={`${debt.fromUserId}-${debt.toUserId}`}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.debtRow,
                        idx < groupDebts.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: UI.color.border,
                        },
                        pressed && { backgroundColor: UI.color.subtle },
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
                  <icons.UserPlus size={24} color={UI.color.text} strokeWidth={1.5} />
                </View>
                <Typography style={styles.textTitle}>Share this group</Typography>
                <Typography style={[styles.textSubtitleCenter, { marginBottom: 16 }]}>
                  Invite friends to join &quot;{group.name}&quot; and split expenses together.
                </Typography>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/group/${group.id}/settings`)}
                  style={({ pressed }) => [styles.inviteButton, pressed && { opacity: 0.8 }]}
                >
                  <Typography style={styles.whiteButtonText}>Add Members</Typography>
                </Pressable>
              </View>
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            style={[styles.sectionPadding, { marginBottom: 40 }]}
          >
            <View style={styles.transactionHeader}>
              <SectionLabel>Transactions</SectionLabel>
              <Typography style={styles.textLabel}>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settle up"
            onPress={() => router.push(`/group/${group.id}/settle`)}
            style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.pressed]}
          >
            <icons.Handshake size={20} color={UI.color.text} strokeWidth={1.8} />
            <Typography style={TYPO.semi(16)}>Settle Up</Typography>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add expense"
            onPress={() => router.push(`/expense/new?groupId=${group.id}`)}
            style={({ pressed }) => [styles.actionButtonPrimary, pressed && { opacity: 0.78 }]}
          >
            <icons.Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Typography style={styles.actionButtonText}>Add Expense</Typography>
          </Pressable>
        </BottomActionBar>
      </View>
    </View>
  );
}
