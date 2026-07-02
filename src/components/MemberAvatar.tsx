/**
 * AppUserAvatar — HeroUI Avatar compound component.
 *
 * Uses Avatar + Avatar.Fallback (initials-based).
 * Avatar.Image is optional — omitted when no photo URL.
 *
 * @see https://heroui.com/docs/native/components/avatar.mdx
 */
import type { AvatarSize } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";
import { Avatar, Typography, useThemeColor } from "heroui-native";

import type { User } from "@/types";
import { getStringColor, hexToRgba } from "@/utils/theme";

interface AppUserAvatarProps {
  user: User;
  size?: AvatarSize;
  /** When provided, overrides color with balance-based semantic color */
  balance?: number;
}

export function AppUserAvatar({ user, size = "md", balance }: AppUserAvatarProps): JSX.Element {
  const successColor = useThemeColor("success" as any) as unknown as string;
  const dangerColor = useThemeColor("danger" as any) as unknown as string;
  const mutedForeground = useThemeColor("muted-foreground" as any) as unknown as string;
  const secondaryColor = useThemeColor("secondary" as any) as unknown as string;

  let bg, textColor;
  if (balance !== undefined) {
    if (balance > 0) {
      bg = hexToRgba(successColor, 0.15);
      textColor = successColor;
    } else if (balance < 0) {
      bg = hexToRgba(dangerColor, 0.15);
      textColor = dangerColor;
    } else {
      bg = secondaryColor;
      textColor = mutedForeground;
    }
  } else {
    textColor = getStringColor(user.id);
    bg = hexToRgba(textColor, 0.15);
  }

  const sizeMap = {
    sm: { size: 32, font: 12 },
    md: { size: 40, font: 16 },
    lg: { size: 48, font: 18 },
  };

  const dims = sizeMap[size as keyof typeof sizeMap] || sizeMap.md;

  return (
    <Avatar
      size={size}
      style={{
        backgroundColor: bg,
        width: dims.size,
        height: dims.size,
        borderRadius: dims.size / 2,
      }}
    >
      <Avatar.Fallback>
        <Typography style={{ color: textColor, fontWeight: "bold", fontSize: dims.font }}>
          {user.initials}
        </Typography>
      </Avatar.Fallback>
    </Avatar>
  );
}

/**
 * Overlapping avatar stack with +N overflow pill.
 * Each avatar offset by -10px to create stack effect.
 * Uses standard views to guarantee perfect circle rendering and borders.
 */
export function AvatarStack({ users, max = 4 }: { users: User[]; max?: number }): JSX.Element {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const secondaryColor = useThemeColor("secondary" as any) as unknown as string;
  const mutedForeground = useThemeColor("muted-foreground" as any) as unknown as string;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {visible.map((user, idx) => {
        const textColor = getStringColor(user.id);
        const bg = hexToRgba(textColor, 0.15);

        return (
          <Avatar
            key={user.id}
            size="sm"
            style={{
              backgroundColor: bg,
              marginLeft: idx === 0 ? 0 : -8,
              zIndex: visible.length - idx,
              borderWidth: 2,
              borderColor: "white",
              width: 28,
              height: 28,
              borderRadius: 14,
            }}
          >
            <Avatar.Fallback>
              <Typography style={{ color: textColor, fontSize: 10, fontWeight: "bold" }}>
                {user.initials}
              </Typography>
            </Avatar.Fallback>
          </Avatar>
        );
      })}
      {overflow > 0 && (
        <Avatar
          size="sm"
          style={{
            backgroundColor: secondaryColor,
            marginLeft: -8,
            zIndex: 0,
            borderWidth: 2,
            borderColor: "white",
            width: 28,
            height: 28,
            borderRadius: 14,
          }}
        >
          <Avatar.Fallback>
            <Typography style={{ color: mutedForeground, fontSize: 10, fontWeight: "bold" }}>
              +{overflow}
            </Typography>
          </Avatar.Fallback>
        </Avatar>
      )}
    </View>
  );
}
