# Standalone Daily Email Reminder — Setup

This is completely separate from the billing app. It doesn't know about
invoices, customers, or due dates — it's just: **edit a list of emails,
edit a message template, and every morning it sends that message to
everyone on the list.** Useful for team reminders, recurring notices,
anything on a fixed schedule.

Takes about 5 minutes.

## Step 1 — Create a new Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**
2. Rename it something like "Daily Reminder Mailer"

## Step 2 — Add the script
1. **Extensions → Apps Script**
2. Delete the placeholder code, paste in the full contents of
   `daily-reminder-standalone/Code.gs` from this project
3. Click the **Save** icon (💾)

## Step 3 — Run setup once
1. In the toolbar, use the function dropdown next to **Run** → select `setup`
2. Click **Run**
3. Authorize when asked: **Review permissions → your account → Advanced →
   Go to project (unsafe) → Allow**
4. Go back to your Sheet — you'll now see three tabs: **Recipients**,
   **Template**, **Log**

## Step 4 — Edit your recipient list
Open the **Recipients** tab. Column A is email, column B is an optional
name (used for the `{{name}}` token below). Delete the example row, add
your real ones — one per row:

| Email | Name |
|---|---|
| someone@company.com | Someone |
| another@company.com | Another Person |

## Step 5 — Edit your email template
Open the **Template** tab.
- Cell **B1** = the subject line
- Cell **B2** = the email body

You can use these tokens anywhere in either cell, and they'll be filled in
automatically each morning:
- `{{name}}` → the name from column B on the Recipients tab
- `{{date}}` → today's date

Edit B2 directly (click the cell, type your message) — this is the only
place you need to touch to change what gets sent. No code editing needed
once it's set up.

## Step 6 — Test it right now
1. Back in the Apps Script editor, select `sendDailyReminder` in the Run
   dropdown → click **Run**
2. Check your inbox (or a test recipient's inbox)
3. Check the **Log** tab in the Sheet — it records every send with a
   status, so you can always see what happened

## Step 7 — Turn on the daily schedule
1. Click the alarm-clock icon **Triggers** on the left
2. **+ Add Trigger**
3. Set:
   - Function: `sendDailyReminder`
   - Event source: Time-driven
   - Type: Day timer
   - Time: pick a morning window, e.g. 7am–8am
4. **Save**, authorize if asked

Done. From tomorrow morning, everyone on the Recipients tab gets the
Template tab's message automatically — you don't need to open the Sheet or
the app at all unless you want to change the list or the wording.

## Notes
- To pause it: delete the trigger in Step 7, or just clear the Recipients
  tab.
- To send to different people on different days, you could duplicate this
  whole Sheet+script for each group, or extend the Recipients tab with a
  "Days" column and adjust `sendDailyReminder()` to filter by it — ask if
  you want that added.
- Free Gmail accounts can send up to 100 emails/day through this method;
  Workspace accounts get 500/day.
- This uses `MailApp`, which sends as you but doesn't need Gmail-specific
  permissions — simpler to set up than the billing app's Gmail integration.
