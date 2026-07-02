/**
 * Profile Screen
 *
 * HeroUI components used:
 * - Avatar, Avatar.Fallback
 * - Card, Card.Body, Card.Title, Card.Description
 * - ListGroup + all sub-components
 * - Button
 * - Switch
 * - Separator
 * - Typography
 * - Chip
 */
import { Switch, Typography, Button, ListGroup, useThemeColor } from "heroui-native";
import { useRouter } from "expo-router";
import { FocusAwareView } from "@/components/PageAnimator";
import { Uniwind } from "uniwind";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import { useAuth } from "@/context/AppContext";
import { useDataStore } from "@/store/useDataStore";
import { useUIStore } from "@/store/useUIStore";
import type { Currency } from "@/types";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { CurrencySelector } from "@/components/CurrencySelector";

function SettingItem({ icon: Icon, title, subtitle, color, onPress, rightElement, isLast }: any) {
  return (
    <ListGroup.Item
      onPress={onPress}
      className={`p-4 ${!isLast ? "border-b border-border/50" : ""}`}
    >
      <ListGroup.ItemPrefix>
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} color={color} strokeWidth={2.5} />
        </View>
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle className="font-bold text-foreground">{title}</ListGroup.ItemTitle>
        {subtitle && (
          <ListGroup.ItemDescription className="text-muted-foreground mt-0.5">
            {subtitle}
          </ListGroup.ItemDescription>
        )}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        {rightElement || <icons.ChevronRight size={20} className="text-muted-foreground" />}
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

export default function ProfileScreen(): JSX.Element {
  const { currentUser } = useAuth();
  const groups = useDataStore(s => s.groups);
  const getTotalOwedToMe = useDataStore(s => s.getTotalOwedToMe);
  const getTotalIOwe = useDataStore(s => s.getTotalIOwe);
  const preferredCurrency = useUIStore(s => s.preferredCurrency);
  const setCurrency = useUIStore(s => s.setCurrency);
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [notifs, setNotifs] = useState(true);

  const owedToMe = getTotalOwedToMe(currentUser.id);
  const iOwe = getTotalIOwe(currentUser.id);

  const accentColor = useThemeColor("accent" as any) as unknown as string;
  const warningColor = useThemeColor("warning" as any) as unknown as string;
  const successColor = useThemeColor("success" as any) as unknown as string;
  const mutedForeground = useThemeColor("muted-foreground" as any) as unknown as string;
  const primaryColor = useThemeColor("primary" as any) as unknown as string;

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
  };

  const handleThemeToggle = (value: boolean) => {
    setDarkMode(value);
    Uniwind.setTheme(value ? "dark" : "light");
  };

  return (
    <FocusAwareView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
        <StatusBar style="dark" />
        <ScrollView
          style={{ flex: 1 }}
          className="bg-background"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ─────────────────────────────────── */}
          <FocusAwareView delay={0} className="px-6 pt-4 mb-6">
            <Typography type="h2" className="font-black tracking-tight text-[28px]">
              Profile
            </Typography>
          </FocusAwareView>

          {/* ── User card ───────────────────────────────── */}
          <FocusAwareView delay={100} className="px-6 mb-6">
            <View className="bg-white rounded-[32px] p-6 items-center border border-border">
              <View className="mb-4">
                <AppUserAvatar user={currentUser} size="lg" />
              </View>
              <Typography type="h3" className="font-black tracking-tight text-[24px] mb-1">
                {currentUser.name}
              </Typography>
              <Typography type="body" className="text-muted-foreground font-medium mb-6">
                {currentUser.email}
              </Typography>

              {/* Stats Row */}
              <View className="flex-row gap-3 w-full">
                <View className="flex-1 bg-secondary rounded-[16px] py-3 items-center">
                  <Typography type="body-sm" className="text-muted-foreground font-medium mb-0.5">
                    Groups
                  </Typography>
                  <Typography type="body" className="font-black text-foreground">
                    {groups.length}
                  </Typography>
                </View>
                <View className="flex-1 bg-success/10 rounded-[16px] py-3 items-center">
                  <Typography type="body-sm" className="text-success font-medium mb-0.5">
                    Owed
                  </Typography>
                  <Typography type="body" className="font-black text-success">
                    +{preferredCurrency.symbol}
                    {owedToMe.toFixed(0)}
                  </Typography>
                </View>
                {iOwe > 0 && (
                  <View className="flex-1 bg-danger/10 rounded-[16px] py-3 items-center">
                    <Typography type="body-sm" className="text-danger font-medium mb-0.5">
                      Owe
                    </Typography>
                    <Typography type="body" className="font-black text-danger">
                      -{preferredCurrency.symbol}
                      {iOwe.toFixed(0)}
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </FocusAwareView>

          {/* ── Account settings ───────────────────────── */}
          <FocusAwareView delay={200} className="px-6 mb-4">
            <Typography type="body-xs" className="text-muted font-bold tracking-widest mb-3 ml-2">
              ACCOUNT
            </Typography>
            <View className="rounded-[24px]">
              <ListGroup className="bg-white rounded-[24px] overflow-hidden border border-border">
                <SettingItem
                  icon={icons.User}
                  title="Edit Profile"
                  subtitle="Name, email, photo"
                  color={accentColor}
                  onPress={() => {}}
                />
                <SettingItem
                  icon={icons.Bell}
                  title="Notifications"
                  subtitle="Push, email alerts"
                  color={warningColor}
                  rightElement={<Switch isSelected={notifs} onSelectedChange={setNotifs} />}
                />
                <SettingItem
                  icon={icons.Shield}
                  title="Security"
                  subtitle="Password, biometrics"
                  color={successColor}
                  onPress={() => {}}
                  isLast
                />
              </ListGroup>
            </View>
          </FocusAwareView>

          {/* ── Preferences ────────────────────────────── */}
          <FocusAwareView delay={300} className="px-6 mb-4 z-50">
            <Typography type="body-xs" className="text-muted font-bold tracking-widest mb-3 ml-2">
              PREFERENCES
            </Typography>
            <View className="gap-3">
              <ListGroup className="bg-white rounded-[24px] border border-border overflow-hidden">
                <SettingItem
                  icon={icons.Moon}
                  title="Dark Mode"
                  color={mutedForeground}
                  rightElement={
                    <Switch isSelected={darkMode} onSelectedChange={handleThemeToggle} />
                  }
                />
                <SettingItem
                  icon={icons.CreditCard}
                  title="Payment Methods"
                  subtitle="Link bank account, card"
                  color={primaryColor}
                  onPress={() => {}}
                  isLast
                />
              </ListGroup>

              <CurrencySelector value={preferredCurrency.code} onChange={handleCurrencyChange} />
            </View>
          </FocusAwareView>

          {/* ── About ──────────────────────────────────── */}
          <FocusAwareView delay={400} className="px-6 mb-6">
            <Typography type="body-xs" className="text-muted font-bold tracking-widest mb-3 ml-2">
              ABOUT
            </Typography>
            <View className="rounded-[24px]">
              <ListGroup className="bg-white rounded-[24px] overflow-hidden border border-border">
                <SettingItem
                  icon={icons.HelpCircle}
                  title="Help & Support"
                  color={accentColor}
                  onPress={() => {}}
                />
                <SettingItem
                  icon={icons.FileText}
                  title="Privacy Policy"
                  color={primaryColor}
                  onPress={() => {}}
                />
                <SettingItem
                  icon={icons.Info}
                  title="Version"
                  color={primaryColor}
                  rightElement={
                    <View className="bg-secondary px-3 py-1 rounded-full">
                      <Typography type="body-sm" className="font-bold text-muted-foreground">
                        1.0.0
                      </Typography>
                    </View>
                  }
                  isLast
                />
              </ListGroup>
            </View>
          </FocusAwareView>

          {/* ── Sign Out ────────────────────────────────── */}
          <FocusAwareView delay={500} className="px-6">
            <Button
              variant="danger-soft"
              size="lg"
              className="rounded-[20px]"
              onPress={() => router.replace("/(auth)/welcome")}
            >
              <Button.Label className="font-bold text-danger">Sign Out</Button.Label>
            </Button>
          </FocusAwareView>
        </ScrollView>
      </SafeAreaView>
    </FocusAwareView>
  );
}
