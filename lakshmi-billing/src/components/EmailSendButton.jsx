import React, { useRef, useState } from "react";
import { nodeToPdfBase64 } from "../lib/pdf";
import { appsScript } from "../lib/appsScript";
import { db } from "../lib/storage";
import DocumentTemplate from "./DocumentTemplate";
import QuotationTemplate from "./QuotationTemplate";
import { Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";

const DOC_LABEL = { quotation: "Quotation", proforma: "Proforma Invoice", invoice: "Invoice" };

export default function EmailSendButton({ doc, type }) {
  const ref = useRef(null);
  const [state, setState] = useState("idle"); // idle | sending | ok | fail
  const settings = db.getSettings();
  const configured = !!settings.appsScriptUrl;

  async function send() {
    if (!configured) {
      alert("Connect email automation first — go to Settings → Email Automation and add your Apps Script Web App URL.");
      return;
    }
    if (!doc.customer?.email) {
      alert("This customer has no email address on file. Add one in Customers.");
      return;
    }
    setState("sending");
    try {
      const pdfBase64 = await nodeToPdfBase64(ref.current);
      const label = DOC_LABEL[type];
      await appsScript.sendNow({
        to: doc.customer.email,
        customerName: doc.customer.name,
        subject: `${label} ${doc.number} — ${settings.companyName}`,
        message:
          `Dear ${doc.customer.name},\n\nPlease find attached your ${label} ${doc.number} dated ${doc.date}, ` +
          `for a total of ₹${Number(doc.total).toFixed(2)}.\n\n${settings.emailSignature || ""}`,
        documentNumber: doc.number,
        filename: `${doc.number.replace(/\//g, "-")}.pdf`,
        pdfBase64,
      });
      setState("ok");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      console.error(err);
      setState("fail");
      setTimeout(() => setState("idle"), 3500);
    }
  }

  return (
    <>
      <button
        onClick={send}
        disabled={state === "sending"}
        className="flex items-center gap-1 text-brand-600 text-xs font-semibold hover:text-brand-700 disabled:opacity-60"
        title={configured ? "Send by email" : "Set up email automation in Settings first"}
      >
        {state === "sending" && <Loader2 size={13} className="animate-spin" />}
        {state === "ok" && <CheckCircle2 size={13} className="text-brand-500" />}
        {state === "fail" && <XCircle size={13} className="text-red-400" />}
        {state === "idle" && <Mail size={13} />}
        {state === "sending" ? "Sending…" : state === "ok" ? "Sent" : state === "fail" ? "Failed" : "Email"}
      </button>
      <div className="fixed -left-[9999px] top-0">
        {type === "quotation" ? <QuotationTemplate ref={ref} doc={doc} /> : <DocumentTemplate ref={ref} doc={doc} type={type} />}
      </div>
    </>
  );
}
