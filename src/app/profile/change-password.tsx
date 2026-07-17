import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";

import { AuthService } from "@/services/api/auth";
import { useAppToast } from "@/hooks/useAppToast";
import { useUI, IconButton, SectionLabel } from "@/components/ui";
import { HapticButton } from "@/components/ui/HapticButton";
import { BottomActionBar } from "@/components/ui/BottomActionBar";

export default function ChangePasswordScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useAppToast();
  const { color, radius, space, shadow } = useUI();
  const ERROR = color.danger;
  const WARNING = "#F5A623";
  const SUCCESS = color.success;

  const { mutateAsync: changePassword, isPending } = useMutation({
    mutationFn: (password: string) => AuthService.changePassword(password),
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function getPasswordStrength(password: string): { label: string; color: string; width: string } {
    if (password.length === 0) return { label: "", color: "transparent", width: "0%" };
    if (password.length < 6) return { label: "Too short", color: ERROR, width: "25%" };
    if (password.length < 8) return { label: "Weak", color: ERROR, width: "40%" };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { label: "Fair", color: WARNING, width: "55%" };
    if (score <= 2) return { label: "Good", color: WARNING, width: "70%" };
    return { label: "Strong", color: SUCCESS, width: "100%" };
  }

  const strength = getPasswordStrength(newPassword);

  const handleSave = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
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

  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    toggleShow: () => void
  ) => (
    <View>
      <View style={{ marginBottom: 12 }}>
        <SectionLabel>{label}</SectionLabel>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: color.border,
          paddingBottom: 12,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={label}
          placeholderTextColor={color.muted}
          secureTextEntry={!show}
          autoComplete="new-password"
          style={{
            flex: 1,
            fontSize: 16,
            color: color.text,
            fontFamily: "IBMPlexSans_500Medium",
            padding: 0,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={show ? "Hide password" : "Show password"}
          onPress={toggleShow}
          hitSlop={8}
          style={{ marginLeft: 12 }}
        >
          <icons.Eye size={20} color={show ? color.text : color.muted} strokeWidth={1.75} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: space.page,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 24,
              color: color.text,
            }}
          >
            Change Password
          </Typography>
          <IconButton icon={icons.X} accessibilityLabel="Close" onPress={() => router.back()} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.page, paddingTop: 32, gap: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderField(
            "New password",
            newPassword,
            (v) => {
              setError("");
              setNewPassword(v);
            },
            showPassword,
            () => setShowPassword(!showPassword)
          )}

          {newPassword.length > 0 && (
            <View style={{ marginTop: -16 }}>
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: color.border,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: strength.width as any,
                    borderRadius: 2,
                    backgroundColor: strength.color,
                  }}
                />
              </View>
              <Typography
                style={{
                  fontSize: 12,
                  color: strength.color,
                  fontFamily: "IBMPlexSans_500Medium",
                  marginTop: 4,
                }}
              >
                {strength.label}
              </Typography>
            </View>
          )}

          {renderField(
            "Confirm new password",
            confirmPassword,
            (v) => {
              setError("");
              setConfirmPassword(v);
            },
            showConfirm,
            () => setShowConfirm(!showConfirm)
          )}

          {error && (
            <Typography
              style={{
                color: ERROR,
                fontSize: 13,
                fontFamily: "IBMPlexSans_500Medium",
                marginTop: -16,
              }}
            >
              {error}
            </Typography>
          )}
        </ScrollView>

        <BottomActionBar>
          <HapticButton
            onPress={handleSave}
            disabled={isPending}
            loading={isPending}
            tone="ink"
            height={56}
            style={{ flex: 1 }}
          >
            Update Password
          </HapticButton>
        </BottomActionBar>
      </KeyboardAvoidingView>
    </View>
  );
}
