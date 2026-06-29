/**
 * Register Screen
 *
 * Built with HeroUI components to match the design tokens.
 */
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  LinkButton,
  TextField,
  Typography,
  Surface,
} from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CurrencySelector } from "@/components/CurrencySelector";

export default function RegisterScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get("window");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(): Promise<void> {
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms of Service");
      return;
    }
    setLoading(true);
    setError("");
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
          Create your account ✨
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
            paddingTop: height * 0.23,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <Card className="rounded-[24px] bg-surface border-0 mb-6">
            <Card.Header className="pt-8 pb-2 items-center border-b-0">
              <Typography type="h3" className="font-bold text-foreground">
                Create account
              </Typography>
              <Typography type="body-sm" className="text-muted-foreground mt-1 text-center">
                Start splitting expenses with friends
              </Typography>
            </Card.Header>
            <Card.Body className="gap-5 px-6 pb-8">
              <TextField isRequired>
                <Label className="text-foreground font-semibold mb-1">Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  className="bg-surface-secondary border-muted h-14 rounded-xl"
                />
              </TextField>

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
                <Label className="text-foreground font-semibold mb-1">Password</Label>
                <Input
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  className="bg-surface-secondary border-muted h-14 rounded-xl"
                />
              </TextField>

              <View className="mb-2 z-10">
                <Label className="text-foreground font-semibold mb-2">Base Currency</Label>
                <CurrencySelector 
                  value={currency} 
                  onChange={(c) => setCurrency(c.code)} 
                />
              </View>

              {/* Terms checkbox */}
              <View className="flex-row items-start gap-3 mt-1">
                <Checkbox
                  isSelected={agreed}
                  onSelectedChange={setAgreed}
                  className="mt-1"
                >
                  <Checkbox.Indicator />
                </Checkbox>
                <View className="flex-1">
                  <View className="flex-row items-center flex-wrap">
                    <Typography type="body-sm" className="text-muted-foreground">I agree to the </Typography>
                    <LinkButton onPress={() => {}} className="text-primary font-semibold py-0 px-0 h-auto">Terms of Service</LinkButton>
                    <Typography type="body-sm" className="text-muted-foreground"> and </Typography>
                    <LinkButton onPress={() => {}} className="text-primary font-semibold py-0 px-0 h-auto">Privacy Policy</LinkButton>
                  </View>
                </View>
              </View>

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
                onPress={handleRegister}
                isDisabled={loading}
              >
                <Typography type="body" weight="semibold" className="text-primary-foreground">
                  {loading ? "Creating account…" : "Create Account"}
                </Typography>
              </Button>
            </Card.Body>
          </Card>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-2 mt-2">
            <Typography type="body-sm" className="text-muted-foreground">
              Already have an account?
            </Typography>
            <LinkButton onPress={() => router.back()} className="text-primary font-semibold">
              Sign in
            </LinkButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
