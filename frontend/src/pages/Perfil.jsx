import { useState } from "react";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";
import { Select } from "../components/common/Input";
import { LANGUAGES, COUNTRIES, CURRENCIES, COUNTRY_CURRENCY_MAP } from "../utils/locale";

export default function Perfil() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    locale: user?.locale || "es",
    country: user?.country || "",
    currency: user?.currency || "COP",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleCountryChange = (e) => {
    const country = e.target.value;
    const suggestedCurrency = COUNTRY_CURRENCY_MAP[country] || form.currency;
    setForm({ ...form, country, currency: suggestedCurrency });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError("");
    try {
      const updated = await authApi.updatePreferences(form);
      updateUser(updated);
      setSuccess(true);
    } catch {
      setError(t("profile.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("profile.title")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("profile.subtitle")}</p>
      </div>

      {/* Cuenta */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("profile.account")}</h3>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("profile.name")}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("profile.email")}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
        </div>
      </div>

      {/* Preferencias */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("profile.preferences")}</h3>

        <Select
          label={t("profile.language")}
          value={form.locale}
          onChange={(e) => setForm({ ...form, locale: e.target.value })}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </Select>

        <Select
          label={t("profile.country")}
          value={form.country}
          onChange={handleCountryChange}
        >
          <option value="">—</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>

        <Select
          label={t("profile.currency")}
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>

        {success && <p className="text-emerald-600 dark:text-emerald-400 text-sm">{t("profile.success")}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? t("profile.saving") : t("profile.save")}
        </Button>
      </div>
    </div>
  );
}
