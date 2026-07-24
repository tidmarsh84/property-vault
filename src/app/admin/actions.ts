"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { login, logout, requireUser } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";
import { anchorDocumentVersion } from "@/lib/integrity";
import { recomputeEventLevel } from "@/lib/recompute";
import { createAccessToken } from "@/lib/tokens";
import { getTemplate } from "../../../config/event-templates";

// ── auth ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const ok = await login(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  redirect(ok ? "/admin" : "/admin/login?error=1");
}

export async function logoutAction() {
  logout();
  redirect("/admin/login");
}

// ── helpers ─────────────────────────────────────────────────────────────────

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optDate(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  return v ? new Date(v) : null;
}

async function generateRecordId(areaCode: string): Promise<string> {
  const area = (areaCode || "GBR").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "GBR";
  for (let i = 0; i < 20; i++) {
    const n = Math.floor(100000 + Math.random() * 900000);
    const candidate = `PV-GB-${area}-${n}`;
    if (!(await prisma.property.findUnique({ where: { recordId: candidate } }))) {
      return candidate;
    }
  }
  throw new Error("Could not allocate a record ID");
}

// ── properties ──────────────────────────────────────────────────────────────

export async function createPropertyAction(formData: FormData) {
  const user = await requireUser();
  const uprn = str(formData, "uprn");
  const overrideReason = str(formData, "uprnOverrideReason");
  if (!uprn && !overrideReason) {
    redirect("/admin/properties/new?error=uprn");
  }
  const recordId = await generateRecordId(str(formData, "areaCode") || str(formData, "postcode"));
  const property = await prisma.property.create({
    data: {
      recordId,
      uprn: uprn || null,
      uprnOverrideReason: uprn ? null : overrideReason,
      addressLine1: str(formData, "addressLine1"),
      addressLine2: str(formData, "addressLine2") || null,
      city: str(formData, "city"),
      postcode: str(formData, "postcode").toUpperCase(),
      tenure: str(formData, "tenure") || "freehold",
      propertyType: str(formData, "propertyType") || "Residential",
      constructionYear: str(formData, "constructionYear")
        ? Number(str(formData, "constructionYear"))
        : null,
      organisationId: user.organisationId,
      assets: {
        create: [{ name: "Whole property", kind: "whole_property", isWholeProperty: true }],
      },
    },
  });
  redirect(`/admin/properties/${property.id}`);
}

export async function updatePropertyAction(propertyId: string, formData: FormData) {
  await requireUser();
  const uprn = str(formData, "uprn");
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      addressLine1: str(formData, "addressLine1"),
      addressLine2: str(formData, "addressLine2") || null,
      city: str(formData, "city"),
      postcode: str(formData, "postcode").toUpperCase(),
      tenure: str(formData, "tenure"),
      propertyType: str(formData, "propertyType"),
      constructionYear: str(formData, "constructionYear")
        ? Number(str(formData, "constructionYear"))
        : null,
      uprn: uprn || null,
      uprnOverrideReason: uprn ? null : str(formData, "uprnOverrideReason") || null,
    },
  });
  revalidatePath(`/admin/properties/${propertyId}`);
}

// ── events ──────────────────────────────────────────────────────────────────

export async function createEventAction(propertyId: string, formData: FormData) {
  await requireUser();
  const templateKey = str(formData, "templateKey") || "custom";
  const template = getTemplate(templateKey);
  const assetId = str(formData, "assetId");
  let finalAssetId = assetId;

  if (assetId === "__new__") {
    const asset = await prisma.asset.create({
      data: {
        propertyId,
        name: str(formData, "newAssetName") || "New asset",
        kind: str(formData, "newAssetKind") || template?.defaultAssetKind || "other",
      },
    });
    finalAssetId = asset.id;
  } else {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.propertyId !== propertyId) redirect(`/admin/properties/${propertyId}`);
  }

  const ownerProvided = formData.get("ownerProvided") === "on";
  const started = optDate(formData, "startedOn");
  const event = await prisma.event.create({
    data: {
      assetId: finalAssetId,
      title: str(formData, "title") || template?.label || "New event",
      lifecycle: "draft",
      origin: ownerProvided ? "owner_provided" : "professional",
      templateKey,
      startedOn: started,
      completedOn: optDate(formData, "completedOn"),
      periodLabel: str(formData, "periodLabel") || null,
      summary: str(formData, "summary") || null,
      sortDate: optDate(formData, "completedOn") ?? started ?? new Date(),
      stages: {
        create: (template?.stages ?? []).map((s, i) => ({
          typeKey: s.typeKey,
          name: s.name,
          position: i,
        })),
      },
    },
  });
  redirect(`/admin/events/${event.id}`);
}

