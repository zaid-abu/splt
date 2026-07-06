import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

export interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  damping?: number;
  stiffness?: number;
  distance?: number;
  onAnimationComplete?: () => void;
  className?: string;
  style?: ViewStyle;
  trigger?: boolean;
}

export interface SlideUpRef {
  animate: () => void;
  reset: () => void;
}

export const SlideUp = forwardRef<SlideUpRef, SlideUpProps>(
  ({ 
    children, 
    delay = 0, 
    damping = 20, 
    stiffness = 90, 
    distance = 50,
    onAnimationComplete,
    className, 
    style,
    trigger = true
  }, ref) => {
    const translateY = useSharedValue(distance);
    const opacity = useSharedValue(0);

    const animate = () => {
      'worklet';
      translateY.value = distance;
      opacity.value = 0;
      setTimeout(() => {
        opacity.value = withSpring(1, { damping, stiffness });
        translateY.value = withSpring(0, { damping, stiffness }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        });
      }, delay);
    };

    const reset = () => {
      translateY.value = distance;
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
      transform: [{ translateY: translateY.value }],
    }));

    return (
      <Animated.View className={className} style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    );
  }
);
SlideUp.displayName = 'SlideUp';
