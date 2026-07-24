import { prisma } from "./db";
import {
  computeVerification,
  type VerificationResult,
} from "./verification";
import {
  documentVisibleToScope,
  eventVisibleToScope,
  scopeRules,
  type Scope,
} from "./scope";

// Assembles the scoped, serialisable view model the record page renders.

export interface DocView {
  id: string;
  title: string;
  meta: string; // "Sealed 2 Feb 2026 · 0.4 MB"
  mimeType: string;
  verify: {
    issuedBy: string;
    sealed: string;
    fingerprint: string;
    anchored: string;
  };
  expiry: string | null;
}

export interface StageView {
  id: string;
  name: string;
  detail: string | null;
  complete: boolean;
  documents: DocView[];
}

export interface EventView {
  id: string;
  title: string;
  when: string;
  summary: string | null;
  historical: boolean;
  ownerProvided: boolean;
  level: number;
  band: string; // high | mid | low
  chip: string; // "100% verified" | "62% verification level" | "Historical"
  professionals: { role: string; firm: string; verified: boolean }[];
  stages: StageView[];
  breakdown: { label: string; met: boolean; metLabel: string }[] | null;
  gapPrompt: string | null;
}

export interface RecordView {
  recordId: string;
  address: string;
  heroEyebrow: string;
  uprn: string | null;
  propertyType: string;
  tenure: string;
  scope: Scope;
  scopeLabel: string;
  canShare: boolean;
  level: number;
  bandLabel: string;
  verifiedEventsLine: string;
  created: string;
  updated: string;
  events: EventView[];
  propertyId: string;
}

const ukDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function mb(bytes: number): string {
  return `${Math.max(bytes / 1024 / 1024, 0.1).toFixed(1)} MB`;
}

function tenureLabel(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export async function loadRecordView(
  recordId: string,
  scope: Scope
): Promise<RecordView | null> {
  const property = await prisma.property.findUnique({
    where: { recordId },
    include: {
      assets: {
        include: {
          events: {
            where: { lifecycle: "issued" },
            include: {
              professionals: { orderBy: { position: "asc" } },
              stages: {
                orderBy: { position: "asc" },
                include: {
                  documents: {
                    include: {
                      versions: { where: { isCurrent: true }, take: 1 },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!property) return null;

  const events: EventView[] = [];
  let sealedDocs = 0;
  let levelNumer = 0;
  let levelDenom = 0;
  let verifiedCount = 0;
  let totalEvents = 0;

  const allEvents = property.assets
    .flatMap((asset) => asset.events.map((event) => ({ asset, event })))
    .sort((a, b) => b.event.sortDate.getTime() - a.event.sortDate.getTime());

  for (const { asset, event } of allEvents) {
    totalEvents += 1;
    if (!eventVisibleToScope(scope, asset.kind)) continue;

    const result: VerificationResult = computeVerification({
      origin: event.origin,
      historical: event.historical,
      professionals: event.professionals,
      stages: event.stages.map((s) => ({
        typeKey: s.typeKey,
        documents: s.documents.map((d) => ({
          issuerClass: d.issuerClass,
          docType: d.docType,
          requirementKey: d.requirementKey,
        })),
      })),
    });

    const stages: StageView[] = event.stages.map((s) => ({
      id: s.id,
      name: s.name,
      detail:
        [s.detail, s.occurredOn ? ukDate(s.occurredOn) : null]
          .filter(Boolean)
          .join(" · ") || null,
      complete: s.status === "complete",
      documents: s.documents
        .filter((d) => documentVisibleToScope(scope, d))
        .map((d) => {
          const v = d.versions[0];
          const docCount = v ? 1 : 0;
          sealedDocs += docCount;
          return {
            id: d.id,
            title: d.title,
            meta: v
              ? `Sealed ${ukDate(v.sealedAt)} · ${mb(v.sizeBytes)}`
              : "Awaiting upload",
            mimeType: v?.mimeType ?? "application/pdf",
            verify: {
              issuedBy:
                d.issuerClass === "owner_provided"
                  ? `${d.issuingOrganisation} (owner-provided)`
                  : `${d.issuingOrganisation} (identity checked)`,
              sealed: v ? `${ukDate(v.sealedAt)}` : "—",
              fingerprint: v
                ? `${v.sha256.slice(0, 12)}…${v.sha256.slice(-8)}`
                : "—",
              anchored: "Integrity anchoring: pilot mode",
            },
            expiry: d.expiryDate ? `Expires ${ukDate(d.expiryDate)}` : null,
          };
        }),
    }));

    const ownerProvided = event.origin === "owner_provided";
    if (!event.historical) {
      const docWeight = stages.reduce((n, s) => n + s.documents.length, 0) || 1;
      levelNumer += result.level * docWeight;
      levelDenom += docWeight;
      if (result.level >= 85) verifiedCount += 1;
    }

    events.push({
      id: event.id,
      title: event.title,
      when: event.periodLabel ?? (event.startedOn ? ukDate(event.startedOn) : ""),
      summary: event.summary,
      historical: event.historical,
      ownerProvided,
      level: result.level,
      band: event.historical ? "low" : result.band,
      chip: event.historical
        ? "Historical"
        : result.level === 100
          ? "100% verified"
          : `${result.level}% verification level`,
      professionals: event.professionals.map((p) => ({
        role: p.role,
        firm: p.firmName,
        verified: p.identityVerified,
      })),
      stages,
      breakdown:
        !event.historical && result.level < 100
          ? result.rows.map((r) => ({
              label: r.label,
              met: r.met,
              metLabel: r.met ? "✓ On record" : r.metLabel,
            }))
          : null,
      gapPrompt:
        ownerProvided && result.level < 100 && !event.historical
          ? "Know who carried out this work? Inviting them to verify raises this event's verification level."
          : null,
    });
  }

  const level = levelDenom > 0 ? Math.round(levelNumer / levelDenom) : 0;

  return {
    recordId: property.recordId,
    address: `${property.addressLine1}, ${property.city}`,
    heroEyebrow: `Permanent record · ${tenureLabel(property.tenure)} · ${property.city} ${property.postcode.split(" ")[0]}`,
    uprn: property.uprn,
    propertyType: property.propertyType,
    tenure: tenureLabel(property.tenure),
    scope,
    scopeLabel: scopeRules[scope].label,
    canShare: scopeRules[scope].canShare,
    level,
    bandLabel: level >= 85 ? "High" : level >= 50 ? "Partial" : "Low",
    verifiedEventsLine: `${verifiedCount} of ${totalEvents} · ${sealedDocs} sealed documents`,
    created: ukDate(property.createdAt),
    updated: ukDate(property.updatedAt),
    events,
    propertyId: property.id,
  };
}
