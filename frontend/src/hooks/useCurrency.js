import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { formatCurrency, getCurrencyLocale } from "../utils/format";

export function useCurrency() {
  const { user } = useContext(AuthContext);
  const currency = user?.currency || "COP";
  const locale = getCurrencyLocale(currency);
  return (amount) => formatCurrency(amount, currency, locale);
}
