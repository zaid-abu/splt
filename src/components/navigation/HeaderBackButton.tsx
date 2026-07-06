import React from 'react';
import { Pressable } from '../primitives/Pressable';
import { ChevronLeft, X } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { useNavigation } from 'expo-router';

export interface HeaderBackButtonProps {
  onPress?: () => void;
  variant?: 'back' | 'close';
  className?: string;
}

export function HeaderBackButton({ 
  onPress, 
  variant = 'back',
  className 
}: HeaderBackButtonProps) {
  const navigation = useNavigation();
  const Icon = variant === 'back' ? ChevronLeft : X;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      haptic="selection"
      className={`w-10 h-10 items-center justify-center rounded-full bg-[var(--color-surface-2)] active:bg-[var(--color-surface-3)] ${className || ''}`}
    >
      <Icon size={24} color={Theme.colors.foreground} />
    </Pressable>
  );
}
