import React from "react";
import { formatINR, formatDateDMY } from "../lib/storage";
import defaultLogo from "../assets/logo.png";
import defaultStamp from "../assets/stamp.png";

// Three quotation layouts, matching the 3 real Lakshmi Engineering formats.
// Single black outer frame (no separate colored border), solid green
// (#1ba64b — same green used on invoices/proformas) for header bars/fills,
// gold (#ffc000) total box. Sections are kept tight so 10-15 line items
// still comfortably fit a single A4 page.
//
// IMPORTANT: every structural rule here (borders, flex layout, padding) is
// written as an inline `style` object rather than a Tailwind class — inline
// styles always render correctly in html2canvas regardless of build/cache
// state. Do not convert these back to className-only.
//
// The Sub Total / CGST / SGST / GST rows are rendered as extra <tr>s
// *inside the same items table* (not a separate floating box) so they are
// guaranteed to line up under the RATE/GST/AMOUNT columns — table layout
// does this automatically, a separate absolutely-positioned box can't.
//
// Numbered Terms/Notes are rendered as manually-numbered "1. text" lines
// rather than a real <ol>/<li> — html2canvas does not reliably render
// list-marker counters, which is why numbers were silently vanishing from
// the exported PDF even though they showed in the live browser preview.

const BORDER = "#000";
const ACCENT = "#1ba64b"; // same green as invoice/proforma
const TOTAL_BG = "#ffc000";

const th = (extra) => ({
  border: `1px solid ${BORDER}`,
  padding: "5px 7px",
  lineHeight: 1.25,
  verticalAlign: "middle",
  ...extra,
});
const td = (extra) => ({
  border: `1px solid ${BORDER}`,
  padding: "5px 7px",
  lineHeight: 1.3,
  verticalAlign: "middle",
  ...extra,
});

function NumberedLines({ text }) {
  const lines = (text || "").split("\n").filter(Boolean);
  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", marginBottom: 2 }}>
          <span style={{ width: 16, flexShrink: 0 }}>{i + 1}.</span>
          <span>{line.replace(/^\d+\.\s*/, "")}</span>
        </div>
      ))}
    </div>
  );
}

