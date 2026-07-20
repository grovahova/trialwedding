# oneSIPisallittakes Wedding Planner

A premium, realtime wedding-planning dashboard built with Next.js (App Router), TypeScript,
Tailwind CSS, shadcn-style components, and Supabase (Auth, Postgres, Realtime, Storage).

---

## 1. What's included

- **Auth & roles** — Supabase Auth with three roles (`admin`, `family`, `volunteer`).
  Admins have full access; everyone else can only edit tasks they're assigned to
  (enforced by Postgres Row Level Security, not just the UI).
- **Dashboard** — live countdown timer, planning-time-elapsed ring, overall completion %,
  urgent/today's tasks, per-event progress, shopping & budget snapshots, vendor booking
  progress, red-flagged overdue bookings, recent activity, quick actions.
- **Mobile responsive** — a slide-in drawer nav (hamburger menu) replaces the sidebar
  below the `lg` breakpoint, so every page is fully usable on a phone.
- **Events** — Mehendi / Haldi / Nikah / Reception seeded by default. Admins can add,
  rename, re-theme, archive, restore, or permanently delete events at any time; new
  events immediately get their own Tasks / Shopping / Budget tabs and show up wherever
  tasks are created.
- **Tasks** — four views: Kanban (drag-and-drop, via dnd-kit), Table, List (grouped by
  Overdue / Today / This Week / Later), and Calendar (month grid). Tasks carry priority,
  status, due dates, checklists, comments, multi-assignee, and confetti + toast on
  completion.
- **Vendor Booking Tracker** (`/bookings`) — a dedicated tracker separate from general
  vendor contacts, covering all 15 standard categories (Venue, Catering, Photographer,
  Makeup, Clothes/Tailor, DJ, Lighting, Transportation, Jeweler, Invitation Printing,
  Accommodation, etc.) plus custom "Others" entries. Each booking tracks status
  (Not Booked → Enquired → Negotiating → Booked → Confirmed / Cancelled), contract
  signed, advance/total/balance due, final payment due date, contact + one-tap
  WhatsApp, trial/tasting date, clothes fitting dates, notes, and a signed-contract
  upload. A **red/orange/yellow/green urgency engine** compares today's date against
  each category's typical lead time (e.g. Venue ~9 months out, Makeup ~4 months) and
  flags anything overdue — both on the tracker itself and as a red-flag widget on the
  dashboard homepage.
- **Shopping planner** — categorized items with budget vs. actual, store, assignee,
  purchased toggle.
- **Budget** — planned vs. actual by category (bar chart via Recharts), payment status,
  vendor linkage.
- **Guests** — bride/groom side, group, RSVP status, invitation-sent toggle, food
  preference, one-tap WhatsApp message.
- **Vendors** — category grouping, advance/total/balance, 1–5 star rating, WhatsApp
  contact. (This is general vendor contact info; `/bookings` is the dedicated
  booking-status tracker.)
- **Settings** (admin only) — edit wedding date/couple names (drives the countdown),
  promote/demote member roles.
- **Notifications** — Postgres triggers create notifications on task assignment and
  activity-log entries on task/booking status changes; the bell icon subscribes to
  notifications in realtime.
- **Dark / light mode** (next-themes), global search (tasks/guests/vendors), activity
  log, urgency engine (`getUrgency` in `src/lib/utils.ts` for tasks, `getBookingUrgency`
  in `src/lib/bookings.ts` for vendor bookings).
- Festive visuals throughout — emerald/gold gradients per event type, animated
  progress rings, confetti on task and booking completion, gold-hover card lift.

### Not wired up yet (left as clean extension points)
- Receipt-upload UI for shopping items (the `receipts` Storage bucket + RLS policies
  are already created in the migration — the pattern to copy is the contract upload in
  `booking-detail-dialog.tsx`, which uses the same approach against the `contracts`
  bucket).
- Bulk task edit/duplicate and drag-to-reassign.
- Realtime *live* sync across multiple open browsers (today, changes are read back after
  every mutation; the tables are already added to the `supabase_realtime` publication so
  you can subscribe to `postgres_changes` wherever you want push updates).
