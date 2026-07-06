import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { SlideUp } from '../animations/SlideUp';
import { GradientBackground } from '../primitives/GradientBackground';
import { Theme } from '../../constants/theme';

export interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: React.ReactNode;
  gradientVariant?: keyof typeof Theme.gradients;
}

export function OnboardingSlide({
  title,
  description,
  illustration,
  gradientVariant = 'primary'
}: OnboardingSlideProps) {
  return (
    <GradientBackground variant={gradientVariant} className="flex-1 w-full justify-between pb-12 pt-20 px-8">
      <View className="flex-1 items-center justify-center">
        {illustration}
      </View>
      <View className="h-1/3 justify-end items-center mb-10">
        <SlideUp distance={30} delay={100}>
          <Text variant="screenTitle" color="inverse" className="text-center mb-4 leading-tight">
            {title}
          </Text>
        </SlideUp>
        <SlideUp distance={30} delay={200}>
          <Text variant="body" color="inverse" className="text-center opacity-80">
            {description}
          </Text>
        </SlideUp>
      </View>
    </GradientBackground>
  );
}
