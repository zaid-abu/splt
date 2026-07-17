import type { ReactNode } from "react";
import type { TextStyle } from "react-native";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui";

export function SectionLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: TextStyle;
}): React.JSX.Element {
  const { color } = useUI();

  return (
    <Typography
      style={[
        {
          fontSize: 11,
          color: color.muted,
          fontFamily: "IBMPlexSans_600SemiBold",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        },
        style,
      ]}
    >
      {children}
    </Typography>
  );
}
