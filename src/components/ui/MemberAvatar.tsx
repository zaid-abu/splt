/**
 * AppUserAvatar
 *
 * Warm, softly framed avatars that match the stacked-list UI language.
 * Supports remote images with initials fallback and semantic balance tinting.
 */
import type { AvatarSize } from "heroui-native";
import type { JSX } from "react";
import { Image, View } from "react-native";
import { Typography } from "heroui-native";

import { useUI } from "@/components/ui";
import type { User } from "@/types";

type AvatarTone = {
  fill: string;
  text: string;
};

const AVATAR_PALETTE: AvatarTone[] = [
  { fill: "#F5E7DD", text: "#9A5F3E" },
  { fill: "#EFE4D6", text: "#8C6B43" },
  { fill: "#E8EEE6", text: "#5F7A5D" },
  { fill: "#E3ECEB", text: "#4B7772" },
  { fill: "#E6E8F1", text: "#5C648F" },
  { fill: "#EFE3E8", text: "#926177" },
  { fill: "#ECE4DE", text: "#7F6552" },
  { fill: "#E6EBE2", text: "#6A7A58" },
];

const SIZE_MAP = {
  sm: { size: 32, radius: 12, font: 12, inset: 2 },
  md: { size: 48, radius: 18, font: 16, inset: 2 },
  lg: { size: 64, radius: 22, font: 22, inset: 3 },
} as const;

function getSize(size: AvatarSize | undefined) {
  return SIZE_MAP[(size as keyof typeof SIZE_MAP) || "md"] || SIZE_MAP.md;
}

function getPaletteIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % AVATAR_PALETTE.length;
}

function getTone(user: User, mutedColor: string, balance?: number): AvatarTone {
  if (balance !== undefined) {
    if (balance > 0) {
      return {
        fill: "#E5F3EA",
        text: "#3F7F61",
      };
    }

    if (balance < 0) {
      return {
        fill: "#F8E6E3",
        text: "#B25B52",
      };
    }

    return {
      fill: "#F0ECE7",
      text: mutedColor,
    };
  }

  return AVATAR_PALETTE[getPaletteIndex(user.id)];
}

function AvatarFallback({
  initials,
  fontSize,
  textColor,
}: {
  initials: string;
  fontSize: number;
  textColor: string;
}): JSX.Element {
  return (
    <Typography
      style={{
        color: textColor,
        fontFamily: "IBMPlexSans_600SemiBold",
        fontSize,
        letterSpacing: -0.3,
      }}
    >
      {initials}
    </Typography>
  );
}

export function AppUserAvatar({ user, size = "md", balance }: AppUserAvatarProps): JSX.Element {
  const dims = getSize(size);
  const { color, radius: ru, space, shadow } = useUI();
  const tone = getTone(user, color.muted, balance);
  const contentRadius = Math.max(dims.radius - dims.inset, 10);

  return (
    <View
      style={{
        width: dims.size,
        height: dims.size,
        borderRadius: dims.radius,
        backgroundColor: color.control,
        borderWidth: 1,
        borderColor: color.border,
        padding: dims.inset,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: contentRadius,
          backgroundColor: tone.fill,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            resizeMode="cover"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: contentRadius,
            }}
          />
        ) : (
          <AvatarFallback initials={user.initials} fontSize={dims.font} textColor={tone.text} />
        )}
      </View>
    </View>
  );
}

interface AppUserAvatarProps {
  user: User;
  size?: AvatarSize;
  balance?: number;
}

export function AvatarStack({ users, max = 4 }: { users: User[]; max?: number }): JSX.Element {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const dims = getSize("sm");
  const { color, radius: ru, space, shadow } = useUI();

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {visible.map((user, idx) => (
        <View
          key={user.id}
          style={{
            marginLeft: idx === 0 ? 0 : -10,
            zIndex: visible.length - idx,
            borderRadius: dims.radius + 2,
            borderWidth: 2,
            borderColor: color.bg,
          }}
        >
          <AppUserAvatar user={user} size="sm" />
        </View>
      ))}

      {overflow > 0 && (
        <View
          style={{
            width: dims.size,
            height: dims.size,
            marginLeft: -10,
            borderRadius: dims.radius + 2,
            borderWidth: 2,
            borderColor: color.bg,
            backgroundColor: color.control,
            padding: 2,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: dims.radius,
              backgroundColor: "#F0ECE7",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              style={{
                color: color.muted,
                fontFamily: "IBMPlexSans_600SemiBold",
                fontSize: 11,
              }}
            >
              +{overflow}
            </Typography>
          </View>
        </View>
      )}
    </View>
  );
}
