import type { ReactNode } from "react";
import { Text } from "react-native";
import type { TextStyle } from "react-native";
import { useUI } from "@/components/ui";
import { useCoralColors } from "./useCoral";

type MoneyAmountProps = {
  children: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "inverse";
  size?: "sm" | "md" | "lg" | "hero";
  style?: TextStyle;
};

const SIZE_MAP = {
  sm: { fontSize: 14, letterSpacing: -0.01 * 14 },
  md: { fontSize: 16, letterSpacing: -0.01 * 16 },
  lg: { fontSize: 22, letterSpacing: -0.015 * 22 },
  hero: { fontSize: 40, letterSpacing: -0.015 * 40, lineHeight: 40 },
} as const;

export function MoneyAmount({ children, tone = "neutral", size = "md", style }: MoneyAmountProps) {
  const { color } = useUI();
  const coral = useCoralColors();

  const toneColor = {
    neutral: color.text,
    positive: coral.positive,
    negative: coral.negative,
    inverse: coral.balanceForeground,
  }[tone];

  const sizeStyle = SIZE_MAP[size];

  return (
    <Text
      style={[
        {
          fontFamily: "IBMPlexMono_600SemiBold",
          fontVariant: ["tabular-nums"],
          fontWeight: "600",
          color: toneColor,
        },
        sizeStyle,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
