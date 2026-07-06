import React from 'react';
import { View } from 'react-native';
import Animated, { SlideInDown, withRepeat, withTiming, useSharedValue, useAnimatedStyle, withSequence } from 'react-native-reanimated';
import { Theme } from '../../constants/theme';

export interface OnboardingIllustrationProps {
  type: 'split' | 'save' | 'track';
}

export function OnboardingIllustration({ type }: OnboardingIllustrationProps) {
  const float = useSharedValue(0);

  React.useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(10, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  if (type === 'split') {
    return (
      <View className="w-64 h-64 items-center justify-center">
        <Animated.View entering={SlideInDown.delay(100)} style={animatedStyle} className="w-40 h-40 bg-[var(--color-surface)]/20 rounded-full items-center justify-center absolute left-0 bottom-0" />
        <Animated.View entering={SlideInDown.delay(200)} style={animatedStyle} className="w-32 h-32 bg-[var(--color-surface)]/30 rounded-3xl absolute right-0 top-10" />
        <Animated.View entering={SlideInDown.delay(300)} style={animatedStyle} className="w-48 h-48 bg-[var(--color-accent)]/80 rounded-[40px] items-center justify-center rotate-12 shadow-xl border border-[var(--color-surface)]/20" />
      </View>
    );
  }

  if (type === 'save') {
    return (
      <View className="w-64 h-64 items-center justify-center">
        <Animated.View entering={SlideInDown.delay(100)} style={animatedStyle} className="w-20 h-20 bg-[#FFD700]/80 rounded-full absolute top-5 right-10 shadow-lg" />
        <Animated.View entering={SlideInDown.delay(200)} style={animatedStyle} className="w-16 h-16 bg-[#FFD700]/60 rounded-full absolute bottom-10 left-5 shadow-lg" />
        <Animated.View entering={SlideInDown.delay(300)} style={animatedStyle} className="w-40 h-56 bg-[var(--color-surface)]/90 rounded-3xl items-center justify-center -rotate-6 shadow-xl border border-[var(--color-surface)]" />
      </View>
    );
  }

  return (
    <View className="w-64 h-64 items-center justify-center">
      <Animated.View entering={SlideInDown.delay(100)} style={animatedStyle} className="w-full h-40 bg-[var(--color-surface)]/90 rounded-2xl absolute bottom-0 shadow-xl border border-[var(--color-surface)]" />
      <Animated.View entering={SlideInDown.delay(200)} style={animatedStyle} className="w-16 h-48 bg-[var(--color-accent)] rounded-t-lg absolute bottom-10 left-10 opacity-80" />
      <Animated.View entering={SlideInDown.delay(300)} style={animatedStyle} className="w-16 h-32 bg-[#FFD700] rounded-t-lg absolute bottom-10 left-32 opacity-90" />
    </View>
  );
}
