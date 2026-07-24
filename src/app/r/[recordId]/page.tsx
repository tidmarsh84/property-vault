import { headers } from "next/headers";
import type { Metadata } from "next";
import { resolveToken } from "@/lib/tokens";
import { loadRecordView } from "@/lib/record";
import { contextFromHeaders, logAnalyticsEvent } from "@/lib/analytics";
import type { Scope } from "@/lib/scope";
import RecordClient from "./RecordClient";
import "./record.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { recordId: string };
}): Promise<Metadata> {
  return {
    title: `Property record ${params.recordId} — Property Vault`,
    robots: { index: false, follow: false },
  };
}

export default async function RecordPage({
  params,
  searchParams,
}: {
  params: { recordId: string };
  searchParams: { k?: string };
}) {
  const token = await resolveToken(params.recordId, searchParams.k ?? null);

  if (!token) {
    return (
      <div className="pv-denied">
        <div className="box">
          <h1>This link isn&apos;t valid</h1>
          <p>
            The secure link you followed has expired, been withdrawn, or was typed
            incorrectly. Please ask whoever sent it for a fresh link.
          </p>
        </div>
      </div>
    );
  }

  const view = await loadRecordView(params.recordId, token.scope as Scope);
  if (!view) {
    return (
      <div className="pv-denied">
        <div className="box">
          <h1>Record not found</h1>
          <p>This property record no longer exists.</p>
        </div>
      </div>
    );
  }

  // First-party measurement: opening the record is the pilot's core metric.
  const h = await headers();
  await logAnalyticsEvent({
    propertyId: view.propertyId,
    tokenId: token.id,
    kind: token.createdVia === "share_modal" ? "share_opened" : "record_opened",
    shareScope: token.createdVia === "share_modal" ? token.scope : null,
    context: contextFromHeaders(h as unknown as Headers),
  });

  return <RecordClient view={view} rawToken={searchParams.k as string} />;
}
