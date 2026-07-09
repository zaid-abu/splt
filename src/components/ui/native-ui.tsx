import type { ComponentType, ReactNode } from "react";
import { Pressable, TextInput, View } from "react-native";
import type { TextInputProps, ViewStyle } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";

export const UI = {
  color: {
    bg: "#F5F0EB",
    surface: "#FFFCF8",
    control: "#FFFFFF",
    text: "#1A1A1A",
    textStrong: "#000000",
    muted: "#8A8782",
    border: "#E8E4DF",
    brand: "#8C7A6B",
    danger: "#E85D5D",
    success: "#4CAF82",
    subtle: "#F4F0EA",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  space: {
    page: 24,
  },
} as const;

type IconType = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface IconButtonProps {
  icon: IconType;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: "default" | "danger";
  style?: ViewStyle;
}

export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  tone = "default",
  style,
}: IconButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: UI.radius.pill,
        backgroundColor: UI.color.control,
        borderWidth: 1,
        borderColor: UI.color.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
        ...style,
      })}
    >
      <Icon
        size={20}
        color={tone === "danger" ? UI.color.danger : UI.color.text}
        strokeWidth={1.75}
      />
    </Pressable>
  );
}

interface PrimaryButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "brand" | "ink" | "danger";
  style?: ViewStyle;
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
  loading,
  tone = "ink",
  style,
}: PrimaryButtonProps): React.JSX.Element {
  const backgroundColor =
    tone === "brand" ? UI.color.brand : tone === "danger" ? UI.color.danger : UI.color.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: UI.radius.pill,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        paddingHorizontal: 20,
        opacity: disabled ? 0.45 : pressed || loading ? 0.78 : 1,
        ...style,
      })}
    >
      {children}
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 11,
        color: UI.color.muted,
        fontFamily: "IBMPlexSans_600SemiBold",
        letterSpacing: 1.2,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Typography>
  );
}

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
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: UI.color.control,
        borderWidth: 1,
        borderColor: UI.color.border,
        borderRadius: UI.radius.lg,
        minHeight: 52,
        paddingHorizontal: 16,
      }}
    >
      <icons.Search size={19} color={UI.color.muted} strokeWidth={1.7} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={UI.color.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          {
            flex: 1,
            marginLeft: 12,
            fontFamily: "IBMPlexSans_500Medium",
            color: UI.color.text,
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
            <icons.XCircle size={19} color={UI.color.muted} strokeWidth={1.7} />
          </Pressable>
        ) : null)}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: IconType;
  title: string;
  subtitle: string;
}): React.JSX.Element {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        backgroundColor: UI.color.surface,
        borderRadius: UI.radius.lg,
        borderWidth: 1,
        borderColor: UI.color.border,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: UI.radius.xl,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Icon size={32} color={UI.color.text} strokeWidth={1.5} />
      </View>
      <Typography
        style={{
          fontSize: 18,
          color: UI.color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Typography>
      <Typography
        style={{
          fontSize: 15,
          color: UI.color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          textAlign: "center",
          lineHeight: 21,
        }}
      >
        {subtitle}
      </Typography>
    </View>
  );
}
