import { Switch, Typography } from "heroui-native";
import { useRouter } from "expo-router";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { ScrollView, View, Pressable, RefreshControl, Share } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useUI, ScreenHeader, MetricCell, SectionLabel } from "@/components/ui/native-ui";
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
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Currency } from "@/types";
import { SettingsItem } from "@/features/profile/components/SettingsItem";
import { Uniwind } from "uniwind";

export default function ProfileScreen(): JSX.Element {
  const { color, radius, space, shadow } = useUI();
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

  const isFirstLoad = isLoadingGroups || isLoadingExpenses || isLoadingSettlements;
  const hasError = !!groupsError || !!expensesError || !!settlementsError;

  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const setDarkMode = useUIStore((s) => s.setDarkMode);

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

  const handleThemeToggle = (value: boolean) => {
    Haptics.selectionAsync();
    setDarkMode(value);
    Uniwind.setTheme(value ? "dark" : "light");
  };

  useEffect(() => {
    Uniwind.setTheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: "Join me on Splt \u2014 the simple way to split expenses with friends!",
      });
    } catch {}
  };

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
  };

  // ── Loading State ──────────────────────────────────────────────────────────

  if (isFirstLoad) {
    return (
      <FocusAwareView style={{ flex: 1, backgroundColor: color.bg }}>
        <ThemedStatusBar />
        <View style={{ paddingTop: insets.top + 16 }}>
          <ScreenHeader title="Profile" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: space.page, paddingTop: 16 }}>
          <FocusAwareView delay={0} style={{ marginBottom: 40 }}>
            <View
              style={{
                backgroundColor: color.surface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: color.border,
                padding: space.page,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
                <Skeleton width={64} height={64} radius={22} />
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
                  <Skeleton height={58} radius={radius.md} />
                </View>
                <View style={{ flex: 1 }}>
                  <Skeleton height={58} radius={radius.md} />
                </View>
                <View style={{ flex: 1 }}>
                  <Skeleton height={58} radius={radius.md} />
                </View>
              </View>
            </View>
          </FocusAwareView>
          <FocusAwareView delay={60} style={{ marginBottom: 40 }}>
            <View style={{ marginBottom: 14, width: 120 }}>
              <Skeleton height={14} radius={6} />
            </View>
            <View
              style={{
                backgroundColor: color.surface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              <View style={{ padding: 16, gap: 12 }}>
                <Skeleton height={52} radius={radius.md} />
                <Skeleton height={72} radius={radius.lg} />
              </View>
            </View>
          </FocusAwareView>
          <FocusAwareView delay={120} style={{ marginBottom: 40 }}>
            <View style={{ marginBottom: 14, width: 120 }}>
              <Skeleton height={14} radius={6} />
            </View>
            <View
              style={{
                backgroundColor: color.surface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: color.border,
              }}
            >
              <View style={{ padding: space.page, gap: 12 }}>
                <View style={{ width: "70%" }}>
                  <Skeleton height={16} />
                </View>
                <Skeleton height={52} radius={radius.pill} />
                <Skeleton height={52} radius={radius.pill} />
                <Skeleton height={52} radius={radius.pill} />
              </View>
            </View>
          </FocusAwareView>
        </View>
      </FocusAwareView>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────

  if (hasError) {
    return (
      <FocusAwareView style={{ flex: 1, backgroundColor: color.bg }}>
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
    <FocusAwareView style={{ flex: 1, backgroundColor: color.bg }}>
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
                  fontSize: 15,
                  color: color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.text} />
        }
      >
        {/* ── Profile Card ─────────────────────────────────────────────────── */}

        <FocusAwareView delay={100} style={{ paddingHorizontal: space.page, marginBottom: 40 }}>
          <Card padding={space.page}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/profile/edit")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
                <AppUserAvatar user={currentUser} size="lg" />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Typography
                    style={{
                      fontSize: 24,
                      color: color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      letterSpacing: -0.5,
                    }}
                    numberOfLines={1}
                  >
                    {currentUser.name}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 14,
                      color: color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                    }}
                    numberOfLines={1}
                  >
                    {currentUser.email}
                  </Typography>
                </View>
                <icons.ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
              </View>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <MetricCell label="Groups" value={String(groups.length)} />
              <MetricCell
                label="Owed"
                value={`+${preferredCurrency.symbol}${owedToYou.toFixed(0)}`}
                tone={owedToYou > 0 ? "success" : "neutral"}
              />
              <MetricCell
                label="Owe"
                value={
                  youOwe > 0
                    ? `-${preferredCurrency.symbol}${youOwe.toFixed(0)}`
                    : `${preferredCurrency.symbol}0`
                }
                tone={youOwe > 0 ? "danger" : "neutral"}
              />
            </View>
          </Card>
        </FocusAwareView>

        {/* ── Preferences ──────────────────────────────────────────────────── */}

        <FocusAwareView delay={200} style={{ paddingHorizontal: space.page, marginBottom: 40 }}>
          <View style={{ marginBottom: 14 }}>
            <SectionLabel>Preferences</SectionLabel>
          </View>

          <View
            style={{
              backgroundColor: color.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.border,
              marginBottom: 12,
            }}
          >
            <SettingsItem
              icon="Moon"
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              rightElement={<Switch isSelected={isDarkMode} onSelectedChange={handleThemeToggle} />}
            />
          </View>

          <View
            style={{
              backgroundColor: color.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <CurrencySelector value={preferredCurrency.code} onChange={handleCurrencyChange} />
            </View>
          </View>
        </FocusAwareView>

        {/* ── Account ──────────────────────────────────────────────────────── */}

        <FocusAwareView delay={300} style={{ paddingHorizontal: space.page, marginBottom: 40 }}>
          <View style={{ marginBottom: 14 }}>
            <SectionLabel>Account</SectionLabel>
          </View>

          <View
            style={{
              backgroundColor: color.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            <View style={{ padding: space.page }}>
              <Typography
                style={{
                  fontSize: 14,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                  marginBottom: 20,
                  lineHeight: 20,
                }}
              >
                {currentUser.createdAt
                  ? `Account created on ${currentUser.createdAt.toLocaleDateString()}`
                  : "Account details are synced with your profile."}
              </Typography>

              <SettingsItem
                icon="Lock"
                title="Change Password"
                onPress={() => router.push("/profile/change-password")}
              />

              <View style={{ height: 12 }} />

              <HapticButton onPress={() => signOut()} tone="outlined" height={52}>
                Log Out
              </HapticButton>

              <View style={{ height: 10 }} />

              <HapticButton onPress={handleShareInvite} tone="outlined" height={52}>
                Tell a Friend
              </HapticButton>

              <View
                style={{
                  height: 1,
                  backgroundColor: color.border,
                  marginVertical: 16,
                }}
              />

              <HapticButton
                onPress={() => deleteSheetRef.current?.present()}
                tone="danger"
                height={52}
              >
                Delete Account
              </HapticButton>
            </View>
          </View>
        </FocusAwareView>

        {/* ── Version ──────────────────────────────────────────────────────── */}

        <View style={{ alignItems: "center", marginBottom: 32, marginTop: -8 }}>
          <Typography
            style={{
              fontSize: 12,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              opacity: 0.4,
            }}
          >
            SPLT v1.0.0
          </Typography>
        </View>
      </ScrollView>

      {/* ── Delete Account Sheet ───────────────────────────────────────────── */}

      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: space.page,
            paddingTop: 24,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
        >
          <Typography
            style={{
              fontSize: 22,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginBottom: 8,
            }}
          >
            Delete Account?
          </Typography>
          <Typography
            style={{
              fontSize: 16,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
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
