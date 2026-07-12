import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const OnboardingScreen = lazy(() =>
  import("@/features/onboarding/screens/OnboardingScreen").then((m) => ({ default: m.OnboardingScreen }))
)

function OnboardingRoute() {
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

export default withErrorBoundary(OnboardingRoute, "Onboarding")
