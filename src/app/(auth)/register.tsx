import { Button, Typography, PressableFeedback, useThemeColor } from "heroui-native";
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

import { useSignUp } from "@/features/auth/hooks/useAuthMutations";
import { registerSchema, type RegisterFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";
import { useAppToast } from "@/hooks/useAppToast";

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

  const foreground = useThemeColor("foreground" as any) as unknown as string;
  const inputForeground = useThemeColor("input-foreground" as any) as unknown as string;

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signUp(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
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

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 32,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mb-10">
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
              className="w-10 h-10 rounded-none border border-border-light items-center justify-center bg-surface"
              hitSlop={8}
            >
              <icons.ArrowLeft size={20} color={foreground} />
            </PressableFeedback>
          </Animated.View>

          <View className="flex-1">
            {/* Editorial Header */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mb-12">
              <Typography type="h1" className="font-heading text-[48px] text-foreground mb-4 leading-tight">
                Create{"\n"}account.
              </Typography>
              <Typography type="body" className="text-muted-foreground text-[18px] max-w-[280px] leading-relaxed">
                Join SPLT and start splitting expenses with friends effortlessly.
              </Typography>
            </Animated.View>

            {/* Form */}
            <View className="gap-6">
              <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                <FormInput
                  control={control}
                  name="name"
                  label="Full Name"
                  placeholder="Maria Doe"
                  autoCapitalize="words"
                  autoComplete="name"
                  leftElement={<icons.User size={18} color={inputForeground} />}
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
                  leftElement={<icons.Mail size={18} color={inputForeground} />}
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
                  leftElement={<icons.Lock size={18} color={inputForeground} />}
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
                        <icons.EyeOff size={18} color={inputForeground} />
                      ) : (
                        <icons.Eye size={18} color={inputForeground} />
                      )}
                    </PressableFeedback>
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
                  leftElement={<icons.Lock size={18} color={inputForeground} />}
                  rightElement={
                    <PressableFeedback
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowConfirmPassword(!showConfirmPassword);
                      }}
                      hitSlop={8}
                    >
                      {showConfirmPassword ? (
                        <icons.EyeOff size={18} color={inputForeground} />
                      ) : (
                        <icons.Eye size={18} color={inputForeground} />
                      )}
                    </PressableFeedback>
                  }
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(700).duration(600)} className="mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full h-[52px] rounded-none bg-primary flex-row items-center justify-center gap-2 shadow-sm"
                  onPress={handleSubmit(onSubmit, onInvalid)}
                  isDisabled={isPending}
                >
                  {isPending && <ActivityIndicator color="white" />}
                  <Typography type="body" className="text-primary-foreground text-[15px] font-semibold">
                    {isPending ? "Creating account…" : "Create Account"}
                  </Typography>
                </Button>
              </Animated.View>
            </View>
          </View>

          <View className="flex-1" />

          {/* Footer */}
          <Animated.View
            entering={FadeInDown.delay(800).duration(600)}
            className="flex-row items-center justify-center gap-2 pb-2 mt-12"
          >
            <Typography type="body" className="text-muted-foreground">
              Already have an account?
            </Typography>
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/login");
              }}
              hitSlop={8}
            >
              <Typography type="body" className="font-bold text-foreground">
                Sign in
              </Typography>
            </PressableFeedback>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
