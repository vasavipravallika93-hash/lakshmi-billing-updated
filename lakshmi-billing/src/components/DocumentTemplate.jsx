import React from "react";
import { formatINR, formatDateDMY } from "../lib/storage";
import defaultLogo from "../assets/logo.png";
import defaultStamp from "../assets/stamp.png";

// Matches the real Lakshmi Engineering paper formats exactly:
//  - type="invoice"  -> green #1ba64b frame, BILL TO bar,
//     S.No/DESCRIPTION/HSN code/Brand/QTY/RATE/GST/AMOUNT table, blue
//     summary rows, "Make all checks payable to" signature box, footer band
//  - type="proforma" -> Pro Forma Invoice title block, SHIPMENT INFORMATION
//     bill-to/ship-to columns, MATERIALS/MAKE/HSN/QTY table, declaration
//     bar, grey footer band
//
// IMPORTANT: every structural rule here (borders, flex layout, padding) is
// written as an inline `style` object rather than a Tailwind class. Tailwind
// utility classes depend on the build's generated stylesheet being present;
// inline styles always render correctly, in the browser and in html2canvas,
// regardless of build/cache state. Do not convert these back to className-only.

const GREEN = "#1ba64b";

const th = (extra) => ({ border: `1px solid ${GREEN}`, padding: "8px 10px", lineHeight: 1.35, ...extra });
const td = (extra) => ({ border: "1px solid #ddd", padding: "8px 10px", lineHeight: 1.4, verticalAlign: "top", ...extra });

