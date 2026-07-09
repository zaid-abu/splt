import React, { useState } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { TextField, Input, Label, FieldError, Description } from "heroui-native";
import { View, StyleSheet, Text } from "react-native";
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

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";
const TEXT_DANGER = "#E02424";

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
        <TextField isRequired={isRequired} isInvalid={!!error} style={{ marginBottom: 16 }}>
          {label && !hideLabel && (
            <Text
              style={{
                fontSize: 11,
                color: TEXT_SECONDARY,
                fontFamily: "IBMPlexSans_600SemiBold",
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {label}
            </Text>
          )}

          <View
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              height: 52,
              borderRadius: 0,
              borderWidth: 1,
              borderColor: error ? TEXT_DANGER : isFocused ? TEXT_PRIMARY : SEPARATOR,
              backgroundColor: "transparent",
            }}
          >
            {leftElement && (
              <View style={{ position: "absolute", left: 16, zIndex: 10 }} pointerEvents="none">
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
              style={{
                flex: 1,
                height: "100%",
                backgroundColor: "transparent",
                borderWidth: 0,
                fontSize: 16,
                fontFamily: "IBMPlexSans_500Medium",
                color: TEXT_PRIMARY,
                paddingLeft: leftElement ? 48 : 16,
                paddingRight: rightElement ? 48 : 16,
              }}
              placeholderTextColor={TEXT_SECONDARY}
              {...inputProps}
            />

            {rightElement && (
              <View style={{ position: "absolute", right: 16, zIndex: 10 }}>{rightElement}</View>
            )}
          </View>

          {description && !error && (
            <Text
              style={{
                marginTop: 6,
                color: TEXT_SECONDARY,
                fontSize: 13,
                fontFamily: "IBMPlexSans_400Regular",
              }}
            >
              {description}
            </Text>
          )}
          {error && (
            <Text
              style={{
                marginTop: 6,
                color: TEXT_DANGER,
                fontSize: 13,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              {error.message}
            </Text>
          )}
        </TextField>
      )}
    />
  );
}
