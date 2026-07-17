import type { ComponentType, ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, TextInput, View, Animated } from "react-native";
import type { TextInputProps, ViewStyle, TextStyle } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { useUIStore } from "@/store/useUIStore";
import { LIGHT_COLORS, DARK_COLORS, RADIUS, SPACE, SHADOW } from "@/components/ui/theme/tokens";
import { TYPO } from "@/components/ui/theme/typography";

export { LIGHT_COLORS, DARK_COLORS, RADIUS, SPACE, SHADOW };
export { TYPO };

export function useUI() {
  const isDark = useUIStore((s) => s.isDarkMode);
  return useMemo(
    () => ({
      color: isDark ? DARK_COLORS : LIGHT_COLORS,
      radius: RADIUS,
      space: SPACE,
      shadow: SHADOW,
    }),
    [isDark],
  );
}

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
  const { color, radius } = useUI();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.pill,
        backgroundColor: color.control,
        borderWidth: 1,
        borderColor: color.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
        ...style,
      })}
    >
      <Icon
        size={20}
        color={tone === "danger" ? color.danger : color.text}
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
  const { color, radius } = useUI();
  const backgroundColor =
    tone === "brand" ? color.brand : tone === "danger" ? color.danger : color.ink;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: radius.pill,
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

export function SectionLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: TextStyle;
}): React.JSX.Element {
  const { color } = useUI();

  return (
    <Typography
      style={[
        {
          fontSize: 11,
          color: color.muted,
          fontFamily: "IBMPlexSans_600SemiBold",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        },
        style,
      ]}
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
  const { color, space, radius } = useUI();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: space.page,
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
            color: color.textStrong,
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

interface MetricCellProps {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger" | "brand";
}

export function MetricCell({ label, value, tone = "neutral" }: MetricCellProps): React.JSX.Element {
  const { color, radius } = useUI();

  const bgColors = {
    neutral: color.control,
    success: color.successTint,
    danger: color.dangerTint,
    brand: color.bg,
  };
  const valueColors = {
    neutral: color.text,
    success: color.success,
    danger: color.danger,
    brand: color.brand,
  };

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: radius.md,
        backgroundColor: bgColors[tone],
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <Typography
        numberOfLines={1}
        style={{
          fontSize: 11,
          color: color.muted,
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

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function FilterPill({ label, isActive, onPress }: FilterPillProps): React.JSX.Element {
  const { color, radius } = useUI();

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
        borderRadius: radius.pill,
        backgroundColor: isActive ? color.text : color.control,
        borderWidth: 1,
        borderColor: isActive ? color.text : color.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Typography
        style={{
          fontSize: 13,
          fontFamily: "IBMPlexSans_600SemiBold",
          color: isActive ? color.textInverse : color.text,
        }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

interface ListSectionProps {
  label: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export function ListSection({ label, rightAction, children }: ListSectionProps): React.JSX.Element {
  const { color, space } = useUI();

  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space.page,
          marginBottom: 14,
        }}
      >
        <Typography
          style={{
            fontSize: 18,
            color: color.text,
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

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: IconType;
  title: string;
  subtitle: string;
}): React.JSX.Element {
  const { color, radius } = useUI();

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        backgroundColor: color.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.xl,
          backgroundColor: color.control,
          borderWidth: 1,
          borderColor: color.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Icon size={32} color={color.text} strokeWidth={1.5} />
      </View>
      <Typography
        style={{
          fontSize: 18,
          color: color.text,
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
          color: color.muted,
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
