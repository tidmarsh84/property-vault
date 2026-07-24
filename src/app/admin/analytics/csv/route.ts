// Pilot summary CSV export (admin only).

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { pilotSummary } from "@/lib/pilotSummary";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const s = await pilotSummary();
  const esc = (v: string | number | null) =>
    v === null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);

  const lines: string[] = [
    "metric,value",
    `properties issued,${s.propertiesIssued}`,
    `properties opened,${s.propertiesOpened}`,
    `open rate %,${esc(s.openRatePct)}`,
    `revisited within 7 days %,${esc(s.revisited7Pct)}`,
    `revisited within 30 days %,${esc(s.revisited30Pct)}`,
    `shared %,${esc(s.sharedPct)}`,
    `document views,${s.docViews}`,
    `document downloads,${s.docDownloads}`,
    `download-all used,${s.downloadAllCount}`,
    "",
    "document type,views",
    ...s.topDocTypes.map((t) => `${esc(t.docClass)},${t.views}`),
    "",
    "share link,scope,created,opens,revoked",
    ...s.shareLinks.map(
      (t) =>
        `${esc(t.label)},${t.scope},${t.createdAt.toISOString().slice(0, 10)},${t.opens},${t.revoked ? "yes" : "no"}`,
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="property-vault-pilot-summary.csv"`,
    },
  });
}
