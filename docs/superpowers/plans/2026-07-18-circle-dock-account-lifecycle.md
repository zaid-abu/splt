# Circle Dock Account Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one race-free, user-scoped account lifecycle from signed out through authentication, verification, profile setup, optional first action, and Home, plus complete deep-linked password recovery.

**Architecture:** Supabase Auth remains authoritative for sessions, email confirmation, OAuth PKCE, and recovery PKCE. A new `public.users.setup_state` column persists profile and activation progress, while a discriminated `AuthPhase` and pure route-decision function gate Expo Router without asynchronous redirect effects. `AuthContext` keeps the existing non-null `currentUser` contract for feature consumers and adds lifecycle state and refresh methods without migrating unrelated consumers.

**Tech Stack:** Expo 57, Expo Router 57 typed routes, React Native 0.86, React 19, TypeScript 6 strict mode, Supabase JS 2.108 PKCE auth, TanStack React Query 5, React Hook Form 7, Zod 4, Zustand 5, Jest 29 with `jest-expo`, and existing Coral Ledger components.

## Global Constraints

- Scope is Phase 1A Account Lifecycle Foundation only: do not implement Circle Dock navigation, Home/Circles migration, expense or settlement behavior, recurring behavior, or broad component cleanup.
- Preserve every unrelated dirty worktree change; inspect file-local diffs before editing and never restore, delete, or rewrite unrelated work.
- Do not create commits. At each task boundary, review only the listed files; staging is optional and must include only that task's listed lifecycle files if the user later requests it.
- Preserve `AuthContextValue.currentUser: User` as non-null with the existing empty fallback so all current `currentUser.id` consumers remain source-compatible.
- Treat Supabase Auth as the source of truth for authentication, email confirmation, OAuth completion, recovery mode, and token refresh.
- Treat `public.users.setup_state` as the only source of truth for profile setup and first-action activation; do not read or write `@splt_onboarded`.
- Backfill all users that exist when the migration runs to `complete`; only users created after the migration start at `profile_pending`.
- Use exactly three setup values: `profile_pending`, `activation_pending`, and `complete`.
- Use one password rule for registration, recovery, and authenticated password change: 8 to 72 characters with at least one number or symbol.
- Keep login permissive for existing credentials: require a non-empty password but do not reject a legacy password client-side.
- Use `splt://auth/callback` through `makeRedirectUri({ scheme: "splt", path: "auth/callback" })`; process PKCE callbacks with `supabase.auth.exchangeCodeForSession(code)`.
- Keep lifecycle and recovery screens outside persistent authenticated navigation chrome.
- Follow the approved HTML copy and information order for welcome, registration, verification, profile setup, first action, and recovery.
- Add focused pure and service tests only; do not add broad UI snapshots.
- iOS controls must be at least 44pt; Android controls must be at least 48dp.
- Content cards remain opaque; blur remains restricted to existing system chrome and task sheets.

## File Map

### Create

- `supabase/migrations/202607180002_account_lifecycle.sql`: add and backfill `users.setup_state`, update auth-user profile creation, and create the optional avatar bucket policies.
- `src/features/auth/lifecycle.ts`: own `AuthPhase`, setup-state types, route classification, phase derivation, and pure route decisions.
- `src/features/auth/lifecycle.test.ts`: exhaustively test phase and route decisions.
- `src/services/api/auth.test.ts`: test callback exchange, signup branching, profile seed construction, and service error behavior with injected dependencies.
- `src/services/api/mappers.test.ts`: test setup-state mapping.
- `src/features/auth/components/AuthLifecycleGuard.tsx`: hold feature routes during hydration, perform one synchronous route decision, and expose retry on profile hydration failure.
- `src/app/auth/callback.tsx`: process warm or cold OAuth, verification-link, and recovery callbacks.
- `src/features/auth/screens-v2/ResetPasswordScreen.tsx`: accept a recovery session, update the password, globally sign out, and return to sign-in success.
- `src/app/(auth)/reset-password.tsx`: route wrapper for the reset screen.
- `src/features/onboarding/screens-v2/FirstActionScreen.tsx`: approved optional first-action chooser.
- `src/app/first-action.tsx`: route wrapper for first action.
- `src/validation/schemas.test.ts`: test shared registration/recovery/change-password rules.
- `src/utils/passwordStrength.test.ts`: test that strength feedback never contradicts the accepted password rule.

### Modify

- `jest.config.js`: remove the Testing Library v14 setup path that no longer exists.
- `src/services/supabase/database.types.ts`: manually mirror the lifecycle migration in this repository's checked-in database types.
- `src/types/index.ts`: expose `AccountSetupState` and `User.setupState`.
- `src/services/api/mappers.ts`: map `setup_state` into `User`.
- `src/features/profile/components/ProfileHeader.tsx`: mark its display-only avatar user as lifecycle-complete.
- `src/features/expenses/components/ExpenseComments.tsx`: mark its fallback comment user as lifecycle-complete.
- `src/services/api/auth.ts`: implement signup branching, confirmation OTP, OAuth/recovery PKCE callbacks, delayed profile-row fallback, profile completion, activation completion, avatar upload, and recovery sign-out.
- `src/context/AppContext.tsx`: hydrate session and profile independently, derive `AuthPhase`, preserve fallback `currentUser`, and react to auth refresh/sign-out/recovery events.
- `src/providers/AppProvider.tsx`: place `AuthLifecycleGuard` inside `AuthProvider`.
- `src/features/auth/hooks/useAuthMutations.ts`: use canonical query keys and invalidate/clear account-dependent queries.
- `src/features/profile/hooks/useUpdateProfile.ts`: invalidate the canonical account key after profile edits.
- `src/validation/schemas.ts`: centralize the 8-to-72-character number-or-symbol password contract and add reset/change schema.
- `src/utils/passwordStrength.ts`: align meter feedback with the shared password contract.
- `src/features/auth/screens-v2/RegisterScreen.tsx`: branch on whether signup returned a session.
- `src/features/auth/screens-v2/LoginScreen.tsx`: remove device onboarding reads, handle unconfirmed-email errors, and defer destination choice to the guard.
- `src/features/auth/screens-v2/WelcomeScreen.tsx`: defer social-auth destination choice to the guard.
- `src/features/auth/screens-v2/VerifyEmailScreen.tsx`: verify/resend the original signup OTP and refresh context.
- `src/features/auth/screens-v2/ForgotPasswordScreen.tsx`: show callback errors and retain request/inbox states.
- `src/features/profile/screens-v2/ProfileSetupScreen.tsx`: collect optional photo, name, currency, and appearance; atomically advance setup.
- `src/features/profile/screens-v2/ChangePasswordScreen.tsx`: use the shared password schema.
- `src/app/(auth)/_layout.tsx`: register reset-password.
- `src/app/_layout.tsx`: register callback/first-action routes and let the lifecycle guard own auth readiness.
- `src/app/index.tsx`: remove the competing redirect policy.
- `src/app/onboarding.tsx`: redirect the superseded tutorial route to first action after guard coverage exists.
- `src/queries/keys.ts`: expose one canonical account key family.

---

### Task 1: Repair Jest Before Lifecycle TDD

**Files:**

- Modify: `jest.config.js:1-11`

**Interfaces:**

- Consumes: `jest-expo` and Testing Library Native 14, which installs matchers without the removed `@testing-library/react-native/extend-expect` entry point.
- Produces: a Jest command that can discover and execute TypeScript pure-logic tests.

- [ ] **Step 1: Reproduce the current configuration failure**

Run: `npm test -- --runInBand src/features/auth/lifecycle.test.ts --passWithNoTests`

Expected: exit 1 with `Module @testing-library/react-native/extend-expect in the setupFilesAfterEnv option was not found.`

- [ ] **Step 2: Replace the Jest configuration**

Replace `jest.config.js` completely:

```js
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|lucide-react-native|heroui-native|uniwind|tailwind-merge|tailwind-variants)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.expo/", "/android/", "/ios/"],
};
```

- [ ] **Step 3: Verify Jest starts successfully**

Run: `npm test -- --runInBand src/features/auth/lifecycle.test.ts --passWithNoTests`

Expected: exit 0 with `No tests found` and no configuration validation error.

- [ ] **Step 4: Review the task boundary without staging unrelated files**

Run: `git diff -- jest.config.js && git status --short`

Expected: the Jest diff removes only `setupFilesAfterEnv`; the status still lists pre-existing unrelated work unchanged.

---

### Task 2: Persist User-Scoped Setup State

**Files:**

- Create: `supabase/migrations/202607180002_account_lifecycle.sql`
- Create: `src/services/api/mappers.test.ts`
- Modify: `src/services/supabase/database.types.ts:175-198`
- Modify: `src/types/index.ts:54-64`
- Modify: `src/services/api/mappers.ts:50-60`
- Modify: `src/features/profile/components/ProfileHeader.tsx:25-32`
- Modify: `src/features/expenses/components/ExpenseComments.tsx:19-25`

**Interfaces:**

- Consumes: `public.users`, the existing `create_profile_for_auth_user()` trigger, `Tables<"users">`, and `mapUser(row)`.
- Produces: `AccountSetupState = "profile_pending" | "activation_pending" | "complete"`, `User.setupState`, and a database default of `profile_pending` for new users.

- [ ] **Step 1: Write the failing mapper test**

Create `src/services/api/mappers.test.ts`:

```ts
import { mapUser } from "./mappers";
import type { Tables } from "@/services/supabase/database.types";

describe("mapUser", () => {
  it("maps account setup state", () => {
    const row = {
      id: "user-1",
      name: "Abu Zaid",
      email: "abu@example.com",
      avatar: null,
      initials: "AZ",
      default_currency: "USD",
      setup_state: "activation_pending",
      created_at: "2026-07-18T10:00:00.000Z",
      updated_at: "2026-07-18T10:00:00.000Z",
    } as Tables<"users">;

    expect(mapUser(row)).toMatchObject({
      id: "user-1",
      setupState: "activation_pending",
    });
  });
});
```

- [ ] **Step 2: Run the mapper test to verify RED**

Run: `npm test -- --runInBand src/services/api/mappers.test.ts`

Expected: FAIL because `setupState` is absent from the mapped user.

- [ ] **Step 3: Add the lifecycle and avatar migration**

