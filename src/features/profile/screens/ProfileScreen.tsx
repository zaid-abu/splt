
import { useRouter } from "expo-router";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { Uniwind } from "uniwind";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Pressable, Switch } from "react-native";
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
import { Text } from "@/components/primitives/Text";
import { Card } from "@/components/ui/Card";
import { formatAmount } from "@/components/ui/AmountDisplay";

import { SettingsItem } from "@/features/profile/components/SettingsItem";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="sectionLabel" color="muted" className="mb-4 px-1">
      {children}
    </Text>
  );
}

export default function ProfileScreen(): JSX.Element {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const insets = useSafeAreaInsets();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);

  const owedToYou = balancesUtil.getTotalOwedToMe(
    userId,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );
  const youOwe = Math.abs(
    balancesUtil.getTotalIOwe(
      userId,
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
  if (!currentUser) return <></>;

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
  };

  const handleThemeToggle = (value: boolean) => {
    setDarkMode(value);
    Uniwind.setTheme(value ? "dark" : "light");
  };

  return (
    <FocusAwareView className="flex-1 bg-background">
      <StatusBar style="light" />

      {/* Header */}
      <FocusAwareView delay={0} className="px-6 pb-4">
        <View style={{ paddingTop: insets.top + 16 }}>
          <Text variant="screenTitle" color="foreground">
            Profile.
          </Text>
        </View>
      </FocusAwareView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Stats Card */}
        <FocusAwareView delay={100} className="px-6 mb-10">
          <Card className="p-6">
            <View className="flex-row items-center mb-8">
              <AppUserAvatar user={currentUser} size="lg" />
              <View className="ml-4 flex-1">
                <Text variant="amountSmall" color="foreground">
                  {currentUser.name}
                </Text>
                <Text variant="bodySmall" color="muted" className="mt-1">
                  {currentUser.email}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between border-t border-border pt-6">
              <View className="flex-1 items-center">
                <Text variant="sectionLabel" color="muted" className="mb-1">
                  Groups
                </Text>
                <Text variant="amountSmall" color="foreground">
                  {groups.length}
                </Text>
              </View>
              <View className="w-px h-10 bg-border mx-2" />
              <View className="flex-1 items-center">
                <Text variant="sectionLabel" color="muted" className="mb-1">
                  Owed
                </Text>
                <Text variant="amountSmall" color="success">
                  +{formatAmount(owedToYou, preferredCurrency.code)}
                </Text>
              </View>
              {youOwe > 0 && (
                <>
                  <View className="w-px h-10 bg-border mx-2" />
                  <View className="flex-1 items-center">
                    <Text variant="sectionLabel" color="muted" className="mb-1">
                      Owe
                    </Text>
                    <Text variant="amountSmall" color="danger">
                      -{formatAmount(youOwe, preferredCurrency.code)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Card>
        </FocusAwareView>

        {/* Preferences */}
        <FocusAwareView delay={200} className="px-6 mb-10">
          <SectionLabel>Preferences</SectionLabel>
          <Card className="overflow-hidden">
            <SettingsItem
              icon="Moon"
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              rightElement={<Switch value={darkMode} onValueChange={handleThemeToggle} />}
            />
            <SettingsItem
              icon="Bell"
              title="Notifications"
              subtitle="Manage push notifications"
              rightElement={<Switch value={notifs} onValueChange={setNotifs} />}
            />
            <View className="py-2 px-4 border-t border-divider">
              <CurrencySelector value={preferredCurrency.code} onChange={handleCurrencyChange} />
            </View>
          </Card>
        </FocusAwareView>

        {/* Account */}
        <FocusAwareView delay={300} className="px-6">
          <SectionLabel>Account</SectionLabel>
          <Card className="overflow-hidden">
            <SettingsItem
              icon="LogOut"
              title="Sign Out"
              subtitle="Log out of your account"
              onPress={() => signOut()}
              isDanger
              isLast
            />
          </Card>
        </FocusAwareView>
      </ScrollView>
    </FocusAwareView>
  );
}
