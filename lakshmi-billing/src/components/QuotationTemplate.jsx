import React from "react";
import { formatINR } from "../lib/storage";
import defaultLogo from "../assets/logo.png";
import defaultStamp from "../assets/stamp.png";

// Three quotation layouts, matching the 3 real Lakshmi Engineering formats
// exactly (dark-green #14733d frame/borders, light-green #8cc63f headers,
// gold #ffc000 total box):
//  - "product"            -> "3-quotation-long-itemized-with-make.html"
//     S.No/DESCRIPTION/Make/HSN/UOM/QTY/RATE/GST/AMOUNT, key-value Terms
//     table + numbered Notes, CGST/SGST/GST breakdown, sign box beside total
//  - "service_breakdown"  -> "1-quotation-single-item.html"
//     Subject line, DESCRIPTION/Qty/basis/Rate/GST/Amount, free-text "Work
//     break Up Details" box beside the CGST/SGST/GST breakdown
//  - "service_terms"      -> "2-quotation-multi-item-hsn.html"
//     S.No/DESCRIPTION/HSN/UOM/QTY/RATE/GST/AMOUNT, numbered Terms list,
//     CGST/SGST/GST breakdown

const BORDER = "#14733d";
const HEADER_BG = "#8cc63f";
const TOTAL_BG = "#ffc000";

