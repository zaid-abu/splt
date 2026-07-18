import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { Eye, EyeOff, Fingerprint } from "lucide-react-native";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralButton } from "@/components/coral/CoralButton";
import { CoralField } from "@/components/coral/CoralField";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import {
  useSignIn,
  useSignInWithGoogle,
  useSignInWithApple,
} from "@/features/auth/hooks/useAuthMutations";
import { useBiometricAuth } from "@/features/auth/hooks/useBiometricAuth";
import { loginSchema, type LoginFormData } from "@/validation/schemas";
import { useAppToast } from "@/hooks/useAppToast";
import { useAuth } from "@/context/AppContext";
import { EmailVerificationRequiredError } from "@/services/api/auth";

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const { email, authError, passwordReset } = useLocalSearchParams<{
    email?: string;
    authError?: string;
    passwordReset?: string;
  }>();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { requireEmailVerification, refreshAuth } = useAuth();
  const { mutateAsync: signIn, isPending } = useSignIn();
  const { mutateAsync: signInWithGoogle, isPending: isGoogleLoading } = useSignInWithGoogle();
  const { mutateAsync: signInWithApple, isPending: isAppleLoading } = useSignInWithApple();
  const { isAvailable, hasStoredCredentials, biometricType, saveCredentials, authenticate } =
    useBiometricAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    if (passwordReset === "success") {
      toast.show({
        label: "Password updated",
        description: "Sign in with your new password.",
        variant: "success",
        placement: "top",
      });
    } else if (authError) {
      toast.show({
        label: "Sign in link unavailable",
        description: authError,
        variant: "danger",
        placement: "top",
      });
    }
  }, [authError, passwordReset, toast]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: email ?? "", password: "" },
  });

  const doSignIn = async (data: LoginFormData, storeForBiometric: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signIn(data);
      if (storeForBiometric && isAvailable) await saveCredentials(data.email, data.password);
      await refreshAuth();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error instanceof EmailVerificationRequiredError) {
        requireEmailVerification(error.email);
        router.replace({ pathname: "/verify-email", params: { email: error.email } });
        return;
      }
      toast.show({
        label: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials.",
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

  const handleSocialSignIn = async (fn: () => Promise<unknown>, isPending: boolean) => {
    if (isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await fn();
      await refreshAuth();
      router.replace("/");
    } catch (error) {
      toast.show({
        label: "Sign in failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Sign in" onBack={() => router.back()} />

      <LargeTitle>Welcome back.</LargeTitle>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          color: coral.muted,
          marginBottom: 28,
        }}
      >
        Sign in to see balances, shared activity, and bills waiting for review.
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
              returnKeyType="next"
              error={errors.email?.message}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <View>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <CoralField
                label="Password"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                returnKeyType="done"
                error={errors.password?.message}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                style={{ paddingRight: 44 }}
              />
            )}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPassword(!showPassword);
            }}
            style={{
              position: "absolute",
              right: 12,
              top: 38,
              padding: 4,
            }}
          >
            {showPassword ? (
              <EyeOff size={20} color={coral.muted} strokeWidth={1.6} />
            ) : (
              <Eye size={20} color={coral.muted} strokeWidth={1.6} />
            )}
          </Pressable>
        </View>

        <View style={{ marginTop: 8, gap: 12 }}>
          <CoralButton
            label="Sign in"
            variant="primary"
            onPress={handleSubmit(onSubmit, onInvalid)}
            loading={isPending}
          />

          <CoralButton
            label="Forgot password?"
            variant="text"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/forgot-password");
            }}
          />

          {isAvailable && hasStoredCredentials && (
            <Pressable onPress={handleBiometricSignIn}>
              <View
                style={{
                  width: "100%",
                  minHeight: 52,
                  borderRadius: 14,
                  backgroundColor: coral.surface,
                  borderWidth: 1,
                  borderColor: coral.border,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                {biometricLoading ? (
                  <ActivityIndicator size="small" color={coral.foreground} />
                ) : (
                  <>
                    <Fingerprint size={22} color={coral.foreground} strokeWidth={1.5} />
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 16,
                        letterSpacing: 0.02 * 16,
                        color: coral.foreground,
                      }}
                    >
                      Sign in with {biometricType || "Biometrics"}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 8,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: coral.border }} />
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 13,
              color: coral.muted,
            }}
          >
            or
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: coral.border }} />
        </View>

        <SocialButton
          label="Google"
          icon="G"
          onPress={() => handleSocialSignIn(signInWithGoogle, isGoogleLoading)}
          loading={isGoogleLoading}
          coral={coral}
        />

        <SocialButton
          label="Apple"
          icon=""
          onPress={() => handleSocialSignIn(signInWithApple, isAppleLoading)}
          loading={isAppleLoading}
          coral={coral}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          marginTop: 32,
        }}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 16,
            color: coral.muted,
          }}
        >
          New to Splt?
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(auth)/register");
          }}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 16,
              color: coral.accent,
            }}
          >
            Create one
          </Text>
        </Pressable>
      </View>
    </CoralScreen>
  );
}

function SocialButton({
  label,
  icon,
  onPress,
  loading,
  coral,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  loading: boolean;
  coral: ReturnType<typeof useCoralColors>;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            width: "100%",
            minHeight: 52,
            borderRadius: 14,
            backgroundColor: coral.surface,
            borderWidth: 1,
            borderColor: coral.border,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            opacity: pressed ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={coral.foreground} />
          ) : (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "InstrumentSans_600SemiBold",
                  color: coral.foreground,
                }}
              >
                {icon}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  letterSpacing: 0.02 * 16,
                  color: coral.foreground,
                }}
              >
                Continue with {label}
              </Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}
