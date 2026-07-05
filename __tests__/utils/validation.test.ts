/**
 * Tests for src/validation/schemas.ts (Zod schemas)
 *
 * Pure schema validation — no mocking required.
 */
import { loginSchema, registerSchema } from "@/validation/schemas";

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects email longer than 255 characters", () => {
    const longEmail = `${"a".repeat(250)}@example.com`;
    const result = loginSchema.safeParse({ email: longEmail, password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 72 characters", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(73),
    });
    expect(result.success).toBe(false);
  });

  it("trims and lowercases email", () => {
    const result = loginSchema.safeParse({ email: "  USER@EXAMPLE.COM  ", password: "password123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});

// ─── registerSchema ───────────────────────────────────────────────────────────

describe("registerSchema", () => {
  const validData = {
    name: "Alex Chen",
    email: "alex@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = registerSchema.safeParse({ ...validData, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...validData, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 characters", () => {
    const result = registerSchema.safeParse({ ...validData, name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects name with invalid characters (numbers, symbols)", () => {
    const result = registerSchema.safeParse({ ...validData, name: "Alex123" });
    expect(result.success).toBe(false);
  });

  it("accepts name with hyphens and apostrophes", () => {
    const result = registerSchema.safeParse({ ...validData, name: "Mary-Jane O'Brien" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email in registerSchema", () => {
    const result = registerSchema.safeParse({ ...validData, email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("trims name whitespace", () => {
    const result = registerSchema.safeParse({ ...validData, name: "  Alex Chen  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alex Chen");
    }
  });
});
