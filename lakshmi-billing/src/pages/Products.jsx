import React, { useEffect, useState } from "react";
import { productsApi } from "../lib/productsApi";
import { uid, formatINR } from "../lib/storage";
import { Plus, Pencil, Trash2, Search, X, Loader2 } from "lucide-react";

const empty = { name: "", hsn: "", gst: 18, unit: "Nos", rate: 0, brand: "", stock: 0 };

export default function Products() {
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
      setItems(await productsApi.list());
    } catch (err) {
      setError(err.message || "Couldn't load products from Supabase.");
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm({ ...empty, id: uid("prod") });
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await productsApi.save(form);
      setForm(null);
      await refresh();
    } catch (err) {
      alert("Couldn't save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function del(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await productsApi.remove(id);
      await refresh();
    } catch (err) {
      alert("Couldn't delete: " + err.message);
    }
  }

  const filtered = items.filter((p) => [p.name, p.hsn, p.brand].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Products</h1>
          <p className="text-ink/50 text-sm">{items.length} stored in Supabase</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-600"
        >
          <Plus size={16} /> New Product
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
          placeholder="Search by name, HSN, brand…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-ink/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-brand-700 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">HSN</th>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-left px-4 py-3">Unit</th>
              <th className="text-right px-4 py-3">Rate</th>
              <th className="text-right px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink/40">
                  <Loader2 size={18} className="animate-spin inline mr-2" /> Loading…
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-ink/5 hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.hsn}</td>
                  <td className="px-4 py-3">{p.brand}</td>
                  <td className="px-4 py-3">{p.unit}</td>
                  <td className="px-4 py-3 text-right">{formatINR(p.rate)}</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setForm(p)} className="text-brand-600 hover:text-brand-700">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => del(p.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink/40">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 grid place-items-center p-4">
          <form onSubmit={save} className="bg-white rounded-xl2 shadow-pop w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">{items.find((i) => i.id === form.id) ? "Edit" : "New"} Product</h3>
              <button type="button" onClick={() => setForm(null)}>
                <X size={18} className="text-ink/40" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Product Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} full required />
              <Field label="HSN" value={form.hsn} onChange={(v) => setForm({ ...form, hsn: v })} />
              <Field label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
              <Field label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
              <Field label="GST %" type="number" value={form.gst} onChange={(v) => setForm({ ...form, gst: v })} />
              <Field label="Rate (₹)" type="number" value={form.rate} onChange={(v) => setForm({ ...form, rate: v })} required />
              <Field label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
            </div>
            <button
              disabled={saving}
              className="w-full mt-4 py-2.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Product"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, full, type = "text" }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs font-semibold text-ink/60">{label}</label>
      <input
        type={type}
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-ink/10 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
      />
    </div>
  );
}
