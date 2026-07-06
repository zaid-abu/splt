import React, { useState } from "react";
import { Controller, type FieldValues, type Path } from "react-hook-form";
import type { TextInputProps } from "react-native";
import { Input } from "@/components/ui/Input";

export interface FormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  control: any;
  name: Path<T>;
  label?: string;
  description?: string;
  isRequired?: boolean;
  className?: string;
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
        <Input
          label={hideLabel ? undefined : label}
          description={description}
          error={error?.message}
          isFocused={isFocused}
          isInvalid={!!error}
          leftElement={leftElement}
          rightElement={rightElement}
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
          className={className}
          {...inputProps}
        />
      )}
    />
  );
}
