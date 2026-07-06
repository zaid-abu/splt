import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingSlide } from '../src/components/onboarding/OnboardingSlide';
import { OnboardingDots } from '../src/components/onboarding/OnboardingDots';
import { OnboardingIllustration } from '../src/components/onboarding/OnboardingIllustration';
import { Pressable } from '../src/components/primitives/Pressable';
import { Text } from '../src/components/primitives/Text';
import { FadeIn } from '../src/components/animations/FadeIn';

const slides = [
  {
    title: 'Split Bills\nEffortlessly',
    description: 'Never worry about who owes who. Splitting expenses has never been this simple.',
    illustration: <OnboardingIllustration type="split" />,
    gradient: 'primary' as const,
  },
  {
    title: 'Save Money\nTogether',
    description: 'Pool funds with friends for shared goals and track your progress in real-time.',
    illustration: <OnboardingIllustration type="save" />,
    gradient: 'accent' as const,
  },
  {
    title: 'Track Every\nPenny',
    description: 'Get detailed insights into your spending habits with interactive charts and reports.',
    illustration: <OnboardingIllustration type="track" />,
    gradient: 'danger' as const,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const currentSlide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.replace('/(tabs)');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <View className="flex-1 bg-[var(--color-background)]">
      <FadeIn key={currentIndex} trigger className="flex-1">
        <OnboardingSlide
          title={currentSlide.title}
          description={currentSlide.description}
          illustration={currentSlide.illustration}
          gradientVariant={currentSlide.gradient}
        />
      </FadeIn>

      <View className="absolute bottom-12 left-0 right-0 px-8 flex-row items-center justify-between">
        <OnboardingDots total={slides.length} currentIndex={currentIndex} />
        
        <Pressable
          onPress={handleNext}
          haptic="medium"
          className="bg-[var(--color-surface)] px-8 py-4 rounded-full shadow-lg"
        >
          <Text variant="button" color="primary">
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
