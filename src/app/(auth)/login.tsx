import { Button, Typography, PressableFeedback, useToast, useThemeColor } from "heroui-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
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
import { loginSchema, type LoginFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { mutateAsync: signIn, isPending } = useSignIn();

  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutedForeground = useThemeColor("muted-foreground" as any) as unknown as string;
  const foreground = useThemeColor("foreground" as any) as unknown as string;

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await signIn(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // AppContext will handle routing when authentication state changes
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
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center">
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-8">
              <View className="w-12 h-12 bg-primary rounded-[16px] items-center justify-center mb-6">
                <icons.Wallet size={24} color="white" />
              </View>
              <Typography type="h1" className="font-bold text-[32px] text-foreground mb-2">
                Welcome back
              </Typography>
              <Typography type="body" className="text-muted-foreground text-[16px]">
                Enter your details to sign in to your account.
              </Typography>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200).springify()} className="gap-4">
              <FormInput
                control={control}
                name="email"
                label="Email Address"
                placeholder="hello@splt.app"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftElement={<icons.Mail size={20} color={mutedForeground} />}
                inputClassName="font-medium text-foreground text-[16px]"
                placeholderTextColor={mutedForeground}
              />

              <View>
                <View className="flex-row justify-between items-center mb-2 z-10">
                  <View />
                  <PressableFeedback
                    accessibilityRole="button"
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="absolute right-0 top-1"
                  >
                    <Typography type="body-sm" className="font-semibold text-primary">
                      Forgot?
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
                  leftElement={<icons.Lock size={20} color={mutedForeground} />}
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
                        <icons.EyeOff size={20} color={mutedForeground} />
                      ) : (
                        <icons.Eye size={20} color={mutedForeground} />
                      )}
                    </PressableFeedback>
                  }
                  inputClassName="font-medium text-foreground text-[16px]"
                  placeholderTextColor={mutedForeground}
                />
              </View>

              <Button
                variant="primary"
                size="lg"
                className="w-full h-14 rounded-2xl bg-primary mt-2 flex-row items-center justify-center gap-2"
                onPress={handleSubmit(onSubmit, onInvalid)}
                isDisabled={isPending}
              >
                {isPending && <ActivityIndicator color="white" />}
                <Typography type="body" weight="semibold" className="text-white">
                  {isPending ? "Signing in…" : "Sign In"}
                </Typography>
              </Button>

              {/* Divider */}
              <View className="flex-row items-center gap-4 my-2">
                <View className="flex-1 h-[1px] bg-border" />
                <Typography type="body-xs" className="text-muted-foreground font-medium">
                  OR
                </Typography>
                <View className="flex-1 h-[1px] bg-border" />
              </View>

              <View className="flex-row gap-4">
                <Button
                  variant="secondary"
                  className="flex-1 h-14 rounded-2xl bg-surface-secondary border border-border/50 flex-row items-center justify-center gap-2"
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <icons.Globe size={20} color={foreground} />
                  <Typography type="body" weight="semibold" className="text-foreground">
                    Google
                  </Typography>
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 h-14 rounded-2xl bg-surface-secondary border border-border/50 flex-row items-center justify-center gap-2"
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <icons.Apple size={20} color={foreground} />
                  <Typography type="body" weight="semibold" className="text-foreground">
                    Apple
                  </Typography>
                </Button>
              </View>
            </Animated.View>
          </View>

          <View className="flex-1" />

          {/* Footer links */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="flex-row items-center justify-center gap-2 pb-6"
          >
            <Typography type="body-sm" className="text-muted-foreground">
              Don&apos;t have an account?
            </Typography>
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/register");
              }}
            >
              <Typography type="body-sm" className="font-semibold text-primary">
                Create one
              </Typography>
            </PressableFeedback>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
