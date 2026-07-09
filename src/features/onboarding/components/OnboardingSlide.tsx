import React from "react";
import { View, StyleSheet } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { OnboardingSlideData } from "../constants/slides";

interface OnboardingSlideProps {
  item: OnboardingSlideData;
  width: number;
}

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";

export function OnboardingSlide({ item, width }: OnboardingSlideProps) {
  const Icon = (icons as any)[item.icon];

  return (
    <View style={[styles.container, { width }]}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.iconContainer}>
        {Icon && <Icon size={80} color={TEXT_PRIMARY} strokeWidth={1} />}
      </Animated.View>
      <View style={styles.textContainer}>
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Typography style={styles.title}>{item.title}</Typography>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Typography style={styles.description}>{item.description}</Typography>
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
    marginBottom: 48,
    alignItems: "flex-start",
  },
  textContainer: {
    paddingRight: 16,
  },
  title: {
    fontSize: 56,
    color: TEXT_PRIMARY,
    fontFamily: "Sora_600SemiBold",
    lineHeight: 64,
    marginBottom: 16,
  },
  description: {
    fontSize: 20,
    color: TEXT_SECONDARY,
    fontFamily: "IBMPlexSans_400Regular",
    lineHeight: 28,
  },
});
