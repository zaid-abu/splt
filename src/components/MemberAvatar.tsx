/**
 * AppUserAvatar — HeroUI Avatar compound component.
 *
 * Uses Avatar + Avatar.Fallback (initials-based).
 * Avatar.Image is optional — omitted when no photo URL.
 *
 * @see https://heroui.com/docs/native/components/avatar.mdx
 */
import { Avatar } from "heroui-native";
import type { AvatarColor, AvatarSize } from "heroui-native";
import type { JSX } from "react";
import { View, Text } from "react-native";

import type { User } from "@/types";

const COLORS: AvatarColor[] = ["accent", "success", "warning", "danger", "default"];

function pickColor(userId: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length]!;
}

interface AppUserAvatarProps {
  user: User;
  size?: AvatarSize;
  /** When provided, overrides color with balance-based semantic color */
  balance?: number;
}

export function AppUserAvatar({ user, size = "md", balance }: AppUserAvatarProps): JSX.Element {
  const color: AvatarColor =
    balance !== undefined
      ? balance > 0 ? "success" : balance < 0 ? "danger" : "default"
      : pickColor(user.id);

  const bg = color === "danger" ? "#FEE2E2" 
           : color === "success" ? "#D1FAE5"
           : color === "warning" ? "#FEF3C7"
           : color === "accent" ? "#E0DDF2"
           : "#F3F4F6";
  
  const textColor = color === "danger" ? "#DC2626" 
                  : color === "success" ? "#059669"
                  : color === "warning" ? "#D97706"
                  : color === "accent" ? "#6B4EFF"
                  : "#4B5563";

  const sizeMap = {
    sm: { size: 32, font: 12 },
    md: { size: 40, font: 16 },
    lg: { size: 48, font: 18 }
  };
  
  const dims = sizeMap[size as keyof typeof sizeMap] || sizeMap.md;

  return (
    <View style={{
      width: dims.size,
      height: dims.size,
      borderRadius: dims.size / 2,
      backgroundColor: bg,
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Text style={{ fontSize: dims.font, fontWeight: "bold", color: textColor }}>
        {user.initials}
      </Text>
    </View>
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
        const bg = pickColor(user.id) === "danger" ? "#FEE2E2" 
                 : pickColor(user.id) === "success" ? "#D1FAE5"
                 : pickColor(user.id) === "warning" ? "#FEF3C7"
                 : pickColor(user.id) === "accent" ? "#E0DDF2"
                 : "#F3F4F6"; // default
        
        const textColor = pickColor(user.id) === "danger" ? "#DC2626" 
                        : pickColor(user.id) === "success" ? "#059669"
                        : pickColor(user.id) === "warning" ? "#D97706"
                        : pickColor(user.id) === "accent" ? "#6B4EFF"
                        : "#4B5563";

        return (
          <View
            key={user.id}
            style={{ 
              marginLeft: idx === 0 ? 0 : -8, 
              zIndex: visible.length - idx,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: bg,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "white"
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "bold", color: textColor }}>
              {user.initials}
            </Text>
          </View>
        );
      })}
      {overflow > 0 && (
        <View style={{ 
          marginLeft: -8, 
          zIndex: 0,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#E5E7EB",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: "white"
        }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#4B5563" }}>
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}
