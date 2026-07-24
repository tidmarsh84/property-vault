"use client";

import { useEffect, useRef, useState } from "react";
import type { RecordView, EventView, DocView } from "@/lib/record";

const VERIFICATION_NOTE =
  "Verification reflects what is evidenced and identity-checked — not the quality of the work.";

const Shield = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size + 1} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.5l5 2v3.6c0 3.2-2.1 5.7-5 7.4-2.9-1.7-5-4.2-5-7.4V3.5l5-2z" stroke="#E0BE72" strokeWidth="1.4" />
    <path d="M5.6 8l1.7 1.7L10.6 6.3" stroke="#E0BE72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Tick = () => (
  <svg className="tick" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="#C79B3D" />
    <path d="M5 8.2l2 2L11.2 6" stroke="#10131C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GreyTick = () => (
  <svg className="tick" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="none" stroke="#8592A6" strokeWidth="1.3" />
    <path d="M5 8.2l2 2L11.2 6" stroke="#8592A6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SHARE_OPTIONS = [
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
];

export default function RecordClient({
  view,
  rawToken,
}: {
  view: RecordView;
  rawToken: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareScope, setShareScope] = useState("solicitor");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [openVerify, setOpenVerify] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 3200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const docHref = (docId: string, download = false) =>
    `/r/${view.recordId}/doc/${docId}?k=${encodeURIComponent(rawToken)}${download ? "&download=1" : ""}`;

  const createShare = async () => {
    setShareBusy(true);
    try {
      const res = await fetch(`/api/r/${view.recordId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: shareScope, k: rawToken }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string };
      setShareUrl(data.url);
      try {
        await navigator.clipboard.writeText(data.url);
        toast("Secure link created and copied to your clipboard.");
      } catch {
        toast("Secure link created.");
      }
    } catch {
      toast("Could not create the link — please try again.");
    } finally {
      setShareBusy(false);
    }
  };

  const inviteInstaller = async (eventId: string) => {
    await fetch(`/api/r/${view.recordId}/interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, k: rawToken }),
    }).catch(() => {});
    window.location.href = `mailto:pilot@propertyvault.co.uk?subject=${encodeURIComponent(
      `Installer verification — record ${view.recordId}`
    )}&body=${encodeURIComponent(
      "I'd like to invite the installer who carried out work on my property to verify this event."
    )}`;
    toast("Thanks — we've noted your interest.");
  };

  const scrollTo = (tab: number, anchor: string) => {
    setActiveTab(tab);
    if (anchor === "top") window.scrollTo({ top: 0 });
    else document.getElementById(anchor)?.scrollIntoView();
  };

  return (
    <div className="pv-record">
      <header className="rec">
        <div className="hwrap">
          <div className="brand">
            <svg className="pv-mark" viewBox="0 0 34 38" fill="none" aria-hidden="true">
              <path d="M17 1.5l14.5 5.4v10.4c0 9.3-6.1 16.4-14.5 19.2C8.6 33.7 2.5 26.6 2.5 17.3V6.9L17 1.5z" stroke="#C79B3D" strokeWidth="1.6" />
              <text x="17" y="23.5" textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="13" fill="#C79B3D" fontWeight="600">PV</text>
            </svg>
            <span className="name">Property<b>Vault</b></span>
          </div>
          <nav className="tabs" aria-label="Record sections">
            {["Overview", "Timeline", "Documents"].map((t, i) => (
              <button key={t} className={`tab${activeTab === i ? " active" : ""}`} onClick={() => scrollTo(i, i === 0 ? "top" : "timeline")}>
                {t}
              </button>
            ))}
            <button className="tab" onClick={() => scrollTo(3, "parties")}>Parties</button>
            {view.canShare && (
              <button className="tab" onClick={() => { setShareOpen(true); setShareUrl(null); }}>Share</button>
            )}
          </nav>
          {view.canShare ? (
            <button className="btn btn-gold" style={{ marginLeft: "auto" }} onClick={() => { setShareOpen(true); setShareUrl(null); }}>
              Share this record
            </button>
          ) : (
            <span style={{ marginLeft: "auto" }} />
          )}
        </div>
      </header>

      {view.scope !== "owner" && (
        <div className="scope-strip">{view.scopeLabel} — read-only</div>
      )}

      <section className="hero" id="top">
        <div className="hero-in">
          <div>
            <div className="eyebrow">{view.heroEyebrow}</div>
            <h1 className="serif">{view.address}</h1>
            <div className="idline">
              Record ID: <span className="mono">{view.recordId}</span>
              {view.uprn && (
                <>
                  <span className="sep">·</span> UPRN: <span className="mono">{view.uprn}</span>
                </>
              )}
            </div>
          </div>
          <div className="seal" role="group" aria-label="Record verification level">
            <div className="k">Verification level</div>
            <div className="pct serif">{view.level}%</div>
            <div className="band">
              <Shield />
              {view.bandLabel}
            </div>
          </div>
        </div>
      </section>

      <main>
        <aside className="sidebar">
          <div className="sum-card">
            <div className="sc-h">Property summary</div>
            <div className="sum-row"><div className="k">Property type</div><div className="v">{view.propertyType}</div></div>
            <div className="sum-row"><div className="k">Tenure</div><div className="v">{view.tenure}</div></div>
            {view.uprn && (
              <div className="sum-row"><div className="k">UPRN</div><div className="v mono">{view.uprn}</div></div>
            )}
            <div className="sum-row"><div className="k">Verified events</div><div className="v">{view.verifiedEventsLine}</div></div>
            <div className="sum-row"><div className="k">Record created</div><div className="v">{view.created}</div></div>
            <div className="sum-row"><div className="k">Last updated</div><div className="v">{view.updated}</div></div>
            <div className="sum-foot">
              <a className="btn btn-ghost btn-block" href={`/r/${view.recordId}/download-all?k=${encodeURIComponent(rawToken)}`}>
                Download all documents
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 1v8m0 0L4 6.2M7 9l3-2.8M2 12.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
          <div className="integrity-mini">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1.5l5 2v3.6c0 3.2-2.1 5.7-5 7.4-2.9-1.7-5-4.2-5-7.4V3.5l5-2z" stroke="#C79B3D" strokeWidth="1.4" fill="rgba(199,155,61,.12)" />
              <path d="M5.6 8l1.7 1.7L10.6 6.3" stroke="#C79B3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              Verified events are digitally signed by identity-checked professionals at the
              time of the work, then sealed so they cannot be altered afterwards — by
              anyone, including us. Verified refers to the record, never the quality of the
              work.
            </div>
          </div>
        </aside>

        <div id="timeline">
          <div className="section-head">
            <h2>Event timeline</h2>
            <span className="section-note">Newest first</span>
          </div>
          <p className="lede">
            Each entry is an event, not a folder. Open an event to see its stages; open a
            stage to see the evidence behind it.
          </p>

          <div className="timeline">
            {view.events.map((event, idx) => (
              <EventBlock
                key={event.id}
                event={event}
                anchorId={idx === 0 ? "parties" : undefined}
                docHref={docHref}
                openVerify={openVerify}
                setOpenVerify={setOpenVerify}
                onInvite={() => inviteInstaller(event.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="rec">
        <div className="fwrap">
          <div className="anchor">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flex: "none", marginTop: 2 }} aria-hidden="true">
              <path d="M8 1.5l5 2v3.6c0 3.2-2.1 5.7-5 7.4-2.9-1.7-5-4.2-5-7.4V3.5l5-2z" stroke="#C79B3D" strokeWidth="1.3" />
            </svg>
            <span>
              Each sealed document is fingerprinted at the moment of issue. During the
              pilot, fingerprints are anchored in Property Vault&apos;s signed integrity log
              (&quot;pilot mode&quot;), providing durable proof that documents have not changed.
              Documents are held in secure UK cloud storage and never published.
            </span>
          </div>
          <span>
            Property Vault pilot · Record {view.recordId} · Access is measured to improve
            the service; no third-party trackers are used.
          </span>
        </div>
      </footer>

      {view.canShare && (
        <div
          className={`overlay${shareOpen ? " open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shareTitle"
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}
        >
          <div className="modal">
            <h3 id="shareTitle" className="serif">Share this record</h3>
            <p className="m-sub">Create a secure, read-only link. You can withdraw access at any time.</p>
            {SHARE_OPTIONS.map((opt) => (
              <label
                key={opt.scope}
                className={`opt${shareScope === opt.scope ? " sel" : ""}`}
                onClick={() => { setShareScope(opt.scope); setShareUrl(null); }}
              >
                <input type="radio" name="scope" checked={shareScope === opt.scope} readOnly />
                <span>
                  <span className="ot">{opt.title}</span>
                  <br />
                  <span className="od">{opt.desc}</span>
                </span>
              </label>
            ))}
            <div className={`share-out${shareUrl ? " show" : ""}`}>
              <div className="lbl">Secure link — valid 90 days</div>
              <div className="url mono">{shareUrl}</div>
            </div>
            <div className="m-actions">
              <button className="btn btn-ghost" onClick={() => setShareOpen(false)}>Close</button>
              <button className="btn btn-gold" onClick={createShare} disabled={shareBusy}>
                {shareBusy ? "Creating…" : "Create secure link"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastShow ? " show" : ""}`}>{toastMsg}</div>
    </div>
  );
}

function EventBlock({
  event,
  anchorId,
  docHref,
  openVerify,
  setOpenVerify,
  onInvite,
}: {
  event: EventView;
  anchorId?: string;
  docHref: (docId: string, download?: boolean) => string;
  openVerify: string | null;
  setOpenVerify: (id: string | null) => void;
  onInvite: () => void;
}) {
  const cls = event.historical ? "" : event.band === "high" ? " verified" : " partial";
  return (
    <div className={`event${cls}`} id={anchorId}>
      <span className="node" aria-hidden="true" />
      <div className="when">{event.when}</div>
      <div className="ev-title-row">
        <h3>{event.title}</h3>
        <span className={`conf ${event.band}`}>
          <span className="dot" />
          {event.chip}
        </span>
      </div>
      {event.summary && <div className="who">{event.summary}</div>}

      {event.professionals.length > 0 && (
        <div className="parties" aria-label="Contributing professionals">
          {event.professionals.map((p, i) => (
            <span className="party" key={i}>
              {p.verified ? <Tick /> : <GreyTick />}
              <span className="role">{p.role}</span>
              <span className="firm">{p.firm}</span>
            </span>
          ))}
        </div>
      )}

      {event.stages.some((s) => s.documents.length > 0) && (
        <div className="stages">
          {event.stages.map((stage, si) => (
            <details className="stage" key={stage.id} open={si === 0 && !event.ownerProvided}>
              <summary>
                <span className={`st-mark ${stage.complete ? "done" : "todo"}`} aria-hidden="true" />
                <span className="st-main">
                  <span className="sn">{stage.name}</span>
                  <br />
                  <span className="sm">{stage.detail}</span>
                </span>
                <span className="st-count">
                  {stage.documents.length} document{stage.documents.length === 1 ? "" : "s"}{" "}
                  <span className="chev">›</span>
                </span>
              </summary>
              <div className="evidence">
                {stage.documents.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    href={docHref(doc.id)}
                    open={openVerify === doc.id}
                    onToggle={() => setOpenVerify(openVerify === doc.id ? null : doc.id)}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {event.breakdown && (
        <div className="conf-panel">
          <div className="cp-t">Why {event.level}%?</div>
          <div className="cp-note">{VERIFICATION_NOTE}</div>
          {event.breakdown.map((row, i) => (
            <div className="cp-row" key={i}>
              <span>{row.label}</span>
              <span className={row.met ? "yes" : "no"}>{row.metLabel}</span>
            </div>
          ))}
          {event.gapPrompt && (
            <div className="ev-missing" style={{ marginTop: 8 }}>
              <span>{event.gapPrompt}</span>
              <button className="btn btn-ghost" onClick={onInvite}>Invite installer</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocRow({
  doc,
  href,
  open,
  onToggle,
}: {
  doc: DocView;
  href: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <div className="ev-row">
        <div>
          <div className="ev-name">{doc.title}</div>
          <div className="ev-meta">
            {doc.meta}
            {doc.expiry ? ` · ${doc.expiry}` : ""}
          </div>
        </div>
        <div className="ev-actions">
          <a className="link-btn" href={href} target="_blank" rel="noopener">View</a>
          <button className="link-btn" onClick={onToggle}>Verify</button>
        </div>
      </div>
      <div className={`verify-detail${open ? " show" : ""}`}>
        <div className="vp-ok">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="#C79B3D" />
            <path d="M5 8.2l2 2L11.2 6" stroke="#10131C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Unaltered since issue
        </div>
        <div className="vp-row"><span className="k">Issued by</span><span className="v">{doc.verify.issuedBy}</span></div>
        <div className="vp-row"><span className="k">Sealed</span><span className="v">{doc.verify.sealed}</span></div>
        <div className="vp-row"><span className="k">Fingerprint</span><span className="v mono">{doc.verify.fingerprint}</span></div>
        <div className="vp-row"><span className="k">Anchored</span><span className="v">{doc.verify.anchored}</span></div>
      </div>
    </>
  );
}
