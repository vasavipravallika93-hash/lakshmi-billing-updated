/**
 * LAKSHMI ENGINEERING — Billing Cloud Sync + Email/Reminder Backend
 * -------------------------------------------------------------------
 * Lives inside a Google Sheet (Extensions > Apps Script). Jobs:
 *  1) Mirrors every Customer, Product, Quotation, Proforma, and Invoice
 *     from the web app into this Sheet (and PDFs into Drive), so your
 *     data isn't stuck in one browser.
 *  2) Sends email on demand, and automatically sends reminder emails on
 *     a daily schedule for invoices that are due soon or overdue.
 *
 * This file is optional. The web app keeps working fully offline without
 * it — local storage in the browser is always the source of truth for
 * whichever device you're using; this Sheet is a synced copy + backup.
 *
 * SETUP: see SETUP.md in this folder for the full click-by-click guide.
 */

// ---------- CONFIG (read from Script Properties, see SETUP.md) ----------
function getConfig() {
  const p = PropertiesService.getScriptProperties();
  return {
    secret: p.getProperty("SHARED_SECRET") || "",
    reminderDaysBefore: Number(p.getProperty("REMINDER_DAYS_BEFORE") || 2),
    reminderIntervalOverdue: Number(p.getProperty("REMINDER_INTERVAL_OVERDUE") || 3),
    senderName: p.getProperty("SENDER_NAME") || "Lakshmi Engineering",
  };
}

const INVOICES_SHEET = "Invoices";
const HISTORY_SHEET = "Email History";
const PDF_FOLDER_NAME = "Lakshmi Billing PDFs";

// Invoices keep their original first 11 columns exactly as-is (the daily
// reminder job reads them by position) — Id/DataJSON/UpdatedAt are appended
// at the end so nothing that already works gets disturbed.
const INVOICE_HEADERS = [
  "Number", "Date", "DueDate", "CustomerName", "CustomerEmail", "CustomerPhone",
  "Total", "Status", "PdfFileId", "LastReminderDate", "ReminderCount",
  "Id", "DataJSON", "UpdatedAt",
];
const HISTORY_HEADERS = ["Date", "Customer", "Email", "Document", "Status", "Type"];

// Generic entities: Customers, Products, Quotations, Proformas. Each row
// keeps a few readable columns plus a full DataJSON column so the app can
// perfectly reconstruct the record (including line items) when pulling
// data back down onto a new device.
const ENTITY_SHEETS = {
  customer: { name: "Customers", headers: ["Id", "CustomerId", "Name", "Phone", "Email", "GST", "DataJSON", "UpdatedAt"] },
  product: { name: "Products", headers: ["Id", "Name", "HSN", "Rate", "Stock", "DataJSON", "UpdatedAt"] },
  quotation: { name: "Quotations", headers: ["Id", "Number", "Date", "CustomerName", "Total", "DataJSON", "UpdatedAt"] },
  proforma: { name: "Proformas", headers: ["Id", "Number", "Date", "CustomerName", "Total", "DataJSON", "UpdatedAt"] },
};

