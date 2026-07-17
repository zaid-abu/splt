import type { ReactNode } from "react";
import { Pressable, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";

interface SearchFieldProps extends TextInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  rightElement?: ReactNode;
}

export function SearchField({
  value,
  onChangeText,
  onClear,
  rightElement,
  style,
  ...props
}: SearchFieldProps): React.JSX.Element {
  const { color, radius } = useUI();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: color.control,
        borderWidth: 1,
        borderColor: color.border,
        borderRadius: radius.lg,
        minHeight: 52,
        paddingHorizontal: 16,
      }}
    >
      <icons.Search size={19} color={color.muted} strokeWidth={1.7} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={color.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          {
            flex: 1,
            marginLeft: 12,
            fontFamily: "IBMPlexSans_500Medium",
            color: color.text,
            fontSize: 16,
            padding: 0,
          },
          style,
        ]}
        {...props}
      />
      {rightElement ??
        (value.length > 0 && onClear ? (
          <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
            <icons.XCircle size={19} color={color.muted} strokeWidth={1.7} />
          </Pressable>
        ) : null)}
    </View>
  );
}
