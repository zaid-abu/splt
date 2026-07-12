import { evaluatePasswordStrength } from "@/utils/passwordStrength"

describe("evaluatePasswordStrength", () => {
  it("returns score 0 for very short passwords (< 6 chars)", () => {
    const result = evaluatePasswordStrength("Ab1!")
    expect(result.score).toBe(0)
    expect(result.label).toBe("Too short")
  })

  it("returns score 0 for short passwords (< 6 chars)", () => {
    const result = evaluatePasswordStrength("a")
    expect(result.score).toBe(0)
  })

  it("returns higher score for mixed character types", () => {
    const result = evaluatePasswordStrength("Abc123")
    expect(result.score).toBeGreaterThan(0)
  })

  it("returns score 0 for weak 6-char passwords with few categories", () => {
    const result = evaluatePasswordStrength("abcdef")
    expect(result.score).toBe(0)
    expect(result.label).toBe("Weak")
  })

  it("returns score 1 for fair passwords (2 categories, length >= 8)", () => {
    const result = evaluatePasswordStrength("abcdefgh")
    expect(result.score).toBe(1)
    expect(result.label).toBe("Fair")
  })

  it("returns score 2 for good passwords (3 categories)", () => {
    const result = evaluatePasswordStrength("abcdef1A")
    expect(result.score).toBe(2)
    expect(result.label).toBe("Good")
  })

  it("returns score 3 for strong passwords (all 4 categories, length >= 12)", () => {
    const result = evaluatePasswordStrength("Abcd1234!@#$")
    expect(result.score).toBe(3)
    expect(result.label).toBe("Strong")
  })

  it("returns score 3 for strong password with all categories and long length", () => {
    const result = evaluatePasswordStrength("P@ssw0rd!2025Long")
    expect(result.score).toBe(3)
  })

  it("returns score 2 for 4-category password shorter than 12 chars", () => {
    const result = evaluatePasswordStrength("Ab1!defg")
    expect(result.score).toBe(2)
  })

  it("returns score 2 for 3-category password with length >= 12", () => {
    const result = evaluatePasswordStrength("abcdefghijA1")
    expect(result.score).toBe(2)
  })
})
