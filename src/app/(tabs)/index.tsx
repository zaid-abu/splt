import { router } from "expo-router"
import { useEffect } from "react"

export default function TabsIndex() {
  useEffect(() => {
    router.replace("/(tabs)/feed")
  }, [])
  return null
}
