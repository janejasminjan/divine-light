# Qiyam — Quran Learning & Memorization App

A full-stack web application for reading, learning, and memorizing the Quran. Built on a pnpm monorepo.

## Architecture

```
artifacts/
  quran-app/       — React + Vite frontend (slug: quran-app, path: /)
  api-server/      — Express 5 backend (path: /api)
  mockup-sandbox/  — Design prototyping server
lib/
  api-spec/        — OpenAPI spec + orval codegen config
  api-client-react/ — Generated TanStack Query hooks
  api-zod/         — Generated Zod schemas
  db/              — Drizzle ORM schema + migrations
  replit-auth-web/ — useAuth() hook for web frontend (wraps GET /api/auth/user)
```

## Tech Stack

- **Frontend**: React 18, Vite, Wouter (routing), TanStack Query, Framer Motion, ShadCN/UI, Tailwind CSS v4
- **Backend**: Express 5, Drizzle ORM, PostgreSQL, Zod validation, Pino logging
- **Code generation**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **External API**: alquran.cloud (Quran text + translations); cdn.islamic.network (MP3 audio)

## Design System

- **Palette**: Warm amber background (`hsl(40 33% 97%)`), deep teal primary (`hsl(190 51% 18%)`), gold secondary (`hsl(43 65% 53%)`)
- **Fonts**: Amiri (Arabic text), Outfit (UI), system mono
- **App name**: Qiyam

## Reading Profile System (E-Reader Theme Engine)

6 profiles managed by `src/hooks/use-reading-profile.ts` + `src/lib/display-profiles.ts`:

| Profile | Type | Description |
|---------|------|-------------|
| `light` | Standard | Default warm amber app theme |
| `dark`  | Standard | Dark teal / night reading |
| `kobo`  | E-Reader | Kobo ComfortLight PRO simulation — front-lit warm ramp (brightness + warmth controls) |
| `boox`  | E-Reader | Onyx BOOX dual-channel — white LED + amber LED independently controlled |
| `kindle`| E-Reader | Kindle App software themes — White / Sepia / Black (sepia intensity control) |
| `paper` | E-Reader | Passive reflective e-ink — fixed matte off-white, adjustable ink contrast |

