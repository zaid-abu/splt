import ProfileScreen from "@/features/profile/screens/ProfileScreen"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

function ProfileRoute() {
  return <ProfileScreen />
}

export default withErrorBoundary(ProfileRoute, "Profile")
