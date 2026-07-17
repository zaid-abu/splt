import type { ReactNode } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui";

interface ListSectionProps {
  label: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export function ListSection({ label, rightAction, children }: ListSectionProps): React.JSX.Element {
  const { color, space } = useUI();

  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space.page,
          marginBottom: 14,
        }}
      >
        <Typography
          style={{
            fontSize: 18,
            color: color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Typography>
        {rightAction}
      </View>
      {children}
    </View>
  );
}
