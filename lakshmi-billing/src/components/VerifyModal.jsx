import React from "react";
import { CheckCircle2, XCircle, Download, ShieldCheck } from "lucide-react";

export default function VerifyModal({ result, onDownload, onClose, downloading }) {
  if (!result) return null;
  const { checks, passed, total, complete } = result;

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 grid place-items-center p-4">
      <div className="bg-white rounded-xl2 shadow-pop w-full max-w-md p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className={complete ? "text-brand-600" : "text-amber-500"} size={22} />
          <h3 className="font-display font-bold text-lg">
            {complete ? "Document generated completely" : "Document generated with warnings"}
          </h3>
        </div>
        <p className="text-sm text-ink/60 mb-4">
          {passed}/{total} checks passed before we hand you the PDF.
        </p>

        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {checks.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {c.pass ? (
                <CheckCircle2 size={16} className="text-brand-500 shrink-0" />
              ) : (
                <XCircle size={16} className="text-red-400 shrink-0" />
              )}
              <span className={c.pass ? "text-ink/80" : "text-red-500 font-medium"}>{c.label}</span>
            </li>
          ))}
        </ul>

        {!complete && (
          <div className="mt-3 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg p-2">
            Some fields look incomplete. You can still download, but double-check the flagged items first.
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-ink/10 text-sm font-medium hover:bg-ink/5"
          >
            Close
          </button>
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-60"
          >
            <Download size={16} />
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>
        <p className="text-[11px] text-ink/40 mt-3 text-center">
          Saved to your device only — no cloud database is used in this free version.
        </p>
      </div>
    </div>
  );
}
