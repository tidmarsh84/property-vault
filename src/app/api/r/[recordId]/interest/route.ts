import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveToken } from "@/lib/tokens";
import { contextFromHeaders, logAnalyticsEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

// "Invite installer" — pilot captures interest only; no real invitation flow.

export async function POST(
  req: NextRequest,
  { params }: { params: { recordId: string } }
) {
  const body = (await req.json().catch(() => ({}))) as { eventId?: string; k?: string };
  const token = await resolveToken(params.recordId, body.k ?? null);
  if (!token) return new NextResponse("Forbidden", { status: 403 });

  await prisma.interestCapture.create({
    data: {
      propertyId: token.propertyId,
      eventId: body.eventId ?? null,
      note: "invite_installer_clicked",
    },
  });
  await logAnalyticsEvent({
    propertyId: token.propertyId,
    tokenId: token.id,
    kind: "invite_interest",
    context: contextFromHeaders(req.headers),
  });

  return NextResponse.json({ ok: true });
}
