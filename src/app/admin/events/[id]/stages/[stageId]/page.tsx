import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stageRules } from "../../../../../../../config/verification-rules";
import { AdminShell } from "../../../../AdminShell";
import {
  deleteStageAction,
  updateDocumentMetaAction,
  updateStageAction,
  uploadDocumentsAction,
  uploadNewVersionAction,
} from "../../../../actions";
import { UploadForm } from "./UploadForm";

export const dynamic = "force-dynamic";

const ukDate = (d: Date | null) =>
  d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default async function StagePage({
  params,
}: {
  params: { id: string; stageId: string };
}) {
  const user = await requireUser();
  const stage = await prisma.stage.findUnique({
    where: { id: params.stageId },
    include: {
      event: { include: { asset: { include: { property: true } } } },
      documents: {
        include: { versions: { orderBy: { versionNo: "desc" }, include: { uploadedBy: true, receipt: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (
    !stage ||
    stage.eventId !== params.id ||
    stage.event.asset.property.organisationId !== user.organisationId
  )
    notFound();

  const event = stage.event;
  const property = event.asset.property;
  const rule = stageRules[stage.typeKey];
  const updateStage = updateStageAction.bind(null, stage.id);
  const deleteStage = deleteStageAction.bind(null, stage.id);

  return (
    <AdminShell user={user}>
      <div className="crumbs">
        <Link href="/admin">Properties</Link> /{" "}
        <Link href={`/admin/properties/${property.id}`}>{property.recordId}</Link> /{" "}
        <Link href={`/admin/events/${event.id}`}>{event.title}</Link> / {stage.name}
      </div>
      <h1 className="serif">{stage.name}</h1>
      <p className="sub">
        {rule?.label ?? stage.typeKey}
        {rule && rule.requirements.length > 0 && (
          <> · requires: {rule.requirements.map((r) => r.label).join(", ")}</>
        )}
      </p>

      <div className="card">
        <div className="c-h">
          <span className="t">Stage details</span>
          {stage.documents.length === 0 && (
            <form action={deleteStage}>
              <button className="btn btn-danger btn-sm" type="submit">Delete stage</button>
            </form>
          )}
        </div>
        <div className="c-b">
          <form action={updateStage} className="grid-3" style={{ alignItems: "end" }}>
            <label className="f">
              <span className="l">Name</span>
              <input type="text" name="name" defaultValue={stage.name} required />
            </label>
            <label className="f">
              <span className="l">Type</span>
              <select name="typeKey" defaultValue={stage.typeKey}>
                {Object.entries(stageRules).map(([key, r]) => (
                  <option key={key} value={key}>{r.label}</option>
                ))}
              </select>
            </label>
            <div className="grid-2" style={{ alignItems: "end" }}>
              <label className="f">
                <span className="l">Date</span>
                <input type="date" name="occurredOn" defaultValue={stage.occurredOn?.toISOString().slice(0, 10)} />
              </label>
              <label className="f">
                <span className="l">Status</span>
                <select name="status" defaultValue={stage.status}>
                  <option value="pending">Pending</option>
                  <option value="complete">Complete</option>
                </select>
              </label>
            </div>
            <label className="f" style={{ gridColumn: "1 / span 2" }}>
              <span className="l">Detail line (shown on the record)</span>
              <input type="text" name="detail" defaultValue={stage.detail ?? ""} placeholder="Leeds City Council · Ref 26/00847/FU" />
            </label>
            <div>
              <button className="btn btn-gold btn-sm" type="submit">Save stage</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="c-h"><span className="t">Upload evidence — sealed on upload</span></div>
        <div className="c-b">
          <UploadForm
            action={uploadDocumentsAction.bind(null, stage.id)}
            requirements={rule?.requirements.map((r) => ({ key: r.key, label: r.label })) ?? []}
          />
        </div>
      </div>

      {stage.documents.map((doc) => {
        const current = doc.versions.find((v) => v.isCurrent) ?? doc.versions[0];
        const metaAction = updateDocumentMetaAction.bind(null, doc.id);
        const versionAction = uploadNewVersionAction.bind(null, doc.id);
        return (
          <div className="card" key={doc.id}>
            <div className="c-h">
              <span className="t">{doc.title}</span>
              <span className="mono" style={{ fontSize: ".68rem", color: "var(--muted)" }}>
                sha256 {current?.sha256.slice(0, 16)}…
              </span>
            </div>
            <div className="c-b">
              <form action={metaAction} className="grid-3" style={{ alignItems: "end" }}>
                <label className="f">
                  <span className="l">Title</span>
                  <input type="text" name="title" defaultValue={doc.title} />
                </label>
                <label className="f">
                  <span className="l">Issuing organisation</span>
                  <input type="text" name="issuingOrganisation" defaultValue={doc.issuingOrganisation} />
                </label>
                <label className="f">
                  <span className="l">Issuer class (drives verification weight)</span>
                  <select name="issuerClass" defaultValue={doc.issuerClass}>
                    <option value="building_control">Building control body</option>
                    <option value="registered_professional">Registered professional</option>
                    <option value="firm">Firm</option>
                    <option value="owner_provided">Owner-provided</option>
                  </select>
                </label>
                <label className="f">
                  <span className="l">Document type</span>
                  <select name="docType" defaultValue={doc.docType}>
                    {["certificate", "drawing", "calculation", "photo", "invoice", "report", "other"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="f">
                  <span className="l">Share scope class</span>
                  <select name="scopeClass" defaultValue={doc.scopeClass}>
                    <option value="certificate">Certificate (all scopes)</option>
                    <option value="structural">Structural (solicitor + surveyor)</option>
                    <option value="general">General</option>
                  </select>
                </label>
                <label className="f">
                  <span className="l">Satisfies requirement</span>
                  <select name="requirementKey" defaultValue={doc.requirementKey ?? ""}>
                    <option value="">— none —</option>
                    {(rule?.requirements ?? []).map((r) => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </label>
                <label className="f">
                  <span className="l">Issue date</span>
                  <input type="date" name="issueDate" defaultValue={doc.issueDate?.toISOString().slice(0, 10)} />
                </label>
                <label className="f">
                  <span className="l">Expiry / renewal (optional)</span>
                  <input type="date" name="expiryDate" defaultValue={doc.expiryDate?.toISOString().slice(0, 10)} />
                </label>
                <div>
                  <button className="btn btn-gold btn-sm" type="submit">Save metadata</button>
                </div>
              </form>

              <div className="audit">
                {doc.versions.map((v) => (
                  <div className="v" key={v.id}>
                    v{v.versionNo}
                    {v.isCurrent ? " (current)" : ""} · {v.fileName} ·{" "}
                    {(v.sizeBytes / 1024 / 1024).toFixed(1)} MB · sealed {ukDate(v.sealedAt)}
                    {v.uploadedBy ? ` by ${v.uploadedBy.name}` : ""} ·{" "}
                    <span className="mono">{v.sha256.slice(0, 12)}…</span>
                    {v.receipt ? " · anchored" : ""}
                  </div>
                ))}
              </div>

              <form action={versionAction} style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required style={{ fontSize: ".8rem", color: "var(--muted)" }} />
                <button className="btn btn-ghost btn-sm" type="submit">Upload corrected version</button>
                <span className="hint" style={{ margin: 0 }}>Files are immutable — corrections become v{(current?.versionNo ?? 0) + 1}; the audit trail keeps every version.</span>
              </form>
            </div>
          </div>
        );
      })}
    </AdminShell>
  );
}
