import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Renders a DOM node to a PDF. Page breaks are placed at the boundary
// between the node's direct-child sections (header, company block, item
// table, bank box, etc.) rather than at a fixed pixel interval — this is
// what stops a box (e.g. the bank details box) from being sliced in half
// across a page break. If the whole document fits on one page (the normal
// case for a short quotation/invoice), it stays on one page; only long
// documents (lots of line items) spill onto a 2nd/3rd page, and the split
// always lands in the gap between two sections.
async function renderPagePlacements(node) {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Map each direct child's DOM offsetTop (unscaled CSS px) to the same pt
  // scale as imgHeight, so we get a list of "safe" break points that never
  // fall inside a section.
  const domHeight = node.scrollHeight || 1;
  const ptPerPx = imgHeight / domHeight;
  const sectionBreaks = Array.from(node.children)
    .map((child) => child.offsetTop * ptPerPx)
    .filter((y) => y > 0 && y < imgHeight)
    .sort((a, b) => a - b);

  const placements = [];
  let current = 0;
  while (current < imgHeight - 1) {
    const naiveEnd = current + pageHeight;
    let end;
    if (naiveEnd >= imgHeight - 1) {
      end = imgHeight;
    } else {
      // Prefer the latest section boundary that still fits on this page and
      // leaves at least 55% of a page filled (avoids near-empty pages).
      const candidate = sectionBreaks
        .filter((y) => y > current + pageHeight * 0.55 && y <= naiveEnd)
        .pop();
      end = candidate || naiveEnd;
    }
    placements.push({ position: -current });
    current = end;
  }

  return { pdf, imgData, imgWidth, imgHeight, pageWidth, pageHeight, placements };
}

// Renders a DOM node (the DocumentTemplate/QuotationTemplate) to a PDF and
// triggers a browser download.
export async function downloadNodeAsPdf(node, filename) {
  const { pdf, imgData, imgWidth, imgHeight, placements } = await renderPagePlacements(node);

  placements.forEach((p, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, p.position, imgWidth, imgHeight);
  });

  pdf.save(filename);
  return true;
}

// Same rendering, but returns base64 — used to email the PDF as an attachment.
export async function nodeToPdfBase64(node) {
  const { pdf, imgData, imgWidth, imgHeight, placements } = await renderPagePlacements(node);

  placements.forEach((p, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, p.position, imgWidth, imgHeight);
  });

  const dataUri = pdf.output("datauristring");
  return dataUri.split(",")[1]; // strip the "data:application/pdf;base64," prefix
}