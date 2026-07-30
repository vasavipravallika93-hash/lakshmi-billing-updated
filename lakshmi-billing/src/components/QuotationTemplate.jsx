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

// IMPORTANT: the items table, the terms table, and the date/quote/valid-until
// box are built entirely from <div>s with CSS Grid/Flexbox — NOT a real
// <table>/<td>. html2canvas does not reliably center content inside native
// table cells (neither `vertical-align` nor a `height:100%` flex child
// inside a <td> renders correctly), which is why text kept rendering pinned
// to the bottom of its cell no matter which CSS was tried on the <td>.
// Flexbox alignment on plain <div>s (as used in the Bank Details / Total /
// Amount-in-words boxes below) IS rendered correctly by html2canvas, so
// every grid "row" here is a <div style={{display:"grid"}}> and every
// "cell" is a <div style={{display:"flex", alignItems:"center"}}> — never
// a <td>. Do not convert these back to a real <table>.
const COL_WIDTH = {
  sno: "26px",
  description: "2fr",
  make: "0.8fr",
  hsn: "0.9fr",
  uom: "0.6fr",
  qty: "0.5fr",
  basis: "0.8fr",
  rate: "0.8fr",
  gst: "0.5fr",
  amount: "1fr",
};

function GridRow({ cols, children, style }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, borderBottom: `1px solid ${BORDER}`, ...style }}>
      {children}
    </div>
  );
}

function GridCell({ align = "center", last, children, style }) {
  const justify = align === "right" ? "flex-end" : align === "left" ? "flex-start" : "center";
  return (
    <div
      style={{
        borderRight: last ? "none" : `1px solid ${BORDER}`,
        padding: "2px 6px",
        fontSize: 9.5,
        lineHeight: 1.2,
        minHeight: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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
          <div style={{ display: "flex", fontSize: 10 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {["DATE", "QUOTE #", "VALID UNTIL"].map((label) => (
                <div key={label} style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "flex-end", fontWeight: 700, padding: "0 8px" }}>
                  {label}
                </div>
              ))}
            </div>
            <div style={{ border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>
              {[formatDateDMY(doc.date), doc.number, formatDateDMY(doc.validUntil)].map((value, i) => (
                <div
                  key={i}
                  style={{
                    height: 22,
                    minWidth: 110,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                    padding: "0 8px",
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
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

        {/* items grid (Sub Total/CGST/SGST/GST are extra rows in the same grid, below) —
            built from <div>s (see COL_WIDTH/GridRow/GridCell above), not a <table>. */}
        {(() => {
          const columns =
            variant === "product"
              ? [
                  { key: "sno", label: "S.No", align: "center" },
                  { key: "description", label: "DESCRIPTION", align: "left" },
                  { key: "make", label: "Make", align: "center" },
                  { key: "hsn", label: "HSN", align: "center" },
                  { key: "uom", label: "UOM", align: "center" },
                  { key: "qty", label: "QTY", align: "center" },
                  { key: "rate", label: "RATE", align: "center" },
                  { key: "gst", label: "GST", align: "center" },
                  { key: "amount", label: "AMOUNT", align: "right" },
                ]
              : variant === "service_terms"
              ? [
                  { key: "sno", label: "S.No", align: "center" },
                  { key: "description", label: "DESCRIPTION", align: "left" },
                  { key: "hsn", label: "HSN", align: "center" },
                  { key: "uom", label: "UOM", align: "center" },
                  { key: "qty", label: "QTY", align: "center" },
                  { key: "rate", label: "RATE", align: "center" },
                  { key: "gst", label: "GST", align: "center" },
                  { key: "amount", label: "AMOUNT", align: "right" },
                ]
              : [
                  { key: "description", label: "DESCRIPTION", align: "left" },
                  { key: "qty", label: "Qty", align: "center" },
                  { key: "basis", label: doc.basisColumnLabel || "PER TR", align: "center" },
                  { key: "rate", label: "Rate", align: "center" },
                  { key: "gst", label: "GST", align: "center" },
                  { key: "amount", label: "AMOUNT", align: "right" },
                ];
          const cols = columns.map((c) => COL_WIDTH[c.key]).join(" ");

          return (
            <div style={{ border: `1px solid ${BORDER}`, borderBottom: "none", marginTop: 5 }}>
              <GridRow cols={cols} style={{ background: ACCENT, color: "#fff" }}>
                {columns.map((c, i) => (
                  <GridCell key={c.key} align={c.align} last={i === columns.length - 1} style={{ fontSize: 9.5 }}>
                    {c.label}
                  </GridCell>
                ))}
              </GridRow>

              {items.map((it, rowIdx) => (
                <GridRow cols={cols} key={rowIdx}>
                  {columns.map((c, i) => {
                    let content;
                    switch (c.key) {
                      case "sno":
                        content = rowIdx + 1;
                        break;
                      case "description":
                        content = it.description;
                        break;
                      case "make":
                        content = it.make;
                        break;
                      case "hsn":
                        content = it.hsn;
                        break;
                      case "uom":
                        content = it.unit;
                        break;
                      case "qty":
                        content = it.qty;
                        break;
                      case "basis":
                        content = it.basis;
                        break;
                      case "rate":
                        content = Number(it.rate).toFixed(2);
                        break;
                      case "gst":
                        content = `${it.gstRate ?? gstRate}%`;
                        break;
                      case "amount":
                        content = formatINR(Number(it.qty) * Number(it.rate) * (1 + (it.gstRate ?? gstRate) / 100));
                        break;
                      default:
                        content = null;
                    }
                    return (
                      <GridCell
                        key={c.key}
                        align={c.align}
                        last={i === columns.length - 1}
                        style={c.key === "amount" ? { whiteSpace: "nowrap" } : undefined}
                      >
                        {content}
                      </GridCell>
                    );
                  })}
                </GridRow>
              ))}

              {summaryRows.map(([label, value], i) => (
                <div
                  key={label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: cols,
                    borderTop: i === 0 ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  <div
                    style={{
                      gridColumn: `1 / ${columns.length}`,
                      padding: "3px 7px",
                      textAlign: "right",
                      fontWeight: label.startsWith("Sub") ? 700 : 500,
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      padding: "3px 7px",
                      whiteSpace: "nowrap",
                      fontWeight: label.startsWith("Sub") ? 700 : 500,
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {formatINR(value)}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

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
                <div style={{ border: `1px solid ${BORDER}` }}>
                  {[
                    ["Payment Terms", doc.terms?.paymentTerms],
                    ["Delivery Time", doc.terms?.deliveryTime],
                    ["Taxes", doc.terms?.taxes],
                    ["Packing and Forwardings", doc.terms?.packingForwarding],
                    ["Freight/Transportation", doc.terms?.freightTransportation],
                    ["Offer validity", doc.terms?.offerValidity],
                  ].map(([label, value], i) => (
                    <div
                      key={label}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "42% 58%",
                        borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <div style={{ borderRight: `1px solid ${BORDER}`, padding: "3px 6px", fontSize: 9.5, fontWeight: 700, minHeight: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {label}
                      </div>
                      <div style={{ padding: "3px 6px", fontSize: 9.5, minHeight: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
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
            {/* amount-in-words sits to the LEFT of the total box, same row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", gap: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  lineHeight: 1.25,
                  flex: 1,
                  border: `1px solid ${BORDER}`,
                  borderRight: "none",
                  padding: "6px 8px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
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