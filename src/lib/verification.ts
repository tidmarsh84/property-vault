import {
  issuerWeights,
  stageRules,
  eventRules,
  type IssuerClass,
} from "../../config/verification-rules";

// Verification Level engine. Pure function of (stages+documents, origin,
// professionals) → level + breakdown, so the "Why X%?" panel is a direct
// printout of rule evaluation. See config/verification-rules.ts.

export interface DocForCalc {
  issuerClass: string;
  docType: string;
  requirementKey: string | null;
}

export interface StageForCalc {
  typeKey: string;
  documents: DocForCalc[];
}

export interface EventForCalc {
  origin: string; // "professional" | "owner_provided"
  historical?: boolean;
  professionals: { identityVerified: boolean }[];
  stages: StageForCalc[];
}

export interface BreakdownRow {
  stageTypeKey: string;
  requirementKey: string;
  label: string;
  met: boolean;
  metLabel: string; // "✓ On record" / "Not verified" / …
  earned: number;
  possible: number;
  satisfiedBy?: string; // issuer class of the satisfying document
}

export interface VerificationResult {
  level: number; // 0–100
  band: string; // "high" | "mid" | "low"
  bandLabel: string;
  rows: BreakdownRow[];
  capApplied: number | null; // eventRules.ownerProvidedCap if it bit
  identityFactorApplied: boolean;
}

function classWeight(c: string): number {
  return issuerWeights[c as IssuerClass] ?? issuerWeights.owner_provided;
}

/** Find the best document satisfying a requirement within a stage. */
function bestMatch(reqKey: string, docType: string, docs: DocForCalc[]) {
  const candidates = docs.filter(
    (d) => d.requirementKey === reqKey || (d.requirementKey == null && d.docType === docType)
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) =>
    classWeight(b.issuerClass) > classWeight(a.issuerClass) ? b : a
  );
}

export function computeVerification(event: EventForCalc): VerificationResult {
  const rows: BreakdownRow[] = [];
  let earned = 0;
  let possible = 0;

  for (const stage of event.stages) {
    const rule = stageRules[stage.typeKey];
    if (!rule) continue;
    if (rule.requirements.length === 0) {
      // Custom stage: any sealed evidence counts as one unit at its class weight.
      possible += 1;
      const best = stage.documents.length
        ? stage.documents.reduce((a, b) =>
            classWeight(b.issuerClass) > classWeight(a.issuerClass) ? b : a
          )
        : null;
      const got = best ? Math.min(classWeight(best.issuerClass), 1) : 0;
      earned += got;
      rows.push({
        stageTypeKey: stage.typeKey,
        requirementKey: "any_evidence",
        label: "Supporting evidence",
        met: !!best,
        metLabel: best ? "✓ On record" : "Not on record",
        earned: got,
        possible: 1,
        satisfiedBy: best?.issuerClass,
      });
      continue;
    }
    for (const req of rule.requirements) {
      possible += req.weight;
      const match = bestMatch(req.key, req.docType, stage.documents);
      if (match) {
        const ratio = Math.min(
          classWeight(match.issuerClass) / classWeight(req.minIssuerClass),
          1
        );
        const got = req.weight * ratio;
        earned += got;
        rows.push({
          stageTypeKey: stage.typeKey,
          requirementKey: req.key,
          label: req.label,
          met: true,
          metLabel: ratio >= 1 ? "✓ On record" : "✓ On record (owner-provided)",
          earned: got,
          possible: req.weight,
          satisfiedBy: match.issuerClass,
        });
      } else {
        rows.push({
          stageTypeKey: stage.typeKey,
          requirementKey: req.key,
          label: req.label,
          met: false,
          metLabel: req.missingLabel ?? "Not found",
          earned: 0,
          possible: req.weight,
        });
      }
    }
  }

  let level = possible > 0 ? (earned / possible) * 100 : 0;

  let identityFactorApplied = false;
  if (
    event.professionals.length > 0 &&
    !event.professionals.some((p) => p.identityVerified)
  ) {
    level *= eventRules.identityUnverifiedFactor;
    identityFactorApplied = true;
  }

  let capApplied: number | null = null;
  if (event.origin === "owner_provided" && level > eventRules.ownerProvidedCap) {
    level = eventRules.ownerProvidedCap;
    capApplied = eventRules.ownerProvidedCap;
  }

  const rounded = Math.round(level);
  const band =
    eventRules.bands.find((b) => rounded >= b.min) ??
    eventRules.bands[eventRules.bands.length - 1];

  return {
    level: rounded,
    band: band.key,
    bandLabel: band.label,
    rows,
    capApplied,
    identityFactorApplied,
  };
}

// One-line plain-English note shown wherever a Verification Level appears.
export const VERIFICATION_NOTE =
  "Verification reflects what is evidenced and identity-checked — not the quality of the work.";
