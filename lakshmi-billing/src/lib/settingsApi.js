import { supabase } from "./supabaseClient";

// Company Settings (company details, ISO number, bank info, prefixes, etc.)
// stored as a single JSON blob in Supabase — one row, id="default". This
// mirrors the productsApi/customersApi pattern already used in this app,
// just without needing a dedicated column per field.
const ROW_ID = "default";

export const settingsApi = {
  async get() {
    const { data, error } = await supabase.from("company_settings").select("data").eq("id", ROW_ID).maybeSingle();
    if (error) throw error;
    return data?.data || null;
  },
  async save(settings) {
    const { error } = await supabase.from("company_settings").upsert({ id: ROW_ID, data: settings });
    if (error) throw error;
  },
};
