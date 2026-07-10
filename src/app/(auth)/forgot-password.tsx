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
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useResetPassword } from "@/features/auth/hooks/useAuthMutations";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";
import { useAppToast } from "@/hooks/useAppToast";
import { UI, PressableScale, IconButton } from "@/components/ui/native-ui";

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
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 24,
            paddingBottom: 16,
            backgroundColor: UI.color.bg,
            zIndex: 10,
          }}
        >
          <IconButton
            icon={icons.ArrowLeft}
            accessibilityLabel="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          />
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1 }}>
            {!sent ? (
              <>
                <Animated.View
                  entering={FadeInDown.delay(200).duration(600).springify()}
                  style={{ marginBottom: 40 }}
                >
                  <Typography
                    style={{
                      fontFamily: "Sora_600SemiBold",
                      fontSize: 40,
                      color: UI.color.textStrong,
                      lineHeight: 46,
                      letterSpacing: -0.02,
                      marginBottom: 12,
                    }}
                  >
                    Reset{"\n"}password.
                  </Typography>
                  <Typography
                    style={{
                      fontFamily: "IBMPlexSans_400Regular",
                      fontSize: 17,
                      color: UI.color.muted,
                      lineHeight: 24,
                    }}
                  >
                    We&apos;ll send a reset link to your email address.
                  </Typography>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(300).duration(600).springify()}
                  style={{
                    borderRadius: UI.radius.lg,
                    overflow: "hidden",
                  }}
                >
                  <BlurView
                    intensity={Platform.OS === "ios" ? 80 : 90}
                    tint="light"
                    style={{
                      padding: 20,
                      gap: 20,
                      backgroundColor: Platform.OS === "android" ? UI.color.control : "transparent",
                    }}
                  >
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
                  </BlurView>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.delay(400).duration(600).springify()}
                  style={{ marginTop: 24 }}
                >
                  <PressableScale onPress={handleSubmit(onSubmit, onInvalid)}>
                    <View
                      style={{
                        width: "100%",
                        height: 56,
                        borderRadius: UI.radius.pill,
                        backgroundColor: UI.color.text,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        opacity: isPending ? 0.7 : 1,
                      }}
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
                    </View>
                  </PressableScale>
                </Animated.View>
              </>
            ) : (
              <>
                <Animated.View
                  entering={FadeInDown.delay(200).duration(600).springify()}
                  style={{ flex: 1, justifyContent: "center", paddingBottom: 40 }}
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
                        fontSize: 26,
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
                        fontFamily: "IBMPlexSans_500Medium",
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
                    <PressableScale onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(auth)/login"); }}>
                      <View
                        style={{
                          width: "100%",
                          height: 56,
                          borderRadius: UI.radius.pill,
                          backgroundColor: UI.color.text,
                          alignItems: "center",
                          justifyContent: "center",
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
                      </View>
                    </PressableScale>

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
                </Animated.View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