Create `supabase/migrations/202607180002_account_lifecycle.sql`:

```sql
alter table public.users
add column if not exists setup_state text;

-- Existing accounts already passed the shipped device-global onboarding gate.
update public.users
set setup_state = 'complete'
where setup_state is null;

alter table public.users
alter column setup_state set default 'profile_pending';

alter table public.users
alter column setup_state set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_setup_state_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
    add constraint users_setup_state_check
    check (setup_state in ('profile_pending', 'activation_pending', 'complete'));
  end if;
end;
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_initials text;
begin
  profile_name = coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1)
  );
  profile_initials = upper(left(profile_name, 1));

  insert into public.users (
    id,
    name,
    email,
    avatar,
    initials,
    default_currency,
    setup_state
  )
  values (
    new.id,
    profile_name,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'avatar',
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    profile_initials,
    coalesce(
      new.raw_user_meta_data ->> 'default_currency',
      new.raw_user_meta_data ->> 'defaultCurrency',
      'USD'
    ),
    'profile_pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update their own avatar" on storage.objects;
create policy "Users update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete their own avatar" on storage.objects;
create policy "Users delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

Migration semantics are exact:

- Rows present during migration become `complete` and are not forced through new setup.
- Rows inserted afterward receive `profile_pending` from the column default and trigger.
- Profile submission advances to `activation_pending` in the same row update as name/currency/avatar.
- Selecting any first action or Skip advances to `complete`.
- Downgrades are not performed by application code.

- [ ] **Step 4: Update checked-in database types manually**

Replace the `users` table block in `src/services/supabase/database.types.ts` with:

```ts
users: {
  Row: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    initials: string;
    default_currency: string;
    setup_state: "profile_pending" | "activation_pending" | "complete";
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    initials: string;
    default_currency?: string;
    setup_state?: "profile_pending" | "activation_pending" | "complete";
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
  Relationships: [];
};
```

This repository does not contain `supabase/config.toml` or a checked-in Supabase CLI workflow, so the migration is mirrored manually rather than pretending a local generation command is available. When a linked project is available, regenerate to a temporary file and compare it; do not overwrite unrelated manual table additions.

- [ ] **Step 5: Add the application setup-state type**

Insert before `User` in `src/types/index.ts`, then add `setupState` to `User`:

```ts
export type AccountSetupState = "profile_pending" | "activation_pending" | "complete";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  defaultCurrency: string;
  setupState: AccountSetupState;
  createdAt?: Date;
}
```

Update the fallback user in `src/context/AppContext.tsx` and `emptyUser()` in `src/services/api/mappers.ts` when those files are touched in later tasks by setting `setupState: "complete"`; this prevents display-only relationship users from entering lifecycle derivation.

- [ ] **Step 6: Map setup state**

Replace `mapUser` in `src/services/api/mappers.ts`:

```ts
export function mapUser(row: DbUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? undefined,
    initials: row.initials,
    defaultCurrency: row.default_currency,
    setupState: row.setup_state,
    createdAt: new Date(row.created_at),
  };
}
```

Add `setupState: "complete"` to the object returned by `emptyUser()`.

- [ ] **Step 7: Keep existing display-only user literals source-compatible**

Add this property after `defaultCurrency` in the user object in `src/features/profile/components/ProfileHeader.tsx` and the fallback object in `src/features/expenses/components/ExpenseComments.tsx`:

```ts
setupState: "complete",
```

These objects are presentation fallbacks, not authenticated account records, so `complete` prevents them from being mistaken for lifecycle inputs.

- [ ] **Step 8: Run the mapper test to verify GREEN**

Run: `npm test -- --runInBand src/services/api/mappers.test.ts`

Expected: PASS with 1 test.

- [ ] **Step 9: Inspect migration and task boundary**

Run: `git diff --check -- supabase/migrations/202607180002_account_lifecycle.sql src/services/supabase/database.types.ts src/types/index.ts src/services/api/mappers.ts src/services/api/mappers.test.ts src/features/profile/components/ProfileHeader.tsx src/features/expenses/components/ExpenseComments.tsx`

Expected: exit 0 with no whitespace errors.

Run: `rg -n "setup_state|profile_pending|activation_pending|complete" supabase/migrations/202607180002_account_lifecycle.sql src/services/supabase/database.types.ts src/types/index.ts src/services/api/mappers.ts`

Expected: all three states appear in the migration and database type; `setup_state` maps to `setupState` once.

---

### Task 3: Define Pure Auth Phases and Route Decisions

**Files:**

- Create: `src/features/auth/lifecycle.ts`
- Create: `src/features/auth/lifecycle.test.ts`

**Interfaces:**

- Consumes: `AccountSetupState`, session presence, profile hydration status, pending verification email, recovery email, and Expo Router segments.
- Produces: `AuthPhase`, `deriveAuthPhase(input): AuthPhase`, `classifyLifecycleRoute(segments): LifecycleRouteKind`, and `decideLifecycleRoute(phase, segments): LifecycleRouteTarget | null`.

- [ ] **Step 1: Write the complete failing lifecycle tests**

Create `src/features/auth/lifecycle.test.ts`:

```ts
import {
  classifyLifecycleRoute,
  decideLifecycleRoute,
  deriveAuthPhase,
  type AuthPhaseInput,
} from "./lifecycle";

const base: AuthPhaseInput = {
  initialized: true,
  sessionUserId: null,
  sessionEmail: null,
  sessionEmailConfirmed: false,
  profile: null,
  profileLoading: false,
  profileError: null,
  pendingVerificationEmail: null,
  recoveryEmail: null,
};

describe("deriveAuthPhase", () => {
  it.each([
    [{ ...base, initialized: false }, { status: "loading" }],
    [{ ...base }, { status: "signedOut" }],
    [
      { ...base, pendingVerificationEmail: "abu@example.com" },
      { status: "verificationRequired", email: "abu@example.com" },
    ],
    [
      {
        ...base,
        sessionUserId: "u1",
        sessionEmail: "abu@example.com",
        sessionEmailConfirmed: false,
      },
      { status: "verificationRequired", email: "abu@example.com" },
    ],
    [{ ...base, sessionUserId: "u1", profileLoading: true }, { status: "loading" }],
    [
      { ...base, sessionUserId: "u1", profileError: "Profile unavailable" },
      { status: "error", message: "Profile unavailable" },
    ],
    [
      { ...base, profileError: "Session unavailable" },
      { status: "error", message: "Session unavailable" },
    ],
    [
      {
        ...base,
        sessionUserId: "u1",
        profile: { setupState: "profile_pending" },
      },
      { status: "profileSetup" },
    ],
    [
      {
        ...base,
        sessionUserId: "u1",
        profile: { setupState: "activation_pending" },
      },
      { status: "firstAction" },
    ],
    [
      {
        ...base,
        sessionUserId: "u1",
        profile: { setupState: "complete" },
      },
      { status: "ready" },
    ],
    [
      {
        ...base,
        sessionUserId: "u1",
        profileLoading: true,
        recoveryEmail: "abu@example.com",
      },
      { status: "recovery", email: "abu@example.com" },
    ],
  ])("derives %#", (input, expected) => {
    expect(deriveAuthPhase(input as AuthPhaseInput)).toEqual(expected);
  });
});

describe("classifyLifecycleRoute", () => {
  it.each([
    [["index"], "index"],
    [["(auth)", "welcome"], "auth"],
    [["(auth)", "forgot-password"], "auth"],
    [["(auth)", "reset-password"], "recoveryReset"],
    [["auth", "callback"], "authCallback"],
    [["verify-email"], "verification"],
    [["profile-setup"], "profileSetup"],
    [["first-action"], "firstAction"],
    [["onboarding"], "legacyOnboarding"],
    [["home"], "readyApp"],
    [["expense", "new"], "readyApp"],
  ])("classifies %j", (segments, expected) => {
    expect(classifyLifecycleRoute(segments)).toBe(expected);
  });
});

