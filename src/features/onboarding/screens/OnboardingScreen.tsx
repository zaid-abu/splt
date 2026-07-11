import React, { useRef, useState } from "react";
import { View, FlatList, Dimensions, Pressable } from "react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ONBOARDING_SLIDES } from "../constants/slides";
import { OnboardingSlide } from "../components/OnboardingSlide";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useUIStore } from "@/store/useUIStore";
import { UI } from "@/components/ui/native-ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

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
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />

      {/* Top Bar - Progress + Skip */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 32,
          paddingTop: insets.top + 20,
          zIndex: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 6 }}>
          {ONBOARDING_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: idx === currentIndex ? 28 : 8,
                height: 4,
                borderRadius: 2,
                backgroundColor: idx === currentIndex ? UI.color.textStrong : UI.color.muted,
              }}
            />
          ))}
        </View>
        {!isLastSlide && (
          <Pressable onPress={handleSkip} hitSlop={16} style={{ padding: 4 }}>
            <Typography
              style={{
                fontSize: 15,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Skip
            </Typography>
          </Pressable>
        )}
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
                entering={FadeIn.delay(500).duration(400)}
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
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: UI.color.bg,
        }}
      >
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => ({
            width: "100%",
            height: 56,
            borderRadius: 28,
            backgroundColor: UI.color.textStrong,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Typography
            style={{
              fontSize: 16,
              color: UI.color.textInverse,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: 0.5,
            }}
          >
            {isLastSlide ? "Get Started" : "Next"}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
