import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveToken } from "@/lib/tokens";
import { documentVisibleToScope, eventVisibleToScope } from "@/lib/scope";
import type { Scope } from "@/lib/scope";
import { contextFromHeaders, logAnalyticsEvent } from "@/lib/analytics";
import { getStorageProvider } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Serves a sealed document. Scope is enforced HERE, at the byte-serving
// layer — a link whose scope excludes a document gets 404, even with a
// direct URL. PDFs render inline (new tab); images likewise; ?download=1
// forces attachment and is logged as a download.

export async function GET(
  req: NextRequest,
  { params }: { params: { recordId: string; documentId: string } }
) {
  const k = req.nextUrl.searchParams.get("k");
  const token = await resolveToken(params.recordId, k);
  if (!token) return new NextResponse("Not found", { status: 404 });

  const doc = await prisma.document.findUnique({
    where: { id: params.documentId },
    include: {
      versions: { where: { isCurrent: true }, take: 1 },
      stage: {
        include: {
          event: { include: { asset: true } },
        },
      },
    },
  });

  // The document must belong to this property (paths root at the property).
  if (!doc || doc.stage.event.asset.propertyId !== token.propertyId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const scope = token.scope as Scope;
  if (
    !eventVisibleToScope(scope, doc.stage.event.asset.kind) ||
    !documentVisibleToScope(scope, doc)
  ) {
    // Outside this link's scope: indistinguishable from non-existence.
    return new NextResponse("Not found", { status: 404 });
  }

  const version = doc.versions[0];
  if (!version) return new NextResponse("Not found", { status: 404 });

  const bytes = await getStorageProvider().get(version.storageKey);
  const download = req.nextUrl.searchParams.get("download") === "1";

  await logAnalyticsEvent({
    propertyId: token.propertyId,
    tokenId: token.id,
    kind: download ? "doc_downloaded" : "doc_viewed",
    documentId: doc.id,
    context: contextFromHeaders(req.headers),
  });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": version.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${version.fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
