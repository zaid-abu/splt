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
import { Avatar, Typography } from "heroui-native";

import type { User } from "@/types";
import { getStringColor, hexToRgba } from "@/utils/theme";

interface AppUserAvatarProps {
  user: User;
  size?: AvatarSize;
  /** When provided, overrides color with balance-based semantic color */
  balance?: number;
}

export function AppUserAvatar({ user, size = "md", balance }: AppUserAvatarProps): JSX.Element {
  let bg, textColor;
  if (balance !== undefined) {
    if (balance > 0) {
      bg = "#D1FAE5";
      textColor = "#059669";
    } else if (balance < 0) {
      bg = "#FEE2E2";
      textColor = "#DC2626";
    } else {
      bg = "#F3F4F6";
      textColor = "#4B5563";
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
            backgroundColor: "#E5E7EB",
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
            <Typography style={{ color: "#4B5563", fontSize: 10, fontWeight: "bold" }}>
              +{overflow}
            </Typography>
          </Avatar.Fallback>
        </Avatar>
      )}
    </View>
  );
}
