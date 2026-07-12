import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"

const OnboardingScreen = lazy(() =>
  import("@/features/onboarding/screens/OnboardingScreen").then((m) => ({ default: m.OnboardingScreen }))
)

export default function OnboardingRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <OnboardingScreen />
    </Suspense>
  )
}
