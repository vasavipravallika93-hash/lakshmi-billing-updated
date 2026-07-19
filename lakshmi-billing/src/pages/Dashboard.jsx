import React, { useEffect, useState } from "react";
import { db, formatINR } from "../lib/storage";
import { customersApi } from "../lib/customersApi";
import { productsApi } from "../lib/productsApi";
import { FileText, FileCheck2, ReceiptText, Users, Package, AlertCircle, TrendingUp } from "lucide-react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard({ setPage }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const quotations = db.getQuotations();
      const invoices = db.getInvoices();
      const proformas = db.getProformas();
      const today = todayStr();

      let customerCount = 0;
      let productCount = 0;
      try {
        const [customers, products] = await Promise.all([customersApi.list(), productsApi.list()]);
        customerCount = customers.length;
        productCount = products.length;
      } catch (err) {
        console.warn("Couldn't load Supabase counts:", err.message);
      }

      const todaysQuotations = quotations.filter((q) => q.date === today).length;
      const todaysInvoices = invoices.filter((i) => i.date === today).length;
      const pending = invoices.filter((i) => i.status !== "Paid");
      const pendingAmount = pending.reduce((s, i) => s + i.total, 0);
      const revenue = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0);

      const recent = [...quotations, ...proformas, ...invoices]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6);

      setData({ todaysQuotations, todaysInvoices, pending, pendingAmount, revenue, customerCount, productCount, recent });
    })();
  }, []);

  if (!data) return null;

  const cards = [
    { label: "Today's Quotations", value: data.todaysQuotations, icon: FileText, page: "quotations" },
    { label: "Today's Invoices", value: data.todaysInvoices, icon: ReceiptText, page: "invoices" },
    { label: "Pending Payments", value: `${data.pending.length} (${formatINR(data.pendingAmount)})`, icon: AlertCircle, page: "invoices" },
    { label: "Revenue Collected", value: formatINR(data.revenue), icon: TrendingUp, page: "invoices" },
    { label: "Customers", value: data.customerCount, icon: Users, page: "customers" },
    { label: "Products", value: data.productCount, icon: Package, page: "products" },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-1">Dashboard</h1>
      <p className="text-ink/50 text-sm mb-6">
        Quotations/Invoices are stored on this device; Customers & Products come from Supabase.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => setPage(c.page)}
              className="text-left bg-white rounded-xl2 shadow-card p-5 hover:shadow-pop transition"
            >
              <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center mb-3">
                <Icon size={17} />
              </div>
              <div className="text-xl font-display font-bold">{c.value}</div>
              <div className="text-xs text-ink/50">{c.label}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-5">
        <h3 className="font-display font-semibold mb-3">Recent Activity</h3>
        {data.recent.length === 0 && <p className="text-sm text-ink/40 py-6 text-center">Nothing generated yet.</p>}
        <ul className="space-y-2">
          {data.recent.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between text-sm border-b border-ink/5 pb-2 last:border-0">
              <span className="font-medium">{doc.number}</span>
              <span className="text-ink/50">{doc.customer?.name}</span>
              <span className="text-ink/50">{doc.date}</span>
              <span className="font-semibold text-brand-600">{formatINR(doc.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
