import type { ComponentType } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui";
import GlassSurface from "@/components/glassmorphism/GlassSurface";

type IconType = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

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
    <GlassSurface borderRadius={radius.lg} padding={0}>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
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
    </GlassSurface>
  );
}
