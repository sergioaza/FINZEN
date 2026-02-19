const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount) {
  return formatter.format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateInput(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
