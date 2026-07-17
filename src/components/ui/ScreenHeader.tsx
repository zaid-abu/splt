import type { ReactNode } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useUI, IconButton } from "@/components/ui";

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: ReactNode;
}

export function ScreenHeader({
  title,
  onBackPress,
  rightAction,
}: ScreenHeaderProps): React.JSX.Element {
  const { color, space } = useUI();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: space.page,
        paddingVertical: 12,
        minHeight: 54,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        {onBackPress && (
          <IconButton icon={icons.ArrowLeft} onPress={onBackPress} accessibilityLabel="Go back" />
        )}
        <Typography
          style={{
            fontFamily: "Sora_600SemiBold",
            fontSize: 28,
            lineHeight: 30,
            color: color.textStrong,
            letterSpacing: -0.02,
          }}
          numberOfLines={1}
        >
          {title}
        </Typography>
      </View>
      {rightAction}
    </View>
  );
}
