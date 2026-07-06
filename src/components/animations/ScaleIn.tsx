import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

export interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  damping?: number;
  stiffness?: number;
  initialScale?: number;
  onAnimationComplete?: () => void;
  className?: string;
  style?: ViewStyle;
  trigger?: boolean;
}

export interface ScaleInRef {
  animate: () => void;
  reset: () => void;
}

export const ScaleIn = forwardRef<ScaleInRef, ScaleInProps>(
  ({ 
    children, 
    delay = 0, 
    damping = 15, 
    stiffness = 120, 
    initialScale = 0.8,
    onAnimationComplete,
    className, 
    style,
    trigger = true
  }, ref) => {
    const scale = useSharedValue(initialScale);
    const opacity = useSharedValue(0);

    const animate = () => {
      'worklet';
      scale.value = initialScale;
      opacity.value = 0;
      setTimeout(() => {
        opacity.value = withSpring(1, { damping, stiffness });
        scale.value = withSpring(1, { damping, stiffness }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
      }, delay);
    };

    const reset = () => {
      scale.value = initialScale;
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
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View className={className} style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    );
  }
);
ScaleIn.displayName = 'ScaleIn';
