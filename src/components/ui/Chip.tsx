import React from 'react';
import { View } from 'react-native';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { LucideIcon } from 'lucide-react-native';
import { tv, type VariantProps } from 'tailwind-variants';

const chipVariants = tv({
  base: 'flex-row items-center justify-center px-4 py-2 rounded-full border',
  variants: {
    variant: {
      outline: 'bg-transparent border-[var(--color-border)]',
      filled: 'bg-[var(--color-surface-2)] border-transparent',
      primary: 'bg-[var(--color-primary-soft)] border-transparent',
    }
  },
  defaultVariants: {
    variant: 'outline',
  },
});

export interface ChipProps extends VariantProps<typeof chipVariants> {
  label: string;
  icon?: LucideIcon;
  onPress?: () => void;
  className?: string;
}

export function Chip({ label, icon: Icon, variant, onPress, className }: ChipProps) {
  const content = (
    <View className={chipVariants({ variant, className })}>
      {Icon && (
        <View className="mr-2">
          <Icon size={16} color={variant === 'primary' ? 'var(--color-primary)' : 'var(--color-foreground)'} />
        </View>
      )}
      <Text variant="button" color={variant === 'primary' ? 'primary' : undefined} className="text-sm">
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
}