export async function updateEventAction(eventId: string, formData: FormData) {
  await requireUser();
  const started = optDate(formData, "startedOn");
  const completed = optDate(formData, "completedOn");
  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: str(formData, "title"),
      lifecycle: str(formData, "lifecycle"),
      origin: formData.get("ownerProvided") === "on" ? "owner_provided" : "professional",
      periodLabel: str(formData, "periodLabel") || null,
      summary: str(formData, "summary") || null,
      startedOn: started,
      completedOn: completed,
      sortDate: completed ?? started ?? new Date(),
      historical: formData.get("historical") === "on",
    },
  });
  await recomputeEventLevel(eventId);
  revalidatePath(`/admin/events/${eventId}`);
}

// ── stages ──────────────────────────────────────────────────────────────────

export async function addStageAction(eventId: string, formData: FormData) {
  await requireUser();
  const count = await prisma.stage.count({ where: { eventId } });
  await prisma.stage.create({
    data: {
      eventId,
      typeKey: str(formData, "typeKey") || "custom",
      name: str(formData, "name") || "New stage",
      detail: str(formData, "detail") || null,
      occurredOn: optDate(formData, "occurredOn"),
      status: str(formData, "status") || "pending",
      position: count,
    },
  });
  await recomputeEventLevel(eventId);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function updateStageAction(stageId: string, formData: FormData) {
  await requireUser();
  const stage = await prisma.stage.update({
    where: { id: stageId },
    data: {
      name: str(formData, "name"),
      typeKey: str(formData, "typeKey"),
      detail: str(formData, "detail") || null,
      occurredOn: optDate(formData, "occurredOn"),
      status: str(formData, "status"),
    },
  });
  await recomputeEventLevel(stage.eventId);
  revalidatePath(`/admin/events/${stage.eventId}/stages/${stageId}`);
  revalidatePath(`/admin/events/${stage.eventId}`);
}

export async function deleteStageAction(stageId: string) {
  await requireUser();
  const stage = await prisma.stage.findUniqueOrThrow({
    where: { id: stageId },
    include: { documents: true },
  });
  if (stage.documents.length > 0) return; // sealed evidence is never deleted
  await prisma.stage.delete({ where: { id: stageId } });
  await recomputeEventLevel(stage.eventId);
  redirect(`/admin/events/${stage.eventId}`);
}

// ── professionals ───────────────────────────────────────────────────────────

export async function addProfessionalAction(eventId: string, formData: FormData) {
  await requireUser();
  const count = await prisma.eventProfessional.count({ where: { eventId } });
  await prisma.eventProfessional.create({
    data: {
      eventId,
      role: str(formData, "role"),
      firmName: str(formData, "firmName"),
      registrationBody: str(formData, "registrationBody") || null,
      registrationNumber: str(formData, "registrationNumber") || null,
      identityVerified: formData.get("identityVerified") === "on",
      position: count,
    },
  });
  await recomputeEventLevel(eventId);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function deleteProfessionalAction(id: string) {
  await requireUser();
  const prof = await prisma.eventProfessional.delete({ where: { id } });
  await recomputeEventLevel(prof.eventId);
  revalidatePath(`/admin/events/${prof.eventId}`);
}

// ── documents (upload = seal; corrections are new versions) ─────────────────

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function uploadDocumentsAction(stageId: string, formData: FormData) {
  const user = await requireUser();
  const stage = await prisma.stage.findUniqueOrThrow({ where: { id: stageId } });
  const storage = getStorageProvider();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    if (!ALLOWED_MIME[file.type]) continue; // PDF/JPG/PNG only
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const title = files.length === 1 && str(formData, "title") ? str(formData, "title") : file.name.replace(/\.[^.]+$/, "");
    const doc = await prisma.document.create({
      data: {
        stageId,
        title,
        issuingOrganisation: str(formData, "issuingOrganisation") || "Unknown",
        issueDate: optDate(formData, "issueDate"),
        expiryDate: optDate(formData, "expiryDate"),
        issuerClass: str(formData, "issuerClass") || "firm",
        docType: str(formData, "docType") || "other",
        scopeClass: str(formData, "scopeClass") || "general",
        requirementKey: str(formData, "requirementKey") || null,
      },
    });
    const storageKey = `documents/${doc.id}/v1/${file.name}`;
    await storage.put(storageKey, bytes);
    const version = await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNo: 1,
        storageKey,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: bytes.length,
        sha256,
        uploadedById: user.id,
        isCurrent: true,
      },
    });
    await anchorDocumentVersion(version.id, sha256);
  }

  await recomputeEventLevel(stage.eventId);
  revalidatePath(`/admin/events/${stage.eventId}/stages/${stageId}`);
}

