import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await requireUser();
  const properties = await prisma.property.findMany({
    where: { organisationId: user.organisationId },
    orderBy: { createdAt: "desc" },
    include: {
      assets: { include: { events: { select: { lifecycle: true } } } },
      accessTokens: { where: { scope: "owner", revokedAt: null } },
      _count: { select: { analyticsEvents: true } },
    },
  });

  return (
    <AdminShell user={user}>
      <div className="head-row">
        <div>
          <h1 className="serif">Properties</h1>
          <p className="sub">Every record your organisation manages.</p>
        </div>
        <Link className="btn btn-gold" href="/admin/properties/new">+ New property record</Link>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Address</th>
              <th>Events</th>
              <th>Status</th>
              <th>Activity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {properties.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)" }}>
                  No properties yet — create the first record.
                </td>
              </tr>
            )}
            {properties.map((p) => {
              const events = p.assets.flatMap((a) => a.events);
              const issued = events.filter((e) => e.lifecycle === "issued").length;
              return (
                <tr key={p.id}>
                  <td className="mono" style={{ color: "var(--gold-bright)" }}>{p.recordId}</td>
                  <td>
                    {p.addressLine1}, {p.city} {p.postcode}
                  </td>
                  <td>
                    {issued} issued / {events.length}
                  </td>
                  <td>
                    {p.status === "issued" ? (
                      <span className="pill gold"><span className="dot" />Issued</span>
                    ) : (
                      <span className="pill grey"><span className="dot" />Draft</span>
                    )}
                  </td>
                  <td>{p._count.analyticsEvents} events logged</td>
                  <td>
                    <Link className="btn btn-ghost btn-sm" href={`/admin/properties/${p.id}`}>Open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
