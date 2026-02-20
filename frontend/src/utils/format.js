const CURRENCY_LOCALE_MAP = {
  COP: "es-CO",
  USD: "en-US",
  EUR: "es-ES",
  MXN: "es-MX",
  ARS: "es-AR",
  BRL: "pt-BR",
  CLP: "es-CL",
  PEN: "es-PE",
  UYU: "es-UY",
  GBP: "en-GB",
};

export function getCurrencyLocale(currency) {
  return CURRENCY_LOCALE_MAP[currency] || "es-CO";
}

// Formatter cache para evitar recrear Intl.NumberFormat en cada render
const formatterCache = {};

function getFormatter(currency, locale) {
  const key = `${currency}:${locale}`;
  if (!formatterCache[key]) {
    formatterCache[key] = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return formatterCache[key];
}

export function formatCurrency(amount, currency = "COP", locale = "es-CO") {
  return getFormatter(currency, locale).format(amount);
}

export function formatDate(dateStr, locale = "es-CO") {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateInput(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
