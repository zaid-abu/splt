import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { useUIStore } from "@/store/useUIStore";
import { GLASS_SHADOW } from "@/constants/glassmorphism-tokens";

export default function GlassAuthMark(): JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const bg = isDarkMode ? "#E8ECF4" : "#102033";
  const color = isDarkMode ? "#0A1628" : "#FFFFFF";

  return (
    <View
      style={[
        {
          width: 64,
          height: 64,
          borderRadius: 22,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        },
        GLASS_SHADOW.raised,
      ]}
    >
      <Typography
        style={{
          fontSize: 28,
          fontFamily: "Sora_600SemiBold",
          color,
        }}
      >
        S
      </Typography>
    </View>
  );
}
