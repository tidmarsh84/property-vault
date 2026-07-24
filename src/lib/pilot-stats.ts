import { prisma } from "./db";

// Pilot analytics aggregation. Small pilot scale (dozens of records), so we
// aggregate in-process rather than with heavy SQL.

export interface RecordStats {
  propertyId: string;
  recordId: string;
  address: string;
  issued: boolean;
  issuedAt: Date | null;
  opens: number; // record_opened + share_opened
  distinctDays: number;
  firstOpen: Date | null;
  lastOpen: Date | null;
  revisited7: boolean; // opened again ≥7 days after first open
  revisited30: boolean;
  docViews: number;
  docDownloads: number;
  downloadAllCount: number;
  sharesCreated: number;
  shareOpens: number;
  shareScopes: string[];
}

export interface PilotSummary {
  records: RecordStats[];
  issuedCount: number;
  openedCount: number;
  openRate: number; // % of issued records opened at least once
  revisited7Rate: number;
  revisited30Rate: number;
  sharedRate: number;
  topDocTypes: { docType: string; views: number }[];
  deviceSplit: { deviceType: string; n: number }[];
}

export async function getPilotSummary(organisationId: string): Promise<PilotSummary> {
  const properties = await prisma.property.findMany({
    where: { organisationId },
    include: { analyticsEvents: true },
    orderBy: { createdAt: "asc" },
  });

  const records: RecordStats[] = properties.map((p) => {
    const ev = p.analyticsEvents;
    const opens = ev.filter((e) => e.kind === "record_opened" || e.kind === "share_opened");
    const openTimes = opens.map((e) => e.createdAt.getTime()).sort((a, b) => a - b);
    const days = new Set(opens.map((e) => e.dayBucket));
    const first = openTimes.length ? new Date(openTimes[0]) : null;
    const last = openTimes.length ? new Date(openTimes[openTimes.length - 1]) : null;
    const span = first && last ? last.getTime() - first.getTime() : 0;
    return {
      propertyId: p.id,
      recordId: p.recordId,
      address: `${p.addressLine1}, ${p.city}`,
      issued: p.status === "issued",
      issuedAt: p.issuedAt,
      opens: opens.length,
      distinctDays: days.size,
      firstOpen: first,
      lastOpen: last,
      revisited7: days.size > 1 && span >= 7 * 24 * 3600 * 1000,
      revisited30: days.size > 1 && span >= 30 * 24 * 3600 * 1000,
      docViews: ev.filter((e) => e.kind === "doc_viewed").length,
      docDownloads: ev.filter((e) => e.kind === "doc_downloaded").length,
      downloadAllCount: ev.filter((e) => e.kind === "download_all").length,
      sharesCreated: ev.filter((e) => e.kind === "share_created").length,
      shareOpens: ev.filter((e) => e.kind === "share_opened").length,
      shareScopes: [
        ...new Set(
          ev
            .filter((e) => e.kind === "share_created" && e.shareScope)
            .map((e) => e.shareScope as string)
        ),
      ],
    };
  });

  const issued = records.filter((r) => r.issued);
  const opened = issued.filter((r) => r.opens > 0);

  // Most-viewed document types
  const viewEvents = properties
    .flatMap((p) => p.analyticsEvents)
    .filter((e) => e.kind === "doc_viewed" && e.documentId);
  const docIds = [...new Set(viewEvents.map((e) => e.documentId as string))];
  const docs = await prisma.document.findMany({
    where: { id: { in: docIds } },
    select: { id: true, docType: true },
  });
  const typeById = new Map(docs.map((d) => [d.id, d.docType]));
  const typeCounts = new Map<string, number>();
  for (const e of viewEvents) {
    const t = typeById.get(e.documentId as string) ?? "other";
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }

  const deviceCounts = new Map<string, number>();
  for (const p of properties)
    for (const e of p.analyticsEvents)
      if (e.kind === "record_opened" || e.kind === "share_opened")
        deviceCounts.set(e.deviceType, (deviceCounts.get(e.deviceType) ?? 0) + 1);

  const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

  return {
    records,
    issuedCount: issued.length,
    openedCount: opened.length,
    openRate: pct(opened.length, issued.length),
    revisited7Rate: pct(issued.filter((r) => r.revisited7).length, issued.length),
    revisited30Rate: pct(issued.filter((r) => r.revisited30).length, issued.length),
    sharedRate: pct(issued.filter((r) => r.sharesCreated > 0).length, issued.length),
    topDocTypes: [...typeCounts.entries()]
      .map(([docType, views]) => ({ docType, views }))
      .sort((a, b) => b.views - a.views),
    deviceSplit: [...deviceCounts.entries()]
      .map(([deviceType, n]) => ({ deviceType, n }))
      .sort((a, b) => b.n - a.n),
  };
}

export function summaryToCsv(s: PilotSummary): string {
  const esc = (v: unknown) => {
    const str = String(v ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const header = [
    "record_id","address","issued","issued_at","opens","distinct_days_opened",
    "first_open","last_open","revisited_after_7d","revisited_after_30d",
    "doc_views","doc_downloads","download_all_used","shares_created","share_link_opens","share_scopes",
  ];
  const rows = s.records.map((r) =>
    [
      r.recordId, r.address, r.issued ? "yes" : "no",
      r.issuedAt?.toISOString() ?? "", r.opens, r.distinctDays,
      r.firstOpen?.toISOString() ?? "", r.lastOpen?.toISOString() ?? "",
      r.revisited7 ? "yes" : "no", r.revisited30 ? "yes" : "no",
      r.docViews, r.docDownloads, r.downloadAllCount, r.sharesCreated, r.shareOpens,
      r.shareScopes.join("; "),
    ].map(esc).join(",")
  );
  return [header.join(","), ...rows].join("\n") + "\n";
}
