import { describe, expect, it } from "vitest";
import { documentVisible, visibleTree } from "@/lib/visibleTree";

// A miniature 14 Acacia Avenue: extension (with calcs + drawings + certs +
// photos), a draft event, and a non-structural boiler event.
const calcsDoc = { id: "d-calcs", requirementId: "calcs", mimeType: "application/pdf" };
const drawingsDoc = { id: "d-drawings", requirementId: "regs_drawings", mimeType: "application/pdf" };
const certDoc = { id: "d-cert", requirementId: "completion_cert", mimeType: "application/pdf" };
const photosDoc = { id: "d-photos", requirementId: "completion_photos", mimeType: "application/pdf" };
const benchmarkDoc = { id: "d-benchmark", requirementId: "benchmark_cert", mimeType: "application/pdf" };

const property = {
  events: [
    {
      id: "e-extension",
      status: "issued",
      templateType: "extension",
      asset: { type: "extension" },
      stages: [
        { stageType: "structural_design", documents: [calcsDoc, drawingsDoc] },
        { stageType: "signed_off", documents: [certDoc] },
        { stageType: "built_inspected", documents: [photosDoc] },
      ],
    },
    {
      id: "e-draft",
      status: "draft",
      templateType: "extension",
      asset: { type: "extension" },
      stages: [{ stageType: "signed_off", documents: [{ id: "d-draft", requirementId: "completion_cert", mimeType: "application/pdf" }] }],
    },
    {
      id: "e-boiler",
      status: "issued",
      templateType: "custom",
      asset: { type: "boiler" },
      stages: [{ stageType: "boiler_installed", documents: [benchmarkDoc] }],
    },
  ],
};

const docIds = (scope: Parameters<typeof visibleTree>[1]) =>
  visibleTree(property, scope).events.flatMap((e) => e.stages.flatMap((s) => s.documents.map((d) => d.id)));

describe("visibleTree scoping", () => {
  it("never serves draft events to any scope", () => {
    for (const scope of ["owner", "solicitor", "agent_buyer", "insurer_surveyor"] as const) {
      expect(visibleTree(property, scope).events.map((e) => e.id)).not.toContain("e-draft");
    }
  });

  it("gives owner and solicitor the full issued record", () => {
    expect(docIds("owner").sort()).toEqual(["d-benchmark", "d-calcs", "d-cert", "d-drawings", "d-photos"]);
    expect(docIds("solicitor").sort()).toEqual(["d-benchmark", "d-calcs", "d-cert", "d-drawings", "d-photos"]);
  });

  it("an agent-scope link must never serve structural calculations or working drawings", () => {
    const agentDocs = docIds("agent_buyer");
    expect(agentDocs).not.toContain("d-calcs");
    expect(agentDocs).not.toContain("d-drawings");
    expect(agentDocs).toContain("d-cert"); // certificates stay
    expect(documentVisible(property, "agent_buyer", "d-calcs")).toBe(false);
    expect(documentVisible(property, "agent_buyer", "d-cert")).toBe(true);
  });

  it("agent scope keeps the full timeline (events prune documents, not entries)", () => {
    expect(visibleTree(property, "agent_buyer").events.map((e) => e.id)).toEqual(["e-extension", "e-boiler"]);
  });

  it("insurer/surveyor scope is limited to structural events", () => {
    const events = visibleTree(property, "insurer_surveyor").events.map((e) => e.id);
    expect(events).toContain("e-extension");
    expect(events).not.toContain("e-boiler");
    expect(documentVisible(property, "insurer_surveyor", "d-benchmark")).toBe(false);
    expect(documentVisible(property, "insurer_surveyor", "d-photos")).toBe(true);
  });

  it("gates /doc and /zip through the same function (draft docs invisible everywhere)", () => {
    for (const scope of ["owner", "solicitor", "agent_buyer", "insurer_surveyor"] as const) {
      expect(documentVisible(property, scope, "d-draft")).toBe(false);
    }
  });
});
