import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  contextFromHeaders,
  deviceTypeFrom,
  logAnalyticsEvent,
} from "@/lib/analytics";
import { generateRawToken, hashToken, resolveToken } from "@/lib/tokens";

let propertyId: string;
let recordId: string;

beforeAll(async () => {
  recordId = `PV-GB-TA-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`;
  const org = await prisma.organisation.create({
    data: { name: `Test Org ${recordId}` },
  });
  const property = await prisma.property.create({
    data: {
      recordId,
      addressLine1: "2 Analytics Way, Leeds",
      city: "Leeds",
      postcode: "LS2 2BB",
      propertyType: "Residential",
      tenure: "freehold",
      uprn: "100000000002",
      organisationId: org.id,
    },
  });
  propertyId = property.id;
});

describe("analytics writes with token attribution", () => {
  it("attributes an open to the specific share token that produced it", async () => {
    const plain = generateRawToken();
    const token = await prisma.accessToken.create({
      data: {
        propertyId,
        scope: "solicitor",
        tokenHash: hashToken(plain),
        label: "solicitor link, created 3 March",
        expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        createdVia: "share_modal",
      },
    });

    const resolved = await resolveToken(recordId, plain);
    expect(resolved?.id).toBe(token.id);
    expect(resolved?.scope).toBe("solicitor");

    const headers = new Headers({
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari",
      "cf-ipcountry": "GB",
    });
    for (let i = 0; i < 4; i++) {
      await logAnalyticsEvent({
        propertyId,
        kind: "share_opened",
        tokenId: token.id,
        context: contextFromHeaders(headers),
      });
    }

    const rows = await prisma.analyticsEvent.findMany({
      where: { tokenId: token.id },
    });
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.kind === "share_opened")).toBe(true);
    expect(rows[0].deviceType).toBe("mobile");
    expect(rows[0].countryCode).toBe("GB");
  });

  it("resolves nothing for revoked or expired tokens", async () => {
    const revokedPlain = generateRawToken();
    await prisma.accessToken.create({
      data: {
        propertyId,
        scope: "agent_buyer",
        tokenHash: hashToken(revokedPlain),
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000),
        createdVia: "share_modal",
      },
    });
    expect(await resolveToken(recordId, revokedPlain)).toBeNull();

    const expiredPlain = generateRawToken();
    await prisma.accessToken.create({
      data: {
        propertyId,
        scope: "agent_buyer",
        tokenHash: hashToken(expiredPlain),
        expiresAt: new Date(Date.now() - 1000),
        createdVia: "share_modal",
      },
    });
    expect(await resolveToken(recordId, expiredPlain)).toBeNull();

    // A valid token presented against the wrong record also fails.
    const otherPlain = generateRawToken();
    await prisma.accessToken.create({
      data: {
        propertyId,
        scope: "owner",
        tokenHash: hashToken(otherPlain),
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        createdVia: "issue_record",
      },
    });
    expect(await resolveToken("PV-GB-XX-000000", otherPlain)).toBeNull();
  });

  it("keeps device classification coarse — no fingerprinting", () => {
    expect(deviceTypeFrom("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126")).toBe("desktop");
    expect(deviceTypeFrom("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile")).toBe("mobile");
    expect(deviceTypeFrom("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(deviceTypeFrom(null)).toBe("unknown");
  });
});
