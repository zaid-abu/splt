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
        fontSize: 20,
        fontWeight: "800",
        color: TEXT_PRIMARY,
        fontFamily: "PlusJakartaSans_800ExtraBold",
        letterSpacing: -0.5,
        marginBottom: 16,
      }}
    >
      {children}
    </Typography>
  );
}

function SettingRow({ icon: Icon, title, rightElement, isLast }: any) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: SEPARATOR,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ width: 40, height: 40, borderRadius: 0, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: SEPARATOR }}>
          <Icon size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
        </View>
        <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", letterSpacing: -0.3 }}>
          {title}
        </Typography>
      </View>
      <View>{rightElement}</View>
    </View>
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
      <FocusAwareView delay={0} style={{ paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: SECTION_PAD }}>
        <Typography style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 36, color: TEXT_PRIMARY, lineHeight: 44, letterSpacing: -0.5 }}>
          Profile.
        </Typography>
      </FocusAwareView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Stats Edge-to-Edge */}
        <FocusAwareView delay={100} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 40, paddingBottom: 32, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
          
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <AppUserAvatar user={currentUser} size="lg" />
            <View style={{ marginLeft: 16 }}>
              <Typography style={{ fontSize: 24, fontWeight: "800", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_800ExtraBold", letterSpacing: -0.5 }}>
                {currentUser.name}
              </Typography>
              <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>
                {currentUser.email}
              </Typography>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Typography style={{ fontSize: 12, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
                Groups
              </Typography>
              <Typography style={{ fontSize: 24, fontWeight: "800", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_800ExtraBold" }}>
                {groups.length}
              </Typography>
            </View>
            <View style={{ width: 1, height: 32, backgroundColor: SEPARATOR, marginHorizontal: 16 }} />
            <View style={{ flex: 1 }}>
              <Typography style={{ fontSize: 12, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
                Owed
              </Typography>
              <Typography style={{ fontSize: 24, fontWeight: "800", color: TEXT_SUCCESS, fontFamily: "PlusJakartaSans_800ExtraBold" }}>
                +{preferredCurrency.symbol}{owedToYou.toFixed(0)}
              </Typography>
            </View>
            {youOwe > 0 && (
              <>
                <View style={{ width: 1, height: 32, backgroundColor: SEPARATOR, marginHorizontal: 16 }} />
                <View style={{ flex: 1 }}>
                  <Typography style={{ fontSize: 12, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
                    Owe
                  </Typography>
                  <Typography style={{ fontSize: 24, fontWeight: "800", color: TEXT_DANGER, fontFamily: "PlusJakartaSans_800ExtraBold" }}>
                    -{preferredCurrency.symbol}{youOwe.toFixed(0)}
                  </Typography>
                </View>
              </>
            )}
          </View>
        </FocusAwareView>

        {/* Preferences */}
        <FocusAwareView delay={200} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 40 }}>
          <SectionLabel>Preferences</SectionLabel>
          <View>
            <SettingRow
              icon={icons.Moon}
              title="Dark Mode"
              rightElement={<Switch isSelected={darkMode} onSelectedChange={handleThemeToggle} />}
            />
            <SettingRow
              icon={icons.Bell}
              title="Notifications"
              rightElement={<Switch isSelected={notifs} onSelectedChange={setNotifs} />}
            />
            
            {/* Custom Edge-to-Edge wrapper for Currency Selector to match the new look */}
            <View style={{ paddingVertical: 16 }}>
              <CurrencySelector value={preferredCurrency.code} onChange={handleCurrencyChange} />
            </View>
          </View>
        </FocusAwareView>

        {/* Sign Out */}
        <FocusAwareView delay={300} style={{ paddingHorizontal: SECTION_PAD }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => signOut()}
            style={({ pressed }) => ({
              backgroundColor: "transparent",
              opacity: pressed ? 0.5 : 1,
              borderWidth: 1,
              borderColor: SEPARATOR,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
            })}
          >
            <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", letterSpacing: -0.3 }}>
              Sign Out
            </Typography>
          </Pressable>
        </FocusAwareView>
      </ScrollView>
    </FocusAwareView>
  );
}
