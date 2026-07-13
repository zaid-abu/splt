import GroupsScreen from "@/features/groups/screens/GroupsScreen"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

function GroupsRoute() {
  return <GroupsScreen />
}

export default withErrorBoundary(GroupsRoute, "Groups")
