import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SIGN-IN BYPASS — one configured address signs in without email verification.
 *
 * Be clear about what this is: possession of an inbox is normally the proof of
 * identity in a passwordless system, and this removes that proof for the
 * address in AUTH_BYPASS_EMAIL. Anyone who can reach this endpoint and knows
 * that address becomes that user. It exists so a demonstration cannot be
 * derailed by mail delivery, which is a real risk given single-use magic links
 * are routinely consumed by mail scanners before the recipient clicks.
 *
 * Containment:
 *   - Inert unless AUTH_BYPASS_EMAIL is set; unset it and the route 404s.
 *   - Exactly one address works. It is never echoed back, so the endpoint
 *     cannot be used to discover which address is privileged.
 *   - The session issued is an ordinary Supabase session. RLS, role, and
 *     institution scoping all apply unchanged — this shortcuts authentication,
 *     not authorisation.
 *
 * REMOVE THIS ROUTE, or leave AUTH_BYPASS_EMAIL unset, in any deployment
 * holding real institutional data.
 */
export async function POST(request: Request) {
  const configured = process.env.AUTH_BYPASS_EMAIL?.trim().toLowerCase();

  // Absent config means the feature does not exist, not that it was refused.
  if (!configured) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  if (!isSupabaseConfigured) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  let email: string;
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  // Any other address falls through to the normal magic-link flow. The 403 is
  // deliberately indistinguishable from "wrong address" so this cannot be used
  // to enumerate the configured one.
  if (!email || email !== configured) {
    return Response.json({ error: "Not eligible." }, { status: 403 });
  }

  try {
    const admin = createAdminClient();

    // The account must exist before a link can be minted for it.
    let userExists = false;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userExists = (list?.users ?? []).some((u) => u.email?.toLowerCase() === configured);

    if (!userExists) {
      const { error: createError } = await admin.auth.admin.createUser({
        email: configured,
        email_confirm: true,
        user_metadata: { provisioned_by: "auth-bypass" },
      });
      if (createError) throw new Error(`Could not provision the account: ${createError.message}`);
    }

    // Mint a magic link server-side and consume it here. Nothing is sent, and
    // the resulting session is identical to one obtained by clicking a link.
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: configured,
    });

    const hashedToken = link?.properties?.hashed_token;
    if (linkError || !hashedToken) {
      throw new Error(linkError?.message ?? "Supabase returned no token to verify.");
    }

    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: hashedToken,
      type: "magiclink",
    });

    if (verifyError) throw new Error(verifyError.message);

    console.warn(
      `[auth] Sign-in bypass used for ${configured}. Unset AUTH_BYPASS_EMAIL to disable.`,
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Bypass sign-in failed." },
      { status: 500 },
    );
  }
}
