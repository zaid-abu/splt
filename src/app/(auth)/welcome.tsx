import { Button, Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Top Content (Wordmark + Typography) */}
      <View className="flex-1 px-8" style={{ paddingTop: insets.top + 60 }}>
        <Animated.View entering={FadeIn.delay(100).duration(800)}>
          <Typography 
            type="h1" 
            className="text-foreground text-[28px] font-bold tracking-widest uppercase mb-16"
          >
            SPLT.
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Typography
            type="h1"
            className="font-heading text-[56px] text-foreground leading-tight mb-4"
            style={{ letterSpacing: -0.5 }}
          >
            Welcome{"\n"}to SPLT
          </Typography>
          <Typography
            type="body"
            className="text-muted-foreground text-[18px] leading-relaxed max-w-[280px]"
          >
            The elegant way to split bills, track expenses, and settle up with friends.
          </Typography>
        </Animated.View>
      </View>

      {/* Bottom Actions */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(600)}
        className="px-8 pb-10 gap-4"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 48) }}
      >
        <Button
          size="lg"
          variant="primary"
          className="w-full h-[52px] rounded-none bg-primary shadow-sm flex-row items-center justify-center"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(auth)/register");
          }}
        >
          <Typography type="body" className="text-primary-foreground text-[15px] font-semibold">
            Get Started
          </Typography>
        </Button>

        <Button
          size="lg"
          variant="secondary"
          className="w-full h-[52px] rounded-none bg-surface-secondary border border-border-light shadow-sm flex-row items-center justify-center"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(auth)/login");
          }}
        >
          <Typography type="body" className="text-foreground text-[15px] font-semibold">
            Log in to existing account
          </Typography>
        </Button>
      </Animated.View>
    </View>
  );
}
