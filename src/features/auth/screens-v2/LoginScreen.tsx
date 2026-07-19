import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { Eye, EyeOff } from "lucide-react-native";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralButton } from "@/components/coral/CoralButton";
import { CoralField } from "@/components/coral/CoralField";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { useSignIn } from "@/features/auth/hooks/useAuthMutations";
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

  const [showPassword, setShowPassword] = useState(false);

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

  const doSignIn = async (data: LoginFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signIn(data);
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
    await doSignIn(data);
  };

  const onInvalid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
            variant="secondary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/forgot-password");
            }}
          />
        </View>
      </View>
    </CoralScreen>
  );
}
