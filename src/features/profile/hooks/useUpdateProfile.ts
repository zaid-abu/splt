import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/api/auth";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { name?: string; email?: string } }) =>
      AuthService.updateProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