describe("decideLifecycleRoute", () => {
  it("never redirects the callback while auth is loading", () => {
    expect(decideLifecycleRoute({ status: "loading" }, ["auth", "callback"])).toBeNull();
  });

  it("holds every non-callback route while loading", () => {
    expect(decideLifecycleRoute({ status: "loading" }, ["home"])).toBeNull();
  });

  it("keeps signed-out users on entry routes", () => {
    expect(decideLifecycleRoute({ status: "signedOut" }, ["(auth)", "login"])).toBeNull();
  });

  it("sends signed-out app routes to welcome", () => {
    expect(decideLifecycleRoute({ status: "signedOut" }, ["home"])).toEqual({
      pathname: "/(auth)/welcome",
    });
  });

  it("sends pending verification to the account email", () => {
    expect(
      decideLifecycleRoute({ status: "verificationRequired", email: "abu+test@example.com" }, [
        "(auth)",
        "register",
      ])
    ).toEqual({
      pathname: "/verify-email",
      params: { email: "abu+test@example.com" },
    });
  });

  it("allows the verification screen for pending verification", () => {
    expect(
      decideLifecycleRoute({ status: "verificationRequired", email: "abu@example.com" }, [
        "verify-email",
      ])
    ).toBeNull();
  });

  it("forces profile setup before ready routes", () => {
    expect(decideLifecycleRoute({ status: "profileSetup" }, ["home"])).toEqual({
      pathname: "/profile-setup",
    });
  });

  it("forces first action after profile setup", () => {
    expect(decideLifecycleRoute({ status: "firstAction" }, ["profile-setup"])).toEqual({
      pathname: "/first-action",
    });
  });

  it("allows ready app routes", () => {
    expect(decideLifecycleRoute({ status: "ready" }, ["group", "new"])).toBeNull();
  });

  it.each(["auth", "verification", "profileSetup", "firstAction", "legacyOnboarding", "index"])(
    "sends ready users away from %s routes",
    (kind) => {
      const segmentsByKind: Record<string, readonly string[]> = {
        auth: ["(auth)", "login"],
        verification: ["verify-email"],
        profileSetup: ["profile-setup"],
        firstAction: ["first-action"],
        legacyOnboarding: ["onboarding"],
        index: ["index"],
      };
      expect(decideLifecycleRoute({ status: "ready" }, segmentsByKind[kind]!)).toEqual({
        pathname: "/home",
      });
    }
  );

  it("forces an active recovery session onto reset password", () => {
    expect(
      decideLifecycleRoute({ status: "recovery", email: "abu@example.com" }, ["home"])
    ).toEqual({
      pathname: "/(auth)/reset-password",
      params: { email: "abu@example.com" },
    });
  });

  it("allows reset only for active recovery", () => {
    expect(
      decideLifecycleRoute({ status: "recovery", email: "abu@example.com" }, [
        "(auth)",
        "reset-password",
      ])
    ).toBeNull();
    expect(decideLifecycleRoute({ status: "signedOut" }, ["(auth)", "reset-password"])).toEqual({
      pathname: "/(auth)/forgot-password",
    });
  });
});
```

- [ ] **Step 2: Run lifecycle tests to verify RED**

Run: `npm test -- --runInBand src/features/auth/lifecycle.test.ts`

Expected: FAIL because `src/features/auth/lifecycle.ts` does not exist.

- [ ] **Step 3: Implement the pure lifecycle model**

Create `src/features/auth/lifecycle.ts`:

```ts
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
  if (input.sessionUserId && !input.sessionEmailConfirmed) {
    return { status: "verificationRequired", email: input.sessionEmail ?? "" };
  }
  if (!input.sessionUserId && input.pendingVerificationEmail) {
    return { status: "verificationRequired", email: input.pendingVerificationEmail };
  }
  if (input.profileError) return { status: "error", message: input.profileError };
  if (!input.sessionUserId) return { status: "signedOut" };
  if (input.profileLoading || !input.profile) return { status: "loading" };

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
```

- [ ] **Step 4: Run lifecycle tests to verify GREEN**

Run: `npm test -- --runInBand src/features/auth/lifecycle.test.ts`

Expected: PASS with all phase, classification, callback, recovery, and ready-route cases.

- [ ] **Step 5: Typecheck the pure contract**

Run: `npx tsc --noEmit --pretty false`

Expected: exit 0. If the dirty baseline has unrelated errors, record them and verify that no error references `src/features/auth/lifecycle.ts` or its test; do not edit unrelated files.

---

### Task 4: Build the Auth and Account Service Contract

**Files:**

- Create: `src/services/api/auth.test.ts`
- Modify: `src/services/api/auth.ts:1-142`
- Modify: `src/queries/keys.ts:5-9`
- Modify: `src/features/auth/hooks/useAuthMutations.ts:1-68`
- Modify: `src/features/profile/hooks/useUpdateProfile.ts:1-14`

**Interfaces:**

- Consumes: Supabase `signUp`, `signInWithPassword`, `resend`, `verifyOtp`, `signInWithOAuth`, `exchangeCodeForSession`, `getSession`, `updateUser`, `signOut`, `users` RLS, storage bucket `avatars`, and `mapUser`.
- Produces: `SignUpResult`, `AuthCallbackParams`, `AuthCallbackResult`, `EmailVerificationRequiredError`, `AuthService.getUserProfile`, `completeProfileSetup`, `markActivationSeen`, and `completePasswordRecovery`.

- [ ] **Step 1: Write service-logic tests before replacing the service**

Create `src/services/api/auth.test.ts`:

```ts
import {
  buildProfileSeed,
  buildSignUpResult,
  exchangeAuthCallback,
  parseAuthCallbackUrl,
} from "./auth";

describe("parseAuthCallbackUrl", () => {
  it("normalizes PKCE callback values", () => {
    expect(
      parseAuthCallbackUrl(
        "splt://auth/callback?code=abc123&flow=recovery&error_description=ignored"
      )
    ).toEqual({
      code: "abc123",
      flow: "recovery",
      error: null,
      errorDescription: "ignored",
    });
  });
});

describe("exchangeAuthCallback", () => {
  it("uses Supabase redirectType as recovery authority", async () => {
    const exchange = jest.fn().mockResolvedValue({
      data: {
        user: { email: "abu@example.com" },
        redirectType: "recovery",
      },
      error: null,
    });

    await expect(
      exchangeAuthCallback(exchange, {
        code: "code-1",
        flow: "oauth",
        error: null,
        errorDescription: null,
      })
    ).resolves.toEqual({ kind: "recovery", email: "abu@example.com" });
    expect(exchange).toHaveBeenCalledWith("code-1");
  });

  it("uses the explicit flow for non-recovery callbacks", async () => {
    const exchange = jest.fn().mockResolvedValue({
      data: {
        user: { email: "abu@example.com" },
        redirectType: null,
      },
      error: null,
    });

    await expect(
      exchangeAuthCallback(exchange, {
        code: "code-2",
        flow: "verification",
        error: null,
        errorDescription: null,
      })
    ).resolves.toEqual({ kind: "verification", email: "abu@example.com" });
  });

  it("does not grant recovery mode from the query marker alone", async () => {
    const exchange = jest.fn().mockResolvedValue({
      data: {
        user: { email: "abu@example.com" },
        redirectType: null,
      },
      error: null,
    });

    await expect(
      exchangeAuthCallback(exchange, {
        code: "oauth-code",
        flow: "recovery",
        error: null,
        errorDescription: null,
      })
    ).rejects.toMatchObject({
      message: "This link did not establish a password recovery session.",
      flow: "recovery",
    });
  });

  it.each([
    [
      { code: null, flow: "oauth", error: null, errorDescription: null },
      "The sign-in link is missing its authorization code.",
    ],
    [
      {
        code: null,
        flow: "recovery",
        error: "access_denied",
        errorDescription: "Link expired",
      },
      "Link expired",
    ],
  ])("rejects invalid callback %#", async (params, message) => {
    const exchange = jest.fn();
    await expect(exchangeAuthCallback(exchange, params as never)).rejects.toMatchObject({
      message,
    });
    expect(exchange).not.toHaveBeenCalled();
  });
});

describe("buildProfileSeed", () => {
  it("builds a valid delayed-row fallback for OAuth metadata", () => {
    expect(
      buildProfileSeed({
        id: "user-1",
        email: "abu@example.com",
        user_metadata: {
          full_name: "Abu Zaid",
          avatar_url: "https://example.com/avatar.png",
        },
      })
    ).toEqual({
      id: "user-1",
      name: "Abu Zaid",
      email: "abu@example.com",
      avatar: "https://example.com/avatar.png",
      initials: "AZ",
      default_currency: "USD",
      setup_state: "profile_pending",
    });
  });
});

describe("buildSignUpResult", () => {
  it.each([
    [null, true],
    [{ access_token: "token" }, false],
  ])("sets confirmation requirement for session %#", (session, requiresEmailVerification) => {
    expect(buildSignUpResult({ user: { id: "user-1" }, session }, "abu@example.com")).toEqual({
      userId: "user-1",
      email: "abu@example.com",
      requiresEmailVerification,
    });
  });

  it("rejects a signup response without a user", () => {
    expect(() => buildSignUpResult({ user: null, session: null }, "abu@example.com")).toThrow(
      "Supabase did not return the new account."
    );
  });
});
```

- [ ] **Step 2: Run service tests to verify RED**

Run: `npm test -- --runInBand src/services/api/auth.test.ts`

Expected: FAIL because the callback and profile-seed exports do not exist.

- [ ] **Step 3: Replace the auth service with the complete lifecycle service**

Replace `src/services/api/auth.ts` completely:

```ts
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "@/services/supabase/client";
import type { Inserts } from "@/services/supabase/database.types";
import type { User } from "@/types";
import { mapUser } from "./mappers";

WebBrowser.maybeCompleteAuthSession();

export type AuthCallbackFlow = "oauth" | "verification" | "recovery";

export interface AuthCallbackParams {
  code: string | null;
  flow: AuthCallbackFlow;
  error: string | null;
  errorDescription: string | null;
}

export interface AuthCallbackResult {
  kind: AuthCallbackFlow;
  email: string;
}

export interface SignUpData {
  email: string;
  password?: string;
  name: string;
  defaultCurrency?: string;
}

export interface SignUpResult {
  userId: string;
  email: string;
  requiresEmailVerification: boolean;
}

export function buildSignUpResult(
  data: { user: { id: string } | null; session: unknown | null },
  email: string
): SignUpResult {
  if (!data.user) throw new Error("Supabase did not return the new account.");
  return {
    userId: data.user.id,
    email,
    requiresEmailVerification: data.session === null,
  };
}

export interface SignInData {
  email: string;
  password?: string;
}

export interface ProfileSetupInput {
  name: string;
  defaultCurrency: string;
  avatarUri?: string;
}

type ExchangeCode = (code: string) => Promise<{
  data: {
    user: SupabaseUser | null;
    redirectType?: string | null;
  };
  error: { message: string } | null;
}>;

export class EmailVerificationRequiredError extends Error {
  constructor(readonly email: string) {
    super("Verify your email before signing in.");
    this.name = "EmailVerificationRequiredError";
  }
}

export class AuthCallbackError extends Error {
  constructor(
    message: string,
    readonly flow: AuthCallbackFlow
  ) {
    super(message);
    this.name = "AuthCallbackError";
  }
}

export function getAuthRedirectUri(flow: AuthCallbackFlow): string {
  return makeRedirectUri({
    scheme: "splt",
    path: "auth/callback",
    queryParams: { flow },
  });
}

export function parseAuthCallbackUrl(url: string): AuthCallbackParams {
  const parsed = new URL(url);
  const flowValue = parsed.searchParams.get("flow");
  const flow: AuthCallbackFlow =
    flowValue === "recovery" || flowValue === "verification" ? flowValue : "oauth";

  return {
    code: parsed.searchParams.get("code"),
    flow,
    error: parsed.searchParams.get("error") ?? parsed.searchParams.get("error_code"),
    errorDescription: parsed.searchParams.get("error_description"),
  };
}

export async function exchangeAuthCallback(
  exchangeCode: ExchangeCode,
  params: AuthCallbackParams
): Promise<AuthCallbackResult> {
  if (params.error) {
    throw new AuthCallbackError(
      params.errorDescription || "This authentication link is invalid or expired.",
      params.flow
    );
  }
  if (!params.code) {
    throw new AuthCallbackError("The sign-in link is missing its authorization code.", params.flow);
  }

  const { data, error } = await exchangeCode(params.code);
  if (error) throw new AuthCallbackError(error.message, params.flow);

  if (params.flow === "recovery" && data.redirectType !== "recovery") {
    throw new AuthCallbackError(
      "This link did not establish a password recovery session.",
      "recovery"
    );
  }

  const kind: AuthCallbackFlow =
    data.redirectType === "recovery"
      ? "recovery"
      : params.flow === "verification"
        ? "verification"
        : "oauth";
  return { kind, email: data.user?.email ?? "" };
}

