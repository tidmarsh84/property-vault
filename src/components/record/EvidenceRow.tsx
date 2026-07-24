"use client";

// One evidence row: View opens the sealed file; Verify toggles the
// issuer / sealed / fingerprint / anchored detail panel.

import { useState } from "react";
import { GoldTick } from "./icons";

export interface EvidenceDoc {
  id: string;
  title: string;
  meta: string; // "Sealed 2 Feb 2026 · 0.4 MB"
  viewUrl: string;
  issuedBy: string;
  sealedAt: string;
  fingerprint: string;
  fingerprintFull: string;
  anchoredLine: string;
  superseded: boolean;
}

export function EvidenceRow({ doc }: { doc: EvidenceDoc }) {
  const [showVerify, setShowVerify] = useState(false);

  return (
    <>
      <div className="ev-row" style={doc.superseded ? { opacity: 0.55 } : undefined}>
        <div>
          <div className="ev-name">{doc.title}</div>
          <div className="ev-meta">
            {doc.superseded ? `Superseded by a newer version · ${doc.meta}` : doc.meta}
          </div>
        </div>
        <div className="ev-actions">
          <a className="link-btn" href={doc.viewUrl} target="_blank" rel="noopener">
            View
          </a>
          <button className="link-btn" onClick={() => setShowVerify((v) => !v)}>
            Verify
          </button>
        </div>
      </div>
      <div className={`verify-detail${showVerify ? " show" : ""}`}>
        <div className="vp-ok">
          <GoldTick className="" />
          Unaltered since issue
        </div>
        <div className="vp-row">
          <span className="k">Issued by</span>
          <span className="v">{doc.issuedBy}</span>
        </div>
        <div className="vp-row">
          <span className="k">Sealed</span>
          <span className="v">{doc.sealedAt}</span>
        </div>
        <div className="vp-row">
          <span className="k">Fingerprint</span>
          <span className="v mono" title={doc.fingerprintFull}>
            {doc.fingerprint}
          </span>
        </div>
        <div className="vp-row">
          <span className="k">Anchored</span>
          <span className="v">{doc.anchoredLine}</span>
        </div>
      </div>
    </>
  );
}
