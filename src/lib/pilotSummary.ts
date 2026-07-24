// Pilot summary metrics — computed from stored analytics only, shared by the
// dashboard page and the CSV export so the two can never disagree.

import { prisma } from "./db";
import { docClassOf } from "./visibleTree";

export interface ShareLinkRow {
  label: string;
  scope: string;
  createdAt: Date;
  opens: number;
  revoked: boolean;
}

export interface PilotSummary {
  propertiesIssued: number;
  propertiesOpened: number;
  openRatePct: number | null;
  revisited7Pct: number | null;
  revisited30Pct: number | null;
  sharedPct: number | null;
  docViews: number;
  docDownloads: number;
  downloadAllCount: number;
  topDocTypes: { docClass: string; views: number }[];
  shareLinks: ShareLinkRow[];
}

export async function pilotSummary(): Promise<PilotSummary> {
  const issuedProps = await prisma.property.findMany({
    where: { tokens: { some: { scope: "owner", revokedAt: null } } },
    select: { id: true },
  });
  const issuedIds = issuedProps.map((p) => p.id);

  const opens = await prisma.analyticsEvent.findMany({
    where: { type: { in: ["record_opened", "share_opened"] } },
    select: { propertyId: true, type: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byProp = new Map<string, Date[]>();
  for (const o of opens) {
    if (!byProp.has(o.propertyId)) byProp.set(o.propertyId, []);
    byProp.get(o.propertyId)!.push(o.createdAt);
  }

  const openedIds = issuedIds.filter((pid) => byProp.has(pid));
  const dayMs = 24 * 60 * 60 * 1000;
  const revisitedWithin = (days: number) =>
    openedIds.filter((pid) => {
      const dates = byProp.get(pid)!;
      const first = dates[0];
      const firstDay = first.toISOString().slice(0, 10);
      return dates.some(
        (d) =>
          d.toISOString().slice(0, 10) !== firstDay &&
          d.getTime() - first.getTime() <= days * dayMs,
      );
    }).length;

  const sharedProps = new Set(
    (
      await prisma.analyticsEvent.findMany({
        where: { type: "share_created" },
        select: { propertyId: true },
      })
    ).map((e) => e.propertyId),
  );

  const pct = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 100));

  const docEvents = await prisma.analyticsEvent.findMany({
    where: { type: { in: ["doc_viewed", "doc_downloaded"] }, documentId: { not: null } },
    select: { type: true, documentId: true },
  });
  const docIds = [...new Set(docEvents.map((e) => e.documentId as string))];
  const docsMeta = await prisma.document.findMany({
    where: { id: { in: docIds } },
    select: { id: true, requirementId: true, mimeType: true, stage: { select: { stageType: true } } },
  });
  const classById = new Map(
    docsMeta.map((d) => [
      d.id,
      docClassOf({ id: d.id, requirementId: d.requirementId, mimeType: d.mimeType }, d.stage.stageType),
    ]),
  );
  const typeCounts = new Map<string, number>();
  for (const e of docEvents) {
    const cls = classById.get(e.documentId as string) ?? "certificate";
    typeCounts.set(cls, (typeCounts.get(cls) ?? 0) + 1);
  }

  const shareTokens = await prisma.accessToken.findMany({
    where: { scope: { not: "owner" } },
    include: { _count: { select: { analytics: { where: { type: "share_opened" } } } } },
    orderBy: { createdAt: "desc" },
  });

  const downloadAllCount = await prisma.analyticsEvent.count({ where: { type: "download_all" } });

  return {
    propertiesIssued: issuedIds.length,
    propertiesOpened: openedIds.length,
    openRatePct: pct(openedIds.length, issuedIds.length),
    revisited7Pct: pct(revisitedWithin(7), openedIds.length),
    revisited30Pct: pct(revisitedWithin(30), openedIds.length),
    sharedPct: pct(issuedIds.filter((pid) => sharedProps.has(pid)).length, issuedIds.length),
    docViews: docEvents.filter((e) => e.type === "doc_viewed").length,
    docDownloads: docEvents.filter((e) => e.type === "doc_downloaded").length,
    downloadAllCount,
    topDocTypes: [...typeCounts.entries()]
      .map(([docClass, views]) => ({ docClass, views }))
      .sort((a, b) => b.views - a.views),
    shareLinks: shareTokens.map((t) => ({
      label: t.label ?? `${t.scope} link`,
      scope: t.scope,
      createdAt: t.createdAt,
      opens: t._count.analytics,
      revoked: Boolean(t.revokedAt),
    })),
  };
}
