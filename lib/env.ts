/**
 * Environment access with explicit "configured" checks.
 *
 * The landing page and marketing routes must render on a clean checkout with
 * no `.env.local` present, so nothing here throws at import time. Callers that
 * genuinely need a service check the matching `is*Configured` flag first and
 * degrade honestly rather than crashing or faking a result.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Institutional email domains permitted to register, e.g. ".edu.in,.ac.in".
 * Empty means "no restriction", which is the right default for local dev.
 */
export const allowedEmailDomains = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? ".edu.in,.ac.in,.edu"
)
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/**
 * Origin used to build magic-link redirects.
 *
 * The trailing slash is stripped because callers append "/auth/callback", and
 * an origin pasted from a browser address bar usually carries one — producing
 * "https://host//auth/callback", which Supabase will not match against the
 * configured redirect allow-list.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");
