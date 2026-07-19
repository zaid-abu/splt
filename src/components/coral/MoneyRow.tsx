import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { useCoralColors } from "./useCoral";

type MoneyRowProps = {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  amount: string;
  amountTone?: "neutral" | "positive" | "negative";
  onPress?: () => void;
  rightElement?: ReactNode;
  accessibilityLabel?: string;
};

export function MoneyRow({
  avatar,
  title,
  subtitle,
  amount,
  amountTone = "neutral",
  onPress,
  rightElement,
  accessibilityLabel,
}: MoneyRowProps) {
  const coral = useCoralColors();

  const pillColors: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: coral.bg, fg: coral.muted },
    positive: { bg: coral.positiveSoft, fg: coral.positive },
    negative: { bg: coral.negativeSoft, fg: coral.negative },
  };
  const pc = pillColors[amountTone];

  const content = (
    <View
      style={{
        minHeight: 64,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
      }}
    >
      {avatar}
      <View style={{ minWidth: 0, flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 14,
            letterSpacing: -0.01 * 14,
            color: coral.foreground,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              lineHeight: 12 * 1.4,
              color: coral.muted,
              marginTop: 3,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          minHeight: 30,
          paddingVertical: 4,
          paddingHorizontal: 9,
          borderRadius: 999,
          backgroundColor: pc.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "IBMPlexMono_600SemiBold",
            fontSize: 11,
            lineHeight: 11 * 1.1,
            fontVariant: ["tabular-nums"],
            letterSpacing: -0.01 * 11,
            color: pc.fg,
          }}
        >
          {amount}
        </Text>
      </View>
      {rightElement}
    </View>
  );

  if (onPress) {
    const accessibleName =
      accessibilityLabel ?? [title, subtitle, amount].filter(Boolean).join(", ");
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibleName}
        onPress={onPress}
        style={{ width: "100%" }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
