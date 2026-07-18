import type { ComponentType } from "react";
import { View, Text } from "react-native";
import { useUI } from "@/components/ui";
import { useCoralColors } from "@/components/coral";

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
  const coral = useCoralColors();

  return (
    <View
      style={{
        borderRadius: radius.lg,
        overflow: "hidden",
        backgroundColor: coral.surface,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
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
        <Text
          style={{
            fontSize: 18,
            color: color.text,
            fontFamily: "InstrumentSans_600SemiBold",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: color.muted,
            fontFamily: "InstrumentSans_500Medium",
            textAlign: "center",
            lineHeight: 21,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
