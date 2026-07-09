import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/api/auth";
import type { SignInData, SignUpData } from "@/services/api/auth";

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignInData) => AuthService.signIn(data),
    onSuccess: () => {
      // Invalidate queries that depend on the session
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignUpData) => AuthService.signUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (email: string) => AuthService.resetPassword(email),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthService.signOut(),
    onSuccess: () => {
      queryClient.clear(); // Clear all cached data on sign out
    },
  });
}
