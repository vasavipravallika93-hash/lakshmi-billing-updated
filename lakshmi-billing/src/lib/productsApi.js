import { supabase } from "./supabaseClient";

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    hsn: row.hsn,
    gst: row.gst,
    unit: row.unit,
    rate: row.rate,
    brand: row.brand,
    stock: row.stock,
  };
}

function toRow(p) {
  return {
    id: p.id,
    name: p.name,
    hsn: p.hsn,
    gst: p.gst,
    unit: p.unit,
    rate: p.rate,
    brand: p.brand,
    stock: p.stock,
  };
}

export const productsApi = {
  async list() {
    const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map(fromRow);
  },
  async save(product) {
    const { data, error } = await supabase.from("products").upsert(toRow(product)).select().single();
    if (error) throw error;
    return fromRow(data);
  },
  async remove(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },
};
