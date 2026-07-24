// Event templates — each pre-populates its stage chain.

export interface TemplateStage {
  stageType: string;
  name: string;
}

export interface EventTemplate {
  id: string;
  label: string;
  description: string;
  stages: TemplateStage[];
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "extension",
    label: "Extension / structural alteration",
    description:
      "Planning granted → Structural design → Built & inspected → Signed off → Warranty active",
    stages: [
      { stageType: "planning_granted", name: "Planning permission granted" },
      { stageType: "structural_design", name: "Structural design completed" },
      { stageType: "built_inspected", name: "Built & inspected" },
      { stageType: "signed_off", name: "Signed off" },
      { stageType: "warranty_active", name: "Warranty active" },
    ],
  },
  {
    id: "survey",
    label: "Structural survey",
    description: "Instructed → Inspected → Report issued",
    stages: [
      { stageType: "survey_instructed", name: "Instructed" },
      { stageType: "survey_inspected", name: "Inspected" },
      { stageType: "survey_report", name: "Report issued" },
    ],
  },
  {
    id: "building_regs",
    label: "Building Regulations application",
    description: "Submitted → Approved → Completion certificate",
    stages: [
      { stageType: "br_submitted", name: "Submitted" },
      { stageType: "br_approved", name: "Approved" },
      { stageType: "br_completion", name: "Completion certificate" },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    description: "Blank — add stages yourself",
    stages: [],
  },
];
