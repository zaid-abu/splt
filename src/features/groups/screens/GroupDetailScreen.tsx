import { useLocalSearchParams } from "expo-router";
import type { GroupRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Typography, Spinner } from "heroui-native";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { useUI, SectionLabel } from "@/components/ui";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { PressableScale } from "@/components/ui/PressableScale";
import { Skeleton, ListRowSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import * as icons from "lucide-react-native";
import { useUIStore } from "@/store/useUIStore";

import { useGroupDetail } from "@/features/groups/hooks/useGroupDetail";
import { GroupMemberBar } from "@/features/groups/components/GroupMemberBar";
import { GroupBalances } from "@/features/groups/components/GroupBalances";
import { GroupInviteBanner } from "@/features/groups/components/GroupInviteBanner";
import { GroupTransactions } from "@/features/groups/components/GroupTransactions";

function EmptyIconShell({ icon: Icon }: { icon: any }): JSX.Element {
  const { color, radius } = useUI();
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
  const { color, radius, space } = useUI();
  const { id } = useLocalSearchParams<GroupRouteParams>();
  const insets = useSafeAreaInsets();
  const isDark = useUIStore((s) => s.isDarkMode);

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
    isAllSettled,
    memberBalances,
    refreshing,
    currentUserId,
    handleRefresh,
    handleBack,
    handleSettingsPress,
    handleMemberPress,
    handleSettleUp,
    handleAddExpense,
    handleExpensePress,
    refetch,
  } = useGroupDetail(id || "");

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
        <ThemedStatusBar />
        <View style={{ paddingHorizontal: space.page, paddingTop: 16, paddingBottom: 24 }}>
          <Skeleton height={44} width={44} radius={radius.pill} />
        </View>
        <View style={{ paddingHorizontal: space.page, gap: 18 }}>
          <Skeleton height={170} radius={radius.lg} />
          <View>
            <View style={{ marginBottom: 14 }}>
              <Skeleton height={18} width={120} radius={6} />
            </View>
            <View
              style={{
                backgroundColor: color.surface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              <ListRowSkeleton />
              <ListRowSkeleton />
              <ListRowSkeleton />
            </View>
          </View>
          <View>
            <View style={{ marginBottom: 14 }}>
              <Skeleton height={18} width={100} radius={6} />
            </View>
            <View
              style={{
                backgroundColor: color.surface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
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
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
        <ThemedStatusBar />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <ErrorState onRetry={() => refetch()} />
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
        <ThemedStatusBar />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View
            style={{
              alignItems: "center",
              backgroundColor: color.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.border,
              padding: 32,
            }}
          >
            <EmptyIconShell icon={icons.Frown} />
            <Typography
              style={{
                fontSize: 18,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              Group not found
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
              }}
            >
              This group may have been deleted.
            </Typography>
            <Pressable
              onPress={handleBack}
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
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      <View
        style={{
          paddingHorizontal: space.page,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 16,
          paddingBottom: 24,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={handleBack}
          style={({ pressed }) => [
            {
              width: 44,
              height: 44,
              borderRadius: radius.pill,
              backgroundColor: color.control,
              borderWidth: 1,
              borderColor: color.border,
              alignItems: "center",
              justifyContent: "center",
            },
            pressed && { opacity: 0.65 },
          ]}
        >
          <icons.ArrowLeft size={20} color={color.text} strokeWidth={1.8} />
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
              color: color.text,
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
          onPress={handleSettingsPress}
          style={({ pressed }) => [
            {
              width: 44,
              height: 44,
              borderRadius: radius.pill,
              backgroundColor: color.control,
              borderWidth: 1,
              borderColor: color.border,
              alignItems: "center",
              justifyContent: "center",
            },
            pressed && { opacity: 0.65 },
          ]}
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
              onRefresh={handleRefresh}
              tintColor={color.text}
            />
          }
        >
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={{ paddingHorizontal: space.page, marginBottom: 20 }}
          >
            <GroupMemberBar
              members={group.members}
              currentUserId={currentUserId}
              memberBalances={memberBalances}
              currency={group.currency}
              onMemberPress={handleMemberPress}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={{ paddingHorizontal: space.page, marginBottom: 32 }}
          >
            <BalanceCard
              youOwe={youOwe}
              owedToYou={owedToYou}
              currencyCode={group.currency}
              oweUsers={oweUsers}
              owedUsers={owedUsers}
              onOwePress={handleSettleUp}
              onOwedPress={handleSettleUp}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(50).springify()}
            style={{ paddingHorizontal: space.page, marginBottom: 40 }}
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
            <GroupBalances
              groupDebts={groupDebts}
              members={group.members}
              currentUserId={currentUserId}
              currency={group.currency}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(75).springify()}
            style={{ paddingHorizontal: space.page, marginBottom: 40 }}
          >
            <SectionLabel>Invite Members</SectionLabel>
            <GroupInviteBanner
              groupName={group.name}
              memberCount={group.members.length}
              onInvitePress={handleSettingsPress}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            style={{ paddingHorizontal: space.page, marginBottom: 40 }}
          >
            <GroupTransactions
              expenses={expenses}
              currentUserId={currentUserId}
              userById={userById}
              totalExpensesInGroupCurrency={totalExpensesInGroupCurrency}
              currency={group.currency}
              onExpensePress={handleExpensePress}
            />
          </Animated.View>
        </ScrollView>
      </FocusAwareView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <BottomActionBar>
          {!isAllSettled && (
            <PressableScale
              onPress={handleSettleUp}
              style={{ flex: 1, minHeight: 56 }}
            >
              <View
                style={{
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
                }}
              >
                <icons.Handshake size={20} color={color.ink} strokeWidth={1.8} />
                <Typography
                  style={{ fontSize: 16, color: color.ink, fontFamily: "IBMPlexSans_600SemiBold" }}
                >
                  Settle Up
                </Typography>
              </View>
            </PressableScale>
          )}

          <PressableScale
            onPress={handleAddExpense}
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
