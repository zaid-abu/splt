import { Text } from "react-native";
import type { ReactNode } from "react";
import type { TextStyle } from "react-native";
import { useUI } from "@/components/ui/hooks/useUI";

export function SectionLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: TextStyle;
}): React.JSX.Element {
  const { color } = useUI();

  return (
    <Text
      style={[
        {
          fontSize: 11,
          color: color.muted,
          fontFamily: "InstrumentSans_600SemiBold",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
