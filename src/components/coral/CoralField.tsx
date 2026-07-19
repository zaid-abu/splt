import { forwardRef } from "react";
import type { ForwardedRef } from "react";
import { View, TextInput, Text } from "react-native";
import type { TextInputProps } from "react-native";
import { useCoralColors } from "./useCoral";

type CoralFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

export const CoralField = forwardRef(function CoralField(
  { label, error, style, ...props }: CoralFieldProps,
  ref: ForwardedRef<TextInput>
) {
  const coral = useCoralColors();

  return (
    <View style={{ gap: 7 }}>
      {label ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_500Medium",
            fontSize: 13,
            letterSpacing: 0.02 * 13,
            color: coral.muted,
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={coral.muted}
        style={[
          {
            fontFamily: "InstrumentSans_400Regular",
            minHeight: 54,
            borderWidth: 1,
            borderColor: error ? coral.negative : coral.border,
            borderRadius: 14,
            backgroundColor: coral.surface,
            paddingHorizontal: 15,
            fontSize: 16,
            color: coral.foreground,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text
          style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 12, color: coral.negative }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});
