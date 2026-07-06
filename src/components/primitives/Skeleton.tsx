import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { tv, type VariantProps } from 'tailwind-variants';

const skeletonVariants = tv({
  base: 'overflow-hidden bg-[var(--color-surface-2)]',
  variants: {
    variant: {
      text: 'h-4 rounded-xs w-full',
      circle: 'rounded-full',
      card: 'rounded-xl w-full h-32',
      listItem: 'rounded-md w-full h-16',
      chart: 'rounded-sm w-8 h-full',
    },
  },
  defaultVariants: {
    variant: 'text',
  },
});

export interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: import('react-native').ViewStyle;
}

export function Skeleton({ variant, className, width, height, style }: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#F0F0F5', '#E8E8F0']
    );
    return { backgroundColor };
  });

  return (
    <Animated.View
      className={skeletonVariants({ variant, className })}
      style={[
        style,
        animatedStyle,
        width !== undefined && { width: width as any },
        height !== undefined && { height: height as any },
      ]}
    />
  );
}
