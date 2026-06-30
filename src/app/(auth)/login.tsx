/**
 * Login Screen
 *
 * Built with HeroUI components to match the design tokens.
 */
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  LinkButton,
  TextField,
  Typography,
  Surface,
} from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get("window");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(): Promise<void> {
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    // Simulate login
    await new Promise((r) => setTimeout(r, 1000));
    router.replace("/(tabs)");
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Top Decorative Header matching the brand identity */}
      <Surface 
        className="bg-primary absolute w-full rounded-b-[40px] items-center justify-center"
        style={{ height: height * 0.35 }}
      >
        <Typography type="h1" className="font-black text-primary-foreground tracking-tighter" style={{ fontSize: 40 }}>
          splt
        </Typography>
        <Typography type="body-sm" className="text-secondary opacity-80 mt-2">
          Split bills effortlessly
        </Typography>
      </Surface>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: height * 0.28,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card className="rounded-[24px] bg-surface border-0 mb-6">
            <Card.Header className="pt-8 pb-2 items-center border-b-0">
              <Typography type="h3" className="font-bold text-foreground">
                Welcome back 👋
              </Typography>
              <Typography type="body-sm" className="text-muted-foreground mt-1 text-center">
                Sign in to your account to continue
              </Typography>
            </Card.Header>
            <Card.Body className="gap-5 px-6 pb-8">
              <TextField isRequired>
                <Label className="text-foreground font-semibold mb-1">Email</Label>
                <Input
                  placeholder="hello@splt.app"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="bg-surface-secondary border-muted h-14 rounded-xl"
                />
              </TextField>

              <TextField isRequired>
                <View className="flex-row justify-between items-center w-full mb-1">
                  <Label className="text-foreground font-semibold">Password</Label>
                  <LinkButton onPress={() => {}} className="text-accent py-0">Forgot?</LinkButton>
                </View>
                <Input
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  className="bg-surface-secondary border-muted h-14 rounded-xl"
                />
              </TextField>

              {error ? (
                <Alert status="danger" className="rounded-xl mt-2">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{error}</Alert.Title>
                  </Alert.Content>
                </Alert>
              ) : null}

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4 h-14 rounded-[16px] bg-primary"
                onPress={handleLogin}
                isDisabled={loading}
              >
                <Typography type="body" weight="semibold" className="text-primary-foreground">
                  {loading ? "Signing in…" : "Sign In"}
                </Typography>
              </Button>
            </Card.Body>
          </Card>
          </Animated.View>

          {/* Footer links */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="flex-row items-center justify-center gap-2 mt-4">
            <Typography type="body-sm" className="text-muted-foreground">
              Don&apos;t have an account?
            </Typography>
            <LinkButton onPress={() => router.push("/(auth)/register")} className="text-primary font-semibold">
              Sign up
            </LinkButton>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
