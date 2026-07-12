import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"

const SettlementScreen = lazy(() => import("@/features/settlements/screens/SettlementScreen"))

export default function GroupSettleRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <SettlementScreen />
    </Suspense>
  )
}
