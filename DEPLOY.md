# Deploying Property Vault (pilot)

The app runs on SQLite in dev and Postgres in production. The Postgres path is
tested end to end (migrations → seed → serving). Three ways to go live, easiest
first.

Before any of them, generate real secrets (PowerShell):

```powershell
-join ((48..57)+(97..122) | Get-Random -Count 48 | % {[char]$_})   # run twice
```

Use one value for `INTEGRITY_SIGNING_KEY`, another for `AUTH_SECRET`. Never
reuse the dev values.

## Option A — Railway (recommended: real URL in ~10 minutes, ~$5/mo)

1. Push this repo to GitHub (see "Pushing to GitHub" below).
2. Create an account at railway.app → **New Project → Deploy from GitHub repo**
   → pick the repo. Railway detects the Dockerfile automatically.
3. In the project: **+ New → Database → PostgreSQL**. Railway injects
   `DATABASE_URL` — confirm the app service has it under Variables
   (add a reference if not).
4. App service → **Variables**: set `INTEGRITY_SIGNING_KEY`, `AUTH_SECRET`,
   and `APP_BASE_URL` (the railway-provided domain, e.g.
   `https://property-vault-pilot.up.railway.app`).
5. App service → **Settings → Volumes**: mount a volume at `/data/storage`
   and set variable `STORAGE_DIR=/data/storage` (uploaded documents live here).
6. Deploy. Migrations run automatically on boot. Seed the demo record once:
   service → **Settings → one-off command** (or Railway CLI):
   `npx tsx prisma/seed.ts`
7. Open `https://<your-domain>/` — homepage; `/admin` — sign in;
   `/r/PV-GB-LDS-004512?k=demo-acacia-owner-6kQ0v9pXbT2wRzJd` — demo record.
   A custom domain (e.g. pilot.propertyvault.co.uk) attaches under
   Settings → Domains.

## Option B — Any VPS with Docker (Hetzner/DigitalOcean, ~£5/mo)

```bash
git clone <your-repo> && cd property-vault
cat > .env <<EOF
POSTGRES_PASSWORD=<random>
INTEGRITY_SIGNING_KEY=<random>
AUTH_SECRET=<random>
APP_BASE_URL=https://your-domain
EOF
docker compose up -d --build
docker compose exec app npx tsx prisma/seed.ts   # once
```

Put Caddy or nginx in front for HTTPS.

## Option C — Vercel (serverless)

Vercel's filesystem is ephemeral, so this path needs external services:
- Postgres: Neon (neon.tech) free tier → `DATABASE_URL`
- File storage: Cloudflare R2 / any S3 → set `STORAGE_PROVIDER=s3` plus the
  `S3_*` variables from `.env.example` (the S3 driver is built in)
- Build command: `node scripts/set-db-provider.mjs postgresql && next build`
- Run migrations once from your machine:
  `DATABASE_URL=<neon-url> node scripts/apply-migrations-pg.mjs`

Options A/B are simpler for the pilot; C only if you specifically want Vercel.

## Pushing to GitHub

The repo is already committed locally. To publish:

```powershell
cd C:\DAN\WORK\PV\property-vault
git remote add origin https://github.com/<your-username>/property-vault.git
git push -u origin master
```

(Create the empty repo on github.com first — **Private** is right for now.
If git asks you to sign in, follow the browser prompt.)

## Production checklist

- [ ] Fresh `INTEGRITY_SIGNING_KEY` + `AUTH_SECRET` (48+ random chars each)
- [ ] `APP_BASE_URL` set to the real https URL (share links + handover emails use it)
- [ ] Postgres backups enabled (Railway: automatic; VPS: `pg_dump` cron)
- [ ] Storage volume/bucket backed up (sealed documents live there)
- [ ] Change the two seeded staff passwords after first login, or reseed with
      real ones (edit prisma/seed.ts before seeding production)
- [ ] Keep the demo record if useful for demos — it's harmless placeholder data
