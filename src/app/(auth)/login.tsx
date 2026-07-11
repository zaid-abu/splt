import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";
import { useState } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
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

import { useSignIn, useSignInWithGoogle } from "@/features/auth/hooks/useAuthMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginSchema, type LoginFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";
import { useAppToast } from "@/hooks/useAppToast";
import { UI, PressableScale, IconButton } from "@/components/ui/native-ui";
import { useUIStore } from "@/store/useUIStore";

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const { toast } = useAppToast();
  const { mutateAsync: signIn, isPending } = useSignIn();
  const { mutateAsync: signInWithGoogle, isPending: isGoogleLoading } = useSignInWithGoogle();

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
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />

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
                Welcome{"\n"}back.
              </Typography>
              <Typography
                style={{
                  fontFamily: "IBMPlexSans_400Regular",
                  fontSize: 17,
                  color: UI.color.muted,
                  lineHeight: 24,
                }}
              >
                Sign in and pick up where you left off.
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
                tint={isDarkMode ? "dark" : "light"}
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

                <View>
                  <FormInput
                    control={control}
                    name="password"
                    label="Password"
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    accessibilityHint="Enter your password"
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
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      marginTop: 8,
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
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        Forgot Password?
                      </Typography>
                    </Pressable>
                  </View>
                </View>
              </BlurView>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(500).duration(600).springify()}
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
                  {isPending && <ActivityIndicator color={UI.color.textInverse} />}
                  <Typography
                    style={{
                      fontSize: 16,
                      color: UI.color.textInverse,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {isPending ? "Signing in\u2026" : "Sign In"}
                  </Typography>
                </View>
              </PressableScale>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(500).duration(600)}
              style={{ paddingTop: 12 }}
            >
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
                    height: 48,
                    borderRadius: UI.radius.pill,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    backgroundColor: UI.color.control,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 10,
                  }}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator color={UI.color.text} />
                  ) : (
                    <>
                      <Typography
                        style={{
                          fontSize: 14,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        G
                      </Typography>
                      <Typography
                        style={{
                          fontSize: 15,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        Continue with Google
                      </Typography>
                    </>
                  )}
                </View>
              </PressableScale>
            </Animated.View>
          </View>

          <View style={{ flex: 1 }} />

          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
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
              Don&apos;t have an account?
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
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Create one
              </Typography>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
