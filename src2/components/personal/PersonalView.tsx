import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  DollarSign,
  ArrowDownCircle,
  AlertCircle,
  FileText,
  Clock,
  Palmtree,
  Gift,
  Plus,
} from 'lucide-react';
import { EmployeesTab } from './EmployeesTab';
import { AttendanceTab } from './AttendanceTab';
import { VacationsTab } from './VacationsTab';
import { BonusesTab } from './BonusesTab';
import { PaymentsTab } from './PaymentsTab';
import { AdvancesTab } from './AdvancesTab';

type TabType = 'employees' | 'attendance' | 'vacations' | 'bonuses' | 'payments' | 'advances';

export const PersonalView: React.FC = () => {
  const { store } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('employees');

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // Metrics calculation
  const activeEmployeesCount = store.employees.filter((e) => e.active).length;

  const currentMonthPayments = store.employeePayments.filter(
    (p) => p.periodMonth === currentMonth
  );
  const totalPaidThisMonth = currentMonthPayments.reduce((sum, p) => sum + p.netAmount, 0);
  const paymentsCountThisMonth = currentMonthPayments.length;

  const currentMonthAdvances = store.employeeAdvances.filter((a) =>
    a.date.startsWith(currentMonth)
  );
  const pendingAdvancesThisMonth = currentMonthAdvances.reduce((sum, a) => sum + a.amount, 0);

  const absencesThisMonthCount = store.employeeAbsences.filter((a) =>
    a.date.startsWith(currentMonth)
  ).length;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Users className="w-6 h-6" />
            </div>
            Personal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona empleados, sueldos, faltas y vacaciones
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Empleados Activos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Empleados Activos
            </span>
            <span className="text-2xl font-black text-white mt-0.5 block tracking-tight">
              {activeEmployeesCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Pagado Este Mes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pagado Este Mes
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block tracking-tight">
              ${totalPaidThisMonth.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Adelantos Pend. */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Adelantos Mes
            </span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block tracking-tight">
              ${pendingAdvancesThisMonth.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Faltas Este Mes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Faltas Este Mes
            </span>
            <span className="text-2xl font-black text-red-400 mt-0.5 block tracking-tight">
              {absencesThisMonthCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Pagos Este Mes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pagos Este Mes
            </span>
            <span className="text-2xl font-black text-purple-400 mt-0.5 block tracking-tight">
              {paymentsCountThisMonth}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none shadow-sm">
        {[
          { id: 'employees', label: 'Empleados', icon: Users },
          { id: 'attendance', label: 'Asistencia', icon: Clock },
          { id: 'vacations', label: 'Vacaciones', icon: Palmtree },
          { id: 'bonuses', label: 'Bonos', icon: Gift },
          { id: 'payments', label: 'Pagos', icon: DollarSign },
          { id: 'advances', label: 'Adelantos', icon: ArrowDownCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-150">
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'vacations' && <VacationsTab />}
        {activeTab === 'bonuses' && <BonusesTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'advances' && <AdvancesTab />}
      </div>
    </div>
  );
};
