import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const DashboardScreen = lazy(() => import("@/features/dashboard/screens/DashboardScreen"))

function FeedRoute() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 bg-canvas items-center justify-center">
          <ActivityIndicator size="large" color={UI.color.muted} />
        </View>
      }
    >
      <DashboardScreen />
    </Suspense>
  )
}

export default withErrorBoundary(FeedRoute, "Feed")
