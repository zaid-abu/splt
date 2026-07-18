import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { useUI } from "@/components/ui";
import { useCoralColors } from "./useCoral";

type MoneyRowProps = {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  amount: string;
  amountTone?: "neutral" | "positive" | "negative";
  onPress?: () => void;
  rightElement?: ReactNode;
};

export function MoneyRow({
  avatar,
  title,
  subtitle,
  amount,
  amountTone = "neutral",
  onPress,
  rightElement,
}: MoneyRowProps) {
  const { color } = useUI();
  const coral = useCoralColors();

  const amountColor = {
    neutral: color.text,
    positive: coral.positive,
    negative: coral.negative,
  }[amountTone];

  const content = (
    <View
      style={{
        minHeight: 68,
        paddingVertical: 10,
        paddingHorizontal: 2,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {avatar}
      <View style={{ minWidth: 0, flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 16,
            letterSpacing: -0.005 * 16,
            color: color.text,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 13,
              lineHeight: 13 * 1.45,
              color: color.muted,
              marginTop: 3,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontFamily: "IBMPlexMono_600SemiBold",
          fontVariant: ["tabular-nums"],
          fontWeight: "600",
          letterSpacing: -0.01 * 16,
          color: amountColor,
        }}
      >
        {amount}
      </Text>
      {rightElement}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ width: "100%" }}>
        {content}
      </Pressable>
    );
  }

  return content;
}
