import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPilotSummary } from "@/lib/pilot-stats";
import { AdminShell } from "../AdminShell";

export const dynamic = "force-dynamic";

const ukDateTime = (d: Date | null) =>
  d
    ? d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 150 }}>
      <div className="c-b" style={{ textAlign: "center" }}>
        <div style={{ fontSize: ".64rem", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>
          {label}
        </div>
        <div className="serif" style={{ fontSize: "2.1rem", color: "var(--gold)", lineHeight: 1.2, margin: "4px 0 2px" }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const s = await getPilotSummary(user.organisationId);

  return (
    <AdminShell user={user}>
      <div className="head-row">
        <div>
          <h1 className="serif">Pilot analytics</h1>
          <p className="sub">
            What homeowners actually do with their records — the question this pilot exists to answer.
          </p>
        </div>
        <a className="btn btn-ghost" href="/admin/analytics/export">Export CSV</a>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat label="Open rate" value={`${s.openRate}%`} sub={`${s.openedCount} of ${s.issuedCount} issued records opened`} />
        <Stat label="Revisited after 7 days" value={`${s.revisited7Rate}%`} sub="of issued records" />
        <Stat label="Revisited after 30 days" value={`${s.revisited30Rate}%`} sub="of issued records" />
        <Stat label="Shared onward" value={`${s.sharedRate}%`} sub="created at least one share link" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="c-h"><span className="t">Most-viewed document types</span></div>
          <table>
            <tbody>
              {s.topDocTypes.length === 0 && (
                <tr><td style={{ color: "var(--muted)" }}>No document views yet.</td></tr>
              )}
              {s.topDocTypes.map((t) => (
                <tr key={t.docType}>
                  <td style={{ color: "var(--text)" }}>{t.docType}</td>
                  <td style={{ textAlign: "right" }}>{t.views} view{t.views === 1 ? "" : "s"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="c-h"><span className="t">Opens by device</span></div>
          <table>
            <tbody>
              {s.deviceSplit.length === 0 && (
                <tr><td style={{ color: "var(--muted)" }}>No opens yet.</td></tr>
              )}
              {s.deviceSplit.map((d) => (
                <tr key={d.deviceType}>
                  <td style={{ color: "var(--text)" }}>{d.deviceType}</td>
                  <td style={{ textAlign: "right" }}>{d.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="c-h"><span className="t">Per record</span></div>
        <table>
          <thead>
            <tr>
              <th>Record</th>
              <th>Opens</th>
              <th>Days</th>
              <th>Doc views</th>
              <th>Downloads</th>
              <th>Shares</th>
              <th>Share opens</th>
              <th>Last opened</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {s.records.map((r) => (
              <tr key={r.propertyId}>
                <td>
                  <span className="mono" style={{ color: "var(--gold-bright)" }}>{r.recordId}</span>
                  <div style={{ fontSize: ".76rem", color: "var(--muted)" }}>{r.address}</div>
                </td>
                <td>{r.opens}</td>
                <td>{r.distinctDays}</td>
                <td>{r.docViews}</td>
                <td>{r.docDownloads + r.downloadAllCount}</td>
                <td>{r.sharesCreated}{r.shareScopes.length ? ` (${r.shareScopes.join(", ")})` : ""}</td>
                <td>{r.shareOpens}</td>
                <td>{ukDateTime(r.lastOpen)}</td>
                <td>
                  <Link className="btn btn-ghost btn-sm" href={`/admin/analytics/${r.propertyId}`}>Timeline</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
