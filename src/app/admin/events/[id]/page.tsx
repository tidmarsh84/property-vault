import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeVerification } from "@/lib/verification";
import { stageRules } from "../../../../../config/verification-rules";
import { AdminShell } from "../../AdminShell";
import {
  addProfessionalAction,
  addStageAction,
  deleteProfessionalAction,
  updateEventAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      asset: { include: { property: true } },
      professionals: { orderBy: { position: "asc" } },
      stages: { orderBy: { position: "asc" }, include: { documents: true } },
    },
  });
  if (!event || event.asset.property.organisationId !== user.organisationId) notFound();
  const property = event.asset.property;

  const result = computeVerification({
    origin: event.origin,
    historical: event.historical,
    professionals: event.professionals,
    stages: event.stages.map((s) => ({
      typeKey: s.typeKey,
      documents: s.documents.map((d) => ({
        issuerClass: d.issuerClass,
        docType: d.docType,
        requirementKey: d.requirementKey,
      })),
    })),
  });

  const updateAction = updateEventAction.bind(null, event.id);
  const stageAction = addStageAction.bind(null, event.id);
  const profAction = addProfessionalAction.bind(null, event.id);

  return (
    <AdminShell user={user}>
      <div className="crumbs">
        <Link href="/admin">Properties</Link> /{" "}
        <Link href={`/admin/properties/${property.id}`}>{property.recordId}</Link> / {event.title}
      </div>
      <div className="head-row">
        <div>
          <h1 className="serif">{event.title}</h1>
          <p className="sub">
            {event.asset.name} · {property.addressLine1}, {property.city}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: ".64rem", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted)" }}>
            Verification level
          </div>
          <div className="serif" style={{ fontSize: "2.2rem", color: "var(--gold)", lineHeight: 1.1 }}>
            {event.historical ? "—" : `${result.level}%`}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="c-h"><span className="t">Event details</span></div>
        <div className="c-b">
          <form action={updateAction} className="stack" style={{ maxWidth: "100%" }}>
            <div className="grid-3">
              <label className="f">
                <span className="l">Title</span>
                <input type="text" name="title" defaultValue={event.title} required />
              </label>
              <label className="f">
                <span className="l">Lifecycle</span>
                <select name="lifecycle" defaultValue={event.lifecycle}>
                  <option value="draft">Draft</option>
                  <option value="awaiting_evidence">Awaiting evidence</option>
                  <option value="issued">Issued (visible to homeowner)</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="f">
                <span className="l">Display period</span>
                <input type="text" name="periodLabel" defaultValue={event.periodLabel ?? ""} />
              </label>
            </div>
            <div className="grid-2">
              <label className="f">
                <span className="l">Started</span>
                <input type="date" name="startedOn" defaultValue={event.startedOn?.toISOString().slice(0, 10)} />
              </label>
              <label className="f">
                <span className="l">Completed</span>
                <input type="date" name="completedOn" defaultValue={event.completedOn?.toISOString().slice(0, 10)} />
              </label>
            </div>
            <label className="f">
              <span className="l">Summary line</span>
              <input type="text" name="summary" defaultValue={event.summary ?? ""} />
            </label>
            <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".85rem", color: "var(--text-soft)" }}>
                <input type="checkbox" name="ownerProvided" defaultChecked={event.origin === "owner_provided"} />
                Owner-provided (caps verification at 65%)
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".85rem", color: "var(--text-soft)" }}>
                <input type="checkbox" name="historical" defaultChecked={event.historical} />
                Historical (no verification level shown)
              </label>
              <button className="btn btn-gold btn-sm" type="submit">Save details</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="c-h"><span className="t">Stages</span></div>
        {event.stages.map((s, i) => (
          <div className="stage-row" key={s.id}>
            <span className={`num ${s.status === "complete" ? "done" : ""}`}>{s.status === "complete" ? "✓" : i + 1}</span>
            <div>
              <div className="sn">{s.name}</div>
              <div className="sm">
                {stageRules[s.typeKey]?.label ?? s.typeKey}
                {s.detail ? ` · ${s.detail}` : ""}
              </div>
            </div>
            <div className="right">
              <span>{s.documents.length} doc{s.documents.length === 1 ? "" : "s"}</span>
              <Link className="btn btn-ghost btn-sm" href={`/admin/events/${event.id}/stages/${s.id}`}>
                Evidence
              </Link>
            </div>
          </div>
        ))}
        <div className="c-b" style={{ borderTop: "1px solid var(--line)" }}>
          <form action={stageAction} className="grid-3" style={{ alignItems: "end" }}>
            <label className="f">
              <span className="l">Add stage</span>
              <input type="text" name="name" placeholder="Stage name" required />
            </label>
            <label className="f">
              <span className="l">Stage type (drives evidence rules)</span>
              <select name="typeKey" defaultValue="custom">
                {Object.entries(stageRules).map(([key, rule]) => (
                  <option key={key} value={key}>{rule.label}</option>
                ))}
              </select>
            </label>
            <div>
              <button className="btn btn-ghost" type="submit">+ Add stage</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="c-h"><span className="t">Contributing professionals</span></div>
        <table>
          <thead>
            <tr><th>Role</th><th>Firm</th><th>Registration</th><th>Identity verified</th><th></th></tr>
          </thead>
          <tbody>
            {event.professionals.map((p) => (
              <tr key={p.id}>
                <td>{p.role}</td>
                <td style={{ color: "var(--text)" }}>{p.firmName}</td>
                <td>{p.registrationBody ? `${p.registrationBody} ${p.registrationNumber ?? ""}` : "—"}</td>
                <td>{p.identityVerified ? <span className="pill gold"><span className="dot" />Verified</span> : <span className="pill grey"><span className="dot" />No</span>}</td>
                <td>
                  <form action={deleteProfessionalAction.bind(null, p.id)}>
                    <button className="btn btn-danger btn-sm" type="submit">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="c-b" style={{ borderTop: "1px solid var(--line)" }}>
          <form action={profAction} className="grid-3" style={{ alignItems: "end" }}>
            <label className="f">
              <span className="l">Role</span>
              <input type="text" name="role" placeholder="Structural Engineer" required />
            </label>
            <label className="f">
              <span className="l">Firm</span>
              <input type="text" name="firmName" placeholder="Paddick Engineering Ltd" required />
            </label>
            <div className="grid-2" style={{ alignItems: "end" }}>
              <label className="f">
                <span className="l">Reg. body / no.</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="text" name="registrationBody" placeholder="ICE" style={{ width: 90 }} />
                  <input type="text" name="registrationNumber" placeholder="68231" />
                </div>
              </label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: ".8rem", color: "var(--text-soft)" }}>
                  <input type="checkbox" name="identityVerified" /> Verified
                </label>
                <button className="btn btn-ghost btn-sm" type="submit">+ Add</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {!event.historical && (
        <div className="card">
          <div className="c-h"><span className="t">Why {result.level}%? — the homeowner sees this breakdown</span></div>
          <div className="c-b">
            <p style={{ fontSize: ".78rem", color: "var(--muted)", marginBottom: 8 }}>
              Verification reflects what is evidenced and identity-checked — not the quality of the work.
              Rules live in <span className="mono">config/verification-rules.ts</span>.
            </p>
            {result.rows.map((r, i) => (
              <div className="ver-row" key={i}>
                <span>
                  {r.label}
                  <span style={{ color: "var(--muted)" }}> · {stageRules[r.stageTypeKey]?.label ?? r.stageTypeKey}</span>
                </span>
                <span className={r.met ? "yes" : "no"}>{r.met ? r.metLabel : r.metLabel}</span>
              </div>
            ))}
            {result.capApplied !== null && (
              <div className="ver-row">
                <span>Owner-provided cap applied</span>
                <span className="no">capped at {result.capApplied}%</span>
              </div>
            )}
            {result.identityFactorApplied && (
              <div className="ver-row">
                <span>No listed professional is identity-verified</span>
                <span className="no">×0.8</span>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
