import type { JSX, PropsWithChildren } from "react";
import { useCallback } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

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
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useFocusEffect(
    useCallback(() => {
      // Reset
      opacity.value = 0;
      translateY.value = 20;

      const timeout = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 300 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }, delay);

      return () => {
        clearTimeout(timeout);
        opacity.value = 0;
        translateY.value = 20;
      };
    }, [delay])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]} className={className}>
      {children}
    </Animated.View>
  );
}
