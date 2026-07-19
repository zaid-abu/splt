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
    [["invite", "tok_abc"], "readyApp"],
    [["invite", "some-other-token"], "readyApp"],
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
