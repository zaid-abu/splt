import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAppToast } from "@/hooks/useAppToast";

export function GlobalQueryToast(): null {
  const { toast } = useAppToast();

  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.mutation.state.error;
        toast.show({
          label: "Error",
          description: error?.message || "Something went wrong. Please try again.",
          variant: "danger",
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  return null;
}
