import { useState, useEffect } from "react";
import { goalsApi } from "../api/goals";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Badge } from "../components/common/Badge";
import { formatCurrency, formatDate, todayISO } from "../utils/format";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6"];

const emptyForm = { name: "", target_amount: "", target_date: "", description: "", color: "#6366f1" };
const emptyContribution = { amount: "", date: todayISO(), notes: "" };

export default function MetasAhorro() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | "edit" | "contribution"
  const [form, setForm] = useState(emptyForm);
  const [contributionForm, setContributionForm] = useState(emptyContribution);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchGoals = async () => {
    setLoading(true);
    const gs = await goalsApi.list();
    setGoals(gs);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setError("");
    setModal("add");
  };

  const openEdit = (goal) => {
    setSelectedGoal(goal);
    setForm({
      name: goal.name,
      target_amount: goal.target_amount,
      target_date: goal.target_date || "",
      description: goal.description,
      color: goal.color,
    });
    setError("");
    setModal("edit");
  };

  const openContribution = (goal) => {
    setSelectedGoal(goal);
    setContributionForm(emptyContribution);
    setError("");
    setModal("contribution");
  };

  const handleSave = async () => {
    if (!form.name || !form.target_amount) {
      setError("Nombre y objetivo son requeridos");
      return;
    }
    setSaving(true);
    try {
      await goalsApi.create({
        ...form,
        target_amount: parseFloat(form.target_amount),
        target_date: form.target_date || null,
      });
      setModal(null);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name || !form.target_amount) {
      setError("Nombre y objetivo son requeridos");
      return;
    }
    setSaving(true);
    try {
      await goalsApi.update(selectedGoal.id, {
        ...form,
        target_amount: parseFloat(form.target_amount),
        target_date: form.target_date || null,
      });
      setModal(null);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleContribution = async () => {
    if (!contributionForm.amount || !contributionForm.date) {
      setError("Monto y fecha son requeridos");
      return;
    }
    setSaving(true);
    try {
      await goalsApi.addContribution(selectedGoal.id, {
        ...contributionForm,
        amount: parseFloat(contributionForm.amount),
      });
      setModal(null);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al registrar aportación");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta meta?")) return;
    await goalsApi.delete(id);
    fetchGoals();
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const totalSaved = activeGoals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);

  function ColorPicker({ value, onChange }) {
    return (
      <div className="flex gap-2 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full transition-transform ${value === c ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 scale-110" : ""}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    );
  }

  function GoalCard({ goal }) {
    const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    const isCompleted = goal.status === "completed";
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-3 h-3 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: goal.color }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-800 dark:text-white truncate">{goal.name}</h3>
                {isCompleted && <Badge variant="income">Completada</Badge>}
              </div>
              {goal.description && <p className="text-xs text-gray-400 mt-0.5">{goal.description}</p>}
              {goal.target_date && (
                <p className="text-xs text-gray-400">Fecha objetivo: {formatDate(goal.target_date)}</p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(goal.current_amount)}</p>
            <p className="text-xs text-gray-400">de {formatCurrency(goal.target_amount)}</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{pct.toFixed(0)}%</span>
            <span>{formatCurrency(goal.target_amount - goal.current_amount)} restante</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {!isCompleted && (
            <Button size="sm" variant="secondary" onClick={() => openContribution(goal)}>+ Aportación</Button>
          )}
          {!isCompleted && (
            <Button size="sm" variant="secondary" onClick={() => openEdit(goal)}>Editar</Button>
          )}
          <button
            onClick={() => handleDelete(goal.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 ml-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Metas de ahorro</h2>
        <Button size="sm" onClick={openAdd}>+ Nueva meta</Button>
      </div>

      {activeGoals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4">
            <p className="text-xs text-indigo-500 font-medium mb-1">Metas activas</p>
            <p className="text-xl font-bold text-indigo-600">{activeGoals.length}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4">
            <p className="text-xs text-emerald-600 font-medium mb-1">Total ahorrado</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Total objetivo</p>
            <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{formatCurrency(totalTarget)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Activas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Completadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}

          {goals.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-lg mb-1">Sin metas de ahorro</p>
              <p className="text-sm">Crea una meta para hacer seguimiento de tus objetivos</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Nueva meta */}
      <Modal isOpen={modal === "add"} onClose={() => setModal(null)} title="Nueva meta de ahorro">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ej. Televisor Samsung"
          />
          <Input
            label="Objetivo (COP)"
            type="number"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            placeholder="0"
            min="0"
          />
          <Input
            label="Fecha objetivo (opcional)"
            type="date"
            value={form.target_date}
            onChange={(e) => setForm({ ...form, target_date: e.target.value })}
          />
          <Input
            label="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="..."
          />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</p>
            <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Crear meta"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Editar meta */}
      <Modal isOpen={modal === "edit"} onClose={() => setModal(null)} title={`Editar — ${selectedGoal?.name}`}>
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ej. Televisor Samsung"
          />
          <Input
            label="Objetivo (COP)"
            type="number"
            value={form.target_amount}
            onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
            placeholder="0"
            min="0"
          />
          <Input
            label="Fecha objetivo (opcional)"
            type="date"
            value={form.target_date}
            onChange={(e) => setForm({ ...form, target_date: e.target.value })}
          />
          <Input
            label="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="..."
          />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</p>
            <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleEdit} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Añadir aportación */}
      <Modal isOpen={modal === "contribution"} onClose={() => setModal(null)} title={`Aportación — ${selectedGoal?.name}`}>
        <div className="space-y-4">
          {selectedGoal && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ahorrado:{" "}
                <strong className="text-gray-900 dark:text-white">{formatCurrency(selectedGoal.current_amount)}</strong>
                {" / "}
                {formatCurrency(selectedGoal.target_amount)}
              </p>
            </div>
          )}
          <Input
            label="Monto (COP)"
            type="number"
            value={contributionForm.amount}
            onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
            placeholder="0"
            min="0"
          />
          <Input
            label="Fecha"
            type="date"
            value={contributionForm.date}
            onChange={(e) => setContributionForm({ ...contributionForm, date: e.target.value })}
          />
          <Input
            label="Notas (opcional)"
            value={contributionForm.notes}
            onChange={(e) => setContributionForm({ ...contributionForm, notes: e.target.value })}
            placeholder="..."
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleContribution} disabled={saving}>
              {saving ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
