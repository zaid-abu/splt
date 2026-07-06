import React from 'react';
import { View } from 'react-native';
import { GradientBackground } from '../primitives/GradientBackground';
import { LucideIcon } from 'lucide-react-native';
import { Theme } from '../../constants/theme';

export interface IconBadgeProps {
  icon: LucideIcon;
  variant?: 'primary' | 'accent' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconBadge({ 
  icon: Icon, 
  variant = 'primary', 
  size = 'md',
  className 
}: IconBadgeProps) {
  const dimensions = {
    sm: { size: 32, iconSize: 16 },
    md: { size: 48, iconSize: 24 },
    lg: { size: 64, iconSize: 32 },
  };

  const { size: viewSize, iconSize } = dimensions[size];
  const isGradient = variant === 'primary' || variant === 'accent';

  const containerStyle = `items-center justify-center rounded-xl overflow-hidden ${className || ''}`;
  const customStyle = { width: viewSize, height: viewSize };

  if (isGradient) {
    return (
      <View style={customStyle} className={containerStyle}>
        <GradientBackground variant={variant}>
          <View className="flex-1 items-center justify-center">
            <Icon size={iconSize} color={Theme.colors.surface} />
          </View>
        </GradientBackground>
      </View>
    );
  }

  return (
    <View 
      style={customStyle} 
      className={`bg-[var(--color-surface-2)] ${containerStyle}`}
    >
      <Icon size={iconSize} color={Theme.colors.foreground} />
    </View>
  );
}
