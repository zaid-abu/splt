import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";

interface ProfileHeaderProps {
  name: string;
  email: string;
  onEdit: () => void;
}

export function ProfileHeader({ name, email, onEdit }: ProfileHeaderProps): JSX.Element {
  const { color } = useUI();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onEdit}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <AppUserAvatar
          user={{
            id: "",
            name,
            avatar: undefined,
            initials: name.charAt(0),
          }}
          size="lg"
        />
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Typography
            style={{
              fontSize: 24,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: -0.5,
            }}
            numberOfLines={1}
          >
            {name}
          </Typography>
          <Typography
            style={{
              fontSize: 14,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
            }}
            numberOfLines={1}
          >
            {email}
          </Typography>
        </View>
        <icons.ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}
