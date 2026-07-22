import type { JSX } from "react";
import { Image, View, Text } from "react-native";

import { useCoralColors } from "@/components/coral/useCoral";

interface UserAvatarShape {
  id: string;
  name?: string;
  initials: string;
  avatar?: string;
}

type AvatarTone = {
  fill: string;
  text: string;
  ring: string;
};

const AVATAR_PALETTE: AvatarTone[] = [
  { fill: "#FEF0E5", text: "#B4693C", ring: "#F5DDCC" },
  { fill: "#F6EFE5", text: "#9A7A56", ring: "#E8DCC8" },
  { fill: "#EAF1E8", text: "#5F8A6D", ring: "#CDE0D4" },
  { fill: "#E4EFEF", text: "#4D8682", ring: "#C4DAD9" },
  { fill: "#E8EAF2", text: "#5D6D9E", ring: "#C8D0E2" },
  { fill: "#F1E6ED", text: "#9E6F84", ring: "#DFC8D4" },
  { fill: "#EEE8E3", text: "#8B735D", ring: "#D9CFC5" },
  { fill: "#E0EDEA", text: "#4B7A72", ring: "#C2D8D3" },
];

const SIZE_MAP = {
  sm: { size: 36, radius: 14, font: 13 },
  md: { size: 52, radius: 20, font: 18 },
  lg: { size: 80, radius: 32, font: 28 },
} as const;

function getSize(size: any | undefined) {
  return SIZE_MAP[(size as keyof typeof SIZE_MAP) || "md"] || SIZE_MAP.md;
}

function getPaletteIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_PALETTE.length;
}

function getTone(user: UserAvatarShape, balance?: number): AvatarTone {
  if (balance !== undefined) {
    if (balance > 0) return { fill: "#DCF0E4", text: "#3A7A56", ring: "#C2E0CC" };
    if (balance < 0) return { fill: "#FEE7E4", text: "#B25B52", ring: "#F5CECC" };
    return { fill: "#EEEDE8", text: "#8A8882", ring: "#DDDCD7" };
  }
  return AVATAR_PALETTE[getPaletteIndex(user.id)];
}

function Initials({ initials, fontSize, color }: { initials: string; fontSize: number; color: string }) {
  const display = initials.length <= 2 ? initials : initials.slice(0, 2);
  return (
    <Text
      style={{
        color,
        fontFamily: "InstrumentSans_600SemiBold",
        fontSize,
        letterSpacing: -0.5,
        lineHeight: fontSize * 1.1,
      }}
    >
      {display}
    </Text>
  );
}

interface AppUserAvatarProps {
  user: UserAvatarShape;
  size?: any;
  balance?: number;
}

export function AppUserAvatar({ user, size = "md", balance }: AppUserAvatarProps): JSX.Element {
  const dims = getSize(size);
  const coral = useCoralColors();
  const tone = getTone(user, balance);

  return (
    <View
      style={{
        width: dims.size,
        height: dims.size,
        borderRadius: dims.radius,
        backgroundColor: tone.fill,
        borderWidth: 1,
        borderColor: tone.ring,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {user.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Initials initials={user.initials} fontSize={dims.font} color={tone.text} />
      )}
    </View>
  );
}

export function AvatarStack({ users, max = 4 }: { users: UserAvatarShape[]; max?: number }): JSX.Element {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const dims = getSize("sm");
  const coral = useCoralColors();

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {visible.map((user, idx) => (
        <View
          key={user.id}
          style={{
            marginLeft: idx === 0 ? 0 : -12,
            zIndex: visible.length - idx,
            borderRadius: dims.radius + 3,
            borderWidth: 2.5,
            borderColor: coral.bg,
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
            marginLeft: -12,
            borderRadius: dims.radius,
            borderWidth: 2.5,
            borderColor: coral.bg,
            backgroundColor: coral.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: coral.muted,
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 11,
            }}
          >
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}
