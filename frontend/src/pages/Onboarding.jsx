import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountsApi } from "../api/accounts";
import { authApi } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";

const ACCOUNT_TYPES = [
  { value: "debit", label: "Débito / Ahorros / Digital" },
  { value: "credit", label: "Tarjeta de Crédito" },
];

const SUBTYPES = {
  debit: [
    { value: "cash", label: "Efectivo" },
    { value: "savings", label: "Cuenta de Ahorros" },
    { value: "checking", label: "Cuenta Corriente" },
    { value: "digital", label: "Billetera Digital (Nequi, Daviplata)" },
  ],
  credit: [{ value: "credit_card", label: "Tarjeta de Crédito" }],
};

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"];

const emptyAccount = { name: "", type: "debit", account_subtype: "savings", balance: "", color: "#3B82F6" };

export default function Onboarding() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([{ ...emptyAccount }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addAccount = () => setAccounts([...accounts, { ...emptyAccount }]);
  const removeAccount = (i) => setAccounts(accounts.filter((_, idx) => idx !== i));

  const updateAccount = (i, field, value) => {
    const updated = [...accounts];
    updated[i] = { ...updated[i], [field]: value };
    if (field === "type") {
      updated[i].account_subtype = SUBTYPES[value][0].value;
    }
    setAccounts(updated);
  };

  const handleSubmit = async () => {
    setError("");
    for (const acc of accounts) {
      if (!acc.name.trim()) {
        setError("Todos los campos son requeridos");
        return;
      }
    }
    setLoading(true);
    try {
      for (const acc of accounts) {
        await accountsApi.create({
          ...acc,
          balance: parseFloat(acc.balance) || 0,
        });
      }
      const updatedUser = await authApi.completeOnboarding();
      updateUser(updatedUser);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Error al guardar las cuentas");
    } finally {
      setLoading(false);
    }
  };

  const skip = async () => {
    setLoading(true);
    try {
      const updatedUser = await authApi.completeOnboarding();
      updateUser(updatedUser);
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">F</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">¡Bienvenido a FinZen!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Configura tus cuentas iniciales para comenzar</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 space-y-6">
          {accounts.map((acc, i) => (
            <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Cuenta {i + 1}</h3>
                {accounts.length > 1 && (
                  <button
                    onClick={() => removeAccount(i)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre de la cuenta"
                  value={acc.name}
                  onChange={(e) => updateAccount(i, "name", e.target.value)}
                  placeholder="Ej: Bancolombia Ahorros"
                />
                <Select
                  label="Tipo"
                  value={acc.type}
                  onChange={(e) => updateAccount(i, "type", e.target.value)}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
                <Select
                  label="Subtipo"
                  value={acc.account_subtype}
                  onChange={(e) => updateAccount(i, "account_subtype", e.target.value)}
                >
                  {SUBTYPES[acc.type].map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
                <Input
                  label={acc.type === "credit" ? "Deuda actual (COP)" : "Saldo actual (COP)"}
                  type="number"
                  value={acc.balance}
                  onChange={(e) => updateAccount(i, "balance", e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateAccount(i, "color", c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${acc.color === c ? "border-gray-800 dark:border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={addAccount}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm font-medium"
          >
            + Agregar otra cuenta
          </button>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={skip} disabled={loading}>
              Omitir
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Comenzar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
