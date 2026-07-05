import React, { useRef, useState } from "react";
import { View, FlatList, Dimensions, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Typography, PressableFeedback } from "heroui-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ONBOARDING_SLIDES } from "../constants/slides";
import { OnboardingSlide } from "../components/OnboardingSlide";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useUIStore } from "@/store/useUIStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";

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
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* Top Bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          zIndex: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 4 }}>
          {ONBOARDING_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: idx === currentIndex ? 24 : 8,
                height: 4,
                backgroundColor: idx === currentIndex ? TEXT_PRIMARY : "#D6D2CD",
              }}
            />
          ))}
        </View>
        <PressableFeedback accessibilityRole="button" onPress={handleSkip} hitSlop={16}>
          <Typography
            style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "CrimsonText_700Bold" }}
          >
            Skip
          </Typography>
        </PressableFeedback>
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

            {/* If it's the last slide, render the Currency Selector at the bottom of the slide */}
            {index === ONBOARDING_SLIDES.length - 1 && (
              <Animated.View
                entering={FadeIn.delay(600).duration(400)}
                style={{ paddingHorizontal: 32, paddingBottom: 64 }}
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

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: 32,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: BG,
        }}
      >
        <PressableFeedback
          accessibilityRole="button"
          style={{
            width: "100%",
            height: 56,
            borderRadius: 0,
            backgroundColor: TEXT_PRIMARY,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={handleNext}
        >
          <Typography style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "CrimsonText_700Bold" }}>
            {currentIndex === ONBOARDING_SLIDES.length - 1 ? "Get Started" : "Next"}
          </Typography>
        </PressableFeedback>
      </View>
    </View>
  );
}
