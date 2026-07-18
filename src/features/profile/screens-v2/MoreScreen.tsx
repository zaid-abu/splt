import type { JSX, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";

import {
  CoralButton,
  CoralScreen,
  CoralSegment,
  CoralTopBar,
  Eyebrow,
  LargeTitle,
} from "@/components/coral";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { SHELL_HREFS } from "@/features/navigation/shell";
import { useUIStore, type ThemePreference } from "@/store/useUIStore";

interface MoreRowProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  left?: ReactNode;
}

const APPEARANCE_OPTIONS = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

function MoreRow({ title, subtitle, onPress, left }: MoreRowProps) {
  const { color } = useUI();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 16,
            color: color.text,
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 13,
            color: color.muted,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
    </Pressable>
  );
}

export default function MoreScreen(): JSX.Element {
  const router = useRouter();
  const { color } = useUI();
  const { currentUser, preferredCurrency, signOut } = useProfile();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return (
    <CoralScreen>
      <CoralTopBar title="More" />
      <LargeTitle>More.</LargeTitle>

      <Eyebrow>Your account</Eyebrow>
      <MoreRow
        title={currentUser.name || "Profile"}
        subtitle="Edit your name and avatar"
        left={currentUser.id ? <AppUserAvatar user={currentUser} size="sm" /> : undefined}
        onPress={() => router.push("/profile/edit")}
      />
      <MoreRow
        title="Change password"
        subtitle="Update your account password"
        onPress={() => router.push("/profile/change-password")}
      />
      <MoreRow
        title="Notifications"
        subtitle="Requests and account events"
        onPress={() => router.push(SHELL_HREFS.notifications)}
      />

      <Eyebrow>Money tools</Eyebrow>
      <MoreRow
        title="Insights"
        subtitle="Spending trends and categories"
        onPress={() => router.push(SHELL_HREFS.analytics)}
      />
      <MoreRow
        title="Currencies"
        subtitle={`${preferredCurrency.code} home currency`}
        onPress={() => router.push(SHELL_HREFS.currencies)}
      />

      <Eyebrow>Appearance</Eyebrow>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 13,
          lineHeight: 19,
          color: color.muted,
          marginBottom: 10,
        }}
      >
        Choose how Splt looks on this device.
      </Text>
      <CoralSegment
        options={[...APPEARANCE_OPTIONS]}
        selected={theme}
        onSelect={(value) => setTheme(value as ThemePreference)}
      />

      <View style={{ marginTop: 30, marginBottom: 18 }}>
        <CoralButton label="Sign out" variant="danger" onPress={() => signOut()} />
      </View>
    </CoralScreen>
  );
}
