import { useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View, Text, Pressable, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "./useCoral";

type SegmentOption = { label: string; value: string };

type CoralSegmentProps = {
  options: SegmentOption[];
  selected: string;
  onSelect: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

function TabPill({
  label,
  isActive,
  onPress,
  minHeight,
  coral: c,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  minHeight: number;
  coral: any;
}) {
  const scale = useSharedValue(isActive ? 1 : 0.92);
  const opacity = useSharedValue(isActive ? 1 : 0.65);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0.92, { damping: 15, stiffness: 250, mass: 0.5 });
    opacity.value = withSpring(isActive ? 1 : 0.65, { damping: 15, stiffness: 250, mass: 0.5 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight,
        borderRadius: 11,
        backgroundColor: isActive ? c.surface : "transparent",
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
      <Animated.View style={animatedStyle}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 13,
            fontWeight: "600",
            color: isActive ? c.foreground : c.muted,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function CoralSegment({ options, selected, onSelect, style }: CoralSegmentProps) {
  const coral = useCoralColors();
  const minHeight = Platform.OS === "ios" ? 44 : 48;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          backgroundColor: coral.border,
          borderRadius: 14,
          padding: 3,
          gap: 3,
        },
        style,
      ]}
    >
      {options.map((option) => (
        <TabPill
          key={option.value}
          label={option.label}
          isActive={option.value === selected}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(option.value);
          }}
          minHeight={minHeight}
          coral={coral}
        />
      ))}
    </View>
  );
}
