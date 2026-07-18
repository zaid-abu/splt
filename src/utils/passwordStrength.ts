export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3;
  label: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (password.length < 8) return { score: 0, label: "Too short" };
  if (!/[0-9]|[^A-Za-z0-9]/.test(password)) return { score: 0, label: "Weak" };

  let categories = 0;
  if (/[a-z]/.test(password)) categories++;
  if (/[A-Z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^A-Za-z0-9]/.test(password)) categories++;

  if (categories <= 1) return { score: 1, label: "Fair" };
  if (categories <= 2 || password.length < 12) return { score: 2, label: "Good" };
  return { score: 3, label: "Strong" };
}
