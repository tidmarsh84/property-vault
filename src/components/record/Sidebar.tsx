import { DownloadIcon, ShieldIcon } from "./icons";
import type { RecordVM } from "./vm";

export function Sidebar({ vm }: { vm: RecordVM }) {
  return (
    <aside className="sidebar">
      <div className="sum-card">
        <div className="sc-h">Property summary</div>
        <div className="sum-row">
          <div className="k">Property type</div>
          <div className="v">{vm.propertyType}</div>
        </div>
        <div className="sum-row">
          <div className="k">Tenure</div>
          <div className="v">{vm.tenure}</div>
        </div>
        <div className="sum-row">
          <div className="k">UPRN</div>
          <div className="v mono">{vm.uprn ?? "Unavailable"}</div>
        </div>
        <div className="sum-row">
          <div className="k">Verified events</div>
          <div className="v">
            {vm.verifiedEvents} of {vm.totalEvents} · {vm.documentCount} sealed{" "}
            {vm.documentCount === 1 ? "document" : "documents"}
          </div>
        </div>
        <div className="sum-row">
          <div className="k">Record created</div>
          <div className="v">{vm.createdAt}</div>
        </div>
        <div className="sum-row">
          <div className="k">Last updated</div>
          <div className="v">{vm.lastUpdated}</div>
        </div>
        <div className="sum-foot">
          <a className="btn btn-ghost btn-block" href={vm.zipUrl}>
            Download summary
            <DownloadIcon />
          </a>
        </div>
      </div>
      <div className="integrity-mini">
        <ShieldIcon size={16} fillSoft />
        <div>
          Verified events are digitally signed by identity-checked professionals at the time of the
          work, then sealed so they cannot be altered afterwards — by anyone, including us. Verified
          refers to the record, never the quality of the work.
        </div>
      </div>
    </aside>
  );
}
