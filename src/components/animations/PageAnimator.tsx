import type { JSX } from "react";
import { useState } from "react";
import { useFocusEffect } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";

interface PageAnimatorProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function PageAnimator({ children, delay = 0, className }: PageAnimatorProps): JSX.Element {
  const [key] = useState(() => Math.random().toString(36).slice(2));

  return (
    <Animated.View
      key={key}
      entering={FadeIn.delay(delay).duration(400)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

interface FocusAwareViewProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FocusAwareView({ children, delay = 0, className }: FocusAwareViewProps): JSX.Element {
  const [focusKey, setFocusKey] = useState(0);

  useFocusEffect(() => {
    setFocusKey((k) => k + 1);
  });

  return (
    <Animated.View
      key={focusKey}
      entering={FadeIn.delay(delay).duration(400)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
