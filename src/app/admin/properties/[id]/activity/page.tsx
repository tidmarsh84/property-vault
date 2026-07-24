import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ukDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  record_opened: "Record opened (homeowner link)",
  share_opened: "Shared link opened",
  doc_viewed: "Document viewed",
  doc_downloaded: "Document downloaded",
  share_created: "Share link created",
  download_all: "Download all used",
};

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) notFound();

  const events = await prisma.analyticsEvent.findMany({
    where: { propertyId: id },
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { accessToken: { select: { scope: true, label: true, createdAt: true } } },
  });

  const docIds = [...new Set(events.map((e) => e.documentId).filter(Boolean))] as string[];
  const docs = await prisma.document.findMany({
    where: { id: { in: docIds } },
    select: { id: true, title: true },
  });
  const docTitle = new Map(docs.map((d) => [d.id, d.title]));

  const openDays = new Set(
    events
      .filter((e) => e.type === "record_opened" || e.type === "share_opened")
      .map((e) => e.createdAt.toISOString().slice(0, 10)),
  );

  return (
    <div className="max-w-3xl font-sans text-sm">
      <Link href={`/admin/properties/${id}`} className="text-xs text-muted hover:text-gold-bright">
        ← {property.recordId} · {property.addressLine}
      </Link>
      <h1 className="font-serif text-2xl mt-1 mb-1">Activity</h1>
      <p className="text-xs text-muted mb-6">
        {events.length} events · opened on {openDays.size} distinct {openDays.size === 1 ? "day" : "days"} ·
        first-party measurement only (coarse device, country — no IPs retained).
      </p>

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[0.62rem] uppercase tracking-wider text-muted border-b border-line">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">What</th>
              <th className="px-4 py-3">Via link</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Country</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-muted whitespace-nowrap">{ukDateTime(e.createdAt)}</td>
                <td className="px-4 py-2.5 text-ink-soft">
                  {TYPE_LABELS[e.type] ?? e.type}
                  {e.documentId && (
                    <span className="text-muted"> — {docTitle.get(e.documentId) ?? "document"}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted">{e.accessToken?.label ?? e.accessToken?.scope ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted">{e.deviceType ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted">{e.country ?? "—"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No activity yet — the record hasn&rsquo;t been opened.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
