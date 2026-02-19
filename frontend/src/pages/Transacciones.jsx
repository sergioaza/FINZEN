import { useState, useEffect, useCallback } from "react";
import { transactionsApi } from "../api/transactions";
import { accountsApi } from "../api/accounts";
import { categoriesApi } from "../api/categories";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Badge } from "../components/common/Badge";
import { formatCurrency, formatDate, todayISO } from "../utils/format";

const emptyForm = {
  account_id: "",
  category_id: "",
  type: "expense",
  amount: "",
  date: todayISO(),
  description: "",
};

const emptyTransfer = {
  from_account_id: "",
  to_account_id: "",
  amount: "",
  date: todayISO(),
  description: "",
};

export default function Transacciones() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | "transfer" | "edit"
  const [form, setForm] = useState(emptyForm);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [filters, setFilters] = useState({ from: "", to: "", type: "", account_id: "", category_id: "" });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.type) params.type = filters.type;
      if (filters.account_id) params.account_id = filters.account_id;
      if (filters.category_id) params.category_id = filters.category_id;
      const [txs, accs, cats] = await Promise.all([
        transactionsApi.list(params),
        accountsApi.list(),
        categoriesApi.list(),
      ]);
      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setForm({ ...emptyForm, account_id: accounts[0]?.id || "" });
    setEditId(null);
    setError("");
    setModal("add");
  };

  const openEdit = (tx) => {
    setForm({
      account_id: tx.account_id,
      category_id: tx.category_id || "",
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      description: tx.description,
    });
    setEditId(tx.id);
    setError("");
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.account_id || !form.amount || !form.date) {
      setError("Cuenta, monto y fecha son requeridos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id || null,
      };
      if (modal === "edit" && editId) {
        await transactionsApi.update(editId, payload);
      } else {
        await transactionsApi.create(payload);
      }
      setModal(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount) {
      setError("Todos los campos son requeridos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await transactionsApi.transfer({ ...transferForm, amount: parseFloat(transferForm.amount) });
      setModal(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Error en transferencia");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta transacción?")) return;
    await transactionsApi.delete(id);
    fetchAll();
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const accountName = (id) => accounts.find((a) => a.id === id)?.name || "—";
  const categoryName = (id) => categories.find((c) => c.id === id)?.name || "Sin categoría";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transacciones</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setTransferForm(emptyTransfer); setError(""); setModal("transfer"); }}>
            Transferir
          </Button>
          <Button size="sm" onClick={openAdd}>+ Nueva</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Input type="date" placeholder="Desde" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <Input type="date" placeholder="Hasta" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </Select>
          <Select value={filters.account_id} onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}>
            <option value="">Todas las cuentas</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Button variant="secondary" size="sm" onClick={() => setFilters({ from: "", to: "", type: "", account_id: "", category_id: "" })}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">Sin transacciones</p>
            <p className="text-sm mt-1">Agrega tu primera transacción</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cuenta</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monto</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        {tx.transfer_pair_id && <Badge variant="blue">Transferencia</Badge>}
                        {tx.description || "Sin descripción"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{tx.category_id ? categoryName(tx.category_id) : "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{accountName(tx.account_id)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={tx.type === "income" ? "text-emerald-600" : "text-red-500"}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        {!tx.transfer_pair_id && (
                          <button onClick={() => openEdit(tx)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        <button onClick={() => handleDelete(tx.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "edit" ? "Editar transacción" : "Nueva transacción"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setForm({ ...form, type: "expense", category_id: "" })}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${form.type === "expense" ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >Gasto</button>
            <button
              onClick={() => setForm({ ...form, type: "income", category_id: "" })}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${form.type === "income" ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >Ingreso</button>
          </div>
          <Select label="Cuenta" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Input label="Monto (COP)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" min="0" />
          <Input label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select label="Categoría" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Sin categoría</option>
            {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opcional..." />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={modal === "transfer"} onClose={() => setModal(null)} title="Transferencia entre cuentas">
        <div className="space-y-4">
          <Select label="Cuenta origen" value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Select label="Cuenta destino" value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {accounts.filter((a) => a.id !== parseInt(transferForm.from_account_id)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Input label="Monto (COP)" type="number" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} placeholder="0" min="0" />
          <Input label="Fecha" type="date" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })} />
          <Input label="Descripción" value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })} placeholder="Opcional..." />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleTransfer} disabled={saving}>{saving ? "Transfiriendo..." : "Transferir"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
