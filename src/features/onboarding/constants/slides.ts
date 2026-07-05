import * as icons from "lucide-react-native";

export interface OnboardingSlideData {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof icons;
}

export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: "welcome",
    title: "Welcome\nto Splt.",
    description: "The most elegant way to track, share, and settle expenses with your friends.",
    icon: "Sparkles",
  },
  {
    id: "track",
    title: "Track &\nSplit.",
    description: "Add expenses on the go. We do the math so you don't have to.",
    icon: "Receipt",
  },
  {
    id: "personalize",
    title: "Your\nCurrency.",
    description:
      "Before we start, what currency do you use most often? You can always change this later.",
    icon: "Globe",
  },
];
