import type { JSX, PropsWithChildren } from "react";
import { useCallback } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

interface PageAnimatorProps extends PropsWithChildren {
  delay?: number;
}

/**
 * Wraps page content in a subtle fade and slide animation that triggers
 * every time the page gains focus (ideal for Tab screens that don't unmount).
 */
export function PageAnimator({ children, delay = 0 }: PageAnimatorProps): JSX.Element {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useFocusEffect(
    useCallback(() => {
      // Reset
      opacity.value = 0;
      translateY.value = 10;
      
      // Animate in
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      
      return () => {
        // Optional: fade out when blurring
        opacity.value = withTiming(0, { duration: 150 });
      };
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
