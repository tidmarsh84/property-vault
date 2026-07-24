import { beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { logAnalyticsEvent } from "@/lib/analytics";
import { createAccessToken, hashToken, resolveToken } from "@/lib/tokens";

// DB-backed invariants against a fresh migrated test database (tests/setup.ts).

let propertyId: string;
let documentId: string;

beforeAll(async () => {
  const org = await prisma.organisation.create({ data: { name: "Test Org" } });
  const property = await prisma.property.create({
    data: {
      recordId: "PV-GB-TST-000001",
      addressLine1: "1 Test Street",
      city: "Leeds",
      postcode: "LS1 1AA",
      tenure: "freehold",
      propertyType: "Residential",
      organisationId: org.id,
      uprn: "100000000001",
    },
  });
  propertyId = property.id;
  const asset = await prisma.asset.create({
    data: { propertyId, name: "Whole property", kind: "whole_property", isWholeProperty: true },
  });
  const event = await prisma.event.create({
    data: { assetId: asset.id, title: "Test event", sortDate: new Date() },
  });
  const stage = await prisma.stage.create({
    data: { eventId: event.id, typeKey: "custom", name: "Stage" },
  });
  const doc = await prisma.document.create({
    data: {
      stageId: stage.id,
      title: "Test doc",
      issuingOrganisation: "Test",
      issuerClass: "firm",
      docType: "certificate",
      scopeClass: "certificate",
    },
  });
  documentId = doc.id;
});

describe("hash immutability / append-only versions", () => {
  it("corrections create new versions; prior versions and hashes are untouched", async () => {
    const sha1 = createHash("sha256").update("version one bytes").digest("hex");
    const v1 = await prisma.documentVersion.create({
      data: {
        documentId, versionNo: 1, storageKey: "t/v1", fileName: "a.pdf",
        mimeType: "application/pdf", sizeBytes: 10, sha256: sha1, isCurrent: true,
      },
    });

    // correction lands as v2; v1 flagged not-current but preserved
    await prisma.documentVersion.updateMany({ where: { documentId }, data: { isCurrent: false } });
    const sha2 = createHash("sha256").update("version two bytes").digest("hex");
    await prisma.documentVersion.create({
      data: {
        documentId, versionNo: 2, storageKey: "t/v2", fileName: "a.pdf",
        mimeType: "application/pdf", sizeBytes: 11, sha256: sha2, isCurrent: true,
      },
    });

    const versions = await prisma.documentVersion.findMany({
      where: { documentId }, orderBy: { versionNo: "asc" },
    });
    expect(versions).toHaveLength(2);
    expect(versions[0].sha256).toBe(sha1); // audit trail intact
    expect(versions[0].isCurrent).toBe(false);
    expect(versions[1].isCurrent).toBe(true);
    expect(versions[0].sha256).not.toBe(versions[1].sha256);
  });

  it("the same version number can never be written twice for a document", async () => {
    await expect(
      prisma.documentVersion.create({
        data: {
          documentId, versionNo: 1, storageKey: "t/v1-dupe", fileName: "b.pdf",
          mimeType: "application/pdf", sizeBytes: 5,
          sha256: createHash("sha256").update("dupe").digest("hex"), isCurrent: false,
        },
      })
    ).rejects.toThrow();
  });
});

describe("access tokens", () => {
  it("stores only the hash, resolves the raw token, and respects expiry", async () => {
    const { raw, token } = await createAccessToken({
      propertyId, scope: "solicitor", createdVia: "share_modal", expiresInDays: 90,
    });
    expect(token.tokenHash).toBe(hashToken(raw));
    expect(token.tokenHash).not.toContain(raw);

    const resolved = await resolveToken("PV-GB-TST-000001", raw);
    expect(resolved?.id).toBe(token.id);

    // wrong record → refused
    expect(await resolveToken("PV-GB-TST-999999", raw)).toBeNull();

    // expired → refused
    await prisma.accessToken.update({
      where: { id: token.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await resolveToken("PV-GB-TST-000001", raw)).toBeNull();
  });

  it("revoked tokens are refused", async () => {
    const { raw, token } = await createAccessToken({
      propertyId, scope: "agent_buyer", createdVia: "share_modal", expiresInDays: 90,
    });
    await prisma.accessToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });
    expect(await resolveToken("PV-GB-TST-000001", raw)).toBeNull();
  });
});

describe("analytics writes", () => {
  it("writes a record_opened event with device type and day bucket, no IP", async () => {
    await logAnalyticsEvent({
      propertyId,
      kind: "record_opened",
      context: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" },
    });
    const row = await prisma.analyticsEvent.findFirstOrThrow({
      where: { propertyId, kind: "record_opened" },
    });
    expect(row.deviceType).toBe("mobile");
    expect(row.dayBucket).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(row.countryCode).toBeNull();
  });

  it("attributes share opens to the share link that was used", async () => {
    const { token } = await createAccessToken({
      propertyId, scope: "insurer_surveyor", createdVia: "share_modal", expiresInDays: 90,
    });
    await logAnalyticsEvent({
      propertyId, tokenId: token.id, kind: "share_opened", shareScope: "insurer_surveyor",
    });
    const row = await prisma.analyticsEvent.findFirstOrThrow({
      where: { propertyId, kind: "share_opened" },
    });
    expect(row.tokenId).toBe(token.id);
    expect(row.shareScope).toBe("insurer_surveyor");
  });
});
