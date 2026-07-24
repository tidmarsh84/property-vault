import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "../../../../AdminShell";
import { createEventAction } from "../../../../actions";
import { eventTemplates } from "../../../../../../../config/event-templates";

export const dynamic = "force-dynamic";

export default async function NewEventPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { assets: true },
  });
  if (!property || property.organisationId !== user.organisationId) notFound();

  const action = createEventAction.bind(null, property.id);

  return (
    <AdminShell user={user}>
      <div className="crumbs">
        <Link href="/admin">Properties</Link> /{" "}
        <Link href={`/admin/properties/${property.id}`}>{property.recordId}</Link> / New event
      </div>
      <h1 className="serif">New event</h1>
      <p className="sub">Pick a template — it pre-populates the stage chain so a record takes minutes, not hours.</p>

      <form action={action} className="stack" style={{ maxWidth: 760 }}>
        <div className="tpl">
          {eventTemplates.map((t, i) => (
            <label key={t.key}>
              <input type="radio" name="templateKey" value={t.key} defaultChecked={i === 0} />
              <span className="tt">{t.label}</span>
              <span className="td">{t.description}</span>
            </label>
          ))}
        </div>

        <label className="f">
          <span className="l">Event title</span>
          <input type="text" name="title" placeholder="Single-storey rear extension" required />
        </label>

        <div className="grid-2">
          <label className="f">
            <span className="l">Asset</span>
            <select name="assetId" defaultValue="__new__">
              <option value="__new__">＋ Create a new asset…</option>
              {property.assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className="hint">Assets sit between the property and its events (extension, roof, boiler…).</span>
          </label>
          <div className="grid-2">
            <label className="f">
              <span className="l">New asset name</span>
              <input type="text" name="newAssetName" placeholder="Rear extension" />
            </label>
            <label className="f">
              <span className="l">Kind</span>
              <select name="newAssetKind">
                <option value="structure">Structure</option>
                <option value="roof">Roof</option>
                <option value="heating">Heating</option>
                <option value="electrical">Electrical</option>
                <option value="solar">Solar</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid-3">
          <label className="f">
            <span className="l">Started</span>
            <input type="date" name="startedOn" />
          </label>
          <label className="f">
            <span className="l">Completed</span>
            <input type="date" name="completedOn" />
          </label>
          <label className="f">
            <span className="l">Display period (optional)</span>
            <input type="text" name="periodLabel" placeholder="February — July 2026" />
          </label>
        </div>

        <label className="f">
          <span className="l">Summary line (optional)</span>
          <input type="text" name="summary" placeholder="Shown under the event title on the record" />
        </label>

        <label className="f" style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <input type="checkbox" name="ownerProvided" />
          <span style={{ fontSize: ".86rem", color: "var(--text-soft)" }}>
            Owner-provided (historical entry — caps the verification level and renders with the amber treatment)
          </span>
        </label>

        <div>
          <button className="btn btn-gold" type="submit">Create event</button>
        </div>
      </form>
    </AdminShell>
  );
}
