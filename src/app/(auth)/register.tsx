import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"
import { Typography, Switch } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import type { JSX } from "react";
import { useState } from "react";
import { View, Pressable } from "react-native";
import * as icons from "lucide-react-native";
import { useRouter } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useSignUp } from "@/features/auth/hooks/useAuthMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerSchema, type RegisterFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { useAppToast } from "@/hooks/useAppToast";
import { UI } from "@/components/ui/native-ui";
import AuthFormLayout from "@/components/layout/AuthFormLayout";

function RegisterScreen(): JSX.Element {
  const router = useRouter();
  const { toast } = useAppToast();
  const { mutateAsync: signUp, isPending } = useSignUp();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const watchedPassword = useWatch({ control, name: "password" });

  const openLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (!termsAccepted) {
        toast.show({
          label: "Terms Required",
          description: "Please accept the terms of service to continue.",
          variant: "danger",
          placement: "top",
        });
        return;
      }
      await signUp(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const hasOnboarded = await AsyncStorage.getItem("@splt_onboarded");
      if (hasOnboarded === "true") {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Registration Failed",
        description: err.message || "Could not create account.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  const onInvalid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return (
    <AuthFormLayout
      title={"Create\naccount."}
      subtitle="Enter your details to get started."
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      isPending={isPending}
      submitLabel="Create Account"
      submitLoadingLabel="Creating account…"
      footer={
        <>
          <Typography
            style={{ fontSize: 16, color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" }}
          >
            Already have an account?
          </Typography>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/login");
            }}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Typography
              style={{
                fontSize: 16,
                color: UI.color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Sign in
            </Typography>
          </Pressable>
        </>
      }
    >
      <FormInput
        control={control}
        name="name"
        label="Full Name"
        placeholder="John Doe"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        leftElement={<icons.User size={18} color={UI.color.muted} />}
      />

      <FormInput
        control={control}
        name="email"
        label="Email Address"
        placeholder="hello@splt.app"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        leftElement={<icons.Mail size={18} color={UI.color.muted} />}
      />

      <View>
        <FormInput
          control={control}
          name="password"
          label="Password"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          accessibilityHint="Create a strong password"
          returnKeyType="next"
          leftElement={<icons.Lock size={18} color={UI.color.muted} />}
          rightElement={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPassword(!showPassword);
              }}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              {showPassword ? (
                <icons.EyeOff size={18} color={UI.color.muted} />
              ) : (
                <icons.Eye size={18} color={UI.color.muted} />
              )}
            </Pressable>
          }
        />
        <PasswordStrengthMeter password={watchedPassword || ""} />
        {watchedPassword && watchedPassword.length > 0 && watchedPassword.length < 6 && (
          <Typography
            style={{
              fontSize: 12,
              color: UI.color.danger,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: -8,
              marginBottom: 16,
            }}
          >
            Password must be at least 6 characters.
          </Typography>
        )}
      </View>

      <View>
        <FormInput
          control={control}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="••••••••"
          secureTextEntry={!showConfirmPassword}
          autoComplete="new-password"
          accessibilityHint="Re-enter your password"
          returnKeyType="done"
          blurOnSubmit
          leftElement={<icons.Lock size={18} color={UI.color.muted} />}
          rightElement={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowConfirmPassword(!showConfirmPassword);
              }}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              {showConfirmPassword ? (
                <icons.EyeOff size={18} color={UI.color.muted} />
              ) : (
                <icons.Eye size={18} color={UI.color.muted} />
              )}
            </Pressable>
          }
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Switch
          isSelected={termsAccepted}
          onSelectedChange={(v: boolean) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTermsAccepted(v);
          }}
          accessibilityLabel="Accept terms of service"
        />
        <Typography
          style={{
            flex: 1,
            fontSize: 14,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_500Medium",
            lineHeight: 20,
          }}
        >
          I accept the{" "}
          <Typography
            style={{
              fontFamily: "IBMPlexSans_600SemiBold",
              color: UI.color.textStrong,
              fontSize: 14,
              textDecorationLine: "underline",
            }}
            onPress={() => openLink("https://splt.app/terms")}
          >
            Terms of Service
          </Typography>{" "}
          and{" "}
          <Typography
            style={{
              fontFamily: "IBMPlexSans_600SemiBold",
              color: UI.color.textStrong,
              fontSize: 14,
              textDecorationLine: "underline",
            }}
            onPress={() => openLink("https://splt.app/privacy")}
          >
            Privacy Policy
          </Typography>
          .
        </Typography>
      </View>
    </AuthFormLayout>
  );
}

export default withErrorBoundary(RegisterScreen, "Register")
