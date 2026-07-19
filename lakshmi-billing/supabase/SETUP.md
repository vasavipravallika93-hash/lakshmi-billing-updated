# Supabase Setup — Customers & Products

Customers and Products are stored in [Supabase](https://supabase.com) — a
free, hosted Postgres database — instead of the browser's local storage.
This means they're the same on every device/browser you use, not tied to
one computer. (Quotations, Proforma Invoices, and Invoices still save
locally on whichever device generated them, same as before.)

Takes about 5 minutes, free tier is plenty for this.

## Step 1 — Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → sign up / log in (GitHub
   login is easiest) → **New Project**
2. Pick an organization, name the project (e.g. "lakshmi-billing"), set a
   database password (save it somewhere, you likely won't need it again),
   choose a region close to you → **Create new project**
3. Wait ~1-2 minutes for it to finish provisioning

## Step 2 — Run the schema
1. In your new project, go to the **SQL Editor** (left sidebar) → **New
   query**
2. Open `supabase/schema.sql` from this project, copy the whole thing,
   paste it into the SQL editor
3. Click **Run** (or Ctrl/Cmd+Enter)
4. You should see "Success. No rows returned" — this created the
   `customers` and `products` tables

## Step 3 — Get your API keys
1. Go to **Project Settings** (gear icon) → **API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon public** key (a long string starting with `eyJ...`) —
   this is safe to use in the browser, it's the public/anonymous key, not
   the secret service key

## Step 4 — Add them to your app
In your project folder:
```bash
cp .env.example .env   # if you haven't already
```
Open `.env` and fill in:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```
Restart `npm run dev` if it was already running.

## Step 5 — Test it
1. Open the app → **Customers → New Customer** → fill it in → Save
2. Go back to Supabase → **Table Editor** (left sidebar) → **customers**
   table → your new row should be there
3. Do the same for **Products**

## Deploying to Vercel
Add the same two variables under **Project Settings → Environment
Variables** in Vercel (alongside `VITE_OWNER_EMAIL` /
`VITE_OWNER_PASSWORD`), then redeploy.

## A note on security
This app has a single owner and its own simple login screen — it doesn't
use Supabase's own user-authentication system. To keep things simple, the
database tables are set to allow the app's public key to read and write
freely (see the `schema.sql` policies). That's fine as long as:
- You don't commit your real `.env` file to a public GitHub repo (the
  `.gitignore` in this project already excludes it)
- You don't publish your Supabase URL/key anywhere public

If you ever want tighter security (e.g. multiple staff logins, or locking
data to a verified user), that's a bigger change involving Supabase Auth —
let me know if you want that built later.

## What's NOT in Supabase
Quotations, Proforma Invoices, and Invoices still save to the browser's
local storage on whichever device generated them (same as the rest of this
app). Only Customers and Products moved to Supabase. If you want those
moved too later so they're accessible from any device, that's a
straightforward extension of this same setup — just say the word.
