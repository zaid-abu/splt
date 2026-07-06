import React, { useRef, useState } from "react";
import { View, FlatList, Dimensions, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ONBOARDING_SLIDES } from "../constants/slides";
import { OnboardingSlide } from "../components/OnboardingSlide";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useUIStore } from "@/store/useUIStore";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem("@splt_onboarded", "true");
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleComplete();
  };

  const onMomentumScrollEnd = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-row justify-between items-center px-6 pt-4 z-10">
          <View className="flex-row gap-1">
            {ONBOARDING_SLIDES.map((_, idx) => (
              <View
                key={idx}
                className={
                  idx === currentIndex
                    ? "w-6 h-1 bg-foreground rounded-full"
                    : "w-2 h-1 bg-divider rounded-full"
                }
              />
            ))}
          </View>
          <Button
            variant="ghost"
            size="sm"
            className="border-0 px-0"
            onPress={handleSkip}
            haptic={Haptics.ImpactFeedbackStyle.Medium}
          >
            Skip
          </Button>
        </View>

        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
              <OnboardingSlide item={item} width={SCREEN_WIDTH} />

              {index === ONBOARDING_SLIDES.length - 1 && (
                <Animated.View
                  entering={FadeIn.delay(600).duration(400)}
                  className="px-8 pb-16"
                >
                  <CurrencySelector
                    label="DEFAULT CURRENCY"
                    value={preferredCurrency.code}
                    onChange={setCurrency}
                  />
                </Animated.View>
              )}
            </View>
          )}
        />

        <View
          className="px-8 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <Button
            fullWidth
            size="lg"
            onPress={handleNext}
            haptic={Haptics.ImpactFeedbackStyle.Light}
          >
            {currentIndex === ONBOARDING_SLIDES.length - 1 ? "Get Started" : "Next"}
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
