import { prisma } from "./db";

// First-party analytics only. No third-party scripts, no fingerprinting.
// Coarse device type from the user agent; country only if the hosting layer
// provides a header (raw IPs are never stored); day bucket for distinct-day
// revisit counting.

export type AnalyticsKind =
  | "record_opened"
  | "doc_viewed"
  | "doc_downloaded"
  | "download_all"
  | "share_created"
  | "share_opened"
  | "invite_interest";

export function deviceTypeFrom(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function dayBucket(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export interface LogContext {
  userAgent?: string | null;
  countryCode?: string | null; // e.g. from CF-IPCountry / Vercel geo header
}

export async function logAnalyticsEvent(params: {
  propertyId: string;
  tokenId?: string | null;
  kind: AnalyticsKind;
  documentId?: string | null;
  shareScope?: string | null;
  context?: LogContext;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        propertyId: params.propertyId,
        tokenId: params.tokenId ?? null,
        kind: params.kind,
        documentId: params.documentId ?? null,
        shareScope: params.shareScope ?? null,
        deviceType: deviceTypeFrom(params.context?.userAgent ?? null),
        countryCode: params.context?.countryCode ?? null,
        dayBucket: dayBucket(),
      },
    });
  } catch (e) {
    // Analytics must never break the homeowner page.
    console.error("analytics write failed", e);
  }
}

export function contextFromHeaders(headers: Headers): LogContext {
  return {
    userAgent: headers.get("user-agent"),
    countryCode:
      headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country") ?? null,
  };
}
