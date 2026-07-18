import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Eye } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralField } from "@/components/coral/CoralField";
import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";

import { AuthService } from "@/services/api/auth";
import { useAppToast } from "@/hooks/useAppToast";
import { passwordFormSchema } from "@/validation/schemas";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const coral = useCoralColors();
  const { toast } = useAppToast();

  const { mutateAsync: changePassword, isPending } = useMutation({
    mutationFn: (password: string) => AuthService.changePassword(password),
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async () => {
    const parsed = passwordFormSchema.safeParse({
      password: newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check both password fields.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await changePassword(newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show({
        label: "Password updated",
        description: "Your password has been changed successfully.",
        variant: "success",
        placement: "top",
      });
      router.back();
    } catch (err: any) {
      toast.show({
        label: "Update failed",
        description: err.message || "Could not change password.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  return (
    <CoralScreen contentContainerStyle={{ gap: 16 }}>
      <CoralTopBar title="Change Password" onBack={() => router.back()} />

      <CoralField
        label="New password"
        placeholder="Enter new password"
        value={newPassword}
        onChangeText={(v) => {
          setError("");
          setNewPassword(v);
        }}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        style={{ paddingRight: 44 }}
      />
      <Pressable
        onPress={() => setShowPassword(!showPassword)}
        style={{
          position: "absolute",
          right: 30,
          top: 66,
          width: 44,
          height: 54,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Eye size={18} color={showPassword ? coral.foreground : coral.muted} strokeWidth={1.7} />
      </Pressable>

      <PasswordStrengthMeter password={newPassword} />

      <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted }}>
        Use 8 to 72 characters with at least one number or symbol.
      </Text>

      <CoralField
        label="Confirm new password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={(v) => {
          setError("");
          setConfirmPassword(v);
        }}
        secureTextEntry={!showConfirm}
        autoComplete="new-password"
        style={{ paddingRight: 44 }}
      />
      <Pressable
        onPress={() => setShowConfirm(!showConfirm)}
        style={{
          position: "absolute",
          right: 30,
          top: newPassword.length > 0 ? 154 : 130,
          width: 44,
          height: 54,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Eye size={18} color={showConfirm ? coral.foreground : coral.muted} strokeWidth={1.7} />
      </Pressable>

      {error ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 13,
            color: coral.negative,
            marginTop: -8,
          }}
        >
          {error}
        </Text>
      ) : null}

      <View style={{ height: 12 }} />

      <CoralButton
        label="Update Password"
        onPress={handleSave}
        disabled={isPending}
        loading={isPending}
      />
    </CoralScreen>
  );
}
