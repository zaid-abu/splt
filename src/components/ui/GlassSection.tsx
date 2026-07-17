import type { ReactNode } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui";
import GlassSurface from "@/components/glassmorphism/GlassSurface";

interface GlassSectionProps {
  title: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
  children: ReactNode;
}

export function GlassSection({
  title,
  viewAllLabel,
  onViewAll,
  children,
}: GlassSectionProps): React.JSX.Element {
  const { color, radius } = useUI();

  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Typography
          style={{
            fontSize: 18,
            fontFamily: "Sora_600SemiBold",
            letterSpacing: -0.01,
            color: color.text,
          }}
        >
          {title}
        </Typography>
        {viewAllLabel ? (
          onViewAll ? (
            <Pressable onPress={onViewAll} hitSlop={8}>
              <Typography
                style={{
                  fontSize: 13,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: color.muted,
                }}
              >
                {viewAllLabel}
              </Typography>
            </Pressable>
          ) : (
            <Typography
              style={{
                fontSize: 13,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: color.muted,
              }}
            >
              {viewAllLabel}
            </Typography>
          )
        ) : null}
      </View>
      <GlassSurface borderRadius={radius.md} padding={0}>
        {children}
      </GlassSurface>
    </View>
  );
}
