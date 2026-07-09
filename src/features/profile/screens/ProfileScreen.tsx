import { Switch, Typography } from "heroui-native";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { Uniwind } from "uniwind";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useAuth } from "@/context/AppContext";
import { useSignOut } from "@/features/auth/hooks/useAuthMutations";
import { useUIStore } from "@/store/useUIStore";
import type { Currency } from "@/types";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { UI, ScreenHeader, MetricCell } from "@/components/ui/native-ui";

import { SettingsItem } from "@/features/profile/components/SettingsItem";

export default function ProfileScreen(): JSX.Element {
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const insets = useSafeAreaInsets();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);

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
  const [darkMode, setDarkMode] = useState(true);
  const [notifs, setNotifs] = useState(true);

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
  };

  const handleThemeToggle = (value: boolean) => {
    setDarkMode(value);
    Uniwind.setTheme(value ? "dark" : "light");
  };

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 16 }}>
        <ScreenHeader title="Profile" />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Stats Card */}
        <FocusAwareView
          delay={100}
          style={{
            paddingHorizontal: UI.space.page,
            marginBottom: 40,
          }}
        >
          <View
            style={{
              backgroundColor: UI.color.surface,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              padding: UI.space.page,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
              <AppUserAvatar user={currentUser} size="lg" />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Typography
                  style={{
                    fontSize: 24,
                    color: UI.color.text,
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
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                  numberOfLines={1}
                >
                  {currentUser.email}
                </Typography>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <MetricCell
                label="Groups"
                value={String(groups.length)}
              />
              <MetricCell
                label="Owed"
                value={`+${preferredCurrency.symbol}${owedToYou.toFixed(0)}`}
                tone={owedToYou > 0 ? "success" : "neutral"}
              />
              {youOwe > 0 && (
                <MetricCell
                  label="Owe"
                  value={`-${preferredCurrency.symbol}${youOwe.toFixed(0)}`}
                  tone="danger"
                />
              )}
            </View>
          </View>
        </FocusAwareView>

        {/* Preferences */}
        <FocusAwareView delay={200} style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}>
          <Typography
            style={{
              fontSize: 11,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: 1.4,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Preferences
          </Typography>
          <View
            style={{
              backgroundColor: UI.color.surface,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
            }}
          >
            <SettingsItem
              icon="Moon"
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              rightElement={<Switch isSelected={darkMode} onSelectedChange={handleThemeToggle} />}
            />
            <SettingsItem
              icon="Bell"
              title="Notifications"
              subtitle="Manage push notifications"
              rightElement={<Switch isSelected={notifs} onSelectedChange={setNotifs} />}
            />
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <CurrencySelector value={preferredCurrency.code} onChange={handleCurrencyChange} />
            </View>
          </View>
        </FocusAwareView>

        {/* Account Info */}
        <FocusAwareView delay={300} style={{ paddingHorizontal: UI.space.page, marginBottom: 40 }}>
          <Typography
            style={{
              fontSize: 11,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: 1.4,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Account Info
          </Typography>
          <View
            style={{
              backgroundColor: UI.color.surface,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              padding: UI.space.page,
            }}
          >
            <Typography
              style={{
                fontSize: 14,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              {currentUser.createdAt
                ? `Account created on ${currentUser.createdAt.toLocaleDateString()}`
                : "Account details are synced with your profile."}
            </Typography>

            <Pressable
              accessibilityRole="button"
              onPress={() => signOut()}
              style={({ pressed }) => ({
                height: 52,
                borderRadius: UI.radius.pill,
                backgroundColor: UI.color.control,
                borderWidth: 1,
                borderColor: UI.color.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: UI.color.danger,
                }}
              >
                Log Out
              </Typography>
            </Pressable>
          </View>
        </FocusAwareView>

        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Typography
            style={{
              fontSize: 13,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: 1,
              opacity: 0.5,
            }}
          >
            SPLT V1.0.0
          </Typography>
        </View>
      </ScrollView>
    </FocusAwareView>
  );
}
