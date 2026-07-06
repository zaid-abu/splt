import React from 'react';
import { Pressable as RNPressable, PressableProps as RNPressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export interface PressableProps extends RNPressableProps {
  className?: string;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error' | 'none';
  scaleOnPress?: boolean;
  opacityOnPress?: boolean;
}

export function Pressable({
  className,
  style,
  haptic = 'light',
  scaleOnPress = true,
  opacityOnPress = true,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: PressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = (e: any) => {
    if (scaleOnPress) scale.value = withSpring(0.97, { stiffness: 400, damping: 25 });
    if (opacityOnPress) opacity.value = withTiming(0.8, { duration: 100 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (scaleOnPress) scale.value = withSpring(1, { stiffness: 400, damping: 25 });
    if (opacityOnPress) opacity.value = withTiming(1, { duration: 150 });
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (haptic !== 'none') {
      switch (haptic) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    }
    onPress?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      className={className}
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...props}
    />
  );
}
