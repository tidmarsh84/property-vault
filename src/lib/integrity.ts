import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// IntegrityProvider — the pilot's entire integrity surface.
//
//   anchor(hash)  → receipt
//   verify(hash, receipt) → bool
//
// Exactly two implementations ship in the pilot:
//   LocalProvider — append-only receipts signed with a server-held key
//   NullProvider  — for tests
//
// A public-ledger provider can be added later behind this interface without
// touching product code. No ledger/blockchain dependencies belong here.
// ─────────────────────────────────────────────────────────────────────────────

export interface IntegrityReceiptPayload {
  provider: string;
  sha256: string;
  anchoredAt: string; // ISO timestamp
  signature: string;
}

export interface IntegrityProvider {
  readonly name: string;
  anchor(hash: string): Promise<IntegrityReceiptPayload>;
  verify(hash: string, receipt: IntegrityReceiptPayload): Promise<boolean>;
}

function signingKey(): string {
  const key = process.env.INTEGRITY_SIGNING_KEY;
  if (!key) throw new Error("INTEGRITY_SIGNING_KEY is not set");
  return key;
}

function sign(sha256: string, anchoredAt: string): string {
  return createHmac("sha256", signingKey())
    .update(`${sha256}.${anchoredAt}`)
    .digest("hex");
}

export class LocalProvider implements IntegrityProvider {
  readonly name = "local";

  async anchor(hash: string): Promise<IntegrityReceiptPayload> {
    const anchoredAt = new Date().toISOString();
    return {
      provider: this.name,
      sha256: hash,
      anchoredAt,
      signature: sign(hash, anchoredAt),
    };
  }

  async verify(hash: string, receipt: IntegrityReceiptPayload): Promise<boolean> {
    if (receipt.provider !== this.name) return false;
    if (receipt.sha256 !== hash) return false;
    const expected = Buffer.from(sign(receipt.sha256, receipt.anchoredAt), "hex");
    const actual = Buffer.from(receipt.signature, "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

export class NullProvider implements IntegrityProvider {
  readonly name = "null";

  async anchor(hash: string): Promise<IntegrityReceiptPayload> {
    return {
      provider: this.name,
      sha256: hash,
      anchoredAt: new Date().toISOString(),
      signature: "null",
    };
  }

  async verify(hash: string, receipt: IntegrityReceiptPayload): Promise<boolean> {
    return receipt.sha256 === hash;
  }
}

export function getIntegrityProvider(): IntegrityProvider {
  return process.env.INTEGRITY_PROVIDER === "null"
    ? new NullProvider()
    : new LocalProvider();
}

/** Anchor a document version's hash and persist the receipt (append-only). */
export async function anchorDocumentVersion(documentVersionId: string, sha256: string) {
  const provider = getIntegrityProvider();
  const receipt = await provider.anchor(sha256);
  return prisma.integrityReceipt.create({
    data: {
      documentVersionId,
      provider: provider.name,
      receiptJson: JSON.stringify(receipt),
      anchoredAt: new Date(receipt.anchoredAt),
    },
  });
}

/** Verify a stored receipt against a hash. */
export async function verifyReceipt(sha256: string, receiptJson: string): Promise<boolean> {
  const receipt = JSON.parse(receiptJson) as IntegrityReceiptPayload;
  const provider =
    receipt.provider === "null" ? new NullProvider() : new LocalProvider();
  return provider.verify(sha256, receipt);
}
