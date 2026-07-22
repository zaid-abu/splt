import type { JSX } from "react";
import {  View, Pressable , Text } from "react-native";
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
          <Text
            style={{
              fontSize: 24,
              color: color.text,
              fontFamily: "InstrumentSans_600SemiBold",
              letterSpacing: -0.5,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: color.muted,
              fontFamily: "InstrumentSans_500Medium",
            }}
            numberOfLines={1}
          >
            {email}
          </Text>
        </View>
        <icons.ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}
