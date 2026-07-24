# Property Vault

**The permanent digital record for every property.**

HPI transformed trust in the used-car market by giving every vehicle a
permanent history. Property Vault does the same for property: one secure,
verified, continually growing record per building — planning, sales,
extensions, surveys, certificates, maintenance, insurance — that **follows the
property, not the owner**. Owners come and go; the property remains, and its
history keeps growing.

## The problem

A single house has information scattered across local-authority planning,
Building Control, architects, engineers, surveyors, agents, solicitors,
lenders, insurers, contractors, and the homeowner's kitchen drawer. Every sale
means finding it all again. Documents get lost, guarantees disappear,
professionals repeat work, and buyers act on incomplete pictures. The property
has no permanent memory.

## What this codebase is

The **pilot build**, live with a first customer (a Leeds structural/civil
engineering consultancy): their staff create verified records for real
completed projects, and homeowners receive a secure link — no account needed —
to a record they can share with solicitors, agents, and surveyors in scoped,
read-only views.

Three surfaces, one Next.js codebase:

- **Homeowner record page** (public, token-gated) — event timeline, stage
  chains with sealed evidence, per-event Verification Level with a full
  "Why 62%?" breakdown, scoped share links, document viewing and
  scope-filtered ZIP download.
- **Professional admin** (authenticated) — property/event CRUD with templated
  stage chains (an Extension event pre-builds Planning → Structural design →
  Built & inspected → Signed off → Warranty), drag-and-drop evidence upload
  with SHA-256 sealing at the moment of upload, event lifecycle
  (`draft → awaiting_evidence → issued → archived`), and a one-click issue
  action that generates the homeowner's link.
- **Pilot analytics** — first-party, GDPR-conscious measurement of opens,
  revisits, document views, and share-link usage, attributed to the specific
  share token, with CSV export. The pilot exists to measure whether homeowners
  and third parties actually use verified records, so tracking is a
  first-class feature.

## Design decisions that matter

**Events, not folders.** The spine is
`Property → Asset → Event → Stage → Evidence`. A document cannot exist outside
that chain — history is the organising principle, not filing.

**Verification Level, never "confidence".** The metric means exactly:
documents exist, issuers are identity-checked, and files are unaltered since
issue. It is never a statement about the quality of the work, and the UI says
so in plain English. The entire rulebook is one typed data file
([config/verification-rules.ts](config/verification-rules.ts)) — weights,
issuer classes, owner-provided caps — and the breakdown panel renders directly
from that structure, so the copy and the calculation can never drift apart.

**Immutability by construction.** Files are hashed (SHA-256) and sealed at
upload; corrections are new versions via `supersedesId`, with prior versions
kept visible. Integrity receipts live in an append-only table.

**Scope filtering in exactly one place.** A single server-side
`visibleTree(property, scope)` prunes what each share scope may see, and the
same function gates document serving and ZIP building — so "an agent-scope
link must never serve structural calculations" is a one-line test, and it's in
the suite.

**Access tokens, not accounts.** Homeowners never make a password. Tokens are
≥128-bit random, stored hashed, revocable, expiring (owner scope excepted).

## XRPL integration (designed-in, next phase)

XRPL is not the database — Property Vault remains the database. XRPL provides
**independent public proof that a verified event existed at a point in time**:

```
document hash → timestamp → XRPL transaction → public verification
```

The integrity layer is built behind an `IntegrityProvider` interface
(`anchor(hash) → receipt`, `verify(hash, receipt) → bool`). The pilot ships a
`LocalProvider` (server-signed receipts in an append-only table); an XRPL
anchoring provider drops into the same seam without touching product code.
Original documents always remain off-chain.

## Run it

```bash
npm install
npm run db:migrate
npm run db:seed      # demo org + staff + a fully-populated demo record
npm run dev          # http://localhost:3000
```

The seed prints the demo record link and admin logins to the console.
SQLite in dev; the schema is Postgres-compatible (`DATABASE_URL` switch), with
Docker + compose files for deployment.

Tests cover token scoping, hash immutability, the verification-level
calculation (including owner-provided caps and attestation requirements), and
analytics attribution:

```bash
npm test
```

## Layout

- [config/verification-rules.ts](config/verification-rules.ts) — the Verification Level rulebook (plain data, no logic)
- [config/event-templates.ts](config/event-templates.ts) — admin event templates
- `src/lib/` — db, tokens, scope filtering, verification engine, integrity + storage providers, analytics
- `src/app/r/[recordId]/` — homeowner record page + document/ZIP serving
- `prisma/` — schema, migrations (SQLite + Postgres), seed
- [DECISIONS.md](DECISIONS.md) — every choice the brief didn't specify, with reasoning

## Where it's heading

Public data layer (sales history and planning metadata linking back to
official sources), a Google-Business-style property claim flow, an AI
assistant answering questions over the record, a digital conveyancing pack,
multi-professional collaboration, and XRPL anchoring of verified-event hashes.
The pilot's seams — the event spine, `visibleTree`, `IntegrityProvider` — were
cut so each of these lands without a rewrite.