**Architecture:**
- All colours computed with OKLCH perceptual math (`oklch()` CSS values) — no HSL triplet blending
- `@theme inline` maps Tailwind colour tokens directly to CSS vars (removed `hsl()` wrapper)
- E-reader profiles: base CSS class provides default values; JS (`useReadingProfile` hook) dynamically overrides 13 surface CSS vars (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--sidebar`, etc.) via `document.documentElement.style.setProperty`
- Accent colours (`--primary`, `--secondary`, `--ring`, `--destructive`) are class-only — never JS-overridden
- Per-profile settings stored in `localStorage` (`qiyam_profile`, `qiyam_profile_settings`); migrates from legacy `qiyam_theme` key
- Settings page shows side-by-side live preview of all 4 e-reader profiles with inline OKLCH-computed styles

## Features Implemented

1. **Onboarding** — 3-step wizard (goal, level, daily duration)
2. **Dashboard** — streak, memorized count, time practiced, due-for-review card
3. **Quran Browser** (`/quran`) — all 114 surahs with Arabic name, search
4. **Surah Reading** (`/quran/:surahId`) — Arabic text (Amiri font), English translation, audio player with speed/repeat, per-ayah bookmark + add-to-plan
5. **Memorization Plan** (`/memorize`) — track Hifz progress, status filter, SM-2 SRS metadata
6. **Review Session** (`/review`) — SRS due-review queue, audio playback, Forgot/Hard/Easy rating
7. **Progress** (`/progress`) — stats summary, GitHub-style activity heatmap, per-surah completion bars, badges
8. **Settings** (`/settings`) — reciter, font size, tajweed highlighting, transliteration, daily goal, reading profile calibration

## Auth System

Optional Replit Auth (OIDC/PKCE) with guest-mode fallback:

- **Guest mode**: On first visit, a `guest_<uuid>` cookie is set (`httpOnly`). The server automatically creates a guest user row in the DB. All routes work immediately without login.
- **Sign in**: `GET /api/login` → Replit OIDC → `GET /api/callback` → session cookie (`sid`, `httpOnly`). Auth is layered on top of guest mode; existing guest data stays intact.
- **Session**: Stored in PostgreSQL `sessions` table via `lib/auth.ts`. Auto-refreshed via OIDC refresh tokens.
- **Guest migration**: After sign-in, if a `guest_id` cookie exists, `GET /api/auth/user` returns `hasPendingGuestData: true`. The user is prompted with an "Import guest data" button in the sidebar auth panel. `POST /api/migrate-guest` atomically transfers bookmarks, memorization entries, review history, activity logs, badges (with de-duplication), and merges learning preferences if the authenticated user hasn't completed onboarding. Runs in a single DB transaction.
- **Auth middleware**: `authMiddleware` reads the session cookie and populates `req.user`. `guestMiddleware` (always runs after) sets `req.resolvedUserId` to either the OIDC user ID or guest ID. All routes use `req.resolvedUserId`.
- **Frontend lib**: `lib/replit-auth-web` — `useAuth()` hook wraps `GET /api/auth/user`, exposes `{ user, isLoading, isAuthenticated, hasPendingGuestData, login, logout, migrateGuestData, refetch }`.
- **Auth panel**: `artifacts/quran-app/src/components/auth-panel.tsx` — shown in sidebar (desktop). Shows avatar + name for authenticated users, sign-in button for guests, "Import guest data" button when migration is pending.

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/auth/user | Current user + hasPendingGuestData |
| GET | /api/login | Redirect to Replit OIDC |
| GET | /api/callback | OIDC callback, sets session cookie |
| GET | /api/logout | Clears session, redirects to Replit logout |
| POST | /api/migrate-guest | Atomic guest-to-account migration |

## Backend Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users/profile | Get user profile |
| PUT | /api/users/profile | Update profile |
| POST | /api/users/onboarding | Complete onboarding |
| GET | /api/memorization/plan | Get memorization entries |
| POST | /api/memorization/plan | Add ayah(s) to plan |
| PUT | /api/memorization/:id | Update entry status |
| GET | /api/memorization/srs/due | Get ayahs due for SRS review |
| POST | /api/memorization/srs/review | Submit SRS review rating (atomic transaction) |
| GET | /api/progress | Overall progress summary |
| GET | /api/progress/heatmap | Activity heatmap data |
| GET | /api/progress/surah-stats | Per-surah memorization stats |
| POST | /api/activity | Log a practice session (atomic transaction) |
| GET | /api/bookmarks | List bookmarks |
| POST | /api/bookmarks | Create bookmark |
| DELETE | /api/bookmarks/:id | Delete bookmark |

## Database Schema

- `users` — auth identity (varchar PK: OIDC sub or `guest_<uuid>`), profile, settings, streak, onboarding flag, auth timestamps
- `sessions` — OIDC session storage (sid, sess jsonb, expire)
- `memorization_entries` — per-ayah Hifz status + SM-2 SRS fields (userId: varchar)
- `review_history` — SRS review log per entry (userId: varchar)
- `activity_logs` — daily practice sessions (used for heatmap + streaks, userId: varchar)
- `bookmarks` — saved ayahs with optional notes (userId: varchar)
- `badges` — earned achievement badges (userId: varchar)

## Key Conventions

- All generated code lives in `lib/*/src/generated/` — do not edit manually
- To regenerate after OpenAPI changes: `pnpm --filter @workspace/api-spec run codegen`
- orval config: `indexFiles: false`, no `schemas` key in zod output
- `lib/api-zod/src/index.ts` exports only `./generated/api`
- Audio URL: `https://cdn.islamic.network/quran/audio/128/{reciter}/{globalAyahNumber}.mp3`
  - Global ayah number = sum of all previous surah ayah counts + ayah number within surah
