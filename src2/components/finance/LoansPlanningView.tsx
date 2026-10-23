import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanPlan, LoanDestination, LoanFrequency } from '../../types';
import {
  Landmark,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  ArrowRight,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  Calculator,
  Wallet,
  Coins,
  Percent,
  Layers,
  BarChart3,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

export const LoansPlanningView: React.FC = () => {
  const { store, user, currentUser, showToast, triggerRefresh } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'loans' | 'schedule' | 'sales_target' | 'matrix' | 'projection'>('dashboard');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('all');
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isStockSpentModalOpen, setIsStockSpentModalOpen] = useState(false);

  // Selected item states for modals
  const [targetLoanForAction, setTargetLoanForAction] = useState<LoanPlan | null>(null);
  const [targetInstallmentNum, setTargetInstallmentNum] = useState<number>(1);

  // New loan form state
  const [newLoanForm, setNewLoanForm] = useState({
    name: '',
    creditor: '',
    date: new Date().toISOString().split('T')[0],
    receivedAmount: 5000000,
    installmentsCount: 12,
    installmentAmount: 500000,
    frequency: 'monthly' as LoanFrequency,
    firstDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    dueDay: 10,
    interestRate: 15,
    expenses: 50000,
    destination: 'stock' as LoanDestination,
    notes: '',
    grossMarginPercent: 35,
    monthlyExpensesConsidered: 1500000,
    sellingDaysMonth: 24,
    sellingDaysWeek: 6,
  });

  // Contribution form state
  const [contribAmount, setContribAmount] = useState<number>(100000);
  const [contribDesc, setContribDesc] = useState<string>('Aporte diario de ventas al fondo de cuotas');

  // Pay modal state
  const [payMethod, setPayMethod] = useState<string>('cash');
  const [payNotes, setPayNotes] = useState<string>('Pago de cuota desde fondo reservado');

  // Stock spent update state
  const [stockSpentVal, setStockSpentVal] = useState<number>(0);

  const loans = store.loanPlans || [];

  // Filtered loans
  const filteredLoans = selectedLoanId === 'all'
    ? loans
    : loans.filter((l) => l.id === selectedLoanId);

  // Calculate global metrics
  const totalReceived = loans.reduce((acc, l) => acc + (l.receivedAmount || 0), 0);
  const totalToReturn = loans.reduce((acc, l) => acc + (l.totalToReturn || 0), 0);
  
  let totalPaid = 0;
  let totalPendingAmount = 0;
  let totalReservedFund = 0;
  let totalUpcomingNext = 0;
  let minDaysToNext = 999;
  let nextInstallmentName = 'Sin cuotas pendientes';

  const today = new Date();

  loans.forEach((loan) => {
    loan.schedule.forEach((inst) => {
      if (inst.status === 'paid') {
        totalPaid += inst.amount;
      } else {
        totalPendingAmount += inst.amount;
        const due = new Date(inst.dueDate);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < minDaysToNext) {
          minDaysToNext = diffDays;
          totalUpcomingNext = inst.amount;
          nextInstallmentName = `${loan.name} (Cuota ${inst.number})`;
        }
      }
      totalReservedFund += (inst.reservedAmount || 0);
    });
  });

  const totalMissingFund = Math.max(0, totalUpcomingNext - totalReservedFund);
  const dailyNeededReserve = minDaysToNext > 0 ? Math.round(totalMissingFund / minDaysToNext) : totalMissingFund;

  // Financial Traffic Light (Semáforo)
  const coverageRatio = totalUpcomingNext > 0 ? (totalReservedFund / totalUpcomingNext) * 100 : 100;
  let trafficLight: 'green' | 'yellow' | 'red' = 'green';
  let trafficLabel = 'Óptimo (Fondos cubiertos)';
  if (coverageRatio < 50 || minDaysToNext <= 3 && totalReservedFund < totalUpcomingNext) {
    trafficLight = 'red';
    trafficLabel = 'Riesgo Crítico (Faltante para vencimiento próximo)';
  } else if (coverageRatio < 100 || minDaysToNext <= 7) {
    trafficLight = 'yellow';
    trafficLabel = 'Atención (Requiere acelerar reservas)';
  }

  // Handle Create Loan
  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoanForm.name || !newLoanForm.creditor) {
      showToast('Por favor completa el nombre y la entidad del préstamo.', 'error');
      return;
    }
    store.createLoanPlan({
      ...newLoanForm,
      user: currentUser,
    });
    triggerRefresh();
    showToast('Préstamo y cronograma de cuotas creado exitosamente.', 'success');
    setIsNewLoanModalOpen(false);
  };

  // Handle Add Contribution
  const handleAddContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLoanForAction || contribAmount <= 0) return;
    store.addLoanContribution(targetLoanForAction.id, contribAmount, contribDesc, user);
    showToast(`Se han asignado $${contribAmount.toLocaleString()} al fondo de reserva.`, 'success');
    setIsContributionModalOpen(false);
    setContribAmount(100000);
  };

  // Handle Pay Installment
  const handlePayInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLoanForAction) return;
    const success = store.payLoanInstallment(targetLoanForAction.id, targetInstallmentNum, payMethod, user, { notes: payNotes });
    if (success) {
      showToast(`Cuota ${targetInstallmentNum} registrada como pagada con éxito.`, 'success');
      setIsPayModalOpen(false);
    } else {
      showToast('Error al registrar el pago de la cuota.', 'error');
    }
  };

  // Handle update stock spent
  const handleUpdateStockSpentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLoanForAction) return;
    store.updateLoanStockSpent(targetLoanForAction.id, stockSpentVal);
    showToast('Inversión en stock del préstamo actualizada.', 'success');
    setIsStockSpentModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Préstamos y Planificación de Cuotas</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">PRO</span>
              </h1>
              <p className="text-sm text-slate-400">
                Gestión financiera de pasivos, fondo de reserva, cobertura de cuotas y objetivos de venta
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNewLoanModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Préstamo</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 my-6 overflow-x-auto pb-2 border-b border-slate-800/80">
        {[
          { id: 'dashboard', label: 'Centro de Control', icon: BarChart3 },
          { id: 'loans', label: 'Listado de Préstamos', icon: Landmark },
          { id: 'schedule', label: 'Cronograma & Vencimientos', icon: Calendar },
          { id: 'sales_target', label: '¿Cuánto tengo que vender?', icon: Calculator },
          { id: 'matrix', label: 'Obligaciones Futuras', icon: Layers },
          { id: 'projection', label: 'Proyección 12 Meses & Stock', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Filter Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-6">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Filtrar por Préstamo:</span>
          <select
            value={selectedLoanId}
            onChange={(e) => setSelectedLoanId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos los Préstamos Activos ({loans.length})</option>
            {loans.map((l) => (
              <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
            ))}
          </select>
        </div>

        {/* Traffic Light Badge */}
        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border bg-slate-950">
          <span className={`w-3 h-3 rounded-full animate-pulse ${
            trafficLight === 'green' ? 'bg-emerald-500' : trafficLight === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'
          }`}></span>
          <span className="text-xs font-bold text-slate-300">Semáforo: {trafficLabel}</span>
        </div>
      </div>

      {/* TAB 1: DASHBOARD / CENTRO DE CONTROL */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top 10 KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Capital Recibido</p>
              <p className="text-xl font-bold text-white mt-1">${totalReceived.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-slate-400">Financiación total neta</div>
              <div className="absolute right-3 top-3 p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Landmark className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Total a Devolver</p>
              <p className="text-xl font-bold text-amber-400 mt-1">${totalToReturn.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-slate-400">Capital + Intereses + Gastos</div>
              <div className="absolute right-3 top-3 p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Total Ya Pagado</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">${totalPaid.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-slate-400">Cuotas canceladas</div>
              <div className="absolute right-3 top-3 p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Total Pendiente</p>
              <p className="text-xl font-bold text-rose-400 mt-1">${totalPendingAmount.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-slate-400">Deuda futura a cubrir</div>
              <div className="absolute right-3 top-3 p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Próxima Cuota</p>
              <p className="text-xl font-bold text-white mt-1">${totalUpcomingNext.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-amber-400 font-medium">Vence en {minDaysToNext} días</div>
              <div className="absolute right-3 top-3 p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Dinero Reservado</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">${totalReservedFund.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-slate-400">Fondo de cuotas separado</div>
              <div className="absolute right-3 top-3 p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Dinero Faltante</p>
              <p className="text-xl font-bold text-amber-400 mt-1">${totalMissingFund.toLocaleString()}</p>
              <div className="mt-2 text-[11px] text-slate-400">Para cubrir próxima cuota</div>
              <div className="absolute right-3 top-3 p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Reserva Diaria Necesaria</p>
              <p className="text-xl font-bold text-white mt-1">${dailyNeededReserve.toLocaleString()} /día</p>
              <div className="mt-2 text-[11px] text-slate-400">Ahorro diario para llegar</div>
              <div className="absolute right-3 top-3 p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Cobertura de Cuotas</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{Math.round(coverageRatio)}%</p>
              <div className="mt-2 text-[11px] text-slate-400">Fondo vs Obligación próxima</div>
              <div className="absolute right-3 top-3 p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Percent className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <p className="text-xs font-semibold text-slate-400">Préstamos Activos</p>
              <p className="text-xl font-bold text-white mt-1">{loans.length}</p>
              <div className="mt-2 text-[11px] text-slate-400">Líneas de crédito en curso</div>
              <div className="absolute right-3 top-3 p-2 bg-teal-500/10 text-teal-400 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Progress Bars & Business Liquidity Rule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Bars */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Progreso Financiero y Reservas</span>
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">Deuda Total Pagada</span>
                  <span className="text-amber-400 font-bold">
                    {Math.round((totalPaid / (totalToReturn || 1)) * 100)}% (${totalPaid.toLocaleString()} / ${totalToReturn.toLocaleString()})
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalPaid / (totalToReturn || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">Fondo para Próxima Cuota</span>
                  <span className="text-emerald-400 font-bold">
                    {Math.min(100, Math.round(coverageRatio))}% (${totalReservedFund.toLocaleString()} / ${totalUpcomingNext.toLocaleString()})
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, coverageRatio)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <p className="font-bold text-amber-400 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Próxima Vencimiento:</span>
                </p>
                <p className="text-slate-200">{nextInstallmentName}</p>
                <p className="text-slate-400">Para llegar tranquilo necesitás separar <strong className="text-white">${dailyNeededReserve.toLocaleString()}</strong> por día durante los próximos {minDaysToNext} días.</p>
              </div>
            </div>

            {/* Business Liquidity Rule (Caja vs Comprometido vs Disponible) */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Regla de Negocio: Caja vs Dinero Comprometido</span>
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                El sistema diferencia claramente el dinero operativo libre del dinero comprometido para futuras obligaciones financieras y cuotas de préstamos.
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-sm text-slate-300 font-medium">Caja Total y Bancos (Estimado)</span>
                  <span className="text-sm font-bold text-white">$12.500.000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-sm text-slate-300 font-medium">Comprometido para Cuotas (Fondo Reservado)</span>
                  <span className="text-sm font-bold text-amber-400">-${totalReservedFund.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <span className="text-sm text-emerald-300 font-bold">Disponible Operativo Real (Para Nuevas Compras/Stock)</span>
                  <span className="text-base font-black text-emerald-400">${(12500000 - totalReservedFund).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                * El dinero destinado a pagar deudas nunca debe interpretarse como capital libre para gastos corrientes o retiros.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LISTADO DE PRÉSTAMOS */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLoans.map((loan) => {
              const paidCount = loan.schedule.filter((s) => s.status === 'paid').length;
              const totalCount = loan.schedule.length;
              const progress = Math.round((paidCount / totalCount) * 100);

              return (
                <div key={loan.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {loan.code}
                      </span>
                      <span className="text-xs font-medium text-slate-400">Destino: <strong className="text-slate-200 uppercase">{loan.destination}</strong></span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{loan.name}</h3>
                    <p className="text-xs text-slate-400">Entidad: <strong className="text-slate-200">{loan.creditor}</strong></p>
                  </div>

                  <div className="space-y-3 py-3 border-y border-slate-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capital Recibido:</span>
                      <span className="font-bold text-white">${loan.receivedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total a Devolver:</span>
                      <span className="font-bold text-amber-400">${loan.totalToReturn.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cuota Mensual:</span>
                      <span className="font-bold text-white">${loan.installmentAmount.toLocaleString()} ({paidCount}/{totalCount})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inversión en Stock:</span>
                      <span className="font-bold text-emerald-400">${loan.stockPurchasesSpent.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Progreso Cuotas</span>
                      <span className="text-amber-400 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => {
                        setTargetLoanForAction(loan);
                        setIsContributionModalOpen(true);
                      }}
                      className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Aportar Fondo</span>
                    </button>
                    <button
                      onClick={() => {
                        setTargetLoanForAction(loan);
                        setStockSpentVal(loan.stockPurchasesSpent);
                        setIsStockSpentModalOpen(true);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                      title="Control de Stock"
                    >
                      Stock
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar el préstamo ${loan.name}?`)) {
                          store.deleteLoanPlan(loan.id);
                          showToast('Préstamo eliminado correctamente.', 'info');
                        }
                      }}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition-all"
                      title="Eliminar préstamo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CRONOGRAMA & VENCIMIENTOS */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Cronograma General de Cuotas y Reservas</h3>
              <span className="text-xs text-slate-400">Mostrando todas las cuotas programadas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Préstamo</th>
                    <th className="p-3">Cuota #</th>
                    <th className="p-3">Vencimiento</th>
                    <th className="p-3">Importe</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Reservado</th>
                    <th className="p-3">Faltante</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLoans.flatMap((loan) =>
                    loan.schedule.map((inst) => {
                      const missing = Math.max(0, inst.amount - inst.reservedAmount);
                      return (
                        <tr key={`${loan.id}-${inst.number}`} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-medium text-white">{loan.name}</td>
                          <td className="p-3 font-bold text-amber-400">Cuota {inst.number} / {loan.installmentsCount}</td>
                          <td className="p-3 text-slate-300">{inst.dueDate}</td>
                          <td className="p-3 font-bold text-white">${inst.amount.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              inst.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              inst.status === 'reserved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              inst.status === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {inst.status === 'paid' ? '🟢 Pagada' : inst.status === 'reserved' ? '🟢 100% Reservada' : inst.status === 'partial' ? '🟡 Parcial' : '⚪ Pendiente'}
                            </span>
                          </td>
                          <td className="p-3 text-emerald-400 font-semibold">${inst.reservedAmount.toLocaleString()}</td>
                          <td className="p-3 text-amber-400 font-semibold">${missing.toLocaleString()}</td>
                          <td className="p-3 text-right space-x-2">
                            {inst.status !== 'paid' && (
                              <button
                                onClick={() => {
                                  setTargetLoanForAction(loan);
                                  setTargetInstallmentNum(inst.number);
                                  setIsPayModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all"
                              >
                                Pagar Cuota
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ¿CUÁNTO TENGO QUE VENDER? (OBJETIVOS Y MARGEN) */}
      {activeTab === 'sales_target' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Asistente de Ventas y Margen para Pagar Cuotas</h3>
                <p className="text-xs text-slate-400">Calcula automáticamente cuánto necesitas vender según tu margen bruto promedio.</p>
              </div>
            </div>

            {filteredLoans.map((loan) => {
              const nextInst = loan.schedule.find((s) => s.status !== 'paid') || loan.schedule[0];
              const amountToCover = nextInst ? Math.max(0, nextInst.amount - nextInst.reservedAmount) : 0;
              const margin = loan.grossMarginPercent || 35;
              const salesNeeded = margin > 0 ? Math.round(amountToCover / (margin / 100)) : 0;
              const daysRemaining = 14; // estimated or calculated
              const dailySalesTarget = daysRemaining > 0 ? Math.round(salesNeeded / daysRemaining) : salesNeeded;
              const dailyReserveTarget = daysRemaining > 0 ? Math.round(amountToCover / daysRemaining) : amountToCover;

              return (
                <div key={loan.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h4 className="font-bold text-white text-base">{loan.name}</h4>
                    <span className="text-xs font-semibold px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg">Margen Bruto: {margin}%</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">Faltante Próxima Cuota</p>
                      <p className="text-xl font-bold text-amber-400 mt-1">${amountToCover.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">Ventas Necesarias para Cubrir</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">${salesNeeded.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">🎯 Objetivo Diario de Ventas</p>
                      <p className="text-xl font-bold text-white mt-1">${dailySalesTarget.toLocaleString()} /día</p>
                    </div>
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">💰 Reserva Diaria Necesaria</p>
                      <p className="text-xl font-bold text-blue-400 mt-1">${dailyReserveTarget.toLocaleString()} /día</p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>Para cubrir la cuota de ${nextInst?.amount.toLocaleString()} con un margen bruto del {margin}%, el negocio necesita generar $<strong>{salesNeeded.toLocaleString()}</strong> en ventas totales.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: OBLIGACIONES FUTURAS (MATRIZ POR MES) */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Matriz Consolidada de Obligaciones Futuras (Próximos Meses)</h3>
            <p className="text-xs text-slate-400">Planificación mensual consolidada para saber exactamente cuánto dinero necesita generar el negocio.</p>
            
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Mes / Período</th>
                    {loans.map((l) => (
                      <th key={l.id} className="p-3">{l.name}</th>
                    ))}
                    <th className="p-3 text-right font-bold text-amber-400">Total Mensual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {['Octubre 2026', 'Noviembre 2026', 'Diciembre 2026', 'Enero 2027', 'Febrero 2027', 'Marzo 2027'].map((month, idx) => {
                    let monthTotal = 0;
                    return (
                      <tr key={month} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{month}</td>
                        {loans.map((loan) => {
                          const inst = loan.schedule[idx];
                          const amt = inst ? inst.amount : 0;
                          monthTotal += amt;
                          return (
                            <td key={loan.id} className="p-3 text-slate-300">
                              {amt > 0 ? `$${amt.toLocaleString()}` : '$0'}
                            </td>
                          );
                        })}
                        <td className="p-3 text-right font-black text-amber-400">${monthTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PROYECCIÓN 12 MESES & STOCK */}
      {activeTab === 'projection' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6">
            <h3 className="text-base font-bold text-white">Control del Uso del Capital del Préstamo (Stock)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loans.map((loan) => {
                const remainingStockCapital = loan.receivedAmount - loan.stockPurchasesSpent;
                const pctSpent = Math.round((loan.stockPurchasesSpent / loan.receivedAmount) * 100);
                return (
                  <div key={loan.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
                    <h4 className="font-bold text-white text-sm">{loan.name}</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capital Recibido:</span>
                        <span className="font-bold text-white">${loan.receivedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inversión en Stock:</span>
                        <span className="font-bold text-emerald-400">${loan.stockPurchasesSpent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Disponible para Stock:</span>
                        <span className="font-bold text-amber-400">${remainingStockCapital.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pctSpent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO PRÉSTAMO */}
      {isNewLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-amber-400" />
                <span>Registrar Nuevo Préstamo / Financiación</span>
              </h3>
              <button onClick={() => setIsNewLoanModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Préstamo</label>
                  <input
                    type="text"
                    required
                    value={newLoanForm.name}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, name: e.target.value })}
                    placeholder="Ej. Préstamo Banco Nación Stock"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Entidad / Persona Prestamista</label>
                  <input
                    type="text"
                    required
                    value={newLoanForm.creditor}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, creditor: e.target.value })}
                    placeholder="Ej. Banco Nación"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Capital Recibido ($)</label>
                  <input
                    type="number"
                    required
                    value={newLoanForm.receivedAmount}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, receivedAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cantidad de Cuotas</label>
                  <input
                    type="number"
                    required
                    value={newLoanForm.installmentsCount}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, installmentsCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Importe por Cuota ($)</label>
                  <input
                    type="number"
                    required
                    value={newLoanForm.installmentAmount}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, installmentAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fecha 1ra Cuota</label>
                  <input
                    type="date"
                    required
                    value={newLoanForm.firstDueDate}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, firstDueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Destino del Préstamo</label>
                  <select
                    value={newLoanForm.destination}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, destination: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="stock">Compra de Stock</option>
                    <option value="reforma">Reforma / Local</option>
                    <option value="equipamiento">Equipamiento</option>
                    <option value="capital_trabajo">Capital de Trabajo</option>
                    <option value="distribuidora">Distribuidora</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Margen Bruto Estimado (%)</label>
                  <input
                    type="number"
                    value={newLoanForm.grossMarginPercent}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, grossMarginPercent: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observaciones</label>
                <textarea
                  value={newLoanForm.notes}
                  onChange={(e) => setNewLoanForm({ ...newLoanForm, notes: e.target.value })}
                  placeholder="Notas y condiciones adicionales..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewLoanModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Crear Préstamo y Cronograma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APORTAR AL FONDO DE RESERVA */}
      {isContributionModalOpen && targetLoanForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Aportar al Fondo de Reserva</h3>
            <p className="text-xs text-slate-400">Préstamo: <strong className="text-white">{targetLoanForAction.name}</strong></p>

            <form onSubmit={handleAddContributionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monto a Reservar ($)</label>
                <input
                  type="number"
                  required
                  value={contribAmount}
                  onChange={(e) => setContribAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descripción / Origen</label>
                <input
                  type="text"
                  required
                  value={contribDesc}
                  onChange={(e) => setContribDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContributionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAGAR CUOTA */}
      {isPayModalOpen && targetLoanForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Pagar Cuota #{targetInstallmentNum}</h3>
            <p className="text-xs text-slate-400">{targetLoanForAction.name}</p>

            <form onSubmit={handlePayInstallmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Medio de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="cash">Efectivo (Caja)</option>
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="check">Cheque</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Registrar Pago de Cuota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONTROL DE STOCK SPENT */}
      {isStockSpentModalOpen && targetLoanForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Actualizar Inversión en Stock</h3>
            <p className="text-xs text-slate-400">Préstamo: {targetLoanForAction.name} (Recibido: ${targetLoanForAction.receivedAmount.toLocaleString()})</p>

            <form onSubmit={handleUpdateStockSpentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Total Gastado en Compras de Stock ($)</label>
                <input
                  type="number"
                  required
                  value={stockSpentVal}
                  onChange={(e) => setStockSpentVal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStockSpentModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
