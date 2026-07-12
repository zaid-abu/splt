import { Tabs, Redirect } from "expo-router"
import { TabBar } from "@/components/ui/TabBar"
import { useAuth } from "@/context/AppContext"

export default function TabsLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="groups" options={{ title: "Groups" }} />
      <Tabs.Screen name="friends" options={{ title: "Friends" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  )
}
