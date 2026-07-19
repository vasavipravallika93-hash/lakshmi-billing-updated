import React, { useEffect, useState } from "react";
import { customersApi } from "../lib/customersApi";
import { uid } from "../lib/storage";
import { Plus, Pencil, Trash2, Search, X, Loader2 } from "lucide-react";

const empty = { name: "", contactPerson: "", phone: "", email: "", gst: "", address: "", state: "", country: "India" };

export default function Customers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setItems(await customersApi.list());
    } catch (err) {
      setError(err.message || "Couldn't load customers from Supabase.");
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm({ ...empty, id: uid("cust"), customerId: `LAK/CUST/${String(items.length + 1).padStart(3, "0")}` });
  }
  function openEdit(c) {
    setForm({ ...c });
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await customersApi.save({ ...form, createdDate: form.createdDate || new Date().toISOString().slice(0, 10) });
      setForm(null);
      await refresh();
    } catch (err) {
      alert("Couldn't save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function del(id) {
    if (!confirm("Delete this customer?")) return;
    try {
      await customersApi.remove(id);
      await refresh();
    } catch (err) {
      alert("Couldn't delete: " + err.message);
    }
  }

  const filtered = items.filter((c) =>
    [c.name, c.phone, c.gst, c.customerId].join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Customers</h1>
          <p className="text-ink/50 text-sm">{items.length} stored in Supabase</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-600"
        >
          <Plus size={16} /> New Customer
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg p-3">
          {error} — check <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code> in your{" "}
          <code>.env</code> (see <code>supabase/SETUP.md</code>).
        </div>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, GST…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-brand-700 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Customer ID</th>
              <th className="text-left px-4 py-3">Company</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">GST</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/40">
                  <Loader2 size={18} className="animate-spin inline mr-2" /> Loading…
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((c) => (
                <tr key={c.id} className="border-t border-ink/5 hover:bg-brand-50/40">
                  <td className="px-4 py-3 text-ink/60">{c.customerId}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.contactPerson}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.gst}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(c)} className="text-brand-600 hover:text-brand-700">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => del(c.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/40">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 grid place-items-center p-4">
          <form onSubmit={save} className="bg-white rounded-xl2 shadow-pop w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">{items.find((i) => i.id === form.id) ? "Edit" : "New"} Customer</h3>
              <button type="button" onClick={() => setForm(null)}>
                <X size={18} className="text-ink/40" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required full />
              <Field label="Contact Person" value={form.contactPerson} onChange={(v) => setForm({ ...form, contactPerson: v })} />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="GST Number" value={form.gst} onChange={(v) => setForm({ ...form, gst: v })} />
              <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} full textarea />
            </div>
            <button
              disabled={saving}
              className="w-full mt-4 py-2.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Customer"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, full, textarea }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs font-semibold text-ink/60">{label}</label>
      {textarea ? (
        <textarea
          required={required}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
          rows={2}
        />
      ) : (
        <input
          required={required}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
        />
      )}
    </div>
  );
}
