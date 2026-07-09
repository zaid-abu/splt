import * as icons from "lucide-react-native";

export interface OnboardingSlideData {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof icons;
  tagline: string;
}

export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: "balances",
    title: "Track\nBalances",
    description: "See who owes what at a glance. No more awkward conversations about money.",
    icon: "Wallet",
    tagline: "Know where you stand",
  },
  {
    id: "groups",
    title: "Shared\nGroups",
    description:
      "Create groups for trips, roommates, or nights out. Every expense stays organized.",
    icon: "UsersRound",
    tagline: "Split with anyone",
  },
  {
    id: "settle",
    title: "Settle\nUp Fast",
    description: "Record payments in seconds. Everyone stays in the loop.",
    icon: "HandCoins",
    tagline: "Pay and be paid",
  },
  {
    id: "currency",
    title: "Your\nCurrency",
    description: "Pick a default currency. We'll handle the conversions when you travel.",
    icon: "Globe",
    tagline: "Multi-currency ready",
  },
];
