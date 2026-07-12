import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"

const GroupDetailScreen = lazy(() => import("@/features/groups/screens/GroupDetailScreen"))

export default function GroupDetailRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <GroupDetailScreen />
    </Suspense>
  )
}
