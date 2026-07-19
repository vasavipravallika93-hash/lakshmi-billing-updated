// Runs a completeness check on a document right after it's generated.
// This is a plain data check (not a rendered-pixel check) — fast, reliable,
// and works the same for Quotations, Proforma Invoices, and Invoices.

export function verifyDocument(doc, type) {
  const checks = [];

  const push = (label, pass) => checks.push({ label, pass: !!pass });

  push("Document number assigned", !!doc.number);
  push("Date present", !!doc.date);
  if (type === "invoice") push("Due date present", !!doc.dueDate);
  push("Customer selected", !!doc.customer && !!doc.customer.name);
  push("Customer GST / address present", !!doc.customer?.address);
  push("At least one line item", Array.isArray(doc.items) && doc.items.length > 0);
  push(
    "Every line item has description, qty and rate",
    (doc.items || []).every((it) => it.description && Number(it.qty) > 0 && Number(it.rate) >= 0)
  );
  push("Subtotal calculated", Number(doc.subtotal) > 0);
  push("GST calculated", Number(doc.gst) >= 0);
  push("Grand total calculated", Number(doc.total) > 0);
  push("Amount in words generated", !!doc.amountInWords);
  push("Company bank details present", !!doc.company?.accountNo);

  const passed = checks.filter((c) => c.pass).length;
  const complete = passed === checks.length;

  return { checks, passed, total: checks.length, complete };
}
