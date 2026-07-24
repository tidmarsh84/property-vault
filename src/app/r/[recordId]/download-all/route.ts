import { NextRequest, NextResponse } from "next/server";
import { zipSync } from "fflate";
import { prisma } from "@/lib/db";
import { resolveToken } from "@/lib/tokens";
import { documentVisibleToScope, eventVisibleToScope } from "@/lib/scope";
import type { Scope } from "@/lib/scope";
import { contextFromHeaders, logAnalyticsEvent } from "@/lib/analytics";
import { getStorageProvider } from "@/lib/storage";

export const dynamic = "force-dynamic";

// "Download all": a ZIP of the record's documents — filtered to what this
// link's scope may see, so a scoped share can never bulk-export beyond its
// permissions.

export async function GET(
  req: NextRequest,
  { params }: { params: { recordId: string } }
) {
  const token = await resolveToken(params.recordId, req.nextUrl.searchParams.get("k"));
  if (!token) return new NextResponse("Not found", { status: 404 });
  const scope = token.scope as Scope;

  const property = await prisma.property.findUniqueOrThrow({
    where: { id: token.propertyId },
    include: {
      assets: {
        include: {
          events: {
            where: { lifecycle: "issued" },
            include: {
              stages: {
                include: {
                  documents: {
                    include: { versions: { where: { isCurrent: true }, take: 1 } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const storage = getStorageProvider();
  const entries: Record<string, Uint8Array> = {};
  for (const asset of property.assets) {
    for (const event of asset.events) {
      if (!eventVisibleToScope(scope, asset.kind)) continue;
      for (const stage of event.stages) {
        for (const doc of stage.documents) {
          if (!documentVisibleToScope(scope, doc)) continue;
          const v = doc.versions[0];
          if (!v) continue;
          const folder = event.title.replace(/[^a-z0-9 &-]/gi, "").trim();
          let name = `${folder}/${v.fileName}`;
          while (entries[name]) name = `${folder}/_${v.fileName}`;
          entries[name] = new Uint8Array(await storage.get(v.storageKey));
        }
      }
    }
  }
  const zipped = zipSync(entries, { level: 6 });

  await logAnalyticsEvent({
    propertyId: token.propertyId,
    tokenId: token.id,
    kind: "download_all",
    context: contextFromHeaders(req.headers),
  });

  return new NextResponse(new Uint8Array(zipped), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${params.recordId}-documents.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
