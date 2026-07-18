import type { JSX } from "react";
import { View, Text } from "react-native";
import * as icons from "lucide-react-native";
import { Lock } from "lucide-react-native";
import { useUI } from "@/components/ui";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
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
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>Account</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
        }}
      >
        <View style={{ padding: space.page }}>
          <Text
            style={{
              fontSize: 14,
              color: color.muted,
              fontFamily: "InstrumentSans_500Medium",
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            {createdAt
              ? `Account created on ${createdAt.toLocaleDateString()}`
              : "Account details are synced with your profile."}
          </Text>

          <MoneyRow
            avatar={<Lock size={20} color={color.text} />}
            title="Change Password"
            amount=""
            rightElement={<icons.ChevronRight size={18} color={color.muted} />}
            onPress={onChangePassword}
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
      </View>
    </View>
  );
}
