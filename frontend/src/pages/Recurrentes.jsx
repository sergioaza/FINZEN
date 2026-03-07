import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { recurringApi } from "../api/recurring";
import { accountsApi } from "../api/accounts";
import { categoriesApi } from "../api/categories";
import { debtsApi } from "../api/debts";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Badge } from "../components/common/Badge";
import { formatDate, todayISO } from "../utils/format";
import { useCurrency } from "../hooks/useCurrency";

const emptyForm = {
  account_id: "",
  category_id: "",
  name: "",
  amount: "",
  frequency: "monthly",
  day_of_charge: 1,
  next_date: todayISO(),
  debt_id: "",
};

export default function Recurrentes() {
  const { t } = useTranslation();
  const formatAmount = useCurrency();
  const [recurrents, setRecurrents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | "edit"
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(null);

  const FREQ_LABELS = {
    daily: t("recurring.freq_daily"),
    weekly: t("recurring.freq_weekly"),
    biweekly: t("recurring.freq_biweekly"),
    monthly: t("recurring.freq_monthly"),
    yearly: t("recurring.freq_yearly"),
  };

  const fetchAll = async () => {
    setLoading(true);
    const [rs, accs, cats, ds] = await Promise.all([
      recurringApi.list(),
      accountsApi.list(),
      categoriesApi.list(),
      debtsApi.list(),
    ]);
    setRecurrents(rs);
    setAccounts(accs);
    setCategories(cats.filter((c) => c.type === "expense"));
    setDebts(ds.filter((d) => d.type === "owe" && d.status === "active"));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setForm({ ...emptyForm, account_id: accounts[0]?.id || "" });
    setEditId(null);
    setError("");
    setModal("add");
  };

  const openEdit = (r) => {
    setForm({
      account_id: r.account_id,
      category_id: r.category_id || "",
      name: r.name,
      amount: r.amount,
      frequency: r.frequency,
      day_of_charge: r.day_of_charge,
      next_date: r.next_date,
      debt_id: r.debt_id || "",
    });
    setEditId(r.id);
    setError("");
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.account_id || !form.name || !form.amount || !form.next_date) {
      setError(t("recurring.all_required"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        day_of_charge: parseInt(form.day_of_charge),
        category_id: form.category_id || null,
        account_id: parseInt(form.account_id),
        debt_id: form.debt_id ? parseInt(form.debt_id) : null,
      };
      if (modal === "edit" && editId) {
        await recurringApi.update(editId, payload);
      } else {
        await recurringApi.create(payload);
      }
      setModal(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || t("recurring.save_error"));
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (id) => {
    setPaying(id);
    try {
      await recurringApi.pay(id);
      fetchAll();
    } finally {
      setPaying(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("recurring.delete_confirm"))) return;
    await recurringApi.delete(id);
    fetchAll();
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("recurring.title")}</h2>
        <Button size="sm" onClick={openAdd}>{t("recurring.add")}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : recurrents.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-lg">{t("recurring.no_recurring")}</p>
          <p className="text-sm mt-1">{t("recurring.no_recurring_sub")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurrents.map((r) => {
            const cat = categories.find((c) => c.id === r.category_id);
            const acc = accounts.find((a) => a.id === r.account_id);
            const linkedDebt = debts.find((d) => d.id === r.debt_id);
            const isDue = r.next_date <= today;
            return (
              <div key={r.id} className={`bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border ${isDue ? "border-amber-300 dark:border-amber-700" : "border-gray-100 dark:border-gray-800"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{r.name}</h3>
                      {isDue && <Badge variant="warning">{t("recurring.due_soon")}</Badge>}
                      {!r.is_active && <Badge>{t("recurring.inactive")}</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{acc?.name} · {FREQ_LABELS[r.frequency]}</p>
                    {cat && <p className="text-xs text-gray-400">{cat.name}</p>}
                    {linkedDebt && (
                      <p className="text-xs text-blue-500 mt-0.5">
                        {t("recurring.auto_payment_label")}: {linkedDebt.counterpart_name}
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-red-500">{formatAmount(r.amount)}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t("recurring.next")} {formatDate(r.next_date)}</p>
                <div className="flex gap-2">
                  {r.is_active && (
                    <Button size="sm" variant="success" onClick={() => handlePay(r.id)} disabled={paying === r.id}>
                      {paying === r.id ? "..." : t("recurring.pay")}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>{t("recurring.edit")}</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>{t("recurring.delete")}</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal !== null} onClose={() => setModal(null)} title={modal === "edit" ? t("recurring.modal_edit") : t("recurring.modal_add")}>
        <div className="space-y-4">
          <Input label={t("recurring.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Netflix, Gym..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("recurring.amount")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" min="0" />
            <Select label={t("recurring.frequency")} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("recurring.day_of_charge")} type="number" value={form.day_of_charge} onChange={(e) => setForm({ ...form, day_of_charge: e.target.value })} min="1" max="31" />
            <Input label={t("recurring.next_date")} type="date" value={form.next_date} onChange={(e) => setForm({ ...form, next_date: e.target.value })} />
          </div>
          <Select label={t("recurring.account")} value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
            <option value="">{t("recurring.select")}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Select label={t("recurring.category")} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">{t("recurring.no_category")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {debts.length > 0 && (
            <Select label={t("recurring.link_debt")} value={form.debt_id} onChange={(e) => setForm({ ...form, debt_id: e.target.value })}>
              <option value="">{t("recurring.no_debt_link")}</option>
              {debts.map((d) => <option key={d.id} value={d.id}>{d.counterpart_name} ({formatAmount(d.remaining_amount)})</option>)}
            </Select>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>{t("common.cancel")}</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