const DocumentTemplate = React.forwardRef(({ doc, type }, ref) => {
  const company = doc.company || {};
  const customer = doc.customer || {};
  const items = doc.items || [];
  const gstRate = doc.gstRate || 18;

  if (type === "proforma") {
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
          border: `3px solid ${GREEN}`,
          borderRadius: 6,
          padding: "20px 28px 0",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <img src={company.logoDataUrl || defaultLogo} alt="logo" style={{ height: 62, objectFit: "contain" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: GREEN, marginBottom: 4 }}>Pro Forma Invoice</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, lineHeight: 1.55 }}>
              DATE : <span>{formatDateDMY(doc.date)}</span>
              <br />
              {doc.validUntil && (
                <>
                  DATE OF EXPIRY: <span>{formatDateDMY(doc.validUntil)}</span>
                  <br />
                </>
              )}
              INVOICE NO : <span>{doc.number}</span>
              <br />
              {customer.customerId && (
                <>
                  CUSTOMER ID: <span>{customer.customerId}</span>
                  <br />
                </>
              )}
              {doc.sourceNumber && (
                <>
                  Buyer's Order No: <span>{doc.sourceNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* company block */}
        <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{company.companyName}</div>
          <div>{company.address}</div>
          <div>Phone No- {company.phone}</div>
          <div>Mail- {company.email}</div>
          <div>GST No- {company.gst}</div>
        </div>

        {/* shipment information */}
        <div style={{ fontWeight: 700, fontSize: 12.5, marginTop: 14 }}>SHIPMENT INFORMATION</div>
        <div style={{ display: "flex", gap: 30, marginTop: 6 }}>
          <div style={{ width: "50%" }}>
            <div style={{ fontWeight: 700, fontSize: 12, borderBottom: "1px solid rgba(0,0,0,0.4)", paddingBottom: 3, marginBottom: 6 }}>
              BILL TO( Buyer)
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600 }}>{customer.name}</div>
              <div>{customer.address}</div>
              {customer.phone && <div>Ph: {customer.phone}</div>}
              {customer.gst && <div>GST No- {customer.gst}</div>}
            </div>
          </div>
          <div style={{ width: "50%" }}>
            <div style={{ fontWeight: 700, fontSize: 12, borderBottom: "1px solid rgba(0,0,0,0.4)", paddingBottom: 3, marginBottom: 6 }}>
              SHIP TO( Consignee)
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600 }}>{customer.name}</div>
              <div>{customer.address}</div>
              {customer.phone && <div>Ph: {customer.phone}</div>}
              {customer.gst && <div>GST No- {customer.gst}</div>}
            </div>
          </div>
        </div>

        {/* items table */}
        <table style={{ width: "100%", marginTop: 14, fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: GREEN, color: "#fff" }}>
              <th style={th({ width: 32 })}>S.No</th>
              <th style={th({ textAlign: "left" })}>MATERIALS</th>
              <th style={th()}>MAKE</th>
              <th style={th()}>HSN</th>
              <th style={th()}>QTY/ charges</th>
              <th style={th()}>RATE</th>
              <th style={th()}>GST</th>
              <th style={th({ textAlign: "right" })}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={td({ textAlign: "center" })}>{i + 1}</td>
                <td style={td()}>{it.description}</td>
                <td style={td({ textAlign: "center" })}>{it.make || "-"}</td>
                <td style={td({ textAlign: "center" })}>{it.hsn}</td>
                <td style={td({ textAlign: "center" })}>{it.qty}</td>
                <td style={td({ textAlign: "center" })}>{Number(it.rate).toFixed(2)}</td>
                <td style={td({ textAlign: "center" })}>{it.gstRate ?? gstRate}%</td>
                <td style={td({ textAlign: "right", whiteSpace: "nowrap" })}>
                  {formatINR(Number(it.qty) * Number(it.rate) * (1 + (it.gstRate ?? gstRate) / 100))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* summary */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, gap: 24 }}>
          <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 480 }}>
            <div>
              <span style={{ fontWeight: 700 }}>Amount Chargeable(in words)</span>
              <br />
              {doc.amountInWords}
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.55 }}>
              <div>
                <span style={{ fontWeight: 700 }}>Company's PAN:</span> {company.pan}
              </div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>Company's Bank Details:</div>
              <div>BANK NAME: {company.bankName}</div>
              <div>A/C NO: {company.accountNo}</div>
              <div>BRANCH &amp; IFS Code: {company.branchIfsc}</div>
            </div>
          </div>
          <div style={{ width: 280, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 4px" }}>
              <span>Sub Total:</span>
              <span>{formatINR(doc.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 4px" }}>
              <span>GST {gstRate}%</span>
              <span>{formatINR(doc.gst)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: GREEN,
                color: "#fff",
                padding: "12px 14px",
                fontWeight: 700,
                fontSize: 16,
                marginTop: 8,
              }}
            >
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "#d9d9d9", fontSize: 11.5, padding: "8px 10px", marginTop: 16, lineHeight: 1.4 }}>
          We declare that this invoice shows the actual price of the goods described and that all particulars are true and
          correct.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <img src={company.stampDataUrl || defaultStamp} alt="stamp and signature" style={{ height: 64, objectFit: "contain" }} />
        </div>

        <div
          style={{
            background: "#d9d9d9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 16px",
            marginTop: 8,
            fontSize: 12,
          }}
        >
          <div>This is a Computer Generated Invoice</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{company.companyName}</div>
            <div style={{ fontSize: 11 }}>Authorised Signatory</div>
          </div>
        </div>
      </div>
    );
  }

  // ---- invoice (default) ----
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
        border: `3px solid ${GREEN}`,
        borderRadius: 6,
        padding: "20px 28px 0",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <img src={company.logoDataUrl || defaultLogo} alt="logo" style={{ height: 56, objectFit: "contain" }} />
        <div style={{ fontSize: 30, fontWeight: 700, color: GREEN, letterSpacing: 1 }}>INVOICE</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 20 }}>
        <div style={{ fontSize: 12, lineHeight: 1.45 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{company.companyName}</div>
          <div>{company.address}</div>
          <div>Phone No- {company.phone}</div>
          <div>Mail- {company.email}</div>
          <div>GST No- {company.gst}</div>
        </div>

        <table style={{ fontSize: 12, borderCollapse: "collapse", height: "fit-content", flexShrink: 0 }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 10px", border: "1px solid rgba(0,0,0,0.7)", background: "#fafafa", fontWeight: 700, whiteSpace: "nowrap" }}>
                DATE
              </td>
              <td style={{ padding: "4px 10px", border: "1px solid rgba(0,0,0,0.7)" }}>{formatDateDMY(doc.date)}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 10px", border: "1px solid rgba(0,0,0,0.7)", background: "#fafafa", fontWeight: 700, whiteSpace: "nowrap" }}>
                INVOICE #
              </td>
              <td style={{ padding: "4px 10px", border: "1px solid rgba(0,0,0,0.7)" }}>{doc.number}</td>
            </tr>
            {customer.customerId && (
              <tr>
                <td style={{ padding: "4px 10px", border: "1px solid rgba(0,0,0,0.7)", background: "#fafafa", fontWeight: 700, whiteSpace: "nowrap" }}>
                  CUSTOMER ID
                </td>
                <td style={{ padding: "4px 10px", border: "1px solid rgba(0,0,0,0.7)" }}>{customer.customerId}</td>
              </tr>
            )}
            {doc.dueDate && (
              <tr>
                <td style={{ padding: "4px 10px", border: "1px solid rgba(0,0,0,0.7)", background: "#fafafa", fontWeight: 700, whiteSpace: "nowrap" }}>
                  DUE DATE
                </td>
                <td style={{ padding: "4px 10px", border: "1px solid rgba(0,0,0,0.7)" }}>{formatDateDMY(doc.dueDate)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 8px", marginTop: 14 }}>BILL TO</div>
      <div style={{ fontSize: 12, lineHeight: 1.45, paddingTop: 6 }}>
        <div style={{ fontWeight: 700 }}>{customer.name}</div>
        <div>{customer.address}</div>
        {customer.phone && <div>Ph: {customer.phone}</div>}
        {customer.gst && <div>GST NO- {customer.gst}</div>}
      </div>

      <table style={{ width: "100%", marginTop: 12, fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: GREEN, color: "#fff" }}>
            <th style={th({ width: 32 })}>S.No</th>
            <th style={th({ textAlign: "left" })}>DESCRIPTION</th>
            <th style={th()}>HSN code</th>
            <th style={th()}>Brand</th>
            <th style={th()}>QTY</th>
            <th style={th()}>RATE</th>
            <th style={th()}>GST</th>
            <th style={th({ textAlign: "right" })}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} style={{ background: i % 2 ? "#f2f2f2" : "transparent" }}>
              <td style={td({ textAlign: "center" })}>{i + 1}</td>
              <td style={td()}>{it.description}</td>
              <td style={td({ textAlign: "center" })}>{it.hsn}</td>
              <td style={td({ textAlign: "center" })}>{it.make || it.unit || "Nos"}</td>
              <td style={td({ textAlign: "center" })}>{it.qty}</td>
              <td style={td({ textAlign: "center" })}>{Number(it.rate).toFixed(2)}</td>
              <td style={td({ textAlign: "center" })}>{it.gstRate ?? gstRate}%</td>
              <td style={td({ textAlign: "right", whiteSpace: "nowrap" })}>
                {formatINR(Number(it.qty) * Number(it.rate) * (1 + (it.gstRate ?? gstRate) / 100))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4, paddingTop: 10 }}>
        <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 440 }}>
          <div style={{ fontWeight: 700 }}>Amount Chargeable (in words)</div>
          <div>{doc.amountInWords}</div>
        </div>
        <div style={{ width: 260, flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              background: "#dce8f0",
              padding: "6px 10px",
              fontSize: 12.5,
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            <span>Sub Total:</span>
            <span>{formatINR(doc.subtotal)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              background: "#dce8f0",
              padding: "6px 10px",
              fontSize: 12.5,
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            <span>GST {gstRate}%:</span>
            <span>{formatINR(doc.gst)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              background: GREEN,
              color: "#fff",
              padding: "8px 10px",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            <span>TOTAL</span>
            <span>{formatINR(doc.total)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <div style={{ textAlign: "center", width: 220 }}>
          <img
            src={company.stampDataUrl || defaultStamp}
            alt="stamp and signature"
            style={{ height: 64, objectFit: "contain", margin: "0 auto 6px" }}
          />
          <div style={{ fontSize: 11.5, lineHeight: 1.4 }}>
            Make all checks payable to
            <br />
            <span style={{ fontWeight: 700 }}>{company.companyName}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: `2px solid ${GREEN}`,
          marginTop: 16,
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 11.5, fontWeight: 700 }}>
          {company.phone}
          {company.phone && company.email ? ", " : ""}
          {company.email}
        </div>
        <div style={{ fontStyle: "italic", fontWeight: 700, fontSize: 13 }}>Thank You For Your Business!</div>
      </div>

      <div style={{ textAlign: "center", fontSize: 10.5, color: "rgba(0,0,0,0.6)", padding: "10px 0" }}>
        This is Computer Generated Invoice
      </div>
    </div>
  );
});

export default DocumentTemplate;