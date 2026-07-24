import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "../../AdminShell";
import { IssuePanel } from "./IssuePanel";

export const dynamic = "force-dynamic";

const lifecyclePill: Record<string, string> = {
  draft: "grey",
  awaiting_evidence: "amber",
  issued: "gold",
  archived: "grey",
};

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      assets: {
        include: {
          events: {
            include: { stages: { include: { documents: true } } },
            orderBy: { sortDate: "desc" },
          },
        },
      },
      accessTokens: {
        where: { revokedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!property || property.organisationId !== user.organisationId) notFound();

  const events = property.assets
    .flatMap((a) => a.events.map((e) => ({ ...e, assetName: a.name })))
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  const ownerToken = property.accessTokens.find((t) => t.scope === "owner");

  return (
    <AdminShell user={user}>
      <div className="crumbs"><Link href="/admin">Properties</Link> / {property.recordId}</div>
      <div className="head-row">
        <div>
          <h1 className="serif">{property.addressLine1}, {property.city}</h1>
          <p className="sub">
            <span className="mono">{property.recordId}</span>
            {" · "}UPRN {property.uprn ?? <em>none — {property.uprnOverrideReason}</em>}
            {" · "}{property.postcode}
            {" · "}
            {property.status === "issued" ? "Issued" : "Draft"}
          </p>
        </div>
        <Link className="btn btn-gold" href={`/admin/properties/${property.id}/events/new`}>
          + New event
        </Link>
      </div>

      <div className="card">
        <div className="c-h"><span className="t">Events</span></div>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Asset</th>
              <th>Lifecycle</th>
              <th>Verification</th>
              <th>Evidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={6} style={{ color: "var(--muted)" }}>No events yet — create one from a template.</td></tr>
            )}
            {events.map((e) => {
              const docs = e.stages.reduce((n, s) => n + s.documents.length, 0);
              return (
                <tr key={e.id}>
                  <td style={{ color: "var(--text)" }}>{e.title}</td>
                  <td>{e.assetName}</td>
                  <td>
                    <span className={`pill ${lifecyclePill[e.lifecycle]}`}>
                      <span className="dot" />{e.lifecycle.replace("_", " ")}
                    </span>
                  </td>
                  <td>{e.historical ? "Historical" : `${e.verificationLevel}%`}</td>
                  <td>{docs} document{docs === 1 ? "" : "s"}</td>
                  <td><Link className="btn btn-ghost btn-sm" href={`/admin/events/${e.id}`}>Edit</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <IssuePanel
        propertyId={property.id}
        recordId={property.recordId}
        issued={property.status === "issued"}
        hasOwnerLink={!!ownerToken}
      />

      <div className="card">
        <div className="c-h"><span className="t">Active access links</span></div>
        <table>
          <thead>
            <tr><th>Scope</th><th>Created</th><th>Expires</th><th>Via</th></tr>
          </thead>
          <tbody>
            {property.accessTokens.length === 0 && (
              <tr><td colSpan={4} style={{ color: "var(--muted)" }}>None yet — issue the record to create the homeowner link.</td></tr>
            )}
            {property.accessTokens.map((t) => (
              <tr key={t.id}>
                <td>{t.scope}</td>
                <td>{t.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td>{t.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td>{t.createdVia.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