export async function uploadNewVersionAction(documentId: string, formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (!ALLOWED_MIME[file.type]) return;

  const doc = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    include: { versions: true, stage: true },
  });
  const nextNo = Math.max(...doc.versions.map((v) => v.versionNo)) + 1;
  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const storageKey = `documents/${doc.id}/v${nextNo}/${file.name}`;
  await getStorageProvider().put(storageKey, bytes);

  // Append-only: prior versions remain, flagged not-current (audit trail).
  await prisma.documentVersion.updateMany({
    where: { documentId },
    data: { isCurrent: false },
  });
  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      versionNo: nextNo,
      storageKey,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: bytes.length,
      sha256,
      uploadedById: user.id,
      isCurrent: true,
    },
  });
  await anchorDocumentVersion(version.id, sha256);
  await recomputeEventLevel(doc.stage.eventId);
  revalidatePath(`/admin/events/${doc.stage.eventId}/stages/${doc.stageId}`);
}

export async function updateDocumentMetaAction(documentId: string, formData: FormData) {
  await requireUser();
  const doc = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: str(formData, "title"),
      issuingOrganisation: str(formData, "issuingOrganisation"),
      issueDate: optDate(formData, "issueDate"),
      expiryDate: optDate(formData, "expiryDate"),
      issuerClass: str(formData, "issuerClass"),
      docType: str(formData, "docType"),
      scopeClass: str(formData, "scopeClass"),
      requirementKey: str(formData, "requirementKey") || null,
    },
    include: { stage: true },
  });
  await recomputeEventLevel(doc.stage.eventId);
  revalidatePath(`/admin/events/${doc.stage.eventId}/stages/${doc.stageId}`);
}

// ── issue record ────────────────────────────────────────────────────────────

export interface IssueResult {
  url: string;
  email: string;
}

export async function issueRecordAction(
  propertyId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: IssueResult | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<IssueResult> {
  await requireUser();
  const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });

  await prisma.property.update({
    where: { id: propertyId },
    data: { status: "issued", issuedAt: property.issuedAt ?? new Date() },
  });
  // Issue all draft/awaiting events? No — staff control lifecycle per event.

  const { raw } = await createAccessToken({
    propertyId,
    scope: "owner",
    createdVia: "issue_record",
    expiresInDays: 365,
    label: "Homeowner link",
  });

  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const url = `${base}/r/${property.recordId}?k=${encodeURIComponent(raw)}`;
  const email = `Subject: Your property record for ${property.addressLine1} is ready

Dear homeowner,

Your permanent property record for ${property.addressLine1}, ${property.city} is now live.

View it any time using your secure link (no account or password needed):

${url}

What you can do with it:
- See every professionally verified event, with the sealed documents behind each one
- Download any document, or all of them together
- Share a read-only view with your solicitor, estate agent, insurer or surveyor —
  you choose what each of them can see, and you can withdraw access at any time

Please keep this link private: anyone with it can view your record.

Kind regards,
${property.recordId.startsWith("PV") ? "Paddick Engineering Ltd" : ""}
on behalf of Property Vault`;

  revalidatePath(`/admin/properties/${propertyId}`);
  return { url, email };
}
