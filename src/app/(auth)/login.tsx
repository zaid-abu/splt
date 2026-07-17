import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";
import { useState } from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import * as icons from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { useSignIn, useSignInWithGoogle } from "@/features/auth/hooks/useAuthMutations";
import { useBiometricAuth } from "@/features/auth/hooks/useBiometricAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginSchema, type LoginFormData } from "@/validation/schemas";
import { useAppToast } from "@/hooks/useAppToast";
import { useUIStore } from "@/store/useUIStore";
import { PressableScale } from "@/components/ui/native-ui";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import GlassAuthLayout from "@/components/glassmorphism/GlassAuthLayout";
import { GlassFormInput } from "@/components/glassmorphism/GlassFormInput";
import { GLASS_LIGHT, GLASS_DARK, GLASS_RADIUS } from "@/constants/glassmorphism-tokens";

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const { toast } = useAppToast();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tokens = isDarkMode ? GLASS_DARK : GLASS_LIGHT;
  const { mutateAsync: signIn, isPending } = useSignIn();
  const { mutateAsync: signInWithGoogle, isPending: isGoogleLoading } = useSignInWithGoogle();
  const { isAvailable, hasStoredCredentials, biometricType, saveCredentials, authenticate } =
    useBiometricAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const doSignIn = async (data: LoginFormData, storeForBiometric: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signIn(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (storeForBiometric && isAvailable) {
        await saveCredentials(data.email, data.password);
      }

      const hasOnboarded = await AsyncStorage.getItem("@splt_onboarded");
      if (hasOnboarded === "true") {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Login Failed",
        description: err.message || "Invalid credentials",
        variant: "danger",
        placement: "top",
      });
    }
  };

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    const storeForBiometric = isAvailable && !hasStoredCredentials;
    await doSignIn(data, storeForBiometric);
  };

  const onInvalid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    try {
      const creds = await authenticate();
      if (creds) {
        await doSignIn(creds, false);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <GlassAuthLayout
      title={"Welcome\nback."}
      subtitle="Sign in and pick up where you left off."
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      isPending={isPending}
      submitLabel="Sign In"
      submitLoadingLabel="Signing in\u2026"
      headerTitle="Splt"
      secondaryActions={
        <>
          {isAvailable && hasStoredCredentials && (
            <View style={{ marginBottom: 12 }}>
              <PressableScale onPress={handleBiometricSignIn}>
                <View
                  style={{
                    width: "100%",
                    minHeight: 50,
                    borderRadius: GLASS_RADIUS.md,
                    backgroundColor: tokens.surface,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 10,
                  }}
                >
                  {biometricLoading ? (
                    <ActivityIndicator color={tokens.text} />
                  ) : (
                    <>
                      <icons.Fingerprint size={22} color={tokens.text} strokeWidth={1.5} />
                      <Typography
                        style={{
                          fontSize: 16,
                          color: tokens.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                          letterSpacing: 0.02,
                        }}
                      >
                        Sign in with {biometricType || "Biometrics"}
                      </Typography>
                    </>
                  )}
                </View>
              </PressableScale>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <View
              style={{ flex: 1, height: 1, backgroundColor: tokens.borderSoft }}
            />
            <Typography
              style={{
                fontSize: 12,
                color: tokens.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              or
            </Typography>
            <View
              style={{ flex: 1, height: 1, backgroundColor: tokens.borderSoft }}
            />
          </View>

          <PressableScale
            onPress={async () => {
              try {
                await signInWithGoogle();
              } catch {}
            }}
          >
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
                flexDirection: "row",
                gap: 10,
              }}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={tokens.text} />
              ) : (
                <>
                  <GoogleLogo size={18} />
                  <Typography
                    style={{
                      fontSize: 15,
                      color: tokens.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    Continue with Google
                  </Typography>
                </>
              )}
            </View>
          </PressableScale>
        </>
      }
      footer={
        <>
          <Typography
            style={{ fontSize: 16, color: tokens.muted, fontFamily: "IBMPlexSans_500Medium" }}
          >
            New to Splt?
          </Typography>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create an account"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/register");
            }}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Typography
              style={{
                fontSize: 16,
                color: tokens.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Create one
            </Typography>
          </Pressable>
        </>
      }
    >
      <GlassFormInput
        control={control}
        name="email"
        label="Email Address"
        placeholder="hello@splt.app"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        leftElement={<icons.Mail size={18} color={tokens.muted} />}
      />

      <View>
        <GlassFormInput
          control={control}
          name="password"
          label="Password"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete="password"
          accessibilityHint="Enter your password"
          returnKeyType="done"
          blurOnSubmit
          leftElement={<icons.Lock size={18} color={tokens.muted} />}
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
                <icons.EyeOff size={18} color={tokens.muted} />
              ) : (
                <icons.Eye size={18} color={tokens.muted} />
              )}
            </Pressable>
          }
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/forgot-password");
            }}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Typography
              style={{
                fontSize: 13,
                color: tokens.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Forgot Password?
            </Typography>
          </Pressable>
        </View>
      </View>
    </GlassAuthLayout>
  );
}
