import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const DashboardScreen = lazy(() => import("@/features/dashboard/screens/DashboardScreen"))

function DashboardRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <DashboardScreen />
    </Suspense>
  )
}

export default withErrorBoundary(DashboardRoute, "Dashboard")
