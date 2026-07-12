import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"

const GroupSettingsScreen = lazy(() => import("@/features/groups/screens/GroupSettingsScreen"))

export default function GroupSettingsRoute() {
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
