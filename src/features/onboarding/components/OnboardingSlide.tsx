import React from "react";
import { View, StyleSheet } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { useUI } from "@/components/ui";
import { OnboardingSlideData } from "../constants/slides";

interface OnboardingSlideProps {
  item: OnboardingSlideData;
  width: number;
}

export function OnboardingSlide({ item, width }: OnboardingSlideProps) {
  const { color, radius, space, shadow } = useUI();
  const Icon = (icons as any)[item.icon];

  return (
    <View style={[styles.container, { width }]}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.iconContainer}>
        <View
          style={[
            styles.iconShell,
            { backgroundColor: color.surface, borderColor: color.border },
          ]}
        >
          <View style={[styles.iconInner, { backgroundColor: color.bg }]}>
            {Icon && <Icon size={48} color={color.textStrong} strokeWidth={1.25} />}
          </View>
        </View>
      </Animated.View>

      <View style={styles.textContainer}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Typography
            style={{
              fontSize: 13,
              color: color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginBottom: 12,
            }}
          >
            {item.tagline}
          </Typography>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Typography
            style={{
              fontSize: 48,
              color: color.textStrong,
              fontFamily: "Sora_600SemiBold",
              lineHeight: 54,
              marginBottom: 16,
            }}
          >
            {item.title}
          </Typography>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(350).duration(600)}>
          <Typography
            style={{
              fontSize: 18,
              color: color.muted,
              fontFamily: "IBMPlexSans_400Regular",
              lineHeight: 26,
            }}
          >
            {item.description}
          </Typography>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: "flex-start",
  },
  iconShell: {
    width: 80,
    height: 80,
    borderRadius: 24,
    padding: 4,
  },
  iconInner: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    paddingRight: 16,
  },
});
