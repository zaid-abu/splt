import type { JSX, ReactNode } from "react";
import { View, Pressable, type ViewProps } from "react-native";
import { twMerge } from "tailwind-merge";

interface CardProps extends ViewProps {
  children: ReactNode;
  onPress?: () => void;
  bordered?: boolean;
}

export function Card({
  children,
  className,
  onPress,
  bordered = true,
  ...props
}: CardProps): JSX.Element {
  const classes = twMerge(
    "bg-surface rounded-2xl overflow-hidden",
    bordered && "border border-border",
    className,
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={twMerge(classes, "active:opacity-50")}
        {...(props as any)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={classes} {...props}>
      {children}
    </View>
  );
}

interface CardRowProps extends ViewProps {
  children: ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

export function CardRow({
  children,
  className,
  onPress,
  isLast,
  ...props
}: CardRowProps): JSX.Element {
  const classes = twMerge(
    "flex-row items-center px-4 py-4 bg-surface",
    !isLast && "border-b border-divider",
    onPress && "active:opacity-50",
    className,
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={classes} {...(props as any)}>
        {children}
      </Pressable>
    );
  }

  return (
    <View className={classes} {...props}>
      {children}
    </View>
  );
}