const QuotationTemplate = React.forwardRef(({ doc }, ref) => {
  const company = doc.company || {};
  const customer = doc.customer || {};
  const variant = doc.variant || "product";
  const items = doc.items || [];
  const gstRate = doc.gstRate || 18;

  // Column count per variant — used to colSpan the Sub Total/CGST/SGST/GST
  // rows so they land exactly under the RATE/GST/AMOUNT columns.
  const colCount =
    variant === "product" ? 9 : variant === "service_terms" ? 8 : 6; // service_breakdown

  const summaryRows = [];
  if (doc.showSubtotal) summaryRows.push(["Sub Total:", doc.subtotal]);
  summaryRows.push([`CGST ${gstRate / 2}%:`, doc.cgst]);
  summaryRows.push([`SGST ${gstRate / 2}%:`, doc.sgst]);
  summaryRows.push([`GST ${gstRate}%:`, doc.gst]);

  return (
    <div
      ref={ref}
      style={{
        background: "#fff",
        width: 794,
        boxSizing: "border-box",
        padding: 46,
      }}
    >
      <div
        style={{
          color: "#0f1a14",
          boxSizing: "border-box",
          fontFamily: "Inter, system-ui, sans-serif",
          border: `2px solid ${BORDER}`,
          padding: "10px 18px 12px",
        }}
      >
        {/* ISO number — configurable in Settings */}
        {company.isoNumber && (
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 10.5 }}>ISO {company.isoNumber}</div>
            {company.isoDescription && (
              <div style={{ fontSize: 8.5, color: "#444", marginTop: 1 }}>{company.isoDescription}</div>
            )}
          </div>
        )}

        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <img src={company.logoDataUrl || defaultLogo} alt="logo" style={{ height: 70, objectFit: "contain" }} />
          <table style={{ fontSize: 10, borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ border: "none", padding: "5px 8px 6px", fontWeight: 700, textAlign: "right" }}>DATE</td>
                <td style={{ border: `1px solid ${BORDER}`, padding: "5px 8px 6px", textAlign: "center" }}>{formatDateDMY(doc.date)}</td>
              </tr>
              <tr>
                <td style={{ border: "none", padding: "5px 8px 6px", fontWeight: 700, textAlign: "right" }}>QUOTE #</td>
                <td style={{ border: `1px solid ${BORDER}`, padding: "5px 8px 6px", textAlign: "center" }}>{doc.number}</td>
              </tr>
              <tr>
                <td style={{ border: "none", padding: "5px 8px 6px", fontWeight: 700, textAlign: "right" }}>VALID UNTIL</td>
                <td style={{ border: `1px solid ${BORDER}`, padding: "5px 8px 6px", textAlign: "center" }}>{formatDateDMY(doc.validUntil)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* company block */}
        <div style={{ marginTop: 5, fontSize: 10, lineHeight: 1.3, maxWidth: 330 }}>
          <div style={{ fontWeight: 700, fontSize: 11.5 }}>{company.companyName}</div>
          <div>{company.address}</div>
          <div>Phone No- {company.phone}</div>
          <div>Mail- {company.email}</div>
          {company.website && <div>Website- {company.website}</div>}
          <div>GST No- {company.gst}</div>
        </div>

        {/* customer block */}
        <div
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            padding: "3px 18px",
            lineHeight: 1.15,
            marginTop: 5,
            border: `1px solid ${BORDER}`,
            background: ACCENT,
          }}
        >
          CUSTOMER
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.25, paddingTop: 3 }}>
          <div style={{ fontWeight: 700 }}>{customer.name}</div>
          <div>{customer.address}</div>
          {customer.phone && <div>Ph: {customer.phone}</div>}
          {customer.gst && <div>GST No- {customer.gst}</div>}
        </div>

        {/* subject line — always underlined, shown for every quotation */}
        {doc.heading && (
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 11,
              marginTop: 5,
              marginBottom: 2,
              lineHeight: 1.15,
              textDecoration: "underline",
            }}
          >
            {doc.heading}
          </div>
        )}

        {/* items table (Sub Total/CGST/SGST/GST are extra rows in this same table, below) */}
        <table style={{ width: "100%", fontSize: 9.5, borderCollapse: "collapse", marginTop: 5 }}>
          <thead>
            <tr style={{ background: ACCENT, color: "#fff" }}>
              {variant !== "service_breakdown" && <th style={th({ width: 26 })}>S.No</th>}
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
            {summaryRows.map(([label, value], i) => (
              <tr key={label}>
                <td
                  colSpan={colCount - 1}
                  style={{
                    border: "none",
                    borderTop: i === 0 ? `1px solid ${BORDER}` : "none",
                    padding: "4px 7px",
                    verticalAlign: "middle",
                    textAlign: "right",
                    fontWeight: label.startsWith("Sub") ? 700 : 500,
                    fontSize: 10,
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    border: "none",
                    borderTop: i === 0 ? `1px solid ${BORDER}` : "none",
                    padding: "4px 7px",
                    verticalAlign: "middle",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    fontWeight: label.startsWith("Sub") ? 700 : 500,
                    fontSize: 10,
                  }}
                >
                  {formatINR(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* below-table: terms/work-breakup on the left, amount-in-words + total + stamp + bank on the right */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginTop: 8, alignItems: "flex-start" }}>
          <div style={{ width: "53%" }}>
            {variant === "service_breakdown" && (
              <>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 10,
                    color: "#fff",
                    padding: "3px 7px",
                    border: `1px solid ${BORDER}`,
                    borderBottom: "none",
                    background: ACCENT,
                  }}
                >
                  Work break Up Details:
                </div>
                <div style={{ fontSize: 9.5, lineHeight: 1.25, padding: "5px 7px", border: `1px solid ${BORDER}`, whiteSpace: "pre-line" }}>
                  {doc.terms?.workBreakup}
                </div>
              </>
            )}

            {variant === "product" && (
              <>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 10,
                    color: "#fff",
                    textAlign: "center",
                    padding: "3px 7px",
                    border: `1px solid ${BORDER}`,
                    background: ACCENT,
                  }}
                >
                  TERMS AND CONDITION
                </div>
                <table style={{ width: "100%", fontSize: 9.5, borderCollapse: "collapse" }}>
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
                        <td style={td({ fontWeight: 700, width: "42%", textAlign: "center" })}>{label}</td>
                        <td style={td({ textAlign: "center" })}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 10,
                    color: "#fff",
                    padding: "3px 7px",
                    border: `1px solid ${BORDER}`,
                    borderTop: "none",
                    background: ACCENT,
                  }}
                >
                  NOTE:
                </div>
                <div style={{ fontSize: 9, lineHeight: 1.25, padding: "5px 7px", border: `1px solid ${BORDER}`, borderTop: "none" }}>
                  <NumberedLines text={doc.terms?.notes} />
                </div>
              </>
            )}

            {variant === "service_terms" && (
              <>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 10,
                    color: "#fff",
                    textAlign: "center",
                    padding: "3px 7px",
                    border: `1px solid ${BORDER}`,
                    borderBottom: "none",
                    background: ACCENT,
                  }}
                >
                  TERMS AND CONDITION
                </div>
                <div style={{ fontSize: 9.5, lineHeight: 1.25, padding: "5px 7px", border: `1px solid ${BORDER}` }}>
                  <NumberedLines text={doc.terms?.list} />
                </div>
              </>
            )}
          </div>

          <div style={{ width: "45%", flexShrink: 0 }}>
            {/* amount-in-words box sits flush against the total box — shared border, no gap */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", gap: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  lineHeight: 1.25,
                  flex: 1,
                  border: `1px solid ${BORDER}`,
                  padding: "6px 8px",
                }}
              >
                <span style={{ fontWeight: 700 }}>Amount Chargeable(in words)-INR-</span>
                <br />
                {doc.amountInWords}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  border: `1px solid ${BORDER}`,
                  borderLeft: "none",
                  background: TOTAL_BG,
                  padding: "7px 12px",
                  fontWeight: 700,
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                <span>TOTAL</span>
                <span>{formatINR(doc.total)}</span>
              </div>
            </div>

            {/* stamp + signature, directly under the total */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <div style={{ textAlign: "center", width: 190 }}>
                <img
                  src={company.stampDataUrl || defaultStamp}
                  alt="stamp and signature"
                  style={{ height: 58, objectFit: "contain", margin: "0 auto 3px" }}
                />
                <div style={{ fontSize: 10, fontWeight: 700, borderTop: `1px solid ${BORDER}`, paddingTop: 4 }}>Authorised Signatory</div>
              </div>
            </div>

            {/* bank details — directly under stamp/signature */}
            <div style={{ display: "flex", border: `1px solid ${BORDER}`, marginTop: 10 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 11,
                  color: "#fff",
                  lineHeight: 1.15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "6px 6px",
                  width: 78,
                  flexShrink: 0,
                  borderRight: `1px solid ${BORDER}`,
                  background: ACCENT,
                }}
              >
                BANK
                <br />
                DETAILS
              </div>
              <div style={{ fontSize: 8.5, lineHeight: 1.25, padding: "5px 7px" }}>
                BANK NAME: {company.bankName}
                <br />
                A/C NO: {company.accountNo}
                <br />
                BRANCH &amp; IFS Code: {company.branchIfsc}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default QuotationTemplate;
