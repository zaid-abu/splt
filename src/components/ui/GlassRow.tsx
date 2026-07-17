import type { ReactNode } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { ArrowRight } from "lucide-react-native";
import { useUI } from "@/components/ui";

interface GlassRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  end?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}

export function GlassRow({
  icon,
  title,
  subtitle,
  end,
  onPress,
  showChevron,
}: GlassRowProps): React.JSX.Element {
  const { color } = useUI();

  const content = (
    <View
      style={{
        minHeight: 68,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            style={{
              fontSize: 15,
              fontFamily: "IBMPlexSans_600SemiBold",
              color: color.text,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {title}
          </Typography>
          {end}
        </View>
        {subtitle ? (
          <Typography
            style={{
              fontSize: 13,
              color: color.muted,
              marginTop: 4,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {showChevron ? <ArrowRight size={18} color={color.muted} /> : null}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
