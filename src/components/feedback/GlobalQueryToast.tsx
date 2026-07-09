import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAppToast } from "@/hooks/useAppToast";

export function GlobalQueryToast(): null {
  const { toast } = useAppToast();
  const seenErrors = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribeMutation = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.mutation.state.error;
        const key = (error as Error)?.message || "unknown";
        if (!seenErrors.current.has(key)) {
          seenErrors.current.add(key);
          toast.show({
            label: "Error",
            description: (error as Error)?.message || "Something went wrong. Please try again.",
            variant: "danger",
          });
          setTimeout(() => seenErrors.current.delete(key), 3000);
        }
      }
    });

    const unsubscribeQuery = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.query.state.status === "error") {
        const error = event.query.state.error;
        const key = (error as Error)?.message || event.query.queryHash;
        if (error && !seenErrors.current.has(key)) {
          seenErrors.current.add(key);
          toast.show({
            label: "Error loading data",
            description: (error as Error)?.message || "Something went wrong. Please try again.",
            variant: "danger",
          });
          setTimeout(() => seenErrors.current.delete(key), 3000);
        }
      }
    });

    return () => {
      unsubscribeMutation();
      unsubscribeQuery();
    };
  }, [toast]);

  return null;
}
