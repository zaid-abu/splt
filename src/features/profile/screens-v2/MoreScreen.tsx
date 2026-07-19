import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Bell, ChevronRight, TrendingUp, Wallet } from "lucide-react-native";

import {
  CoralButton,
  CoralScreen,
  CoralSegment,
  CoralTopBar,
} from "@/components/coral";
import { useCoralColors } from "@/components/coral/useCoral";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useNotifications } from "@/features/notifications/queries/useNotifications";
import { SHELL_HREFS } from "@/features/navigation/shell";
import { useUIStore, type ThemePreference } from "@/store/useUIStore";

const APPEARANCE_OPTIONS = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

function SectionHeading({ title }: { title: string }) {
  const coral = useCoralColors();
  return (
    <Text
      style={{
        fontFamily: "InstrumentSans_600SemiBold",
        fontSize: 15,
        color: coral.foreground,
        marginTop: 24,
        marginBottom: 8,
        paddingHorizontal: 2,
      }}
    >
      {title}
    </Text>
  );
}

function CardRow({
  title,
  subtitle,
  onPress,
  left,
  isLast,
  value,
  valueTone,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  left?: React.ReactNode;
  isLast?: boolean;
  value?: string;
  valueTone?: "positive" | "negative" | "neutral" | "warning";
}) {
  const coral = useCoralColors();
  const pillColors = {
    positive: { text: coral.positive, bg: coral.positiveSoft },
    negative: { text: coral.negative, bg: coral.negativeSoft },
    neutral: { text: coral.muted, bg: coral.border },
    warning: { text: coral.warning, bg: coral.warningSoft },
  };
  const pc = valueTone ? pillColors[valueTone] : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        minHeight: 64,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 12,
        opacity: pressed ? 0.65 : 1,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: coral.border,
      })}
    >
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 14,
            color: coral.foreground,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>
      {value && pc ? (
        <View
          style={{
            backgroundColor: pc.bg,
            borderRadius: 999,
            paddingHorizontal: 9,
            paddingVertical: 4,
            minHeight: 30,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "IBMPlexMono_600SemiBold",
              fontSize: 11,
              color: pc.text,
            }}
          >
            {value}
          </Text>
        </View>
      ) : (
        <ChevronRight size={20} color={coral.muted} strokeWidth={1.5} />
      )}
    </Pressable>
  );
}

function CardContainer({ children }: { children: React.ReactNode }) {
  const coral = useCoralColors();
  return (
    <View
      style={{
        backgroundColor: coral.surface,
        borderWidth: 1,
        borderColor: coral.border,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  const coral = useCoralColors();
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: coral.avatarSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

export default function MoreScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { currentUser, preferredCurrency, signOut } = useProfile();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { data: notifications = [] } = useNotifications(currentUser?.id);

  const pendingCount = notifications.filter(
    (n) => n.kind === "friend_request" || n.kind === "group_invite",
  ).length;

  return (
    <CoralScreen>
      <CoralTopBar title="More" />

      <Text
        style={{
          fontFamily: "InstrumentSans_700Bold",
          fontSize: 12,
          color: coral.muted,
          marginBottom: 4,
          letterSpacing: 0.5,
        }}
      >
        Splt
      </Text>

      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 30,
          color: coral.foreground,
          letterSpacing: -0.035 * 30,
          lineHeight: 30 * 1.08,
          marginBottom: 8,
        }}
      >
        More
      </Text>

      <SectionHeading title="Your account" />

      <CardContainer>
        <CardRow
          title={currentUser.name || "Profile"}
          subtitle="Profile and security"
          left={
            currentUser.id ? (
              <AppUserAvatar user={currentUser} size="sm" />
            ) : undefined
          }
          onPress={() => router.push("/profile/edit")}
        />
        <CardRow
          title="Notifications"
          subtitle={
            pendingCount > 0
              ? `${pendingCount} request${pendingCount > 1 ? "s" : ""} need${pendingCount === 1 ? "s" : ""} a response`
              : "Requests and account events"
          }
          left={
            <IconBox>
              <Bell size={20} color={coral.avatarInk} strokeWidth={1.5} />
            </IconBox>
          }
          isLast
          value={pendingCount > 0 ? `${pendingCount} new` : undefined}
          valueTone={pendingCount > 0 ? "negative" : undefined}
          onPress={() => router.push(SHELL_HREFS.notifications)}
        />
      </CardContainer>

      <SectionHeading title="Money tools" />

      <CardContainer>
        <CardRow
          title="Insights"
          subtitle="Spending trends and categories"
          left={
            <IconBox>
              <TrendingUp size={20} color={coral.avatarInk} strokeWidth={1.5} />
            </IconBox>
          }
          onPress={() => router.push(SHELL_HREFS.analytics)}
        />
        <CardRow
          title="Currencies"
          subtitle={`${preferredCurrency.code} - ${preferredCurrency.name}`}
          left={
            <IconBox>
              <Wallet size={20} color={coral.avatarInk} strokeWidth={1.5} />
            </IconBox>
          }
          isLast
          onPress={() => router.push(SHELL_HREFS.currencies)}
        />
      </CardContainer>

      <SectionHeading title="Appearance" />

      <CardContainer>
        <View style={{ padding: 12, gap: 10 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 13,
              lineHeight: 19,
              color: coral.muted,
            }}
          >
            Choose how Splt looks on this device.
          </Text>
          <CoralSegment
            options={[...APPEARANCE_OPTIONS]}
            selected={theme}
            onSelect={(value) => setTheme(value as ThemePreference)}
          />
        </View>
      </CardContainer>

      <View style={{ marginTop: 30, marginBottom: 18 }}>
        <CoralButton label="Sign out" variant="danger" onPress={() => signOut()} />
      </View>
    </CoralScreen>
  );
}
