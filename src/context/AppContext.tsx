import React, { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

import { MOCK_ME } from "@/lib/mock-data";
import type { User } from "@/types";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AuthContextValue {
  currentUser: User;
  isAuthenticated: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_ME);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // mock: start authenticated

  // ── Auth ──────────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, _password?: string) => {
    // Phase 1: mock sign-in
    setCurrentUser({ ...MOCK_ME, email });
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        signIn,
        signOut,
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
