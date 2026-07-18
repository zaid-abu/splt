import type { ReactNode } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import type { TextInputProps } from "react-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";
import { useUIStore } from "@/store/useUIStore";
import { useCoralColors } from "./useCoral";
import { CoralSearchField } from "./CoralSearchField";
import { hexToRgba } from "@/utils/theme";

type CommandItem = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
};

type CommandSheetProps = TextInputProps & {
  visible: boolean;
  onClose: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  commands: CommandItem[];
  primaryAction?: { label: string; onPress: () => void };
};

export function CommandSheet({
  visible,
  onClose,
  searchValue,
  onSearchChange,
  commands,
  primaryAction,
  ...searchProps
}: CommandSheetProps) {
  const isDark = useUIStore((s) => s.isDarkMode);
  const { color } = useUI();
  const coral = useCoralColors();
  const isIOS = Platform.OS === "ios";

  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          backgroundColor: "rgba(15, 25, 40, 0.34)",
        }}
        pointerEvents={visible ? "auto" : "none"}
        onPress={onClose}
      >
        {null}
      </Pressable>

      <BlurView
        intensity={isIOS ? 90 : 60}
        tint={isDark ? "dark" : "light"}
        blurReductionFactor={2}
        style={{
          position: "absolute",
          left: isIOS ? 8 : 0,
          right: isIOS ? 8 : 0,
          bottom: isIOS ? 8 : 0,
          zIndex: 21,
          borderRadius: isIOS ? 24 : 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: isIOS ? 1 : 0,
          borderTopWidth: 1,
          borderColor: hexToRgba(color.border, 0.8),
          paddingTop: 10,
          paddingHorizontal: 16,
          paddingBottom: 20,
          transform: [{ translateY: visible ? 0 : 400 }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 10,
          backgroundColor:
            Platform.OS === "android"
              ? hexToRgba(isDark ? coral.surface : coral.bg, 0.92)
              : "transparent",
        }}
      >
        <View
          style={{
            width: 38,
            height: 5,
            borderRadius: 4,
            backgroundColor: color.border,
            alignSelf: "center",
            marginTop: 2,
            marginBottom: 14,
          }}
        />

        <CoralSearchField
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder="Find a person, group or expense"
          {...searchProps}
        />

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginVertical: 18,
          }}
        >
          {commands.map((cmd) => (
            <Pressable
              key={cmd.label}
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                cmd.onPress();
              }}
              style={{
                width: "25%",
                minHeight: 72,
                paddingVertical: 5,
                paddingHorizontal: 2,
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: color.surface,
                  borderWidth: 1,
                  borderColor: color.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cmd.icon}
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 11,
                  letterSpacing: 0.01 * 11,
                  color: color.text,
                }}
              >
                {cmd.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {primaryAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              primaryAction.onPress();
            }}
            style={({ pressed }) => ({
              minHeight: 52,
              width: "100%",
              borderRadius: 14,
              backgroundColor: coral.accent,
              paddingHorizontal: 18,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.82 : 1,
              marginTop: 4,
              marginBottom: 4,
            })}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 16,
                letterSpacing: 0.02 * 16,
                color: coral.inkOnAccent,
                fontWeight: "600",
              }}
            >
              {primaryAction.label}
            </Text>
          </Pressable>
        ) : null}
      </BlurView>
    </>
  );
}
