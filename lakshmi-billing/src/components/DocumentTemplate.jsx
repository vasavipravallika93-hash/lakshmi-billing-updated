import React from "react";
import { formatINR } from "../lib/storage";
import defaultLogo from "../assets/logo.png";
import defaultStamp from "../assets/stamp.png";

// Matches the real Lakshmi Engineering paper formats exactly:
//  - type="invoice"  -> "4-invoice.html" (green #1ba64b frame, BILL TO bar,
//     S.No/DESCRIPTION/HSN code/Brand/QTY/RATE/GST/AMOUNT table, blue
//     summary rows, "Make all checks payable to" signature box, footer band)
//  - type="proforma" -> "5-proforma-invoice.html" (Pro Forma Invoice title
//     block, SHIPMENT INFORMATION bill-to/ship-to columns, MATERIALS/MAKE/
//     HSN/QTY table, declaration bar, grey footer band)

const DocumentTemplate = React.forwardRef(({ doc, type }, ref) => {
  const company = doc.company || {};
  const customer = doc.customer || {};
  const items = doc.items || [];

  if (type === "proforma") {
    return (
      <div
        ref={ref}
        className="bg-white text-ink w-[794px] font-body border-[3px] border-[#1ba64b] rounded-[6px] px-7 pt-5"
        style={{ minHeight: "1000px" }}
      >
        {/* header */}
        <div className="flex justify-between items-start gap-5">
          <img src={company.logoDataUrl || defaultLogo} alt="logo" className="h-[62px] object-contain" />
          <div className="text-right">
            <div className="text-[24px] font-bold text-[#1ba64b] mb-1">Pro Forma Invoice</div>
            <div className="text-[11px] font-bold text-[#1ba64b] leading-[1.55]">
              DATE : <span>{doc.date}</span>
              <br />
              {doc.validUntil && (
                <>
                  DATE OF EXPIRY: <span>{doc.validUntil}</span>
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
              {doc.sourceNumber && <>Buyer's Order No: <span>{doc.sourceNumber}</span></>}
            </div>
          </div>
        </div>

        {/* company block */}
        <div className="mt-3 text-xs leading-[1.45]">
          <div className="font-bold text-[13px]">{company.companyName}</div>
          <div>{company.address}</div>
          <div>Phone No- {company.phone}</div>
          <div>Mail- {company.email}</div>
          <div>GST No- {company.gst}</div>
        </div>

        {/* shipment information */}
        <div className="font-bold text-[12.5px] mt-3">SHIPMENT INFORMATION</div>
        <div className="flex gap-[30px] mt-1">
          <div className="w-1/2">
            <div className="font-bold text-xs border-b border-black/40 pb-0.5 mb-1">BILL TO( Buyer)</div>
            <div className="text-[11.5px] leading-[1.5]">
              <div className="font-semibold">{customer.name}</div>
              <div>{customer.address}</div>
              {customer.phone && <div>Ph: {customer.phone}</div>}
              {customer.gst && <div>GST No- {customer.gst}</div>}
            </div>
          </div>
          <div className="w-1/2">
            <div className="font-bold text-xs border-b border-black/40 pb-0.5 mb-1">SHIP TO( Consignee)</div>
            <div className="text-[11.5px] leading-[1.5]">
              <div className="font-semibold">{customer.name}</div>
              <div>{customer.address}</div>
              {customer.phone && <div>Ph: {customer.phone}</div>}
              {customer.gst && <div>GST No- {customer.gst}</div>}
            </div>
          </div>
        </div>

        {/* items table */}
        <table className="w-full mt-3.5 text-xs border-collapse">
          <thead>
            <tr className="bg-[#1ba64b] text-white">
              <th className="border border-[#1ba64b] px-1.5 py-1.5 w-8">S.No</th>
              <th className="border border-[#1ba64b] px-1.5 py-1.5 text-left">MATERIALS</th>
              <th className="border border-[#1ba64b] px-1.5 py-1.5">MAKE</th>
              <th className="border border-[#1ba64b] px-1.5 py-1.5">HSN</th>
              <th className="border border-[#1ba64b] px-1.5 py-1.5">QTY/ charges</th>
              <th className="border border-[#1ba64b] px-1.5 py-1.5">RATE</th>
              <th className="border border-[#1ba64b] px-1.5 py-1.5">GST</th>
              <th className="border border-[#1ba64b] px-1.5 py-1.5 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td className="border border-[#ccc] px-1.5 py-1 text-center">{i + 1}</td>
                <td className="border border-[#ccc] px-1.5 py-1">{it.description}</td>
                <td className="border border-[#ccc] px-1.5 py-1 text-center">{it.make || "-"}</td>
                <td className="border border-[#ccc] px-1.5 py-1 text-center">{it.hsn}</td>
                <td className="border border-[#ccc] px-1.5 py-1 text-center">{it.qty}</td>
                <td className="border border-[#ccc] px-1.5 py-1 text-center">{Number(it.rate).toFixed(2)}</td>
                <td className="border border-[#ccc] px-1.5 py-1 text-center">{it.gstRate ?? doc.gstRate}%</td>
                <td className="border border-[#ccc] px-1.5 py-1 text-right whitespace-nowrap">
                  {formatINR(Number(it.qty) * Number(it.rate) * (1 + (it.gstRate ?? doc.gstRate) / 100))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* summary */}
        <div className="flex justify-between mt-3.5 gap-6">
          <div className="text-xs leading-[1.6] max-w-[480px]">
            <div>
              <span className="font-bold">Amount Chargeable(in words)</span>
              <br />
              {doc.amountInWords}
            </div>
            <div className="mt-2.5 text-[11.5px] leading-[1.55]">
              <div>
                <span className="font-bold">Company's PAN:</span> {company.pan}
              </div>
              <div className="font-bold mt-1.5">Company's Bank Details:</div>
              <div>BANK NAME: {company.bankName}</div>
              <div>A/C NO: {company.accountNo}</div>
              <div>BRANCH &amp; IFS Code: {company.branchIfsc}</div>
            </div>
          </div>
          <div className="w-[280px] shrink-0">
            <div className="flex justify-between text-[12.5px] px-1 py-0.5">
              <span>Sub Total:</span>
              <span>{formatINR(doc.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[12.5px] px-1 py-0.5">
              <span>GST {doc.gstRate}%</span>
              <span>{formatINR(doc.gst)}</span>
            </div>
            <div className="flex justify-between items-center bg-[#1ba64b] text-white px-3.5 py-3 font-bold text-base mt-2">
              <span>TOTAL</span>
              <span>{formatINR(doc.total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#d9d9d9] text-[11.5px] px-2.5 py-1.5 mt-4">
          We declare that this invoice shows the actual price of the goods described and that all particulars are true and
          correct.
        </div>

        <div className="flex justify-end mt-2.5">
          <img src={company.stampDataUrl || defaultStamp} alt="stamp and signature" className="h-16 object-contain" />
        </div>

        <div className="bg-[#d9d9d9] flex justify-between items-center px-4 py-2.5 mt-2 text-xs">
          <div>This is a Computer Generated Invoice</div>
          <div className="text-right">
            <div className="font-bold text-[13.5px]">{company.companyName}</div>
            <div className="text-[11px]">Authorised Signatory</div>
          </div>
        </div>
      </div>
    );
  }

  // ---- invoice (default) ----
  return (
    <div
      ref={ref}
      className="bg-white text-ink w-[794px] font-body border-[3px] border-[#1ba64b] rounded-[6px] px-7 pt-5"
      style={{ minHeight: "1000px" }}
    >
      {/* header */}
      <div className="flex justify-between items-start">
        <img src={company.logoDataUrl || defaultLogo} alt="logo" className="h-[56px] object-contain" />
        <div className="text-[30px] font-bold text-[#1ba64b] tracking-wide">INVOICE</div>
      </div>

      <div className="flex justify-between mt-2 gap-5">
        <div className="text-xs leading-[1.45]">
          <div className="font-bold text-[13px]">{company.companyName}</div>
          <div>{company.address}</div>
          <div>Phone No- {company.phone}</div>
          <div>Mail- {company.email}</div>
          <div>GST No- {company.gst}</div>
        </div>

        <table className="text-xs border-collapse h-fit shrink-0">
          <tbody>
            <tr>
              <td className="px-2.5 py-0.5 border border-black/70 bg-[#fafafa] font-bold whitespace-nowrap">DATE</td>
              <td className="px-2.5 py-0.5 border border-black/70">{doc.date}</td>
            </tr>
            <tr>
              <td className="px-2.5 py-0.5 border border-black/70 bg-[#fafafa] font-bold whitespace-nowrap">INVOICE #</td>
              <td className="px-2.5 py-0.5 border border-black/70">{doc.number}</td>
            </tr>
            {customer.customerId && (
              <tr>
                <td className="px-2.5 py-0.5 border border-black/70 bg-[#fafafa] font-bold whitespace-nowrap">CUSTOMER ID</td>
                <td className="px-2.5 py-0.5 border border-black/70">{customer.customerId}</td>
              </tr>
            )}
            {doc.dueDate && (
              <tr>
                <td className="px-2.5 py-0.5 border border-black/70 bg-[#fafafa] font-bold whitespace-nowrap">DUE DATE</td>
                <td className="px-2.5 py-0.5 border border-black/70">{doc.dueDate}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1ba64b] text-white font-bold text-xs px-2 py-0.5 mt-3">BILL TO</div>
      <div className="text-xs leading-[1.45] pt-1">
        <div className="font-bold">{customer.name}</div>
        <div>{customer.address}</div>
        {customer.phone && <div>Ph: {customer.phone}</div>}
        {customer.gst && <div>GST NO- {customer.gst}</div>}
      </div>

      <table className="w-full mt-3 text-xs border-collapse">
        <thead>
          <tr className="bg-[#1ba64b] text-white">
            <th className="border border-[#1ba64b] px-1.5 py-1.5 w-8">S.No</th>
            <th className="border border-[#1ba64b] px-1.5 py-1.5 text-left">DESCRIPTION</th>
            <th className="border border-[#1ba64b] px-1.5 py-1.5">HSN code</th>
            <th className="border border-[#1ba64b] px-1.5 py-1.5">Brand</th>
            <th className="border border-[#1ba64b] px-1.5 py-1.5">QTY</th>
            <th className="border border-[#1ba64b] px-1.5 py-1.5">RATE</th>
            <th className="border border-[#1ba64b] px-1.5 py-1.5">GST</th>
            <th className="border border-[#1ba64b] px-1.5 py-1.5 text-right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className={i % 2 ? "bg-[#f2f2f2]" : ""}>
              <td className="border border-[#ddd] px-1.5 py-1 text-center">{i + 1}</td>
              <td className="border border-[#ddd] px-1.5 py-1">{it.description}</td>
              <td className="border border-[#ddd] px-1.5 py-1 text-center">{it.hsn}</td>
              <td className="border border-[#ddd] px-1.5 py-1 text-center">{it.make || it.unit || "Nos"}</td>
              <td className="border border-[#ddd] px-1.5 py-1 text-center">{it.qty}</td>
              <td className="border border-[#ddd] px-1.5 py-1 text-center">{Number(it.rate).toFixed(2)}</td>
              <td className="border border-[#ddd] px-1.5 py-1 text-center">{it.gstRate ?? doc.gstRate}%</td>
              <td className="border border-[#ddd] px-1.5 py-1 text-right whitespace-nowrap">
                {formatINR(Number(it.qty) * Number(it.rate) * (1 + (it.gstRate ?? doc.gstRate) / 100))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-end mt-1 pt-2.5">
        <div className="text-xs leading-[1.6] max-w-[440px]">
          <div className="font-bold">Amount Chargeable (in words)</div>
          <div>{doc.amountInWords}</div>
        </div>
        <div className="w-[260px] shrink-0">
          <div className="flex justify-between bg-[#dce8f0] px-2.5 py-1 text-[12.5px] font-bold mb-0.5">
            <span>Sub Total:</span>
            <span>{formatINR(doc.subtotal)}</span>
          </div>
          <div className="flex justify-between bg-[#dce8f0] px-2.5 py-1 text-[12.5px] font-bold mb-0.5">
            <span>GST {doc.gstRate}%:</span>
            <span>{formatINR(doc.gst)}</span>
          </div>
          <div className="flex justify-between bg-[#1ba64b] text-white px-2.5 py-1 text-[15px] font-bold">
            <span>TOTAL</span>
            <span>{formatINR(doc.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4.5">
        <div className="text-center w-[220px]">
          <img src={company.stampDataUrl || defaultStamp} alt="stamp and signature" className="h-16 object-contain mx-auto mb-1.5" />
          <div className="text-[11.5px] leading-[1.4]">
            Make all checks payable to
            <br />
            <span className="font-bold">{company.companyName}</span>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-[#1ba64b] mt-4 pt-2.5 flex justify-between items-center">
        <div className="text-[11.5px] font-bold">
          [{(company.emailSignature || "").split("\n")[1] || company.email}, {company.phone}, {company.email}]
        </div>
        <div className="italic font-bold text-[13px]">Thank You For Your Business!</div>
      </div>

      <div className="text-center text-[10.5px] text-black/60 py-2.5">This is Computer Generated Invoice</div>
    </div>
  );
});

export default DocumentTemplate;