export function buildProfileSeed(
  authUser: Pick<SupabaseUser, "id" | "email" | "user_metadata">
): Inserts<"users"> {
  const metadata = authUser.user_metadata ?? {};
  const email = authUser.email ?? "";
  const name =
    stringValue(metadata.name) ||
    stringValue(metadata.full_name) ||
    email.split("@")[0] ||
    "Splt user";

  return {
    id: authUser.id,
    name,
    email,
    avatar:
      stringValue(metadata.avatar) ||
      stringValue(metadata.avatar_url) ||
      stringValue(metadata.picture) ||
      null,
    initials: initialsFor(name),
    default_currency:
      stringValue(metadata.default_currency) || stringValue(metadata.defaultCurrency) || "USD",
    setup_state: "profile_pending",
  };
}

async function signInWithOAuthProvider(provider: "google" | "apple") {
  const redirectTo = getAuthRedirectUri("oauth");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("The authentication provider did not return a sign-in URL.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") throw new Error("Social sign-in was cancelled.");

  return exchangeAuthCallback(
    supabase.auth.exchangeCodeForSession.bind(supabase.auth),
    parseAuthCallbackUrl(result.url)
  );
}

async function getUserProfile(authUser: SupabaseUser): Promise<User> {
  for (const delay of [0, 100, 300]) {
    if (delay > 0) await wait(delay);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();
    if (error) throw error;
    if (data) return mapUser(data);
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(buildProfileSeed(authUser), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return mapUser(data);
}

async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Could not read the selected profile photo.");
  const body = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const extension =
    contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/profile.${extension}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, body, { contentType, upsert: true });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export const AuthService = {
  async signUp(input: SignUpData): Promise<SignUpResult> {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password ?? "",
      options: {
        emailRedirectTo: getAuthRedirectUri("verification"),
        data: {
          name: input.name.trim(),
          default_currency: input.defaultCurrency ?? "USD",
        },
      },
    });
    if (error) throw error;
    return buildSignUpResult(data, email);
  },

  async signIn(input: SignInData) {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password ?? "",
    });
    if (
      error?.code === "email_not_confirmed" ||
      error?.message.toLowerCase().includes("not confirmed")
    ) {
      throw new EmailVerificationRequiredError(email);
    }
    if (error) throw error;
    return data;
  },

  async resendSignUpOtp(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: getAuthRedirectUri("verification") },
    });
    if (error) throw error;
  },

  async verifySignUpOtp(email: string, token: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "signup",
    });
    if (error) throw error;
  },

  completeAuthCallback(params: AuthCallbackParams): Promise<AuthCallbackResult> {
    return exchangeAuthCallback(supabase.auth.exchangeCodeForSession.bind(supabase.auth), params);
  },

  signInWithGoogle: () => signInWithOAuthProvider("google"),
  signInWithApple: () => signInWithOAuthProvider("apple"),

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  getUserProfile,

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session ? getUserProfile(session.user) : null;
  },

  async completeProfileSetup(userId: string, input: ProfileSetupInput): Promise<User> {
    const avatar = input.avatarUri ? await uploadAvatar(userId, input.avatarUri) : undefined;
    const name = input.name.trim();
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        initials: initialsFor(name),
        default_currency: input.defaultCurrency,
        setup_state: "activation_pending",
        ...(avatar ? { avatar } : {}),
      })
      .eq("id", userId)
      .in("setup_state", ["profile_pending", "activation_pending"])
      .select("*")
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  async markActivationSeen(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update({ setup_state: "complete" })
      .eq("id", userId)
      .in("setup_state", ["activation_pending", "complete"])
      .select("*")
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getAuthRedirectUri("recovery"),
    });
    if (error) throw error;
  },

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async completePasswordRecovery(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
    if (signOutError) {
      throw new Error("Password updated, but Splt could not close every session. Sign in again.");
    }
  },

  async updateProfile(userId: string, data: { name?: string; email?: string }): Promise<void> {
    const update = data.name ? { ...data, initials: initialsFor(data.name) } : data;
    const { error } = await supabase.from("users").update(update).eq("id", userId);
    if (error) throw error;
  },

  async deleteAccount(userId: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) throw error;
    await this.signOut();
  },
};

function initialsFor(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: Run service tests to verify GREEN**

Run: `npm test -- --runInBand src/services/api/auth.test.ts`

Expected: PASS for callback parsing/exchange and delayed-profile seed behavior.

- [ ] **Step 5: Canonicalize account query keys**

Replace the auth/user key lines in `src/queries/keys.ts`:

```ts
account: {
  all: ["account"] as const,
  session: ["account", "session"] as const,
  currentUser: ["account", "current-user"] as const,
  profile: (userId: string) => ["account", "profile", userId] as const,
},
```

- [ ] **Step 6: Update auth mutation invalidation**

In `src/features/auth/hooks/useAuthMutations.ts`, import `queryKeys`, replace both sign-in and sign-up `onSuccess` blocks with:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.account.all });
},
```

Replace the social hooks with:

```ts
export function useSignInWithGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => AuthService.signInWithGoogle(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.account.all }),
  });
}

export function useSignInWithApple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => AuthService.signInWithApple(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.account.all }),
  });
}
```

Keep sign-out/delete `queryClient.clear()` unchanged so an account switch cannot reuse prior-user data.

- [ ] **Step 7: Use the account key for existing profile edits**

Import `queryKeys` in `src/features/profile/hooks/useUpdateProfile.ts` and replace its `onSuccess` block with:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.account.all });
},
```

- [ ] **Step 8: Verify service types and focused tests**

Run: `npm test -- --runInBand src/services/api/auth.test.ts src/services/api/mappers.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit --pretty false`

Expected: exit 0 or no new error in the files listed by this task if unrelated dirty baseline errors exist.

- [ ] **Step 9: Allow the native callback in the development Supabase project**

In Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs, add exactly:

```text
splt://auth/callback**
```

Expected: Supabase accepts `splt://auth/callback?flow=oauth`, `?flow=verification`, and `?flow=recovery` while rejecting unrelated custom-scheme destinations. Apply the same entry to staging and production before their builds are distributed.

---

### Task 5: Hydrate Context and Install the Route Guard

**Files:**

- Modify: `src/context/AppContext.tsx:1-122`
- Create: `src/features/auth/components/AuthLifecycleGuard.tsx`
- Modify: `src/providers/AppProvider.tsx:10-40`

**Interfaces:**

- Consumes: `AuthService.getSession()`, `AuthService.getUserProfile(authUser)`, Supabase auth events, `deriveAuthPhase`, `decideLifecycleRoute`, and React Query account keys.
- Produces: compatible `currentUser`, `authPhase`, `refreshAuth`, verification/recovery controls, and a one-shot activation destination consumed by the guard.

- [ ] **Step 1: Replace the auth context with independent session/profile hydration**

Replace `src/context/AppContext.tsx` completely:

```tsx
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
  "/group/new" | "/friend/new" | "/expense/new" | "/recurring/new" | "/home";

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
        setCurrentUser(null);
        setProfileLoading(false);
        setProfileError(null);
        return;
      }
      setPendingVerificationEmail(null);
      await hydrateProfile(nextSession, currentUser?.id !== nextSession.user.id);
    },
    [currentUser?.id, hydrateProfile, queryClient]
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
```

- [ ] **Step 2: Create the lifecycle guard**

Create `src/features/auth/components/AuthLifecycleGuard.tsx`:

```tsx
import type { Href } from "expo-router";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
import { useAuth } from "@/context/AppContext";
import { classifyLifecycleRoute, decideLifecycleRoute } from "@/features/auth/lifecycle";

export function AuthLifecycleGuard({ children }: { children: ReactNode }) {
  const { activationDestination, authPhase, clearActivationDestination, refreshAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootState = useRootNavigationState();
  const coral = useCoralColors();
  const activationNavigationStarted = useRef(false);
  const routeKind = classifyLifecycleRoute(segments);
  const decision = decideLifecycleRoute(authPhase, segments);

  useEffect(() => {
    if (!rootState?.key) return;
    if (activationDestination) {
      if (routeKind === "firstAction") {
        if (!activationNavigationStarted.current) {
          activationNavigationStarted.current = true;
          router.replace(activationDestination as Href);
        }
        return;
      }
      activationNavigationStarted.current = false;
      clearActivationDestination();
      return;
    }
    activationNavigationStarted.current = false;
    if (decision) router.replace(decision as Href);
  }, [
    activationDestination,
    clearActivationDestination,
    decision,
    rootState?.key,
    routeKind,
    router,
  ]);

  if (routeKind === "authCallback") return children;

  if (authPhase.status === "error") {
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          backgroundColor: coral.bg,
        }}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 20,
            color: coral.foreground,
            textAlign: "center",
          }}
        >
          We could not load your account.
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 15,
            color: coral.muted,
            textAlign: "center",
          }}
        >
          {authPhase.message}
        </Text>
        <CoralButton label="Try again" onPress={() => void refreshAuth()} />
      </View>
    );
  }

  if (authPhase.status === "loading" || activationDestination || decision) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: coral.bg,
        }}
      >
        <ActivityIndicator color={coral.accent} accessibilityLabel="Loading account" />
      </View>
    );
  }

  return children;
}
```

- [ ] **Step 3: Install the guard inside the existing provider order**

Add this import to `src/providers/AppProvider.tsx`:

```ts
import { AuthLifecycleGuard } from "@/features/auth/components/AuthLifecycleGuard";
```

Replace the current `AuthProvider` line with:

```tsx
<AuthProvider>
  <AuthLifecycleGuard>{children}</AuthLifecycleGuard>
</AuthProvider>
```

- [ ] **Step 4: Re-run pure lifecycle tests after integration**

Run: `npm test -- --runInBand src/features/auth/lifecycle.test.ts`

Expected: PASS; no route policy was duplicated in context or provider.

- [ ] **Step 5: Verify the compatibility boundary**

