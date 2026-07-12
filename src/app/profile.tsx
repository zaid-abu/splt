import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const ProfileScreen = lazy(() => import("@/features/profile/screens/ProfileScreen"))

function ProfileRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <ProfileScreen />
    </Suspense>
  )
}

export default withErrorBoundary(ProfileRoute, "Profile")
