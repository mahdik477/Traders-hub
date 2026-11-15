// The password rules, shared by every place a password is chosen: the
// "Create a password" option on /sign-up, the /welcome/password screen and
// My Hub. Browser-safe, no dependencies.

/** Must match "minimum password length" in Supabase (SETUP-ACCOUNTS.md, Part 9). */
export const MIN_PASSWORD = 10;

/** A rough hint, not a rule: length plus a mix of character types. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pw.length < MIN_PASSWORD) return { score: 0, label: `At least ${MIN_PASSWORD} characters` };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length >= 16 || (pw.length >= 12 && kinds >= 3)) return { score: 3, label: "Strong" };
  if (kinds >= 2) return { score: 2, label: "Good — longer is even better" };
  return { score: 1, label: "OK — mix in numbers or symbols, or make it longer" };
}

/** The reason a password can't be used, in plain words, or null when it's fine. */
export function passwordProblem(pw: string, email: string | null | undefined): string | null {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  const emailName = (email ?? "").split("@")[0].toLowerCase();
  if (emailName.length >= 4 && pw.toLowerCase().includes(emailName)) return "Don't use your email name in your password.";
  return null;
}
