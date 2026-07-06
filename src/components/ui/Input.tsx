import type { JSX } from "react";
import { View, TextInput, type TextInputProps } from "react-native";
import { Text } from "@/components/primitives/Text";
import { twMerge } from "tailwind-merge";

interface InputProps extends TextInputProps {
  label?: string;
  description?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  isFocused?: boolean;
  isInvalid?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  description,
  error,
  leftElement,
  rightElement,
  isFocused,
  isInvalid,
  containerClassName,
  className,
  style,
  ...textInputProps
}: InputProps): JSX.Element {
  const hasError = isInvalid || !!error;

  return (
    <View className={twMerge("gap-2", containerClassName)}>
      {label && (
        <Text variant="caption" className="font-bold tracking-widest uppercase">
          {label}
        </Text>
      )}
      <View
        className={twMerge(
          "flex-row items-center bg-surface border rounded-xl h-14 px-4 gap-3",
          hasError
            ? "border-danger"
            : isFocused
              ? "border-primary"
              : "border-border",
          className,
        )}
      >
        {leftElement && <View>{leftElement}</View>}
        <TextInput
          className="flex-1 text-foreground text-base font-medium h-full"
          placeholderTextColor="#71717A"
          selectionColor="#FB923C"
          {...textInputProps}
        />
        {rightElement && <View>{rightElement}</View>}
      </View>
      {hasError && error && (
        <Text variant="caption" color="danger" className="font-medium">{error}</Text>
      )}
      {description && !hasError && (
        <Text variant="caption">{description}</Text>
      )}
    </View>
  );
}
