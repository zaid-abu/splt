/**
 * Profile Screen — Edge-to-Edge Editorial Design
 * PURE WHITE background, borderless layout, large typography, minimalist lines.
 */
import { Switch, Typography } from "heroui-native";
import { useRouter } from "expo-router";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { Uniwind } from "uniwind";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
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

import { SettingsItem } from "@/features/profile/components/SettingsItem";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#000000";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";
const SECTION_PAD = 24;

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography
      style={{
        fontSize: 11,
        color: TEXT_SECONDARY,
        fontFamily: "CrimsonText_700Bold",
        letterSpacing: 1.4,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </Typography>
  );
}

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
    <FocusAwareView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* Header */}
      <FocusAwareView
        delay={0}
        style={{ paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: SECTION_PAD }}
      >
        <Typography
          style={{
            fontFamily: "UnicaOne_400Regular",
            fontSize: 36,
            color: TEXT_PRIMARY,
            lineHeight: 44,
            letterSpacing: -0.5,
          }}
        >
          Profile.
        </Typography>
      </FocusAwareView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Stats Edge-to-Edge */}
        <FocusAwareView
          delay={100}
          style={{
            paddingHorizontal: SECTION_PAD,
            marginBottom: 40,
            paddingBottom: 32,
            borderBottomWidth: 1,
            borderBottomColor: SEPARATOR,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <AppUserAvatar user={currentUser} size="lg" />
            <View style={{ marginLeft: 16 }}>
              <Typography
                style={{
                  fontSize: 24,
                  color: TEXT_PRIMARY,
                  fontFamily: "CrimsonText_700Bold",
                  letterSpacing: -0.5,
                }}
              >
                {currentUser.name}
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_600SemiBold",
                }}
              >
                {currentUser.email}
              </Typography>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Typography
                style={{
                  fontSize: 12,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_700Bold",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 4,
                }}
              >
                Groups
              </Typography>
              <Typography
                style={{ fontSize: 24, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
              >
                {groups.length}
              </Typography>
            </View>
            <View
              style={{ width: 1, height: 32, backgroundColor: SEPARATOR, marginHorizontal: 16 }}
            />
            <View style={{ flex: 1 }}>
              <Typography
                style={{
                  fontSize: 12,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_700Bold",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 4,
                }}
              >
                Owed
              </Typography>
              <Typography
                style={{ fontSize: 24, color: TEXT_SUCCESS, fontFamily: "CrimsonText_700Bold" }}
              >
                +{preferredCurrency.symbol}
                {owedToYou.toFixed(0)}
              </Typography>
            </View>
            {youOwe > 0 && (
              <>
                <View
                  style={{ width: 1, height: 32, backgroundColor: SEPARATOR, marginHorizontal: 16 }}
                />
                <View style={{ flex: 1 }}>
                  <Typography
                    style={{
                      fontSize: 12,
                      color: TEXT_SECONDARY,
                      fontFamily: "CrimsonText_700Bold",
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      marginBottom: 4,
                    }}
                  >
                    Owe
                  </Typography>
                  <Typography
                    style={{ fontSize: 24, color: TEXT_DANGER, fontFamily: "CrimsonText_700Bold" }}
                  >
                    -{preferredCurrency.symbol}
                    {youOwe.toFixed(0)}
                  </Typography>
                </View>
              </>
            )}
          </View>
        </FocusAwareView>

        {/* Preferences */}
        <FocusAwareView delay={200} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 40 }}>
          <SectionLabel>PREFERENCES</SectionLabel>
          <View style={{ borderTopWidth: 1, borderTopColor: SEPARATOR }}>
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

            {/* Custom Edge-to-Edge wrapper for Currency Selector to match the new look */}
            <View
              style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}
            >
              <CurrencySelector value={preferredCurrency.code} onChange={handleCurrencyChange} />
            </View>
          </View>
        </FocusAwareView>

        {/* Account */}
        <FocusAwareView delay={300} style={{ paddingHorizontal: SECTION_PAD }}>
          <SectionLabel>ACCOUNT</SectionLabel>
          <View style={{ borderTopWidth: 1, borderTopColor: SEPARATOR }}>
            <SettingsItem
              icon="LogOut"
              title="Sign Out"
              subtitle="Log out of your account"
              onPress={() => signOut()}
              isDanger
              isLast
            />
          </View>
        </FocusAwareView>
      </ScrollView>
    </FocusAwareView>
  );
}
