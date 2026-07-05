/**
 * Manual Jest mock for @/services/supabase/client.
 *
 * Placed in __mocks__ adjacent to services/supabase/client.ts via
 * the moduleNameMapper pointing here, OR used as an automatic
 * __mocks__ sibling.
 *
 * This provides a fully chainable Supabase mock where every builder
 * method returns `this` and terminal methods (single, maybeSingle,
 * returns, and the final direct-resolve methods) can be overridden
 * per test via mockResolvedValueOnce / mockReturnValueOnce.
 */

const chain: Record<string, jest.Mock> = {};

const chainMethods = [
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
  "ilike",
  "returns",
  "single",
  "maybeSingle",
];

chainMethods.forEach((m) => {
  chain[m] = jest.fn().mockReturnValue(chain);
});

// from() is special — it must also return the chain
const fromMock = jest.fn().mockReturnValue(chain);

export const supabase = {
  from: fromMock,
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  // Expose the chain so tests can override individual methods
  _chain: chain,
};
