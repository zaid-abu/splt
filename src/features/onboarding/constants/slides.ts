export interface OnboardingSlideData {
  id: string
  title: string
  subtitle: string
}

export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: "welcome",
    title: "Split expenses,\nnot friendships",
    subtitle: "Welcome to Splt",
  },
  {
    id: "currency",
    title: "Choose your\ncurrency",
    subtitle: "Set your default currency",
  },
  {
    id: "preferences",
    title: "What are your\nsplit styles?",
    subtitle: "Pick all that apply",
  },
  {
    id: "friends",
    title: "Invite your\nfriends",
    subtitle: "Import contacts or skip",
  },
]

export const PREFERENCE_TAGS = [
  "Trips",
  "Roommates",
  "Dining Out",
  "Events",
  "Work",
  "Other",
] as const
