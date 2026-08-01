import { allowedEmailDomains } from "@/lib/env";

/** Roles in ascending order of authority. */
export const ROLES = ["faculty", "hod", "dean", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  faculty: "Course Faculty",
  hod: "Head of Department",
  dean: "Dean of Academics",
  admin: "Institution Admin",
};

/** Roles permitted to trigger audits and sign off BoS proposals. */
export const APPROVER_ROLES: readonly Role[] = ["dean", "admin"];

export function canApproveProposals(role: Role): boolean {
  return APPROVER_ROLES.includes(role);
}

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

/**
 * Institutional domain whitelist. An empty allowlist permits everything, which
 * keeps local development usable; production sets NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS.
 *
 * Matching is suffix-based so ".ac.in" admits "cse.vtu.ac.in", but the suffix
 * must fall on a label boundary — "notavtu.ac.in.example.com" must not pass.
 */
export function isInstitutionalEmail(email: string): boolean {
  if (allowedEmailDomains.length === 0) return true;

  const domain = emailDomain(email);
  if (!domain) return false;

  return allowedEmailDomains.some((suffix) => {
    const normalised = suffix.startsWith(".") ? suffix : `.${suffix}`;
    return domain === normalised.slice(1) || domain.endsWith(normalised);
  });
}

export function institutionalEmailError(email: string): string | null {
  if (!email.includes("@")) return "Enter a valid email address.";
  if (isInstitutionalEmail(email)) return null;
  return `CurriPulse is limited to institutional accounts (${allowedEmailDomains.join(", ")}).`;
}