const QuotationTemplate = React.forwardRef(({ doc }, ref) => {
  const company = doc.company || {};
  const customer = doc.customer || {};
  const variant = doc.variant || "product";
  const items = doc.items || [];

  return (
    <div
      ref={ref}
      className="bg-white text-ink w-[794px] font-body border-[3px] px-7 pt-5 pb-6"
      style={{ minHeight: "1000px", borderColor: BORDER }}
    >
      {/* header */}
      <div className="flex justify-between items-start">
        <img src={company.logoDataUrl || defaultLogo} alt="logo" className="h-16 object-contain" />
        <table className="text-xs border-collapse">
          <tbody>
            <tr>
              <td className="border border-black/70 px-2.5 py-1 leading-snug bg-[#fafafa] font-bold">DATE</td>
              <td className="border border-black/70 px-2.5 py-1 leading-snug">{doc.date}</td>
            </tr>
            <tr>
              <td className="border border-black/70 px-2.5 py-1 leading-snug bg-[#fafafa] font-bold">QUOTE #</td>
              <td className="border border-black/70 px-2.5 py-1 leading-snug">{doc.number}</td>
            </tr>
            <tr>
              <td className="border border-black/70 px-2.5 py-1 leading-snug bg-[#fafafa] font-bold">VALID UNTIL</td>
              <td className="border border-black/70 px-2.5 py-1 leading-snug">{doc.validUntil}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* company block */}
      <div className="mt-4 text-xs leading-[1.55]">
        <div className="font-bold text-[13.5px]">{company.companyName}</div>
        <div>{company.address}</div>
        <div>Phone No- {company.phone}</div>
        <div>Mail- {company.email}</div>
        <div>GST No- {company.gst}</div>
      </div>

      {/* customer block */}
      <div
        className="text-xs font-bold text-center px-2.5 py-1 leading-snug mt-4 border"
        style={{ background: HEADER_BG, borderColor: BORDER }}
      >
        CUSTOMER
      </div>
      <div className="text-xs leading-[1.55] pt-1.5">
        <div className="font-bold">{customer.name}</div>
        <div>{customer.address}</div>
        {customer.phone && <div>Ph: {customer.phone}</div>}
        {customer.gst && <div>GST No- {customer.gst}</div>}
      </div>

      {/* subject line — shown for every quotation, underlined only on the single-item service format */}
      {doc.heading && (
        <div className={`text-center font-bold text-[13px] mt-4 mb-1 leading-snug ${variant === "service_breakdown" ? "underline" : ""}`}>
          {doc.heading}
        </div>
      )}

      {/* items table */}
      <table className="w-full text-xs border-collapse mt-3.5">
        <thead>
          <tr style={{ background: HEADER_BG }}>
            {variant !== "service_breakdown" && (
              <th className="border px-2 py-2 leading-snug w-8" style={{ borderColor: BORDER }}>
                S.No
              </th>
            )}
            <th className="border px-2.5 py-2 leading-snug text-left" style={{ borderColor: BORDER }}>
              DESCRIPTION
            </th>
            {variant === "product" && (
              <th className="border px-2 py-2 leading-snug" style={{ borderColor: BORDER }}>
                Make
              </th>
            )}
            {variant !== "service_breakdown" && (
              <th className="border px-2 py-2 leading-snug" style={{ borderColor: BORDER }}>
                HSN
              </th>
            )}
            {variant === "product" && (
              <th className="border px-2 py-2 leading-snug" style={{ borderColor: BORDER }}>
                UOM
              </th>
            )}
            {variant === "service_terms" && (
              <th className="border px-2 py-2 leading-snug" style={{ borderColor: BORDER }}>
                UOM
              </th>
            )}
            <th className="border px-2 py-2 leading-snug" style={{ borderColor: BORDER }}>
              {variant === "service_breakdown" ? "Qty" : "QTY"}
            </th>
            {variant === "service_breakdown" && (
              <th className="border px-2 py-2 leading-snug" style={{ borderColor: BORDER }}>
                {doc.basisColumnLabel || "PER TR"}
              </th>
            )}
            <th className="border px-2 py-2 leading-snug" style={{ borderColor: BORDER }}>
              {variant === "service_breakdown" ? "Rate" : "RATE"}
            </th>
            <th className="border px-2 py-2 leading-snug" style={{ borderColor: BORDER }}>
              GST
            </th>
            <th className="border px-2.5 py-2 leading-snug text-right" style={{ borderColor: BORDER }}>
              AMOUNT
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              {variant !== "service_breakdown" && (
                <td className="border px-2 py-2 leading-snug text-center align-top" style={{ borderColor: BORDER }}>
                  {i + 1}
                </td>
              )}
              <td className="border px-2.5 py-2 leading-snug align-top" style={{ borderColor: BORDER }}>
                {it.description}
              </td>
              {variant === "product" && (
                <td className="border px-2 py-2 leading-snug text-center align-top" style={{ borderColor: BORDER }}>
                  {it.make}
                </td>
              )}
              {variant !== "service_breakdown" && (
                <td className="border px-2 py-2 leading-snug text-center align-top" style={{ borderColor: BORDER }}>
                  {it.hsn}
                </td>
              )}
              {(variant === "product" || variant === "service_terms") && (
                <td className="border px-2 py-2 leading-snug text-center align-top" style={{ borderColor: BORDER }}>
                  {it.unit}
                </td>
              )}
              <td className="border px-2 py-2 leading-snug text-center align-top" style={{ borderColor: BORDER }}>
                {it.qty}
              </td>
              {variant === "service_breakdown" && (
                <td className="border px-2 py-2 leading-snug text-center align-top" style={{ borderColor: BORDER }}>
                  {it.basis}
                </td>
              )}
              <td className="border px-2 py-2 leading-snug text-center align-top" style={{ borderColor: BORDER }}>
                {Number(it.rate).toFixed(2)}
              </td>
              <td className="border px-2 py-2 leading-snug text-center align-top" style={{ borderColor: BORDER }}>
                {it.gstRate ?? doc.gstRate}%
              </td>
              <td className="border px-2.5 py-2 leading-snug text-right align-top whitespace-nowrap" style={{ borderColor: BORDER }}>
                {formatINR(Number(it.qty) * Number(it.rate) * (1 + (it.gstRate ?? doc.gstRate) / 100))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* below-table area: terms/work-breakup on the left, tax breakdown + total on the right */}
      {variant === "service_breakdown" && (
        <div className="flex justify-between gap-6 mt-4 items-stretch">
          <div className="w-[54%]">
            <div className="font-bold text-[11.5px] px-2 py-1.5 border border-b-0" style={{ background: HEADER_BG, borderColor: BORDER }}>
              Work break Up Details:
            </div>
            <div className="text-[11px] leading-[1.6] px-2.5 py-2.5 border h-full whitespace-pre-line" style={{ borderColor: BORDER }}>
              {doc.terms?.workBreakup}
            </div>
          </div>
          <div className="w-[42%] shrink-0">
            <div className="text-xs leading-[1.8] space-y-0.5">
              <div className="flex justify-between">
                <span>CGST {(doc.gstRate || 18) / 2}%:</span>
                <span>{formatINR(doc.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST {(doc.gstRate || 18) / 2}%:</span>
                <span>{formatINR(doc.sgst)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST {doc.gstRate || 18}%:</span>
                <span>{formatINR(doc.gst)}</span>
              </div>
            </div>
            <div className="text-[11.5px] leading-[1.6] mt-3">
              <span className="font-bold">Amount Chargeable(in words)INR-</span>
              <br />
              {doc.amountInWords}
            </div>
            <div
              className="flex justify-between items-center border px-4 py-3 font-bold text-[15px] mt-2.5"
              style={{ background: TOTAL_BG, borderColor: BORDER }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
          </div>
        </div>
      )}

      {(variant === "product" || variant === "service_terms") && (
        <div className="flex justify-end mt-1.5">
          <div className="w-[260px] text-xs leading-[1.8] space-y-0.5">
            {doc.showSubtotal && (
              <div className="flex justify-between font-bold">
                <span>Sub Total:</span>
                <span>{formatINR(doc.subtotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>CGST {(doc.gstRate || 18) / 2} %:</span>
              <span>{formatINR(doc.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST {(doc.gstRate || 18) / 2} %:</span>
              <span>{formatINR(doc.sgst)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST {doc.gstRate || 18} %:</span>
              <span>{formatINR(doc.gst)}</span>
            </div>
          </div>
        </div>
      )}

      {variant === "product" && (
        <div className="flex justify-between gap-6 mt-4 items-start">
          <div className="w-[54%]">
            <div className="font-bold text-[11.5px] text-center px-2 py-1.5 border" style={{ background: HEADER_BG, borderColor: BORDER }}>
              TERMS AND CONDITION
            </div>
            <table className="w-full text-[11px] border-collapse">
              <tbody>
                {[
                  ["Payment Terms", doc.terms?.paymentTerms],
                  ["Delivery Time", doc.terms?.deliveryTime],
                  ["Taxes", doc.terms?.taxes],
                  ["Packing and Forwardings", doc.terms?.packingForwarding],
                  ["Freight/Transportation", doc.terms?.freightTransportation],
                  ["Offer validity", doc.terms?.offerValidity],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="border px-2.5 py-1.5 leading-snug font-bold w-[42%] align-top" style={{ borderColor: BORDER }}>
                      {label}
                    </td>
                    <td className="border px-2.5 py-1.5 leading-snug align-top" style={{ borderColor: BORDER }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="font-bold text-[11.5px] px-2 py-1.5 border border-t-0" style={{ background: HEADER_BG, borderColor: BORDER }}>
              NOTE:
            </div>
            <div className="text-[10.5px] leading-[1.65] px-2.5 py-2.5 border border-t-0" style={{ borderColor: BORDER }}>
              <ol className="list-decimal pl-5 space-y-1">
                {(doc.terms?.notes || "").split("\n").filter(Boolean).map((n, i) => (
                  <li key={i}>{n.replace(/^\d+\.\s*/, "")}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="w-[42%] shrink-0">
            <div className="text-[11.5px] leading-[1.6]">
              <span className="font-bold">Amount Chargeable(in words)-INR-</span>
              <br />
              {doc.amountInWords}
            </div>
            <div
              className="flex justify-between items-center border px-4 py-3 font-bold text-[15px] mt-2.5"
              style={{ background: TOTAL_BG, borderColor: BORDER }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
            <div className="flex justify-center mt-6">
              <div className="text-center w-[220px]">
                <img
                  src={company.stampDataUrl || defaultStamp}
                  alt="stamp and signature"
                  className="h-16 object-contain mx-auto mb-1.5"
                />
                <div className="text-[11.5px] font-bold border-t border-black/60 pt-1.5">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === "service_terms" && (
        <div className="flex justify-between gap-6 mt-4">
          <div className="w-[52%]">
            <div className="font-bold text-[11.5px] text-center px-2 py-1.5 border border-b-0" style={{ background: HEADER_BG, borderColor: BORDER }}>
              TERMS AND CONDITION
            </div>
            <div className="text-[11px] leading-[1.65] px-2.5 py-2.5 border" style={{ borderColor: BORDER }}>
              <ol className="list-decimal pl-5 space-y-1">
                {(doc.terms?.list || "").split("\n").filter(Boolean).map((n, i) => (
                  <li key={i}>{n.replace(/^\d+\.\s*/, "")}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="w-[44%] shrink-0">
            <div className="text-[11.5px] leading-[1.6] mt-3">
              <span className="font-bold">Amount Chargeable(in words)INR-</span>
              <br />
              {doc.amountInWords}
            </div>
            <div
              className="flex justify-between items-center border px-4 py-3 font-bold text-[15px] mt-2.5"
              style={{ background: TOTAL_BG, borderColor: BORDER }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* sign area — product variant already places its stamp beside the total */}
      {variant !== "product" && (
        <div className="flex justify-end mt-6">
          <div className="text-center w-[220px]">
            <img src={company.stampDataUrl || defaultStamp} alt="stamp and signature" className="h-16 object-contain mx-auto mb-1.5" />
            <div className="text-[11.5px] font-bold border-t border-black/60 pt-1.5">Authorised Signatory</div>
          </div>
        </div>
      )}

      {/* bank details */}
      <div className="flex justify-end mt-3">
        <div className="flex border w-[420px]" style={{ borderColor: BORDER }}>
          <div
            className="font-bold text-[13px] leading-snug flex items-center justify-center text-center px-3 py-2.5 w-[100px] border-r"
            style={{ background: HEADER_BG, borderColor: BORDER }}
          >
            BANK
            <br />
            DETAILS
          </div>
          <div className="text-[10.5px] leading-[1.65] px-3 py-2.5">
            BANK NAME: {company.bankName}
            <br />
            A/C NO: {company.accountNo}
            <br />
            BRANCH &amp; IFS Code: {company.branchIfsc}
          </div>
        </div>
      </div>
    </div>
  );
});

export default QuotationTemplate;
