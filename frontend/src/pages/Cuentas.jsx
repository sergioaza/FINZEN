import { useState, useEffect } from "react";
import { accountsApi } from "../api/accounts";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Badge } from "../components/common/Badge";
import { formatCurrency } from "../utils/format";

const ACCOUNT_TYPES = [
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
];

const SUBTYPES = {
  debit: [
    { value: "cash", label: "Efectivo" },
    { value: "savings", label: "Cuenta de Ahorros" },
    { value: "checking", label: "Cuenta Corriente" },
    { value: "digital", label: "Billetera Digital" },
  ],
  credit: [{ value: "credit_card", label: "Tarjeta de Crédito" }],
};

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"];

const SUBTYPE_LABELS = {
  cash: "Efectivo",
  savings: "Ahorros",
  checking: "Corriente",
  digital: "Digital",
  credit_card: "T. Crédito",
};

const emptyForm = { name: "", type: "debit", account_subtype: "savings", balance: "", color: "#3B82F6", credit_limit: "" };

export default function Cuentas() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAccounts = async () => {
    setLoading(true);
    const accs = await accountsApi.list();
    setAccounts(accs);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setError("");
    setModal(true);
  };

  const openEdit = (acc) => {
    setForm({ name: acc.name, type: acc.type, account_subtype: acc.account_subtype, balance: acc.balance, color: acc.color, credit_limit: acc.credit_limit ?? "" });
    setEditId(acc.id);
    setError("");
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { setError("El nombre es requerido"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        balance: parseFloat(form.balance) || 0,
        credit_limit: form.type === "credit" && form.credit_limit ? parseFloat(form.credit_limit) : null,
      };
      if (editId) {
        await accountsApi.update(editId, { name: payload.name, balance: payload.balance, color: payload.color, credit_limit: payload.credit_limit });
      } else {
        await accountsApi.create(payload);
      }
      setModal(false);
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta cuenta? Se eliminarán todas sus transacciones.")) return;
    await accountsApi.delete(id);
    fetchAccounts();
  };

  const updateType = (type) => setForm({ ...form, type, account_subtype: SUBTYPES[type][0].value });

  const debitAccounts = accounts.filter((a) => a.type === "debit");
  const creditAccounts = accounts.filter((a) => a.type === "credit");
  const totalAssets = debitAccounts.reduce((s, a) => s + a.balance, 0);
  const totalDebt = creditAccounts.reduce((s, a) => s + a.balance, 0);

  function AccountCard({ account }) {
    const isCredit = account.type === "credit";
    const hasLimit = isCredit && account.credit_limit != null && account.credit_limit > 0;
    const utilization = hasLimit ? Math.min((account.balance / account.credit_limit) * 100, 100) : 0;
    const available = hasLimit ? account.credit_limit - account.balance : null;
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: account.color }}>
              {account.name[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">{account.name}</h3>
              <Badge variant={isCredit ? "expense" : "blue"}>{SUBTYPE_LABELS[account.account_subtype]}</Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => openEdit(account)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onClick={() => handleDelete(account.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{isCredit ? "Deuda acumulada" : "Saldo disponible"}</p>
          <p className={`text-2xl font-bold ${isCredit ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
            {formatCurrency(account.balance)}
          </p>
          {hasLimit && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Cupo disponible: {formatCurrency(available)}</span>
                <span>{utilization.toFixed(0)}% usado</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${utilization >= 90 ? "bg-red-500" : utilization >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${utilization}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Cupo total: {formatCurrency(account.credit_limit)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cuentas</h2>
        <Button size="sm" onClick={openAdd}>+ Nueva cuenta</Button>
      </div>

      {/* Total summary */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4">
            <p className="text-xs text-emerald-600 font-medium mb-1">Total activos</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
            <p className="text-xs text-red-500 font-medium mb-1">Total deuda</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Balance neto</p>
            <p className={`text-lg font-bold ${totalAssets - totalDebt >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-600"}`}>{formatCurrency(totalAssets - totalDebt)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-lg">Sin cuentas</p>
          <p className="text-sm mt-1">Agrega tu primera cuenta</p>
        </div>
      ) : (
        <div className="space-y-6">
          {debitAccounts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Cuentas de débito</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debitAccounts.map((a) => <AccountCard key={a.id} account={a} />)}
              </div>
            </div>
          )}
          {creditAccounts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tarjetas de crédito</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creditAccounts.map((a) => <AccountCard key={a.id} account={a} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? "Editar cuenta" : "Nueva cuenta"}>
        <div className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Bancolombia Ahorros" />
          {!editId && (
            <>
              <Select label="Tipo" value={form.type} onChange={(e) => updateType(e.target.value)}>
                {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
              <Select label="Subtipo" value={form.account_subtype} onChange={(e) => setForm({ ...form, account_subtype: e.target.value })}>
                {SUBTYPES[form.type].map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </>
          )}
          <Input label={form.type === "credit" ? "Deuda actual (COP)" : "Saldo actual (COP)"} type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0" />
          {form.type === "credit" && (
            <Input label="Cupo total (COP)" type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} placeholder="ej. 5000000" min="0" />
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? "border-gray-800 dark:border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