- Quick notes widget.

---

## 2. Prerequisites

- Node.js 18.18+ and npm
- A free [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (for deployment)

---

## 3. Set up Supabase

1. Create a new project at supabase.com.
2. Open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql` — creates every core table, enum, trigger, RLS
     policy, and storage bucket.
   - `supabase/migrations/0002_vendor_bookings.sql` — adds the Vendor Booking Tracker
     table, RLS, activity logging, and the `contracts` storage bucket.
   - `supabase/seed.sql` — inserts the wedding date, the four default events, and one
     starter row per required vendor-booking category (**edit the date at the top of
     the file first**).

   > **Safe to re-run.** All three files are idempotent — if a run fails partway, gets
   > run out of order, or you just want to re-apply them, running them again (in the
   > same order) will skip anything already in place rather than erroring with
   > "already exists".
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (only needed once, to create your first admin — see below)

---

## 4. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Add
`SUPABASE_SERVICE_ROLE_KEY` temporarily (only for the next step — remove it, or at least
never deploy it to a public environment).

```bash
npm install
```

---

## 5. Create your first admin user

New sign-ups from the `/login` page default to the `volunteer` role. To bootstrap the
very first **admin** account, run:

```bash
node scripts/seed.mjs you@example.com "a-strong-password" "Your Name"
```

This uses your service-role key to create a confirmed user and set their role to
`admin`. After this, sign in at `/login` — as admin you can promote other members from
**Settings**.

---

## 6. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## 7. Deploy to Vercel

1. Push this project to a GitHub repo.
2. Import it in Vercel.
3. Add the two `NEXT_PUBLIC_*` environment variables from step 3 in **Project Settings →
   Environment Variables** (do **not** add the service-role key to Vercel).
4. Deploy. Vercel will run `next build` automatically.
5. In Supabase, go to **Authentication → URL Configuration** and add your Vercel domain
   to the Site URL / Redirect URLs so auth emails and redirects work in production.

---

## 8. Project structure

```
src/
  app/
    login/                     Sign in / sign up
    (dashboard)/                Authenticated app shell (sidebar + topbar)
      dashboard/                 Homepage widgets
      events/                    Event list + [eventId] detail (Tasks/Shopping/Budget tabs)
      tasks/                     All-tasks Kanban/Table/List/Calendar
      bookings/                  Vendor Booking Tracker (separate from general vendor contacts)
      shopping/  budget/
      guests/    vendors/
      settings/                  Admin-only wedding config + roles
  components/
    ui/                        Hand-rolled shadcn-style primitives (Radix + Tailwind)
    dashboard/ tasks/ events/ bookings/ shopping/ budget/ guests/ vendors/ settings/ layout/
  lib/
    supabase/{client,server}.ts  Browser + server Supabase clients
    types.ts                    Hand-written types mirroring the SQL schema
    queries.ts                  Shared server-side data fetchers
    constants.ts utils.ts bookings.ts
  middleware.ts                 Session refresh + route protection
supabase/
  migrations/0001_init.sql      Core schema, RLS, triggers, storage buckets
  migrations/0002_vendor_bookings.sql  Vendor Booking Tracker table, RLS, contracts bucket
  seed.sql                      Wedding date, default events, starter booking categories
scripts/seed.mjs                CLI to create the first admin user
```

---

## 9. Regenerating fully-typed Supabase types (optional)

`src/lib/types.ts` is hand-written for readability. For column-level type safety, install
the Supabase CLI and run:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/database.types.ts
```

then swap the `Database` import in `src/lib/supabase/client.ts` / `server.ts`.

---

## 10. Security notes

- All access control is enforced in Postgres via Row Level Security — the UI hiding a
  button is a convenience, not the security boundary.
- Members can only `UPDATE` tasks (and their checklists) where they're a listed
  assignee; everyone can `SELECT` everything for transparency.
- The `service_role` key bypasses RLS entirely — it's only ever used from
  `scripts/seed.mjs`, run locally, never in the deployed app.
