// ─────────────────────────────────────────────────────────────────────────────
// Property Vault — Verification Level rules
//
// This file is the single source of truth for how an event's Verification
// Level is computed. Edit weights and requirements here; nothing else in the
// codebase hard-codes verification behaviour.
//
// Terminology rule: the metric is the VERIFICATION LEVEL. It reflects whether
// documents exist, issuers are identity-checked, and files are unaltered since
// issue. It is never a statement about the quality of the work.
// ─────────────────────────────────────────────────────────────────────────────

export type IssuerClass =
  | "building_control"
  | "registered_professional"
  | "firm"
  | "owner_provided";

export type DocType =
  | "certificate"
  | "drawing"
  | "calculation"
  | "photo"
  | "invoice"
  | "report"
  | "other";

export interface Requirement {
  key: string; // matched against Document.requirementKey
  label: string; // human-readable, shown in the "Why X%?" breakdown
  docType: DocType;
  minIssuerClass: IssuerClass; // minimum class for FULL weight
  weight: number;
  missingLabel?: string; // breakdown copy when unmet (defaults to "Not found")
}

export interface StageRule {
  label: string;
  requirements: Requirement[];
}

// Weight multiplier by issuer class. A document from a lower class than the
// requirement's minimum still counts, but earns the ratio of its class weight
// to the required class weight (so owner-provided evidence is worth 0.4/1.0
// of a building-control requirement, etc.).
export const issuerWeights: Record<IssuerClass, number> = {
  building_control: 1.0,
  registered_professional: 0.9,
  firm: 0.7,
  owner_provided: 0.4,
};

