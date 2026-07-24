import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { LocalProvider, NullProvider } from "@/lib/integrity";

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

describe("IntegrityProvider", () => {
  it("LocalProvider round-trips anchor → verify", async () => {
    const p = new LocalProvider();
    const h = hash("sealed document bytes");
    const receipt = await p.anchor(h);
    expect(receipt.provider).toBe("local");
    await expect(p.verify(h, receipt)).resolves.toBe(true);
  });

  it("LocalProvider rejects a receipt for different bytes (tamper detection)", async () => {
    const p = new LocalProvider();
    const receipt = await p.anchor(hash("original"));
    await expect(p.verify(hash("tampered"), receipt)).resolves.toBe(false);
  });

  it("LocalProvider rejects a forged signature", async () => {
    const p = new LocalProvider();
    const h = hash("document");
    const receipt = await p.anchor(h);
    receipt.signature = receipt.signature.replace(/^../, "00");
    await expect(p.verify(h, receipt)).resolves.toBe(false);
  });

  it("NullProvider verifies by hash equality only", async () => {
    const p = new NullProvider();
    const h = hash("x");
    const receipt = await p.anchor(h);
    await expect(p.verify(h, receipt)).resolves.toBe(true);
    await expect(p.verify(hash("y"), receipt)).resolves.toBe(false);
  });
});