Run: `rg -n "currentUser: User|currentUser \?\? fallbackUser|currentUser\.id" src/context/AppContext.tsx src/features`

Expected: `AuthContextValue.currentUser` remains `User`, the fallback remains present, and existing feature consumers require no nullability edits.

---

### Task 6: Connect Registration, Login, Social Auth, and Verification

**Files:**

- Modify: `src/features/auth/screens-v2/RegisterScreen.tsx:20-59`
- Modify: `src/features/auth/screens-v2/LoginScreen.tsx:1-111`
- Modify: `src/features/auth/screens-v2/WelcomeScreen.tsx:13-34`
- Modify: `src/features/auth/screens-v2/VerifyEmailScreen.tsx:12-155`

**Interfaces:**

- Consumes: `SignUpResult.requiresEmailVerification`, `EmailVerificationRequiredError`, `requireEmailVerification`, `refreshAuth`, `resendSignUpOtp`, and `verifySignUpOtp`.
- Produces: confirmation-required and confirmation-disabled signup paths that converge on the same guard; social auth also converges on that guard.

- [ ] **Step 1: Branch registration on the returned session**

Add `useAuth` to `RegisterScreen.tsx`, destructure `requireEmailVerification` and `refreshAuth`, and replace `onSubmit` with:

```ts
const onSubmit = async (data: RegisterFormData): Promise<void> => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
    const result = await signUp(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (result.requiresEmailVerification) {
      requireEmailVerification(result.email);
      router.replace({ pathname: "/verify-email", params: { email: result.email } });
      return;
    }
    await refreshAuth();
    router.replace("/");
  } catch (error) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    toast.show({
      label: "Registration failed",
      description: error instanceof Error ? error.message : "Could not create account.",
      variant: "danger",
      placement: "top",
    });
  }
};
```

Replace the password helper copy with:

```tsx
Use 8 to 72 characters with at least one number or symbol.
```

Replace the registration title and introduction with:

```tsx
<LargeTitle>Start with you.</LargeTitle>
<Text
  style={{
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: coral.muted,
    marginBottom: 28,
  }}
>
  Your name helps friends recognize you. You can change it later.
</Text>
```

- [ ] **Step 2: Remove login's device-global routing**

Remove the `AsyncStorage` import. Import `EmailVerificationRequiredError` and `useAuth`, destructure `requireEmailVerification` and `refreshAuth`, and replace `doSignIn` with:

```ts
const doSignIn = async (data: LoginFormData, storeForBiometric: boolean) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
    await signIn(data);
    if (storeForBiometric && isAvailable) await saveCredentials(data.email, data.password);
    await refreshAuth();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/");
  } catch (error) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (error instanceof EmailVerificationRequiredError) {
      requireEmailVerification(error.email);
      router.replace({ pathname: "/verify-email", params: { email: error.email } });
      return;
    }
    toast.show({
      label: "Login failed",
      description: error instanceof Error ? error.message : "Invalid credentials.",
      variant: "danger",
      placement: "top",
    });
  }
};
```

Replace `handleSocialSignIn` with:

```ts
const handleSocialSignIn = async (fn: () => Promise<unknown>, isPending: boolean) => {
  if (isPending) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  try {
    await fn();
    await refreshAuth();
    router.replace("/");
  } catch (error) {
    toast.show({
      label: "Sign in failed",
      description: error instanceof Error ? error.message : "Something went wrong.",
      variant: "danger",
      placement: "top",
    });
  }
};
```

Replace the login introduction with:

```tsx
<Text
  style={{
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: coral.muted,
    marginBottom: 28,
  }}
>
  Sign in to see balances, shared activity, and bills waiting for review.
</Text>
```

- [ ] **Step 3: Route welcome social auth through the lifecycle guard**

In `WelcomeScreen.tsx`, destructure `refreshAuth` from `useAuth()` and replace `handleSocialSignIn` with:

```ts
const handleSocialSignIn = async (fn: () => Promise<unknown>) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  try {
    await fn();
    await refreshAuth();
    router.replace("/");
  } catch (error) {
    toast.show({
      label: "Sign in failed",
      description:
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      variant: "danger",
      placement: "top",
    });
  }
};
```

No handler may directly choose Home, profile setup, or first action.

Replace the welcome title and introduction with:

```tsx
<LargeTitle style={{ textAlign: "center", marginTop: 0 }}>
  Shared money, made lighter.
</LargeTitle>
<Text
  style={{
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: coral.muted,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 40,
    paddingHorizontal: 8,
  }}
>
  Split nights out, trips, rent, and recurring bills without turning friendship into accounting.
</Text>
```

- [ ] **Step 4: Use signup OTP APIs on the verification screen**

Replace the Supabase import with:

```ts
import { useAuth } from "@/context/AppContext";
import { AuthService } from "@/services/api/auth";
```

Remove `InteractionManager`, `didSendInitialRef`, and the effect that sends an initial OTP. The signup request already sent the first confirmation message.

Destructure `refreshAuth` from `useAuth()`. Replace the request inside `sendOtp` with:

```ts
await AuthService.resendSignUpOtp(email);
```

Replace the Supabase call in `handleVerify` with:

```ts
await AuthService.verifySignUpOtp(email, fullCode);
await refreshAuth();
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
router.replace("/");
```

Keep the existing expired/invalid error normalization around that call. Change the OTP text input font to `IBMPlexMono_600SemiBold` to match the visual contract.

Replace the OTP row gap with `6` and replace each input's fixed `width: 48` with:

```ts
flex: 1,
maxWidth: 48,
minWidth: 0,
```

Add `accessibilityLabel={`Verification code digit ${index + 1}`}` to each OTP input. At 360px, the six fields then fit inside the screen gutter without horizontal overflow.

- [ ] **Step 5: Verify no account-entry screen chooses lifecycle destinations itself**

Run: `rg -n "@splt_onboarded|router\.(push|replace)\(\"/(home|onboarding|profile-setup|first-action)" src/features/auth src/context`

Expected: no `@splt_onboarded` match and no direct Home/setup/activation navigation in auth screens.

- [ ] **Step 6: Make the signup email support both code and link verification**

In Supabase Dashboard -> Authentication -> Email Templates -> Confirm signup, set the body to:

```html
<h2>Verify your Splt email</h2>
<p>Enter this six-digit code in Splt:</p>
<p style="font-size: 24px; font-weight: 600; letter-spacing: 0.18em">{{ .Token }}</p>
<p>Or verify on this device:</p>
<p><a href="{{ .ConfirmationURL }}">Verify email</a></p>
```

Expected: a new confirmation-required signup receives a six-digit token accepted by `verifyOtp({ type: "signup" })` and a link that returns through `splt://auth/callback?flow=verification`.

---

### Task 7: Complete Deep-Linked Password Recovery and Shared Password Rules

**Files:**

- Create: `src/validation/schemas.test.ts`
- Create: `src/utils/passwordStrength.test.ts`
- Modify: `src/validation/schemas.ts:1-48`
- Modify: `src/utils/passwordStrength.ts:1-32`
- Create: `src/app/auth/callback.tsx`
- Create: `src/features/auth/screens-v2/ResetPasswordScreen.tsx`
- Create: `src/app/(auth)/reset-password.tsx`
- Modify: `src/app/(auth)/_layout.tsx:18-22`
- Modify: `src/features/auth/screens-v2/ForgotPasswordScreen.tsx:19-53`
- Modify: `src/features/auth/screens-v2/LoginScreen.tsx:25-45`
- Modify: `src/features/profile/screens-v2/ChangePasswordScreen.tsx:1-197`

**Interfaces:**

- Consumes: `AuthService.completeAuthCallback`, `AuthCallbackResult.kind`, `beginRecovery`, `completePasswordRecovery`, `changePassword`, and a shared `passwordFormSchema`.
- Produces: exact callback destinations, protected reset mode, globally revoked recovery sessions, sign-in success state, and matching registration/recovery/change rules.

- [ ] **Step 1: Write password-contract tests**

Create `src/validation/schemas.test.ts`:

```ts
import { passwordFormSchema, registerSchema } from "./schemas";

describe("shared password rules", () => {
  it.each(["short1!", "abcdefgh", "ABCDEFGH"])("rejects %s", (password) => {
    expect(passwordFormSchema.safeParse({ password, confirmPassword: password }).success).toBe(
      false
    );
  });

  it.each(["abcdefgh1", "abcdefgh!", "12345678", "correct-horse-7"])("accepts %s", (password) => {
    expect(passwordFormSchema.safeParse({ password, confirmPassword: password }).success).toBe(
      true
    );
  });

  it("uses the same rule for registration", () => {
    expect(
      registerSchema.safeParse({
        name: "Abu Zaid",
        email: "abu@example.com",
        password: "abcdefgh1",
        confirmPassword: "abcdefgh1",
      }).success
    ).toBe(true);
  });

  it("requires matching confirmation", () => {
    const result = passwordFormSchema.safeParse({
      password: "abcdefgh1",
      confirmPassword: "abcdefgh2",
    });
    expect(result.success).toBe(false);
  });
});
```

Create `src/utils/passwordStrength.test.ts`:

```ts
import { evaluatePasswordStrength } from "./passwordStrength";

describe("evaluatePasswordStrength", () => {
  it("calls every password shorter than eight characters too short", () => {
    expect(evaluatePasswordStrength("Abc123!")).toEqual({ score: 0, label: "Too short" });
  });

  it("calls an eight-character letters-only password weak", () => {
    expect(evaluatePasswordStrength("abcdefgh")).toEqual({ score: 0, label: "Weak" });
  });

  it("does not call a valid number-or-symbol password too short", () => {
    expect(evaluatePasswordStrength("abcdefgh1").label).not.toBe("Too short");
  });
});
```

- [ ] **Step 2: Run password tests to verify RED**

Run: `npm test -- --runInBand src/validation/schemas.test.ts src/utils/passwordStrength.test.ts`

Expected: FAIL because `passwordFormSchema` does not exist, the old schema minimum is 6, and the old meter calls seven characters valid enough to score.

- [ ] **Step 3: Replace validation schemas with one password contract**

Replace `src/validation/schemas.ts` completely:

