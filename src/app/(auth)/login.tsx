import { Button, Typography, PressableFeedback, useToast } from "heroui-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(): Promise<void> {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email.trim() || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({ label: "Error", description: "Please fill in all fields", variant: "danger", placement: "top" });
      return;
    }
    setLoading(true);
    // Simulate login
    await new Promise((r) => setTimeout(r, 1000));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  }

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
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-10">
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
          <Animated.View entering={FadeInDown.delay(200).springify()} className="gap-5">
            <View>
              <Typography type="body-sm" className="font-medium text-foreground mb-2">
                Email Address
              </Typography>
              <View className="flex-row items-center bg-surface-secondary border border-border/50 h-14 rounded-2xl px-4">
                <icons.Mail size={20} color="#8A8798" />
                <TextInput
                  placeholder="hello@splt.app"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="flex-1 ml-3 font-medium text-foreground text-[16px]"
                  placeholderTextColor="#8A8798"
                />
              </View>
            </View>

            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Typography type="body-sm" className="font-medium text-foreground">
                  Password
                </Typography>
                <PressableFeedback onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                  <Typography type="body-sm" className="font-semibold text-primary">
                    Forgot?
                  </Typography>
                </PressableFeedback>
              </View>
              <View className="flex-row items-center bg-surface-secondary border border-border/50 h-14 rounded-2xl px-4">
                <icons.Lock size={20} color="#8A8798" />
                <TextInput
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  className="flex-1 ml-3 font-medium text-foreground text-[16px]"
                  placeholderTextColor="#8A8798"
                />
                <PressableFeedback 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPassword(!showPassword);
                  }}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <icons.EyeOff size={20} color="#8A8798" />
                  ) : (
                    <icons.Eye size={20} color="#8A8798" />
                  )}
                </PressableFeedback>
              </View>
            </View>

            <Button
              variant="primary"
              size="lg"
              className="w-full h-14 rounded-2xl bg-primary mt-2 flex-row items-center justify-center gap-2"
              onPress={handleLogin}
              isDisabled={loading}
            >
              {loading && <ActivityIndicator color="white" />}
              <Typography type="body" weight="semibold" className="text-white">
                {loading ? "Signing in…" : "Sign In"}
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
                <icons.Globe size={20} color="#1E1E1E" />
                <Typography type="body" weight="semibold" className="text-foreground">
                  Google
                </Typography>
              </Button>
              <Button
                variant="secondary"
                className="flex-1 h-14 rounded-2xl bg-surface-secondary border border-border/50 flex-row items-center justify-center gap-2"
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <icons.Apple size={20} color="#1E1E1E" />
                <Typography type="body" weight="semibold" className="text-foreground">
                  Apple
                </Typography>
              </Button>
            </View>
          </Animated.View>
          
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
