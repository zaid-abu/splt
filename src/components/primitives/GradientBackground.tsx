import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../constants/theme';

export interface GradientBackgroundProps {
  variant?: keyof typeof Theme.gradients;
  className?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function GradientBackground({
  variant = 'primary',
  className,
  style,
  children,
}: GradientBackgroundProps) {
  const colors = Theme.gradients[variant];
  
  return (
    <LinearGradient
      colors={colors as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`flex-1 ${className || ''}`}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
