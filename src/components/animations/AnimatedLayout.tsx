import React from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

export interface AnimatedLayoutProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function AnimatedLayout({ children, className, style }: AnimatedLayoutProps) {
  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).stiffness(90)}
      className={className}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
