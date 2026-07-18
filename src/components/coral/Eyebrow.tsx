import type { ReactNode } from "react";
import { Text } from "react-native";
import type { TextStyle } from "react-native";
import { useCoralColors } from "./useCoral";

type EyebrowProps = {
  children: ReactNode;
  style?: TextStyle;
};

export function Eyebrow({ children, style }: EyebrowProps) {
  const colors = useCoralColors();

  return (
    <Text
      style={[
        {
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 14,
          letterSpacing: 0.01 * 14,
          color: colors.muted,
          fontWeight: "600",
          marginTop: 28,
          marginBottom: 10,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
