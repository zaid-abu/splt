import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { ScrollView, View, Pressable, RefreshControl, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useUI, ScreenHeader } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { HapticButton } from "@/components/ui/HapticButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Uniwind } from "uniwind";

import { useProfile } from "../hooks/useProfile";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileBalance } from "../components/ProfileBalance";
import { ProfilePreferences } from "../components/ProfilePreferences";
import { ProfileAccount } from "../components/ProfileAccount";

export default function ProfileScreen(): JSX.Element {
  const { color, radius, space } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    currentUser,
    groups,
    owedToYou,
    youOwe,
    isFirstLoad,
    hasError,
    preferredCurrency,
    isDarkMode,
    signOut,
    deleteAccount,
    onRefresh,
    handleThemeToggle,
    handleCurrencyChange,
    refetchGroups,
    refetchExpenses,
    refetchSettlements,
  } = useProfile();

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: "Join me on Splt \u2014 the simple way to split expenses with friends!",
      });
    } catch {}
  };

  useEffect(() => {
    Uniwind.setTheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={color.text}
          />
        }
      >
        <FocusAwareView delay={100} style={{ paddingHorizontal: space.page, marginBottom: 40 }}>
          <Card padding={space.page}>
            <ProfileHeader
              name={currentUser.name}
              email={currentUser.email}
              onEdit={() => router.push("/profile/edit")}
            />
            <View style={{ marginTop: 32 }}>
              <ProfileBalance
                groupCount={groups.length}
                owedToYou={owedToYou}
                youOwe={youOwe}
                currencySymbol={preferredCurrency.symbol}
              />
            </View>
          </Card>
        </FocusAwareView>

        <FocusAwareView delay={200} style={{ paddingHorizontal: space.page, marginBottom: 40 }}>
          <ProfilePreferences
            isDarkMode={isDarkMode}
            preferredCurrencyCode={preferredCurrency.code}
            onThemeToggle={handleThemeToggle}
            onCurrencyChange={handleCurrencyChange}
          />
        </FocusAwareView>

        <FocusAwareView delay={300} style={{ paddingHorizontal: space.page, marginBottom: 40 }}>
          <ProfileAccount
            createdAt={currentUser.createdAt}
            onChangePassword={() => router.push("/profile/change-password")}
            onShareInvite={handleShareInvite}
            onLogOut={() => signOut()}
            onDeleteAccount={() => deleteSheetRef.current?.present()}
          />
        </FocusAwareView>

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
