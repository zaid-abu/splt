import type { ReactNode } from "react";
import { Text, Platform } from "react-native";
import type { TextStyle } from "react-native";
import { useCoralColors } from "./useCoral";

type LargeTitleProps = {
  children: ReactNode;
  style?: TextStyle;
};

export function LargeTitle({ children, style }: LargeTitleProps) {
  const isIOS = Platform.OS === "ios";
  const colors = useCoralColors();

  return (
    <Text
      style={[
        {
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: isIOS ? 36 : 32,
          lineHeight: (isIOS ? 36 : 32) * 1.08,
          letterSpacing: -0.025 * (isIOS ? 36 : 32),
          fontWeight: "600",
          color: colors.foreground,
          marginTop: isIOS ? 20 : 16,
          marginBottom: 8,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
