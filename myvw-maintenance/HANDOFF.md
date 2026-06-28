# MyVW Maintenance — Project Handoff

A PWA to track maintenance, costs and fuel for **classic air-cooled VWs**
(Beetle/Type 1, Bus/Transporter Type 2, Karmann Ghia, Type 3), with
model/year/mods-aware service suggestions.

**Live app:** https://vini10-blue.github.io/MyVWmaintenance/

---

## Repos & deploy

- **Source of truth:** `github.com/vini10-blue/MyVWmaintenance` (public, default
  branch `main`). App is at the **repo root**. Auto-deploys via GitHub Actions
  (`.github/workflows/deploy.yml`) → GitHub Pages. Base path `/MyVWmaintenance/`
  (set by `BASE_PATH` in CI). Uses **HashRouter** so deep links work on Pages.
- **Dev/working copy:** `github.com/vini10-blue/smart-groceries`, branch
  `claude/vw-maintenance-tracker-vchhv2`, app in subfolder `myvw-maintenance/`.
  Claude's sessions are scoped to this repo, so edits happen here first.
- **User's Mac clone:** `~/MyVWmaintenance`.

### Change → deploy workflow (current friction)
Because Claude can only push to `smart-groceries`, every change is: edit in
`smart-groceries/myvw-maintenance` → commit/push → user copies into their
`MyVWmaintenance` clone and pushes:
```bash
cd /tmp && rm -rf sg-src
git clone --depth 1 -b claude/vw-maintenance-tracker-vchhv2 \
  https://github.com/vini10-blue/smart-groceries.git sg-src
cd ~/MyVWmaintenance
rsync -a --delete \
  --exclude='.git' --exclude='.github' --exclude='node_modules' --exclude='dist' --exclude='.env' \
  /tmp/sg-src/myvw-maintenance/ ./
git add -A && git commit -m "…" && git push
```
**Next time: ideally start the Claude session scoped to `MyVWmaintenance`** to
push/deploy/verify directly and drop this copy-over dance.

> Note: `.env` is git-ignored in `smart-groceries` (so it's NOT in the clone) but
> tracked in `MyVWmaintenance`. It holds the Supabase URL + publishable key.

---

## Tech stack
React 18 + TypeScript + Vite · HashRouter · **Dexie** (IndexedDB, local-first) ·
**Supabase** (auth + Postgres + Storage, cloud mirror) · react-hook-form + zod ·
recharts · **tesseract.js** (on-device receipt OCR) · vite-plugin-pwa.

## Architecture
- **Local-first:** UI reads/writes Dexie via `src/lib/db/repo.ts` + `useLiveQuery`.
- **Cloud mirror:** `src/lib/sync.ts` pushes every write to Supabase and pulls on
  sign-in / window focus / online. Generic per-entity cloud tables shaped
  `{id, user_id, data jsonb, updated_at, deleted}`; `settings` keyed by `user_id`.
  Attachment files go to Supabase Storage bucket `attachments` at
  `<userId>/<attachmentId>`. Offline-safe deletion queue + account-switch wipe.
- **Auth:** email magic-link (PKCE), `src/auth/AuthProvider.tsx`. App gates to the
  Sign-in screen when cloud is configured and no user.
- **Knowledge base:** `src/lib/schedule/catalog.ts` (air-cooled intervals),
  `applicability.ts` (filters by model/year/electrics/fuel + per-car mods +
  interval overrides + global presets), `due.ts` (overdue/due-soon/ok with
  configurable lead time).

## Supabase project
- URL `https://xatbwnfncaparfqqlopp.supabase.co`; publishable key in `.env`
  (public-safe; protected by RLS). **service_role key must never be committed.**
- Tables: `cars, records, fuel_logs, reminders, attachments, settings` — all RLS
  scoped to `auth.uid()`. Storage bucket `attachments` (private, per-user folder).
- Auth → URL Configuration: Site URL + redirect `…/MyVWmaintenance/**`.
- Full setup script: `supabase/setup.sql` (idempotent).

---

## Features shipped ✅
- Garage (multiple cars); CarEditor with **modification toggles** (electronic
  ignition, 12V conversion, disc-brake conversion, full-flow filter, engine swap,
  EFI) that reshape the suggested services; per-car interval overrides.
- **Service suggestions** — model/year/mods-aware air-cooled checklists + a
  disclaimer; one-tap "log this service".
- Maintenance **records** (cost, performed-by, parts, notes, attachments) +
  **receipt scan** (on-device OCR auto-fills amount/date/vendor).
- **History** timeline with category filter.
- **Fuel log** (mpg / L-100km economy, odometer sync feeds due math).
- **Reminders** (overdue/due-soon across garage) + due badges; configurable lead
  time; opt-in **on-open** notification.
- **Reports** (total spend, by-month bar, by-category pie).
- **Settings** (synced): default currency / units / performed-by, reminder lead,
  notifications toggle, and **preset services** (reusable templates that appear in
  every car's suggestions and as quick-picks).
- **Cloud sync + email login**, account-switch data isolation.
- **Vintage air-cooled theme** (parchment, heritage green, Bus-red accents,
  chrome, "Righteous" display font, Beetle emblem) + refreshed icon.
- Installable PWA, offline-capable.

## Known issues / open items ⚠️
1. **Email rate limit** — Supabase built-in email allows only a few sign-in
   emails/hour → "email rate limit exceeded" during heavy testing. Sessions
   persist, so it's rarely hit in normal use. Permanent fix: **custom SMTP
   (Resend)** or **social login (Microsoft/Google)** — not yet done.
2. **End-to-end sync not yet user-verified** — sign in → add car → confirm it
   appears on a 2nd device and as a row in Supabase `cars`. Pending (blocked by #1).
3. **iOS notifications** only fire when the app is opened; true background alerts
   need an **email-reminders backend** (Supabase Edge Function + cron + SMTP).
4. Must use the **full URL** (`…/MyVWmaintenance/`); bare domain 404s.
5. Bundle ~990 KB (recharts + supabase); could code-split. `npm audit` high is
   vite/esbuild **dev-server only** (not in production). No automated tests.

## Backlog (requested / suggested, not built)
- Custom SMTP (Resend) to remove the email limit.
- Email reminders (true background due alerts).
- Dark mode · Theme picker (classic VW color schemes).
- PDF service-history export (great for selling a classic).
- Face ID / PIN app lock · "Sign in with Microsoft" / Google login.

## Immediate next step for the user
Wait out the email rate limit (~1 hr), open the full URL, request **one** sign-in
link, sign in, then verify sync end-to-end (add a car → check 2nd device +
Supabase table).