// ---------- one-time setup ----------
// Run this once manually from the Apps Script editor (select "setup" > Run).
function setup() {
  getOrCreateSheet_(INVOICES_SHEET, INVOICE_HEADERS);
  getOrCreateSheet_(HISTORY_SHEET, HISTORY_HEADERS);
  Object.keys(ENTITY_SHEETS).forEach(function (type) {
    const cfg = ENTITY_SHEETS[type];
    getOrCreateSheet_(cfg.name, cfg.headers);
  });
  getOrCreatePdfFolder_();
  Logger.log("Setup complete. Sheets and Drive folder are ready.");
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

function getOrCreatePdfFolder_() {
  const it = DriveApp.getFoldersByName(PDF_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(PDF_FOLDER_NAME);
}

// ---------- web app entry point ----------
// The frontend POSTs here (Content-Type: text/plain to avoid CORS preflight).
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const config = getConfig();

    if (!config.secret || body.secret !== config.secret) {
      return jsonResponse_({ ok: false, error: "Invalid or missing secret key." });
    }

    let result;
    switch (body.action) {
      case "sync":
        result = handleSync_(body.payload);
        break;
      case "syncEntity":
        result = handleSyncEntity_(body.payload.entityType, body.payload.record);
        break;
      case "deleteEntity":
        result = handleDeleteEntity_(body.payload.entityType, body.payload.id);
        break;
      case "pullAll":
        result = handlePullAll_();
        break;
      case "sendNow":
        result = handleSendNow_(body.payload);
        break;
      case "ping":
        result = { pong: true };
        break;
      default:
        return jsonResponse_({ ok: false, error: "Unknown action: " + body.action });
    }
    return jsonResponse_({ ok: true, result });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- sync an invoice (create/update row, store PDF in Drive) ----------
function handleSync_(payload) {
  const sheet = getOrCreateSheet_(INVOICES_SHEET, INVOICE_HEADERS);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.number) {
      rowIndex = i + 1; // 1-indexed, +1 for header
      break;
    }
  }

  let pdfFileId = rowIndex > 0 ? data[rowIndex - 1][8] : "";
  if (payload.pdfBase64) {
    const folder = getOrCreatePdfFolder_();
    const blob = Utilities.newBlob(
      Utilities.base64Decode(payload.pdfBase64),
      "application/pdf",
      (payload.number || "invoice").replace(/\//g, "-") + ".pdf"
    );
    // replace old file if present
    if (pdfFileId) {
      try { DriveApp.getFileById(pdfFileId).setTrashed(true); } catch (e) {}
    }
    const file = folder.createFile(blob);
    pdfFileId = file.getId();
  }

  const row = [
    payload.number,
    payload.date,
    payload.dueDate || "",
    payload.customerName || "",
    payload.customerEmail || "",
    payload.customerPhone || "",
    payload.total || 0,
    payload.status || "Unpaid",
    pdfFileId,
    rowIndex > 0 ? data[rowIndex - 1][9] : "",
    rowIndex > 0 ? data[rowIndex - 1][10] : 0,
    payload.id || (rowIndex > 0 ? data[rowIndex - 1][11] : ""),
    payload.record ? JSON.stringify(payload.record) : (rowIndex > 0 ? data[rowIndex - 1][12] : ""),
    new Date(),
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return { synced: payload.number };
}

// ---------- generic sync for Customers / Products / Quotations / Proformas ----------
function handleSyncEntity_(entityType, record) {
  const cfg = ENTITY_SHEETS[entityType];
  if (!cfg) throw new Error("Unknown entity type: " + entityType);
  if (!record || !record.id) throw new Error("Record is missing an id.");

  const sheet = getOrCreateSheet_(cfg.name, cfg.headers);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === record.id) {
      rowIndex = i + 1;
      break;
    }
  }

  const row = buildEntityRow_(entityType, record);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return { synced: record.id };
}

function buildEntityRow_(entityType, r) {
  const json = JSON.stringify(r);
  const now = new Date();
  switch (entityType) {
    case "customer":
      return [r.id, r.customerId || "", r.name || "", r.phone || "", r.email || "", r.gst || "", json, now];
    case "product":
      return [r.id, r.name || "", r.hsn || "", r.rate || 0, r.stock || 0, json, now];
    case "quotation":
    case "proforma":
      return [r.id, r.number || "", r.date || "", (r.customer && r.customer.name) || "", r.total || 0, json, now];
    default:
      throw new Error("Unknown entity type: " + entityType);
  }
}

function handleDeleteEntity_(entityType, id) {
  const cfg = ENTITY_SHEETS[entityType];
  if (!cfg) throw new Error("Unknown entity type: " + entityType);
  const sheet = getOrCreateSheet_(cfg.name, cfg.headers);
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { deleted: id };
}

// ---------- pull everything back down (used to restore/sync a new device) ----------
function handlePullAll_() {
  const out = { customers: [], products: [], quotations: [], proformas: [], invoices: [] };

  Object.keys(ENTITY_SHEETS).forEach(function (type) {
    const cfg = ENTITY_SHEETS[type];
    const sheet = getOrCreateSheet_(cfg.name, cfg.headers);
    const data = sheet.getDataRange().getValues();
    const jsonCol = cfg.headers.indexOf("DataJSON");
    const list = [];
    for (let i = 1; i < data.length; i++) {
      const raw = data[i][jsonCol];
      if (raw) {
        try { list.push(JSON.parse(raw)); } catch (e) {}
      }
    }
    out[type + "s"] = list;
  });

  const invSheet = getOrCreateSheet_(INVOICES_SHEET, INVOICE_HEADERS);
  const invData = invSheet.getDataRange().getValues();
  const invJsonCol = INVOICE_HEADERS.indexOf("DataJSON");
  const invoices = [];
  for (let i = 1; i < invData.length; i++) {
    const raw = invData[i][invJsonCol];
    if (raw) {
      try { invoices.push(JSON.parse(raw)); } catch (e) {}
    }
  }
  out.invoices = invoices;

  return out;
}

