export const PASSWORD_MIN_LENGTH = 8;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function passwordProblems(pw: string): string[] {
  const problems: string[] = [];
  if (pw.length < PASSWORD_MIN_LENGTH) {
    problems.push(
      `Le mot de passe doit comporter au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    );
  }
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
    problems.push(
      "Le mot de passe doit contenir au moins une lettre et un chiffre.",
    );
  }
  return problems;
}

export interface PasswordScore {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

/** Estimation grossière de la robustesse, pour le retour visuel. */
export function passwordStrength(pw: string): PasswordScore {
  let points = 0;
  if (pw.length >= PASSWORD_MIN_LENGTH) points++;
  if (pw.length >= 12) points++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++;
  if (/\d/.test(pw)) points++;
  if (/[^A-Za-z0-9]/.test(pw)) points++;

  const score = Math.max(0, Math.min(4, points - 1)) as 0 | 1 | 2 | 3 | 4;
  const label = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"][score];
  return { score, label };
}

export function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

export function isExpired(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "N";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}
