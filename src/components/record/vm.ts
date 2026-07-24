// Plain, serialisable view-model shapes shared by the record page's server
// components and the client leaves.

import type { EvidenceDoc } from "./EvidenceRow";

export interface StageVM {
  id: string;
  name: string;
  issuerLine: string;
  done: boolean;
  countLabel: string; // "2 documents"
  documents: EvidenceDoc[];
  missing: string[]; // unmet document-requirement labels
  defaultOpen: boolean;
  hasRequirements: boolean;
}

export interface PartyVM {
  role: string;
  firmName: string;
  verified: boolean;
}

export interface BreakdownRowVM {
  label: string;
  met: boolean;
  statusLabel: string;
}

export interface EventVM {
  id: string;
  title: string;
  when: string; // "February — July 2026"
  level: number;
  band: "high" | "mid" | "low";
  historical: boolean; // no requirements defined -> "Historical"
  chipLabel: string; // "100% verified" | "62% verification level" | "Historical"
  whoLine: string | null;
  parties: PartyVM[];
  stages: StageVM[];
  showStageChain: boolean;
  breakdown: BreakdownRowVM[] | null; // "Why 62%?" panel rows
  breakdownTitle: string | null;
  invitePrompt: { text: string; mailto: string } | null;
}

export interface RecordVM {
  recordId: string;
  addressLine: string;
  postcode: string;
  uprn: string | null;
  uprnNote: string | null;
  propertyType: string;
  tenure: string;
  eyebrow: string;
  recordLevel: number | null;
  recordBand: "high" | "mid" | "low";
  recordBandLabel: string;
  verifiedEvents: number;
  totalEvents: number;
  documentCount: number;
  createdAt: string;
  lastUpdated: string;
  zipUrl: string;
  scopeLabel: string | null; // banner for non-owner scopes
  events: EventVM[];
}
