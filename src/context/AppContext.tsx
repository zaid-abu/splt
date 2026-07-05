import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { User } from "@/types";
import { supabase } from "@/services/supabase/client";
import { AuthService } from "@/services/api/auth";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AuthContextValue {
  currentUser: User;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const user = await AuthService.getCurrentUser();
        if (mounted) {
          setCurrentUser(user);
          setIsAuthenticated(!!user);
        }
      } catch (error) {
        console.error("Failed to load session", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setIsAuthenticated(false);
      } else if (session) {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(!!user);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    const navigateApp = async () => {
      const inAuthGroup = segments[0] === "(auth)";
      const inOnboarding = segments[0] === "onboarding";

      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to login if not authenticated and not in auth group
        router.replace("/(auth)/welcome");
      } else if (isAuthenticated) {
        const hasOnboarded = await AsyncStorage.getItem("@splt_onboarded");

        if (hasOnboarded !== "true" && !inOnboarding) {
          // If authenticated but not onboarded, always send to onboarding
          router.replace("/onboarding");
        } else if (hasOnboarded === "true" && (inAuthGroup || inOnboarding)) {
          // If onboarded and currently in auth or onboarding, send to tabs
          router.replace("/(tabs)");
        }
      }
    };

    navigateApp();
  }, [isAuthenticated, isLoading, segments, router, rootNavigationState?.key]);

  const fallbackUser: User = {
    id: "",
    name: "",
    email: "",
    initials: "",
    defaultCurrency: "USD",
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: currentUser ?? fallbackUser,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
