import React, { useRef, useState } from "react";
import { verifyDocument } from "../lib/verify";
import { downloadNodeAsPdf } from "../lib/pdf";
import DocumentTemplate from "./DocumentTemplate";
import QuotationTemplate from "./QuotationTemplate";
import VerifyModal from "./VerifyModal";
import { Download } from "lucide-react";

export default function QuickDownload({ doc, type, label = "Download" }) {
  const ref = useRef(null);
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadNodeAsPdf(ref.current, `${doc.number.replace(/\//g, "-")}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setResult(verifyDocument(doc, type))}
        className="flex items-center gap-1 text-brand-600 text-xs font-semibold hover:text-brand-700"
      >
        <Download size={13} /> {label}
      </button>
      <div className="fixed -left-[9999px] top-0">
        {type === "quotation" ? <QuotationTemplate ref={ref} doc={doc} /> : <DocumentTemplate ref={ref} doc={doc} type={type} />}
      </div>
      {result && (
        <VerifyModal result={result} downloading={downloading} onDownload={handleDownload} onClose={() => setResult(null)} />
      )}
    </>
  );
}
