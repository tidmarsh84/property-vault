import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";

// Access tokens: cryptographically random 128 bits minimum, stored hashed,
// revocable, expiring. The raw token is shown exactly once at creation.

export type TokenScope = "owner" | "solicitor" | "agent_buyer" | "insurer_surveyor";

export const SHARE_SCOPES: Record<
  Exclude<TokenScope, "owner">,
  { label: string; description: string }
> = {
  solicitor: {
    label: "Solicitor or conveyancer",
    description:
      "Full record — every event, stage and sealed document with verification details.",
  },
  agent_buyer: {
    label: "Estate agent or buyer",
    description:
      "Event timeline, verification levels and certificates — working drawings stay private.",
  },
  insurer_surveyor: {
    label: "Insurer or surveyor",
    description: "Structural events, surveys and photographs relevant to condition.",
  },
};

export function generateRawToken(): string {
  // 160 bits, base64url — exceeds the 128-bit floor.
  return randomBytes(20).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface CreateTokenOptions {
  propertyId: string;
  scope: TokenScope;
  createdVia: "issue_record" | "share_modal" | "seed";
  expiresInDays: number;
  label?: string;
  parentTokenId?: string;
  /** Seed only: force a known raw token so the demo link is stable. */
  rawOverride?: string;
}

export async function createAccessToken(opts: CreateTokenOptions) {
  const raw = opts.rawOverride ?? generateRawToken();
  const token = await prisma.accessToken.create({
    data: {
      propertyId: opts.propertyId,
      tokenHash: hashToken(raw),
      scope: opts.scope,
      label: opts.label,
      createdVia: opts.createdVia,
      parentTokenId: opts.parentTokenId,
      expiresAt: new Date(Date.now() + opts.expiresInDays * 24 * 60 * 60 * 1000),
    },
  });
  return { raw, token };
}

/**
 * Resolve a raw token for a record. Returns the token row only if it exists,
 * matches the property, has not expired and has not been revoked.
 */
export async function resolveToken(recordId: string, raw: string | null) {
  if (!raw) return null;
  const token = await prisma.accessToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { property: true },
  });
  if (!token) return null;
  if (token.property.recordId !== recordId) return null;
  if (token.revokedAt) return null;
  if (token.expiresAt.getTime() < Date.now()) return null;
  return token;
}

export async function revokeToken(tokenId: string) {
  return prisma.accessToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}