```ts
import { z } from "zod";

const emailValidator = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.")
  .max(255, "Email must be less than 255 characters.");

export const accountPasswordValidator = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[0-9]|[^A-Za-z0-9]/, "Password must include at least one number or symbol.");

const nameValidator = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters.")
  .max(100, "Full name must be less than 100 characters.")
  .regex(/^[a-zA-Z\s\-']+$/, "Name contains invalid characters.");

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, "Password is required."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const passwordFormSchema = z
  .object({
    password: accountPasswordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const registerSchema = z
  .object({
    name: nameValidator,
    email: emailValidator,
    password: accountPasswordValidator,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordFormData = z.infer<typeof passwordFormSchema>;

export const forgotPasswordSchema = z.object({ email: emailValidator });
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
```

Replace `evaluatePasswordStrength` in `src/utils/passwordStrength.ts`:

```ts
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (password.length < 8) return { score: 0, label: "Too short" };
  if (!/[0-9]|[^A-Za-z0-9]/.test(password)) return { score: 0, label: "Weak" };

  let categories = 0;
  if (/[a-z]/.test(password)) categories++;
  if (/[A-Z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^A-Za-z0-9]/.test(password)) categories++;

  if (categories <= 1) return { score: 1, label: "Fair" };
  if (categories <= 2 || password.length < 12) return { score: 2, label: "Good" };
  return { score: 3, label: "Strong" };
}
```

- [ ] **Step 4: Run password tests to verify GREEN**

Run: `npm test -- --runInBand src/validation/schemas.test.ts src/utils/passwordStrength.test.ts`

Expected: PASS with registration and reset/change parity.

- [ ] **Step 5: Create the callback route with exact destinations**

Create `src/app/auth/callback.tsx`:

```tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useCoralColors } from "@/components/coral/useCoral";
import { useAuth } from "@/context/AppContext";
import { AuthCallbackError, AuthService, type AuthCallbackFlow } from "@/services/api/auth";

function one(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string | string[];
    flow?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
    error_description?: string | string[];
  }>();
  const router = useRouter();
  const coral = useCoralColors();
  const { beginRecovery, refreshAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const flowValue = one(params.flow);
    const flow: AuthCallbackFlow =
      flowValue === "recovery" || flowValue === "verification" ? flowValue : "oauth";

    void AuthService.completeAuthCallback({
      code: one(params.code),
      flow,
      error: one(params.error) ?? one(params.error_code),
      errorDescription: one(params.error_description),
    })
      .then(async (result) => {
        if (result.kind === "recovery") {
          beginRecovery(result.email);
          router.replace({
            pathname: "/(auth)/reset-password",
            params: { email: result.email },
          });
          return;
        }
        await refreshAuth();
        router.replace("/");
      })
      .catch((error: unknown) => {
        const callbackError =
          error instanceof AuthCallbackError
            ? error
            : new AuthCallbackError("This authentication link is invalid or expired.", flow);
        const pathname =
          callbackError.flow === "recovery" ? "/(auth)/forgot-password" : "/(auth)/login";
        router.replace({ pathname, params: { authError: callbackError.message } });
      });
  }, [beginRecovery, params, refreshAuth, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: coral.bg,
      }}
    >
      <ActivityIndicator color={coral.accent} accessibilityLabel="Completing authentication" />
      <Text style={{ fontFamily: "InstrumentSans_500Medium", color: coral.muted }}>
        Securing your account...
      </Text>
    </View>
  );
}
```

Success destinations are exact:

- OAuth or verification link: `/`, then the pure guard chooses profile setup, first action, or Home.
- Recovery: `/(auth)/reset-password` after `PASSWORD_RECOVERY`/`redirectType` establishes recovery mode.
- OAuth/verification error: `/(auth)/login?authError=...`.
- Recovery error: `/(auth)/forgot-password?authError=...`.

- [ ] **Step 6: Create the reset-password screen**

Create `src/features/auth/screens-v2/ResetPasswordScreen.tsx`:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { CoralField } from "@/components/coral/CoralField";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { useAuth } from "@/context/AppContext";
import { useAppToast } from "@/hooks/useAppToast";
import { AuthService } from "@/services/api/auth";
import { passwordFormSchema, type PasswordFormData } from "@/validation/schemas";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { authPhase, clearRecovery } = useAuth();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const password = watch("password");

  const onSubmit = async ({ password: nextPassword }: PasswordFormData) => {
    if (authPhase.status !== "recovery") {
      router.replace({
        pathname: "/(auth)/forgot-password",
        params: { authError: "Request a new recovery link before changing your password." },
      });
      return;
    }
    try {
      await AuthService.completePasswordRecovery(nextPassword);
      clearRecovery();
      router.replace({
        pathname: "/(auth)/login",
        params: { email: email || authPhase.email, passwordReset: "success" },
      });
    } catch (error) {
      toast.show({
        label: "Password not updated",
        description: error instanceof Error ? error.message : "Request a new recovery link.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  return (
    <CoralScreen>
      <CoralTopBar title="New password" />
      <LargeTitle>Choose a new password.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          color: coral.muted,
          marginBottom: 24,
        }}
      >
        This recovery link was verified for{" "}
        {email || (authPhase.status === "recovery" ? authPhase.email : "your account")}.
      </Text>
      <View style={{ gap: 16 }}>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <CoralField
              label="New password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="new-password"
              error={errors.password?.message}
            />
          )}
        />
        <PasswordStrengthMeter password={password} />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <CoralField
              label="Confirm password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
            />
          )}
        />
        <CoralButton
          label="Update password and sign in"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 13,
            lineHeight: 20,
            color: coral.muted,
            textAlign: "center",
          }}
        >
          Updating your password signs out every active Splt session. Sign in again with the new
          password.
        </Text>
      </View>
    </CoralScreen>
  );
}
```

Create `src/app/(auth)/reset-password.tsx`:

```ts
export { default } from "@/features/auth/screens-v2/ResetPasswordScreen";
```

Add `<Stack.Screen name="reset-password" />` to `src/app/(auth)/_layout.tsx`.

- [ ] **Step 7: Surface callback and success states on existing screens**

In `ForgotPasswordScreen.tsx`, read `authError` with `useLocalSearchParams`, and add this effect after form creation:

Replace the router and React imports with:

```ts
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
```

Add this line after `const router = useRouter();`:

```ts
const { authError } = useLocalSearchParams<{ authError?: string }>();
```

```ts
useEffect(() => {
  if (!authError) return;
  toast.show({
    label: "Recovery link unavailable",
    description: authError,
    variant: "danger",
    placement: "top",
  });
}, [authError, toast]);
```

Replace the request-state title and introduction with:

```tsx
<LargeTitle style={{ textAlign: "center", marginTop: 0 }}>
  Reset your password.
</LargeTitle>
<Text
  style={{
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: coral.muted,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 28,
    paddingHorizontal: 8,
  }}
>
  We will email a secure link that returns you to Splt to choose a new password.
</Text>
```

In `LoginScreen.tsx`, replace the router and React imports with:

```ts
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
```

Add this line after `const router = useRouter();`:

```ts
const { email, authError, passwordReset } = useLocalSearchParams<{
  email?: string;
  authError?: string;
  passwordReset?: string;
}>();
```

Set the form email default to `email ?? ""`; then add:

```ts
useEffect(() => {
  if (passwordReset === "success") {
    toast.show({
      label: "Password updated",
      description: "Sign in with your new password.",
      variant: "success",
      placement: "top",
    });
  } else if (authError) {
    toast.show({
      label: "Sign in link unavailable",
      description: authError,
      variant: "danger",
      placement: "top",
    });
  }
}, [authError, passwordReset, toast]);
```

- [ ] **Step 8: Replace authenticated password validation with the shared schema**

In `ChangePasswordScreen.tsx`, import `PasswordStrengthMeter` and `passwordFormSchema`. Remove `getPasswordStrength` and `const strength = getPasswordStrength(newPassword)`. Replace the validation section at the start of `handleSave` with:

```ts
const parsed = passwordFormSchema.safeParse({
  password: newPassword,
  confirmPassword,
});
if (!parsed.success) {
  setError(parsed.error.issues[0]?.message ?? "Check both password fields.");
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  return;
}
```

Replace the local strength bar with:

```tsx
<PasswordStrengthMeter password={newPassword} />
```

Add helper copy below it:

```tsx
<Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted }}>
  Use 8 to 72 characters with at least one number or symbol.
</Text>
```

Authenticated password change calls `AuthService.changePassword` and keeps the current session; recovery calls `completePasswordRecovery` and globally signs out. Both validate identically.

- [ ] **Step 9: Run recovery-focused tests and typecheck**

Run: `npm test -- --runInBand src/validation/schemas.test.ts src/utils/passwordStrength.test.ts src/services/api/auth.test.ts src/features/auth/lifecycle.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit --pretty false`

Expected: exit 0 or no new error in callback, reset, validation, or password files if unrelated dirty baseline errors exist.

- [ ] **Step 10: Match the approved recovery expiry in Supabase**

In Supabase Dashboard -> Authentication -> Providers -> Email, set Email OTP expiration to exactly `3600` seconds.

Expected: recovery and confirmation links expire after 60 minutes, matching the approved account copy. Record this setting for staging and production; do not claim a 60-minute expiry in a project that uses a different value.

---

### Task 8: Complete Profile Setup as One Account Transition

**Files:**

- Modify: `src/features/profile/screens-v2/ProfileSetupScreen.tsx:1-179`

**Interfaces:**

- Consumes: `currentUser`, `AuthService.completeProfileSetup(userId, input)`, `replaceCurrentUser`, `CURRENCIES`, `useUIStore.setCurrency`, `useUIStore.setTheme`, and Expo Image Picker.
- Produces: optional avatar, display name, home currency, appearance preference, and atomic `activation_pending` transition.

- [ ] **Step 1: Replace profile setup with the approved account fields**

Replace `src/features/profile/screens-v2/ProfileSetupScreen.tsx` completely:

```tsx
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { CoralField } from "@/components/coral/CoralField";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useAuth } from "@/context/AppContext";
import { useAppToast } from "@/hooks/useAppToast";
import { AuthService } from "@/services/api/auth";
import { useUIStore, type ThemePreference } from "@/store/useUIStore";
import { CURRENCIES } from "@/types";

