import { EvidenceRow } from "./EvidenceRow";
import type { StageVM } from "./vm";

export function StageChain({ stages }: { stages: StageVM[] }) {
  return (
    <div className="stages">
      {stages.map((stage) => (
        <details className="stage" key={stage.id} open={stage.defaultOpen}>
          <summary>
            <span className={`st-mark ${stage.done ? "done" : "pending"}`} aria-hidden="true" />
            <span className="st-main">
              <span className="sn">{stage.name}</span>
              <br />
              <span className="sm">{stage.issuerLine}</span>
            </span>
            <span className="st-count">
              {stage.countLabel} <span className="chev">›</span>
            </span>
          </summary>
          <div className="evidence">
            {stage.documents.map((doc) => (
              <EvidenceRow key={doc.id} doc={doc} />
            ))}
            {stage.documents.length === 0 && stage.missing.length === 0 && (
              <div className="ev-meta" style={{ padding: "10px 0" }}>
                {stage.hasRequirements ? "No evidence on record yet." : "No requirements defined."}
              </div>
            )}
            {stage.missing.map((label) => (
              <div className="ev-missing" key={label}>
                <span>{label} — not yet on record.</span>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
