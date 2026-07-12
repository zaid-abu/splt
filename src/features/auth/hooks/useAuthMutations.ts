import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/api/auth";
import type { SignInData, SignUpData } from "@/services/api/auth";
import { queryKeys } from "@/queries/keys";

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignInData) => AuthService.signIn(data),
    onSuccess: () => {
      // Invalidate queries that depend on the session
      queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignUpData) => AuthService.signUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (email: string) => AuthService.resetPassword(email),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => AuthService.deleteAccount(userId),
    onSuccess: () => {
      queryClient.clear();
    },
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

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: () => AuthService.signInWithGoogle(),
  });
}

export function useSignInWithApple() {
  return useMutation({
    mutationFn: () => AuthService.signInWithApple(),
  });
}
