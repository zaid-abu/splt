import { useRouter } from "expo-router";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { ScrollView, View, Pressable, RefreshControl, Share, Linking, Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { Typography } from "heroui-native";
import { UI, ScreenHeader, MetricCell, SectionLabel, TYPO } from "@/components/ui/native-ui";
import { Card } from "@/components/ui/Card";
import { HapticButton } from "@/components/ui/HapticButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import { useAuth } from "@/context/AppContext";
import { useSignOut, useDeleteAccount } from "@/features/auth/hooks/useAuthMutations";
import { useUIStore } from "@/store/useUIStore";
import { useFriends } from "@/features/friends/queries/useFriends";
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Currency } from "@/types";
import { SettingsItem } from "@/features/profile/components/SettingsItem";
import dayjs from "dayjs";

function DarkModeToggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const rotation = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    rotation.value = withSpring(value ? 1 : 0, { mass: 0.5, stiffness: 120, damping: 12 });
  }, [value, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={`Switch to ${value ? "light" : "dark"} mode`}
      style={({ pressed }) => ({
        width: 52,
        height: 28,
        borderRadius: UI.radius.pill,
        backgroundColor: value ? "#2A2A2A" : UI.color.control,
        borderWidth: 1,
        borderColor: value ? "#3A3A3A" : UI.color.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Animated.View style={iconStyle}>
        {value ? (
          <icons.Moon size={16} color="#F5F0EB" strokeWidth={1.75} />
        ) : (
          <icons.Sun size={16} color={UI.color.text} strokeWidth={1.75} />
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function ProfileScreen(): JSX.Element {
  const router = useRouter();
  const { currentUser } = useAuth();

  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    error: groupsError,
    refetch: refetchGroups,
  } = useGroups(currentUser?.id);
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    error: expensesError,
    refetch: refetchExpenses,
  } = useUserExpenses(currentUser?.id);
  const {
    data: settlements = [],
    isLoading: isLoadingSettlements,
    error: settlementsError,
    refetch: refetchSettlements,
  } = useUserSettlements(currentUser?.id);
  const {
    data: friends = [],
    isLoading: isLoadingFriends,
  } = useFriends(currentUser?.id);

  const isFirstLoad = isLoadingGroups || isLoadingExpenses || isLoadingSettlements || isLoadingFriends;
  const hasError = !!groupsError || !!expensesError || !!settlementsError;

  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const setDarkMode = useUIStore((s) => s.setDarkMode);
  const hapticFeedback = useUIStore((s) => s.hapticFeedback);
  const setHapticFeedback = useUIStore((s) => s.setHapticFeedback);

  const owedToYou = balancesUtil.getTotalOwedToMe(
    currentUser.id,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );
  const youOwe = Math.abs(
    balancesUtil.getTotalIOwe(
      currentUser.id,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    )
  );

  const { mutate: signOut } = useSignOut();
  const { mutateAsync: deleteAccount } = useDeleteAccount();
  const deleteSheetRef = useRef<BottomSheetModal>(null);
  const [refreshing, setRefreshing] = useState(false);
  const appVersion = "1.0.0";

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({
      queryKey: ["groups", "expenses", "settlements"],
    });
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  const handleSignOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signOut();
  }, [signOut]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: "Join me on Splt \u2014 the simple way to split expenses with friends!",
      });
    } catch {}
  }, []);

  const handleRate = useCallback(() => {
    const url = Platform.OS === "ios"
      ? "https://apps.apple.com/app/splt"
      : "https://play.google.com/store/apps/details?id=com.splt.app";
    Linking.openURL(url).catch(() => {});
  }, []);

  const handleFeedback = useCallback(() => {
    Linking.openURL("mailto:support@splt.app").catch(() => {});
  }, []);

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
  };

  const handleHapticToggle = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setHapticFeedback(enabled);
    },
    [setHapticFeedback]
  );

  const handleDarkModeToggle = useCallback(
    (value: boolean) => {
      setDarkMode(value);
    },
    [setDarkMode]
  );

  const memberSince = currentUser.createdAt
    ? dayjs(currentUser.createdAt).format("MMMM YYYY")
    : null;

  // ── Loading State ──────────────────────────────────────────────────────────

  if (isFirstLoad) {
    return (
      <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
        <ThemedStatusBar />
        <View style={{ paddingTop: insets.top + 16 }}>
          <ScreenHeader title="Profile" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: UI.space.page, paddingTop: 16 }}>
          <FocusAwareView delay={0} style={{ marginBottom: 40 }}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
                <Skeleton width={96} height={96} radius={28} />
                <View style={{ marginLeft: 16, flex: 1, gap: 8 }}>
                  <View style={{ width: "60%" }}>
                    <Skeleton height={22} />
                  </View>
                  <View style={{ width: "80%" }}>
                    <Skeleton height={14} />
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Skeleton height={58} radius={UI.radius.md} />
                </View>
                <View style={{ flex: 1 }}>
                  <Skeleton height={58} radius={UI.radius.md} />
                </View>
                <View style={{ flex: 1 }}>
                  <Skeleton height={58} radius={UI.radius.md} />
                </View>
              </View>
            </Card>
          </FocusAwareView>
          <FocusAwareView delay={60} style={{ marginBottom: 40 }}>
            <View style={{ marginBottom: 14, width: 120 }}>
              <Skeleton height={14} radius={6} />
            </View>
            <Card>
              <View style={{ padding: UI.space.page, gap: 12 }}>
                <Skeleton height={52} radius={UI.radius.md} />
                <Skeleton height={52} radius={UI.radius.md} />
                <Skeleton height={52} radius={UI.radius.md} />
              </View>
            </Card>
          </FocusAwareView>
          <FocusAwareView delay={120} style={{ marginBottom: 40 }}>
            <View style={{ marginBottom: 14, width: 120 }}>
              <Skeleton height={14} radius={6} />
            </View>
            <Card>
              <View style={{ padding: UI.space.page, gap: 12 }}>
                <View style={{ width: "70%" }}>
                  <Skeleton height={16} />
                </View>
                <Skeleton height={52} radius={UI.radius.pill} />
                <Skeleton height={52} radius={UI.radius.pill} />
                <Skeleton height={52} radius={UI.radius.pill} />
              </View>
            </Card>
          </FocusAwareView>
        </View>
      </FocusAwareView>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────

  if (hasError) {
    return (
      <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
        <ThemedStatusBar />
        <View style={{ paddingTop: insets.top + 16 }}>
          <ScreenHeader title="Profile" />
        </View>
        <View style={{ flex: 1, justifyContent: "center", paddingBottom: 80 }}>
          <ErrorState
            title="Couldn\u2019t load profile"
            message="We had trouble loading your profile data. Pull down to try again."
            onRetry={() => {
              refetchGroups();
              refetchExpenses();
              refetchSettlements();
            }}
          />
        </View>
      </FocusAwareView>
    );
  }

  // ── Content ─────────────────────────────────────────────────────────────────

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />

      <View style={{ paddingTop: insets.top + 16 }}>
        <ScreenHeader
          title="Profile"
          onBackPress={() => router.back()}
          rightAction={
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/profile/edit")}
              hitSlop={8}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: "center",
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Typography
                style={{
                  ...TYPO.semi(15),
                  color: UI.color.text,
                }}
              >
                Edit
              </Typography>
            </Pressable>
          }
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.color.text} />
        }
      >
        {/* ── Profile Card ─────────────────────────────────────────────────── */}

        <FocusAwareView delay={100} style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}>
          <Card padding={UI.space.page}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/profile/edit")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AppUserAvatar user={currentUser} size={"xl" as any} />
                <View style={{ marginLeft: 20, flex: 1 }}>
                  <Typography
                    style={{
                      ...TYPO.title(24),
                      color: UI.color.text,
                    }}
                    numberOfLines={1}
                  >
                    {currentUser.name}
                  </Typography>
                  <Typography
                    style={{
                      ...TYPO.medium(14),
                      color: UI.color.muted,
                      marginTop: 4,
                    }}
                    numberOfLines={1}
                  >
                    {currentUser.email}
                  </Typography>
                  {memberSince && (
                    <Typography
                      style={{
                        ...TYPO.medium(12),
                        color: UI.color.muted,
                        marginTop: 4,
                        opacity: 0.7,
                      }}
                    >
                      Member since {memberSince}
                    </Typography>
                  )}
                </View>
                <icons.ChevronRight size={20} color={UI.color.muted} strokeWidth={1.5} />
              </View>
            </Pressable>

            {/* Quick Stats */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/groups")}
                style={{ flex: 1 }}
              >
                <MetricCell label="Groups" value={String(groups.length)} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/friends")}
                style={{ flex: 1 }}
              >
                <MetricCell label="Friends" value={String(friends.length)} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/activity")}
                style={{ flex: 1 }}
              >
                <MetricCell label="Expenses" value={String(expenses.length)} />
              </Pressable>
            </View>

            {/* Balance Summary */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 16,
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: UI.color.border,
              }}
            >
              <Typography
                style={{
                  ...TYPO.semi(14),
                  color: UI.color.success,
                }}
              >
                Owed {preferredCurrency.symbol}
                {owedToYou.toFixed(0)}
              </Typography>
              <View
                style={{
                  width: 1,
                  backgroundColor: UI.color.border,
                }}
              />
              <Typography
                style={{
                  ...TYPO.semi(14),
                  color: UI.color.danger,
                }}
              >
                Owe {preferredCurrency.symbol}
                {youOwe.toFixed(0)}
              </Typography>
            </View>
          </Card>
        </FocusAwareView>

        {/* ── Preferences ──────────────────────────────────────────────────── */}

        <FocusAwareView delay={200} style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}>
          <View style={{ marginBottom: 14 }}>
            <SectionLabel>Preferences</SectionLabel>
          </View>

          <Card style={{ marginBottom: 10 }}>
            <SettingsItem
              icon={isDarkMode ? "Moon" : "Sun"}
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              rightElement={
                <DarkModeToggle value={isDarkMode} onValueChange={handleDarkModeToggle} />
              }
            />
            <SettingsItem
              icon="Smartphone"
              title="Haptic Feedback"
              subtitle="Vibrations on interactions"
              isLast
              rightElement={
                <Pressable
                  onPress={() => handleHapticToggle(!hapticFeedback)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hapticFeedback }}
                  accessibilityLabel="Toggle haptic feedback"
                  style={({ pressed }) => ({
                    width: 52,
                    height: 28,
                    borderRadius: UI.radius.pill,
                    backgroundColor: hapticFeedback ? UI.color.text : UI.color.border,
                    borderWidth: 1,
                    borderColor: hapticFeedback ? UI.color.text : UI.color.border,
                    alignItems: hapticFeedback ? "flex-end" : "flex-start",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: hapticFeedback ? UI.color.textInverse : UI.color.control,
                    }}
                  />
                </Pressable>
              }
            />
          </Card>

          <Card>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <CurrencySelector value={preferredCurrency.code} onChange={handleCurrencyChange} />
            </View>
          </Card>
        </FocusAwareView>

        {/* ── Account ──────────────────────────────────────────────────────── */}

        <FocusAwareView delay={300} style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}>
          <View style={{ marginBottom: 14 }}>
            <SectionLabel>Account</SectionLabel>
          </View>

          <Card style={{ marginBottom: 10 }}>
            <SettingsItem
              icon="Lock"
              title="Change Password"
              onPress={() => router.push("/profile/change-password")}
            />
            <SettingsItem
              icon="LogOut"
              title="Log Out"
              isLast
              onPress={handleSignOut}
            />
          </Card>

          <Card padding={16}>
            <HapticButton
              onPress={() => deleteSheetRef.current?.present()}
              tone="danger"
              height={52}
            >
              Delete Account
            </HapticButton>
          </Card>
        </FocusAwareView>

        {/* ── About ────────────────────────────────────────────────────────── */}

        <FocusAwareView delay={400} style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}>
          <View style={{ marginBottom: 14 }}>
            <SectionLabel>About</SectionLabel>
          </View>

          <Card>
            <SettingsItem
              icon="Info"
              title="Version"
              rightElement={
                <Typography
                  style={{
                    ...TYPO.medium(14),
                    color: UI.color.muted,
                  }}
                >
                  {appVersion}
                </Typography>
              }
            />
            <SettingsItem
              icon="Star"
              title="Rate Splt"
              subtitle="Love the app? Leave a review"
              onPress={handleRate}
            />
            <SettingsItem
              icon="Share2"
              title="Share Splt"
              subtitle="Tell your friends about us"
              onPress={handleShare}
            />
            <SettingsItem
              icon="MessageSquare"
              title="Send Feedback"
              subtitle="Help us improve"
              isLast
              onPress={handleFeedback}
            />
          </Card>
        </FocusAwareView>
      </ScrollView>

      {/* ── Delete Account Sheet ───────────────────────────────────────────── */}

      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: UI.space.page,
            paddingTop: 24,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
        >
          <Typography
            style={{
              ...TYPO.title(22),
              color: UI.color.text,
              marginBottom: 8,
            }}
          >
            Delete Account?
          </Typography>
          <Typography
            style={{
              ...TYPO.medium(16),
              color: UI.color.muted,
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            This permanently deletes your account and all associated data. This cannot be undone.
          </Typography>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <HapticButton
                onPress={() => deleteSheetRef.current?.dismiss()}
                tone="outlined"
                height={52}
              >
                Cancel
              </HapticButton>
            </View>
            <View style={{ flex: 1 }}>
              <HapticButton
                onPress={async () => {
                  deleteSheetRef.current?.dismiss();
                  try {
                    await deleteAccount(currentUser.id);
                  } catch {}
                }}
                tone="danger"
                height={52}
              >
                Delete
              </HapticButton>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </FocusAwareView>
  );
}

