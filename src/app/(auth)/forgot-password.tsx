import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import * as icons from "lucide-react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useResetPassword } from "@/features/auth/hooks/useAuthMutations";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/validation/schemas";
import { useAppToast } from "@/hooks/useAppToast";
import { useUIStore } from "@/store/useUIStore";
import { PressableScale } from "@/components/ui/PressableScale";
import GlassAuthLayout from "@/components/glassmorphism/GlassAuthLayout";
import { GlassFormInput } from "@/components/glassmorphism/GlassFormInput";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GLASS_LIGHT, GLASS_DARK, GLASS_RADIUS } from "@/constants/glassmorphism-tokens";

export default function ForgotPasswordScreen(): JSX.Element {
  const router = useRouter();
  const { toast } = useAppToast();
  const { mutateAsync: resetPassword, isPending } = useResetPassword();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tokens = isDarkMode ? GLASS_DARK : GLASS_LIGHT;

  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const { control, handleSubmit, getValues } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await resetPassword(data.email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedEmail(data.email);
      setSent(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Reset Failed",
        description: err.message || "Could not send reset email. Please try again.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  const onInvalid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleResend = async () => {
    const email = getValues("email");
    if (!email) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await resetPassword(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show({
        label: "Email Sent",
        description: "Reset link has been resent.",
        variant: "success",
        placement: "top",
      });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Resend Failed",
        description: err.message || "Could not resend. Please try again.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  if (sent) {
    return (
      <GlassAuthLayout
        title="Check your\ninbox."
        subtitle={`We've sent a reset link to ${submittedEmail}. Check spam if it does not arrive.`}
        onSubmit={() => router.push("/(auth)/login")}
        isPending={false}
        submitLabel="Back to Sign In"
        headerTitle="Reset password"
      >
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <Animated.View
            entering={FadeInDown.delay(200).duration(600).springify()}
            style={{ alignItems: "center" }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: GLASS_RADIUS.authMark,
                backgroundColor: isDarkMode ? "#E8ECF4" : "#102033",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <icons.Mail size={32} color={isDarkMode ? "#0A1628" : "#FFFFFF"} strokeWidth={1.5} />
            </View>
          </Animated.View>
          <Typography
            style={{
              fontFamily: "IBMPlexSans_400Regular",
              fontSize: 14,
              color: tokens.muted,
              lineHeight: 20,
              textAlign: "center",
            }}
          >
            Didn&apos;t receive it? Check your spam folder or resend below.
          </Typography>
        </View>

        <View style={{ marginTop: 8 }}>
          <PressableScale onPress={handleResend}>
            <View
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: GLASS_RADIUS.md,
                backgroundColor: tokens.surface,
                borderWidth: 1,
                borderColor: tokens.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                style={{
                  fontSize: 15,
                  color: tokens.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {isPending ? "Sending\u2026" : "Resend email"}
              </Typography>
            </View>
          </PressableScale>
        </View>
      </GlassAuthLayout>
    );
  }

  return (
    <GlassAuthLayout
      title={"Reset\npassword."}
      subtitle="We'll send a reset link to your email address."
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      isPending={isPending}
      submitLabel="Send Reset Link"
      submitLoadingLabel="Sending\u2026"
      headerTitle="Reset password"
    >
      <GlassFormInput
        control={control}
        name="email"
        label="Email Address"
        placeholder="hello@splt.app"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="done"
        blurOnSubmit
        leftElement={<icons.Mail size={18} color={tokens.muted} />}
      />
    </GlassAuthLayout>
  );
}
