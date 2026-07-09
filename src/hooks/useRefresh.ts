import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";

export function useRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  return { refreshing, onRefresh };
}
