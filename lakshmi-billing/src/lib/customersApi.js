import { supabase } from "./supabaseClient";

function fromRow(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    gst: row.gst,
    address: row.address,
    state: row.state,
    country: row.country,
    createdDate: row.created_date,
  };
}

function toRow(c) {
  return {
    id: c.id,
    customer_id: c.customerId,
    name: c.name,
    contact_person: c.contactPerson,
    phone: c.phone,
    email: c.email,
    gst: c.gst,
    address: c.address,
    state: c.state,
    country: c.country,
    created_date: c.createdDate || null,
  };
}

export const customersApi = {
  async list() {
    const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map(fromRow);
  },
  async save(customer) {
    const { data, error } = await supabase.from("customers").upsert(toRow(customer)).select().single();
    if (error) throw error;
    return fromRow(data);
  },
  async remove(id) {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  },
};
