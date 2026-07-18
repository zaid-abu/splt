import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { Mail, CreditCard } from "lucide-react-native";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralButton } from "@/components/coral/CoralButton";
import { CoralField } from "@/components/coral/CoralField";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { useResetPassword } from "@/features/auth/hooks/useAuthMutations";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/validation/schemas";
import { useAppToast } from "@/hooks/useAppToast";

export default function ForgotPasswordScreen(): JSX.Element {
  const router = useRouter();
  const { authError } = useLocalSearchParams<{ authError?: string }>();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { mutateAsync: resetPassword, isPending } = useResetPassword();

  useEffect(() => {
    if (!authError) return;
    toast.show({
      label: "Recovery link unavailable",
      description: authError,
      variant: "danger",
      placement: "top",
    });
  }, [authError, toast]);

  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await resetPassword(submittedEmail);
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
        description: err.message || "Could not resend.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Reset password" onBack={() => router.back()} />

      {sent ? (
        <View style={{ alignItems: "center", paddingTop: 12 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: coral.accentSoft,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Mail size={36} color={coral.accent} strokeWidth={1.5} />
          </View>

          <LargeTitle style={{ textAlign: "center", marginTop: 0 }}>Check your inbox.</LargeTitle>

          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 17,
              lineHeight: 26,
              letterSpacing: -0.003 * 17,
              color: coral.muted,
              textAlign: "center",
              marginTop: 12,
              marginBottom: 32,
              paddingHorizontal: 8,
            }}
          >
            We&rsquo;ve sent a reset link to{" "}
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", color: coral.foreground }}>
              {submittedEmail}
            </Text>
            . Check spam if it doesn&rsquo;t arrive.
          </Text>

          <View style={{ width: "100%", gap: 12 }}>
            <CoralButton
              label="Back to Sign in"
              variant="primary"
              onPress={() => router.push("/(auth)/login")}
            />

            <CoralButton
              label="Resend email"
              variant="secondary"
              onPress={handleResend}
              loading={isPending}
            />
          </View>

          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 14,
              color: coral.muted,
              textAlign: "center",
              marginTop: 24,
              lineHeight: 20,
            }}
          >
            Didn&rsquo;t receive it? Check your spam folder or resend above.
          </Text>
        </View>
      ) : (
        <>
          <View
            style={{
              alignSelf: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: coral.accentSoft,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 16,
              marginBottom: 24,
            }}
          >
            <CreditCard size={36} color={coral.accent} strokeWidth={1.5} />
          </View>

          <LargeTitle style={{ textAlign: "center", marginTop: 0 }}>
            Reset your password.
          </LargeTitle>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 17,
              lineHeight: 26,
              color: coral.muted,
              textAlign: "center",
              marginTop: 12,
              marginBottom: 28,
              paddingHorizontal: 8,
            }}
          >
            We will email a secure link that returns you to Splt to choose a new password.
          </Text>

          <View style={{ gap: 16 }}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <CoralField
                  label="Email"
                  placeholder="hello@splt.app"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="done"
                  error={errors.email?.message}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

            <View style={{ marginTop: 8 }}>
              <CoralButton
                label="Send reset link"
                variant="primary"
                onPress={handleSubmit(onSubmit, onInvalid)}
                loading={isPending}
              />
            </View>
          </View>
        </>
      )}

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 32 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 16,
              color: coral.accent,
              textDecorationLine: "underline",
            }}
          >
            Back to Sign in
          </Text>
        </Pressable>
      </View>
    </CoralScreen>
  );
}
