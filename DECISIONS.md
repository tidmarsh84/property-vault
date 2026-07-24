# DECISIONS.md — choices made that weren't specified

## Design source
- The build brief names `property-vault-prototype-v2.html` as the design source, but the
  sitemap records **v3 enterprise** (navy/gold, Playfair Display) as the approved record
  design and it is what the homepage links to. **Built against v3 enterprise.**

## Stack / environment
- **Prisma 7** (Rust-free client + better-sqlite3 driver adapter) rather than Prisma 5/6.
  The build environment blocks Prisma's engine-binary CDN; Prisma 7's TypeScript client
  needs no engine download at runtime. The generated client is committed
  (`src/generated/prisma`), so `npm install` + `npm run dev` works everywhere.
- Because `prisma migrate` needs the (blocked) schema-engine binary, the initial migration
  SQL was written by hand in Prisma's own format (`prisma/migrations/…/migration.sql`) and
  is applied by `scripts/apply-migrations.mjs`, which also records it in
  `_prisma_migrations` — so a real `prisma migrate deploy` on an unrestricted machine sees
  a clean, consistent state. Postgres switch: set `DATABASE_URL`, swap the adapter in
  `src/lib/db.ts` + `prisma.config.ts` for `@prisma/adapter-pg`.
- **fflate** for the "Download all" ZIP (archiver's package exports fight Next's bundler).
- Auth for milestone 3 will be a simple signed-session cookie (credentials check with
  bcrypt) rather than NextAuth — same capability, fewer moving parts, allowed by the brief
  ("or an equally simple session approach").

## Record page
- **Record-level Verification Level** (hero %) wasn't defined: computed as the mean of
  event levels weighted by each event's sealed-document count, historical events excluded.
  Seed data yields **89% / High** (prototype showed an illustrative 86%).
- "Verified events" count in the sidebar = events at band High (≥85%).
- Invalid/expired token renders a friendly "link isn't valid" page.
- The verify panel's "Anchored" line reads **"Integrity anchoring: pilot mode"** per the
  brief (the prototype's "public ledger" copy was aspirational).
- Stage evidence counts show only documents visible to the current scope; an event whose
  documents are all out of scope still shows its timeline entry (scopes hide documents,
  not history — except insurer/surveyor, which is restricted to structural assets).

## Verification rules
- Weights in `config/verification-rules.ts` were tuned so the seeded demo record computes
  the prototype's exact figures (extension 100, rewire 100, boiler 62, roof 48) from the
  rules engine — not hard-coded. The engine: per-stage requirements, issuer-class weight
  ratios, owner-provided cap 65, ×0.8 when professionals are listed but none verified.
- Added an `electrical_installation` stage rule (not in the brief's three templates) so
  the 2021 rewire event evaluates naturally.

## Seed
- The demo owner token is a fixed string (`demo-acacia-owner-…`) so the demo link
  survives reseeds. Real tokens are 160-bit random, stored SHA-256-hashed.
- Placeholder PDFs are generated in-code and padded to ~10% of the sizes shown in the
  prototype so listings look plausible without bloating the repo.
- Seed asserts the four computed verification levels and fails loudly if config drift
  changes them.

## Marketing site
- Served as static files from `public/site/`; `/` rewrites to the designed homepage and
  any `*.html` link resolves to `public/site/*.html`, so finished page designs drop in by
  filename with zero wiring. `record.html` redirects to the live seeded record;
  `login.html` redirects to `/admin`.

## Dashboard metric definitions
- "Revisited after 7/30 days" = the record was opened on more than one distinct day AND
  the span between first and last open is ≥ 7/30 days.
- "Open rate" counts issued records with ≥1 open (owner or share link).
- Opens = `record_opened` + `share_opened`; downloads column = individual downloads +
  "download all" uses.

## Admin
- Auth is a signed-session cookie (HMAC + bcrypt), 7-day expiry — see Stack note above.
- Record IDs: `PV-GB-{AREA}-{6 random digits}` with uniqueness retry; AREA defaults from
  the postcode letters, editable at creation (e.g. LDS).
- Sealed evidence can never be deleted from the admin; a stage with documents cannot be
  deleted either. Document metadata stays editable (it isn't part of the sealed bytes);
  file corrections are new versions.
- "Issue record" can be repeated — each run mints a fresh owner token; old tokens keep
  working until expiry (revocation exists at the data layer, no UI in the pilot).
- UPRN lookup is manual in the pilot (staff paste it from findmyaddress.co.uk); the
  create form enforces UPRN-or-reason. A live lookup API can slot into the create action
  later without schema change.

## Analytics
- `share_opened` vs `record_opened` is decided by the token's provenance
  (`createdVia = share_modal` vs issued/seeded owner link).
- Country code only if the host provides a geo header (Cloudflare/Vercel); raw IPs are
  never stored. Device type is a coarse UA sniff: mobile / tablet / desktop / unknown.
