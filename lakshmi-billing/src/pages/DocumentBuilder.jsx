import React, { useEffect, useRef, useState } from "react";
import { db, uid, calcTotals, amountInWords, formatINR } from "../lib/storage";
import { verifyDocument } from "../lib/verify";
import { downloadNodeAsPdf, nodeToPdfBase64 } from "../lib/pdf";
import { appsScript } from "../lib/appsScript";
import DocumentTemplate from "../components/DocumentTemplate";
import VerifyModal from "../components/VerifyModal";
import { Save, FileDown } from "lucide-react";

const TITLES = { proforma: "Proforma Invoice", invoice: "Invoice" };

// Always mode="convert" — proforma comes from a quotation, invoice comes
// from a proforma. Customer + items are copied straight from sourceDoc,
// no re-picking, no manual retyping.
export default function DocumentBuilder({ type, sourceDoc, onSaved }) {
  const settings = db.getSettings();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [items] = useState(sourceDoc?.items || []);
  const [savedDoc, setSavedDoc] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  const totals = calcTotals(items, settings.gstRate);
  const customer = sourceDoc?.customer || null;

  function buildDocObject(number) {
    return {
      id: savedDoc?.id || uid(type),
      number,
      date,
      dueDate: type === "invoice" ? dueDate : undefined,
      customer,
      items: items.map((it) => ({ description: it.description, make: it.make, hsn: it.hsn, unit: it.unit, qty: it.qty, rate: it.rate, gstRate: it.gstRate })),
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      gstRate: settings.gstRate,
      amountInWords: amountInWords(totals.total),
      company: settings,
      status: type === "invoice" ? "Unpaid" : "Draft",
      sourceNumber: sourceDoc?.number,
      createdAt: new Date().toISOString(),
    };
  }

  function handleGenerate(e) {
    e.preventDefault();
    if (!customer) return alert("Source document has no customer — go back and check the quotation/proforma.");
    if (items.length === 0) return alert("Source document has no items.");

    const number = savedDoc?.number || db.nextDocNumber(type);
    const doc = buildDocObject(number);

    if (type === "proforma") db.saveProforma(doc);
    if (type === "invoice") db.saveInvoice(doc);

    setSavedDoc(doc);
    setVerifyResult(verifyDocument(doc, type));
    onSaved?.();

    if (type === "proforma" && appsScript.isConfigured()) {
      appsScript.syncEntity("proforma", doc).catch((err) => console.warn("Cloud sync failed:", err.message));
    }
  }

  useEffect(() => {
    if (!savedDoc || type !== "invoice" || !appsScript.isConfigured()) return;
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 50));
        const pdfBase64 = printRef.current ? await nodeToPdfBase64(printRef.current) : undefined;
        await appsScript.syncInvoice({
          id: savedDoc.id,
          number: savedDoc.number,
          date: savedDoc.date,
          dueDate: savedDoc.dueDate,
          customer: savedDoc.customer,
          total: savedDoc.total,
          status: savedDoc.status,
          pdfBase64,
          record: savedDoc,
        });
      } catch (err) {
        console.warn("Apps Script sync failed:", err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedDoc?.id]);

  async function handleDownload() {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      await downloadNodeAsPdf(printRef.current, `${savedDoc.number.replace(/\//g, "-")}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-1">Convert to {TITLES[type]}</h1>
      <p className="text-ink/50 text-sm mb-6">Copied from {sourceDoc?.number} — no manual retyping needed.</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl2 shadow-card p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink/60">Customer</label>
                <input
                  disabled
                  value={customer?.name || ""}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm bg-ink/5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink/60">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              {type === "invoice" && (
                <div>
                  <label className="text-xs font-semibold text-ink/60">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl2 shadow-card p-5">
            <h3 className="font-display font-semibold mb-3">Items (copied from {sourceDoc?.number})</h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-ink/50 uppercase">
                <tr>
                  <th className="text-left py-1">Description</th>
                  <th className="text-right py-1">Qty</th>
                  <th className="text-right py-1">Rate</th>
                  <th className="text-right py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t border-ink/5">
                    <td className="py-1.5">{it.description}</td>
                    <td className="py-1.5 text-right">{it.qty}</td>
                    <td className="py-1.5 text-right">{formatINR(it.rate)}</td>
                    <td className="py-1.5 text-right">{formatINR(it.qty * it.rate * (1 + (it.gstRate ?? settings.gstRate) / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl2 shadow-card p-5 flex justify-end">
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="px-3 py-1 text-ink/60">Subtotal</td>
                  <td className="px-3 py-1 text-right font-medium">{formatINR(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1 text-ink/60">GST ({settings.gstRate}%)</td>
                  <td className="px-3 py-1 text-right font-medium">{formatINR(totals.gst)}</td>
                </tr>
                <tr className="border-t border-ink/10">
                  <td className="px-3 py-2 font-semibold">Grand Total</td>
                  <td className="px-3 py-2 text-right font-bold text-brand-600">{formatINR(totals.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600"
          >
            <Save size={16} /> Generate {TITLES[type]}
          </button>
        </div>

        <div className="col-span-1">
          <div className="sticky top-6">
            <p className="text-xs font-semibold text-ink/50 mb-2 uppercase tracking-wide">Live Preview</p>
            <div className="scale-[0.32] origin-top-left w-[254px] h-[320px] overflow-hidden rounded-lg border border-ink/10 shadow-card">
              <div className="scale-[1] w-[794px]">
                <DocumentTemplate doc={savedDoc || buildDocObject(savedDoc?.number || "PREVIEW")} type={type} />
              </div>
            </div>
            {savedDoc && (
              <button
                onClick={() => setVerifyResult(verifyDocument(savedDoc, type))}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50"
              >
                <FileDown size={15} /> Review & Download
              </button>
            )}
          </div>
        </div>
      </div>

      {savedDoc && (
        <div className="fixed -left-[9999px] top-0">
          <DocumentTemplate ref={printRef} doc={savedDoc} type={type} />
        </div>
      )}

      {verifyResult && (
        <VerifyModal
          result={verifyResult}
          downloading={downloading}
          onDownload={handleDownload}
          onClose={() => setVerifyResult(null)}
        />
      )}
    </div>
  );
}
