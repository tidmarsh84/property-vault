// Document lifecycle: sealed at upload, immutable from that moment.
// Corrections are new versions via supersedesId; prior versions stay visible.

import { createHash } from "crypto";
import { prisma } from "./db";
import { integrityProvider } from "./integrity";
import { storage } from "./storage";
import { recomputeEventLevel } from "./recompute";

export function sha256Of(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export interface UploadMeta {
  stageId: string;
  title: string;
  issuingOrg: string;
  issueDate: Date;
  expiryDate?: Date | null;
  requirementId?: string | null;
  issuerVerified?: boolean;
  ownerProvided?: boolean;
  mimeType: string;
  /** When set, this upload is a correction superseding an existing document. */
  supersedesId?: string | null;
}

export async function sealDocument(data: Buffer, meta: UploadMeta) {
  const hash = sha256Of(data);
  const version = meta.supersedesId
    ? (await prisma.document.findUniqueOrThrow({ where: { id: meta.supersedesId } })).version + 1
    : 1;
  const storageKey = `documents/${meta.stageId}/${hash}`;
  await storage().put(storageKey, data);

  const receipt = await integrityProvider().anchor(hash);
  const doc = await prisma.document.create({
    data: {
      stageId: meta.stageId,
      title: meta.title,
      issuingOrg: meta.issuingOrg,
      issueDate: meta.issueDate,
      expiryDate: meta.expiryDate ?? null,
      sha256: hash,
      version,
      supersedesId: meta.supersedesId ?? null,
      storageKey,
      mimeType: meta.mimeType,
      sizeBytes: data.length,
      requirementId: meta.requirementId ?? null,
      issuerVerified: meta.issuerVerified ?? false,
      ownerProvided: meta.ownerProvided ?? false,
      receipt: {
        create: {
          hash: receipt.hash,
          signature: receipt.signature,
          provider: receipt.provider,
          anchoredAt: receipt.anchoredAt,
        },
      },
    },
  });

  const stage = await prisma.stage.findUniqueOrThrow({ where: { id: meta.stageId } });
  await recomputeEventLevel(stage.eventId);
  return doc;
}

/** Fields that may never change once a document is sealed. */
const IMMUTABLE_FIELDS = ["sha256", "storageKey", "sizeBytes", "version", "stageId"] as const;

/**
 * The only permitted update path for sealed documents: display metadata only.
 * Any attempt to touch the sealed file or its fingerprint throws.
 */
export async function updateDocumentMeta(
  documentId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  for (const field of IMMUTABLE_FIELDS) {
    if (field in patch) {
      throw new Error(
        `Document ${documentId} is sealed: "${field}" cannot be changed. Upload a correction as a new version instead.`,
      );
    }
  }
  const allowed: Record<string, unknown> = {};
  for (const key of ["title", "issuingOrg", "requirementId", "expiryDate", "issuerVerified"]) {
    if (key in patch) allowed[key] = patch[key];
  }
  await prisma.document.update({ where: { id: documentId }, data: allowed });
  const doc = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    include: { stage: true },
  });
  await recomputeEventLevel(doc.stage.eventId);
}
