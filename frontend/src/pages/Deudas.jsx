import { useState, useEffect } from "react";
import { debtsApi } from "../api/debts";
import { accountsApi } from "../api/accounts";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Badge } from "../components/common/Badge";
import { formatCurrency, formatDate, todayISO } from "../utils/format";

const emptyForm = { counterpart_name: "", original_amount: "", type: "owe", date: todayISO(), description: "" };
const emptyPayment = { amount: "", date: todayISO(), notes: "", account_id: "" };

export default function Deudas() {
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
      setError("Todos los campos requeridos");
      return;
    }
    setSaving(true);
    try {
      await debtsApi.create({ ...form, original_amount: parseFloat(form.original_amount) });
      setModal(null);
      fetchDebts();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentForm.amount || !paymentForm.date) {
      setError("Monto y fecha son requeridos");
      return;
    }
    setSaving(true);
    try {
      await debtsApi.addPayment(selectedDebt.id, {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount),
        account_id: paymentForm.account_id ? parseInt(paymentForm.account_id) : null,
      });
      setModal(null);
      fetchDebts();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al registrar abono");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta deuda?")) return;
    await debtsApi.delete(id);
    fetchDebts();
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
                {debt.status === "paid" ? "Pagada" : isOwe ? "Le debo" : "Me debe"}
              </Badge>
            </div>
            {debt.description && <p className="text-xs text-gray-400 mt-0.5">{debt.description}</p>}
            <p className="text-xs text-gray-400">{formatDate(debt.date)}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${isOwe ? "text-red-500" : "text-emerald-600"}`}>{formatCurrency(debt.remaining_amount)}</p>
            <p className="text-xs text-gray-400">de {formatCurrency(debt.original_amount)}</p>
          </div>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full ${isOwe ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
        </div>
        {debt.status === "active" && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => openPayment(debt)}>Registrar abono</Button>
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Deudas</h2>
        <Button size="sm" onClick={openAdd}>+ Nueva deuda</Button>
      </div>

      {/* Summary */}
      {(owedByMe.length > 0 || owedToMe.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
            <p className="text-xs text-red-500 font-medium mb-1">Debo (total)</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalOwe)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4">
            <p className="text-xs text-emerald-600 font-medium mb-1">Me deben (total)</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalOwed)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {owedByMe.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Deudas que tengo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owedByMe.map((d) => <DebtCard key={d.id} debt={d} />)}
              </div>
            </div>
          )}
          {owedToMe.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Me deben</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owedToMe.map((d) => <DebtCard key={d.id} debt={d} />)}
              </div>
            </div>
          )}
          {paid.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Saldadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paid.map((d) => <DebtCard key={d.id} debt={d} />)}
              </div>
            </div>
          )}
          {debts.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-lg">Sin deudas registradas</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal === "add"} onClose={() => setModal(null)} title="Nueva deuda">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setForm({ ...form, type: "owe" })} className={`py-2 rounded-lg text-sm font-medium ${form.type === "owe" ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>Le debo</button>
            <button onClick={() => setForm({ ...form, type: "owed" })} className={`py-2 rounded-lg text-sm font-medium ${form.type === "owed" ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>Me debe</button>
          </div>
          <Input label={form.type === "owe" ? "¿A quién le debo?" : "¿Quién me debe?"} value={form.counterpart_name} onChange={(e) => setForm({ ...form, counterpart_name: e.target.value })} placeholder="Nombre..." />
          <Input label="Monto (COP)" type="number" value={form.original_amount} onChange={(e) => setForm({ ...form, original_amount: e.target.value })} placeholder="0" min="0" />
          <Input label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opcional..." />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === "payment"} onClose={() => setModal(null)} title={`Abono — ${selectedDebt?.counterpart_name}`}>
        <div className="space-y-4">
          {selectedDebt && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pendiente: <strong className="text-gray-900 dark:text-white">{formatCurrency(selectedDebt.remaining_amount)}</strong></p>
            </div>
          )}
          <Input label="Monto del abono (COP)" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0" min="0" />
          <Select label="Descontar de cuenta (opcional)" value={paymentForm.account_id} onChange={(e) => setPaymentForm({ ...paymentForm, account_id: e.target.value })}>
            <option value="">— Sin descontar de ninguna cuenta —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatCurrency(a.balance)})
              </option>
            ))}
          </Select>
          <Input label="Fecha" type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
          <Input label="Notas" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Opcional..." />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handlePayment} disabled={saving}>{saving ? "Registrando..." : "Registrar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
