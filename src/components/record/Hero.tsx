import { ShieldIcon } from "./icons";
import type { RecordVM } from "./vm";

export function Hero({ vm }: { vm: RecordVM }) {
  return (
    <section className="hero" id="top">
      <div className="hero-in">
        <div>
          <div className="eyebrow">{vm.eyebrow}</div>
          <h1 className="serif">{vm.addressLine}</h1>
          <div className="idline">
            Record ID: <span className="mono">{vm.recordId}</span>
            {vm.uprn && (
              <>
                <span className="sep">·</span> UPRN: <span className="mono">{vm.uprn}</span>
              </>
            )}
            {!vm.uprn && vm.uprnNote && (
              <>
                <span className="sep">·</span> {vm.uprnNote}
              </>
            )}
          </div>
        </div>
        <div className="seal" role="group" aria-label="Record verification level">
          <div className="k">Verification level</div>
          <div className="pct serif">{vm.recordLevel === null ? "—" : `${vm.recordLevel}%`}</div>
          <div className="band">
            <ShieldIcon />
            {vm.recordLevel === null ? "No sealed evidence yet" : vm.recordBandLabel}
          </div>
          <div className="liability">
            Verified means documents exist, issuers are identity-checked and files are unaltered
            since issue — never a statement about the quality of the work.
          </div>
        </div>
      </div>
    </section>
  );
}
