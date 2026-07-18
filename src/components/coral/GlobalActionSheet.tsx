import type { ComponentType, JSX } from "react";
import { Pressable, Text, View } from "react-native";
import type { Href } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  CalendarPlus,
  CircleDollarSign,
  ReceiptText,
  UserPlus,
  UsersRound,
} from "lucide-react-native";

import { GLOBAL_ACTIONS, type GlobalActionId } from "@/features/navigation/shell";
import { CoralSheet } from "./CoralSheet";
import { useCoralColors } from "./useCoral";

type ActionIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const ICONS: Record<GlobalActionId, ActionIcon> = {
  "add-expense": ReceiptText,
  "settle-up": CircleDollarSign,
  "create-group": UsersRound,
  "add-person": UserPlus,
  "schedule-expense": CalendarPlus,
};

export interface GlobalActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onActionPress: (href: Href) => void;
}

export function GlobalActionSheet({
  visible,
  onClose,
  onActionPress,
}: GlobalActionSheetProps): JSX.Element {
  const coral = useCoralColors();

  return (
    <CoralSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 22,
            letterSpacing: -0.025 * 22,
            color: coral.foreground,
          }}
        >
          What would you like to do?
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 14,
            lineHeight: 20,
            color: coral.muted,
            marginTop: 6,
            marginBottom: 14,
          }}
        >
          Choose an action. People and groups are selected inside the focused flow.
        </Text>

        {GLOBAL_ACTIONS.map((action) => {
          const Icon = ICONS[action.id];
          const primary = action.id === "add-expense";
          return (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => {
                void Haptics.selectionAsync();
                onActionPress(action.href);
              }}
              style={({ pressed }) => ({
                minHeight: 56,
                flexDirection: "row",
                alignItems: "center",
                gap: 13,
                paddingHorizontal: 14,
                marginBottom: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: primary ? coral.accent : coral.border,
                backgroundColor: primary ? coral.accent : coral.surface,
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Icon
                size={22}
                color={primary ? coral.inkOnAccent : coral.foreground}
                strokeWidth={1.9}
              />
              <Text
                style={{
                  flex: 1,
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: primary ? coral.inkOnAccent : coral.foreground,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Add actions"
          onPress={onClose}
          style={({ pressed }) => ({
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 15,
              color: coral.muted,
            }}
          >
            Close
          </Text>
        </Pressable>
      </View>
    </CoralSheet>
  );
}
