import React, { useEffect, useState } from "react";
import { db, formatINR } from "../lib/storage";
import DocumentBuilder from "./DocumentBuilder";
import QuotationBuilder from "./QuotationBuilder";
import { Plus, ArrowRight, FileText } from "lucide-react";
import QuickDownload from "../components/QuickDownload";
import EmailSendButton from "../components/EmailSendButton";

const VARIANT_LABEL = {
  product: "Product Supply",
  service_breakdown: "Service (Work Break Up)",
  service_terms: "Service (Numbered Terms)",
};

export default function Quotations() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState("list"); // list | new | convert
  const [active, setActive] = useState(null);

  useEffect(() => refresh(), []);
  function refresh() {
    setItems(db.getQuotations());
  }

  if (view === "new") {
    return (
      <BackWrap onBack={() => { setView("list"); refresh(); }}>
        <QuotationBuilder onSaved={refresh} />
      </BackWrap>
    );
  }
  if (view === "convert" && active) {
    return (
      <BackWrap onBack={() => { setView("list"); refresh(); }}>
        <DocumentBuilder type="proforma" sourceDoc={active} onSaved={refresh} />
      </BackWrap>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Quotations</h1>
          <p className="text-ink/50 text-sm">{items.length} created</p>
        </div>
        <button
          onClick={() => setView("new")}
          className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-600"
        >
          <Plus size={16} /> New Quotation
        </button>
      </div>

      <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-brand-700 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Quote #</th>
              <th className="text-left px-4 py-3">Format</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} className="border-t border-ink/5 hover:bg-brand-50/40">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <FileText size={14} className="text-brand-400" /> {q.number}
                </td>
                <td className="px-4 py-3 text-ink/50 text-xs">{VARIANT_LABEL[q.variant] || "—"}</td>
                <td className="px-4 py-3">{q.date}</td>
                <td className="px-4 py-3">{q.customer?.name}</td>
                <td className="px-4 py-3 text-right">{formatINR(q.total)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <QuickDownload doc={q} type="quotation" />
                    <EmailSendButton doc={q} type="quotation" />
                    <button
                      onClick={() => {
                        setActive(q);
                        setView("convert");
                      }}
                      className="flex items-center gap-1 text-brand-600 text-xs font-semibold hover:text-brand-700"
                    >
                      Convert to Proforma <ArrowRight size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/40">
                  No quotations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BackWrap({ onBack, children }) {
  return (
    <div>
      <button onClick={onBack} className="text-sm text-ink/50 hover:text-brand-600 mb-4">
        ← Back to list
      </button>
      {children}
    </div>
  );
}
