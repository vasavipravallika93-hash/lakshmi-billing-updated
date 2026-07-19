import React, { useEffect, useRef, useState } from "react";
import { db, uid, amountInWords, formatINR } from "../lib/storage";
import { customersApi } from "../lib/customersApi";
import { productsApi } from "../lib/productsApi";
import { verifyDocument } from "../lib/verify";
import { downloadNodeAsPdf } from "../lib/pdf";
import { appsScript } from "../lib/appsScript";
import QuotationTemplate from "../components/QuotationTemplate";
import VerifyModal from "../components/VerifyModal";
import { Plus, Trash2, FileDown, Save, Loader2 } from "lucide-react";

const VARIANTS = [
  { key: "product", label: "Product / Parts Supply" },
  { key: "service_breakdown", label: "Service — Work Break Up" },
  { key: "service_terms", label: "Service — Numbered Terms" },
];

function defaultTermsFor(variant, settings) {
  if (variant === "product") return { ...settings.quotationTermsProduct };
  if (variant === "service_breakdown") return { ...settings.quotationTermsServiceBreakdown };
  return { ...settings.quotationTermsServiceNumbered };
}

export default function QuotationBuilder({ onSaved }) {
  const settings = db.getSettings();

  const [variant, setVariant] = useState("product");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState("");
  const [heading, setHeading] = useState("");
  const [basisColumnLabel, setBasisColumnLabel] = useState("PER TR");
  const [items, setItems] = useState([]);
  const [terms, setTerms] = useState(defaultTermsFor("product", settings));
  const [gstRatePct, setGstRatePct] = useState(settings.gstRate);

  const [savedDoc, setSavedDoc] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([customersApi.list(), productsApi.list()]);
        setCustomers(c);
        setProducts(p);
      } catch (err) {
        console.warn("Couldn't load customers/products from Supabase:", err.message);
      } finally {
        setLoadingRefs(false);
      }
    })();
  }, []);

  function switchVariant(v) {
    setVariant(v);
    setTerms(defaultTermsFor(v, settings));
  }

  function addItem(product) {
    setItems((prev) => [
      ...prev,
      {
        id: uid("item"),
        description: product?.name || "",
        make: product?.brand || "",
        hsn: product?.hsn || "",
        unit: product?.unit || "Nos",
        basis: "",
        qty: 1,
        rate: product?.rate || 0,
        gstRate: product?.gst ?? gstRatePct,
      },
    ]);
  }
  function updateItem(id, patch) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const subtotal = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.rate || 0), 0);
  const gstTotal = (subtotal * Number(gstRatePct || 0)) / 100;
  const total = subtotal + gstTotal;
  const customer = customers.find((c) => c.id === customerId);

  function buildDocObject(number) {
    return {
      id: savedDoc?.id || uid("quotation"),
      number,
      date,
      validUntil,
      variant,
      heading: heading || "",
      basisColumnLabel,
      customer: customer
        ? { id: customer.id, name: customer.name, address: customer.address, phone: customer.phone, gst: customer.gst, customerId: customer.customerId }
        : null,
      items: items.map((it) => ({
        description: it.description,
        make: it.make,
        hsn: it.hsn,
        unit: it.unit,
        basis: it.basis,
        qty: it.qty,
        rate: it.rate,
        gstRate: it.gstRate,
      })),
      subtotal,
      cgst: gstTotal / 2,
      sgst: gstTotal / 2,
      gst: gstTotal,
      total,
      gstRate: Number(gstRatePct || 0),
      amountInWords: amountInWords(total),
      company: settings,
      showSubtotal: variant !== "service_breakdown",
      terms,
      status: "Draft",
      createdAt: new Date().toISOString(),
    };
  }

  function handleGenerate(e) {
    e.preventDefault();
    if (!customer) return alert("Please select a customer.");
    if (items.length === 0) return alert("Add at least one item.");

    const number = savedDoc?.number || db.nextDocNumber("quotation");
    const doc = buildDocObject(number);
    db.saveQuotation(doc);

    setSavedDoc(doc);
    setVerifyResult(verifyDocument(doc, "quotation"));
    onSaved?.();

    if (appsScript.isConfigured()) {
      appsScript.syncEntity("quotation", doc).catch((err) => console.warn("Cloud sync failed:", err.message));
    }
  }

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
      <h1 className="font-display font-bold text-2xl mb-1">New Quotation</h1>
      <p className="text-ink/50 text-sm mb-6">Customers & Products come from Supabase. Quotation itself saves on this device.</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* variant picker */}
          <div className="bg-white rounded-xl2 shadow-card p-5">
            <label className="text-xs font-semibold text-ink/60 block mb-2">Quotation Format</label>
            <div className="grid grid-cols-3 gap-2">
              {VARIANTS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => switchVariant(v.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                    variant === v.key
                      ? "bg-brand-500 text-white border-brand-500"
                      : "border-ink/10 text-ink/60 hover:bg-brand-50"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl2 shadow-card p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink/60">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="">{loadingRefs ? "Loading…" : "Select customer…"}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
              <div>
                <label className="text-xs font-semibold text-ink/60">Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink/60">GST %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={gstRatePct}
                  onChange={(e) => setGstRatePct(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-ink/60">Subject (shown above the item table)</label>
                <input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder='e.g. "Subject: Quotation for Condenser Descaling of chiller"'
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              {variant === "service_breakdown" && (
                <div>
                  <label className="text-xs font-semibold text-ink/60">Rate-basis column label</label>
                  <input
                    value={basisColumnLabel}
                    onChange={(e) => setBasisColumnLabel(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* items */}
          <div className="bg-white rounded-xl2 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">Items</h3>
              <select
                onChange={(e) => {
                  const p = products.find((p) => p.id === e.target.value);
                  if (p) addItem(p);
                  e.target.value = "";
                }}
                className="text-sm px-3 py-1.5 rounded-lg border border-ink/10"
                defaultValue=""
              >
                <option value="" disabled>
                  {loadingRefs ? "Loading…" : "+ Add product…"}
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                  <input
                    className="col-span-3 px-2 py-1.5 rounded border border-ink/10"
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                    placeholder="Description"
                  />
                  {variant === "product" && (
                    <input
                      className="col-span-2 px-2 py-1.5 rounded border border-ink/10"
                      value={it.make}
                      onChange={(e) => updateItem(it.id, { make: e.target.value })}
                      placeholder="Make"
                    />
                  )}
                  {variant !== "service_breakdown" && (
                    <input
                      className="col-span-2 px-2 py-1.5 rounded border border-ink/10"
                      value={it.hsn}
                      onChange={(e) => updateItem(it.id, { hsn: e.target.value })}
                      placeholder="HSN"
                    />
                  )}
                  {variant !== "service_breakdown" && (
                    <input
                      className="col-span-1 px-2 py-1.5 rounded border border-ink/10"
                      value={it.unit}
                      onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                      placeholder="UOM"
                    />
                  )}
                  {variant === "service_breakdown" && (
                    <input
                      className="col-span-3 px-2 py-1.5 rounded border border-ink/10"
                      value={it.basis}
                      onChange={(e) => updateItem(it.id, { basis: e.target.value })}
                      placeholder={basisColumnLabel}
                    />
                  )}
                  <input
                    type="number"
                    className="col-span-1 px-2 py-1.5 rounded border border-ink/10"
                    value={it.qty}
                    onChange={(e) => updateItem(it.id, { qty: e.target.value })}
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    className="col-span-2 px-2 py-1.5 rounded border border-ink/10"
                    value={it.rate}
                    onChange={(e) => updateItem(it.id, { rate: e.target.value })}
                    placeholder="Rate"
                  />
                  <div className="col-span-1 text-right text-ink/60 text-xs">
                    {formatINR(it.qty * it.rate * (1 + (it.gstRate ?? gstRatePct) / 100))}
                  </div>
                  <button onClick={() => removeItem(it.id)} className="col-span-12 sm:col-span-1 text-red-400 hover:text-red-500 flex justify-end">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-ink/40 text-sm py-6 text-center">No items added yet.</p>}
            </div>

            <button
              onClick={() => addItem(null)}
              className="mt-3 text-brand-600 text-sm font-medium flex items-center gap-1 hover:text-brand-700"
            >
              <Plus size={14} /> Add blank line
            </button>
          </div>

          {/* terms editor, per variant */}
          <div className="bg-white rounded-xl2 shadow-card p-5">
            <h3 className="font-display font-semibold mb-3">Terms & Conditions for this quotation</h3>
            {variant === "product" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["paymentTerms", "Payment Terms"],
                    ["deliveryTime", "Delivery Time"],
                    ["taxes", "Taxes"],
                    ["packingForwarding", "Packing and Forwardings"],
                    ["freightTransportation", "Freight/Transportation"],
                    ["offerValidity", "Offer validity"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-ink/60">{label}</label>
                      <input
                        value={terms[key] || ""}
                        onChange={(e) => setTerms({ ...terms, [key]: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/60">Notes (one per line)</label>
                  <textarea
                    value={terms.notes || ""}
                    onChange={(e) => setTerms({ ...terms, notes: e.target.value })}
                    rows={5}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>
            )}
            {variant === "service_breakdown" && (
              <div>
                <label className="text-xs font-semibold text-ink/60">Work Break Up Details</label>
                <textarea
                  value={terms.workBreakup || ""}
                  onChange={(e) => setTerms({ ...terms, workBreakup: e.target.value })}
                  rows={4}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            )}
            {variant === "service_terms" && (
              <div>
                <label className="text-xs font-semibold text-ink/60">Terms (one per line)</label>
                <textarea
                  value={terms.list || ""}
                  onChange={(e) => setTerms({ ...terms, list: e.target.value })}
                  rows={4}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            )}
            <p className="text-[11px] text-ink/40 mt-2">
              Defaults come from Settings — edit here just for this quotation, or go to Settings to change the
              default for every future one.
            </p>
          </div>

          <div className="bg-white rounded-xl2 shadow-card p-5 flex justify-end">
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="px-3 py-1 text-ink/60">Subtotal</td>
                  <td className="px-3 py-1 text-right font-medium">{formatINR(subtotal)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1 text-ink/60">GST ({gstRatePct}%)</td>
                  <td className="px-3 py-1 text-right font-medium">{formatINR(gstTotal)}</td>
                </tr>
                <tr className="border-t border-ink/10">
                  <td className="px-3 py-2 font-semibold">Grand Total</td>
                  <td className="px-3 py-2 text-right font-bold text-brand-600">{formatINR(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600"
          >
            <Save size={16} /> Generate Quotation
          </button>
        </div>

        <div className="col-span-1">
          <div className="sticky top-6">
            <p className="text-xs font-semibold text-ink/50 mb-2 uppercase tracking-wide">Live Preview</p>
            <div className="scale-[0.32] origin-top-left w-[254px] h-[320px] overflow-hidden rounded-lg border border-ink/10 shadow-card">
              <div className="scale-[1] w-[794px]">
                <QuotationTemplate doc={savedDoc || buildDocObject(savedDoc?.number || "PREVIEW")} />
              </div>
            </div>
            {savedDoc && (
              <button
                onClick={() => setVerifyResult(verifyDocument(savedDoc, "quotation"))}
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
          <QuotationTemplate ref={printRef} doc={savedDoc} />
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
