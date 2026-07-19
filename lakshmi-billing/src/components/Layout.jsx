import React from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  FileCheck2,
  ReceiptText,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { logout } from "../lib/auth";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "customers", label: "Customers", icon: Users },
  { key: "products", label: "Products", icon: Package },
  { key: "quotations", label: "Quotations", icon: FileText },
  { key: "proformas", label: "Proforma Invoices", icon: FileCheck2 },
  { key: "invoices", label: "Invoices", icon: ReceiptText },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout({ page, setPage, onLogout, children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-white border-r border-brand-100 flex flex-col">
        <div className="px-5 py-6 flex items-center gap-2 border-b border-brand-100">
          <div className="h-10 w-10 rounded-xl bg-brand-500 text-white grid place-items-center font-display font-bold">
            LE
          </div>
          <div>
            <div className="font-display font-bold leading-tight text-sm">Lakshmi Engineering</div>
            <div className="text-[11px] text-brand-600 font-medium">Billing Studio</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-brand-500 text-white shadow-pop"
                    : "text-ink/70 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-brand-100">
          <button
            onClick={() => {
              logout();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
          >
            <LogOut size={17} />
            Log out
          </button>
          <p className="text-[10px] text-ink/40 px-3 mt-2">Free local version — data stored on this device only.</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
