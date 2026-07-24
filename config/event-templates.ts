// Event templates — each pre-populates its typical stage chain in the admin.
// Stage typeKeys reference config/verification-rules.ts.

export interface TemplateStage {
  typeKey: string;
  name: string;
}

export interface EventTemplate {
  key: string;
  label: string;
  description: string;
  defaultAssetKind: string;
  stages: TemplateStage[];
}

export const eventTemplates: EventTemplate[] = [
  {
    key: "extension",
    label: "Extension / structural alteration",
    description:
      "Planning granted → Structural design completed → Built & inspected → Signed off → Warranty active",
    defaultAssetKind: "structure",
    stages: [
      { typeKey: "planning_granted", name: "Planning permission granted" },
      { typeKey: "structural_design", name: "Structural design completed" },
      { typeKey: "built_inspected", name: "Built & inspected" },
      { typeKey: "signed_off", name: "Signed off — completion certificate issued" },
      { typeKey: "warranty_active", name: "Warranty active" },
    ],
  },
  {
    key: "structural_survey",
    label: "Structural survey",
    description: "Instructed → Inspected → Report issued",
    defaultAssetKind: "whole_property",
    stages: [
      { typeKey: "instructed", name: "Instructed" },
      { typeKey: "inspected", name: "Inspected" },
      { typeKey: "report_issued", name: "Report issued" },
    ],
  },
  {
    key: "building_regs",
    label: "Building Regulations application",
    description: "Submitted → Approved → Completion certificate",
    defaultAssetKind: "structure",
    stages: [
      { typeKey: "submitted", name: "Submitted" },
      { typeKey: "approved", name: "Approved" },
      { typeKey: "completion_certificate", name: "Completion certificate" },
    ],
  },
  {
    key: "custom",
    label: "Custom",
    description: "Start with blank stages and build your own chain.",
    defaultAssetKind: "other",
    stages: [],
  },
];

export function getTemplate(key: string): EventTemplate | undefined {
  return eventTemplates.find((t) => t.key === key);
}
