// Loads a property tree for the record surfaces, applies visibleTree for the
// presented scope, and derives the record-level figures.

import { prisma } from "./db";
import { visibleTree } from "./visibleTree";
import { computeRecordLevel, eventHasRequirements } from "./verification";
import type { TokenScope } from "./types";

export type PropertyTree = NonNullable<Awaited<ReturnType<typeof loadPropertyTree>>>;
export type EventTree = PropertyTree["events"][number];
export type StageTree = EventTree["stages"][number];
export type DocTree = StageTree["documents"][number];

export async function loadPropertyTree(recordId: string) {
  const property = await prisma.property.findUnique({
    where: { recordId },
    include: {
      assets: true,
    },
  });
  if (!property) return null;

  const events = await prisma.event.findMany({
    where: { asset: { propertyId: property.id } },
    include: {
      asset: { select: { id: true, type: true, name: true } },
      professionals: true,
      stages: {
        orderBy: { sortOrder: "asc" },
        include: {
          documents: { include: { receipt: true }, orderBy: [{ version: "asc" }] },
          attestations: true,
        },
      },
    },
    orderBy: [{ endDate: "desc" }, { startDate: "desc" }],
  });

  return { ...property, events };
}

export function scopedRecord(tree: PropertyTree, scope: TokenScope) {
  const scoped = visibleTree(tree, scope);
  const eligible = scoped.events.map((e) => ({
    verificationLevel: e.verificationLevel,
    documentCount: e.stages.reduce(
      (n, s) => n + s.documents.filter((d) => !isSuperseded(d.id, e)).length,
      0,
    ),
    hasRequirements: eventHasRequirements({
      ownerProvided: e.ownerProvided,
      stages: e.stages.map((s) => ({ stageType: s.stageType, documents: [], attestations: [] })),
    }),
  }));
  const recordLevel = computeRecordLevel(eligible);
  const documentCount = eligible.reduce((n, e) => n + e.documentCount, 0);
  const verifiedEvents = scoped.events.filter((e) => e.verificationLevel === 100).length;
  return { scoped, recordLevel, documentCount, verifiedEvents };
}

function isSuperseded(docId: string, event: { stages: { documents: { supersedesId: string | null }[] }[] }): boolean {
  return event.stages.some((s) => s.documents.some((d) => d.supersedesId === docId));
}
