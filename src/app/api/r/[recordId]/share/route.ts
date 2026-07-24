import { NextRequest, NextResponse } from "next/server";
import { createAccessToken, resolveToken } from "@/lib/tokens";
import { contextFromHeaders, logAnalyticsEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const SHARE_SCOPES = new Set(["solicitor", "agent_buyer", "insurer_surveyor"]);
const SHARE_EXPIRY_DAYS = 90;

// Owner-token only: creates a scoped, 90-day share token. The raw token is
// returned exactly once and stored hashed.

export async function POST(
  req: NextRequest,
  { params }: { params: { recordId: string } }
) {
  const body = (await req.json().catch(() => ({}))) as { scope?: string; k?: string };
  const token = await resolveToken(params.recordId, body.k ?? null);
  if (!token || token.scope !== "owner") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!body.scope || !SHARE_SCOPES.has(body.scope)) {
    return new NextResponse("Invalid scope", { status: 400 });
  }

  const { raw } = await createAccessToken({
    propertyId: token.propertyId,
    scope: body.scope as "solicitor" | "agent_buyer" | "insurer_surveyor",
    createdVia: "share_modal",
    expiresInDays: SHARE_EXPIRY_DAYS,
    label: `Shared (${body.scope})`,
    parentTokenId: token.id,
  });

  await logAnalyticsEvent({
    propertyId: token.propertyId,
    tokenId: token.id,
    kind: "share_created",
    shareScope: body.scope,
    context: contextFromHeaders(req.headers),
  });

  const base = process.env.APP_BASE_URL ?? req.nextUrl.origin;
  return NextResponse.json({
    url: `${base}/r/${params.recordId}?k=${encodeURIComponent(raw)}`,
    expiresInDays: SHARE_EXPIRY_DAYS,
  });
}
