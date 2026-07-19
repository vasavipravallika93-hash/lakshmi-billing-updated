import React from "react";
import { formatINR, formatDateDMY } from "../lib/storage";
import defaultLogo from "../assets/logo.png";
import defaultStamp from "../assets/stamp.png";

// Three quotation layouts, matching the 3 real Lakshmi Engineering formats
// exactly (dark-green #14733d frame/borders, light-green #8cc63f headers,
// gold #ffc000 total box):
//  - "product"            -> long-itemized-with-make format
//     S.No/DESCRIPTION/Make/HSN/UOM/QTY/RATE/GST/AMOUNT, key-value Terms
//     table + numbered Notes, CGST/SGST/GST breakdown, sign box beside total
//  - "service_breakdown"  -> single-item format
//     Subject line, DESCRIPTION/Qty/basis/Rate/GST/Amount, free-text "Work
//     break Up Details" box beside the CGST/SGST/GST breakdown
//  - "service_terms"      -> multi-item-hsn format
//     S.No/DESCRIPTION/HSN/UOM/QTY/RATE/GST/AMOUNT, numbered Terms list,
//     CGST/SGST/GST breakdown
//
// IMPORTANT: every structural rule here (borders, flex layout, padding) is
// written as an inline `style` object rather than a Tailwind class. Tailwind
// utility classes depend on the build's generated stylesheet being present;
// inline styles always render correctly, in the browser and in html2canvas,
// regardless of build/cache state. Do not convert these back to className-only.

const BORDER = "#14733d";
const HEADER_BG = "#8cc63f";
const TOTAL_BG = "#ffc000";

