import { useState, useEffect } from "react";
import { transactionsApi } from "../api/transactions";
import { categoriesApi } from "../api/categories";
import { useCurrency } from "../hooks/useCurrency";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function Estadisticas() {
  const formatAmount = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      transactionsApi.list({ from: `${year}-01-01`, to: `${year}-12-31` }),
      categoriesApi.list(),
    ]).then(([txs, cats]) => {
      setTransactions(txs);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, [year]);

  // By category (expenses only)
  const expenseByCategory = {};
  transactions
    .filter((t) => t.type === "expense" && !t.transfer_pair_id)
    .forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const name = cat?.name || "Sin categoría";
      const color = cat?.color || "#6B7280";
      if (!expenseByCategory[name]) expenseByCategory[name] = { name, value: 0, color };
      expenseByCategory[name].value += t.amount;
    });
  const pieData = Object.values(expenseByCategory).sort((a, b) => b.value - a.value).slice(0, 8);

  // Monthly income vs expense
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: MONTHS[i], ingresos: 0, gastos: 0 }));
  transactions
    .filter((t) => !t.transfer_pair_id)
    .forEach((t) => {
      const m = new Date(t.date + "T00:00:00").getMonth();
      if (t.type === "income") monthlyData[m].ingresos += t.amount;
      else monthlyData[m].gastos += t.amount;
    });

  // Balance line chart
  const lineData = monthlyData.map((d) => ({ ...d, balance: d.ingresos - d.gastos }));

  const formatTooltip = (value) => formatAmount(value);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Estadísticas</h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
        >
          {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart - expenses by category */}
        <Card title="Gastos por categoría">
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos de gastos</p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={formatTooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{d.name}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatAmount(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Bar chart - income vs expense by month */}
        <Card title="Ingresos vs Gastos por mes">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="gastos" fill="#EF4444" radius={[4, 4, 0, 0]} name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Line chart - balance */}
        <Card title="Balance mensual">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={formatTooltip} />
              <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 3 }} name="Balance" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Summary stats */}
        <Card title="Resumen del año">
          <div className="space-y-4">
            {[
              { label: "Total ingresos", value: monthlyData.reduce((s, d) => s + d.ingresos, 0), color: "text-emerald-600" },
              { label: "Total gastos", value: monthlyData.reduce((s, d) => s + d.gastos, 0), color: "text-red-500" },
              { label: "Balance neto", value: monthlyData.reduce((s, d) => s + d.balance, 0), color: "text-blue-600" },
              { label: "Promedio mensual gastos", value: monthlyData.reduce((s, d) => s + d.gastos, 0) / 12, color: "text-orange-500" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{formatAmount(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
