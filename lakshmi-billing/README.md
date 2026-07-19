# Lakshmi Engineering — Billing Studio

A single-owner billing app: 3 exact Quotation formats → Proforma Invoices →
Invoices, with GST calculation, professional PDF export, and a completeness
check before every download.

**Customers & Products live in Supabase** (a free hosted database), so
they're the same on every device. **Quotations, Proformas, and Invoices**
save to local storage on whichever device generates them (fast, works
offline, no setup required for those). PDFs are generated in your browser
and downloaded straight to your computer.

---

## 1. What's inside

```
src/
  lib/
    storage.js         -> local storage for quotations/proformas/invoices/settings, GST math
    supabaseClient.js    -> Supabase connection
    customersApi.js       -> Customers CRUD (Supabase)
    productsApi.js         -> Products CRUD (Supabase)
    auth.js                 -> single-owner login (env vars)
    verify.js                -> completeness check run after every document is generated
    pdf.js                    -> turns the on-screen document into a downloadable PDF
    appsScript.js               -> optional Google Apps Script client (email/reminders)
  components/
    QuotationTemplate.jsx  -> the 3 exact quotation layouts (product / service x2)
    DocumentTemplate.jsx    -> the Proforma/Invoice layout
    VerifyModal.jsx           -> the "generated completely ✓" checklist popup
    QuickDownload.jsx          -> re-download button used in the list pages
    EmailSendButton.jsx         -> optional "Email" button (needs Apps Script, see below)
    Layout.jsx                   -> sidebar navigation
  pages/
    Login.jsx, Dashboard.jsx, Customers.jsx, Products.jsx,
    Quotations.jsx, Proformas.jsx, Invoices.jsx, Settings.jsx,
    QuotationBuilder.jsx      -> create-a-quotation form (all 3 formats)
    DocumentBuilder.jsx        -> Quotation→Proforma and Proforma→Invoice conversion
supabase/
  schema.sql     -> run this in Supabase to create the Customers/Products tables
  SETUP.md         -> step-by-step Supabase setup
google-apps-script/   -> optional: email sending + daily invoice reminders
daily-reminder-standalone/  -> optional: separate, unrelated scheduled mailer
```

## 2. The 3 quotation formats

Pick one each time you create a quotation — they match 3 real formats used
day to day:

1. **Product / Parts Supply** — S.No / Description / Make / HSN / UOM / Qty
   / Rate / GST / Amount columns. Terms shown as a Payment-Terms-style table
   (Payment Terms, Delivery Time, Taxes, Packing & Forwarding, Freight,
   Offer Validity) plus a numbered Notes list underneath.
2. **Service — Work Break Up** — a Subject line above the table, simpler
   columns (Description / Qty / a custom rate-basis column like "PER TR" /
   Rate / GST / Amount), and a free-text "Work Break Up Details" box instead
   of a terms table.
3. **Service — Numbered Terms** — a heading line, S.No/Description/HSN/UOM/
   Qty/Rate/GST/Amount columns (no Make), and a numbered Terms & Conditions
   list.

**Terms & Conditions are admin-editable** in **Settings → Quotation
Templates**, one section per format. Whatever's saved there pre-fills onto
every new quotation of that type — and you can still tweak the wording on
that specific quotation before generating, without changing the default.

## 3. Run it on your computer

You need [Node.js](https://nodejs.org) 18+ installed.

```bash
cd lakshmi-billing
npm install
cp .env.example .env
```

Open `.env` and set your login:
```
VITE_OWNER_EMAIL=you@example.com
VITE_OWNER_PASSWORD=pick-a-strong-password
```

**Set up Supabase** (needed for Customers/Products) — follow
`supabase/SETUP.md`, then add to `.env`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Then start it:
```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Log in, then go
to **Settings** and confirm your company/bank details, logo, and the
default Terms & Conditions for each quotation format.

## 4. How the day-to-day flow works

1. **Customers** and **Products** — add these first (stored in Supabase).
2. **Quotations → New Quotation** — pick a format, pick a customer, add
   items, edit the pre-filled terms if needed, **Generate**. A checklist
   confirms it's complete, then **Download PDF**.
3. **Quotations list → Convert to Proforma** — copies everything across
   automatically, assigns a new Proforma number.
4. **Proforma Invoices list → Convert to Invoice** — same idea, plus a due
   date. Shows in **Invoices** with a clickable Unpaid/Overdue/Paid status.
5. **Dashboard** — today's activity, pending payments, revenue, and counts
   pulled live from Supabase (customers/products) and local storage
   (quotations/invoices).

## 5. Backing up your data

- **Customers & Products**: already safe in Supabase — back up via
  Supabase's own dashboard (Database → Backups) if you want extra safety.
- **Quotations/Proformas/Invoices**: local to this device. Use
  **Settings → Export Backup** periodically, and **Import Backup** to
  restore. **Reset All Data** wipes local data only (Supabase is untouched).

## 6. Deploying it live on Vercel

### Step 1 — Push to GitHub
```bash
cd lakshmi-billing
git init && git add . && git commit -m "Lakshmi Engineering billing studio"
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main && git push -u origin main
```

### Step 2 — Import into Vercel
[vercel.com](https://vercel.com) → **Add New → Project** → select the repo
→ it auto-detects Vite.

### Step 3 — Add environment variables
Before deploying, add all of these under **Environment Variables**:
- `VITE_OWNER_EMAIL`
- `VITE_OWNER_PASSWORD`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then **Deploy**. (Added variables after deploying? **Redeploy** afterward —
Vite bakes these in at build time.)

### Step 4 — You're live
You get a URL like `lakshmi-billing.vercel.app`. Customers/Products are
identical on every device (Supabase); Quotations/Proformas/Invoices are
per-device unless you set up the optional Apps Script cloud sync below.

## 7. About the "verification" step

Every **Generate** click runs a checklist first: document number assigned,
customer selected, every line item has description/qty/rate, totals
calculated, amount-in-words generated, bank details present. Flags in red
if anything's missing, but still lets you download so you can judge for
yourself.

## 8. Optional: Email + daily reminders + extra cloud sync

Two independent optional add-ons, neither required for the app to work:

- **`google-apps-script/`** — connects Gmail so you can click **Email** on
  any document, and get automatic daily reminder emails for invoices due
  soon/overdue. Also mirrors Quotations/Proformas/Invoices into a Google
  Sheet as an extra backup (Customers/Products don't need this — they're
  already in Supabase). See `google-apps-script/SETUP.md`.
- **`daily-reminder-standalone/`** — a completely separate tool, unrelated
  to invoices: edit a fixed recipient list and a message template in a
  Google Sheet, and it emails everyone on the list every morning. See
  `daily-reminder-standalone/SETUP.md`.

## 9. Scope notes

- Login is a single hardcoded email/password pair via env vars — one owner,
  not a multi-user system.
- Supabase tables use permissive access policies suitable for a
  single-owner tool (see `supabase/SETUP.md` security note) — don't publish
  your `.env` publicly.
- Quotations/Proformas/Invoices are per-device unless you connect the
  optional Google Sheet sync in section 8.
