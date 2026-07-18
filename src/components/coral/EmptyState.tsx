import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { useUI } from "@/components/ui";
import { useCoralColors } from "./useCoral";

type EmptyStateProps = {
  visual?: ReactNode;
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function EmptyState({ visual, title, subtitle, children }: EmptyStateProps) {
  const { color } = useUI();
  const coral = useCoralColors();

  return (
    <View
      style={{
        minHeight: 310,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
      }}
    >
      <View
        style={{
          width: 112,
          height: 112,
          borderRadius: 16,
          backgroundColor: coral.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        {visual}
      </View>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          fontWeight: "600",
          color: color.text,
          textAlign: "center",
          marginBottom: subtitle ? 8 : 0,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 15,
            color: color.muted,
            textAlign: "center",
            lineHeight: 21,
            maxWidth: 280,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
