// -----------------------------------------------------------------------
// Local-only "database". Everything lives in the browser's localStorage.
// Nothing is sent to any server or third-party database — this keeps the
// app 100% free to run and fully private to the one business owner using it.
// -----------------------------------------------------------------------

const KEYS = {
  customers: "le_customers",
  products: "le_products",
  quotations: "le_quotations",
  proformas: "le_proformas",
  invoices: "le_invoices",
  settings: "le_settings",
  counters: "le_counters",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export const DEFAULT_SETTINGS = {
  companyName: "LAKSHMI ENGINEERING",
  tagline: "HVAC SYSTEM",
  address: "No-10, Sai Avenue, Periyar street, Madabakkam, Gudvancherry, Kancheepuram DT., Tamilnadu, Chennai, 603202.",
  phone: "9080154987",
  email: "pravallika@lakshmienginerring.com",
  gst: "33FYIPP9300R1ZP",
  pan: "FYIPP9300R",
  bankName: "BANK OF BARODA",
  accountNo: "53030200001511",
  branchIfsc: "Nandhivaram - Guduvancheri & BARB0NANDHI",
  quotationPrefix: "LAK/ENG/",
  invoicePrefix: "LAK/ENG/",
  proformaPrefix: "LAK/ENG/",
  nextNumberSeed: 2033,
  emailSignature: "Thank You For Your Business!\nLAKSHMI ENGINEERING",
  gstRate: 18,
  logoDataUrl: "",
  stampDataUrl: "",
  // Optional Google Apps Script backend for email + daily reminders.
  // See google-apps-script/SETUP.md — the app works fine without this set.
  appsScriptUrl: "",
  appsScriptSecret: "",
  autoEmailEnabled: false,

  // Default Terms & Conditions per quotation type — editable by the admin
  // in Settings, pre-filled onto every new quotation of that type (and
  // still editable per-document before generating).
  quotationTermsProduct: {
    paymentTerms: "100% Full payment along with PO.",
    deliveryTime: "7-15 Days",
    taxes: "Free Delivery",
    packingForwarding: "Free Delivery",
    freightTransportation: "Free Delivery",
    offerValidity: "7 days",
    notes:
      "1.The following details should be clearly mentioned in PO/WO.\n" +
      "2.Delivery address, contact person & Phone number, GST as mentioned above.\n" +
      "3. Loading & unloading of materials at site is in your Scope.\n" +
      "4. Any additional items supplied beyond those mentioned in the above quotation shall be treated as non-returnable and non-refundable.\n" +
      "5.Rates are based on current wholesale trading prices and valid for 48 hours only. If no confirmation within 48 hours, rates may change as per market fluctuations.\n" +
      "6.Free delivery is applicable for consignments within 5 kilometers from our office/warehouse.",
  },
  quotationTermsServiceBreakdown: {
    workBreakup:
      "We will carry out the work described above using suitable tools, chemicals, and materials.\n" +
      "If any leakage, damage, or issue occurs during the process due to a pre-existing/weak/aged condition, the same shall not be considered under vendor responsibility.",
  },
  quotationTermsServiceNumbered: {
    list:
      "1.Visiting charges are included in the above-mentioned service charges.\n" +
      "2.Any additional work or materials required will be charged separately.\n" +
      "3.Payment terms: 100% full payment along with PO.",
  },
};

// ---- generic CRUD helpers ----
function list(key) {
  return read(key, []);
}
function saveAll(key, items) {
  return write(key, items);
}
function upsert(key, item) {
  const items = list(key);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.unshift(item);
  saveAll(key, items);
  return item;
}
function remove(key, id) {
  const items = list(key).filter((i) => i.id !== id);
  saveAll(key, items);
}

export const db = {
  // customers
  getCustomers: () => list(KEYS.customers),
  saveCustomer: (c) => upsert(KEYS.customers, c),
  deleteCustomer: (id) => remove(KEYS.customers, id),

  // products
  getProducts: () => list(KEYS.products),
  saveProduct: (p) => upsert(KEYS.products, p),
  deleteProduct: (id) => remove(KEYS.products, id),

  // quotations
  getQuotations: () => list(KEYS.quotations),
  saveQuotation: (q) => upsert(KEYS.quotations, q),
  deleteQuotation: (id) => remove(KEYS.quotations, id),

  // proformas
  getProformas: () => list(KEYS.proformas),
  saveProforma: (p) => upsert(KEYS.proformas, p),
  deleteProforma: (id) => remove(KEYS.proformas, id),

  // invoices
  getInvoices: () => list(KEYS.invoices),
  saveInvoice: (i) => upsert(KEYS.invoices, i),
  deleteInvoice: (id) => remove(KEYS.invoices, id),

  // settings
  getSettings: () => {
    const stored = read(KEYS.settings, {});
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      quotationTermsProduct: { ...DEFAULT_SETTINGS.quotationTermsProduct, ...(stored.quotationTermsProduct || {}) },
      quotationTermsServiceBreakdown: {
        ...DEFAULT_SETTINGS.quotationTermsServiceBreakdown,
        ...(stored.quotationTermsServiceBreakdown || {}),
      },
      quotationTermsServiceNumbered: {
        ...DEFAULT_SETTINGS.quotationTermsServiceNumbered,
        ...(stored.quotationTermsServiceNumbered || {}),
      },
    };
  },
  saveSettings: (s) => write(KEYS.settings, { ...DEFAULT_SETTINGS, ...s }),

  // document numbering — sequential, prefixed, stored locally
  nextDocNumber: (type) => {
    const counters = read(KEYS.counters, {});
    const settings = read(KEYS.settings, DEFAULT_SETTINGS);
    const seed = settings.nextNumberSeed || 2033;
    const current = counters[type] ?? seed;
    counters[type] = current + 1;
    write(KEYS.counters, counters);
    const prefixMap = {
      quotation: settings.quotationPrefix,
      proforma: settings.proformaPrefix,
      invoice: settings.invoicePrefix,
    };
    return `${prefixMap[type] || "LAK/ENG/"}${current}`;
  },

  // wipe everything (used by Settings "reset local data")
  resetAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },

  // export / import full local dataset as JSON (manual backup, since there's no cloud DB)
  exportAll: () => {
    const dump = {};
    Object.entries(KEYS).forEach(([name, key]) => {
      dump[name] = read(key, name === "settings" ? DEFAULT_SETTINGS : name === "counters" ? {} : []);
    });
    return dump;
  },
  importAll: (dump) => {
    Object.entries(KEYS).forEach(([name, key]) => {
      if (dump[name] !== undefined) write(key, dump[name]);
    });
  },

  // Replace local customers/products/quotations/proformas/invoices with
  // whatever the connected Google Sheet has (used by Settings > Restore
  // from Cloud, e.g. when setting up a new device).
  hydrateFromCloud: (dump) => {
    if (dump.customers) saveAll(KEYS.customers, dump.customers);
    if (dump.products) saveAll(KEYS.products, dump.products);
    if (dump.quotations) saveAll(KEYS.quotations, dump.quotations);
    if (dump.proformas) saveAll(KEYS.proformas, dump.proformas);
    if (dump.invoices) saveAll(KEYS.invoices, dump.invoices);
  },
};

export function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function calcTotals(items, gstRate) {
  const subtotal = items.reduce((s, it) => s + Number(it.qty) * Number(it.rate), 0);
  const gst = (subtotal * Number(gstRate)) / 100;
  return { subtotal, gst, total: subtotal + gst };
}

// Amount-in-words (Indian numbering: lakh/crore), rupees + paise
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? " " + ONES[o] : ""}`;
}
function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (h) out += `${ONES[h]} Hundred${rest ? " " : ""}`;
  if (rest) out += twoDigits(rest);
  return out.trim();
}

export function numberToWords(num) {
  num = Math.round(num);
  if (num === 0) return "Zero";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  let parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ").trim();
}

export function amountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = `Rupees ${numberToWords(rupees)} Only`;
  if (paise) words = `Rupees ${numberToWords(rupees)} and Paise ${numberToWords(paise)} Only`;
  return `INR - ${words}`;
}

export function formatDateDMY(value) {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!m) return value;
  const [, y, mo, d] = m;
  return `${d}-${mo}-${y}`;
}

export function formatINR(n) {
  return `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}