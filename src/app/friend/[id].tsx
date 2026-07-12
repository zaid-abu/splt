import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const FriendDetailScreen = lazy(() => import("@/features/friends/screens/FriendDetailScreen"))

function FriendDetailRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <FriendDetailScreen />
    </Suspense>
  )
}

export default withErrorBoundary(FriendDetailRoute, "Friend Detail")
