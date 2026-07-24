// Share-scope filtering. These rules decide what each token scope may see —
// enforced both when rendering the record page AND at the document
// byte-serving layer, so a link can never fetch what its scope hides.

export type Scope = "owner" | "solicitor" | "agent_buyer" | "insurer_surveyor";

interface ScopeRules {
  /** null = all asset kinds; otherwise only events on these asset kinds */
  assetKinds: string[] | null;
  /** predicate over document {scopeClass, docType} */
  allowDocument: (doc: { scopeClass: string; docType: string }) => boolean;
  /** whether the share modal is available (owner only) */
  canShare: boolean;
  label: string;
}

export const scopeRules: Record<Scope, ScopeRules> = {
  owner: {
    assetKinds: null,
    allowDocument: () => true,
    canShare: true,
    label: "Homeowner",
  },
  solicitor: {
    // Full record — every event, stage and sealed document.
    assetKinds: null,
    allowDocument: () => true,
    canShare: false,
    label: "Solicitor / conveyancer view",
  },
  agent_buyer: {
    // Timeline, verification levels and certificates — working drawings
    // (and calculations) stay private.
    assetKinds: null,
    allowDocument: (d) => d.scopeClass === "certificate",
    canShare: false,
    label: "Estate agent / buyer view",
  },
  insurer_surveyor: {
    // Structural events, surveys and photographs relevant to condition.
    assetKinds: ["structure", "roof", "whole_property"],
    allowDocument: (d) =>
      d.scopeClass === "structural" ||
      d.scopeClass === "certificate" ||
      d.docType === "photo" ||
      d.docType === "report",
    canShare: false,
    label: "Insurer / surveyor view",
  },
};

export function eventVisibleToScope(scope: Scope, assetKind: string): boolean {
  const rules = scopeRules[scope];
  return rules.assetKinds === null || rules.assetKinds.includes(assetKind);
}

export function documentVisibleToScope(
  scope: Scope,
  doc: { scopeClass: string; docType: string }
): boolean {
  return scopeRules[scope].allowDocument(doc);
}
