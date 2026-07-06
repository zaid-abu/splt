import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { tv, type VariantProps } from 'tailwind-variants';

const badgeVariants = tv({
  base: 'px-2 py-1 rounded-full flex-row items-center justify-center self-start',
  variants: {
    variant: {
      success: 'bg-[var(--color-success-soft)]',
      danger: 'bg-[var(--color-danger-soft)]',
      primary: 'bg-[var(--color-primary-soft)]',
      muted: 'bg-[var(--color-surface-2)]',
    }
  },
  defaultVariants: {
    variant: 'muted',
  },
});

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  className?: string;
}

export function Badge({ variant, label, className }: BadgeProps) {
  const getTextColor = () => {
    switch(variant) {
      case 'success': return 'success';
      case 'danger': return 'danger';
      case 'primary': return 'primary';
      default: return 'muted';
    }
  };

  return (
    <View className={badgeVariants({ variant, className })}>
      <Text variant="caption" color={getTextColor()} className="font-medium">
        {label}
      </Text>
    </View>
  );
}
