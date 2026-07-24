// Property Vault — verification rules. One editable file: typed, plain data, no logic.
//
// Terminology (applies everywhere): this drives the Verification Level. Verified
// means documents exist, issuers are identity-checked, and files are unaltered
// since issue. It is never a statement about the quality of the work.
//
// docClass drives share-scope filtering in visibleTree.ts:
//   certificate — sealed certificates (visible to every scope)
//   drawing / calculation — working papers (excluded from agent_buyer)
//   photo — photographs (included for insurer_surveyor)
//   report / invoice — supporting papers

export type DocClass =
  | "certificate"
  | "drawing"
  | "calculation"
  | "photo"
  | "report"
  | "invoice";

export interface Requirement {
  id: string;
  label: string;
  weight: number;
  issuerClass?: string; // informational: who normally issues this
  kind?: "attestation"; // met via StageAttestation rather than a document
  docClass?: DocClass; // defaults to "certificate"
  missingLabel?: string; // breakdown copy when unmet (prototype wording)
}

export interface StageTypeRule {
  label: string;
  requirements: Requirement[];
}

export interface VerificationRules {
  weights: {
    issuerVerifiedDoc: number; // multiplier when issuing org is identity-checked
    ownerProvidedDoc: number; // multiplier for owner-uploaded evidence
  };
  caps: {
    ownerProvidedEvent: number; // event flagged owner_provided cannot exceed this
  };
  stageTypes: Record<string, StageTypeRule>;
}

export const rules: VerificationRules = {
  weights: {
    issuerVerifiedDoc: 1.0,
    ownerProvidedDoc: 0.5,
  },
  caps: {
    ownerProvidedEvent: 65,
  },
  stageTypes: {
    planning_granted: {
      label: "Planning permission granted",
      requirements: [
        { id: "decision_notice", label: "Decision notice", weight: 2, issuerClass: "local_authority" },
        { id: "approved_drawings", label: "Approved drawings", weight: 1, docClass: "drawing" },
      ],
    },
    structural_design: {
      label: "Structural design completed",
      requirements: [
        { id: "calcs", label: "Structural calculations", weight: 3, issuerClass: "chartered_engineer", docClass: "calculation" },
        { id: "regs_drawings", label: "Building Regulations drawings", weight: 2, docClass: "drawing" },
        { id: "drainage", label: "Drainage / SuDS design", weight: 1, docClass: "drawing" },
      ],
    },
    built_inspected: {
      label: "Built & inspected",
      requirements: [
        { id: "completion_photos", label: "Completion photographs", weight: 1, docClass: "photo" },
        { id: "eic", label: "Electrical installation certificate", weight: 2, issuerClass: "niceic" },
      ],
    },
    signed_off: {
      label: "Signed off",
      requirements: [
        { id: "completion_cert", label: "Completion certificate", weight: 3, issuerClass: "building_control" },
      ],
    },
    warranty_active: {
      label: "Warranty active",
      requirements: [
        { id: "warranty_cert", label: "Structural warranty certificate", weight: 2 },
      ],
    },
    // Weights tuned for the pilot seed so the 2018 boiler event computes to 62%
    // with only the Benchmark certificate on record (8 / 13 = 61.5 -> 62) —
    // see DECISIONS.md. Breakdown copy matches the v3 prototype exactly.
    boiler_installed: {
      label: "Boiler installed",
      requirements: [
        { id: "benchmark_cert", label: "Benchmark certificate uploaded", weight: 8 },
        { id: "installer_identity", label: "Installer identity", weight: 2, kind: "attestation", missingLabel: "Not verified" },
        { id: "gas_safe_check", label: "Gas Safe registration at date of work", weight: 2, kind: "attestation", missingLabel: "Not confirmed" },
        { id: "buildregs_notice", label: "Building Regulations notification", weight: 1, missingLabel: "Not found" },
      ],
    },
    // Tuned so the 2011 roof event computes to exactly 48% from owner-provided
    // invoice + photographs (0.5 multiplier): (6 + 6) / 25 = 48 — see DECISIONS.md.
    roof_recovered: {
      label: "Roof re-covered",
      requirements: [
        { id: "roof_invoice", label: "Contractor invoice uploaded", weight: 12, docClass: "invoice" },
        { id: "roof_photos", label: "Photographs uploaded", weight: 12, docClass: "photo" },
        { id: "contractor_identity", label: "Contractor identity", weight: 1, kind: "attestation", missingLabel: "Not verified" },
      ],
    },
    electrical_rewire: {
      label: "Rewire certified",
      requirements: [
        { id: "eic_cert", label: "Electrical installation certificate", weight: 2, issuerClass: "niceic" },
      ],
    },
    // Structural survey template
    survey_instructed: {
      label: "Instructed",
      requirements: [
        { id: "instruction_letter", label: "Letter of instruction", weight: 1, docClass: "report" },
      ],
    },
    survey_inspected: {
      label: "Inspected",
      requirements: [
        { id: "site_notes", label: "Site inspection notes", weight: 1, docClass: "report" },
        { id: "site_photos", label: "Site photographs", weight: 1, docClass: "photo" },
      ],
    },
    survey_report: {
      label: "Report issued",
      requirements: [
        { id: "survey_report", label: "Survey report", weight: 3, issuerClass: "chartered_engineer", docClass: "report" },
      ],
    },
    // Building Regulations application template
    br_submitted: {
      label: "Submitted",
      requirements: [
        { id: "br_application", label: "Application submission", weight: 1, docClass: "report" },
      ],
    },
    br_approved: {
      label: "Approved",
      requirements: [
        { id: "br_approval", label: "Approval notice", weight: 2, issuerClass: "building_control" },
      ],
    },
    br_completion: {
      label: "Completion certificate",
      requirements: [
        { id: "br_completion_cert", label: "Completion certificate", weight: 3, issuerClass: "building_control" },
      ],
    },
    // add stage types as templates require; unknown stageType = zero-weight,
    // renders "no requirements defined"
  },
};
