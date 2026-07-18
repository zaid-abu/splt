import type { ComponentType } from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { LucideProps } from "lucide-react-native";
import { CalendarDays, ReceiptText, UserPlus, UsersRound } from "lucide-react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { useAuth } from "@/context/AppContext";
import { useAppToast } from "@/hooks/useAppToast";
import { AuthService } from "@/services/api/auth";

const actions: Array<{
  title: string;
  detail: string;
  destination: "/group/new" | "/friend/new" | "/expense/new" | "/recurring/new";
  icon: ComponentType<LucideProps>;
  tone: "default" | "green" | "coral" | "amber";
}> = [
  {
    title: "Create a group",
    detail: "Start a trip, night out, or household",
    destination: "/group/new",
    icon: UsersRound,
    tone: "default",
  },
  {
    title: "Add people",
    detail: "Find friends already using Splt",
    destination: "/friend/new",
    icon: UserPlus,
    tone: "green",
  },
  {
    title: "Add your first expense",
    detail: "Choose a person or group in the flow",
    destination: "/expense/new",
    icon: ReceiptText,
    tone: "coral",
  },
  {
    title: "Schedule a recurring bill",
    detail: "Create it inside a household group",
    destination: "/recurring/new",
    icon: CalendarDays,
    tone: "amber",
  },
];

export default function FirstActionScreen() {
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { completeActivation, currentUser } = useAuth();
  const [submitting, setSubmitting] = useState<string | null>(null);

  const continueTo = async (destination: (typeof actions)[number]["destination"] | "/home") => {
    setSubmitting(destination);
    try {
      const user = await AuthService.markActivationSeen(currentUser.id);
      completeActivation(user, destination);
    } catch (error) {
      toast.show({
        label: "Could not continue",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "danger",
        placement: "top",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const tones = {
    default: coral.avatarInk,
    green: coral.positive,
    coral: coral.accent,
    amber: coral.warning,
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Make Splt yours" />
      <LargeTitle>What would help first?</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          color: coral.muted,
          marginBottom: 24,
        }}
      >
        Choose one useful starting point. Everything else stays available from Home.
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 15,
            color: coral.foreground,
          }}
        >
          Start with an action
        </Text>
        <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, color: coral.muted }}>
          Optional
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              disabled={submitting !== null}
              onPress={() => void continueTo(action.destination)}
              style={({ pressed }) => ({
                minHeight: 72,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: coral.border,
                backgroundColor: coral.surface,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                opacity: pressed || submitting === action.destination ? 0.65 : 1,
              })}
            >
              <Icon size={24} color={tones[action.tone]} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 16,
                    color: coral.foreground,
                  }}
                >
                  {action.title}
                </Text>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 14,
                    lineHeight: 20,
                    color: coral.muted,
                  }}
                >
                  {action.detail}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ marginTop: 18 }}>
        <CoralButton
          label="Skip for now"
          variant="secondary"
          onPress={() => void continueTo("/home")}
          loading={submitting === "/home"}
          disabled={submitting !== null && submitting !== "/home"}
        />
      </View>
    </CoralScreen>
  );
}
