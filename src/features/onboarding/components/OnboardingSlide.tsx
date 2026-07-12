import { View } from "react-native"
import { Typography } from "heroui-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import LottieView from "lottie-react-native"

import { UI } from "@/components/ui/native-ui"
import { OnboardingSlideData } from "../constants/slides"

interface OnboardingSlideProps {
  item: OnboardingSlideData
  width: number
  index: number
}

export function OnboardingSlide({ item, width, index }: OnboardingSlideProps) {
  const isFirst = index === 0

  return (
    <View
      style={{
        width,
        paddingHorizontal: 32,
        paddingTop: 24,
      }}
    >
      {isFirst ? (
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={{
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 40,
              backgroundColor: UI.color.surface,
              borderWidth: 1,
              borderColor: UI.color.border,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <LottieView
              source={require("@/assets/empty-state.json")}
              autoPlay
              loop
              style={{ width: 120, height: 120 }}
            />
          </View>
        </Animated.View>
      ) : (
        <View style={{ height: 64 }} />
      )}

      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <Typography
          style={{
            fontSize: 11,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_600SemiBold",
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 12,
          }}
        >
          {item.subtitle}
        </Typography>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(600)}>
        <Typography
          style={{
            fontSize: 40,
            color: UI.color.textStrong,
            fontFamily: "Sora_600SemiBold",
            lineHeight: 48,
            marginBottom: 4,
          }}
        >
          {item.title}
        </Typography>
      </Animated.View>
    </View>
  )
}
