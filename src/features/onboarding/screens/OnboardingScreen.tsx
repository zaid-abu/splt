import { useState, useRef, useEffect } from "react"
import { View, Dimensions, Pressable, ScrollView } from "react-native"
import { Typography } from "heroui-native"
import { useRouter } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar"
import { UI } from "@/components/ui/native-ui"
import { useUIStore } from "@/store/useUIStore"
import { ONBOARDING_SLIDES, PREFERENCE_TAGS } from "../constants/slides"
import { OnboardingSlide } from "../components/OnboardingSlide"
import { CurrencyStep } from "../components/CurrencyStep"
import { TagSelector } from "../components/TagSelector"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

export function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const preferredCurrency = useUIStore((s) => s.preferredCurrency)
  const setCurrency = useUIStore((s) => s.setCurrency)
  const preferenceTags = useUIStore((s) => s.preferenceTags)
  const setPreferenceTags = useUIStore((s) => s.setPreferenceTags)

  const isFirst = currentIndex === 0
  const isLast = currentIndex === ONBOARDING_SLIDES.length - 1
  const totalSlides = ONBOARDING_SLIDES.length

  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withSpring((currentIndex + 1) / totalSlides, {
      mass: 0.5,
      stiffness: 200,
      damping: 20,
    })
  }, [currentIndex, totalSlides, progress])

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }))

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await AsyncStorage.setItem("@splt_onboarded", "true")
    router.replace("/(tabs)")
  }

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (currentIndex < totalSlides - 1) {
      scrollRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      })
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      scrollRef.current?.scrollTo({
        x: (currentIndex - 1) * SCREEN_WIDTH,
        animated: true,
      })
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    handleComplete()
  }

  const handleTagToggle = (tag: string) => {
    if (preferenceTags.includes(tag)) {
      setPreferenceTags(preferenceTags.filter((t) => t !== tag))
    } else {
      setPreferenceTags([...preferenceTags, tag])
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />

      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingTop: insets.top + 12,
          paddingBottom: 8,
          gap: 12,
        }}
      >
        {!isFirst && (
          <Pressable onPress={handleBack} hitSlop={16} style={{ padding: 4 }}>
            <Typography
              style={{
                fontSize: 15,
                color: UI.color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Back
            </Typography>
          </Pressable>
        )}

        {/* Animated progress bar */}
        <View
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: UI.color.border,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                height: "100%",
                borderRadius: 2,
                backgroundColor: UI.color.text,
              },
              progressBarStyle,
            ]}
          />
        </View>

        {!isLast && (
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

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {ONBOARDING_SLIDES.map((slide, index) => (
          <Animated.View
            key={slide.id}
            entering={SlideInRight.duration(350)}
            exiting={SlideOutLeft.duration(250)}
            style={{ width: SCREEN_WIDTH, flex: 1 }}
          >
            <OnboardingSlide item={slide} width={SCREEN_WIDTH} index={index} />

            <View style={{ flex: 1, paddingHorizontal: 32 }}>
              {index === 1 && (
                <Animated.View
                  entering={FadeIn.delay(400).duration(400)}
                  style={{ flex: 1 }}
                >
                  <CurrencyStep
                    selected={preferredCurrency}
                    onSelect={setCurrency}
                  />
                </Animated.View>
              )}

              {index === 2 && (
                <Animated.View
                  entering={FadeIn.delay(400).duration(400)}
                  style={{ paddingTop: 8 }}
                >
                  <TagSelector
                    tags={PREFERENCE_TAGS}
                    selected={preferenceTags}
                    onToggle={handleTagToggle}
                  />
                </Animated.View>
              )}

              {index === 3 && (
                <Animated.View
                  entering={FadeIn.delay(400).duration(400)}
                  style={{
                    paddingTop: 16,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      padding: 24,
                      borderRadius: UI.radius.lg,
                      borderWidth: 1,
                      borderColor: UI.color.border,
                      backgroundColor: UI.color.surface,
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 20,
                        backgroundColor: UI.color.control,
                        borderWidth: 1,
                        borderColor: UI.color.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography style={{ fontSize: 24, color: UI.color.text }}>
                        👥
                      </Typography>
                    </View>
                    <Typography
                      style={{
                        fontSize: 18,
                        color: UI.color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                        textAlign: "center",
                      }}
                    >
                      Split expenses with friends
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 14,
                        color: UI.color.muted,
                        fontFamily: "IBMPlexSans_400Regular",
                        textAlign: "center",
                        lineHeight: 20,
                      }}
                    >
                      Invite friends from your contacts or share a link to get
                      started together.
                    </Typography>
                  </View>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Bottom button */}
      <View
        style={{
          paddingHorizontal: 32,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: UI.color.bg,
        }}
      >
        <Pressable
          onPress={isLast ? handleComplete : handleNext}
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
            {isLast ? "Get Started" : "Next"}
          </Typography>
        </Pressable>
      </View>
    </View>
  )
}
