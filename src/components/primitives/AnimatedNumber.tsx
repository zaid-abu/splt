import React, { useEffect } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { textVariants } from './Text';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface AnimatedNumberProps {
  value: number;
  format?: 'currency' | 'number';
  currencySymbol?: string;
  className?: string;
  variant?: "screenTitle" | "sectionLabel" | "cardLabel" | "body" | "bodySmall" | "amountLarge" | "amountSmall" | "caption" | "button" | "link";
  color?: "primary" | "success" | "danger" | "muted" | "inverse";
  align?: "left" | "center" | "right";
  style?: any;
}

export function AnimatedNumber({
  value,
  format = 'currency',
  currencySymbol = '$',
  className,
  variant = 'amountLarge',
  color,
  align,
  style,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withSpring(value, {
      damping: 20,
      stiffness: 90,
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const val = animatedValue.value;
    let formattedText = '';
    
    if (format === 'currency') {
      const absVal = Math.abs(val);
      const formatted = absVal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formattedText = val < 0 ? `-${currencySymbol}${formatted}` : `${currencySymbol}${formatted}`;
    } else {
      formattedText = Math.round(val).toString();
    }
    
    return {
      text: formattedText,
      value: formattedText,
    } as any;
  });
  
  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      animatedProps={animatedProps}
      className={textVariants({ variant, color, align, className: `p-0 m-0 ${className || ''}` })}
      style={style}
    />
  );
}
