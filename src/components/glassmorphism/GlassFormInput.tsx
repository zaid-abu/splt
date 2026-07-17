import React, { useState } from "react";
import { Controller, FieldValues, Path } from "react-hook-form";
import { TextField, Input } from "heroui-native";
import { View, Text } from "react-native";
import type { TextInputProps } from "react-native";
import { useUIStore } from "@/store/useUIStore";
import { GLASS_LIGHT, GLASS_DARK, GLASS_RADIUS } from "@/constants/glassmorphism-tokens";

export interface GlassFormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  control: any;
  name: Path<T>;
  label?: string;
  isRequired?: boolean;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
}

export function GlassFormInput<T extends FieldValues>({
  control,
  name,
  label,
  isRequired,
  rightElement,
  leftElement,
  ...inputProps
}: GlassFormInputProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tokens = isDarkMode ? GLASS_DARK : GLASS_LIGHT;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
        <TextField isRequired={isRequired} isInvalid={!!error} style={{ marginBottom: 16 }}>
          {label && (
            <Text
              style={{
                fontSize: 11,
                color: tokens.muted,
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
              height: 50,
              borderRadius: GLASS_RADIUS.sm,
              borderWidth: 1,
              borderColor: error
                ? tokens.danger
                : isFocused
                  ? tokens.accent
                  : tokens.border,
              backgroundColor: isDarkMode
                ? "rgba(20, 35, 55, 0.74)"
                : "rgba(255, 255, 255, 0.74)",
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
                color: tokens.text,
                paddingLeft: leftElement ? 48 : 16,
                paddingRight: rightElement ? 48 : 16,
              }}
              placeholderTextColor={tokens.muted}
              {...inputProps}
            />

            {rightElement && (
              <View style={{ position: "absolute", right: 16, zIndex: 10 }}>{rightElement}</View>
            )}
          </View>

          {error && (
            <Text
              style={{
                marginTop: 6,
                color: tokens.danger,
                fontSize: 12,
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
