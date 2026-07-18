import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Pressable, Animated, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "./useCoral";

type FloatingCommandButtonProps = {
  onPress: () => void;
  icon: ReactNode;
};

export function FloatingCommandButton({ onPress, icon }: FloatingCommandButtonProps) {
  const coral = useCoralColors();
  const isIOS = Platform.OS === "ios";
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.2],
  });

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1.04, 1.16],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPress();
      }}
      style={({ pressed }) => ({
        position: "absolute",
        zIndex: 7,
        right: isIOS ? 22 : 16,
        bottom: isIOS ? 28 : 24,
        width: isIOS ? 58 : 62,
        height: isIOS ? 58 : 62,
        borderRadius: isIOS ? 9999 : 16,
        backgroundColor: coral.accent,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ translateY: pressed ? 2 : 0 }, { scale: pressed ? 0.97 : 1 }],
        shadowColor: coral.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.32,
        shadowRadius: 10,
        elevation: 8,
      })}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: isIOS ? 9999 : 16,
          backgroundColor: coral.accent,
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />
      {icon}
    </Pressable>
  );
}
