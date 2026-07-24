// UK conventions: DD Month YYYY.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ukDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function ukDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()].slice(0, 3)} ${date.getUTCFullYear()}`;
}

export function ukDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${ukDate(date)}, ${hh}:${mm} GMT`;
}

export function monthYear(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "February — July 2026" style range for event headers. */
export function dateRange(start: Date | null, end: Date | null): string {
  if (!start && !end) return "";
  if (start && !end) return monthYear(start);
  if (!start && end) return monthYear(end);
  const s = start as Date;
  const e = end as Date;
  if (s.getUTCFullYear() === e.getUTCFullYear()) {
    if (s.getUTCMonth() === e.getUTCMonth()) return monthYear(s);
    return `${MONTHS[s.getUTCMonth()]} — ${monthYear(e)}`;
  }
  return `${monthYear(s)} — ${monthYear(e)}`;
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function shortHash(sha256: string): string {
  return `${sha256.slice(0, 12)}…${sha256.slice(-8)}`;
}
