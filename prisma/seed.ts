/* eslint-disable no-console */
// Seed: Paddick organisation, two staff users, and the full 14 Acacia Avenue
// demo record matching the v3 enterprise prototype — extension with 5 stages
// and documents, rewire, boiler at 62%, roof at 48%, 1962 construction —
// using generated placeholder PDFs/PNGs so the app demos identically to the
// prototype on first run. Idempotent: wipes and recreates the demo data.
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { getStorageProvider } from "../src/lib/storage";
import { anchorDocumentVersion } from "../src/lib/integrity";
import { createAccessToken } from "../src/lib/tokens";
import { computeVerification } from "../src/lib/verification";

const storage = getStorageProvider();

// Stable owner token for the seeded demo record only, so the demo link
// survives reseeds. Real tokens are 160-bit random (src/lib/tokens.ts).
export const DEMO_OWNER_TOKEN = "demo-acacia-owner-6kQ0v9pXbT2wRzJd";

// ── tiny placeholder file generators ────────────────────────────────────────

function makePdf(title: string, subtitle: string): Buffer {
  const text = (s: string) => s.replace(/[()\\]/g, (c) => `\\${c}`);
  const content = `BT /F1 22 Tf 60 740 Td (${text(title)}) Tj ET
BT /F1 11 Tf 60 712 Td (${text(subtitle)}) Tj ET
BT /F1 9 Tf 60 60 Td (Property Vault pilot - placeholder document. All content illustrative.) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

// 4x4 dark-navy PNG placeholder for photo evidence.
function makePng(): Buffer {
  const { deflateSync } = require("node:zlib");
  const width = 4,
    height = 4;
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      raw[row + 1 + x * 3] = 0x0a;
      raw[row + 2 + x * 3] = 0x12;
      raw[row + 3 + x * 3] = 0x20;
    }
  }
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf: Buffer) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── document helper ─────────────────────────────────────────────────────────

interface SeedDoc {
  title: string;
  issuingOrganisation: string;
  issueDate: string; // ISO date
  expiryDate?: string;
  issuerClass: string;
  docType: string;
  scopeClass: string; // "certificate" | "structural" | "general"
  requirementKey?: string;
  kindOfFile?: "pdf" | "png";
  sizeLabelMb?: number; // pad file so sizes read plausibly in the UI
}

async function addDocument(stageId: string, uploaderId: string, d: SeedDoc) {
  const doc = await prisma.document.create({
    data: {
      stageId,
      title: d.title,
      issuingOrganisation: d.issuingOrganisation,
      issueDate: new Date(d.issueDate),
      expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
      issuerClass: d.issuerClass,
      docType: d.docType,
      scopeClass: d.scopeClass,
      requirementKey: d.requirementKey ?? null,
    },
  });
  const isPng = d.kindOfFile === "png";
  let bytes = isPng ? makePng() : makePdf(d.title, `Issued by ${d.issuingOrganisation}`);
  if (d.sizeLabelMb && !isPng) {
    // pad with comment bytes so the displayed size is plausible
    const target = Math.floor(d.sizeLabelMb * 1024 * 1024 * 0.1); // keep repo light: 10% of label
    if (bytes.length < target) {
      bytes = Buffer.concat([bytes, Buffer.alloc(target - bytes.length, 0x20)]);
    }
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const ext = isPng ? "png" : "pdf";
  const fileName = `${d.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${ext}`;
  const storageKey = `documents/${doc.id}/v1/${fileName}`;
  await storage.put(storageKey, bytes);
  const version = await prisma.documentVersion.create({
    data: {
      documentId: doc.id,
      versionNo: 1,
      storageKey,
      fileName,
      mimeType: isPng ? "image/png" : "application/pdf",
      sizeBytes: bytes.length,
      sha256,
      sealedAt: new Date(d.issueDate),
      uploadedById: uploaderId,
      isCurrent: true,
    },
  });
  await anchorDocumentVersion(version.id, sha256);
  return doc;
}

async function recomputeEventLevel(eventId: string) {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { professionals: true, stages: { include: { documents: true } } },
  });
  const result = computeVerification({
    origin: event.origin,
    historical: event.historical,
    professionals: event.professionals,
    stages: event.stages.map((s) => ({
      typeKey: s.typeKey,
      documents: s.documents.map((doc) => ({
        issuerClass: doc.issuerClass,
        docType: doc.docType,
        requirementKey: doc.requirementKey,
      })),
    })),
  });
  await prisma.event.update({
    where: { id: eventId },
    data: { verificationLevel: result.level },
  });
  return result.level;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding Property Vault pilot data…");

  // Wipe (order matters for FKs)
  for (const table of [
    "integrityReceipt",
    "documentVersion",
    "document",
    "stage",
    "eventProfessional",
    "event",
    "asset",
    "analyticsEvent",
    "interestCapture",
    "accessToken",
    "property",
    "user",
    "organisation",
  ] as const) {
    // @ts-expect-error dynamic delegate access
    await prisma[table].deleteMany();
  }

  const org = await prisma.organisation.create({
    data: { name: "Paddick Engineering Ltd" },
  });

  // Demo-only credentials; override via SEED_PASSWORD for a non-local seed.
  const seedPassword = process.env.SEED_PASSWORD ?? "DemoVault2026!";
  const password = await bcrypt.hash(seedPassword, 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.local",
      name: "Demo Admin",
      passwordHash: password,
      role: "admin",
      organisationId: org.id,
    },
  });
  const staff = await prisma.user.create({
    data: {
      email: "staff@demo.local",
      name: "Demo Staff",
      passwordHash: password,
      role: "staff",
      organisationId: org.id,
    },
  });

  const property = await prisma.property.create({
    data: {
      recordId: "PV-GB-LDS-004512",
      uprn: "100012345678",
      addressLine1: "14 Acacia Avenue",
      city: "Leeds",
      postcode: "LS17 6AB",
      tenure: "freehold",
      propertyType: "Residential (semi-detached)",
      constructionYear: 1962,
      status: "issued",
      issuedAt: new Date("2026-02-02T09:00:00Z"),
      organisationId: org.id,
      createdAt: new Date("2026-02-02T09:00:00Z"),
    },
  });

  // Assets (incl. the built-in whole-property asset)
  const wholeProperty = await prisma.asset.create({
    data: { propertyId: property.id, name: "Whole property", kind: "whole_property", isWholeProperty: true },
  });
  const extensionAsset = await prisma.asset.create({
    data: { propertyId: property.id, name: "Rear extension", kind: "structure" },
  });
  const electricalAsset = await prisma.asset.create({
    data: { propertyId: property.id, name: "Electrical installation", kind: "electrical" },
  });
  const boilerAsset = await prisma.asset.create({
    data: { propertyId: property.id, name: "Gas boiler", kind: "heating" },
  });
  const roofAsset = await prisma.asset.create({
    data: { propertyId: property.id, name: "Roof", kind: "roof" },
  });

  // ── Event 1: the 2026 extension ──────────────────────────────────────────
  const extension = await prisma.event.create({
    data: {
      assetId: extensionAsset.id,
      title: "Single-storey rear extension",
      lifecycle: "issued",
      origin: "professional",
      templateKey: "extension",
      startedOn: new Date("2026-02-02"),
      completedOn: new Date("2026-07-14"),
      periodLabel: "February — July 2026",
      sortDate: new Date("2026-07-14"),
      professionals: {
        create: [
          { role: "Structural Engineer", firmName: "Paddick Engineering Ltd", registrationBody: "ICE", registrationNumber: "MICE 68231", identityVerified: true, position: 0 },
          { role: "Builder", firmName: "R. Hartley Builders", identityVerified: true, position: 1 },
          { role: "Building Control", firmName: "Leeds City Council", identityVerified: true, position: 2 },
        ],
      },
    },
  });

  const s1 = await prisma.stage.create({
    data: { eventId: extension.id, typeKey: "planning_granted", name: "Planning permission granted", detail: "Leeds City Council · Ref 26/00847/FU", occurredOn: new Date("2026-02-02"), status: "complete", position: 0 },
  });
  await addDocument(s1.id, staff.id, {
    title: "Decision notice", issuingOrganisation: "Leeds City Council", issueDate: "2026-02-02", issuerClass: "building_control", docType: "certificate", scopeClass: "certificate", requirementKey: "decision_notice", sizeLabelMb: 0.4,
  });
  await addDocument(s1.id, staff.id, {
    title: "Approved drawings (4 sheets)", issuingOrganisation: "Paddick Engineering Ltd", issueDate: "2026-02-02", issuerClass: "firm", docType: "drawing", scopeClass: "structural", requirementKey: "approved_drawings", sizeLabelMb: 6.2,
  });

  const s2 = await prisma.stage.create({
    data: { eventId: extension.id, typeKey: "structural_design", name: "Structural design completed", detail: "Paddick Engineering Ltd · J. Kamau CEng MICE", occurredOn: new Date("2026-03-09"), status: "complete", position: 1 },
  });
  await addDocument(s2.id, staff.id, {
    title: "Steel beam & padstone calculations", issuingOrganisation: "Paddick Engineering Ltd", issueDate: "2026-03-09", issuerClass: "registered_professional", docType: "calculation", scopeClass: "structural", requirementKey: "calculations", sizeLabelMb: 4.8,
  });
  await addDocument(s2.id, staff.id, {
    title: "Building Regulations drawing package (6 sheets)", issuingOrganisation: "Paddick Engineering Ltd", issueDate: "2026-03-09", issuerClass: "registered_professional", docType: "drawing", scopeClass: "structural", requirementKey: "drawing_package", sizeLabelMb: 11.4,
  });
  await addDocument(s2.id, staff.id, {
    title: "Drainage & SuDS design", issuingOrganisation: "Paddick Engineering Ltd", issueDate: "2026-03-09", issuerClass: "registered_professional", docType: "drawing", scopeClass: "structural", sizeLabelMb: 2.2,
  });

  const s3 = await prisma.stage.create({
    data: { eventId: extension.id, typeKey: "built_inspected", name: "Built & inspected", detail: "R. Hartley Builders · Site inspections passed", occurredOn: new Date("2026-07-12"), status: "complete", position: 2 },
  });
  await addDocument(s3.id, staff.id, {
    title: "Completion photographs (24 images)", issuingOrganisation: "R. Hartley Builders", issueDate: "2026-07-12", issuerClass: "firm", docType: "photo", scopeClass: "general", requirementKey: "completion_photos", kindOfFile: "png",
  });
  await addDocument(s3.id, staff.id, {
    title: "Electrical installation certificate (BS 7671)", issuingOrganisation: "Yorks Electrical Ltd", issueDate: "2026-07-08", issuerClass: "registered_professional", docType: "certificate", scopeClass: "certificate", requirementKey: "electrical_certificate", sizeLabelMb: 0.6,
  });

  const s4 = await prisma.stage.create({
    data: { eventId: extension.id, typeKey: "signed_off", name: "Signed off — completion certificate issued", detail: "Leeds City Council Building Control", occurredOn: new Date("2026-07-14"), status: "complete", position: 3 },
  });
  await addDocument(s4.id, staff.id, {
    title: "Building Regulations completion certificate", issuingOrganisation: "Leeds City Council", issueDate: "2026-07-14", issuerClass: "building_control", docType: "certificate", scopeClass: "certificate", requirementKey: "completion_certificate", sizeLabelMb: 1.2,
  });

  const s5 = await prisma.stage.create({
    data: { eventId: extension.id, typeKey: "warranty_active", name: "Warranty active", detail: "10-year structural warranty", occurredOn: new Date("2026-07-14"), status: "complete", position: 4 },
  });
  await addDocument(s5.id, staff.id, {
    title: "Structural warranty certificate", issuingOrganisation: "BuildZone Warranties", issueDate: "2026-07-14", expiryDate: "2036-07-14", issuerClass: "firm", docType: "certificate", scopeClass: "certificate", requirementKey: "warranty_certificate", sizeLabelMb: 0.4,
  });

  // ── Event 2: 2021 rewire ─────────────────────────────────────────────────
  const rewire = await prisma.event.create({
    data: {
      assetId: electricalAsset.id,
      title: "Full electrical rewire",
      lifecycle: "issued",
      origin: "professional",
      startedOn: new Date("2021-09-06"),
      completedOn: new Date("2021-09-24"),
      periodLabel: "September 2021",
      summary: "Yorks Electrical Ltd · NICEIC registered · Installation certificate on record",
      sortDate: new Date("2021-09-24"),
      professionals: {
        create: [
          { role: "Electrician", firmName: "Yorks Electrical Ltd", registrationBody: "NICEIC", registrationNumber: "605501", identityVerified: true, position: 0 },
        ],
      },
    },
  });
  const rw1 = await prisma.stage.create({
    data: { eventId: rewire.id, typeKey: "electrical_installation", name: "Electrical installation completed", detail: "Yorks Electrical Ltd · NICEIC registered", occurredOn: new Date("2021-09-24"), status: "complete", position: 0 },
  });
  await addDocument(rw1.id, staff.id, {
    title: "Electrical installation certificate", issuingOrganisation: "Yorks Electrical Ltd", issueDate: "2021-09-24", issuerClass: "registered_professional", docType: "certificate", scopeClass: "certificate", requirementKey: "electrical_certificate", sizeLabelMb: 0.5,
  });

  // ── Event 3: 2018 boiler (owner-provided, 62%) ───────────────────────────
  const boiler = await prisma.event.create({
    data: {
      assetId: boilerAsset.id,
      title: "Gas boiler replaced",
      lifecycle: "issued",
      origin: "owner_provided",
      startedOn: new Date("2018-06-11"),
      periodLabel: "June 2018",
      summary: "Worcester Bosch Greenstar · Evidence uploaded by owner",
      sortDate: new Date("2018-06-11"),
    },
  });
  const b1 = await prisma.stage.create({
    data: { eventId: boiler.id, typeKey: "owner_installation", name: "Installation", detail: "Worcester Bosch Greenstar", occurredOn: new Date("2018-06-11"), status: "complete", position: 0 },
  });
  await addDocument(b1.id, staff.id, {
    title: "Benchmark commissioning certificate", issuingOrganisation: "Installer (unverified)", issueDate: "2018-06-11", issuerClass: "firm", docType: "certificate", scopeClass: "certificate", requirementKey: "commissioning_certificate", sizeLabelMb: 0.3,
  });

  // ── Event 4: 2011 roof (owner-provided, 48%) ─────────────────────────────
  const roof = await prisma.event.create({
    data: {
      assetId: roofAsset.id,
      title: "Roof re-covered",
      lifecycle: "issued",
      origin: "owner_provided",
      startedOn: new Date("2011-03-07"),
      periodLabel: "March 2011",
      summary: "Invoice and photographs uploaded by owner · Contractor not verified",
      sortDate: new Date("2011-03-07"),
    },
  });
  const r1 = await prisma.stage.create({
    data: { eventId: roof.id, typeKey: "owner_work_evidence", name: "Work carried out", occurredOn: new Date("2011-03-07"), status: "complete", position: 0 },
  });
  await addDocument(r1.id, staff.id, {
    title: "Roofing invoice", issuingOrganisation: "Contractor (unverified)", issueDate: "2011-03-07", issuerClass: "owner_provided", docType: "invoice", scopeClass: "general", requirementKey: "invoice", sizeLabelMb: 0.2,
  });
  await addDocument(r1.id, staff.id, {
    title: "Roof photographs", issuingOrganisation: "Owner", issueDate: "2011-03-07", issuerClass: "owner_provided", docType: "photo", scopeClass: "general", requirementKey: "photos", kindOfFile: "png",
  });

  // ── Event 5: 1962 construction (historical) ──────────────────────────────
  await prisma.event.create({
    data: {
      assetId: wholeProperty.id,
      title: "Property constructed",
      lifecycle: "issued",
      origin: "owner_provided",
      historical: true,
      periodLabel: "1962",
      summary: "Semi-detached, cavity wall construction · Source: HM Land Registry title",
      sortDate: new Date("1962-06-01"),
    },
  });

  // ── Verification levels ──────────────────────────────────────────────────
  const levels = {
    extension: await recomputeEventLevel(extension.id),
    rewire: await recomputeEventLevel(rewire.id),
    boiler: await recomputeEventLevel(boiler.id),
    roof: await recomputeEventLevel(roof.id),
  };
  console.log("Verification levels:", levels);
  if (levels.extension !== 100 || levels.rewire !== 100 || levels.boiler !== 62 || levels.roof !== 48) {
    throw new Error("Seed verification levels do not match the prototype (want 100/100/62/48)");
  }

  // ── Owner access token (stable for the demo) ─────────────────────────────
  await createAccessToken({
    propertyId: property.id,
    scope: "owner",
    createdVia: "seed",
    expiresInDays: 365,
    label: "Homeowner link (seeded)",
    rawOverride: DEMO_OWNER_TOKEN,
  });

  console.log("Seed complete.");
  console.log(`  Admin login:  ${admin.email} / ${seedPassword}`);
  console.log(`  Staff login:  ${staff.email} / ${seedPassword}`);
  console.log(`  Demo record:  /r/PV-GB-LDS-004512?k=${DEMO_OWNER_TOKEN}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
