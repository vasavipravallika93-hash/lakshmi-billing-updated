import React from "react";
import { formatINR, formatDateDMY } from "../lib/storage";
import defaultLogo from "../assets/logo.png";
import defaultStamp from "../assets/stamp.png";

// Three compact quotation layouts, matching the 3 real Lakshmi Engineering
// formats (dark-green #14733d frame/borders, light-green header bars, gold
// #ffc000 total box). Sections are kept tight/small so a typical quotation
// (1-4 line items) fits on a single A4 page; a long item list is free to
// spill onto a 2nd page (see lib/pdf.js — page breaks always land between
// sections, never through the middle of a box).
//
// IMPORTANT: every structural rule here (borders, flex layout, padding) is
// written as an inline `style` object rather than a Tailwind class. Tailwind
// utility classes depend on the build's generated stylesheet being present;
// inline styles always render correctly, in the browser and in html2canvas,
// regardless of build/cache state. Do not convert these back to className-only.

const BORDER = "#14733d";
const HEADER_BG = "#bfe08a"; // light green
const TOTAL_BG = "#ffc000";

const th = (extra) => ({
  border: `1px solid ${BORDER}`,
  padding: "5px 8px",
  lineHeight: 1.25,
  ...extra,
});
const td = (extra) => ({
  border: `1px solid ${BORDER}`,
  padding: "5px 8px",
  lineHeight: 1.3,
  verticalAlign: "top",
  ...extra,
});

