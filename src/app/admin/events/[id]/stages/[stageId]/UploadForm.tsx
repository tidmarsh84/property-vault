"use client";

import { useRef, useState } from "react";

export function UploadForm({
  action,
  requirements,
}: {
  action: (formData: FormData) => Promise<void>;
  requirements: { key: string; label: string }[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [names, setNames] = useState<string[]>([]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (inputRef.current && e.dataTransfer.files.length) {
      inputRef.current.files = e.dataTransfer.files;
      setNames(Array.from(e.dataTransfer.files).map((f) => f.name));
    }
  };

  return (
    <form action={action} className="stack" style={{ maxWidth: "100%" }}>
      <div
        className={`drop${over ? " over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {names.length
          ? `${names.length} file${names.length === 1 ? "" : "s"} ready: ${names.join(", ")}`
          : "Drag & drop PDF / JPG / PNG here, or click to choose (multiple allowed)"}
        <input
          ref={inputRef}
          type="file"
          name="files"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={(e) => setNames(Array.from(e.target.files ?? []).map((f) => f.name))}
        />
      </div>

      <div className="grid-3">
        <label className="f">
          <span className="l">Title (single file only; else filenames)</span>
          <input type="text" name="title" placeholder="Decision notice" />
        </label>
        <label className="f">
          <span className="l">Issuing organisation</span>
          <input type="text" name="issuingOrganisation" placeholder="Leeds City Council" required />
        </label>
        <label className="f">
          <span className="l">Issuer class</span>
          <select name="issuerClass" defaultValue="firm">
            <option value="building_control">Building control body</option>
            <option value="registered_professional">Registered professional</option>
            <option value="firm">Firm</option>
            <option value="owner_provided">Owner-provided</option>
          </select>
        </label>
        <label className="f">
          <span className="l">Document type</span>
          <select name="docType" defaultValue="certificate">
            {["certificate", "drawing", "calculation", "photo", "invoice", "report", "other"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="f">
          <span className="l">Share scope class</span>
          <select name="scopeClass" defaultValue="certificate">
            <option value="certificate">Certificate (all scopes)</option>
            <option value="structural">Structural (solicitor + surveyor)</option>
            <option value="general">General</option>
          </select>
        </label>
        <label className="f">
          <span className="l">Satisfies requirement</span>
          <select name="requirementKey" defaultValue={requirements[0]?.key ?? ""}>
            <option value="">— none —</option>
            {requirements.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="f">
          <span className="l">Issue date</span>
          <input type="date" name="issueDate" />
        </label>
        <label className="f">
          <span className="l">Expiry / renewal (optional)</span>
          <input type="date" name="expiryDate" />
        </label>
        <div style={{ alignSelf: "end" }}>
          <button className="btn btn-gold" type="submit">Upload &amp; seal</button>
        </div>
      </div>
      <p className="hint">
        On upload the SHA-256 fingerprint is computed and anchored; from that moment the
        file is immutable. Corrections are new versions, never overwrites.
      </p>
    </form>
  );
}
