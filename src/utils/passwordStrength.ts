export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3;
  label: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const len = password.length;

  if (len < 6) {
    return { score: 0, label: "Too short" };
  }

  let categories = 0;
  if (/[a-z]/.test(password)) categories++;
  if (/[A-Z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^a-zA-Z0-9]/.test(password)) categories++;

  if (len < 8 && categories < 3) {
    return { score: 0, label: "Weak" };
  }

  if (categories <= 2) {
    return { score: 1, label: "Fair" };
  }

  if (categories === 3 || len < 12) {
    return { score: 2, label: "Good" };
  }

  return { score: 3, label: "Strong" };
}
