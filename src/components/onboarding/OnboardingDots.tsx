import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Theme } from '../../constants/theme';

export interface OnboardingDotsProps {
  total: number;
  currentIndex: number;
  className?: string;
}

export function OnboardingDots({ total, currentIndex, className }: OnboardingDotsProps) {
  return (
    <View className={`flex-row justify-center items-center h-4 space-x-2 ${className || ''}`}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === currentIndex;
        
        const animatedStyle = useAnimatedStyle(() => {
          return {
            width: withSpring(isActive ? 24 : 8, { damping: 15, stiffness: 100 }),
            opacity: withSpring(isActive ? 1 : 0.4),
          };
        });

        return (
          <Animated.View
            key={i}
            style={[
              { height: 8, borderRadius: 4, backgroundColor: Theme.colors.surface },
              animatedStyle
            ]}
          />
        );
      })}
    </View>
  );
}