export const stageRules: Record<string, StageRule> = {
  // ── Extension / structural alteration ──────────────────────────────────
  planning_granted: {
    label: "Planning permission granted",
    requirements: [
      {
        key: "decision_notice",
        label: "Planning decision notice",
        docType: "certificate",
        minIssuerClass: "building_control",
        weight: 3,
      },
      {
        key: "approved_drawings",
        label: "Approved drawings",
        docType: "drawing",
        minIssuerClass: "firm",
        weight: 1,
      },
    ],
  },
  structural_design: {
    label: "Structural design completed",
    requirements: [
      {
        key: "calculations",
        label: "Structural calculations",
        docType: "calculation",
        minIssuerClass: "registered_professional",
        weight: 3,
      },
      {
        key: "drawing_package",
        label: "Building Regulations drawing package",
        docType: "drawing",
        minIssuerClass: "registered_professional",
        weight: 2,
      },
    ],
  },
  built_inspected: {
    label: "Built & inspected",
    requirements: [
      {
        key: "completion_photos",
        label: "Completion photographs",
        docType: "photo",
        minIssuerClass: "firm",
        weight: 1,
      },
      {
        key: "electrical_certificate",
        label: "Electrical installation certificate",
        docType: "certificate",
        minIssuerClass: "registered_professional",
        weight: 2,
      },
    ],
  },
  signed_off: {
    label: "Signed off",
    requirements: [
      {
        key: "completion_certificate",
        label: "Building Regulations completion certificate",
        docType: "certificate",
        minIssuerClass: "building_control",
        weight: 5,
      },
    ],
  },
  warranty_active: {
    label: "Warranty active",
    requirements: [
      {
        key: "warranty_certificate",
        label: "Warranty certificate",
        docType: "certificate",
        minIssuerClass: "firm",
        weight: 2,
      },
    ],
  },

  // ── Electrical work (rewire, consumer unit change) ─────────────────────
  electrical_installation: {
    label: "Electrical installation completed",
    requirements: [
      {
        key: "electrical_certificate",
        label: "Electrical installation certificate (BS 7671)",
        docType: "certificate",
        minIssuerClass: "registered_professional",
        weight: 3,
      },
    ],
  },

  // ── Structural survey ──────────────────────────────────────────────────
  instructed: {
    label: "Instructed",
    requirements: [
      {
        key: "instruction_letter",
        label: "Letter of instruction",
        docType: "other",
        minIssuerClass: "firm",
        weight: 1,
      },
    ],
  },
  inspected: {
    label: "Inspected",
    requirements: [
      {
        key: "site_notes",
        label: "Inspection notes / photographs",
        docType: "photo",
        minIssuerClass: "registered_professional",
        weight: 1,
      },
    ],
  },
  report_issued: {
    label: "Report issued",
    requirements: [
      {
        key: "survey_report",
        label: "Survey report",
        docType: "report",
        minIssuerClass: "registered_professional",
        weight: 4,
      },
    ],
  },

  // ── Building Regulations application ───────────────────────────────────
  submitted: {
    label: "Submitted",
    requirements: [
      {
        key: "application",
        label: "Application submission",
        docType: "other",
        minIssuerClass: "firm",
        weight: 1,
      },
    ],
  },
  approved: {
    label: "Approved",
    requirements: [
      {
        key: "approval_notice",
        label: "Approval notice",
        docType: "certificate",
        minIssuerClass: "building_control",
        weight: 3,
      },
    ],
  },
  completion_certificate: {
    label: "Completion certificate",
    requirements: [
      {
        key: "completion_certificate",
        label: "Completion certificate",
        docType: "certificate",
        minIssuerClass: "building_control",
        weight: 5,
      },
    ],
  },

  // ── Owner-provided historical events (boiler, roof, etc.) ──────────────
  owner_installation: {
    label: "Installation / work carried out",
    requirements: [
      // The commissioning certificate is the overwhelming evidence for an
      // installation; the identity checks refine rather than dominate.
      {
        key: "commissioning_certificate",
        label: "Commissioning / benchmark certificate",
        docType: "certificate",
        minIssuerClass: "registered_professional",
        weight: 12,
        missingLabel: "Not on record",
      },
      {
        key: "installer_identity",
        label: "Installer identity",
        docType: "other",
        minIssuerClass: "registered_professional",
        weight: 1,
        missingLabel: "Not verified",
      },
      {
        key: "registration_check",
        label: "Registration at date of work",
        docType: "other",
        minIssuerClass: "registered_professional",
        weight: 1,
        missingLabel: "Not confirmed",
      },
      {
        key: "regs_notification",
        label: "Building Regulations notification",
        docType: "certificate",
        minIssuerClass: "building_control",
        weight: 1,
        missingLabel: "Not found",
      },
    ],
  },
  owner_work_evidence: {
    label: "Owner evidence of work",
    requirements: [
      {
        key: "invoice",
        label: "Invoice",
        docType: "invoice",
        minIssuerClass: "firm",
        weight: 4,
        missingLabel: "Not on record",
      },
      {
        key: "photos",
        label: "Photographs",
        docType: "photo",
        minIssuerClass: "owner_provided",
        weight: 2,
        missingLabel: "Not on record",
      },
      {
        key: "contractor_identity",
        label: "Contractor identity",
        docType: "other",
        minIssuerClass: "registered_professional",
        weight: 3,
        missingLabel: "Not verified",
      },
    ],
  },

  // Custom stages created without a template: no declared requirements.
  // Their level is driven by whether any sealed evidence exists at all.
  custom: {
    label: "Custom stage",
    requirements: [],
  },
};

// Event-level modifiers.
export const eventRules = {
  // Events flagged origin=owner_provided can never exceed this level,
  // whatever their evidence — issuer identity was not checked at the time.
  ownerProvidedCap: 65,
  // Applied when an event lists professionals but none is identity-verified.
  identityUnverifiedFactor: 0.8,
  // Verification bands for display (chip colour + label).
  bands: [
    { min: 85, key: "high", label: "High" },
    { min: 50, key: "mid", label: "Partial" },
    { min: 0, key: "low", label: "Low" },
  ],
};
