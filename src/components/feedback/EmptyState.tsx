import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { Pressable } from '../primitives/Pressable';
import { LucideIcon } from 'lucide-react-native';
import { Theme } from '../../constants/theme';
import { FadeIn } from '../animations/FadeIn';
import { SlideUp } from '../animations/SlideUp';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center p-6 ${className || ''}`}>
      <SlideUp distance={20} damping={15}>
        <View className="w-32 h-32 rounded-full bg-[var(--color-primary-soft)] items-center justify-center mb-6">
          <Icon size={48} color={Theme.colors.primary} />
        </View>
      </SlideUp>

      <SlideUp distance={20} delay={100} damping={15} className="items-center">
        <Text variant="screenTitle" className="text-center mb-2">{title}</Text>
        <Text variant="body" color="muted" className="text-center mb-8">{description}</Text>
      </SlideUp>

      {actionLabel && onAction && (
        <FadeIn delay={200}>
          <Pressable 
            onPress={onAction}
            className="bg-[var(--color-primary)] py-4 px-8 rounded-full"
            haptic="medium"
          >
            <Text variant="button" color="inverse">{actionLabel}</Text>
          </Pressable>
        </FadeIn>
      )}
    </View>
  );
}
