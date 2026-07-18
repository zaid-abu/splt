import type { AccountSetupState } from "@/types";

export type AuthPhase =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "verificationRequired"; email: string }
  | { status: "profileSetup" }
  | { status: "firstAction" }
  | { status: "recovery"; email: string }
  | { status: "ready" }
  | { status: "error"; message: string };

export interface AuthPhaseInput {
  initialized: boolean;
  sessionUserId: string | null;
  sessionEmail: string | null;
  sessionEmailConfirmed: boolean;
  profile: { setupState: AccountSetupState } | null;
  profileLoading: boolean;
  profileError: string | null;
  pendingVerificationEmail: string | null;
  recoveryEmail: string | null;
}

export type LifecycleRouteKind =
  | "index"
  | "auth"
  | "authCallback"
  | "verification"
  | "profileSetup"
  | "firstAction"
  | "recoveryReset"
  | "legacyOnboarding"
  | "readyApp";

export interface LifecycleRouteTarget {
  pathname:
    | "/(auth)/welcome"
    | "/(auth)/forgot-password"
    | "/(auth)/reset-password"
    | "/verify-email"
    | "/profile-setup"
    | "/first-action"
    | "/home";
  params?: Record<string, string>;
}

export function deriveAuthPhase(input: AuthPhaseInput): AuthPhase {
  if (!input.initialized) return { status: "loading" };
  if (input.recoveryEmail) return { status: "recovery", email: input.recoveryEmail };
  if (input.profileError) return { status: "error", message: input.profileError };
  if (!input.sessionUserId) {
    if (input.pendingVerificationEmail) {
      return { status: "verificationRequired", email: input.pendingVerificationEmail };
    }
    return { status: "signedOut" };
  }
  if (input.profileLoading) return { status: "loading" };
  if (!input.profile) {
    if (!input.sessionEmailConfirmed) {
      return { status: "verificationRequired", email: input.sessionEmail ?? "" };
    }
    return { status: "loading" };
  }

  if (input.profile.setupState === "profile_pending") return { status: "profileSetup" };
  if (input.profile.setupState === "activation_pending") return { status: "firstAction" };
  return { status: "ready" };
}

export function classifyLifecycleRoute(segments: readonly string[]): LifecycleRouteKind {
  const first = segments[0] ?? "index";
  const second = segments[1];

  if (first === "auth" && second === "callback") return "authCallback";
  if (first === "(auth)" && second === "reset-password") return "recoveryReset";
  if (first === "(auth)") return "auth";
  if (first === "verify-email") return "verification";
  if (first === "profile-setup") return "profileSetup";
  if (first === "first-action") return "firstAction";
  if (first === "onboarding") return "legacyOnboarding";
  if (first === "index" || first === "") return "index";
  return "readyApp";
}

export function decideLifecycleRoute(
  phase: AuthPhase,
  segments: readonly string[]
): LifecycleRouteTarget | null {
  const route = classifyLifecycleRoute(segments);

  if (route === "authCallback" || phase.status === "loading" || phase.status === "error") {
    return null;
  }

  if (phase.status === "recovery") {
    return route === "recoveryReset"
      ? null
      : {
          pathname: "/(auth)/reset-password",
          params: { email: phase.email },
        };
  }

  if (route === "recoveryReset") {
    return phase.status === "signedOut"
      ? { pathname: "/(auth)/forgot-password" }
      : destinationForPhase(phase);
  }

  if (phase.status === "signedOut") {
    return route === "auth" ? null : { pathname: "/(auth)/welcome" };
  }

  if (phase.status === "verificationRequired") {
    return route === "verification"
      ? null
      : { pathname: "/verify-email", params: { email: phase.email } };
  }

  if (phase.status === "profileSetup") {
    return route === "profileSetup" ? null : { pathname: "/profile-setup" };
  }

  if (phase.status === "firstAction") {
    return route === "firstAction" ? null : { pathname: "/first-action" };
  }

  return route === "readyApp" ? null : { pathname: "/home" };
}

function destinationForPhase(phase: Exclude<AuthPhase, { status: "loading" | "error" }>) {
  if (phase.status === "verificationRequired") {
    return { pathname: "/verify-email", params: { email: phase.email } } as const;
  }
  if (phase.status === "profileSetup") return { pathname: "/profile-setup" } as const;
  if (phase.status === "firstAction") return { pathname: "/first-action" } as const;
  if (phase.status === "ready") return { pathname: "/home" } as const;
  return { pathname: "/(auth)/welcome" } as const;
}
