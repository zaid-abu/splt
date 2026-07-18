import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
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
import { useAuth } from "@/context/AppContext";
import { useSignUp } from "@/features/auth/hooks/useAuthMutations";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { registerSchema, type RegisterFormData } from "@/validation/schemas";
import { useAppToast } from "@/hooks/useAppToast";

export default function RegisterScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { requireEmailVerification, refreshAuth } = useAuth();
  const { mutateAsync: signUp, isPending } = useSignUp();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const watchedPassword = watch("password");

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await signUp(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.requiresEmailVerification) {
        requireEmailVerification(result.email);
        router.replace({ pathname: "/verify-email", params: { email: result.email } });
        return;
      }
      await refreshAuth();
      router.replace("/");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  const onInvalid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Create account" onBack={() => router.back()} />

      <LargeTitle>Start with you.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          color: coral.muted,
          marginBottom: 28,
        }}
      >
        Your name helps friends recognize you. You can change it later.
      </Text>

      <View style={{ gap: 16 }}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <CoralField
              label="Full name"
              placeholder="John Doe"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              error={errors.name?.message}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

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
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                returnKeyType="next"
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
          <View style={{ marginTop: -6 }}>
            <PasswordStrengthMeter password={watchedPassword || ""} />
          </View>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: coral.muted,
              marginTop: 4,
            }}
          >
            Use 8 to 72 characters with at least one number or symbol.
          </Text>
        </View>

        <View>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <CoralField
                label="Confirm password"
                placeholder="Repeat your password"
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                returnKeyType="done"
                error={errors.confirmPassword?.message}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                style={{ paddingRight: 44 }}
              />
            )}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowConfirmPassword(!showConfirmPassword);
            }}
            style={{
              position: "absolute",
              right: 12,
              top: 38,
              padding: 4,
            }}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color={coral.muted} strokeWidth={1.6} />
            ) : (
              <Eye size={20} color={coral.muted} strokeWidth={1.6} />
            )}
          </Pressable>
        </View>

        <View style={{ marginTop: 8 }}>
          <CoralButton
            label="Continue"
            variant="primary"
            onPress={handleSubmit(onSubmit, onInvalid)}
            loading={isPending}
          />
        </View>
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
          Already have an account?
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(auth)/login");
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
            Sign in
          </Text>
        </Pressable>
      </View>
    </CoralScreen>
  );
}
