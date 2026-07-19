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
              ...(isActive
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 5,
                    elevation: 3,
                  }
                : {}),
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 13,
                fontWeight: "600",
                color: isActive ? coral.foreground : coral.muted,
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
