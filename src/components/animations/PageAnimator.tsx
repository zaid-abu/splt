import type { JSX, PropsWithChildren } from "react";
import { useCallback } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { useReducedMotion } from "@/utils/useReducedMotion";

interface FocusAwareViewProps extends PropsWithChildren {
  delay?: number;
  className?: string;
  style?: any;
}

export function FocusAwareView({
  children,
  delay = 0,
  className,
  style,
}: FocusAwareViewProps): JSX.Element {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  const translateY = useSharedValue(reduced ? 0 : 20);

  useFocusEffect(
    useCallback(() => {
      if (reduced) return;

      opacity.value = 0;
      translateY.value = 20;

      const timeout = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 300 });
        translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) });
      }, delay);

      return () => {
        clearTimeout(timeout);
        opacity.value = 0;
        translateY.value = 20;
      };
    }, [delay, reduced])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (reduced) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[style, animatedStyle]} className={className}>
      {children}
    </Animated.View>
  );
}
