import { lazy, Suspense } from "react"
import { View, ActivityIndicator } from "react-native"
import { UI } from "@/components/ui/native-ui"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

const ProfileScreen = lazy(() => import("@/features/profile/screens/ProfileScreen"))

function ProfileRoute() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 bg-canvas items-center justify-center">
          <ActivityIndicator size="large" color={UI.color.muted} />
        </View>
      }
    >
      <ProfileScreen />
    </Suspense>
  )
}

export default withErrorBoundary(ProfileRoute, "Profile")