export default function ProfileSetupScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { currentUser, replaceCurrentUser } = useAuth();
  const preferredCurrency = useUIStore((state) => state.preferredCurrency);
  const currentTheme = useUIStore((state) => state.theme);
  const setCurrency = useUIStore((state) => state.setCurrency);
  const setTheme = useUIStore((state) => state.setTheme);
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentUser.defaultCurrency || preferredCurrency.code
  );
  const [theme, setSelectedTheme] = useState<ThemePreference>(currentTheme);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(currentUser.avatar);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const chooseAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show({
        label: "Photo access needed",
        description: "Allow photo access to choose a profile picture, or continue without one.",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const submit = async () => {
    const name = displayName.trim();
    if (name.length < 2) {
      toast.show({
        label: "Name required",
        description: "Enter at least two characters for your display name.",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await AuthService.completeProfileSetup(currentUser.id, {
        name,
        defaultCurrency: selectedCurrency,
        avatarUri: avatarChanged ? avatarUri : undefined,
      });
      const currency = CURRENCIES.find((item) => item.code === selectedCurrency);
      if (currency) setCurrency(currency);
      setTheme(theme);
      replaceCurrentUser(user);
      router.replace("/first-action");
    } catch (error) {
      toast.show({
        label: "Setup failed",
        description: error instanceof Error ? error.message : "Could not complete profile setup.",
        variant: "danger",
        placement: "top",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Profile setup" />
      <LargeTitle>Set up your profile.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          color: coral.muted,
          marginBottom: 24,
        }}
      >
        Choose how friends see you and how Splt presents shared money.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose a profile photo"
        onPress={() => void chooseAvatar()}
        style={{
          alignSelf: "center",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          minHeight: 96,
        }}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: coral.avatarSoft,
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 28,
                color: coral.avatarInk,
              }}
            >
              {initials}
            </Text>
          </View>
        )}
        <Text
          style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14, color: coral.accent }}
        >
          Add a profile photo
        </Text>
      </Pressable>
      <View style={{ gap: 20 }}>
        <CoralField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoComplete="name"
        />
        <View style={{ gap: 7 }}>
          <Text
            style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, color: coral.muted }}
          >
            Home currency
          </Text>
          <CurrencySelector
            value={selectedCurrency}
            onChange={(currency) => setSelectedCurrency(currency.code)}
          />
        </View>
        <View style={{ gap: 7 }}>
          <Text
            style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, color: coral.muted }}
          >
            Appearance
          </Text>
          <CoralSegment
            options={[
              { label: "Automatic", value: "system" },
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ]}
            selected={theme}
            onSelect={(value) => setSelectedTheme(value as ThemePreference)}
          />
        </View>
        <CoralButton label="Continue" onPress={() => void submit()} loading={isSubmitting} />
      </View>
    </CoralScreen>
  );
}
```

The user-row update is one SQL `UPDATE`: name, initials, currency, optional public avatar URL, and `setup_state = activation_pending` succeed or fail together. The storage upload is idempotent at `<user-id>/profile.<extension>`; retrying setup replaces the same object rather than accumulating files.

- [ ] **Step 2: Verify device-global onboarding persistence is absent from setup**

Run: `rg -n "AsyncStorage|@splt_onboarded" src/features/profile/screens-v2/ProfileSetupScreen.tsx src/context/AppContext.tsx`

Expected: no matches.

- [ ] **Step 3: Verify profile setup typechecks**

Run: `npx tsc --noEmit --pretty false`

Expected: exit 0 or no new errors in `ProfileSetupScreen.tsx`, `auth.ts`, `AppContext.tsx`, or database types if unrelated dirty baseline errors exist.

---

### Task 9: Add First Action and Retire the Duplicate Tutorial Route

**Files:**

- Create: `src/features/onboarding/screens-v2/FirstActionScreen.tsx`
- Create: `src/app/first-action.tsx`
- Modify: `src/app/onboarding.tsx:1-5`
- Modify: `src/app/_layout.tsx:1-170`
- Modify: `src/app/index.tsx:1-101`

**Interfaces:**

- Consumes: `AuthService.markActivationSeen(currentUser.id)`, `completeActivation`, and existing destinations `/group/new`, `/friend/new`, `/expense/new`, `/recurring/new`, and `/home`.
- Produces: selecting any action or Skip marks activation seen and hands one destination to the guard; legacy `/onboarding` no longer owns state.

- [ ] **Step 1: Create the optional first-action screen**

Create `src/features/onboarding/screens-v2/FirstActionScreen.tsx`:

```tsx
import type { ComponentType } from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { LucideProps } from "lucide-react-native";
import { CalendarDays, ReceiptText, UserPlus, UsersRound } from "lucide-react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { useAuth } from "@/context/AppContext";
import { useAppToast } from "@/hooks/useAppToast";
import { AuthService } from "@/services/api/auth";

const actions: Array<{
  title: string;
  detail: string;
  destination: "/group/new" | "/friend/new" | "/expense/new" | "/recurring/new";
  icon: ComponentType<LucideProps>;
  tone: "default" | "green" | "coral" | "amber";
}> = [
  {
    title: "Create a group",
    detail: "Start a trip, night out, or household",
    destination: "/group/new",
    icon: UsersRound,
    tone: "default",
  },
  {
    title: "Add people",
    detail: "Find friends already using Splt",
    destination: "/friend/new",
    icon: UserPlus,
    tone: "green",
  },
  {
    title: "Add your first expense",
    detail: "Choose a person or group in the flow",
    destination: "/expense/new",
    icon: ReceiptText,
    tone: "coral",
  },
  {
    title: "Schedule a recurring bill",
    detail: "Create it inside a household group",
    destination: "/recurring/new",
    icon: CalendarDays,
    tone: "amber",
  },
];

export default function FirstActionScreen() {
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { completeActivation, currentUser } = useAuth();
  const [submitting, setSubmitting] = useState<string | null>(null);

  const continueTo = async (destination: (typeof actions)[number]["destination"] | "/home") => {
    setSubmitting(destination);
    try {
      const user = await AuthService.markActivationSeen(currentUser.id);
      completeActivation(user, destination);
    } catch (error) {
      toast.show({
        label: "Could not continue",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "danger",
        placement: "top",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const tones = {
    default: coral.avatarInk,
    green: coral.positive,
    coral: coral.accent,
    amber: coral.warning,
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Make Splt yours" />
      <LargeTitle>What would help first?</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 17,
          lineHeight: 26,
          color: coral.muted,
          marginBottom: 24,
        }}
      >
        Choose one useful starting point. Everything else stays available from Home.
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 15,
            color: coral.foreground,
          }}
        >
          Start with an action
        </Text>
        <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, color: coral.muted }}>
          Optional
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              disabled={submitting !== null}
              onPress={() => void continueTo(action.destination)}
              style={({ pressed }) => ({
                minHeight: 72,
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: coral.border,
                backgroundColor: coral.surface,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                opacity: pressed || submitting === action.destination ? 0.65 : 1,
              })}
            >
              <Icon size={24} color={tones[action.tone]} strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 16,
                    color: coral.foreground,
                  }}
                >
                  {action.title}
                </Text>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 14,
                    lineHeight: 20,
                    color: coral.muted,
                  }}
                >
                  {action.detail}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ marginTop: 18 }}>
        <CoralButton
          label="Skip for now"
          variant="secondary"
          onPress={() => void continueTo("/home")}
          loading={submitting === "/home"}
          disabled={submitting !== null && submitting !== "/home"}
        />
      </View>
    </CoralScreen>
  );
}
```

Create `src/app/first-action.tsx`:

```ts
export { default } from "@/features/onboarding/screens-v2/FirstActionScreen";
```

`completeActivation` sets the completed user and destination in one React update. `AuthLifecycleGuard` retains that destination until Expo Router reports that it has left `first-action`, then clears it, so the normal ready redirect cannot race the selected action.

- [ ] **Step 2: Redirect the duplicate onboarding route only after guard tests pass**

Replace `src/app/onboarding.tsx` completely:

```tsx
import { Redirect } from "expo-router";

export default function LegacyOnboardingRedirect() {
  return <Redirect href="/first-action" />;
}
```

Do not delete legacy onboarding components in this phase; they are unrelated cleanup and no production route imports them after this change.

- [ ] **Step 3: Register lifecycle routes and remove duplicate root auth readiness**

In `src/app/_layout.tsx`:

- Remove the `supabase` import.
- Remove `useState` from the React import.
- Remove `authReady` state.
- Replace the font/auth readiness effect with:

```ts
useEffect(() => {
  if (!loaded) return;
  void SplashScreen.hideAsync();
}, [loaded]);
```

- Replace `if (!loaded || !authReady) return null;` with:

```ts
if (!loaded) return null;
```

- Add these Stack screens beside the existing lifecycle routes:

```tsx
<Stack.Screen name="auth/callback" options={{ animation: "fade" }} />
<Stack.Screen name="first-action" />
```

Keep `onboarding`, `profile-setup`, and `verify-email` registered. The onboarding file is now only a compatibility redirect.

- [ ] **Step 4: Remove the competing index redirect policy**

Replace `src/app/index.tsx` completely:

```tsx
export default function IndexScreen(): null {
  return null;
}
```

The guard classifies `index` and chooses exactly one destination after lifecycle hydration.

- [ ] **Step 5: Verify all device-global lifecycle state is gone**

Run: `rg -n "@splt_onboarded" src`

Expected: no matches.

Run: `rg -n "AsyncStorage" src/context src/features/auth src/features/profile/screens-v2/ProfileSetupScreen.tsx src/features/onboarding`

Expected: no lifecycle use. AsyncStorage remains only in Supabase session storage, Zustand persistence, and unrelated biometric/session infrastructure.

- [ ] **Step 6: Verify route and first-action tests**

Run: `npm test -- --runInBand src/features/auth/lifecycle.test.ts src/services/api/auth.test.ts src/services/api/mappers.test.ts src/validation/schemas.test.ts src/utils/passwordStrength.test.ts`

Expected: PASS for all focused suites.

---

### Task 10: Final Verification and Manual Lifecycle Matrix

**Files:**

- Inspect only: all files listed in Tasks 1 through 9.
- Do not modify unrelated files to make broad dirty-worktree checks green.

**Interfaces:**

- Consumes: the complete migration, service, context, guard, routes, screens, and test suites.
- Produces: evidence that Phase 1A works independently and a precise list of any environment-only verification still needed.

- [ ] **Step 1: Run the focused lifecycle test suite**

Run:

```bash
npm test -- --runInBand \
  src/features/auth/lifecycle.test.ts \
  src/services/api/auth.test.ts \
  src/services/api/mappers.test.ts \
  src/validation/schemas.test.ts \
  src/utils/passwordStrength.test.ts