// ---------- send an email immediately (manual "Send Email" button) ----------
function handleSendNow_(payload) {
  const config = getConfig();
  if (!payload.to) throw new Error("Customer has no email address on file.");

  const blob = Utilities.newBlob(
    Utilities.base64Decode(payload.pdfBase64),
    "application/pdf",
    payload.filename || "document.pdf"
  );

  GmailApp.sendEmail(payload.to, payload.subject, payload.message, {
    name: config.senderName,
    attachments: [blob],
  });

  logEmail_(payload.customerName, payload.to, payload.documentNumber, "Sent", "Manual");
  return { sent: true };
}

function logEmail_(customer, email, doc, status, type) {
  const sheet = getOrCreateSheet_(HISTORY_SHEET, HISTORY_HEADERS);
  sheet.appendRow([new Date(), customer, email, doc, status, type]);
}

// ---------- daily reminder job ----------
// Set up a time-driven trigger (Triggers > Add Trigger) pointing at this
// function, running once a day. See SETUP.md.
function sendDueReminders() {
  const config = getConfig();
  const sheet = getOrCreateSheet_(INVOICES_SHEET, INVOICE_HEADERS);
  const data = sheet.getDataRange().getValues();
  const today = startOfDay_(new Date());

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const [number, , dueDateRaw, customerName, customerEmail, , total, status, pdfFileId, lastReminderRaw] = row;

    if (!customerEmail || !dueDateRaw || status === "Paid") continue;

    const dueDate = startOfDay_(new Date(dueDateRaw));
    const daysUntilDue = Math.round((dueDate - today) / 86400000);
    const lastReminder = lastReminderRaw ? startOfDay_(new Date(lastReminderRaw)) : null;
    const daysSinceLastReminder = lastReminder ? Math.round((today - lastReminder) / 86400000) : Infinity;

    let shouldSend = false;
    let reasonStatus = status;

    if (daysUntilDue >= 0 && daysUntilDue <= config.reminderDaysBefore) {
      // due soon — send once
      shouldSend = daysSinceLastReminder > 0 || !lastReminder;
      reasonStatus = "Due Soon";
    } else if (daysUntilDue < 0) {
      // overdue — send every N days
      shouldSend = daysSinceLastReminder >= config.reminderIntervalOverdue || !lastReminder;
      reasonStatus = "Overdue";
    }

    if (!shouldSend) continue;

    try {
      const attachments = [];
      if (pdfFileId) {
        attachments.push(DriveApp.getFileById(pdfFileId).getBlob());
      }
      const subject =
        reasonStatus === "Overdue"
          ? `Payment overdue — Invoice ${number} — ${config.senderName}`
          : `Payment reminder — Invoice ${number} due soon — ${config.senderName}`;
      const message =
        `Dear ${customerName},\n\n` +
        (reasonStatus === "Overdue"
          ? `This is a reminder that Invoice ${number} for ₹${total} is now overdue. Please arrange payment at your earliest convenience.\n\n`
          : `This is a reminder that Invoice ${number} for ₹${total} is due on ${formatDate_(dueDate)}.\n\n`) +
        `The invoice PDF is attached for your reference.\n\n` +
        `Thank you,\n${config.senderName}`;

      GmailApp.sendEmail(customerEmail, subject, message, {
        name: config.senderName,
        attachments,
      });

      sheet.getRange(i + 1, 10).setValue(today); // LastReminderDate
      sheet.getRange(i + 1, 11).setValue((row[10] || 0) + 1); // ReminderCount
      logEmail_(customerName, customerEmail, number, "Sent", "Reminder (" + reasonStatus + ")");
    } catch (err) {
      logEmail_(customerName, customerEmail, number, "Failed: " + err, "Reminder (" + reasonStatus + ")");
    }
  }
}

function startOfDay_(d) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}
function formatDate_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd-MM-yyyy");
}
