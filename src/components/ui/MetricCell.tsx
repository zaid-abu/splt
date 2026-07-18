import { View } from "react-native";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui";

interface MetricCellProps {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger" | "brand";
}

export function MetricCell({ label, value, tone = "neutral" }: MetricCellProps): React.JSX.Element {
  const { color, radius } = useUI();

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
