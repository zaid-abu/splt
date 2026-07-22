import type { JSX } from "react";
import {  View, Pressable , Text } from "react-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";

export interface GroupInviteBannerProps {
  groupName: string;
  memberCount: number;
  onInvitePress: () => void;
}

export function GroupInviteBanner({
  groupName,
  memberCount,
  onInvitePress,
}: GroupInviteBannerProps): JSX.Element {
  const { color, radius } = useUI();

  if (memberCount >= 3) return <></>;

  return (
    <View
      style={{
        borderRadius: radius.lg,
        padding: 24,
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: color.control,
            borderWidth: 1,
            borderColor: color.border,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <icons.UserPlus size={24} color={color.text} strokeWidth={1.5} />
        </View>
        <Text
          style={{
            fontSize: 16,
            color: color.text,
            fontFamily: "InstrumentSans_600SemiBold",
            marginBottom: 4,
          }}
        >
          Share this group
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: color.muted,
            fontFamily: "InstrumentSans_500Medium",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Invite friends to join &quot;{groupName}&quot; and split expenses together.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync();
            onInvitePress();
          }}
          style={({ pressed }) => ({
            paddingHorizontal: 20,
            minHeight: 44,
            backgroundColor: color.text,
            borderRadius: radius.pill,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 14,
              color: color.textInverse,
              fontFamily: "InstrumentSans_600SemiBold",
            }}
          >
            Add Members
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
