import { db } from "./storage";

// Posts as text/plain (not application/json) on purpose — this avoids the
// browser sending a CORS preflight OPTIONS request, which Apps Script web
// apps don't handle. Apps Script parses e.postData.contents as JSON itself.
async function post(action, payload) {
  const settings = db.getSettings();
  if (!settings.appsScriptUrl) {
    throw new Error("Set the Apps Script Web App URL in Settings first.");
  }
  const res = await fetch(settings.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: settings.appsScriptSecret || "", action, payload }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Apps Script request failed.");
  return json.result;
}

export const appsScript = {
  isConfigured() {
    const s = db.getSettings();
    return !!(s.appsScriptUrl && s.autoEmailEnabled);
  },

  ping() {
    return post("ping", {});
  },

  // Sync an invoice's data + PDF into the connected Google Sheet / Drive so
  // the daily reminder trigger can see it and act on it.
  syncInvoice({ id, number, date, dueDate, customer, total, status, pdfBase64, record }) {
    return post("sync", {
      id,
      number,
      date,
      dueDate,
      customerName: customer?.name,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      total,
      status,
      pdfBase64,
      record,
    });
  },

  // Generic sync for Customers, Products, Quotations, Proformas — mirrors
  // the full record (as JSON) into its own tab in the connected Sheet.
  syncEntity(entityType, record) {
    return post("syncEntity", { entityType, record });
  },
  deleteEntity(entityType, id) {
    return post("deleteEntity", { entityType, id });
  },

  // Pulls everything back down from the Sheet — used to hydrate a new
  // device/browser, or to recover after clearing local storage.
  pullAll() {
    return post("pullAll", {});
  },

  // Send one email right now (Quotation, Proforma, or Invoice).
  sendNow({ to, customerName, subject, message, documentNumber, filename, pdfBase64 }) {
    return post("sendNow", { to, customerName, subject, message, documentNumber, filename, pdfBase64 });
  },
};
