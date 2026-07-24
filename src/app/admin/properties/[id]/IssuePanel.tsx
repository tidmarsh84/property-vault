"use client";

import { useFormState } from "react-dom";
import { issueRecordAction, type IssueResult } from "../../actions";

export function IssuePanel({
  propertyId,
  recordId,
  issued,
  hasOwnerLink,
}: {
  propertyId: string;
  recordId: string;
  issued: boolean;
  hasOwnerLink: boolean;
}) {
  const action = issueRecordAction.bind(null, propertyId);
  const [result, formAction] = useFormState<IssueResult | null, FormData>(action, null);

  return (
    <div className="card">
      <div className="c-h">
        <span className="t">Issue record</span>
        {issued && <span className="pill gold"><span className="dot" />Issued</span>}
      </div>
      <div className="c-b">
        {!result && (
          <>
            <p style={{ color: "var(--muted)", fontSize: ".87rem", marginBottom: 12 }}>
              {issued && hasOwnerLink
                ? "This record is live. Issuing again creates a fresh homeowner link (the old one keeps working until it expires — revoke it from the database if it was compromised)."
                : "Marks the record ready and generates the homeowner's secure link plus a handover email you can copy. Only events with lifecycle “issued” appear on the homeowner record."}
            </p>
            <form action={formAction}>
              <button className="btn btn-gold" type="submit">
                {issued ? "Generate a new homeowner link" : `Issue ${recordId}`}
              </button>
            </form>
          </>
        )}
        {result && (
          <>
            <p className="ok" style={{ marginBottom: 12 }}>
              Record issued. This link is shown once — copy it now.
            </p>
            <p className="mono" style={{ fontSize: ".8rem", wordBreak: "break-all", color: "var(--gold-bright)", marginBottom: 14 }}>
              {result.url}
            </p>
            <div style={{ fontSize: ".68rem", letterSpacing: ".13em", textTransform: "uppercase", color: "var(--muted)", margin: "14px 0 6px", fontWeight: 600 }}>
              Handover email (copy &amp; send)
            </div>
            <pre className="hand">{result.email}</pre>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => navigator.clipboard.writeText(result.email)}
            >
              Copy email text
            </button>
          </>
        )}
      </div>
    </div>
  );
}
