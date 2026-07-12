import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const GroupSettingsScreen = lazy(() => import("@/features/groups/screens/GroupSettingsScreen"))

function GroupSettingsRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <GroupSettingsScreen />
    </Suspense>
  )
}

export default withErrorBoundary(GroupSettingsRoute, "Group Settings")
