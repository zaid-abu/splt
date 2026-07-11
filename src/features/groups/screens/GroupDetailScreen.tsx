import { Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { UI, SectionLabel, TYPO } from "@/components/ui/native-ui";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useGroupDetailData } from "@/features/groups/hooks/useGroupDetailData";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";

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
  } = useGroupDetailData(id || "", currentUser?.id);

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: UI.color.bg, paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View
            style={{
              alignItems: "center",
              backgroundColor: UI.color.surface,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              padding: 32,
            }}
          >
            <EmptyIconShell icon={icons.Frown} />
            <Typography
              style={{
                fontSize: 18,
                color: UI.color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              Group not found
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
              }}
            >
              This group may have been deleted.
            </Typography>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                marginTop: 20,
                paddingVertical: 14,
                paddingHorizontal: 24,
                backgroundColor: UI.color.text,
                borderRadius: UI.radius.pill,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Typography
                style={{ color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold", fontSize: 15 }}
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
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 24,
          paddingHorizontal: UI.space.page,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: UI.radius.pill,
            backgroundColor: UI.color.control,
            borderWidth: 1,
            borderColor: UI.color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={UI.color.text} strokeWidth={1.8} />
        </Pressable>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            flex: 1,
            marginHorizontal: 16,
          }}
        >
          <GroupIconBadge group={group} size="sm" />
          <Typography
            numberOfLines={1}
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 24,
              color: UI.color.text,
              flexShrink: 1,
              textAlign: "center",
            }}
          >
            {group.name}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Group settings"
          onPress={() => router.push(`/group/${group.id}/settings`)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: UI.radius.pill,
            backgroundColor: UI.color.control,
            borderWidth: 1,
            borderColor: UI.color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.Settings size={20} color={UI.color.text} strokeWidth={1.8} />
        </Pressable>
      </View>

      <FocusAwareView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={{ paddingHorizontal: UI.space.page, marginBottom: 32 }}
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
          style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}
        >
          <SectionLabel>Group Balances</SectionLabel>
          <View
            style={{
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              backgroundColor: UI.color.surface,
              overflow: "hidden",
            }}
          >
            {groupDebts.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: UI.radius.lg,
                    backgroundColor: UI.color.control,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <icons.Check size={24} color={UI.color.success} strokeWidth={1.8} />
                </View>
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  All settled up!
                </Typography>
                <Typography
                  style={{
                    fontSize: 14,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                    marginTop: 4,
                  }}
                >
                  No pending balances
                </Typography>
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
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderBottomWidth: idx < groupDebts.length - 1 ? 1 : 0,
                      borderBottomColor: UI.color.border,
                      backgroundColor: pressed ? UI.color.subtle : "transparent",
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                      <AppUserAvatar user={fromUser} size="md" />
                      <View>
                        <Typography
                          style={{
                            fontSize: 16,
                            color: UI.color.text,
                            fontFamily: "IBMPlexSans_600SemiBold",
                          }}
                        >
                          {isMeOwe ? "You" : fromUser.name}
                        </Typography>
                        <Typography
                          style={{
                            fontSize: 14,
                            color: UI.color.muted,
                            fontFamily: "IBMPlexSans_500Medium",
                            marginTop: 2,
                          }}
                        >
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
            style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}
          >
            <SectionLabel>Invite Members</SectionLabel>
            <View
              style={{
                borderRadius: UI.radius.lg,
                borderWidth: 1,
                borderColor: UI.color.border,
                backgroundColor: UI.color.surface,
                padding: 24,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: UI.radius.lg,
                  backgroundColor: UI.color.control,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <icons.UserPlus size={24} color={UI.color.text} strokeWidth={1.5} />
              </View>
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginBottom: 4,
                }}
              >
                Share this group
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: UI.color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Invite friends to join &quot;{group.name}&quot; and split expenses together.
              </Typography>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/group/${group.id}/settings`)}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  minHeight: 44,
                  backgroundColor: UI.color.text,
                  borderRadius: UI.radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 14,
                    color: "#FFFFFF",
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
          style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <SectionLabel>Transactions</SectionLabel>
            <Typography
              style={{
                fontSize: 13,
                color: UI.color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 16,
              }}
            >
              Total: {formatAmount(totalExpensesInGroupCurrency, group.currency)}
            </Typography>
          </View>

          {expenses.length === 0 ? (
            <View
              style={{
                borderRadius: UI.radius.lg,
                borderWidth: 1,
                borderColor: UI.color.border,
                backgroundColor: UI.color.surface,
                paddingVertical: 36,
                alignItems: "center",
              }}
            >
              <EmptyIconShell icon={icons.Receipt} />
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginBottom: 8,
                }}
              >
                No expenses yet
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: UI.color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                  textAlign: "center",
                }}
              >
                Add the first expense for this group
              </Typography>
            </View>
          ) : (
            <View
              style={{
                borderRadius: UI.radius.lg,
                borderWidth: 1,
                borderColor: UI.color.border,
                backgroundColor: UI.color.surface,
                overflow: "hidden",
              }}
            >
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

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <BottomActionBar>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settle up"
          onPress={() => router.push(`/group/${group.id}/settle`)}
          style={({ pressed }) => ({
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
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.Handshake size={20} color={UI.color.text} strokeWidth={1.8} />
          <Typography style={TYPO.semi(16)}>
            Settle Up
          </Typography>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add expense"
          onPress={() => router.push(`/expense/new?groupId=${group.id}`)}
          style={({ pressed }) => ({
            flex: 1.5,
            height: 56,
            borderRadius: UI.radius.pill,
            backgroundColor: UI.color.text,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <icons.Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Typography style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}>
            Add Expense
          </Typography>
        </Pressable>
      </BottomActionBar>
      </View>
    </View>
  );
}
