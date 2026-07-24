import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// StorageProvider — local disk in dev; S3-compatible driver for deployment.
// Documents are always streamed through the app so token-scope checks apply;
// storage keys are never exposed as public URLs.

export interface StorageProvider {
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
}

export class LocalDiskProvider implements StorageProvider {
  constructor(private baseDir: string = process.env.STORAGE_DIR ?? "./storage") {}

  private resolve(key: string): string {
    const p = path.normalize(path.join(this.baseDir, key));
    if (!p.startsWith(path.normalize(this.baseDir))) {
      throw new Error("Invalid storage key");
    }
    return p;
  }

  async put(key: string, bytes: Buffer): Promise<void> {
    const p = this.resolve(key);
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, bytes);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }
}

/**
 * Minimal S3-compatible driver (AWS Signature V4, no SDK dependency).
 * Configure via env: S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID,
 * S3_SECRET_ACCESS_KEY. Path-style addressing for broad compatibility
 * (AWS S3, R2, MinIO).
 */
export class S3Provider implements StorageProvider {
  private endpoint = process.env.S3_ENDPOINT ?? "";
  private region = process.env.S3_REGION ?? "auto";
  private bucket = process.env.S3_BUCKET ?? "";
  private accessKey = process.env.S3_ACCESS_KEY_ID ?? "";
  private secretKey = process.env.S3_SECRET_ACCESS_KEY ?? "";

  private async request(method: "GET" | "PUT", key: string, body?: Buffer) {
    const { createHash, createHmac } = await import("node:crypto");
    const url = new URL(`${this.endpoint}/${this.bucket}/${key}`);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = createHash("sha256").update(body ?? "").digest("hex");
    const headers: Record<string, string> = {
      host: url.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };
    const signedHeaders = Object.keys(headers).sort().join(";");
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map((h) => `${h}:${headers[h]}\n`)
      .join("");
    const canonicalRequest = [
      method,
      url.pathname,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");
    const scope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      scope,
      createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");
    const hmac = (key: Buffer | string, data: string) =>
      createHmac("sha256", key).update(data).digest();
    const sigKey = hmac(
      hmac(hmac(hmac(`AWS4${this.secretKey}`, dateStamp), this.region), "s3"),
      "aws4_request"
    );
    const signature = createHmac("sha256", sigKey).update(stringToSign).digest("hex");
    const res = await fetch(url, {
      method,
      headers: {
        ...headers,
        Authorization: `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
      body: body as BodyInit | undefined,
    });
    if (!res.ok) throw new Error(`S3 ${method} ${key} failed: ${res.status}`);
    return res;
  }

  async put(key: string, bytes: Buffer): Promise<void> {
    await this.request("PUT", key, bytes);
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.request("GET", key);
    return Buffer.from(await res.arrayBuffer());
  }
}

export function getStorageProvider(): StorageProvider {
  return process.env.STORAGE_PROVIDER === "s3"
    ? new S3Provider()
    : new LocalDiskProvider();
}
