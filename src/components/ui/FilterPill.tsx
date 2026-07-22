import {  Pressable , Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui/hooks/useUI";

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function FilterPill({ label, isActive, onPress }: FilterPillProps): React.JSX.Element {
  const { color, radius } = useUI();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        backgroundColor: isActive ? color.text : color.control,
        borderWidth: 1,
        borderColor: isActive ? color.text : color.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 13,
          fontFamily: "InstrumentSans_600SemiBold",
          color: isActive ? color.textInverse : color.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
