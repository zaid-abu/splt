import { Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { View, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { UI, TYPO, PressableScale } from "@/components/ui/native-ui";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { Skeleton, ListRowSkeleton } from "@/components/ui/Skeleton";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroupDetailData } from "@/features/groups/hooks/useGroupDetailData";
import { ErrorState } from "@/components/ui/ErrorState";
import { GroupTabBar } from "@/features/groups/components/GroupTabBar";
import { GroupExpensesTab } from "@/features/groups/components/GroupExpensesTab";
import { GroupBalancesTab } from "@/features/groups/components/GroupBalancesTab";
import { GroupMembersTab } from "@/features/groups/components/GroupMembersTab";
import { GroupStatsTab } from "@/features/groups/components/GroupStatsTab";

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
    groupDebts,
    youOwe,
    owedToYou,
    userById,
    isLoading,
    isError,
    refetch,
  } = useGroupDetailData(id || "", currentUser?.id);

  const [activeTab, setActiveTab] = useState(0);
  const isAllSettled = youOwe === 0 && owedToYou === 0;

  const isDark = useUIStore((s) => s.isDarkMode);

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
        textTitleBig: {
          fontSize: 18,
          color: UI.color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          marginBottom: 8,
        },
        textSubtitleCenter: {
          fontSize: 14,
          color: UI.color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          textAlign: "center",
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
        notFoundCard: {
          alignItems: "center",
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          padding: 32,
        },
        skeletonHeaderBlock: {
          paddingHorizontal: UI.space.page,
          paddingTop: 16,
          paddingBottom: 24,
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                backgroundColor: UI.color.text,
                borderRadius: UI.radius.pill,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 14,
                  color: UI.color.textInverse,
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
          onPress={() => {
            Haptics.selectionAsync();
            router.push(`/group/${group.id}/settings`);
          }}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <icons.Settings size={20} color={UI.color.text} strokeWidth={1.8} />
        </Pressable>
      </View>

      <GroupTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <FocusAwareView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {activeTab === 0 && (
            <GroupExpensesTab
              groupId={group.id}
              groupCurrency={group.currency}
              userById={userById}
            />
          )}
          {activeTab === 1 && (
            <GroupBalancesTab
              groupId={group.id}
              members={group.members}
              groupCurrency={group.currency}
              debts={groupDebts}
            />
          )}
          {activeTab === 2 && (
            <GroupMembersTab
              groupId={group.id}
              members={group.members}
              balances={memberBalances}
              groupCurrency={group.currency}
            />
          )}
          {activeTab === 3 && (
            <GroupStatsTab
              groupId={group.id}
              expenses={expenses}
              groupCurrency={group.currency}
            />
          )}
        </View>
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
                <icons.Handshake size={20} color={UI.color.ink} strokeWidth={1.8} />
                <Typography style={{ ...TYPO.semi(16), color: UI.color.ink }}>Settle Up</Typography>
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
                borderRadius: UI.radius.pill,
                backgroundColor: UI.color.text,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 10,
              }}
            >
              <icons.Plus size={20} color={UI.color.textInverse} strokeWidth={2.5} />
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.textInverse,
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
