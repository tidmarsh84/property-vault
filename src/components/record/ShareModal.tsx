"use client";

import { useState } from "react";
import { showToast } from "./toast";

const OPTIONS = [
  {
    scope: "solicitor",
    title: "Solicitor or conveyancer",
    desc: "Full record — every event, stage and sealed document with verification details.",
  },
  {
    scope: "agent_buyer",
    title: "Estate agent or buyer",
    desc: "Event timeline, verification levels and certificates — working drawings stay private.",
  },
  {
    scope: "insurer_surveyor",
    title: "Insurer or surveyor",
    desc: "Structural events, surveys and photographs relevant to condition.",
  },
] as const;

export function ShareModal({
  open,
  onClose,
  recordId,
  k,
}: {
  open: boolean;
  onClose: () => void;
  recordId: string;
  k: string;
}) {
  const [scope, setScope] = useState<string>("solicitor");
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setUrl(null);
    onClose();
  };

  const createLink = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/r/${recordId}/share?k=${encodeURIComponent(k)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      if (!res.ok) {
        showToast("Could not create a share link — only the homeowner link can share this record.");
        return;
      }
      const data: { url: string } = await res.json();
      setUrl(data.url);
      try {
        await navigator.clipboard.writeText(data.url);
        showToast("Secure link created and copied to your clipboard.");
      } catch {
        showToast("Secure link created.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div
      className="overlay open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shareTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal">
        <h3 id="shareTitle" className="serif">
          Share this record
        </h3>
        <p className="m-sub">Create a secure, read-only link. You can withdraw access at any time.</p>
        {OPTIONS.map((opt) => (
          <label
            key={opt.scope}
            className={`opt${scope === opt.scope ? " sel" : ""}`}
            onClick={() => {
              setScope(opt.scope);
              setUrl(null);
            }}
          >
            <input type="radio" name="scope" checked={scope === opt.scope} readOnly />
            <span>
              <span className="ot">{opt.title}</span>
              <br />
              <span className="od">{opt.desc}</span>
            </span>
          </label>
        ))}
        <div className={`share-out${url ? " show" : ""}`}>
          <div className="lbl">Secure link — valid 90 days</div>
          <div className="url mono">{url}</div>
        </div>
        <div className="m-actions">
          <button className="btn btn-ghost" onClick={close}>
            Close
          </button>
          <button className="btn btn-gold" onClick={createLink} disabled={busy}>
            {busy ? "Creating…" : "Create secure link"}
          </button>
        </div>
      </div>
    </div>
  );
}
