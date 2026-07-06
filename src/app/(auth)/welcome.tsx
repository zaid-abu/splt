import { useRouter } from "expo-router";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/primitives/GradientBackground";
import { Text } from "@/components/primitives/Text";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/FadeIn";
import { SlideUp as FadeInDown } from "@/components/animations/SlideUp";

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();

  return (
    <GradientBackground variant="primary" className="flex-1">
      <StatusBar style="light" />

      <SafeAreaView edges={["top", "bottom"]} className="flex-1 px-6 pt-16 pb-12">
        <View className="flex-1">
          <FadeIn delay={100}>
            <Text variant="caption" className="text-white mb-16 tracking-[0.2em]">
              SPLT.
            </Text>
          </FadeIn>

          <FadeInDown delay={300}>
            <Text variant="screenTitle" className="text-white mb-4">
              Welcome{"\n"}to SPLT
            </Text>
            <Text variant="body" className="text-white/70 max-w-[280px]">
              The elegant way to split bills, track expenses, and settle up with friends.
            </Text>
          </FadeInDown>
        </View>

        <FadeInDown delay={500} className="gap-4 w-full">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full" 
            onPress={() => router.push("/(auth)/register")}
          >
            <Text variant="button" className="text-white">Get Started</Text>
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            className="w-full" 
            onPress={() => router.push("/(auth)/login")}
          >
            <Text variant="button" className="text-white">Log in to existing account</Text>
          </Button>
        </FadeInDown>
      </SafeAreaView>
    </GradientBackground>
  );
}