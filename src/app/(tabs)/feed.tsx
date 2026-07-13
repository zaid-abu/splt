import FeedScreen from "@/features/feed/screens/FeedScreen"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

function FeedRoute() {
  return <FeedScreen />
}

export default withErrorBoundary(FeedRoute, "Feed")
