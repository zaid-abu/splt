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
