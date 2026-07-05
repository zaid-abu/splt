/**
 * Tests for src/services/api/auth.ts (AuthService)
 *
 * Mocks @/services/supabase/client so no network calls are made.
 */

// ─── Mocks (must be before imports) ──────────────────────────────────────────

jest.mock("@/services/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  },
}));

jest.mock("react-native-url-polyfill/auto", () => ({}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { supabase } from "@/services/supabase/client";
import { AuthService } from "@/services/api/auth";
import { DB_USER_ROW } from "../setup/fixtures";

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockFrom = supabase.from as jest.Mock;

// Helper: build a chainable query stub
function buildQueryChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

// ─── signUp ───────────────────────────────────────────────────────────────────

describe("AuthService.signUp", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls supabase.auth.signUp with correct parameters", async () => {
    const authData = { user: { id: "user-1" }, session: null };
    mockAuth.signUp.mockResolvedValue({ data: authData, error: null } as any);

    const result = await AuthService.signUp({
      email: "alex@example.com",
      password: "password123",
      name: "Alex Chen",
      defaultCurrency: "USD",
    });

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: "alex@example.com",
      password: "password123",
      options: {
        data: { name: "Alex Chen", default_currency: "USD" },
      },
    });
    expect(result).toEqual(authData);
  });

  it("defaults password to empty string when not provided", async () => {
    mockAuth.signUp.mockResolvedValue({ data: {}, error: null } as any);
    await AuthService.signUp({ email: "a@b.com", name: "Alice" });
    expect(mockAuth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ password: "" })
    );
  });

  it("defaults defaultCurrency to USD", async () => {
    mockAuth.signUp.mockResolvedValue({ data: {}, error: null } as any);
    await AuthService.signUp({ email: "a@b.com", name: "Alice" });
    expect(mockAuth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { data: { name: "Alice", default_currency: "USD" } },
      })
    );
  });

  it("throws when supabase returns an error", async () => {
    const error = new Error("Email already taken");
    mockAuth.signUp.mockResolvedValue({ data: null, error } as any);
    await expect(
      AuthService.signUp({ email: "a@b.com", name: "Alice", password: "123456" })
    ).rejects.toThrow("Email already taken");
  });
});

// ─── signIn ───────────────────────────────────────────────────────────────────

describe("AuthService.signIn", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls signInWithPassword and returns authData", async () => {
    const authData = { user: { id: "user-1" }, session: { access_token: "tok" } };
    mockAuth.signInWithPassword.mockResolvedValue({ data: authData, error: null } as any);

    const result = await AuthService.signIn({
      email: "alex@example.com",
      password: "password123",
    });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "alex@example.com",
      password: "password123",
    });
    expect(result).toEqual(authData);
  });

  it("defaults password to empty string", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null } as any);
    await AuthService.signIn({ email: "a@b.com" });
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ password: "" })
    );
  });

  it("throws on wrong credentials", async () => {
    const error = new Error("Invalid login credentials");
    mockAuth.signInWithPassword.mockResolvedValue({ data: null, error } as any);
    await expect(
      AuthService.signIn({ email: "a@b.com", password: "wrong" })
    ).rejects.toThrow("Invalid login credentials");
  });
});

// ─── signOut ──────────────────────────────────────────────────────────────────

describe("AuthService.signOut", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls supabase.auth.signOut successfully", async () => {
    mockAuth.signOut.mockResolvedValue({ error: null } as any);
    await expect(AuthService.signOut()).resolves.not.toThrow();
    expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  });

  it("throws when signOut returns an error", async () => {
    const error = new Error("Session expired");
    mockAuth.signOut.mockResolvedValue({ error } as any);
    await expect(AuthService.signOut()).rejects.toThrow("Session expired");
  });
});

// ─── getSession ───────────────────────────────────────────────────────────────

describe("AuthService.getSession", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the session object", async () => {
    const session = { access_token: "tok", user: { id: "user-1" } };
    mockAuth.getSession.mockResolvedValue({ data: { session }, error: null } as any);
    const result = await AuthService.getSession();
    expect(result).toEqual(session);
  });

  it("returns null when no active session", async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null } as any);
    const result = await AuthService.getSession();
    expect(result).toBeNull();
  });

  it("throws on error", async () => {
    const error = new Error("Network error");
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error } as any);
    await expect(AuthService.getSession()).rejects.toThrow("Network error");
  });
});

// ─── getCurrentUser ───────────────────────────────────────────────────────────

describe("AuthService.getCurrentUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when there is no active session", async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null } as any);
    const result = await AuthService.getCurrentUser();
    expect(result).toBeNull();
  });

  it("returns null on session error", async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error("Session error"),
    } as any);
    const result = await AuthService.getCurrentUser();
    expect(result).toBeNull();
  });

  it("fetches user profile and maps to User when session exists", async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    } as any);
    buildQueryChain({ data: DB_USER_ROW, error: null });

    const result = await AuthService.getCurrentUser();
    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-1");
    expect(result?.name).toBe("Alex Chen");
  });

  it("returns null when user DB row is not found", async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    } as any);
    buildQueryChain({ data: null, error: new Error("Not found") });

    const result = await AuthService.getCurrentUser();
    expect(result).toBeNull();
  });
});
