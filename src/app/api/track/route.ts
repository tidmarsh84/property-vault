// First-party analytics beacon. Logs record_opened for owner links and
// share_opened for scoped share links — always attributed to the specific
// access token that produced the open.

import { NextRequest, NextResponse } from "next/server";
import { resolveToken } from "@/lib/tokens";
import { logAnalytics } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  let body: { recordId?: string; k?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.recordId || !body.k || body.type !== "record_opened") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const token = await resolveToken(body.recordId, body.k);
  if (!token) return NextResponse.json({ ok: false }, { status: 403 });

  await logAnalytics({
    propertyId: token.propertyId,
    type: token.scope === "owner" ? "record_opened" : "share_opened",
    accessTokenId: token.id,
    headers: req.headers,
  });
  return NextResponse.json({ ok: true });
}
