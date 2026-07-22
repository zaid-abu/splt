import type { JSX } from "react";
import {  View , Text } from "react-native";
import { useUI } from "@/components/ui/hooks/useUI";

interface MoneySignalProps {
  label: string;
  value: string;
  tone: "danger" | "success" | "neutral";
}

export function MoneySignal({ label, value, tone }: MoneySignalProps): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const toneColor =
    tone === "danger" ? color.danger : tone === "success" ? color.success : color.muted;
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        padding: 12,
        borderRadius: radius.md,
        backgroundColor:
          tone === "danger"
            ? color.dangerTint
            : tone === "success"
              ? color.successTint
              : color.control,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 12,
          color: color.muted,
          fontFamily: "InstrumentSans_500Medium",
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          marginTop: 4,
          fontSize: 18,
          color: toneColor,
          fontFamily: "InstrumentSans_600SemiBold",
          letterSpacing: -0.2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
