"use client";

// Client shell: sticky header (tabs + share), share modal, toast, and the
// first-party open beacon. The record content itself stays server-rendered
// and is passed in as children.

import { useEffect, useState } from "react";
import { PvMark } from "./icons";
import { ShareModal } from "./ShareModal";
import { Toast, showToast } from "./toast";

export function RecordShell({
  recordId,
  k,
  canShare,
  children,
}: {
  recordId: string;
  k: string;
  canShare: boolean;
  children: React.ReactNode;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // First-party analytics beacon: one open event per page view.
  useEffect(() => {
    const body = JSON.stringify({ recordId, k, type: "record_opened" });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body }).catch(() => {});
    }
  }, [recordId, k]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (i: number, anchor: "top" | "timeline" | "parties") => {
    setActiveTab(i);
    if (anchor === "top") window.scrollTo({ top: 0 });
    else document.getElementById(anchor)?.scrollIntoView();
  };

  const openShare = () => {
    if (canShare) setShareOpen(true);
    else showToast("Only the homeowner link can create new shares of this record.");
  };

  return (
    <div className="pv">
      <header>
        <div className="hwrap">
          <div className="brand">
            <PvMark />
            <span className="name">
              Property<b>Vault</b>
            </span>
          </div>
          <nav className="tabs" aria-label="Record sections">
            <button className={`tab${activeTab === 0 ? " active" : ""}`} onClick={() => goTo(0, "top")}>
              Overview
            </button>
            <button className={`tab${activeTab === 1 ? " active" : ""}`} onClick={() => goTo(1, "timeline")}>
              Timeline
            </button>
            <button className={`tab${activeTab === 2 ? " active" : ""}`} onClick={() => goTo(2, "timeline")}>
              Documents
            </button>
            <button className={`tab${activeTab === 3 ? " active" : ""}`} onClick={() => goTo(3, "parties")}>
              Parties
            </button>
            {canShare && (
              <button className="tab" onClick={openShare}>
                Share
              </button>
            )}
            <button
              className="tab"
              onClick={() => showToast("The Activity view lives in the pilot dashboard.")}
            >
              Activity
            </button>
          </nav>
          {canShare && (
            <button className="btn btn-gold" style={{ marginLeft: "auto" }} onClick={openShare}>
              Share this record
            </button>
          )}
        </div>
      </header>
      {children}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} recordId={recordId} k={k} />
      <Toast />
    </div>
  );
}
