import { describe, expect, it } from "vitest";
import { documentVisibleToScope, eventVisibleToScope } from "@/lib/scope";

describe("token scope filtering", () => {
  const structuralCalc = { scopeClass: "structural", docType: "calculation" };
  const drawing = { scopeClass: "structural", docType: "drawing" };
  const certificate = { scopeClass: "certificate", docType: "certificate" };
  const photo = { scopeClass: "general", docType: "photo" };
  const invoice = { scopeClass: "general", docType: "invoice" };

  it("an agent/buyer link must NEVER serve structural calculations or drawings", () => {
    expect(documentVisibleToScope("agent_buyer", structuralCalc)).toBe(false);
    expect(documentVisibleToScope("agent_buyer", drawing)).toBe(false);
  });

  it("agent/buyer sees certificates only", () => {
    expect(documentVisibleToScope("agent_buyer", certificate)).toBe(true);
    expect(documentVisibleToScope("agent_buyer", photo)).toBe(false);
    expect(documentVisibleToScope("agent_buyer", invoice)).toBe(false);
  });

  it("solicitor and owner see everything", () => {
    for (const doc of [structuralCalc, drawing, certificate, photo, invoice]) {
      expect(documentVisibleToScope("solicitor", doc)).toBe(true);
      expect(documentVisibleToScope("owner", doc)).toBe(true);
    }
  });

  it("insurer/surveyor sees structural documents, certificates and photos", () => {
    expect(documentVisibleToScope("insurer_surveyor", structuralCalc)).toBe(true);
    expect(documentVisibleToScope("insurer_surveyor", certificate)).toBe(true);
    expect(documentVisibleToScope("insurer_surveyor", photo)).toBe(true);
    expect(documentVisibleToScope("insurer_surveyor", invoice)).toBe(false);
  });

  it("insurer/surveyor is limited to structural assets", () => {
    expect(eventVisibleToScope("insurer_surveyor", "structure")).toBe(true);
    expect(eventVisibleToScope("insurer_surveyor", "roof")).toBe(true);
    expect(eventVisibleToScope("insurer_surveyor", "whole_property")).toBe(true);
    expect(eventVisibleToScope("insurer_surveyor", "heating")).toBe(false);
    expect(eventVisibleToScope("insurer_surveyor", "electrical")).toBe(false);
    for (const kind of ["structure", "roof", "heating", "electrical", "solar", "whole_property"]) {
      expect(eventVisibleToScope("owner", kind)).toBe(true);
      expect(eventVisibleToScope("solicitor", kind)).toBe(true);
      expect(eventVisibleToScope("agent_buyer", kind)).toBe(true);
    }
  });
});
