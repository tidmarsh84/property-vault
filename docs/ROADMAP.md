# Property Vault — Vision & Roadmap (v3.3)

**The permanent digital record for every property.**

Just as HPI transformed trust in the used-car market by creating a permanent
history for every vehicle, Property Vault creates the equivalent for
residential and commercial property: one secure, verified, continually
growing record that **follows the property, not the owner**.

## The core philosophy

We do not follow people. We follow buildings — exactly like HPI follows
vehicles. Owners come and go. The property remains. Its history continues
growing forever.

Every property already has a story: planning applications, sales, extensions,
surveys, certificates, maintenance, insurance, Building Control, ownership
changes. Today that story is fragmented across dozens of organisations —
local-authority planning, Building Control, architects, structural engineers,
surveyors, estate agents, solicitors, lenders, insurers, homeowners,
contractors, utility providers. Every sale means finding it again. Documents
are lost, guarantees disappear, professionals repeat work, buyers lack
confidence. **The property has no permanent memory.**

## Property identity

Each property receives a permanent identity — e.g. `PV-UK-00000012345` —
linked with address, UPRN (where available/licensed), coordinates, local
authority, and property type. The identity never changes; owners do.

## Events, not folders

Traditional systems organise documents. Property Vault organises **history**:

```
Property → Timeline → Event → Evidence → Verification
```

A single event chains its whole life: planning permission → approved drawings
→ structural calculations → inspection photos → completion certificate →
warranty. Everything remains connected; nothing exists outside the chain.

## Verification

Every uploaded document receives a SHA-256 fingerprint, timestamp, audit
trail, and verification status. Nothing is overwritten — every change becomes
another event.

---

## Phase 0 — Professional pilot ✅ (built, live)

The current codebase. A structural-engineering consultancy creates verified
records for real completed projects; homeowners receive secure scoped links;
every open, revisit, document view, and share is measured first-party.

## Phase 1 — Public data layer (MVP)

Every property begins with a **free public timeline** built from public
information:

- **Property** — address, local authority, basic details
- **Sales** — dates, prices, property type
- **Planning** — reference, application type, proposal, status, decision,
  validation/decision dates, council, **links back to the original official
  documents** (metadata + links, never copies of council documents)

Plus property search and public property profiles.

## Phase 2 — The owner layer & claiming

Like a Google Business Profile: every property already exists, the owner
simply **claims** it — verified via proof of ownership, utility bill, council
tax, Land Registry evidence, or manual review. Claiming unlocks the private
layer: documents, warranties, surveys, guarantees, certificates, insurance,
maintenance records, photos, videos, manuals, invoices. **Private information
never becomes public.**

## Phase 3 — AI layer

Instead of reading PDFs, the record answers questions:

- "Can I build an extension?"
- "When does my boiler warranty expire?"
- "Is Building Control complete?"
- "What documents do I need before selling?"
- "What maintenance is due this year?"

## Phase 4 — Professional platform & conveyancing pack

Role-based access and collaboration for architects, engineers, surveyors,
estate agents, developers, housing associations, councils, lenders,
solicitors, and insurers. The **digital conveyancing pack** holds the standard
transaction dataset — planning history, Building Control records, EPC,
warranties, certificates, survey reports, maintenance history, drawings —
shareable securely with authorised professionals, reducing duplication while
recognising that some information still comes from authoritative external
sources.

## Phase 5 — XRPL anchoring

XRPL is not the database — Property Vault remains the database. XRPL provides
**independent public proof that a verified event existed at a specific point
in time**:

```
document hash → timestamp → XRPL transaction → public verification
```

Original documents remain securely stored off-chain. The pilot's
`IntegrityProvider` seam (`anchor(hash) → receipt`, `verify(hash, receipt)`)
was built precisely so this phase lands without touching product code.

---

## Business model

| Tier | For | Includes |
|---|---|---|
| **Free** | Everyone | Property search, public timeline, planning history, sales history, overview |
| **Homeowner** (subscription) | Owners | Claim property, unlimited storage, AI assistant, maintenance tracking, secure sharing, timeline management |
| **Professional** | Architects, surveyors, engineers, agents, solicitors, developers | Multiple properties, client management, team collaboration, reports, integrations |
| **Enterprise** | Housing associations, councils, lenders, insurers, developers | API access, integrations, enterprise support, custom deployments |

## The network effect

Homeowners add records. Architects upload drawings. Engineers upload
calculations. Surveyors upload reports. Solicitors complete transactions.
Buyers inherit richer histories. **The property record becomes more valuable
over time.**

## Long-term vision

Property Vault evolves from a document repository into the digital operating
system for every property: the homeowner's property companion, the
professional's trusted workspace, the buyer's due-diligence tool, the
lender's verification platform, the insurer's evidence repository — the
property's permanent digital memory.

## The simple explanation

> Property Vault is the HPI for property — but instead of a one-off history
> report, it creates and maintains a living, trusted digital record for every
> property throughout its entire lifecycle.
