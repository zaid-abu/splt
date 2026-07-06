import type { JSX, ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { twMerge } from "tailwind-merge";
import { Pressable } from "@/components/primitives/Pressable";
import { Text } from "@/components/primitives/Text";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  onPress?: () => void;
  haptic?: "light" | "medium" | "heavy" | "selection" | "success" | "error" | "none";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary border border-primary",
  secondary: "bg-surface border border-border",
  ghost: "bg-transparent border border-border",
  danger: "bg-danger border border-danger",
};

const variantTextColor: Record<ButtonVariant, "primary" | "inverse" | "danger" | "muted" | undefined> = {
  primary: "inverse",
  secondary: undefined,
  ghost: undefined,
  danger: "inverse",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-4 rounded-xl",
  md: "h-14 px-6 rounded-xl",
  lg: "h-16 px-8 rounded-2xl",
};

const textSizes: Record<ButtonSize, "bodySmall" | "body" | "button"> = {
  sm: "bodySmall",
  md: "body",
  lg: "button",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  onPress,
  haptic = "light",
}: ButtonProps): JSX.Element {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      haptic={haptic}
      className={twMerge(
        "flex-row items-center justify-center gap-2 overflow-hidden",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        isDisabled && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#FAFAFA" : "#8E8E93"} />
      ) : (
        <>
          {leftIcon}
          {typeof children === "string" ? (
            <Text variant={textSizes[size]} color={variantTextColor[variant]} className="font-bold">
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}
