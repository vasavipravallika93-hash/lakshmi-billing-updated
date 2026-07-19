import React, { useState } from "react";
import { db } from "../lib/storage";
import { appsScript } from "../lib/appsScript";
import { Save, Download, Upload, Trash2, PlugZap, CheckCircle2, XCircle, CloudUpload, CloudDownload } from "lucide-react";

export default function Settings() {
  const [form, setForm] = useState(db.getSettings());
  const [saved, setSaved] = useState(false);
  const [cloudState, setCloudState] = useState("idle"); // idle | working | done | fail
  const [cloudMessage, setCloudMessage] = useState("");

  // Customers & Products now live in Supabase (always in sync across
  // devices already) — this Push/Restore pair only concerns Quotations,
  // Proformas and Invoices, which still save to local storage per device.
  async function pushAllToCloud() {
    db.saveSettings(form); // make sure the URL/secret just typed are the ones used
    setCloudState("working");
    setCloudMessage("Pushing local quotations/proformas/invoices to your Google Sheet…");
    try {
      const quotations = db.getQuotations();
      const proformas = db.getProformas();
      const invoices = db.getInvoices();

      for (const q of quotations) await appsScript.syncEntity("quotation", q);
      for (const p of proformas) await appsScript.syncEntity("proforma", p);
      for (const inv of invoices) {
        await appsScript.syncInvoice({
          id: inv.id,
          number: inv.number,
          date: inv.date,
          dueDate: inv.dueDate,
          customer: inv.customer,
          total: inv.total,
          status: inv.status,
          record: inv,
        });
      }

      setCloudState("done");
      setCloudMessage(`Pushed ${quotations.length} quotations, ${proformas.length} proformas, ${invoices.length} invoices.`);
    } catch (err) {
      setCloudState("fail");
      setCloudMessage(err.message || "Push failed.");
    }
  }

  async function restoreFromCloud() {
    if (!confirm("This replaces local Quotations, Proformas and Invoices with what's in the Google Sheet. Continue? (Customers/Products live in Supabase and aren't affected.)")) {
      return;
    }
    db.saveSettings(form);
    setCloudState("working");
    setCloudMessage("Pulling data from your Google Sheet…");
    try {
      const dump = await appsScript.pullAll();
      db.hydrateFromCloud({ quotations: dump.quotations, proformas: dump.proformas, invoices: dump.invoices });
      setCloudState("done");
      setCloudMessage("Restored from cloud. Reloading…");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setCloudState("fail");
      setCloudMessage(err.message || "Restore failed.");
    }
  }

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function updateTerms(section, key, value) {
    setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));
  }
  function save(e) {
    e.preventDefault();
    db.saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("logoDataUrl", reader.result);
    reader.readAsDataURL(file);
  }
  function handleStamp(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("stampDataUrl", reader.result);
    reader.readAsDataURL(file);
  }
  function exportBackup() {
    const dump = db.exportAll();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lakshmi-billing-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dump = JSON.parse(reader.result);
        db.importAll(dump);
        alert("Backup restored. Reloading…");
        window.location.reload();
      } catch {
        alert("That file doesn't look like a valid backup.");
      }
    };
    reader.readAsText(file);
  }
  function resetAll() {
    if (confirm("This deletes ALL local data (customers, products, quotations, invoices, settings). Continue?")) {
      db.resetAll();
      window.location.reload();
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-bold text-2xl mb-1">Settings</h1>
      <p className="text-ink/50 text-sm mb-6">Company details used on every generated document.</p>

      <form onSubmit={save} className="bg-white rounded-xl2 shadow-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          {form.logoDataUrl && <img src={form.logoDataUrl} alt="logo" className="h-14 w-14 object-contain rounded border border-ink/10" />}
          <div>
            <label className="text-xs font-semibold text-ink/60 block mb-1">Company Logo</label>
            <input type="file" accept="image/*" onChange={handleLogo} className="text-xs" />
            <p className="text-[11px] text-ink/40 mt-1">Leave unset to use the default Lakshmi Engineering logo.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {form.stampDataUrl && <img src={form.stampDataUrl} alt="stamp" className="h-14 w-14 object-contain rounded border border-ink/10" />}
          <div>
            <label className="text-xs font-semibold text-ink/60 block mb-1">Stamp / Signature</label>
            <input type="file" accept="image/*" onChange={handleStamp} className="text-xs" />
            <p className="text-[11px] text-ink/40 mt-1">Shown above "Authorised Signatory" on every document. Leave unset to use the default stamp.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name" value={form.companyName} onChange={(v) => update("companyName", v)} full />
          <Field label="Tagline" value={form.tagline} onChange={(v) => update("tagline", v)} full />
          <Field label="Address" value={form.address} onChange={(v) => update("address", v)} full textarea />
          <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Field label="Email" value={form.email} onChange={(v) => update("email", v)} />
          <Field label="GST Number" value={form.gst} onChange={(v) => update("gst", v)} />
          <Field label="PAN" value={form.pan} onChange={(v) => update("pan", v)} />
          <Field label="Bank Name" value={form.bankName} onChange={(v) => update("bankName", v)} />
          <Field label="Account No" value={form.accountNo} onChange={(v) => update("accountNo", v)} />
          <Field label="Branch & IFSC" value={form.branchIfsc} onChange={(v) => update("branchIfsc", v)} full />
          <Field label="Quotation Prefix" value={form.quotationPrefix} onChange={(v) => update("quotationPrefix", v)} />
          <Field label="Proforma Prefix" value={form.proformaPrefix} onChange={(v) => update("proformaPrefix", v)} />
          <Field label="Invoice Prefix" value={form.invoicePrefix} onChange={(v) => update("invoicePrefix", v)} />
          <Field label="GST Rate (%)" type="number" value={form.gstRate} onChange={(v) => update("gstRate", Number(v))} />
          <Field label="Email Signature" value={form.emailSignature} onChange={(v) => update("emailSignature", v)} full textarea />
        </div>

        <button className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 flex items-center justify-center gap-2">
          <Save size={16} /> {saved ? "Saved!" : "Save Settings"}
        </button>
      </form>

      <div className="bg-white rounded-xl2 shadow-card p-6 mt-4">
        <h3 className="font-display font-semibold mb-1">Quotation Templates — Default Terms & Conditions</h3>
        <p className="text-xs text-ink/50 mb-4">
          There are 3 quotation formats. Whichever one you pick when creating a quotation, these defaults get
          pre-filled — you can still edit them on that specific quotation before generating.
        </p>

        <div className="space-y-5">
          <div>
            <div className="text-sm font-semibold text-brand-700 mb-2">1. Product / Parts Supply</div>
            <div className="grid grid-cols-2 gap-3">
              <TermField label="Payment Terms" value={form.quotationTermsProduct.paymentTerms} onChange={(v) => updateTerms("quotationTermsProduct", "paymentTerms", v)} />
              <TermField label="Delivery Time" value={form.quotationTermsProduct.deliveryTime} onChange={(v) => updateTerms("quotationTermsProduct", "deliveryTime", v)} />
              <TermField label="Taxes" value={form.quotationTermsProduct.taxes} onChange={(v) => updateTerms("quotationTermsProduct", "taxes", v)} />
              <TermField label="Packing and Forwardings" value={form.quotationTermsProduct.packingForwarding} onChange={(v) => updateTerms("quotationTermsProduct", "packingForwarding", v)} />
              <TermField label="Freight/Transportation" value={form.quotationTermsProduct.freightTransportation} onChange={(v) => updateTerms("quotationTermsProduct", "freightTransportation", v)} />
              <TermField label="Offer validity" value={form.quotationTermsProduct.offerValidity} onChange={(v) => updateTerms("quotationTermsProduct", "offerValidity", v)} />
            </div>
            <label className="text-xs font-semibold text-ink/60 block mt-3">Notes (one per line)</label>
            <textarea
              value={form.quotationTermsProduct.notes}
              onChange={(e) => updateTerms("quotationTermsProduct", "notes", e.target.value)}
              rows={6}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm font-mono"
            />
          </div>

          <div className="pt-4 border-t border-ink/10">
            <div className="text-sm font-semibold text-brand-700 mb-2">2. Service — Work Break Up</div>
            <label className="text-xs font-semibold text-ink/60">Work Break Up Details</label>
            <textarea
              value={form.quotationTermsServiceBreakdown.workBreakup}
              onChange={(e) => updateTerms("quotationTermsServiceBreakdown", "workBreakup", e.target.value)}
              rows={4}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            />
          </div>

          <div className="pt-4 border-t border-ink/10">
            <div className="text-sm font-semibold text-brand-700 mb-2">3. Service — Numbered Terms</div>
            <label className="text-xs font-semibold text-ink/60">Terms (one per line)</label>
            <textarea
              value={form.quotationTermsServiceNumbered.list}
              onChange={(e) => updateTerms("quotationTermsServiceNumbered", "list", e.target.value)}
              rows={4}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm font-mono"
            />
          </div>
        </div>

        <button
          onClick={save}
          className="w-full mt-5 py-2.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 flex items-center justify-center gap-2"
        >
          <Save size={16} /> {saved ? "Saved!" : "Save Terms"}
        </button>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-6 mt-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-semibold">Email Automation</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.autoEmailEnabled}
              onChange={(e) => update("autoEmailEnabled", e.target.checked)}
              className="accent-brand-500"
            />
            Enabled
          </label>
        </div>
        <p className="text-xs text-ink/50 mb-4">
          Optional. Connects to a small Google Apps Script backend so you can send invoice emails and get automatic
          daily reminders for due/overdue invoices. Setup guide: <code>google-apps-script/SETUP.md</code>.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink/60">Apps Script Web App URL</label>
            <input
              value={form.appsScriptUrl}
              onChange={(e) => update("appsScriptUrl", e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink/60">Shared Secret</label>
            <input
              value={form.appsScriptSecret}
              onChange={(e) => update("appsScriptSecret", e.target.value)}
              type="password"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            />
          </div>
          <TestConnection url={form.appsScriptUrl} secret={form.appsScriptSecret} />
        </div>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-6 mt-4">
        <h3 className="font-display font-semibold mb-1">Cloud Sync (Quotations / Proformas / Invoices)</h3>
        <p className="text-xs text-ink/50 mb-4">
          Customers and Products already live in Supabase, so they're the same on every device automatically — no
          sync needed. This section is only for Quotations/Proformas/Invoices, which still save to local storage per
          device; connect Email Automation above, then use these to force a sync or bring a new device up to date.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={pushAllToCloud}
            disabled={cloudState === "working"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 disabled:opacity-60"
          >
            <CloudUpload size={15} /> Push All to Cloud
          </button>
          <button
            type="button"
            onClick={restoreFromCloud}
            disabled={cloudState === "working"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ink/10 text-sm font-medium hover:bg-ink/5 disabled:opacity-60"
          >
            <CloudDownload size={15} /> Restore from Cloud (this device)
          </button>
        </div>
        {cloudMessage && (
          <p className={`text-xs mt-3 ${cloudState === "fail" ? "text-red-500" : "text-ink/60"}`}>{cloudMessage}</p>
        )}
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-6 mt-4">
        <h3 className="font-display font-semibold mb-1">Local Data</h3>
        <p className="text-xs text-ink/50 mb-4">
          There's no cloud database in this free version — everything lives in this browser's local storage. Export a
          backup file occasionally so you don't lose data if you clear your browser.
        </p>
        <div className="flex gap-3">
          <button onClick={exportBackup} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50">
            <Download size={15} /> Export Backup
          </button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ink/10 text-sm font-medium hover:bg-ink/5 cursor-pointer">
            <Upload size={15} /> Import Backup
            <input type="file" accept="application/json" onChange={importBackup} className="hidden" />
          </label>
          <button onClick={resetAll} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 ml-auto">
            <Trash2 size={15} /> Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}

function TestConnection({ url, secret }) {
  const [state, setState] = useState("idle"); // idle | testing | ok | fail
  const [message, setMessage] = useState("");

  async function test() {
    if (!url) {
      setState("fail");
      setMessage("Enter the Web App URL first.");
      return;
    }
    setState("testing");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ secret, action: "ping", payload: {} }),
      });
      const json = await res.json();
      if (json.ok) {
        setState("ok");
        setMessage("Connected — your Apps Script backend replied successfully.");
      } else {
        setState("fail");
        setMessage(json.error || "Script responded but reported an error.");
      }
    } catch (err) {
      setState("fail");
      setMessage("Could not reach that URL. Double check it's deployed as a Web App with 'Anyone' access.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={test}
        disabled={state === "testing"}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 disabled:opacity-60"
      >
        <PlugZap size={15} /> {state === "testing" ? "Testing…" : "Test Connection"}
      </button>
      {state === "ok" && (
        <p className="text-xs text-brand-600 mt-2 flex items-center gap-1">
          <CheckCircle2 size={13} /> {message}
        </p>
      )}
      {state === "fail" && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <XCircle size={13} /> {message}
        </p>
      )}
    </div>
  );
}

function TermField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-ink/60">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
      />
    </div>
  );
}

function Field({ label, value, onChange, full, textarea, type = "text" }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs font-semibold text-ink/60">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
        />
      )}
    </div>
  );
}
