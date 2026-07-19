# Cloud Sync + Email + Daily Reminders (Google Apps Script)

This connects your app to a Google Sheet + Gmail so:
- **Every Customer, Product, Quotation, Proforma, and Invoice** you create
  syncs automatically to a Google Sheet (and PDFs to Google Drive) — so
  your data isn't stuck in one browser.
- You can click **Email** to send any document with the PDF attached, using
  your own Gmail.
- Invoices get **automatic daily reminder emails**: within 2 days of the
  due date, then every 3 days while overdue, until marked Paid.
- Every email sent is logged in an "Email History" tab.

It's optional — the app works fully offline without it, using only the
browser's local storage. It uses your own free Google account; there's no
cost.

## What it does
- When you save a Customer, Product, Quotation, or Proforma, or generate/
  update an Invoice, it's mirrored into its own tab in your Google Sheet
  (Customers, Products, Quotations, Proformas, Invoices).
- Invoice PDFs are also stored in a "Lakshmi Billing PDFs" folder in your
  Google Drive.
- Every day, a script checks all your invoices and automatically emails a
  reminder if a due date is within 2 days, and every 3 days after that if
  it's overdue.
- From **Settings → Cloud Sync** you can also force a full **Push All to
  Cloud** (first-time bulk sync) or **Restore from Cloud** (pull everything
  down onto a new device/browser).

## Step 1 — Create the Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) → **Blank
   spreadsheet**.
2. Rename it "Lakshmi Engineering Billing" (top-left).

## Step 2 — Add the script
1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete the placeholder code in `Code.gs`, and paste in the full contents
   of `google-apps-script/Code.gs` from this project.
3. Click the **+** next to "Files" → **appsscript.json** won't show by
   default; instead click the gear icon ⚙ (Project Settings) on the left
   and check **"Show appsscript.json manifest file in editor"**. Then open
   `appsscript.json` from the file list and replace its contents with the
   `google-apps-script/appsscript.json` from this project.
4. Click the **Save** icon (💾).

## Step 3 — Set your secret key and sender name
1. In the Apps Script editor, click the gear icon ⚙ **Project Settings**.
2. Scroll to **Script Properties → Add script property**, and add:
   - `SHARED_SECRET` → make up a long random password (you'll paste the
     same value into the app's Settings page — this stops strangers from
     posting fake data to your script).
   - `SENDER_NAME` → `Lakshmi Engineering` (or whatever you want emails to
     show as the sender name).
   - `REMINDER_DAYS_BEFORE` → `2` (optional, this is the default)
   - `REMINDER_INTERVAL_OVERDUE` → `3` (optional, this is the default)

## Step 4 — Run setup once
1. Back in the code editor, at the top dropdown next to **Run**, select
   `setup`.
2. Click **Run**. Google will ask you to authorize — click through
   **Review permissions → (your account) → Advanced → Go to project
   (unsafe) → Allow**. ("Unsafe" just means Google hasn't reviewed this
   personal script — it's your own code, running only for you.)
3. This creates the "Customers", "Products", "Quotations", "Proformas",
   "Invoices", and "Email History" tabs in your Sheet, and a "Lakshmi
   Billing PDFs" folder in your Google Drive.

## Step 5 — Deploy as a Web App
1. Click **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" → **Web app**.
3. Set:
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone
4. Click **Deploy**, authorize again if asked.
5. Copy the **Web app URL** it gives you (ends in `/exec`) — you'll paste
   this into the app.

## Step 6 — Turn on the daily reminder trigger
1. In the Apps Script editor, click the alarm-clock icon **Triggers** on
   the left.
2. Click **+ Add Trigger**.
3. Set:
   - Function: `sendDueReminders`
   - Event source: Time-driven
   - Type: Day timer
   - Time: pick a window, e.g. 8am–9am
4. Click **Save**.

## Step 7 — Connect it in the app
1. Open the app → **Settings**.
2. Scroll to **Email Automation** and fill in:
   - **Apps Script Web App URL** → the `/exec` URL from Step 5
   - **Shared Secret** → the same value you set as `SHARED_SECRET`
3. Click **Test Connection** — it should say "Connected."
4. Toggle **Enabled** on, then **Save Settings**.
5. If you already had customers/products/quotations/invoices in the app
   before connecting this, scroll down to **Cloud Sync** and click **Push
   All to Cloud** once, to backfill everything you created earlier.

From now on, every Customer/Product/Quotation/Proforma you save, and every
Invoice you generate or mark Paid/Unpaid, syncs to your Sheet automatically
in the background — you don't need to do anything extra. The daily trigger
handles reminders on its own too, even with the app closed.

### Using a second device
On a new phone or computer, install the app, log in, go to **Settings →
Email Automation**, enter the same Web App URL + secret, connect, then use
**Cloud Sync → Restore from Cloud** to pull all your existing data down onto
that device. Note this **replaces** whatever's currently in local storage
on that device with what's in the Sheet, so use it on a fresh setup, not
when you have unsynced local changes you want to keep.

## Notes
- Gmail's free sending limit is 100 emails/day on a regular Gmail account
  (500/day on Google Workspace) — plenty for this use case.
- You can open the Sheet any time to browse every Customer, Product,
  Quotation, Proforma, Invoice, and the full email log in "Email History".
  The readable columns are for browsing; the "DataJSON" column in each tab
  is the full record the app uses to restore data exactly.
- Don't manually edit rows in the Sheet expecting the app to pick it up —
  sync is one-way (app → Sheet) except for the explicit "Restore from
  Cloud" action, which reads the "DataJSON" column back in.
- To stop automatic reminders for one invoice, mark it **Paid** in the app.
- To pause everything, just turn off the "Enabled" toggle in Settings, or
  delete the trigger in Step 6.
