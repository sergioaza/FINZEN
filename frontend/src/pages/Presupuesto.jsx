import { useState, useEffect } from "react";
import { budgetsApi } from "../api/budgets";
import { categoriesApi } from "../api/categories";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { formatCurrency } from "../utils/format";

const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function ProgressBar({ spent, limit }) {
  const pct = Math.min((spent / limit) * 100, 100);
  const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{formatCurrency(spent)} gastado</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function Presupuesto() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ category_id: "", limit_amount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [bs, cats] = await Promise.all([budgetsApi.getMonth(year, month), categoriesApi.list()]);
    setBudgets(bs);
    setCategories(cats.filter((c) => c.type === "expense"));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const openAdd = () => {
    setForm({ category_id: "", limit_amount: "" });
    setError("");
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.category_id || !form.limit_amount) {
      setError("Categoría y límite son requeridos");
      return;
    }
    setSaving(true);
    try {
      await budgetsApi.create({ ...form, month, year, limit_amount: parseFloat(form.limit_amount), category_id: parseInt(form.category_id) });
      setModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    await budgetsApi.delete(id);
    fetchData();
  };

  const totalLimit = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const usedCategoryIds = budgets.map((b) => b.category_id);
  const availableCategories = categories.filter((c) => !usedCategoryIds.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS_ES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
        <Button size="sm" onClick={openAdd}>+ Nuevo presupuesto</Button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total gastado</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Presupuesto total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalLimit)}</p>
            </div>
          </div>
          <ProgressBar spent={totalSpent} limit={totalLimit} />
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-lg">Sin presupuestos</p>
          <p className="text-sm mt-1">Crea un presupuesto para este mes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.category_id);
            return (
              <div key={b.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat?.color || "#6B7280" }} />
                    <span className="font-medium text-gray-800 dark:text-gray-200">{cat?.name || "Categoría"}</span>
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <ProgressBar spent={b.spent} limit={b.limit_amount} />
                <div className="mt-2 text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Límite: <strong>{formatCurrency(b.limit_amount)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nuevo presupuesto">
        <div className="space-y-4">
          <Select label="Categoría" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {availableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Límite mensual (COP)" type="number" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} placeholder="0" min="0" />
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
