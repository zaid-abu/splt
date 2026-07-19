import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { deriveAuthPhase, type AuthPhase } from "@/features/auth/lifecycle";
import { queryKeys } from "@/queries/keys";
import { AuthService } from "@/services/api/auth";
import { supabase } from "@/services/supabase/client";
import { useUIStore } from "@/store/useUIStore";
import { CURRENCIES, type User } from "@/types";

export interface AuthContextValue {
  currentUser: User;
  session: Session | null;
  authPhase: AuthPhase;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  requireEmailVerification: (email: string) => void;
  beginRecovery: (email: string) => void;
  clearRecovery: () => void;
  replaceCurrentUser: (user: User) => void;
  activationDestination: ActivationDestination | null;
  completeActivation: (user: User, destination: ActivationDestination) => void;
  clearActivationDestination: () => void;
}

export type ActivationDestination =
  "/group/new" | "/friend/new" | "/expense/new" | "/recurring/new" | "/home" | `/invite/${string}`;

const fallbackUser: User = {
  id: "",
  name: "",
  email: "",
  initials: "",
  defaultCurrency: "USD",
  setupState: "complete",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const setCurrency = useUIStore((state) => state.setCurrency);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);
  const [activationDestination, setActivationDestination] = useState<ActivationDestination | null>(
    null
  );
  const hydrationId = useRef(0);
  const prevUserId = useRef<string | null>(null);

  const hydrateProfile = useCallback(
    async (nextSession: Session, blocking: boolean) => {
      const requestId = ++hydrationId.current;
      if (blocking) setProfileLoading(true);
      setProfileError(null);
      try {
        const profile = await AuthService.getUserProfile(nextSession.user);
        if (requestId !== hydrationId.current) return;
        setCurrentUser(profile);
        const currency = CURRENCIES.find((item) => item.code === profile.defaultCurrency);
        if (currency) setCurrency(currency);
        queryClient.setQueryData(queryKeys.account.currentUser, profile);
      } catch (error) {
        if (requestId !== hydrationId.current) return;
        setProfileError(error instanceof Error ? error.message : "Could not load your account.");
      } finally {
        if (requestId === hydrationId.current) setProfileLoading(false);
      }
    },
    [queryClient, setCurrency]
  );

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession);
      queryClient.setQueryData(queryKeys.account.session, nextSession);
      if (!nextSession) {
        hydrationId.current += 1;
        prevUserId.current = null;
        setCurrentUser(null);
        setProfileLoading(false);
        setProfileError(null);
        return;
      }
      setPendingVerificationEmail(null);
      const userIdChanged = prevUserId.current !== nextSession.user.id;
      prevUserId.current = nextSession.user.id;
      await hydrateProfile(nextSession, userIdChanged);
    },
    [hydrateProfile, queryClient]
  );

  const refreshAuth = useCallback(async () => {
    setInitialized(false);
    try {
      const nextSession = await AuthService.getSession();
      await applySession(nextSession);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not load your session.");
    } finally {
      setInitialized(true);
    }
  }, [applySession]);

  useEffect(() => {
    void refreshAuth();

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setTimeout(() => {
        if (event === "SIGNED_OUT") {
          setRecoveryEmail(null);
          setPendingVerificationEmail(null);
          queryClient.clear();
          void applySession(null).finally(() => setInitialized(true));
          return;
        }
        if (event === "PASSWORD_RECOVERY" && nextSession) {
          setSession(nextSession);
          setRecoveryEmail(nextSession.user.email ?? "");
          setInitialized(true);
          return;
        }
        if (nextSession && ["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
          void applySession(nextSession).finally(() => setInitialized(true));
        }
      }, 0);
    });

    return () => data.subscription.unsubscribe();
  }, [applySession, queryClient, refreshAuth]);

  const replaceCurrentUser = useCallback(
    (user: User) => {
      setCurrentUser(user);
      setProfileError(null);
      queryClient.setQueryData(queryKeys.account.currentUser, user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.all });
    },
    [queryClient]
  );

  const authPhase = deriveAuthPhase({
    initialized,
    sessionUserId: session?.user.id ?? null,
    sessionEmail: session?.user.email ?? null,
    sessionEmailConfirmed: Boolean(session?.user.email_confirmed_at ?? session?.user.confirmed_at),
    profile: currentUser,
    profileLoading,
    profileError,
    pendingVerificationEmail,
    recoveryEmail,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: currentUser ?? fallbackUser,
      session,
      authPhase,
      isAuthenticated: session !== null,
      isLoading: authPhase.status === "loading",
      refreshAuth,
      requireEmailVerification: (email) => setPendingVerificationEmail(email.trim().toLowerCase()),
      beginRecovery: (email) => setRecoveryEmail(email.trim().toLowerCase()),
      clearRecovery: () => setRecoveryEmail(null),
      replaceCurrentUser,
      activationDestination,
      completeActivation: (user, destination) => {
        setActivationDestination(destination);
        replaceCurrentUser(user);
      },
      clearActivationDestination: () => setActivationDestination(null),
    }),
    [activationDestination, authPhase, currentUser, refreshAuth, replaceCurrentUser, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
