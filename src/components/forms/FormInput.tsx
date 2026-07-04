import React, { useState } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { TextField, Input, Label, FieldError, Description } from "heroui-native";
import { View } from "react-native";
import type { TextInputProps } from "react-native";

export interface FormInputProps<T extends FieldValues> extends Omit<
  TextInputProps,
  "value" | "onChangeText"
> {
  control: any;
  name: Path<T>;
  label?: string;
  description?: string;
  isRequired?: boolean;
  className?: string;
  inputClassName?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  hideLabel?: boolean;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  description,
  isRequired,
  className,
  inputClassName,
  rightElement,
  leftElement,
  hideLabel = false,
  ...inputProps
}: FormInputProps<T>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
        <TextField isRequired={isRequired} isInvalid={!!error} className={className}>
          {label && !hideLabel && (
            <Label className="mb-1.5 text-tertiary-foreground text-[11px] font-semibold uppercase tracking-[0.08em]">
              {label}
            </Label>
          )}

          <View
            className={`w-full flex-row items-center relative bg-input h-[48px] rounded-[14px] border ${
              error ? "border-danger" : isFocused ? "border-primary" : "border-transparent"
            }`}
          >
            {leftElement && (
              <View className="absolute left-4 z-10" pointerEvents="none">
                {leftElement}
              </View>
            )}

            <Input
              value={value}
              onChangeText={onChange}
              onFocus={(e) => {
                setIsFocused(true);
                inputProps.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                onBlur();
                inputProps.onBlur?.(e);
              }}
              className={`flex-1 h-full bg-transparent border-0 text-[14px] font-medium text-input-foreground ${
                leftElement ? "pl-[44px]" : "pl-4"
              } ${rightElement ? "pr-[44px]" : "pr-4"} ${inputClassName || ""}`}
              placeholderTextColor="rgba(255,255,255,0.6)"
              {...inputProps}
            />

            {rightElement && (
              <View className="absolute right-4 z-10">{rightElement}</View>
            )}
          </View>

          {description && !error && (
            <Description className="mt-1.5 text-tertiary-foreground text-[11px]">
              {description}
            </Description>
          )}
          {error && <FieldError className="mt-1.5">{error.message}</FieldError>}
        </TextField>
      )}
    />
  );
}
