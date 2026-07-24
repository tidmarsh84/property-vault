"use client";

// Drag-and-drop file picker that feeds the surrounding server-action form.

import { useRef, useState } from "react";

export function DropInput({ name = "file" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      className={`border border-dashed rounded-lg px-3 py-4 text-center text-xs font-sans cursor-pointer transition-colors ${
        over ? "border-gold bg-gold-soft text-gold-bright" : "border-line-soft text-muted"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length && inputRef.current) {
          inputRef.current.files = e.dataTransfer.files;
          setLabel(e.dataTransfer.files[0].name);
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => setLabel(e.target.files?.[0]?.name ?? null)}
      />
      {label ?? "Drop a PDF / JPG / PNG here, or click to choose"}
    </div>
  );
}
