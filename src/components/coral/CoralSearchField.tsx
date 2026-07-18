import type { ReactNode } from "react";
import { View, TextInput, Pressable } from "react-native";
import type { TextInputProps } from "react-native";
import { Search, XCircle } from "lucide-react-native";
import { useUI } from "@/components/ui";

type CoralSearchFieldProps = TextInputProps & {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  rightElement?: ReactNode;
};

export function CoralSearchField({
  value,
  onChangeText,
  onClear,
  rightElement,
  style,
  ...props
}: CoralSearchFieldProps) {
  const { color } = useUI();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: color.border,
        borderRadius: 14,
        minHeight: 48,
        paddingHorizontal: 14,
        gap: 9,
      }}
    >
      <Search size={19} color={color.muted} strokeWidth={1.7} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={color.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          {
            flex: 1,
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 16,
            color: color.text,
            padding: 0,
          },
          style,
        ]}
        {...props}
      />
      {rightElement ??
        (value.length > 0 && onClear ? (
          <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
            <XCircle size={19} color={color.muted} strokeWidth={1.7} />
          </Pressable>
        ) : null)}
    </View>
  );
}
