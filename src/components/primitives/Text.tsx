import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { tv, type VariantProps } from 'tailwind-variants';

export const textVariants = tv({
  base: 'text-[var(--color-foreground)]',
  variants: {
    variant: {
      screenTitle: 'font-heading text-3xl font-bold',
      sectionLabel: 'font-heading text-xl font-semibold',
      cardLabel: 'font-body text-base font-medium',
      body: 'font-body text-base',
      bodySmall: 'font-body text-sm',
      amountLarge: 'font-display text-4xl font-semibold tracking-tight',
      amountSmall: 'font-display text-2xl font-medium tracking-tight',
      caption: 'font-body text-xs text-[var(--color-muted-foreground)]',
      button: 'font-heading text-base font-semibold text-center',
      link: 'font-body text-sm text-[var(--color-primary)] font-medium',
      // Legacy heroui-native aliases
      h1: 'font-heading text-3xl font-bold',
      h2: 'font-heading text-2xl font-bold',
      h3: 'font-heading text-xl font-bold',
      h4: 'font-heading text-lg font-semibold',
      'body-sm': 'font-body text-sm',
      'body-xs': 'font-body text-xs',
      label: 'font-body text-sm font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider',
    },
    color: {
      primary: 'text-[var(--color-primary)]',
      success: 'text-[var(--color-success)]',
      danger: 'text-[var(--color-danger)]',
      muted: 'text-[var(--color-muted-foreground)]',
      inverse: 'text-[var(--color-surface)]',
      foreground: 'text-[var(--color-foreground)]',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'body',
    align: 'left',
  },
});

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string;
  type?: keyof typeof textVariants.variants.variant;
  weight?: string;
}

export function Text({ variant, type, weight, color, align, className, style, ...props }: TextProps) {
  // Map type to variant if variant is not provided
  const actualVariant = variant || type;
  
  // Try to append font weight classes if legacy weight is provided
  let weightClass = '';
  if (weight === 'bold') weightClass = 'font-bold';
  else if (weight === 'semibold') weightClass = 'font-semibold';
  else if (weight === 'medium') weightClass = 'font-medium';
  else if (weight === 'regular') weightClass = 'font-normal';
  
  return (
    <RNText
      className={textVariants({ variant: actualVariant, color, align, className: `${weightClass} ${className || ''}` })}
      style={style}
      {...props}
    />
  );
}
