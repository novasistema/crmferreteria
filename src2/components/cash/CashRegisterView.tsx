import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  PieChart,
  FileSpreadsheet,
  Calendar,
  Receipt,
  Building,
  ArrowRightLeft,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Plus,
} from 'lucide-react';
import { CashRegistersTab } from './CashRegistersTab';
import { CashCollectionTab } from './CashCollectionTab';
import { CashExpensesTab } from './CashExpensesTab';
import { CashDailyMovementsTab } from './CashDailyMovementsTab';
import { CashChecksTab } from './CashChecksTab';
import { CashBankAccountsTab } from './CashBankAccountsTab';

export const CashRegisterView: React.FC = () => {
  const { store, activeModule } = useApp();

  const [activeTab, setActiveTab] = useState<
    'cajas' | 'recaudacion' | 'gastos' | 'movimientos' | 'cheques' | 'bancos'
  >('cajas');

  React.useEffect(() => {
    if (activeModule === 'payment_receipts') {
      setActiveTab('movimientos');
    } else if (activeModule === 'collection_methods') {
      setActiveTab('recaudacion');
    } else if (activeModule === 'mercadopago_payments' || activeModule === 'digital_wallets') {
      setActiveTab('bancos');
    } else if (activeModule === 'fixed_expenses') {
      setActiveTab('gastos');
    } else if (activeModule === 'cash_register') {
      setActiveTab('cajas');
    }
  }, [activeModule]);

  const pendingChecksCount = store.checks.filter(
    (c) => c.status === 'pending' || c.status === 'in_portfolio'
  ).length;

  const activeSessionsCount = store.cashSessions.filter((s) => s.status === 'open').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Main Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 flex flex-wrap gap-1">
        <button
          id="tab-cash-registers"
          onClick={() => setActiveTab('cajas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'cajas'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Cajas Registradoras
          {activeSessionsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'cajas'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {activeSessionsCount} abiertas
            </span>
          )}
        </button>

        <button
          id="tab-cash-collection"
          onClick={() => setActiveTab('recaudacion')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'recaudacion'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Recaudación por Forma de Pago
        </button>

        <button
          id="tab-cash-expenses"
          onClick={() => setActiveTab('gastos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gastos'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Control de Gastos
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'gastos' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {store.expenseCategories.length}
          </span>
        </button>

        <button
          id="tab-cash-daily-movements"
          onClick={() => setActiveTab('movimientos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'movimientos'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Movimientos Diarios
        </button>

        <button
          id="tab-cash-checks"
          onClick={() => setActiveTab('cheques')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'cheques'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Cartera de Cheques
          {pendingChecksCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'cheques'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              {pendingChecksCount} alertas
            </span>
          )}
        </button>

        <button
          id="tab-cash-banks"
          onClick={() => setActiveTab('bancos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'bancos'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          Cuentas Bancarias
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'bancos' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {store.moneyBoxes.length}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'cajas' && <CashRegistersTab />}
      {activeTab === 'recaudacion' && <CashCollectionTab />}
      {activeTab === 'gastos' && <CashExpensesTab />}
      {activeTab === 'movimientos' && <CashDailyMovementsTab />}
      {activeTab === 'cheques' && <CashChecksTab />}
      {activeTab === 'bancos' && <CashBankAccountsTab />}
    </div>
  );
};
