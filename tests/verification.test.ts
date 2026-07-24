import { describe, expect, it } from "vitest";
import { computeVerification } from "@/lib/verification";

// The seeded demo record's four events, as pure fixtures. These pin the
// rules config: if someone edits weights, these tests catch the drift.

const verifiedPro = [{ identityVerified: true }];

describe("verification level calculation", () => {
  it("fully evidenced extension computes 100%", () => {
    const r = computeVerification({
      origin: "professional",
      professionals: verifiedPro,
      stages: [
        {
          typeKey: "planning_granted",
          documents: [
            { issuerClass: "building_control", docType: "certificate", requirementKey: "decision_notice" },
            { issuerClass: "firm", docType: "drawing", requirementKey: "approved_drawings" },
          ],
        },
        {
          typeKey: "structural_design",
          documents: [
            { issuerClass: "registered_professional", docType: "calculation", requirementKey: "calculations" },
            { issuerClass: "registered_professional", docType: "drawing", requirementKey: "drawing_package" },
          ],
        },
        {
          typeKey: "built_inspected",
          documents: [
            { issuerClass: "firm", docType: "photo", requirementKey: "completion_photos" },
            { issuerClass: "registered_professional", docType: "certificate", requirementKey: "electrical_certificate" },
          ],
        },
        {
          typeKey: "signed_off",
          documents: [
            { issuerClass: "building_control", docType: "certificate", requirementKey: "completion_certificate" },
          ],
        },
        {
          typeKey: "warranty_active",
          documents: [
            { issuerClass: "firm", docType: "certificate", requirementKey: "warranty_certificate" },
          ],
        },
      ],
    });
    expect(r.level).toBe(100);
    expect(r.band).toBe("high");
  });

  it("rewire with sealed BS 7671 certificate computes 100%", () => {
    const r = computeVerification({
      origin: "professional",
      professionals: verifiedPro,
      stages: [
        {
          typeKey: "electrical_installation",
          documents: [
            { issuerClass: "registered_professional", docType: "certificate", requirementKey: "electrical_certificate" },
          ],
        },
      ],
    });
    expect(r.level).toBe(100);
  });

  it("owner-provided boiler with only a benchmark certificate computes 62%", () => {
    const r = computeVerification({
      origin: "owner_provided",
      professionals: [],
      stages: [
        {
          typeKey: "owner_installation",
          documents: [
            { issuerClass: "firm", docType: "certificate", requirementKey: "commissioning_certificate" },
          ],
        },
      ],
    });
    expect(r.level).toBe(62);
    expect(r.band).toBe("mid");
    // breakdown mirrors the prototype's "Why 62%?" panel
    const unmet = r.rows.filter((row) => !row.met).map((row) => row.metLabel);
    expect(unmet).toContain("Not verified");
    expect(unmet).toContain("Not confirmed");
    expect(unmet).toContain("Not found");
  });

  it("owner-provided roof with invoice + photos computes 48%", () => {
    const r = computeVerification({
      origin: "owner_provided",
      professionals: [],
      stages: [
        {
          typeKey: "owner_work_evidence",
          documents: [
            { issuerClass: "owner_provided", docType: "invoice", requirementKey: "invoice" },
            { issuerClass: "owner_provided", docType: "photo", requirementKey: "photos" },
          ],
        },
      ],
    });
    expect(r.level).toBe(48);
  });

  it("owner-provided events are capped at 65% however strong the evidence", () => {
    const r = computeVerification({
      origin: "owner_provided",
      professionals: [],
      stages: [
        {
          typeKey: "signed_off",
          documents: [
            { issuerClass: "building_control", docType: "certificate", requirementKey: "completion_certificate" },
          ],
        },
      ],
    });
    expect(r.level).toBe(65);
    expect(r.capApplied).toBe(65);
  });

  it("applies the ×0.8 factor when professionals are listed but none identity-verified", () => {
    const base = {
      origin: "professional",
      stages: [
        {
          typeKey: "signed_off",
          documents: [
            { issuerClass: "building_control", docType: "certificate", requirementKey: "completion_certificate" },
          ],
        },
      ],
    };
    const unverified = computeVerification({ ...base, professionals: [{ identityVerified: false }] });
    const verified = computeVerification({ ...base, professionals: [{ identityVerified: true }] });
    expect(verified.level).toBe(100);
    expect(unverified.level).toBe(80);
    expect(unverified.identityFactorApplied).toBe(true);
  });
});
