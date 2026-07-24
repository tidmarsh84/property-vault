// Serve a sealed file — scope-checked through the same visibleTree gate as the
// record page. Logs doc_viewed (inline) or doc_downloaded (?download=1), with
// token attribution.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveToken } from "@/lib/tokens";
import { loadPropertyTree } from "@/lib/recordData";
import { documentVisible } from "@/lib/visibleTree";
import { logAnalytics } from "@/lib/analytics";
import { storage } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recordId: string; docId: string }> },
) {
  const { recordId, docId } = await params;
  const k = req.nextUrl.searchParams.get("k");
  const token = await resolveToken(recordId, k);
  if (!token) return NextResponse.json({ error: "Invalid link" }, { status: 403 });

  const tree = await loadPropertyTree(recordId);
  if (!tree || !documentVisible(tree, token.scope, docId)) {
    return NextResponse.json({ error: "Not available in this view" }, { status: 404 });
  }

  const doc = await prisma.document.findUniqueOrThrow({ where: { id: docId } });
  const data = await storage().get(doc.storageKey);

  const download = req.nextUrl.searchParams.get("download") === "1";
  await logAnalytics({
    propertyId: token.propertyId,
    type: download ? "doc_downloaded" : "doc_viewed",
    accessTokenId: token.id,
    documentId: doc.id,
    headers: req.headers,
  });

  const filename = `${doc.title.replace(/[^A-Za-z0-9 _-]/g, "")}.pdf`;
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-PV-Fingerprint": doc.sha256,
    },
  });
}
