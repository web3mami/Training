# 2048 · Anime edition

Vite + vanilla JS clone of 2048 with an anime-style UI, accounts, and local rankings.

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Accounts & “stay logged in”

- Sign up and sign in use **your browser’s storage** (`localStorage`), not a server.
- **Same device / same browser only:** accounts and rankings are not synced to other phones, computers, or browsers.
- **“Stay logged in”** means your session is cached in that storage until you choose **Log out** or clear site data for this app.
- **Usernames** must be unique **on this device** (stored keys are lowercase).

## Passwords

- Passwords are hashed in the browser (PBKDF2); plain passwords are not stored.
- There is **no password reset or recovery** in this version. If you forget your password, you can register a **different username** or clear site data (which **deletes all local accounts and scores** for this origin).

## Rankings

- **Online (Vercel + Neon):** After you connect Neon Postgres to the Vercel project and create the `leaderboard` table (see SQL in earlier setup), the app calls **`/api/leaderboard`** to load and save rows. Everyone hitting your **deployed** site shares one leaderboard (sorted by level, then peak tile, then score).
- **Offline / fallback:** The game still keeps a **copy in the browser** (`localStorage`). If the API fails (e.g. `npm run dev` without `vercel dev`, or DB not ready), Rankings falls back to **this device only**.

### Local full-stack dev

```bash
npx vercel dev
```

Use the URL Vercel prints so `/api/leaderboard` works with your pulled env vars.

## Neon SQL (tables)

Run in the Neon SQL editor if you have not already:

```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  user_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  peak_tile INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_logins (
  user_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  login_count INT NOT NULL DEFAULT 1
);
```

## Admin stats (`/admin`)

- Open **`/admin`** on your deployed site (rewrites to `admin.html`).
- Default login: **`Mami`** / **`Mami`**. Set **`ADMIN_USERNAME`** and **`ADMIN_PASSWORD`** in Vercel **Environment Variables** for anything public.
- Shows **unique players** who used **Sign in** or **Register** on the live site (server `player_logins` table), plus total login events and how many rows exist on the **leaderboard**.

## Real multi-user auth (optional next step)

To support the same accounts everywhere and secure reset flows, you would connect the app to a hosted backend (for example Supabase or Firebase Auth) and replace the local-only account logic.
