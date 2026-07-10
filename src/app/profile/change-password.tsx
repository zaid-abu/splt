import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, ActivityIndicator, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";

import { AuthService } from "@/services/api/auth";
import { useAppToast } from "@/hooks/useAppToast";
import { UI, IconButton } from "@/components/ui/native-ui";

const ERROR = UI.color.danger;

export default function ChangePasswordScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useAppToast();

  const { mutateAsync: changePassword, isPending } = useMutation({
    mutationFn: (password: string) => AuthService.changePassword(password),
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

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

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: UI.space.page,
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
              color: UI.color.text,
            }}
          >
            Change Password
          </Typography>
          <IconButton
            icon={icons.X}
            accessibilityLabel="Close"
            onPress={() => router.back()}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: UI.space.page, paddingTop: 32, gap: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            value={newPassword}
            onChangeText={(v) => { setError(""); setNewPassword(v); }}
            placeholder="New password"
            placeholderTextColor={UI.color.muted}
            secureTextEntry
            autoComplete="new-password"
            style={{
              fontSize: 16,
              color: UI.color.text,
              fontFamily: "IBMPlexSans_500Medium",
              borderBottomWidth: 1,
              borderBottomColor: UI.color.border,
              paddingBottom: 12,
            }}
          />

          <TextInput
            value={confirmPassword}
            onChangeText={(v) => { setError(""); setConfirmPassword(v); }}
            placeholder="Confirm new password"
            placeholderTextColor={UI.color.muted}
            secureTextEntry
            autoComplete="new-password"
            style={{
              fontSize: 16,
              color: UI.color.text,
              fontFamily: "IBMPlexSans_500Medium",
              borderBottomWidth: 1,
              borderBottomColor: error ? ERROR : UI.color.border,
              paddingBottom: 12,
            }}
          />

          {error && (
            <Typography
              style={{ color: ERROR, fontSize: 13, fontFamily: "IBMPlexSans_500Medium" }}
            >
              {error}
            </Typography>
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: UI.space.page,
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: UI.color.border,
            backgroundColor: UI.color.bg,
          }}
        >
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            onPress={handleSave}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: UI.radius.pill,
              backgroundColor: UI.color.text,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed || isPending ? 0.78 : 1,
            })}
          >
            {isPending && <ActivityIndicator color="#FFFFFF" />}
            <Typography
              style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}
            >
              Update Password
            </Typography>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
