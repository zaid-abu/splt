import { View, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";

type SegmentOption = { label: string; value: string };

type CoralSegmentProps = {
  options: SegmentOption[];
  selected: string;
  onSelect: (value: string) => void;
};

export function CoralSegment({ options, selected, onSelect }: CoralSegmentProps) {
  const { color } = useUI();
  const minHeight = Platform.OS === "ios" ? 44 : 48;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: color.border,
        borderRadius: 14,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(option.value);
            }}
            style={{
              flex: 1,
              minHeight,
              borderRadius: 11,
              backgroundColor: isActive ? color.surface : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 13,
                fontWeight: isActive ? "600" : "400",
                color: color.text,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
