import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
} from 'react-native-reanimated';
import { Pressable } from '../primitives/Pressable';
import { Theme } from '../../constants/theme';
import { LucideIcon } from 'lucide-react-native';

export interface TabBarItemProps {
  icon: LucideIcon;
  label?: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isCenter?: boolean;
}

export function TabBarItem({ 
  icon: Icon, 
  isFocused, 
  onPress, 
  onLongPress,
  isCenter = false
}: TabBarItemProps) {
  const focusValue = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focusValue.value = withSpring(isFocused ? 1 : 0, { damping: 20, stiffness: 90 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + focusValue.value * 0.2 }],
    };
  });

  const animatedDotStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: focusValue.value }],
      opacity: focusValue.value,
    };
  });

  const iconColor = isCenter 
    ? Theme.colors.surface 
    : isFocused 
      ? Theme.colors.primary 
      : Theme.colors.mutedForeground;

  if (isCenter) {
    return (
      <Pressable 
        onPress={onPress} 
        onLongPress={onLongPress}
        haptic="medium"
        className="flex-1 items-center justify-center -mt-8"
      >
        <View className="w-14 h-14 rounded-full bg-[var(--color-primary)] items-center justify-center shadow-lg shadow-[var(--color-primary)]/30">
          <Icon size={24} color={iconColor} strokeWidth={2.5} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable 
      onPress={onPress} 
      onLongPress={onLongPress}
      haptic="selection"
      className="flex-1 items-center justify-center pt-2 pb-1"
      scaleOnPress={false}
    >
      <Animated.View style={animatedIconStyle} className="items-center">
        <Icon size={24} color={iconColor} strokeWidth={isFocused ? 2.5 : 2} />
      </Animated.View>
      
      <Animated.View 
        style={animatedDotStyle} 
        className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5"
      />
    </Pressable>
  );
}
