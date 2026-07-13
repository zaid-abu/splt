import { useEffect } from "react"
import NetInfo from "@react-native-community/netinfo"
import { offlineQueue } from "@/lib/offlineMutationQueue"

export function useNetworkStatus() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        offlineQueue.processQueue()
      }
    })
    return unsubscribe
  }, [])
}
