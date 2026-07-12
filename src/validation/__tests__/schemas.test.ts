import { loginSchema, registerSchema, forgotPasswordSchema } from "@/validation/schemas"

describe("loginSchema", () => {
  it("validates correct login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email")
    }
  })

  it("rejects short password (< 6 chars)", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "12345",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password")
    }
  })

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("trims and lowercases email", () => {
    const result = loginSchema.safeParse({
      email: "  Test@Example.COM  ",
      password: "password123",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("test@example.com")
    }
  })
})

describe("registerSchema", () => {
  it("validates correct registration data", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "different",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword")
    }
  })

  it("rejects short name (< 2 chars)", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name with numbers", () => {
    const result = registerSchema.safeParse({
      name: "John123",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name with special characters", () => {
    const result = registerSchema.safeParse({
      name: "John!@#",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("accepts name with hyphens and apostrophes", () => {
    const result = registerSchema.safeParse({
      name: "Mary-Jane O'Brien",
      email: "mary@example.com",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email in registration", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "bad-email",
      password: "password123",
      confirmPassword: "password123",
    })
    expect(result.success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("validates correct email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "test@example.com",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "not-an-email",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "",
    })
    expect(result.success).toBe(false)
  })
})
