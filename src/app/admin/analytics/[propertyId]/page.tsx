import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "../../AdminShell";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  record_opened: "Record opened",
  share_opened: "Shared link opened",
  doc_viewed: "Document viewed",
  doc_downloaded: "Document downloaded",
  download_all: "Download all used",
  share_created: "Share link created",
  invite_interest: "Invite-installer interest",
};

export default async function RecordActivityPage({
  params,
}: {
  params: { propertyId: string };
}) {
  const user = await requireUser();
  const property = await prisma.property.findUnique({
    where: { id: params.propertyId },
    include: {
      analyticsEvents: { orderBy: { createdAt: "desc" }, take: 500, include: { token: true } },
    },
  });
  if (!property || property.organisationId !== user.organisationId) notFound();

  const docIds = [
    ...new Set(property.analyticsEvents.map((e) => e.documentId).filter(Boolean) as string[]),
  ];
  const docs = await prisma.document.findMany({
    where: { id: { in: docIds } },
    select: { id: true, title: true },
  });
  const docTitle = new Map(docs.map((d) => [d.id, d.title]));

  return (
    <AdminShell user={user}>
      <div className="crumbs">
        <Link href="/admin/analytics">Pilot analytics</Link> / {property.recordId}
      </div>
      <h1 className="serif">{property.addressLine1}, {property.city}</h1>
      <p className="sub">
        <span className="mono">{property.recordId}</span> · activity timeline (newest first)
      </p>

      <div className="card">
        <table>
          <thead>
            <tr><th>When</th><th>What</th><th>Detail</th><th>Via link</th><th>Device</th></tr>
          </thead>
          <tbody>
            {property.analyticsEvents.length === 0 && (
              <tr><td colSpan={5} style={{ color: "var(--muted)" }}>No activity yet.</td></tr>
            )}
            {property.analyticsEvents.map((e) => (
              <tr key={e.id}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {e.createdAt.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td style={{ color: "var(--text)" }}>{KIND_LABEL[e.kind] ?? e.kind}</td>
                <td>
                  {e.documentId ? docTitle.get(e.documentId) ?? "—" : e.shareScope ?? "—"}
                </td>
                <td>{e.token ? `${e.token.scope}${e.token.createdVia === "share_modal" ? " (share)" : ""}` : "—"}</td>
                <td>{e.deviceType}{e.countryCode ? ` · ${e.countryCode}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
