import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const FriendsScreen = lazy(() => import("@/features/friends/screens/FriendsScreen"))

function FriendsRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <FriendsScreen />
    </Suspense>
  )
}

export default withErrorBoundary(FriendsRoute, "Friends")
