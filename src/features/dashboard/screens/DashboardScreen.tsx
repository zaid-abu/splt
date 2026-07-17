import type { JSX } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";

import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useUI, IconButton } from "@/components/ui";
import { ErrorState } from "@/components/ui/ErrorState";
import GlassBackground from "@/components/glassmorphism/GlassBackground";
import { getGreeting } from "@/utils/date";

import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { DashboardBalance } from "@/features/dashboard/components/DashboardBalance";
import { DashboardActions } from "@/features/dashboard/components/DashboardActions";
import { DashboardAttention } from "@/features/dashboard/components/DashboardAttention";
import { DashboardGroupsPreview } from "@/features/dashboard/components/DashboardGroupsPreview";
import { DashboardRecentActivity } from "@/features/dashboard/components/DashboardRecentActivity";
import { DashboardSettleSheet } from "@/features/dashboard/components/DashboardSettleSheet";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";

export default function DashboardScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { color, space } = useUI();
  const dashboard = useDashboard();

  if (dashboard.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <GlassBackground />
        <ThemedStatusBar />
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState onRetry={dashboard.onRefresh} />
        </View>
      </View>
    );
  }

  if (dashboard.isLoading && dashboard.activeGroups.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <GlassBackground />
        <ThemedStatusBar />
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <GlassBackground />
      <ThemedStatusBar />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: insets.top + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.refreshing}
            onRefresh={dashboard.onRefresh}
            tintColor={color.text}
          />
        }
      >
        <View
          style={{
            paddingHorizontal: space.page,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <View style={{ flex: 1 }}>
            <Typography
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                marginBottom: 6,
              }}
            >
              {getGreeting()},
            </Typography>
            <Typography
              style={{
                fontFamily: "Sora_600SemiBold",
                fontSize: 30,
                color: color.textStrong,
                lineHeight: 34,
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
            >
              {dashboard.currentUser?.name.split(" ")[0]}
            </Typography>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 12 }}>
            <View>
              <IconButton
                icon={icons.Bell}
                accessibilityLabel="View notifications"
                onPress={dashboard.handleViewNotifications}
              />
              {dashboard.hasNotifications && (
                <View
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: color.danger,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    borderWidth: 2,
                    borderColor: color.control,
                  }}
                />
              )}
            </View>
            <IconButton
              icon={icons.CircleUserRound}
              accessibilityLabel="Open profile"
              onPress={dashboard.handleViewProfile}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: space.page, marginBottom: 18 }}>
          <DashboardBalance
            balanceTone={dashboard.balanceTone}
            perUserBalances={dashboard.perUserBalances}
            owedToYou={dashboard.owedToYou}
            youOwe={dashboard.youOwe}
            currencyCode={dashboard.preferredCurrency.code}
            oweUsers={dashboard.oweUsers}
            owedUsers={dashboard.owedUsers}
            onOwePress={dashboard.handleSettleUp}
            onOwedPress={dashboard.handleSettleUp}
            onViewStats={dashboard.handleViewStats}
            totalSpent={dashboard.totalSpent}
            expenseCount={dashboard.expenseCount}
          />
        </View>

        <View style={{ paddingHorizontal: space.page, marginBottom: 24 }}>
          <DashboardActions
            onAddExpense={dashboard.handleAddExpense}
            onSettleUp={dashboard.handleSettleUp}
          />
        </View>

        <View style={{ paddingHorizontal: space.page }}>
          <DashboardAttention
            oweUsers={dashboard.oweUsers}
            owedUsers={dashboard.owedUsers}
            perUserBalances={dashboard.perUserBalances}
            currencyCode={dashboard.preferredCurrency.code}
            onAction={dashboard.handleSettleUser}
          />
        </View>

        <View style={{ paddingHorizontal: space.page }}>
          <DashboardGroupsPreview
            groups={dashboard.activeGroups}
            openCount={dashboard.openGroupCount}
            isLoading={dashboard.groupsLoading}
            onViewAll={dashboard.handleViewAllGroups}
            onCreateGroup={dashboard.handleCreateGroup}
            onGroupPress={dashboard.handleGroupPress}
          />
        </View>

        <View style={{ paddingHorizontal: space.page }}>
          <DashboardRecentActivity
            expenses={dashboard.recentExpenses}
            filter={dashboard.activeExpenseFilter}
            onFilterChange={dashboard.setActiveExpenseFilter}
            currentUserId={dashboard.currentUser?.id ?? ""}
            onViewAll={dashboard.handleViewAllActivity}
            onExpensePress={dashboard.handleExpensePress}
            onAddExpense={dashboard.handleAddExpense}
          />
        </View>
      </ScrollView>

      <DashboardSettleSheet
        ref={dashboard.settleSheetRef}
        owedUsers={dashboard.owedUsers}
        oweUsers={dashboard.oweUsers}
        perUserBalances={dashboard.perUserBalances}
        currencyCode={dashboard.preferredCurrency.code}
        onSelect={dashboard.handleSettleUser}
      />
    </View>
  );
}
