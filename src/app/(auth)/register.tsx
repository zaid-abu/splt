import { Typography, Switch } from "heroui-native";
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
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useSignUp } from "@/features/auth/hooks/useAuthMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerSchema, type RegisterFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { useAppToast } from "@/hooks/useAppToast";
import { UI, PressableScale, IconButton } from "@/components/ui/native-ui";

export default function RegisterScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
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
        description: err.message || "Failed to create account",
        variant: "danger",
        placement: "top",
      });
    }
  };

  const onInvalid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const submitDisabled = isPending || !termsAccepted;

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
                Create{"\n"}account.
              </Typography>
              <Typography
                style={{
                  fontFamily: "IBMPlexSans_400Regular",
                  fontSize: 17,
                  color: UI.color.muted,
                  lineHeight: 24,
                }}
              >
                Join SPLT and start splitting expenses with friends.
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
                  name="name"
                  label="Full Name"
                  placeholder="Maria Doe"
                  autoCapitalize="words"
                  autoComplete="name"
                  leftElement={<icons.User size={18} color={UI.color.muted} />}
                />

                <FormInput
                  control={control}
                  name="email"
                  label="Email Address"
                  placeholder="maria@splt.app"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
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
                    accessibilityHint="Create a strong password with at least 6 characters"
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
                  <PasswordStrengthMeter password={watchedPassword ?? ""} />
                </View>

                <FormInput
                  control={control}
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="••••••••"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
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

                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Switch
                    isSelected={termsAccepted}
                    onSelectedChange={setTermsAccepted}
                    accessibilityLabel="Accept terms of service"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View terms of service"
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    hitSlop={8}
                    style={{ flex: 1 }}
                  >
                    <Typography
                      style={{
                        fontSize: 14,
                        color: UI.color.muted,
                        fontFamily: "IBMPlexSans_400Regular",
                        lineHeight: 20,
                      }}
                    >
                      I agree to the{" "}
                      <Typography
                        style={{
                          fontSize: 14,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        Terms of Service
                      </Typography>
                    </Typography>
                  </Pressable>
                </View>
              </BlurView>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(700).duration(600).springify()}
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
                    opacity: submitDisabled ? 0.45 : 1,
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
                    {isPending ? "Creating account\u2026" : "Create Account"}
                  </Typography>
                </View>
              </PressableScale>
            </Animated.View>
          </View>

          <View style={{ flex: 1 }} />

          <Animated.View
            entering={FadeInDown.delay(800).duration(600)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 16,
              marginTop: 48,
            }}
          >
            <Typography
              style={{ fontSize: 16, color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" }}
            >
              Already have an account?
            </Typography>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in instead"
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
