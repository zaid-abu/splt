import React from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { TextField, Input, Label, FieldError, Description } from "heroui-native";
import { View } from "react-native";
import type { TextInputProps } from "react-native";

export interface FormInputProps<T extends FieldValues> extends Omit<
  TextInputProps,
  "value" | "onChangeText"
> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  isRequired?: boolean;
  className?: string;
  inputClassName?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
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
  ...inputProps
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TextField isRequired={isRequired} isInvalid={!!error} className={className}>
          {label && <Label>{label}</Label>}

          <View className="w-full flex-row items-center relative">
            {leftElement && (
              <View className="absolute left-3.5 z-10" pointerEvents="none">
                {leftElement}
              </View>
            )}

            <Input
              value={value}
              onChangeText={onChange}
              className={`flex-1 ${leftElement ? "pl-10" : ""} ${rightElement ? "pr-10" : ""} ${inputClassName || ""}`}
              {...inputProps}
            />

            {rightElement && <View className="absolute right-4 z-10">{rightElement}</View>}
          </View>

          {description && !error && <Description>{description}</Description>}
          {error && <FieldError>{error.message}</FieldError>}
        </TextField>
      )}
    />
  );
}