const th = (extra) => ({
  border: `1px solid ${BORDER}`,
  padding: "8px 10px",
  lineHeight: 1.35,
  ...extra,
});
const td = (extra) => ({
  border: `1px solid ${BORDER}`,
  padding: "8px 10px",
  lineHeight: 1.4,
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
        minHeight: 1000,
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, sans-serif",
        border: `3px solid ${BORDER}`,
        borderRadius: 6,
        padding: "20px 28px 24px",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <img src={company.logoDataUrl || defaultLogo} alt="logo" style={{ height: 64, objectFit: "contain" }} />
        <table style={{ fontSize: 12, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "4px 10px", background: "#fafafa", fontWeight: 700 }}>DATE</td>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "4px 10px" }}>{formatDateDMY(doc.date)}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "4px 10px", background: "#fafafa", fontWeight: 700 }}>QUOTE #</td>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "4px 10px" }}>{doc.number}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "4px 10px", background: "#fafafa", fontWeight: 700 }}>VALID UNTIL</td>
              <td style={{ border: "1px solid rgba(0,0,0,0.7)", padding: "4px 10px" }}>{formatDateDMY(doc.validUntil)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* company block */}
      <div style={{ marginTop: 16, fontSize: 12, lineHeight: 1.55 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{company.companyName}</div>
        <div>{company.address}</div>
        <div>Phone No- {company.phone}</div>
        <div>Mail- {company.email}</div>
        <div>GST No- {company.gst}</div>
      </div>

      {/* customer block */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          textAlign: "center",
          padding: "5px 10px",
          lineHeight: 1.35,
          marginTop: 16,
          border: `1px solid ${BORDER}`,
          background: HEADER_BG,
        }}
      >
        CUSTOMER
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.55, paddingTop: 6 }}>
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
            fontSize: 13,
            marginTop: 16,
            marginBottom: 4,
            lineHeight: 1.35,
            textDecoration: variant === "service_breakdown" ? "underline" : "none",
          }}
        >
          {doc.heading}
        </div>
      )}

      {/* items table */}
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginTop: 14 }}>
        <thead>
          <tr style={{ background: HEADER_BG }}>
            {variant !== "service_breakdown" && <th style={th({ width: 32 })}>S.No</th>}
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 16, alignItems: "stretch" }}>
          <div style={{ width: "54%" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 11.5,
                padding: "6px 10px",
                border: `1px solid ${BORDER}`,
                borderBottom: "none",
                background: HEADER_BG,
              }}
            >
              Work break Up Details:
            </div>
            <div
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                padding: "10px 10px",
                border: `1px solid ${BORDER}`,
                height: "100%",
                whiteSpace: "pre-line",
              }}
            >
              {doc.terms?.workBreakup}
            </div>
          </div>
          <div style={{ width: "42%", flexShrink: 0 }}>
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
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
            <div style={{ fontSize: 11.5, lineHeight: 1.6, marginTop: 12 }}>
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
                padding: "12px 16px",
                fontWeight: 700,
                fontSize: 15,
                marginTop: 10,
              }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
          </div>
        </div>
      )}

      {(variant === "product" || variant === "service_terms") && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div style={{ width: 260, fontSize: 12, lineHeight: 1.8 }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 16, alignItems: "flex-start" }}>
          <div style={{ width: "54%" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 11.5,
                textAlign: "center",
                padding: "6px 10px",
                border: `1px solid ${BORDER}`,
                background: HEADER_BG,
              }}
            >
              TERMS AND CONDITION
            </div>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
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
                fontSize: 11.5,
                padding: "6px 10px",
                border: `1px solid ${BORDER}`,
                borderTop: "none",
                background: HEADER_BG,
              }}
            >
              NOTE:
            </div>
            <div
              style={{
                fontSize: 10.5,
                lineHeight: 1.65,
                padding: "10px 10px",
                border: `1px solid ${BORDER}`,
                borderTop: "none",
              }}
            >
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {(doc.terms?.notes || "").split("\n").filter(Boolean).map((n, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {n.replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div style={{ width: "42%", flexShrink: 0 }}>
            <div style={{ fontSize: 11.5, lineHeight: 1.6 }}>
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
                padding: "12px 16px",
                fontWeight: 700,
                fontSize: 15,
                marginTop: 10,
              }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <div style={{ textAlign: "center", width: 220 }}>
                <img
                  src={company.stampDataUrl || defaultStamp}
                  alt="stamp and signature"
                  style={{ height: 64, objectFit: "contain", margin: "0 auto 6px" }}
                />
                <div style={{ fontSize: 11.5, fontWeight: 700, borderTop: "1px solid rgba(0,0,0,0.6)", paddingTop: 6 }}>
                  Authorised Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === "service_terms" && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 16 }}>
          <div style={{ width: "52%" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 11.5,
                textAlign: "center",
                padding: "6px 10px",
                border: `1px solid ${BORDER}`,
                borderBottom: "none",
                background: HEADER_BG,
              }}
            >
              TERMS AND CONDITION
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.65, padding: "10px 10px", border: `1px solid ${BORDER}` }}>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {(doc.terms?.list || "").split("\n").filter(Boolean).map((n, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {n.replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div style={{ width: "44%", flexShrink: 0 }}>
            <div style={{ fontSize: 11.5, lineHeight: 1.6, marginTop: 12 }}>
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
                padding: "12px 16px",
                fontWeight: 700,
                fontSize: 15,
                marginTop: 10,
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
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <div style={{ textAlign: "center", width: 220 }}>
            <img
              src={company.stampDataUrl || defaultStamp}
              alt="stamp and signature"
              style={{ height: 64, objectFit: "contain", margin: "0 auto 6px" }}
            />
            <div style={{ fontSize: 11.5, fontWeight: 700, borderTop: "1px solid rgba(0,0,0,0.6)", paddingTop: 6 }}>
              Authorised Signatory
            </div>
          </div>
        </div>
      )}

      {/* bank details */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <div style={{ display: "flex", border: `1px solid ${BORDER}`, width: 420 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1.3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "10px 12px",
              width: 100,
              flexShrink: 0,
              borderRight: `1px solid ${BORDER}`,
              background: HEADER_BG,
            }}
          >
            BANK
            <br />
            DETAILS
          </div>
          <div style={{ fontSize: 10.5, lineHeight: 1.65, padding: "10px 12px" }}>
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