import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { UI } from "@/components/ui/native-ui";

interface MoneySignalProps {
  label: string;
  value: string;
  tone: "danger" | "success" | "neutral";
}

export function MoneySignal({ label, value, tone }: MoneySignalProps): JSX.Element {
  const toneColor =
    tone === "danger" ? UI.color.danger : tone === "success" ? UI.color.success : UI.color.muted;
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        padding: 12,
        borderRadius: UI.radius.md,
        backgroundColor:
          tone === "danger"
            ? UI.color.dangerTint
            : tone === "success"
              ? UI.color.successTint
              : UI.color.control,
        borderWidth: 1,
        borderColor: UI.color.border,
      }}
    >
      <Typography
        numberOfLines={1}
        style={{
          fontSize: 12,
          color: UI.color.muted,
          fontFamily: "IBMPlexSans_500Medium",
        }}
      >
        {label}
      </Typography>
      <Typography
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          marginTop: 4,
          fontSize: 18,
          color: toneColor,
          fontFamily: "IBMPlexSans_600SemiBold",
          letterSpacing: -0.2,
        }}
      >
        {value}
      </Typography>
    </View>
  );
}
