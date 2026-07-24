// String-union stand-ins for the plan's Prisma enums (sqlite provider has no
// native enum support — see DECISIONS.md).

export const ROLES = ["admin", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const EVENT_STATUSES = [
  "draft",
  "awaiting_evidence",
  "issued",
  "archived",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const TOKEN_SCOPES = [
  "owner",
  "solicitor",
  "agent_buyer",
  "insurer_surveyor",
] as const;
export type TokenScope = (typeof TOKEN_SCOPES)[number];

export const ANALYTICS_TYPES = [
  "record_opened",
  "doc_viewed",
  "doc_downloaded",
  "share_created",
  "share_opened",
  "download_all",
] as const;
export type AnalyticsType = (typeof ANALYTICS_TYPES)[number];

export const SHARE_SCOPES: Exclude<TokenScope, "owner">[] = [
  "solicitor",
  "agent_buyer",
  "insurer_surveyor",
];

export function isEventStatus(v: string): v is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(v);
}
export function isTokenScope(v: string): v is TokenScope {
  return (TOKEN_SCOPES as readonly string[]).includes(v);
}
export function isAnalyticsType(v: string): v is AnalyticsType {
  return (ANALYTICS_TYPES as readonly string[]).includes(v);
}
