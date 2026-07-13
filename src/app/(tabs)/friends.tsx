import FriendsScreen from "@/features/friends/screens/FriendsScreen"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

function FriendsRoute() {
  return <FriendsScreen />
}

export default withErrorBoundary(FriendsRoute, "Friends")
