import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, View, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useSignUp } from "@/features/auth/hooks/useAuthMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerSchema, type RegisterFormData } from "@/features/auth/schemas/authSchema";
import { FormInput } from "@/components/forms/FormInput";
import { useAppToast } from "@/hooks/useAppToast";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/primitives/Text";
import { GradientBackground } from "@/components/primitives/GradientBackground";

export default function RegisterScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useAppToast();
  const { mutateAsync: signUp, isPending } = useSignUp();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

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
        title: "Registration Failed",
        message: err.message || "Failed to create account",
        type: "error",
      });
    }
  };

  const onInvalid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return (
    <GradientBackground variant="primary" className="flex-1">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView
          edges={["top"]}
          className="px-6 pb-4 pt-4 z-10"
        >
          <Button
            variant="ghost"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            className="w-11 h-11 p-0 rounded-xl items-center justify-center border border-border"
          >
            <icons.ArrowLeft size={20} className="text-foreground" />
          </Button>
        </SafeAreaView>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
          contentContainerClassName="flex-grow pt-6 justify-between"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              className="mb-12"
            >
              <Text variant="screenTitle" className="text-white text-5xl leading-[56px] tracking-tight mb-4">
                Create{"\n"}account.
              </Text>
              <Text variant="body" color="muted" className="text-lg leading-7 max-w-[280px]">
                Join SPLT and start splitting expenses with friends effortlessly.
              </Text>
            </Animated.View>

            <View className="gap-6">
              <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                <FormInput
                  control={control}
                  name="name"
                  label="Full Name"
                  placeholder="Maria Doe"
                  autoCapitalize="words"
                  autoComplete="name"
                  leftElement={<icons.User size={18} className="text-muted-foreground" />}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                <FormInput
                  control={control}
                  name="email"
                  label="Email Address"
                  placeholder="maria@splt.app"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftElement={<icons.Mail size={18} className="text-muted-foreground" />}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                <FormInput
                  control={control}
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  leftElement={<icons.Lock size={18} className="text-muted-foreground" />}
                  rightElement={
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPassword(!showPassword);
                      }}
                      hitSlop={8}
                    >
                      {showPassword ? (
                        <icons.EyeOff size={18} className="text-muted-foreground" />
                      ) : (
                        <icons.Eye size={18} className="text-muted-foreground" />
                      )}
                    </Pressable>
                  }
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(600).duration(600)}>
                <FormInput
                  control={control}
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="••••••••"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  leftElement={<icons.Lock size={18} className="text-muted-foreground" />}
                  rightElement={
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowConfirmPassword(!showConfirmPassword);
                      }}
                      hitSlop={8}
                    >
                      {showConfirmPassword ? (
                        <icons.EyeOff size={18} className="text-muted-foreground" />
                      ) : (
                        <icons.Eye size={18} className="text-muted-foreground" />
                      )}
                    </Pressable>
                  }
                />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(700).duration(600)}
                className="mt-6"
              >
                <Button
                  className="w-full"
                  onPress={handleSubmit(onSubmit, onInvalid)}
                  loading={isPending}
                  size="lg"
                >
                  Create Account
                </Button>
              </Animated.View>
            </View>
          </View>

          <Animated.View
            entering={FadeInDown.delay(800).duration(600)}
            className="flex-row items-center justify-center gap-2 pb-2 mt-12"
          >
            <Text variant="bodySmall" color="muted" className="font-semibold">
              Already have an account?
            </Text>
            <Button
              variant="ghost"
              size="sm"
              className="border-0 px-0 h-auto"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/login");
              }}
            >
              <Text variant="link">Sign in</Text>
            </Button>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
