// "Download all" — a scope-filtered ZIP of the record's sealed documents,
// built from the same visibleTree the page renders from. Logs download_all.

import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { resolveToken } from "@/lib/tokens";
import { loadPropertyTree } from "@/lib/recordData";
import { visibleTree } from "@/lib/visibleTree";
import { logAnalytics } from "@/lib/analytics";
import { storage } from "@/lib/storage";
import { ukDate } from "@/lib/format";

function safeName(s: string): string {
  return s.replace(/[^A-Za-z0-9 _().-]/g, "").trim() || "document";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const { recordId } = await params;
  const k = req.nextUrl.searchParams.get("k");
  const token = await resolveToken(recordId, k);
  if (!token) return NextResponse.json({ error: "Invalid link" }, { status: 403 });

  const tree = await loadPropertyTree(recordId);
  if (!tree) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scoped = visibleTree(tree, token.scope);
  const zip = new JSZip();
  const manifest: string[] = [
    `Property Vault — record ${tree.recordId}`,
    `${tree.addressLine} ${tree.postcode}`,
    `Generated ${ukDate(new Date())} — scope: ${token.scope}`,
    "",
    "Every file below is sealed; the SHA-256 fingerprint at issue is listed alongside.",
    "Verification refers to the record, never the quality of the work.",
    "",
  ];

  for (const event of scoped.events) {
    for (const stage of event.stages) {
      for (const doc of stage.documents) {
        const data = await storage().get(doc.storageKey as string);
        const folder = safeName(event.title as string);
        const name = `${folder}/${safeName(doc.title as string)} (v${doc.version}).pdf`;
        zip.file(name, data);
        manifest.push(`${name}\n  sha256 ${doc.sha256}`);
      }
    }
  }
  zip.file("MANIFEST.txt", manifest.join("\n"));

  const bytes = await zip.generateAsync({ type: "nodebuffer" });
  await logAnalytics({
    propertyId: token.propertyId,
    type: "download_all",
    accessTokenId: token.id,
    headers: req.headers,
  });

  return new NextResponse(new Uint8Array(bytes) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${tree.recordId}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
