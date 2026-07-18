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
