import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { Lock } from "lucide-react-native";
import { useUI, GlassSection, GlassRow } from "@/components/ui";
import { HapticButton } from "@/components/ui/HapticButton";

interface ProfileAccountProps {
  createdAt: Date | undefined;
  onChangePassword: () => void;
  onShareInvite: () => void;
  onLogOut: () => void;
  onDeleteAccount: () => void;
}

export function ProfileAccount({
  createdAt,
  onChangePassword,
  onShareInvite,
  onLogOut,
  onDeleteAccount,
}: ProfileAccountProps): JSX.Element {
  const { color, radius, space } = useUI();

  return (
    <GlassSection title="Account">
      <View style={{ padding: space.page }}>
        <Typography
          style={{
            fontSize: 14,
            color: color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            marginBottom: 20,
            lineHeight: 20,
          }}
        >
          {createdAt
            ? `Account created on ${createdAt.toLocaleDateString()}`
            : "Account details are synced with your profile."}
        </Typography>

        <GlassRow
          icon={<Lock size={20} color={color.text} />}
          title="Change Password"
          onPress={onChangePassword}
          showChevron
        />

        <View style={{ height: 12 }} />

        <HapticButton onPress={onLogOut} tone="outlined" height={52}>
          Log Out
        </HapticButton>

        <View style={{ height: 10 }} />

        <HapticButton onPress={onShareInvite} tone="outlined" height={52}>
          Tell a Friend
        </HapticButton>

        <View
          style={{
            height: 1,
            backgroundColor: color.border,
            marginVertical: 16,
          }}
        />

        <HapticButton onPress={onDeleteAccount} tone="danger" height={52}>
          Delete Account
        </HapticButton>
      </View>
    </GlassSection>
  );
}
