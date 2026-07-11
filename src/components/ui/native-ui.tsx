import type { ComponentType, ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, TextInput, View, Animated } from "react-native";
import type { TextInputProps, ViewStyle } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

export const LIGHT_COLORS = {
  bg: "#F7F6F1",
  surface: "#FEFDFA",
  control: "#FFFFFF",
  text: "#1A1A1A",
  textStrong: "#000000",
  textInverse: "#FFFFFF",
  muted: "#6E6D68",
  border: "#E7E5DE",
  brand: "#8C7A6B",
  danger: "#E85D5D",
  success: "#4CAF82",
  subtle: "#F4F3EE",
  dangerTint: "#FFF7F5",
  successTint: "#F5FCF8",
};

export const DARK_COLORS = {
  bg: "#121212",
  surface: "#1E1E1E",
  control: "#252525",
  text: "#F5F0EB",
  textStrong: "#FFFFFF",
  textInverse: "#1A1A1A",
  muted: "#9E9E9E",
  border: "#3A3A3A",
  brand: "#A89A8E",
  danger: "#E85D5D",
  success: "#4CAF82",
  subtle: "#2A2A2A",
  dangerTint: "#251616",
  successTint: "#16251E",
};

export const UI = {
  color: { ...LIGHT_COLORS },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  space: { page: 24 },
  shadow: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export function applyTheme(isDark: boolean): void {
  const src = isDark ? DARK_COLORS : LIGHT_COLORS;
  Object.assign(UI.color, src);
}

export const TYPO = {
  hero: (size = 32) =>
    ({ fontFamily: "Sora_600SemiBold", fontSize: size, letterSpacing: -0.02 }) as const,
  title: (size = 24) =>
    ({ fontFamily: "Sora_600SemiBold", fontSize: size, letterSpacing: -0.01 }) as const,
  body: (size = 17) => ({ fontFamily: "IBMPlexSans_400Regular", fontSize: size }) as const,
  medium: (size = 16) => ({ fontFamily: "IBMPlexSans_500Medium", fontSize: size }) as const,
  semi: (size = 16) => ({ fontFamily: "IBMPlexSans_600SemiBold", fontSize: size }) as const,
  label: () =>
    ({
      fontFamily: "IBMPlexSans_600SemiBold",
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    }) as const,
};

export function PressableScale({
  children,
  onPress,
  disabled,
  scaleTo = 0.97,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  scaleTo?: number;
  style?: ViewStyle;
}): React.JSX.Element {
  const scale = useMemo(() => new Animated.Value(1), []);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      mass: 0.3,
      stiffness: 200,
      damping: 12,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      mass: 0.3,
      stiffness: 200,
      damping: 12,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

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

// ─── ScreenHeader ──────────────────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: ReactNode;
}

export function ScreenHeader({
  title,
  onBackPress,
  rightAction,
}: ScreenHeaderProps): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: UI.space.page,
        paddingVertical: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        {onBackPress && (
          <IconButton icon={icons.ArrowLeft} onPress={onBackPress} accessibilityLabel="Go back" />
        )}
        <Typography
          style={{
            fontFamily: "Sora_600SemiBold",
            fontSize: 28,
            color: UI.color.textStrong,
            letterSpacing: -0.3,
          }}
          numberOfLines={1}
        >
          {title}
        </Typography>
      </View>
      {rightAction}
    </View>
  );
}

// ─── MetricCell ────────────────────────────────────────────────────────────
interface MetricCellProps {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger" | "brand";
}

export function MetricCell({ label, value, tone = "neutral" }: MetricCellProps): React.JSX.Element {
  const bgColors = {
    neutral: UI.color.control,
    success: UI.color.successTint,
    danger: UI.color.dangerTint,
    brand: UI.color.bg,
  };
  const valueColors = {
    neutral: UI.color.text,
    success: UI.color.success,
    danger: UI.color.danger,
    brand: UI.color.brand,
  };

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: UI.radius.md,
        backgroundColor: bgColors[tone],
        borderWidth: 1,
        borderColor: UI.color.border,
      }}
    >
      <Typography
        numberOfLines={1}
        style={{
          fontSize: 11,
          color: UI.color.muted,
          fontFamily: "IBMPlexSans_600SemiBold",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 5,
        }}
      >
        {label}
      </Typography>
      <Typography
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontSize: 16,
          color: valueColors[tone],
          fontFamily: "IBMPlexSans_600SemiBold",
        }}
      >
        {value}
      </Typography>
    </View>
  );
}

// ─── FilterPill ────────────────────────────────────────────────────────────
interface FilterPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function FilterPill({ label, isActive, onPress }: FilterPillProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: UI.radius.pill,
        backgroundColor: isActive ? UI.color.text : UI.color.control,
        borderWidth: 1,
        borderColor: isActive ? UI.color.text : UI.color.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Typography
        style={{
          fontSize: 13,
          fontFamily: "IBMPlexSans_600SemiBold",
          color: isActive ? UI.color.textInverse : UI.color.text,
        }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

// ─── ListSection ───────────────────────────────────────────────────────────
interface ListSectionProps {
  label: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export function ListSection({ label, rightAction, children }: ListSectionProps): React.JSX.Element {
  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: UI.space.page,
          marginBottom: 14,
        }}
      >
        <Typography
          style={{
            fontSize: 18,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Typography>
        {rightAction}
      </View>
      {children}
    </View>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────
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
