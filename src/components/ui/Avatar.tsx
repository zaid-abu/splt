import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { Skeleton } from '../primitives/Skeleton';
import Animated, { FadeIn } from 'react-native-reanimated';
import { tv, type VariantProps } from 'tailwind-variants';
import { Theme } from '../../constants/theme';

const avatarVariants = tv({
  base: 'items-center justify-center overflow-hidden',
  variants: {
    size: {
      xs: 'w-6 h-6 rounded-full',
      sm: 'w-8 h-8 rounded-full',
      md: 'w-10 h-10 rounded-full',
      lg: 'w-14 h-14 rounded-full',
      xl: 'w-20 h-20 rounded-full',
    },
    bordered: {
      true: 'border-2 border-[var(--color-surface)]',
    }
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  url?: string | null;
  name?: string;
  fallbackColor?: string;
  className?: string;
  showOnlineIndicator?: boolean;
}

export function Avatar({ 
  url, 
  name = 'User', 
  size, 
  bordered, 
  fallbackColor = Theme.colors.primaryLight,
  className,
  showOnlineIndicator
}: AvatarProps) {
  const [loading, setLoading] = useState(!!url);
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <View className="relative">
      <View 
        className={avatarVariants({ size, bordered, className })}
        style={{ backgroundColor: fallbackColor }}
      >
        {url ? (
          <>
            {loading && <Skeleton variant="circle" className="absolute inset-0" />}
            <Animated.Image 
              source={{ uri: url }}
              className="w-full h-full"
              entering={FadeIn}
              onLoadEnd={() => setLoading(false)}
            />
          </>
        ) : (
          <Text 
            variant="body" 
            color="inverse" 
            className="font-medium"
            style={{ fontSize: size === 'xl' ? 24 : size === 'lg' ? 18 : 14 }}
          >
            {initials}
          </Text>
        )}
      </View>
      
      {showOnlineIndicator && (
        <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--color-success)] border-2 border-[var(--color-surface)]" />
      )}
    </View>
  );
}
