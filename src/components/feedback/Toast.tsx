import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from '../primitives/Pressable';
import * as Haptics from 'expo-haptics';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  duration?: number;
}

export function Toast({ message, type = 'info', onDismiss, duration = 3000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(insets.top + 10, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 200 });

    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    translateY.value = withSpring(-100, { damping: 20, stiffness: 90 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished && onDismiss) {
        runOnJS(onDismiss)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={20} color={Theme.colors.success} />;
      case 'error': return <AlertCircle size={20} color={Theme.colors.danger} />;
      case 'info': return <Info size={20} color={Theme.colors.primary} />;
    }
  };

  return (
    <Animated.View 
      style={animatedStyle} 
      className="absolute top-0 left-0 right-0 z-50 items-center px-4"
    >
      <Pressable 
        onPress={dismiss}
        scaleOnPress={false}
        className="flex-row items-center bg-[var(--color-surface)] shadow-md rounded-full px-4 py-3 border border-[var(--color-border)]"
      >
        {getIcon()}
        <Text variant="bodySmall" className="ml-2 font-medium">
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
