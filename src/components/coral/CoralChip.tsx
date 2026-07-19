import { Pressable, Text, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "./useCoral";

type CoralChipProps = {
  label: string;
  isActive?: boolean;
  onPress: () => void;
};

export function CoralChip({ label, isActive = false, onPress }: CoralChipProps) {
  const coral = useCoralColors();
  const minHeight = Platform.OS === "ios" ? 44 : 48;
  const borderRadius = Platform.OS === "ios" ? 22 : 24;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight,
        paddingHorizontal: 16,
        borderRadius,
        backgroundColor: isActive ? coral.foreground : coral.surface,
        borderWidth: 1,
        borderColor: isActive ? coral.foreground : coral.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 13,
          color: isActive ? coral.inkOnAccent : coral.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
