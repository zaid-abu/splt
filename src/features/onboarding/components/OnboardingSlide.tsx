import React from "react";
import { View } from "react-native";
import * as icons from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { OnboardingSlideData } from "../constants/slides";
import { Text } from "@/components/ui/Text";

interface OnboardingSlideProps {
  item: OnboardingSlideData;
  width: number;
}

export function OnboardingSlide({ item, width }: OnboardingSlideProps) {
  const Icon = (icons as any)[item.icon];

  return (
    <View style={{ width, flex: 1, paddingHorizontal: 32, justifyContent: "center" }}>
      <Animated.View entering={FadeIn.duration(800)} className="mb-12 items-start">
        {Icon && <Icon size={80} color="#FB923C" strokeWidth={1} />}
      </Animated.View>
      <View className="pr-4">
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text variant="h1" color="foreground" className="font-heading text-[56px] leading-[64px] mb-4">
            {item.title}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text variant="body" color="muted" className="text-lg leading-7">
            {item.description}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
