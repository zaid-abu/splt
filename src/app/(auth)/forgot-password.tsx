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
import { FormInput } from "@/components/forms/FormInput";
import { useAppToast } from "@/hooks/useAppToast";
import { UI, PressableScale } from "@/components/ui/native-ui";
import AuthFormLayout from "@/components/layout/AuthFormLayout";

export default function ForgotPasswordScreen(): JSX.Element {
  const router = useRouter();
  const { toast } = useAppToast();
  const { mutateAsync: resetPassword, isPending } = useResetPassword();

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
      <AuthFormLayout
        title={"Check your\ninbox."}
        subtitle={`We've sent a reset link to ${submittedEmail}.`}
        onSubmit={() => router.push("/(auth)/login")}
        isPending={false}
        submitLabel="Back to Sign In"
        footer={undefined}
      >
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: UI.radius.xl,
              backgroundColor: UI.color.control,
              borderWidth: 1,
              borderColor: UI.color.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <icons.Mail size={32} color={UI.color.text} strokeWidth={1.5} />
          </View>
          <Typography
            style={{
              fontFamily: "IBMPlexSans_400Regular",
              fontSize: 14,
              color: UI.color.muted,
              lineHeight: 20,
              textAlign: "center",
            }}
          >
            Didn&apos;t receive it? Check your spam folder or resend below.
          </Typography>
        </View>

        <View style={{ marginTop: 8 }}>
          <PressableScale onPress={handleResend}>
            <View style={{ paddingVertical: 8 }}>
              <Typography
                style={{
                  fontSize: 15,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  textAlign: "center",
                }}
              >
                {isPending ? "Sending\u2026" : "Resend email"}
              </Typography>
            </View>
          </PressableScale>
        </View>
      </AuthFormLayout>
    );
  }

  return (
    <AuthFormLayout
      title={"Reset\npassword."}
      subtitle="We'll send a reset link to your email address."
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      isPending={isPending}
      submitLabel="Send Reset Link"
      submitLoadingLabel="Sending\u2026"
    >
      <FormInput
        control={control}
        name="email"
        label="Email Address"
        placeholder="hello@splt.app"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="done"
        blurOnSubmit
        leftElement={<icons.Mail size={18} color={UI.color.muted} />}
      />
    </AuthFormLayout>
  );
}
