import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  damping?: number;
  stiffness?: number;
  onAnimationComplete?: () => void;
  className?: string;
  style?: ViewStyle;
  trigger?: boolean;
}

export interface FadeInRef {
  animate: () => void;
  reset: () => void;
}

export const FadeIn = forwardRef<FadeInRef, FadeInProps>(
  ({ 
    children, 
    delay = 0, 
    damping = 20, 
    stiffness = 90, 
    onAnimationComplete,
    className, 
    style,
    trigger = true
  }, ref) => {
    const opacity = useSharedValue(0);

    const animate = () => {
      'worklet';
      opacity.value = 0;
      setTimeout(() => {
        opacity.value = withSpring(1, { damping, stiffness }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
      }, delay);
    };

    const reset = () => {
      opacity.value = 0;
    };

    useImperativeHandle(ref, () => ({ animate, reset }));

    useEffect(() => {
      if (trigger) {
        animate();
      }
    }, [trigger]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <Animated.View className={className} style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    );
  }
);
FadeIn.displayName = 'FadeIn';
