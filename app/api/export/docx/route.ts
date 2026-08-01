import { buildProposal, proposalFilename, type ProposalContext } from "@/lib/export/proposal";
import { renderDocx } from "@/lib/export/docx";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

/** Pure rendering, no network calls — this is generous already. */
export const maxDuration = 15;

/** Returns the Board of Studies proposal as an editable .docx. */
export async function POST(request: Request) {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Sign in to export a proposal." }, { status: 401 });
    }
  }

  let context: ProposalContext;

  try {
    const body = (await request.json()) as Partial<ProposalContext>;
    if (!body.structure || !body.gap || !body.patch) {
      return Response.json(
        { error: "structure, gap and patch are required." },
        { status: 400 },
      );
    }
    context = {
      structure: body.structure,
      gap: body.gap,
      patch: body.patch,
      institution: body.institution,
      // Stamped server-side so the document carries one authoritative date.
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return Response.json({ error: "Malformed request body." }, { status: 400 });
  }

  try {
    const buffer = await renderDocx(buildProposal(context));
    const filename = proposalFilename(context, "docx");

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "The proposal could not be rendered.",
      },
      { status: 500 },
    );
  }
}
