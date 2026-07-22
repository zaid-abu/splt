import {
  buildProfileSeed,
  buildSignUpResult,
  exchangeAuthCallback,
  parseAuthCallbackUrl,
} from "./auth";

jest.mock("@/services/supabase/client", () => ({
  supabase: {},
}));

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