```

Expected: 5 suites PASS; no snapshots are written.

- [ ] **Step 2: Run the project typecheck**

Run: `npm run typecheck`

Expected: `tsc --noEmit` exits 0. If it reports a pre-existing unrelated dirty-worktree error, capture the exact file and message, then run no suppressing edit; every lifecycle file must be absent from the error list.

- [ ] **Step 3: Run focused lint**

Run:

```bash
npx eslint \
  jest.config.js \
  src/context/AppContext.tsx \
  src/features/auth/lifecycle.ts \
  src/features/auth/lifecycle.test.ts \
  src/features/auth/components/AuthLifecycleGuard.tsx \
  src/features/auth/screens-v2/RegisterScreen.tsx \
  src/features/auth/screens-v2/LoginScreen.tsx \
  src/features/auth/screens-v2/WelcomeScreen.tsx \
  src/features/auth/screens-v2/VerifyEmailScreen.tsx \
  src/features/auth/screens-v2/ForgotPasswordScreen.tsx \
  src/features/auth/screens-v2/ResetPasswordScreen.tsx \
  src/features/profile/screens-v2/ProfileSetupScreen.tsx \
  src/features/profile/screens-v2/ChangePasswordScreen.tsx \
  src/features/profile/hooks/useUpdateProfile.ts \
  src/features/profile/components/ProfileHeader.tsx \
  src/features/expenses/components/ExpenseComments.tsx \
  src/features/onboarding/screens-v2/FirstActionScreen.tsx \
  src/services/api/auth.ts \
  src/services/api/auth.test.ts \
  src/services/api/mappers.ts \
  src/services/api/mappers.test.ts \
  src/validation/schemas.ts \
  src/validation/schemas.test.ts \
  src/utils/passwordStrength.ts \
  src/utils/passwordStrength.test.ts \
  src/app/auth/callback.tsx \
  'src/app/(auth)/reset-password.tsx' \
  src/app/first-action.tsx
```

Expected: exit 0 with no warnings or errors in Phase 1A files.

- [ ] **Step 4: Run focused formatting verification**

Run:

```bash
npx prettier --check \
  jest.config.js \
  src/context/AppContext.tsx \
  src/features/auth/lifecycle.ts \
  src/features/auth/lifecycle.test.ts \
  src/features/auth/components/AuthLifecycleGuard.tsx \
  src/features/auth/screens-v2/ResetPasswordScreen.tsx \
  src/features/profile/screens-v2/ProfileSetupScreen.tsx \
  src/features/profile/screens-v2/ChangePasswordScreen.tsx \
  src/features/profile/hooks/useUpdateProfile.ts \
  src/features/profile/components/ProfileHeader.tsx \
  src/features/expenses/components/ExpenseComments.tsx \
  src/features/onboarding/screens-v2/FirstActionScreen.tsx \
  src/services/api/auth.ts \
  src/services/api/auth.test.ts \
  src/services/api/mappers.test.ts \
  src/validation/schemas.ts \
  src/validation/schemas.test.ts \
  src/utils/passwordStrength.ts \
  src/utils/passwordStrength.test.ts \
  src/app/auth/callback.tsx \
  'src/app/(auth)/reset-password.tsx' \
  src/app/first-action.tsx \
  docs/superpowers/plans/2026-07-18-circle-dock-account-lifecycle.md
```

Expected: `All matched files use Prettier code style!`

- [ ] **Step 5: Inspect migration semantics without mutating a database**

Run:

```bash
git diff --check -- supabase/migrations/202607180002_account_lifecycle.sql && \
rg -n "update public.users|set setup_state = 'complete'|set default 'profile_pending'|users_setup_state_check|create_profile_for_auth_user|storage.buckets" supabase/migrations/202607180002_account_lifecycle.sql
```

Expected: exit 0; output shows existing-user backfill before the new default, all three check values, the replaced trigger, and avatar bucket creation.

Apply the migration only to a disposable or linked development Supabase project. Expected database observations after application:

```sql
select setup_state, count(*)
from public.users
group by setup_state
order by setup_state;
```

Expected: all pre-migration users are `complete`.

```sql
select column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
  and column_name = 'setup_state';
```

Expected: `column_default` contains `profile_pending` and `is_nullable` is `NO`.

- [ ] **Step 6: Walk the lifecycle matrix on one iOS and one Android development build**

| Case                                | Setup                                                                           | Expected route/state                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Cold signed out                     | Clear local Supabase session                                                    | Welcome; no feature query mounts with empty user ID                                                      |
| Email signup, confirmation required | Enable Confirm email                                                            | Register -> Verify email; correct six-digit signup OTP -> Profile setup                                  |
| Email signup, confirmation disabled | Disable Confirm email in development                                            | Register -> Profile setup without visiting Verify email                                                  |
| Verification link                   | Open link into `splt://auth/callback?flow=verification&code=...`                | Callback exchanges code -> Profile setup/first action according to row                                   |
| Unconfirmed login                   | Sign in before confirming                                                       | Verify email for entered account; no generic invalid-credentials message                                 |
| OAuth new user                      | Google, and Apple on iOS                                                        | Callback/session -> delayed profile hydrate -> Profile setup                                             |
| OAuth returning user                | Provider account with `setup_state=complete`                                    | Home                                                                                                     |
| Delayed public row                  | Temporarily disable trigger or remove the development profile row, then sign in | Three reads followed by idempotent user-row upsert; Profile setup, not Welcome                           |
| Profile setup                       | Choose optional photo, name, currency, appearance                               | One users update stores values and advances to `activation_pending`; first action appears                |
| Profile retry                       | Cause users update failure once                                                 | Inputs remain visible; retry succeeds; no setup advance on failed row update                             |
| First action: each row              | Repeat with fresh `activation_pending` test account                             | State becomes `complete`; selected existing destination opens                                            |
| First action: Skip                  | Set row to `activation_pending`                                                 | State becomes `complete`; Home opens                                                                     |
| Relaunch after setup                | Kill/reopen app                                                                 | Home; setup and activation do not repeat on another device                                               |
| Existing migrated account           | Pre-migration user                                                              | Home because migration backfilled `complete`                                                             |
| Legacy onboarding deep link         | Open `splt://onboarding`                                                        | Guard sends incomplete user to correct phase and ready user to Home                                      |
| Sign out                            | Sign out from ready app                                                         | Query cache clears; Welcome; next account cannot see prior cache                                         |
| Token refresh                       | Resume after token refresh or call refresh in development                       | Current route remains stable; profile refreshes without a Home/auth bounce                               |
| Recovery request                    | Submit known and unknown emails                                                 | Same inbox confirmation copy; no account enumeration                                                     |
| Recovery success                    | Open emailed deep link                                                          | Callback -> New password; valid matching password -> global sign-out -> sign-in success with email       |
| Recovery expired/error              | Open expired/reused link                                                        | Forgot password with recoverable error and request action                                                |
| Reset direct navigation             | Open reset route without recovery callback                                      | Forgot password; password update API is not called                                                       |
| Password parity                     | Try 7 chars, letters-only 8 chars, number/symbol 8 chars, mismatch              | Register/reset/change report the same rule; login still accepts legacy credentials for server validation |
| Auth callback cancellation          | Cancel provider browser                                                         | Remain on entry screen with non-destructive error; no lifecycle state changes                            |

- [ ] **Step 7: Inspect final scope and dirty-worktree boundary**

Run: `git status --short`

Expected: Phase 1A files are visible alongside the user's existing dirty work; no unrelated deletion or modification was introduced by this plan.

Run:

```bash
git diff -- \
  jest.config.js \
  supabase/migrations/202607180002_account_lifecycle.sql \
  src/context/AppContext.tsx \
  src/features/auth \
  src/features/profile/screens-v2/ProfileSetupScreen.tsx \
  src/features/profile/screens-v2/ChangePasswordScreen.tsx \
  src/features/profile/hooks/useUpdateProfile.ts \
  src/features/profile/components/ProfileHeader.tsx \
  src/features/expenses/components/ExpenseComments.tsx \
  src/features/onboarding/screens-v2/FirstActionScreen.tsx \
  src/services/api/auth.ts \
  src/services/api/mappers.ts \
  src/services/supabase/database.types.ts \
  src/validation \
  src/utils/passwordStrength.ts \
  src/utils/passwordStrength.test.ts \
  src/app/auth \
  'src/app/(auth)' \
  src/app/first-action.tsx \
  src/app/onboarding.tsx \
  src/app/index.tsx \
  src/app/_layout.tsx \
  src/providers/AppProvider.tsx \
  src/queries/keys.ts \
  src/types/index.ts
```

Expected: only account-lifecycle changes described by this plan. Do not stage or commit. If later asked to stage, use this exact path boundary and inspect `git diff --cached` before any commit request.

## Self-Review Record

- Spec coverage: signup with and without confirmation, signup OTP, verification link, OAuth, delayed public profile, server-scoped setup, profile fields, optional activation, ready routing, sign-out, token refresh, recovery callback/reset/success, password parity, query invalidation, legacy onboarding redirect, and migration/type updates each map to a task.
- Placeholder scan: every code-changing step contains a complete file or exact replacement block; no deferred implementation marker is used.
- Type consistency: `AccountSetupState`, `User.setupState`, `AuthPhase`, callback flow/result, context methods, service methods, route paths, and query keys retain the same names across producer and consumer tasks.
- Migration semantics: existing rows become `complete`; new rows default to `profile_pending`; profile submission moves to `activation_pending`; Skip/action moves to `complete`; all values are constrained and non-null.
- Route-loop check: callbacks are always allowed; loading/error do not redirect; recovery reset is allowed only in recovery; each phase permits exactly its own route; ready permits all non-lifecycle routes; index has no competing redirect.
- Scope check: no Circle Dock, Home/Circles redesign, expense/settlement implementation, recurring implementation, or broad component deletion is included. First-action destinations reuse existing routes without changing their behavior.
