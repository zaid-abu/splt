import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, Animated } from "react-native";
import type { ViewStyle } from "react-native";

interface PressableScaleProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  scaleTo?: number;
  style?: ViewStyle;
}

export function PressableScale({ children, onPress, disabled, scaleTo = 0.97, style }: PressableScaleProps): React.JSX.Element {
  const scale = useMemo(() => new Animated.Value(1), []);
  const pressIn = () => { Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, mass: 0.3, stiffness: 200, damping: 12 }).start(); };
  const pressOut = () => { Animated.spring(scale, { toValue: 1, useNativeDriver: true, mass: 0.3, stiffness: 200, damping: 12 }).start(); };
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable accessibilityRole="button" onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} disabled={disabled}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
