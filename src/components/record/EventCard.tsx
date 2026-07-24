import { GoldTick } from "./icons";
import { StageChain } from "./StageChain";
import type { EventVM } from "./vm";

function nodeClass(ev: EventVM): string {
  if (ev.historical) return "event";
  if (ev.band === "high") return "event verified";
  return "event partial";
}

export function EventCard({ ev, anchorId }: { ev: EventVM; anchorId?: string }) {
  return (
    <div className={nodeClass(ev)} id={anchorId}>
      <span className="node" aria-hidden="true" />
      <div className="when">{ev.when}</div>
      <div className="ev-title-row">
        <h3>{ev.title}</h3>
        <span className={`conf ${ev.historical ? "low" : ev.band}`}>
          <span className="dot" />
          {ev.chipLabel}
        </span>
      </div>
      {ev.whoLine && <div className="who">{ev.whoLine}</div>}

      {ev.parties.length > 0 && (
        <div className="parties" aria-label="Contributing professionals">
          {ev.parties.map((p, i) => (
            <span className="party" key={i}>
              {p.verified && <GoldTick />}
              <span className="role">{p.role}</span>
              <span className="firm">{p.firmName}</span>
            </span>
          ))}
        </div>
      )}

      {ev.showStageChain && <StageChain stages={ev.stages} />}

      {ev.breakdown && (
        <div className="conf-panel">
          <div className="cp-t">{ev.breakdownTitle}</div>
          <div className="cp-note">
            Verification reflects what is evidenced and identity-checked — not the quality of the
            work.
          </div>
          {ev.breakdown.map((row, i) => (
            <div className="cp-row" key={i}>
              <span>{row.label}</span>
              <span className={row.met ? "yes" : "no"}>{row.statusLabel}</span>
            </div>
          ))}
          {ev.invitePrompt && (
            <div className="ev-missing" style={{ marginTop: 8 }}>
              <span>{ev.invitePrompt.text}</span>
              <a className="btn btn-ghost" href={ev.invitePrompt.mailto}>
                Invite installer
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
