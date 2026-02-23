import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { debtsApi } from "../api/debts";
import { accountsApi } from "../api/accounts";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Badge } from "../components/common/Badge";
import { formatDate, todayISO } from "../utils/format";
import { useCurrency } from "../hooks/useCurrency";

const emptyForm = { counterpart_name: "", original_amount: "", type: "owe", date: todayISO(), description: "", origin: "lent", account_id: "" };
const emptyPayment = { amount: "", date: todayISO(), notes: "", account_id: "" };

export default function Deudas() {
  const { t } = useTranslation();
  const formatAmount = useCurrency();
  const [debts, setDebts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | "payment"
  const [form, setForm] = useState(emptyForm);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchDebts = async () => {
    setLoading(true);
    const [ds, accs] = await Promise.all([debtsApi.list(), accountsApi.list()]);
    setDebts(ds);
    setAccounts(accs);
    setLoading(false);
  };

  useEffect(() => { fetchDebts(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setError("");
    setModal("add");
  };

  const openPayment = (debt) => {
    setSelectedDebt(debt);
    setPaymentForm(emptyPayment);
    setError("");
    setModal("payment");
  };

  const handleSave = async () => {
    if (!form.counterpart_name || !form.original_amount || !form.date) {
      setError(t("debts.all_required"));
      return;
    }
    if (form.type === "owed" && form.origin === "lent" && !form.account_id) {
      setError(t("debts.select_account_error"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        counterpart_name: form.counterpart_name,
        original_amount: parseFloat(form.original_amount),
        type: form.type,
        date: form.date,
        description: form.description,
        ...(form.type === "owed" && form.origin === "lent" && form.account_id
          ? { account_id: parseInt(form.account_id) }
          : {}),
      };
      await debtsApi.create(payload);
      setModal(null);
      fetchDebts();
    } catch (err) {
      setError(err.response?.data?.detail || t("debts.save_error"));
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentForm.amount || !paymentForm.date) {
      setError(t("debts.payment_required"));
      return;
    }
    if (!paymentForm.account_id) {
      setError(t("debts.select_account_payment"));
      return;
    }
    setSaving(true);
    try {
      await debtsApi.addPayment(selectedDebt.id, {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount),
        account_id: parseInt(paymentForm.account_id),
      });
      setModal(null);
      fetchDebts();
    } catch (err) {
      setError(err.response?.data?.detail || t("debts.payment_error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("debts.delete_confirm"))) return;
    try {
      await debtsApi.delete(id);
      fetchDebts();
    } catch (err) {
      alert(err.response?.data?.detail || t("debts.delete_error"));
    }
  };

  const owedByMe = debts.filter((d) => d.type === "owe" && d.status === "active");
  const owedToMe = debts.filter((d) => d.type === "owed" && d.status === "active");
  const paid = debts.filter((d) => d.status === "paid");

  const totalOwe = owedByMe.reduce((s, d) => s + d.remaining_amount, 0);
  const totalOwed = owedToMe.reduce((s, d) => s + d.remaining_amount, 0);

  function DebtCard({ debt }) {
    const isOwe = debt.type === "owe";
    const pct = ((debt.original_amount - debt.remaining_amount) / debt.original_amount) * 100;
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 dark:text-white">{debt.counterpart_name}</h3>
              <Badge variant={debt.status === "paid" ? "income" : isOwe ? "expense" : "blue"}>
                {debt.status === "paid" ? t("debts.paid_badge") : isOwe ? t("debts.i_owe") : t("debts.owed_to_me")}
              </Badge>
            </div>
            {debt.description && <p className="text-xs text-gray-400 mt-0.5">{debt.description}</p>}
            <p className="text-xs text-gray-400">{formatDate(debt.date)}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${isOwe ? "text-red-500" : "text-emerald-600"}`}>{formatAmount(debt.remaining_amount)}</p>
            <p className="text-xs text-gray-400">{t("debts.of")} {formatAmount(debt.original_amount)}</p>
          </div>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full ${isOwe ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
        </div>
        {debt.status === "active" && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => openPayment(debt)}>{t("debts.register_payment")}</Button>
            <button onClick={() => handleDelete(debt.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("debts.title")}</h2>
        <Button size="sm" onClick={openAdd}>{t("debts.add")}</Button>
      </div>

      {/* Summary */}
      {(owedByMe.length > 0 || owedToMe.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
            <p className="text-xs text-red-500 font-medium mb-1">{t("debts.i_owe_total")}</p>
            <p className="text-xl font-bold text-red-600">{formatAmount(totalOwe)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4">
            <p className="text-xs text-emerald-600 font-medium mb-1">{t("debts.owed_to_me_total")}</p>
            <p className="text-xl font-bold text-emerald-600">{formatAmount(totalOwed)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {owedByMe.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t("debts.my_debts")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owedByMe.map((d) => <DebtCard key={d.id} debt={d} />)}
              </div>
            </div>
          )}
          {owedToMe.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t("debts.owed_to_me_section")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owedToMe.map((d) => <DebtCard key={d.id} debt={d} />)}
              </div>
            </div>
          )}
          {paid.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t("debts.settled")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paid.map((d) => <DebtCard key={d.id} debt={d} />)}
              </div>
            </div>
          )}
          {debts.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-lg">{t("debts.no_debts")}</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal === "add"} onClose={() => setModal(null)} title={t("debts.modal_title")}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setForm({ ...form, type: "owe", origin: "lent", account_id: "" })}
              className={`py-2 rounded-lg text-sm font-medium ${form.type === "owe" ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >{t("debts.i_owe")}</button>
            <button
              onClick={() => setForm({ ...form, type: "owed", origin: "lent", account_id: "" })}
              className={`py-2 rounded-lg text-sm font-medium ${form.type === "owed" ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >{t("debts.owed_to_me")}</button>
          </div>

          {form.type === "owed" && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t("debts.origin_question")}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setForm({ ...form, origin: "lent", account_id: "" })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium text-left ${form.origin === "lent" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                >
                  💸 {t("debts.lent_money")}
                </button>
                <button
                  onClick={() => setForm({ ...form, origin: "credit", account_id: "" })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium text-left ${form.origin === "credit" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                >
                  🧾 {t("debts.sale_service")}
                </button>
              </div>
            </div>
          )}

          <Input label={form.type === "owe" ? t("debts.who_do_i_owe") : t("debts.who_owes_me")} value={form.counterpart_name} onChange={(e) => setForm({ ...form, counterpart_name: e.target.value })} placeholder={t("debts.name_placeholder")} />
          <Input label={t("debts.amount")} type="number" value={form.original_amount} onChange={(e) => setForm({ ...form, original_amount: e.target.value })} placeholder="0" min="0" />
          <Input label={t("debts.date")} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />

          {form.type === "owed" && form.origin === "lent" && (
            <Select
              label={t("debts.deduct_account")}
              value={form.account_id}
              onChange={(e) => setForm({ ...form, account_id: e.target.value })}
            >
              <option value="">{t("debts.select_account")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatAmount(a.balance)})
                </option>
              ))}
            </Select>
          )}

          <Input label={t("debts.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("debts.optional_placeholder")} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>{t("common.cancel")}</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === "payment"} onClose={() => setModal(null)} title={`${t("debts.payment_modal_title")} — ${selectedDebt?.counterpart_name}`}>
        <div className="space-y-4">
          {selectedDebt && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("debts.pending")}: <strong className="text-gray-900 dark:text-white">{formatAmount(selectedDebt.remaining_amount)}</strong></p>
            </div>
          )}
          <Input label={t("debts.payment_amount")} type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0" min="0" />
          <Select
            label={selectedDebt?.type === "owe" ? t("debts.deduct_from_account") : t("debts.credit_to_account")}
            value={paymentForm.account_id}
            onChange={(e) => setPaymentForm({ ...paymentForm, account_id: e.target.value })}
          >
            <option value="">{t("debts.select_account")}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatAmount(a.balance)})
              </option>
            ))}
          </Select>
          <Input label={t("debts.date")} type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
          <Input label={t("debts.notes")} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder={t("debts.optional_placeholder")} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>{t("common.cancel")}</Button>
            <Button className="flex-1" onClick={handlePayment} disabled={saving}>{saving ? t("debts.registering") : t("debts.register_payment")}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
