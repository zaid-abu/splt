/**
 * Reusable Supabase mock helpers.
 *
 * Usage in a test file:
 *   jest.mock("@/services/supabase/client");
 *   import { getMockSupabase } from "../setup/supabaseMock";
 *
 *   beforeEach(() => {
 *     const { from, auth } = getMockSupabase();
 *     from.select.mockResolvedValueOnce({ data: [...], error: null });
 *   });
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockChain {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  in: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  returns: jest.Mock;
  ilike: jest.Mock;
  range: jest.Mock;
}

export interface MockAuth {
  signUp: jest.Mock;
  signInWithPassword: jest.Mock;
  signOut: jest.Mock;
  getSession: jest.Mock;
  onAuthStateChange: jest.Mock;
}

export interface MockSupabase {
  chain: MockChain;
  auth: MockAuth;
  /** The full mock client object to assign to the module */
  client: { supabase: Record<string, unknown> };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a fresh set of chainable jest mocks that mirror the Supabase JS client
 * query builder pattern. Each method returns `this` by default so chains resolve
 * correctly. Terminal methods (`single`, `maybeSingle`) need per-test resolution.
 */
export function createSupabaseMock(): MockSupabase {
  const chain: MockChain = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    in: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    returns: jest.fn(),
    ilike: jest.fn(),
    range: jest.fn(),
  };

  const auth: MockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  };

  // Wire every chainable method to return the chain itself so
  // `.from("x").select("*").eq("id", "1").order(...)` all work.
  const chainable = chain as unknown as Record<string, jest.Mock>;
  const chainMethods: Array<keyof MockChain> = [
    "from",
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "in",
    "or",
    "order",
    "limit",
    "returns",
    "ilike",
    "range",
  ];
  chainMethods.forEach((method) => {
    chainable[method].mockReturnValue(chain);
  });

  const client = {
    supabase: {
      ...chain,
      auth,
    },
  };

  return { chain, auth, client };
}

/**
 * Helper: get the mock supabase object from the mocked module.
 * Call this AFTER `jest.mock("@/services/supabase/client")`.
 */
export function getMockSupabaseModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@/services/supabase/client") as {
    supabase: Record<string, jest.Mock>;
  };
  return mod.supabase;
}
