import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const FeedScreen = lazy(() => import("@/features/feed/screens/FeedScreen"))

function FeedRoute() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 bg-canvas items-center justify-center">
          <ActivityIndicator size="large" color={UI.color.muted} />
        </View>
      }
    >
      <FeedScreen />
    </Suspense>
  )
}

export default withErrorBoundary(FeedRoute, "Feed")
