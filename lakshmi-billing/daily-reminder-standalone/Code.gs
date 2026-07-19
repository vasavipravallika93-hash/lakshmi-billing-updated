/**
 * STANDALONE DAILY EMAIL REMINDER
 * ---------------------------------
 * Not connected to the billing app in any way. Lives in its own Google
 * Sheet. You edit the recipient list and the email template directly in
 * the Sheet cells — no code changes needed for day-to-day use — and a
 * daily trigger sends the email to everyone on the list every morning.
 *
 * SETUP: see SETUP.md in this folder.
 */

const RECIPIENTS_SHEET = "Recipients";
const TEMPLATE_SHEET = "Template";
const LOG_SHEET = "Log";

// ---------- run this once from the Apps Script editor ----------
function setup() {
  getOrCreateSheet_(RECIPIENTS_SHEET, ["Email", "Name"]);
  getOrCreateSheet_(LOG_SHEET, ["Date", "Email", "Subject", "Status"]);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let t = ss.getSheetByName(TEMPLATE_SHEET);
  if (!t) t = ss.insertSheet(TEMPLATE_SHEET);
  if (!t.getRange("A1").getValue()) {
    t.getRange("A1").setValue("Subject");
    t.getRange("B1").setValue("Good morning — daily reminder");
    t.getRange("A2").setValue("Body");
    t.getRange("B2").setValue(
      "Hi {{name}},\n\nThis is your reminder for {{date}}.\n\n" +
      "(Edit this text in cell B2 of the Template tab — you can use {{name}} and {{date}} anywhere.)\n\n" +
      "— Lakshmi Engineering"
    );
    t.setColumnWidth(2, 520);
    t.getRange("A1:A2").setFontWeight("bold");
  }

  // a couple of example rows so the sheet isn't empty/confusing
  const r = ss.getSheetByName(RECIPIENTS_SHEET);
  if (r.getLastRow() === 1) {
    r.appendRow(["example@company.com", "Example Name"]);
  }

  Logger.log("Setup complete. Edit the Recipients and Template tabs, then add the daily trigger (see SETUP.md).");
}

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ---------- the daily job — point a time-driven trigger at this ----------
function sendDailyReminder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recipientsSheet = ss.getSheetByName(RECIPIENTS_SHEET);
  const templateSheet = ss.getSheetByName(TEMPLATE_SHEET);
  const logSheet = getOrCreateSheet_(LOG_SHEET, ["Date", "Email", "Subject", "Status"]);

  if (!recipientsSheet || !templateSheet) {
    Logger.log("Run setup() first.");
    return;
  }

  const subjectTemplate = templateSheet.getRange("B1").getValue();
  const bodyTemplate = templateSheet.getRange("B2").getValue();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MM-yyyy");

  const data = recipientsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const email = String(data[i][0] || "").trim();
    const name = String(data[i][1] || "").trim();
    if (!email) continue;

    const subject = fillTemplate_(subjectTemplate, { name, date: today });
    const body = fillTemplate_(bodyTemplate, { name, date: today });

    try {
      MailApp.sendEmail(email, subject, body);
      logSheet.appendRow([new Date(), email, subject, "Sent"]);
    } catch (err) {
      logSheet.appendRow([new Date(), email, subject, "Failed: " + err]);
    }
  }
}

function fillTemplate_(str, vars) {
  return String(str).replace(/{{\s*(\w+)\s*}}/g, function (_, key) {
    return vars[key] !== undefined ? vars[key] : "";
  });
}

// ---------- optional: run manually any time to send right now ----------
// Select "sendDailyReminder" in the Run dropdown and click Run — same
// function the daily trigger calls, so this is exactly what will happen
// each morning. Good for testing before you trust the schedule.
