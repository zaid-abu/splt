import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"

const ExpenseDetailScreen = lazy(() => import("@/features/expenses/screens/ExpenseDetailScreen"))

export default function ExpenseDetailRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <ExpenseDetailScreen />
    </Suspense>
  )
}
