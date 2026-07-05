import { Button, Typography, PressableFeedback } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useSignIn } from "@/features/auth/hooks/useAuthMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginSchema, type LoginFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";
import { useAppToast } from "@/hooks/useAppToast";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useAppToast();
  const { mutateAsync: signIn, isPending } = useSignIn();

  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signIn(data);
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
        label: "Login Failed",
        description: err.message || "Invalid credentials",
        variant: "danger",
        placement: "top",
      });
    }
  };

  const onInvalid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Fixed Header */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 32,
            paddingBottom: 16,
            backgroundColor: BG,
            zIndex: 10,
          }}
        >
          <PressableFeedback
            accessibilityRole="button"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={{
              width: 40,
              height: 40,
              borderRadius: 0,
              borderWidth: 1,
              borderColor: SEPARATOR,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
            }}
            hitSlop={8}
          >
            <icons.ArrowLeft size={20} color={TEXT_PRIMARY} />
          </PressableFeedback>
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
            {/* Editorial Header */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              style={{ marginBottom: 48 }}
            >
              <Typography
                style={{
                  fontFamily: "UnicaOne_400Regular",
                  fontSize: 56,
                  color: TEXT_PRIMARY,
                  lineHeight: 64,
                  letterSpacing: -0.5,
                  marginBottom: 16,
                }}
              >
                Welcome{"\n"}back.
              </Typography>
              <Typography
                style={{
                  fontFamily: "CrimsonText_400Regular",
                  fontSize: 20,
                  color: TEXT_SECONDARY,
                  lineHeight: 28,
                  maxWidth: 280,
                }}
              >
                Enter your details to securely sign in to your account.
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
                  leftElement={<icons.Mail size={18} color={TEXT_SECONDARY} />}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginBottom: 8,
                    zIndex: 10,
                  }}
                >
                  <PressableFeedback
                    accessibilityRole="button"
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    hitSlop={8}
                  >
                    <Typography
                      style={{
                        fontSize: 13,
                        color: TEXT_PRIMARY,
                        fontFamily: "CrimsonText_700Bold",
                      }}
                    >
                      Forgot Password?
                    </Typography>
                  </PressableFeedback>
                </View>
                <FormInput
                  control={control}
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  leftElement={<icons.Lock size={18} color={TEXT_SECONDARY} />}
                  rightElement={
                    <PressableFeedback
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPassword(!showPassword);
                      }}
                      hitSlop={8}
                    >
                      {showPassword ? (
                        <icons.EyeOff size={18} color={TEXT_SECONDARY} />
                      ) : (
                        <icons.Eye size={18} color={TEXT_SECONDARY} />
                      )}
                    </PressableFeedback>
                  }
                />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(500).duration(600)}
                style={{ marginTop: 24 }}
              >
                <PressableFeedback
                  accessibilityRole="button"
                  style={{
                    width: "100%",
                    height: 56,
                    borderRadius: 0,
                    backgroundColor: TEXT_PRIMARY,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                    opacity: isPending ? 0.7 : 1,
                  }}
                  onPress={handleSubmit(onSubmit, onInvalid)}
                  isDisabled={isPending}
                >
                  {isPending && <ActivityIndicator color="#FFFFFF" />}
                  <Typography
                    style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "CrimsonText_700Bold" }}
                  >
                    {isPending ? "Signing in…" : "Sign In"}
                  </Typography>
                </PressableFeedback>
              </Animated.View>

              {/* Divider */}
              <Animated.View
                entering={FadeInDown.delay(600).duration(600)}
                style={{ flexDirection: "row", alignItems: "center", gap: 16, marginVertical: 16 }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: SEPARATOR }} />
                <Typography
                  style={{
                    fontSize: 12,
                    color: TEXT_SECONDARY,
                    fontFamily: "CrimsonText_700Bold",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  or
                </Typography>
                <View style={{ flex: 1, height: 1, backgroundColor: SEPARATOR }} />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(700).duration(600)}
                style={{ flexDirection: "row", gap: 16 }}
              >
                <PressableFeedback
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 0,
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: SEPARATOR,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <icons.Globe size={20} color={TEXT_PRIMARY} />
                  <Typography
                    style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
                  >
                    Google
                  </Typography>
                </PressableFeedback>
                <PressableFeedback
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 0,
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: SEPARATOR,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <icons.Apple size={20} color={TEXT_PRIMARY} />
                  <Typography
                    style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
                  >
                    Apple
                  </Typography>
                </PressableFeedback>
              </Animated.View>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Footer links */}
          <Animated.View
            entering={FadeInDown.delay(800).duration(600)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingBottom: 8,
              marginTop: 48,
            }}
          >
            <Typography
              style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "CrimsonText_600SemiBold" }}
            >
              Don&apos;t have an account?
            </Typography>
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/register");
              }}
              hitSlop={8}
            >
              <Typography
                style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
              >
                Create one
              </Typography>
            </PressableFeedback>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
