import React from "react";
import { View, StyleSheet } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { UI } from "@/components/ui/native-ui";
import { OnboardingSlideData } from "../constants/slides";

interface OnboardingSlideProps {
  item: OnboardingSlideData;
  width: number;
}

export function OnboardingSlide({ item, width }: OnboardingSlideProps) {
  const Icon = (icons as any)[item.icon];

  return (
    <View style={[styles.container, { width }]}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.iconContainer}>
        <View
          style={[
            styles.iconShell,
            { backgroundColor: UI.color.surface, borderColor: UI.color.border },
          ]}
        >
          <View style={[styles.iconInner, { backgroundColor: UI.color.bg }]}>
            {Icon && <Icon size={48} color={UI.color.textStrong} strokeWidth={1.25} />}
          </View>
        </View>
      </Animated.View>

      <View style={styles.textContainer}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Typography style={styles.tagline}>{item.tagline}</Typography>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Typography style={styles.title}>{item.title}</Typography>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(350).duration(600)}>
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
  tagline: {
    fontSize: 13,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  title: {
    fontSize: 48,
    color: UI.color.textStrong,
    fontFamily: "Sora_600SemiBold",
    lineHeight: 54,
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_400Regular",
    lineHeight: 26,
  },
});
