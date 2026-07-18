import type { JSX } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight, LogOut } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { Eyebrow } from "@/components/coral/Eyebrow";
import { CoralButton } from "@/components/coral/CoralButton";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { ContextBar } from "@/components/coral/ContextBar";
import { useCoralColors } from "@/components/coral/useCoral";
import { useUI } from "@/components/ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUIStore, type ThemePreference } from "@/store/useUIStore";

import { useProfile } from "@/features/profile/hooks/useProfile";

interface SettingRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingRow({ title, subtitle, onPress, rightElement }: SettingRowProps) {
  const { color } = useUI();

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 52,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <View>
        <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: color.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 13,
              color: color.muted,
              marginTop: 3,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement ?? <ChevronRight size={20} color={color.muted} strokeWidth={1.5} />}
    </Pressable>
  );
}

const APPEARANCE_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const APPEARANCE_LABELS: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { color } = useUI();

  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { currentUser, signOut } = useProfile();

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signOut();
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Settings" onBack={() => router.canGoBack() && router.back()} />
      <ContextBar title="Settings" backTo={{ label: "Home", route: "/home" }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginTop: 24,
          marginBottom: 8,
        }}
      >
        {currentUser ? <AppUserAvatar user={currentUser} size="lg" /> : null}
        <View>
          <Text
            style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 18, color: color.text }}
          >
            {currentUser?.name}
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 14,
              color: color.muted,
              marginTop: 2,
            }}
          >
            {currentUser?.email}
          </Text>
        </View>
      </View>

      <Eyebrow>Preferences</Eyebrow>

      <SettingRow
        title="Default currency"
        subtitle="USD"
        onPress={() => router.push("/currencies")}
      />

      <SettingRow
        title="Notifications"
        subtitle="Push and email"
        onPress={() => router.push("/notifications")}
      />

      <SettingRow title="Payment methods" subtitle="Cash and bank transfer" />

      <View style={{ marginTop: 6, marginBottom: 6 }}>
        <SettingRow title="Appearance" subtitle={APPEARANCE_LABELS[theme]} rightElement={null} />
        <CoralSegment
          options={APPEARANCE_OPTIONS}
          selected={theme}
          onSelect={(value) => setTheme(value as ThemePreference)}
        />
      </View>

      <SettingRow title="Privacy and security" subtitle="Face ID enabled" />

      <Eyebrow>Account</Eyebrow>

      <SettingRow title="Export your data" subtitle="" />

      <SettingRow title="Help and support" subtitle="" />

      <View style={{ marginTop: 22, marginBottom: 40 }}>
        <CoralButton label="Sign out" onPress={handleSignOut} variant="danger" />
      </View>
    </CoralScreen>
  );
}
