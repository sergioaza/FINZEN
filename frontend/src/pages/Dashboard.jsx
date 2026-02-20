import { useState, useEffect } from "react";
import { dashboardApi } from "../api/dashboard";
import { formatCurrency, formatDate } from "../utils/format";
import { Badge } from "../components/common/Badge";

function StatCard({ title, amount, subtitle, colorClass = "text-gray-900 dark:text-white", icon }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{formatCurrency(amount)}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">{icon}</div>
      </div>
    </div>
  );
}

function AccountRow({ account }) {
  const subtypeLabels = {
    cash: "Efectivo",
    savings: "Ahorros",
    checking: "Corriente",
    digital: "Digital",
    credit_card: "Tarjeta Crédito",
  };
  const isCredit = account.type === "credit";
  const hasLimit = isCredit && account.credit_limit != null && account.credit_limit > 0;
  const utilization = hasLimit ? Math.min((account.balance / account.credit_limit) * 100, 100) : 0;
  return (
    <div className="py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: account.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{account.name}</p>
          <p className="text-xs text-gray-400">{subtypeLabels[account.account_subtype]}</p>
        </div>
        <p className={`text-sm font-semibold ${isCredit ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
          {formatCurrency(account.balance)}
        </p>
      </div>
      {hasLimit && (
        <div className="mt-1.5 ml-6">
          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
            <span>Disponible: {formatCurrency(account.credit_limit - account.balance)}</span>
            <span>{utilization.toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${utilization >= 90 ? "bg-red-500" : utilization >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.summary().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const debitAccounts = data.accounts.filter((a) => a.type === "debit");
  const creditAccounts = data.accounts.filter((a) => a.type === "credit");

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total activos"
          amount={data.total_assets}
          subtitle="Cuentas de débito"
          colorClass="text-emerald-600 dark:text-emerald-400"
          icon={
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total deuda"
          amount={data.total_debt}
          subtitle="Tarjetas de crédito"
          colorClass="text-red-500 dark:text-red-400"
          icon={
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
        <StatCard
          title="Balance neto"
          amount={data.net_balance}
          subtitle="Activos − Deuda"
          colorClass={data.net_balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-500"}
          icon={
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Resumen del mes</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Ingresos</span>
              <span className="text-sm font-semibold text-emerald-600">{formatCurrency(data.income_month)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Gastos</span>
              <span className="text-sm font-semibold text-red-500">{formatCurrency(data.expense_month)}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Balance</span>
              <span className={`text-sm font-bold ${data.income_month - data.expense_month >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatCurrency(data.income_month - data.expense_month)}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming recurring */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Próximos cobros (7 días)</h2>
          {data.upcoming_recurring.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Sin cobros próximos</p>
          ) : (
            <div className="space-y-3">
              {data.upcoming_recurring.map((r) => (
                <div key={r.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(r.next_date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-500">{formatCurrency(r.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accounts by type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Debit accounts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-2">Cuentas de débito</h2>
          {debitAccounts.length === 0 ? (
            <p className="text-sm text-gray-400 mt-4">Sin cuentas de débito</p>
          ) : (
            debitAccounts.map((a) => <AccountRow key={a.id} account={a} />)
          )}
        </div>

        {/* Credit accounts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-2">Tarjetas de crédito</h2>
          {creditAccounts.length === 0 ? (
            <p className="text-sm text-gray-400 mt-4">Sin tarjetas de crédito</p>
          ) : (
            creditAccounts.map((a) => <AccountRow key={a.id} account={a} />)
          )}
        </div>
      </div>

      {/* Recent transactions */}
      {data.recent_transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Últimas transacciones</h2>
          <div className="space-y-0">
            {data.recent_transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                  <svg className={`w-4 h-4 ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tx.type === "income" ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{tx.description || "Sin descripción"}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
