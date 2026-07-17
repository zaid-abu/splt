import type { ReactNode } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui";
import GlassSurface from "@/components/glassmorphism/GlassSurface";

interface GlassHeroBalanceProps {
  label: string;
  amount: string;
  amountColor?: string;
  metrics: Array<{ label: string; value: string; color?: string }>;
  children?: ReactNode;
}

export function GlassHeroBalance({
  label,
  amount,
  amountColor,
  metrics,
  children,
}: GlassHeroBalanceProps): React.JSX.Element {
  const { color, radius } = useUI();

  return (
    <GlassSurface borderRadius={radius.lg} padding={24} style={{ position: "relative", overflow: "hidden" }}>
      <View
        style={{
          position: "absolute",
          right: -55,
          top: -60,
          width: 130,
          height: 130,
          borderRadius: 9999,
          backgroundColor: color.brand,
          opacity: 0.24,
        }}
      />
      <Typography
        style={{
          fontSize: 11,
          fontFamily: "IBMPlexSans_600SemiBold",
          textTransform: "uppercase",
          letterSpacing: 1.0,
          color: color.muted,
        }}
      >
        {label}
      </Typography>
      <Typography
        style={{
          fontFamily: "Sora_600SemiBold",
          fontSize: 36,
          lineHeight: 41,
          letterSpacing: -0.03,
          color: amountColor ?? color.text,
          marginTop: 8,
          marginBottom: 18,
        }}
      >
        {amount}
      </Typography>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        {metrics.map((metric, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: color.borderSoft,
            }}
          >
            <Typography
              style={{
                fontSize: 11,
                fontFamily: "IBMPlexSans_600SemiBold",
                textTransform: "uppercase",
                letterSpacing: 1.0,
                color: color.muted,
                marginBottom: 4,
              }}
            >
              {metric.label}
            </Typography>
            <Typography
              style={{
                fontSize: 15,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: metric.color ?? color.text,
              }}
            >
              {metric.value}
            </Typography>
          </View>
        ))}
      </View>
      {children}
    </GlassSurface>
  );
}
