export type PasswordErrorKey =
  | "passwordTooShort"
  | "passwordNoUppercase"
  | "passwordNoNumber"
  | "passwordNoSpecial";

export function validatePasswordStrength(password: string): PasswordErrorKey | null {
  if (password.length < 8) return "passwordTooShort";
  if (!/[A-Z]/.test(password)) return "passwordNoUppercase";
  if (!/[0-9]/.test(password)) return "passwordNoNumber";
  if (!/[^a-zA-Z0-9]/.test(password)) return "passwordNoSpecial";
  return null;
}
