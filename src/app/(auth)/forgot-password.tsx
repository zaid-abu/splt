import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useResetPassword } from "@/features/auth/hooks/useAuthMutations";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";
import { useAppToast } from "@/hooks/useAppToast";
import { UI } from "@/components/ui/native-ui";

export default function ForgotPasswordScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    try {
      await resetPassword(email);
      toast.show({
        label: "Email resent",
        description: "Check your inbox for the reset link.",
        variant: "success",
        placement: "top",
      });
    } catch (err: any) {
      toast.show({
        label: "Resend Failed",
        description: err.message || "Could not resend. Please try again.",
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
        {/* Fixed header with back */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 32,
            paddingBottom: 16,
            backgroundColor: UI.color.bg,
            zIndex: 10,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: UI.radius.pill,
              borderWidth: 1,
              borderColor: UI.color.border,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: UI.color.control,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <icons.ArrowLeft size={20} color={UI.color.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 32,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1 }}>
            {!sent ? (
              <>
                {/* Editorial header */}
                <Animated.View
                  entering={FadeInDown.delay(200).duration(600)}
                  style={{ marginBottom: 48 }}
                >
                  <Typography
                    style={{
                      fontFamily: "Sora_600SemiBold",
                      fontSize: 44,
                      color: UI.color.textStrong,
                      lineHeight: 50,
                      letterSpacing: -0.02,
                      marginBottom: 16,
                    }}
                  >
                    Reset{"\n"}password.
                  </Typography>
                  <Typography
                    style={{
                      fontFamily: "IBMPlexSans_400Regular",
                      fontSize: 18,
                      color: UI.color.muted,
                      lineHeight: 26,
                      maxWidth: 280,
                    }}
                  >
                    We&apos;ll send a reset link to your email address.
                  </Typography>
                </Animated.View>

                {/* Form */}
                <View style={{ gap: 24 }}>
                  <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                    <FormInput
                      control={control}
                      name="email"
                      label="Email Address"
                      placeholder="hello@splt.app"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      leftElement={<icons.Mail size={18} color={UI.color.muted} />}
                    />
                  </Animated.View>

                  <Animated.View
                    entering={FadeInDown.delay(400).duration(600)}
                    style={{ marginTop: 24 }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send password reset link"
                      disabled={isPending}
                      style={({ pressed }) => ({
                        width: "100%",
                        height: 56,
                        borderRadius: UI.radius.pill,
                        backgroundColor: UI.color.text,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        opacity: pressed || isPending ? 0.7 : 1,
                      })}
                      onPress={handleSubmit(onSubmit, onInvalid)}
                    >
                      {isPending && <ActivityIndicator color="#FFFFFF" />}
                      <Typography
                        style={{
                          fontSize: 16,
                          color: "#FFFFFF",
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {isPending ? "Sending\u2026" : "Send Reset Link"}
                      </Typography>
                    </Pressable>
                  </Animated.View>
                </View>
              </>
            ) : (
              <>
                {/* Success state */}
                <Animated.View
                  entering={FadeInDown.delay(200).duration(600)}
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    paddingBottom: 80,
                  }}
                >
                  <Animated.View
                    entering={FadeInDown.delay(200).duration(600)}
                    style={{
                      alignItems: "center",
                      backgroundColor: UI.color.surface,
                      borderRadius: UI.radius.lg,
                      borderWidth: 1,
                      borderColor: UI.color.border,
                      padding: 32,
                    }}
                  >
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
                        marginBottom: 24,
                      }}
                    >
                      <icons.Mail size={32} color={UI.color.text} strokeWidth={1.5} />
                    </View>

                    <Typography
                      style={{
                        fontFamily: "Sora_600SemiBold",
                        fontSize: 28,
                        color: UI.color.textStrong,
                        textAlign: "center",
                        marginBottom: 12,
                        letterSpacing: -0.02,
                      }}
                    >
                      Check your inbox
                    </Typography>

                    <Typography
                      style={{
                        fontFamily: "IBMPlexSans_400Regular",
                        fontSize: 16,
                        color: UI.color.text,
                        lineHeight: 24,
                        textAlign: "center",
                        marginBottom: 8,
                      }}
                    >
                      We&apos;ve sent a reset link to{" "}
                      <Typography
                        style={{
                          fontFamily: "IBMPlexSans_600SemiBold",
                          fontSize: 16,
                          color: UI.color.text,
                        }}
                      >
                        {submittedEmail}
                      </Typography>
                      .
                    </Typography>

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
                  </Animated.View>

                  <View style={{ gap: 14, marginTop: 32 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Back to sign in"
                      style={({ pressed }) => ({
                        width: "100%",
                        height: 56,
                        borderRadius: UI.radius.pill,
                        backgroundColor: UI.color.text,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.75 : 1,
                      })}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push("/(auth)/login");
                      }}
                    >
                      <Typography
                        style={{
                          fontSize: 16,
                          color: "#FFFFFF",
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        Back to Sign In
                      </Typography>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Resend reset email"
                      disabled={isPending}
                      onPress={handleResend}
                      hitSlop={8}
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
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
                    </Pressable>
                  </View>
                </Animated.View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
