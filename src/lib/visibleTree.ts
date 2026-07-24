// Scope filtering happens server-side in exactly this one place. visibleTree
// prunes events/stages/documents before the record page renders, and the same
// function gates /doc and /zip — which is what makes the token-scoping tests
// one-liners.
//
// Scopes:
//   owner / solicitor  — full record: every issued event, stage and sealed document.
//   agent_buyer        — timeline, verification levels and certificates only;
//                        working drawings and calculations excluded.
//   insurer_surveyor   — structural events, surveys and photographs relevant
//                        to condition.
//
// Only `issued` events ever leave this function, whatever the scope.

import { rules, type DocClass } from "./verification-rules";
import type { TokenScope } from "./types";

interface DocNode {
  id: string;
  requirementId: string | null;
  mimeType: string;
  [key: string]: unknown;
}

interface StageNode {
  stageType: string;
  documents: DocNode[];
  [key: string]: unknown;
}

interface EventNode {
  status: string;
  templateType: string | null;
  stages: StageNode[];
  asset?: { type: string } | null;
  [key: string]: unknown;
}

interface PropertyNode<E extends EventNode> {
  events: E[];
}

export function docClassOf(doc: DocNode, stageType: string): DocClass {
  const req = rules.stageTypes[stageType]?.requirements.find((r) => r.id === doc.requirementId);
  if (req?.docClass) return req.docClass;
  if (doc.mimeType.startsWith("image/")) return "photo";
  return "certificate";
}

const AGENT_BUYER_CLASSES: DocClass[] = ["certificate", "photo"];
const INSURER_CLASSES: DocClass[] = ["certificate", "photo", "report", "calculation"];
const STRUCTURAL_ASSET_TYPES = new Set(["extension", "roof", "structure", "whole_property"]);

function eventIsStructural(event: EventNode): boolean {
  if (event.templateType === "extension" || event.templateType === "survey") return true;
  return Boolean(event.asset && STRUCTURAL_ASSET_TYPES.has(event.asset.type));
}

function docVisible(scope: TokenScope, event: EventNode, stage: StageNode, doc: DocNode): boolean {
  if (scope === "owner" || scope === "solicitor") return true;
  const cls = docClassOf(doc, stage.stageType);
  if (scope === "agent_buyer") return AGENT_BUYER_CLASSES.includes(cls);
  // insurer_surveyor
  return INSURER_CLASSES.includes(cls);
}

function eventVisible(scope: TokenScope, event: EventNode): boolean {
  if (event.status !== "issued") return false;
  if (scope === "insurer_surveyor") return eventIsStructural(event);
  return true;
}

/**
 * Prune a property tree to what the presented scope may see. Returns new
 * objects; never mutates the input. Events keep their stage chain (the
 * timeline is visible to every scope) — only documents are filtered within it.
 */
export function visibleTree<E extends EventNode, P extends PropertyNode<E>>(
  property: P,
  scope: TokenScope,
): P {
  return {
    ...property,
    events: property.events
      .filter((event) => eventVisible(scope, event))
      .map((event) => ({
        ...event,
        stages: event.stages.map((stage) => ({
          ...stage,
          documents: stage.documents.filter((doc) => docVisible(scope, event, stage, doc)),
        })),
      })),
  };
}

/** Gate for /doc and /zip: is this document visible to the scope? */
export function documentVisible<E extends EventNode>(
  property: PropertyNode<E>,
  scope: TokenScope,
  documentId: string,
): boolean {
  for (const event of visibleTree(property, scope).events) {
    for (const stage of event.stages) {
      if (stage.documents.some((d) => d.id === documentId)) return true;
    }
  }
  return false;
}
