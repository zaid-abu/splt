import type { ReactNode } from "react";
import { View, TextInput, Pressable } from "react-native";
import type { TextInputProps, ViewStyle, StyleProp } from "react-native";
import { Search, XCircle } from "lucide-react-native";
import { useCoralColors } from "./useCoral";

type CoralSearchFieldProps = Omit<TextInputProps, "style"> & {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  rightElement?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function CoralSearchField({
  value,
  onChangeText,
  onClear,
  rightElement,
  style,
  ...props
}: CoralSearchFieldProps) {
  const coral = useCoralColors();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 14,
          minHeight: 48,
          paddingHorizontal: 14,
          gap: 9,
        },
        style,
      ]}
    >
      <Search size={19} color={coral.muted} strokeWidth={1.7} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={coral.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          flex: 1,
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 16,
          color: coral.foreground,
          padding: 0,
        }}
        {...props}
      />
      {rightElement ??
        (value.length > 0 && onClear ? (
          <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
            <XCircle size={19} color={coral.muted} strokeWidth={1.7} />
          </Pressable>
        ) : null)}
    </View>
  );
}
