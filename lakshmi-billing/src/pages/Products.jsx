import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { productsApi } from "../lib/productsApi";
import { uid, formatINR } from "../lib/storage";
import { Plus, Pencil, Trash2, Search, X, Loader2, FileSpreadsheet } from "lucide-react";

const empty = { name: "", hsn: "", gst: 18, unit: "Nos", rate: 0, brand: "", stock: 0 };

export default function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileInputRef = useRef(null);

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

  // Inline-edit Brand / Unit / Rate directly from the table — click the
  // cell, type, and it saves on blur/Enter. Product Name and HSN stay
  // edit-via-modal (or come from the Excel import) since those are the
  // identifying fields.
  async function saveField(product, field, value) {
    const updated = { ...product, [field]: value };
    setItems((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    try {
      await productsApi.save(updated);
    } catch (err) {
      alert("Couldn't save: " + err.message);
      refresh();
    }
  }

  // --- Excel import: column A = product name, column B = HSN code.
  // Any extra columns are ignored. Brand/Unit/Rate/GST/Stock come in blank
  // (0 for numbers) and are then editable per-product on the Products page.
  async function handleExcelFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      // Skip a header row if the first row's first two cells look like
      // "Name"/"HSN" style labels rather than actual product data.
      const looksLikeHeader =
        rows.length > 0 &&
        /^\s*(product\s*)?name\s*$/i.test(String(rows[0][0] || "")) &&
        /^\s*hsn/i.test(String(rows[0][1] || ""));
      const dataRows = looksLikeHeader ? rows.slice(1) : rows;

      const newProducts = dataRows
        .map((row) => ({
          name: String(row[0] ?? "").trim(),
          hsn: String(row[1] ?? "").trim(),
        }))
        .filter((r) => r.name)
        .map((r) => ({ ...empty, id: uid("prod"), name: r.name, hsn: r.hsn }));

      if (newProducts.length === 0) {
        setImportMsg("No rows found — make sure column A is the product name and column B is the HSN code.");
      } else {
        await productsApi.saveMany(newProducts);
        setImportMsg(`Imported ${newProducts.length} product${newProducts.length === 1 ? "" : "s"}. Set Brand, Unit and Rate for each below.`);
        await refresh();
      }
    } catch (err) {
      setImportMsg("Import failed: " + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 bg-white border border-ink/10 text-ink px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-50 disabled:opacity-60"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Import from Excel
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-600"
          >
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      <p className="text-xs text-ink/40 mb-4 -mt-4">
        Excel import expects <strong>column A = product name</strong>, <strong>column B = HSN code</strong>. Brand, Unit and
        Rate are left blank for you to fill in per product afterwards.
      </p>

      {importMsg && (
        <div className="mb-4 text-sm bg-brand-50 text-brand-700 border border-brand-200 rounded-lg p-3">{importMsg}</div>
      )}

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
                  <td className="px-4 py-3">
                    <EditableCell value={p.brand} placeholder="Add brand…" onSave={(v) => saveField(p, "brand", v)} />
                  </td>
                  <td className="px-4 py-3">
                    <EditableCell value={p.unit} placeholder="Nos" onSave={(v) => saveField(p, "unit", v)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <EditableCell
                      value={p.rate}
                      type="number"
                      align="right"
                      placeholder="0"
                      onSave={(v) => saveField(p, "rate", Number(v) || 0)}
                      display={formatINR(p.rate)}
                    />
                  </td>
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

// Click-to-edit table cell used for Brand / Unit / Rate. Shows plain text
// until clicked, then becomes an input; saves on blur or Enter.
function EditableCell({ value, onSave, type = "text", placeholder, align = "left", display }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (!editing) {
    const isEmpty = value === "" || value === null || value === undefined || value === 0;
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`w-full text-${align} ${isEmpty && !display ? "text-ink/30 italic" : ""} hover:bg-brand-50/70 rounded px-1.5 py-0.5 -mx-1.5`}
        title="Click to edit"
      >
        {display ?? (isEmpty ? placeholder : value)}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") {
          setDraft(value ?? "");
          setEditing(false);
        }
      }}
      className={`w-full px-1.5 py-0.5 -mx-1.5 rounded border border-brand-400 focus:outline-none text-${align}`}
    />
  );
}
