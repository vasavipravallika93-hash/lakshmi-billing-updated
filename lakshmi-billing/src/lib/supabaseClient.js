import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase isn't configured yet — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env. " +
      "See supabase/SETUP.md."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", key || "placeholder");
export const supabaseConfigured = !!(url && key);
