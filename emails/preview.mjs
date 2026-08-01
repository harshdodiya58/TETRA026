/**
 * Renders the email templates with sample values so they can be opened in a
 * browser. Supabase substitutes these variables server-side; this only stands
 * in for them locally.
 *
 *   node emails/preview.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "preview");

const SAMPLE = {
  ConfirmationURL: "https://curripulse.vercel.app/auth/callback?token=sample",
  Token: "418209",
  Email: "a.sharma@university.edu.in",
  NewEmail: "anita.sharma@university.edu.in",
  SiteURL: "https://curripulse.vercel.app",
};

mkdirSync(outDir, { recursive: true });

const templates = readdirSync(here).filter((f) => f.endsWith(".html"));

for (const file of templates) {
  const source = readFileSync(join(here, file), "utf8");

  // Matches Supabase's Go-template syntax, tolerating varied inner spacing.
  const rendered = source.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (match, name) => {
    if (name in SAMPLE) return SAMPLE[name];
    console.warn(`  ! ${file}: no sample value for {{ .${name} }}`);
    return match;
  });

  const unresolved = [...rendered.matchAll(/\{\{[^}]*\}\}/g)].length;
  writeFileSync(join(outDir, file), rendered);
  console.log(`  ${file}${unresolved > 0 ? `  (${unresolved} unresolved)` : ""}`);
}

console.log(`\nRendered ${templates.length} templates into emails/preview/`);
