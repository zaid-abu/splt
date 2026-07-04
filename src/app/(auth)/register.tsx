import { Button, Typography, PressableFeedback, useToast, useThemeColor } from "heroui-native";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import * as icons from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useSignUp } from "@/features/auth/hooks/useAuthMutations";
import { registerSchema, type RegisterFormData } from "@/validation/schemas";
import { FormInput } from "@/components/forms/FormInput";

export default function RegisterScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { mutateAsync: signUp, isPending } = useSignUp();

  const [agreed, setAgreed] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, watch } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const watchPassword = watch("password");

  const dangerColor = useThemeColor("danger" as any) as unknown as string;
  const warningColor = useThemeColor("warning" as any) as unknown as string;
  const successColor = useThemeColor("success" as any) as unknown as string;
  const mutedForeground = useThemeColor("muted-foreground" as any) as unknown as string;

  const passwordStrength = useMemo(() => {
    if (!watchPassword) return { label: "", color: "transparent", progress: 0 };
    if (watchPassword.length < 6) return { label: "Weak", color: dangerColor, progress: 33 };
    if (watchPassword.length < 10 || !/\d/.test(watchPassword))
      return { label: "Good", color: warningColor, progress: 66 };
    return { label: "Strong", color: successColor, progress: 100 };
  }, [watchPassword, dangerColor, warningColor, successColor]);

  const strengthStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${passwordStrength.progress}%`, { duration: 300 }),
      backgroundColor: withTiming(passwordStrength.color, { duration: 300 }),
    };
  });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!agreed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Error",
        description: "Please accept the Terms of Service",
        variant: "danger",
        placement: "top",
      });
      return;
    }

    try {
      await signUp({
        email: data.email,
        password: data.password,
        name: data.fullName,
        defaultCurrency: currency,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // AppContext will handle routing when authentication state changes
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        label: "Registration Failed",
        description: err.message || "Could not create account",
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
                <icons.UserPlus size={24} color="white" />
              </View>
              <Typography type="h1" className="font-bold text-[32px] text-foreground mb-2">
                Create account
              </Typography>
              <Typography type="body" className="text-muted-foreground text-[16px]">
                Start splitting expenses with friends.
              </Typography>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200).springify()} className="gap-4">
              <FormInput
                control={control}
                name="fullName"
                label="Full Name"
                placeholder="John Doe"
                autoCapitalize="words"
                autoComplete="name"
                leftElement={<icons.User size={20} color={mutedForeground} />}
                inputClassName="font-medium text-foreground text-[16px]"
                placeholderTextColor={mutedForeground}
              />

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
                <FormInput
                  control={control}
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
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

                {/* Password Strength Indicator */}
                {watchPassword.length > 0 && (
                  <Animated.View entering={FadeIn.duration(200)} className="mt-2">
                    <View className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden flex-row">
                      <Animated.View style={strengthStyle} className="h-full rounded-full" />
                    </View>
                    <Typography
                      type="body-xs"
                      className="mt-1 font-medium"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </Typography>
                  </Animated.View>
                )}
              </View>

              <View className="mb-2 z-10">
                <Typography type="body-sm" className="font-medium text-foreground mb-2">
                  Base Currency
                </Typography>
                <CurrencySelector value={currency} onChange={(c) => setCurrency(c.code)} />
              </View>

              {/* Terms checkbox */}
              <PressableFeedback
                accessibilityRole="button"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAgreed(!agreed);
                }}
              >
                <View className="flex-row items-center gap-3 w-full mt-1">
                  <View
                    className={`w-6 h-6 rounded-md border items-center justify-center ${
                      agreed ? "bg-primary border-primary" : "bg-white border-border"
                    }`}
                  >
                    {agreed && <icons.Check size={14} color="white" strokeWidth={3} />}
                  </View>
                  <View className="flex-1 flex-row items-center flex-wrap">
                    <Typography type="body-sm" className="text-muted-foreground">
                      I agree to the{" "}
                    </Typography>
                    <Typography type="body-sm" className="text-primary font-semibold">
                      Terms of Service
                    </Typography>
                    <Typography type="body-sm" className="text-muted-foreground">
                      {" "}
                      and{" "}
                    </Typography>
                    <Typography type="body-sm" className="text-primary font-semibold">
                      Privacy Policy
                    </Typography>
                  </View>
                </View>
              </PressableFeedback>

              <Button
                variant="primary"
                size="lg"
                className="w-full h-14 rounded-2xl bg-primary mt-4 flex-row items-center justify-center gap-2"
                onPress={handleSubmit(onSubmit, onInvalid)}
                isDisabled={isPending}
              >
                {isPending && <ActivityIndicator color="white" />}
                <Typography type="body" weight="semibold" className="text-white">
                  {isPending ? "Creating account…" : "Create Account"}
                </Typography>
              </Button>
            </Animated.View>
          </View>

          <View className="flex-1" />

          {/* Footer */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="flex-row items-center justify-center gap-2 pb-6 mt-6"
          >
            <Typography type="body-sm" className="text-muted-foreground">
              Already have an account?
            </Typography>
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/login");
              }}
            >
              <Typography type="body-sm" className="font-semibold text-primary">
                Sign in
              </Typography>
            </PressableFeedback>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
