import { View, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "./useCoral";

type SegmentOption = { label: string; value: string };

type CoralSegmentProps = {
  options: SegmentOption[];
  selected: string;
  onSelect: (value: string) => void;
};

export function CoralSegment({ options, selected, onSelect }: CoralSegmentProps) {
  const coral = useCoralColors();
  const minHeight = Platform.OS === "ios" ? 44 : 48;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: coral.border,
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
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(option.value);
            }}
            style={{
              flex: 1,
              minHeight,
              borderRadius: 11,
              backgroundColor: isActive ? coral.surface : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 13,
                fontWeight: isActive ? "600" : "400",
                color: coral.foreground,
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
