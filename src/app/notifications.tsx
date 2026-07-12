import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const NotificationsScreen = lazy(() => import("@/features/notifications/screens/NotificationsScreen"))

function NotificationsRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <NotificationsScreen />
    </Suspense>
  )
}

export default withErrorBoundary(NotificationsRoute, "Notifications")