const QuotationTemplate = React.forwardRef(({ doc }, ref) => {
  const company = doc.company || {};
  const customer = doc.customer || {};
  const variant = doc.variant || "product";
  const items = doc.items || [];
  const gstRate = doc.gstRate || 18;

  return (
    <div
      ref={ref}
      style={{
        background: "#fff",
        color: "#0f1a14",
        width: 794,
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, sans-serif",
        border: `2px solid ${BORDER}`,
        borderRadius: 5,
        padding: "14px 22px 16px",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <img src={company.logoDataUrl || defaultLogo} alt="logo" style={{ height: 46, objectFit: "contain" }} />
        <table style={{ fontSize: 11, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "3px 8px", background: "#fafafa", fontWeight: 700 }}>DATE</td>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "3px 8px" }}>{formatDateDMY(doc.date)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "3px 8px", background: "#fafafa", fontWeight: 700 }}>QUOTE #</td>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "3px 8px" }}>{doc.number}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "3px 8px", background: "#fafafa", fontWeight: 700 }}>VALID UNTIL</td>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "3px 8px" }}>{formatDateDMY(doc.validUntil)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* company block */}
      <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.35 }}>
        <div style={{ fontWeight: 700, fontSize: 12.5 }}>{company.companyName}</div>
        <div>{company.address}</div>
        <div>Phone No- {company.phone}</div>
        <div>Mail- {company.email}</div>
        <div>GST No- {company.gst}</div>
      </div>

      {/* customer block */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textAlign: "center",
          padding: "3px 8px",
          lineHeight: 1.25,
          marginTop: 8,
          border: `1px solid ${BORDER}`,
          background: HEADER_BG,
        }}
      >
        CUSTOMER
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.35, paddingTop: 4 }}>
        <div style={{ fontWeight: 700 }}>{customer.name}</div>
        <div>{customer.address}</div>
        {customer.phone && <div>Ph: {customer.phone}</div>}
        {customer.gst && <div>GST No- {customer.gst}</div>}
      </div>

      {/* subject line — shown for every quotation, underlined only on the single-item service format */}
      {doc.heading && (
        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: 12,
            marginTop: 8,
            marginBottom: 2,
            lineHeight: 1.25,
            textDecoration: variant === "service_breakdown" ? "underline" : "none",
          }}
        >
          {doc.heading}
        </div>
      )}

      {/* items table */}
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", marginTop: 8 }}>
        <thead>
          <tr style={{ background: HEADER_BG }}>
            {variant !== "service_breakdown" && <th style={th({ width: 28 })}>S.No</th>}
            <th style={th({ textAlign: "left" })}>DESCRIPTION</th>
            {variant === "product" && <th style={th()}>Make</th>}
            {variant !== "service_breakdown" && <th style={th()}>HSN</th>}
            {(variant === "product" || variant === "service_terms") && <th style={th()}>UOM</th>}
            <th style={th()}>{variant === "service_breakdown" ? "Qty" : "QTY"}</th>
            {variant === "service_breakdown" && <th style={th()}>{doc.basisColumnLabel || "PER TR"}</th>}
            <th style={th()}>{variant === "service_breakdown" ? "Rate" : "RATE"}</th>
            <th style={th()}>GST</th>
            <th style={th({ textAlign: "right" })}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              {variant !== "service_breakdown" && <td style={td({ textAlign: "center" })}>{i + 1}</td>}
              <td style={td()}>{it.description}</td>
              {variant === "product" && <td style={td({ textAlign: "center" })}>{it.make}</td>}
              {variant !== "service_breakdown" && <td style={td({ textAlign: "center" })}>{it.hsn}</td>}
              {(variant === "product" || variant === "service_terms") && <td style={td({ textAlign: "center" })}>{it.unit}</td>}
              <td style={td({ textAlign: "center" })}>{it.qty}</td>
              {variant === "service_breakdown" && <td style={td({ textAlign: "center" })}>{it.basis}</td>}
              <td style={td({ textAlign: "center" })}>{Number(it.rate).toFixed(2)}</td>
              <td style={td({ textAlign: "center" })}>{it.gstRate ?? gstRate}%</td>
              <td style={td({ textAlign: "right", whiteSpace: "nowrap" })}>
                {formatINR(Number(it.qty) * Number(it.rate) * (1 + (it.gstRate ?? gstRate) / 100))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* below-table area: terms/work-breakup on the left, tax breakdown + total on the right */}
      {variant === "service_breakdown" && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, marginTop: 10, alignItems: "stretch" }}>
          <div style={{ width: "54%" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 11,
                padding: "4px 8px",
                border: `1px solid ${BORDER}`,
                borderBottom: "none",
                background: HEADER_BG,
              }}
            >
              Work break Up Details:
            </div>
            <div
              style={{
                fontSize: 10.5,
                lineHeight: 1.35,
                padding: "6px 8px",
                border: `1px solid ${BORDER}`,
                height: "100%",
                whiteSpace: "pre-line",
              }}
            >
              {doc.terms?.workBreakup}
            </div>
          </div>
          <div style={{ width: "42%", flexShrink: 0 }}>
            <div style={{ fontSize: 11, lineHeight: 1.4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>CGST {gstRate / 2}%:</span>
                <span>{formatINR(doc.cgst)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>SGST {gstRate / 2}%:</span>
                <span>{formatINR(doc.sgst)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>GST {gstRate}%:</span>
                <span>{formatINR(doc.gst)}</span>
              </div>
            </div>
            <div style={{ fontSize: 10.5, lineHeight: 1.3, marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>Amount Chargeable(in words)INR-</span>
              <br />
              {doc.amountInWords}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: `1px solid ${BORDER}`,
                background: TOTAL_BG,
                padding: "8px 12px",
                fontWeight: 700,
                fontSize: 14,
                marginTop: 6,
              }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
          </div>
        </div>
      )}

      {(variant === "product" || variant === "service_terms") && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <div style={{ width: 240, fontSize: 11, lineHeight: 1.4 }}>
            {doc.showSubtotal && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Sub Total:</span>
                <span>{formatINR(doc.subtotal)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>CGST {gstRate / 2} %:</span>
              <span>{formatINR(doc.cgst)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>SGST {gstRate / 2} %:</span>
              <span>{formatINR(doc.sgst)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>GST {gstRate} %:</span>
              <span>{formatINR(doc.gst)}</span>
            </div>
          </div>
        </div>
      )}

      {variant === "product" && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, marginTop: 10, alignItems: "flex-start" }}>
          <div style={{ width: "54%" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 11,
                textAlign: "center",
                padding: "4px 8px",
                border: `1px solid ${BORDER}`,
                background: HEADER_BG,
              }}
            >
              TERMS AND CONDITION
            </div>
            <table style={{ width: "100%", fontSize: 10.5, borderCollapse: "collapse" }}>
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
                    <td style={td({ fontWeight: 700, width: "42%" })}>{label}</td>
                    <td style={td()}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{
                fontWeight: 700,
                fontSize: 11,
                padding: "4px 8px",
                border: `1px solid ${BORDER}`,
                borderTop: "none",
                background: HEADER_BG,
              }}
            >
              NOTE:
            </div>
            <div
              style={{
                fontSize: 10,
                lineHeight: 1.35,
                padding: "6px 8px",
                border: `1px solid ${BORDER}`,
                borderTop: "none",
              }}
            >
              <ol style={{ paddingLeft: 16, margin: 0 }}>
                {(doc.terms?.notes || "").split("\n").filter(Boolean).map((n, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {n.replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div style={{ width: "42%", flexShrink: 0 }}>
            <div style={{ fontSize: 10.5, lineHeight: 1.3 }}>
              <span style={{ fontWeight: 700 }}>Amount Chargeable(in words)-INR-</span>
              <br />
              {doc.amountInWords}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: `1px solid ${BORDER}`,
                background: TOTAL_BG,
                padding: "8px 12px",
                fontWeight: 700,
                fontSize: 14,
                marginTop: 6,
              }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
              <div style={{ textAlign: "center", width: 200 }}>
                <img
                  src={company.stampDataUrl || defaultStamp}
                  alt="stamp and signature"
                  style={{ height: 48, objectFit: "contain", margin: "0 auto 4px" }}
                />
                <div style={{ fontSize: 10.5, fontWeight: 700, borderTop: "1px solid rgba(0,0,0,0.6)", paddingTop: 4 }}>
                  Authorised Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === "service_terms" && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, marginTop: 10 }}>
          <div style={{ width: "52%" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 11,
                textAlign: "center",
                padding: "4px 8px",
                border: `1px solid ${BORDER}`,
                borderBottom: "none",
                background: HEADER_BG,
              }}
            >
              TERMS AND CONDITION
            </div>
            <div style={{ fontSize: 10.5, lineHeight: 1.35, padding: "6px 8px", border: `1px solid ${BORDER}` }}>
              <ol style={{ paddingLeft: 16, margin: 0 }}>
                {(doc.terms?.list || "").split("\n").filter(Boolean).map((n, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {n.replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div style={{ width: "44%", flexShrink: 0 }}>
            <div style={{ fontSize: 10.5, lineHeight: 1.3, marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>Amount Chargeable(in words)INR-</span>
              <br />
              {doc.amountInWords}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: `1px solid ${BORDER}`,
                background: TOTAL_BG,
                padding: "8px 12px",
                fontWeight: 700,
                fontSize: 14,
                marginTop: 6,
              }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* sign area — product variant already places its stamp beside the total */}
      {variant !== "product" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <div style={{ textAlign: "center", width: 200 }}>
            <img
              src={company.stampDataUrl || defaultStamp}
              alt="stamp and signature"
              style={{ height: 48, objectFit: "contain", margin: "0 auto 4px" }}
            />
            <div style={{ fontSize: 10.5, fontWeight: 700, borderTop: "1px solid rgba(0,0,0,0.6)", paddingTop: 4 }}>
              Authorised Signatory
            </div>
          </div>
        </div>
      )}

      {/* bank details */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <div style={{ display: "flex", border: `1px solid ${BORDER}`, width: 360 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 12,
              lineHeight: 1.2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "6px 8px",
              width: 90,
              flexShrink: 0,
              borderRight: `1px solid ${BORDER}`,
              background: HEADER_BG,
            }}
          >
            BANK
            <br />
            DETAILS
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.35, padding: "6px 8px" }}>
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