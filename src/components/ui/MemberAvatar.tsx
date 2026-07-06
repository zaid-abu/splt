import type { JSX } from "react";
import { View } from "react-native";
import { Text } from "@/components/primitives/Text";
import type { User } from "@/types";
import { getStringColor, hexToPastel } from "@/utils/theme";

export { AvatarStack } from "./AvatarStack";

interface AppUserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  balance?: number;
}

export function AppUserAvatar({ user, size = "md", balance }: AppUserAvatarProps): JSX.Element {
  const successColor = "#22C55E";
  const dangerColor = "#EF4444";
  const mutedColor = "#8E8E93";

  let bg: string, textColor: string;
  if (balance !== undefined) {
    if (balance > 0) {
      bg = hexToPastel(successColor, 0.85);
      textColor = successColor;
    } else if (balance < 0) {
      bg = hexToPastel(dangerColor, 0.85);
      textColor = dangerColor;
    } else {
      bg = "#26262D";
      textColor = mutedColor;
    }
  } else {
    textColor = getStringColor(user.id);
    bg = hexToPastel(textColor, 0.85);
  }

  const sizeMap = {
    sm: { size: 32, font: "bodySmall" },
    md: { size: 40, font: "body" },
    lg: { size: 48, font: "sectionLabel" },
  } as const;

  const dims = sizeMap[size] ?? sizeMap.md;

  return (
    <View
      style={{
        backgroundColor: bg,
        width: dims.size,
        height: dims.size,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#26262D",
      }}
      className="items-center justify-center overflow-hidden"
    >
      <Text variant={dims.font} className="font-bold tracking-tight" style={{ color: textColor }}>
        {user.initials}
      </Text>
    </View>
  );
}
