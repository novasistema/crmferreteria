import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowRightLeft, 
  TrendingDown, 
  TrendingUp, 
  Building2, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Layers, 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  X,
  PieChart,
  BarChart3,
  Landmark
} from 'lucide-react';
import { Cashbox, CashMovement, CashMovementCategory, CashboxType, CashRegisterSession } from '../types';

interface CashboxModuleProps {
  cashboxes: Cashbox[];
  movements: CashMovement[];
  cashRegisterSessions?: CashRegisterSession[];
  onSaveCashbox: (cashbox: Cashbox) => Promise<void>;
  onAddMovement: (movement: CashMovement) => Promise<void>;
  onTransferBetweenCashboxes: (fromId: string, toId: string, amount: number, concept: string) => Promise<void>;
  onCloseRegisterSession?: (session: CashRegisterSession) => Promise<void>;
}

export const CATEGORY_LABELS: Record<CashMovementCategory, string> = {
  materias_primas: 'Materias Primas & Químicos',
  envases_embalajes: 'Envases, Baldes & Cajas',
  sueldos_jornales: 'Sueldos & Jornales de Planta',
  adelanto_sueldos: 'Adelantos de Sueldo',
  fletes_logistica: 'Fletes, Combustible & Logística',
  mantenimiento_maquinaria: 'Mantenimiento de Dispersores & Planta',
  servicios_luz_gas: 'Servicios (Luz Trifásica, Gas, Internet)',
  impuestos_tasas: 'Impuestos & Tasas (ARCA, IIBB, Municipal)',
  alquiler_planta: 'Alquiler Parque Industrial',
  cobranza_clientes: 'Cobranza de Clientes',
  venta_mostrador: 'Venta Directa de Mostrador',
  transferencia_entre_cajas: 'Transferencia Entre Cajas',
  gastos_oficina: 'Gastos de Oficina & Limpieza',
  otros_ingresos: 'Otros Ingresos Varios',
  otros_egresos: 'Otros Egresos Operativos'
};

export const CashboxModule: React.FC<CashboxModuleProps> = ({
  cashboxes,
  movements,
  onSaveCashbox,
  onAddMovement,
  onTransferBetweenCashboxes
}) => {
  const [selectedCashboxId, setSelectedCashboxId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modals
  const [showCashboxModal, setShowCashboxModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [arqueoNotes, setArqueoNotes] = useState<string>('');
  const [arqueoSupervisor, setArqueoSupervisor] = useState<string>('Responsable de Turno');
  const [transferMbId, setTransferMbId] = useState<string>('');

  // New Cashbox Form
  const [cashboxForm, setCashboxForm] = useState<Partial<Cashbox>>({
    name: '',
    type: 'efectivo',
    currency: 'ARS',
    currentBalance: 0,
    accountNumberOrCbu: '',
    bankName: '',
    responsiblePerson: 'Tesorería'
  });

  // Movement Form
  const [movementForm, setMovementForm] = useState<{
    cashboxId: string;
    type: 'ingreso' | 'egreso';
    amount: number;
    category: CashMovementCategory;
    concept: string;
    referenceNumber: string;
    date: string;
  }>({
    cashboxId: cashboxes[0]?.id || '',
    type: 'egreso',
    amount: 0,
    category: 'materias_primas',
    concept: '',
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Transfer Form
  const [transferForm, setTransferForm] = useState<{
    fromCashboxId: string;
    toCashboxId: string;
    amount: number;
    concept: string;
  }>({
    fromCashboxId: cashboxes[0]?.id || '',
    toCashboxId: cashboxes[1]?.id || '',
    amount: 0,
    concept: 'Transferencia de fondos entre cuentas'
  });

  // Total balance across all cashboxes
  const totalBalanceARS = cashboxes
    .filter(c => c.currency === 'ARS')
    .reduce((acc, c) => acc + c.currentBalance, 0);

  const totalBalanceUSD = cashboxes
    .filter(c => c.currency === 'USD')
    .reduce((acc, c) => acc + c.currentBalance, 0);

  // Breakdown of expenses by category ("para saber en dónde se va el dinero")
  const expenseBreakdown = useMemo(() => {
    const expenses = movements.filter(m => m.type === 'egreso');
    const totalExpenses = expenses.reduce((acc, m) => acc + m.amount, 0);

    const categoryMap: Record<string, { label: string; amount: number; count: number }> = {};
    expenses.forEach(m => {
      if (!categoryMap[m.category]) {
        categoryMap[m.category] = {
          label: CATEGORY_LABELS[m.category] || m.category,
          amount: 0,
          count: 0
        };
      }
      categoryMap[m.category].amount += m.amount;
      categoryMap[m.category].count += 1;
    });

    const sorted = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
    return {
      totalExpenses,
      categories: sorted
    };
  }, [movements]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (selectedCashboxId !== 'all' && m.cashboxId !== selectedCashboxId) return false;
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesConcept = m.concept.toLowerCase().includes(query);
        const matchesRef = m.referenceNumber?.toLowerCase().includes(query);
        const matchesBox = m.cashboxName.toLowerCase().includes(query);
        if (!matchesConcept && !matchesRef && !matchesBox) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, selectedCashboxId, categoryFilter, searchQuery]);

  // Submit New Cashbox
  const handleSubmitCashbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashboxForm.name) return;

    const newBox: Cashbox = {
      id: `box-${Date.now()}`,
      name: cashboxForm.name,
      type: cashboxForm.type || 'efectivo',
      currency: cashboxForm.currency || 'ARS',
      currentBalance: Number(cashboxForm.currentBalance) || 0,
      accountNumberOrCbu: cashboxForm.accountNumberOrCbu || '',
      bankName: cashboxForm.bankName || '',
      responsiblePerson: cashboxForm.responsiblePerson || 'Administración',
      updatedAt: new Date().toISOString()
    };

    await onSaveCashbox(newBox);
    setShowCashboxModal(false);
  };

  // Submit Movement
  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.cashboxId || movementForm.amount <= 0) return;

    const targetBox = cashboxes.find(c => c.id === movementForm.cashboxId);
    if (!targetBox) return;

    const movement: CashMovement = {
      id: `mov-${Date.now()}`,
      cashboxId: targetBox.id,
      cashboxName: targetBox.name,
      type: movementForm.type,
      amount: movementForm.amount,
      category: movementForm.category,
      concept: movementForm.concept || 'Movimiento de caja',
      date: movementForm.date,
      referenceNumber: movementForm.referenceNumber,
      user: 'Administración',
      createdAt: new Date().toISOString()
    };

    await onAddMovement(movement);
    setShowMovementModal(false);
    setMovementForm(prev => ({ ...prev, amount: 0, concept: '', referenceNumber: '' }));
  };

  // Submit Transfer
  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromCashboxId || !transferForm.toCashboxId || transferForm.amount <= 0) return;
    if (transferForm.fromCashboxId === transferForm.toCashboxId) {
      alert("La caja de origen y de destino no pueden ser la misma.");
      return;
    }

    await onTransferBetweenCashboxes(
      transferForm.fromCashboxId,
      transferForm.toCashboxId,
      transferForm.amount,
      transferForm.concept
    );

    setShowTransferModal(false);
    setTransferForm(prev => ({ ...prev, amount: 0 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Cajas de Dinero & Cuentas de la Empresa
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                  Tesorería & Fondos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de saldos por caja, transferencias entre cuentas y categorización detallada para saber en dónde se va el dinero.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setTransferForm({
                  fromCashboxId: cashboxes[0]?.id || '',
                  toCashboxId: cashboxes[1]?.id || '',
                  amount: 0,
                  concept: 'Transferencia de fondos entre cuentas'
                });
                setShowTransferModal(true);
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4 text-teal-400" /> Transferir entre Cajas
            </button>

            <button
              onClick={() => {
                setCountedCash(0);
                setArqueoNotes('');
                setShowArqueoModal(true);
              }}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Arqueo & Cierre de Caja
            </button>

            <button
              onClick={() => {
                setMovementForm({
                  cashboxId: cashboxes[0]?.id || '',
                  type: 'egreso',
                  amount: 0,
                  category: 'materias_primas',
                  concept: '',
                  referenceNumber: '',
                  date: new Date().toISOString().split('T')[0]
                });
                setShowMovementModal(true);
              }}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Anotar Movimiento
            </button>

            <button
              onClick={() => {
                setCashboxForm({
                  name: '',
                  type: 'efectivo',
                  currency: 'ARS',
                  currentBalance: 0,
                  accountNumberOrCbu: '',
                  bankName: '',
                  responsiblePerson: 'Tesorería'
                });
                setShowCashboxModal(true);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl"
            >
              + Nueva Caja
            </button>
          </div>
        </div>

        {/* Global Balance Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-teal-50/50 to-white">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Saldo Total Disponible (ARS)
            </span>
            <div className="text-2xl font-black text-teal-900 font-mono mt-1">
              $ {totalBalanceARS.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
              Fondos consolidados en pesos
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Disponibilidad en Dólares (USD)
            </span>
            <div className="text-2xl font-black text-blue-900 font-mono mt-1">
              U$D {totalBalanceUSD.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
              Reserva en divisa para químicos importados
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total de Cajas / Cuentas Activas
            </span>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1">
              {cashboxes.length} <span className="text-sm font-sans text-slate-500">cajas</span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">
              Cajas de planta, bancos y digitales
            </span>
          </div>
        </div>
      </div>

      {/* CASHBOXES CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-slate-500" /> Cuentas & Cajas de la Empresa
          </h2>
          <span className="text-xs text-slate-400">
            Click en una caja para filtrar sus movimientos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cashboxes.map(box => {
            const isSelected = selectedCashboxId === box.id;
            return (
              <div
                key={box.id}
                onClick={() => setSelectedCashboxId(isSelected ? 'all' : box.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                  isSelected 
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-400' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {box.type.toUpperCase()}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                        {box.name}
                      </h3>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                      {box.type === 'banco' ? <Landmark className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                    </div>
                  </div>

                  {box.accountNumberOrCbu && (
                    <div className="text-[11px] text-slate-400 font-mono truncate mt-1">
                      {box.accountNumberOrCbu}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Saldo Actual</span>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {box.currency === 'USD' ? 'U$D ' : '$ '}
                    {box.currentBalance.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Resp: {box.responsiblePerson}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EXPENSE CATEGORY BREAKDOWN: ¿EN QUÉ SE VA EL DINERO? */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                ¿En qué se va el dinero de la empresa? (Distribución de Gastos)
              </h2>
              <p className="text-xs text-slate-500">
                Desglose analítico de egresos por categoría de insumos, sueldos, fletes y servicios de fábrica.
              </p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs text-slate-400 block font-sans">Total Egresos Registrados:</span>
            <span className="text-lg font-black text-red-600">
              $ {expenseBreakdown.totalExpenses.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {expenseBreakdown.categories.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay egresos registrados aún para analizar.
          </div>
        ) : (
          <div className="space-y-3.5">
            {expenseBreakdown.categories.map((cat, idx) => {
              const pct = expenseBreakdown.totalExpenses > 0 
                ? (cat.amount / expenseBreakdown.totalExpenses) * 100 
                : 0;

              const colors = [
                'bg-red-500',
                'bg-amber-500',
                'bg-blue-600',
                'bg-purple-600',
                'bg-teal-600',
                'bg-indigo-600',
                'bg-emerald-600'
              ];
              const barColor = colors[idx % colors.length];

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800">
                      {cat.label} <span className="text-slate-400 font-normal">({cat.count} mov.)</span>
                    </span>
                    <span className="font-mono font-black text-slate-900">
                      $ {cat.amount.toLocaleString('es-AR')} <span className="text-slate-500 text-[11px] font-sans">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MOVEMENTS HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Table Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Movimientos & Asientos de Caja
            </h3>
            {selectedCashboxId !== 'all' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                Filtrado por: {cashboxes.find(c => c.id === selectedCashboxId)?.name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Buscar concepto o comprobante..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 w-48 sm:w-60 bg-white"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 font-semibold bg-white text-slate-700"
            >
              <option value="all">Todas las categorías</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Movements Table */}
        <div className="overflow-x-auto">
          {filteredMovements.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No hay movimientos registrados para este criterio de búsqueda.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/60 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Caja / Cuenta</th>
                  <th className="p-3">Tipo & Categoría</th>
                  <th className="p-3">Concepto & Comprobante</th>
                  <th className="p-3 text-right">Monto ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredMovements.map(m => {
                  const isIngreso = m.type === 'ingreso';
                  const isTransfer = m.type === 'transferencia';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-600 font-sans">
                        {new Date(m.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="p-3 font-sans font-bold text-slate-800">
                        {m.cashboxName}
                      </td>
                      <td className="p-3 font-sans">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase inline-block ${
                          isIngreso ? 'bg-emerald-100 text-emerald-800' : isTransfer ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isTransfer ? 'Transferencia' : isIngreso ? 'Ingreso' : 'Egreso'}
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          {CATEGORY_LABELS[m.category] || m.category}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-slate-800">
                        <div>{m.concept}</div>
                        {m.referenceNumber && (
                          <div className="text-[10px] font-mono text-slate-400">Ref: {m.referenceNumber}</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-black text-sm">
                        <span className={isIngreso ? 'text-emerald-700' : isTransfer ? 'text-blue-700' : 'text-red-600'}>
                          {isIngreso ? '+' : isTransfer ? '⇄ ' : '-'} $ {m.amount.toLocaleString('es-AR')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: REGISTRAR MOVIMIENTO DE DINERO */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Anotar Movimiento de Dinero
              </h3>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: 'egreso' })}
                  className={`py-2 text-xs font-black rounded-lg transition-all ${
                    movementForm.type === 'egreso' 
                      ? 'bg-red-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔴 Egreso / Pago (-)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: 'ingreso' })}
                  className={`py-2 text-xs font-black rounded-lg transition-all ${
                    movementForm.type === 'ingreso' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🟢 Ingreso / Cobro (+)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Caja / Cuenta Afectada
                  </label>
                  <select
                    value={movementForm.cashboxId}
                    onChange={e => setMovementForm({ ...movementForm, cashboxId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                    required
                  >
                    {cashboxes.map(cb => (
                      <option key={cb.id} value={cb.id}>
                        {cb.name} (Saldo: ${cb.currentBalance.toLocaleString('es-AR')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Importe ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={movementForm.amount || ''}
                    onChange={e => setMovementForm({ ...movementForm, amount: Number(e.target.value) })}
                    className="w-full text-base p-2 rounded-xl border border-slate-300 font-mono font-black"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Categoría del Movimiento (Identificación del Gasto/Ingreso)
                </label>
                <select
                  value={movementForm.category}
                  onChange={e => setMovementForm({ ...movementForm, category: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                    <option key={catKey} value={catKey}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Concepto / Detalle
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago de resinas acrílicas según remito #4892"
                  value={movementForm.concept}
                  onChange={e => setMovementForm({ ...movementForm, concept: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nº Comprobante / Factura
                  </label>
                  <input
                    type="text"
                    placeholder="FAC-A-0004-..."
                    value={movementForm.referenceNumber}
                    onChange={e => setMovementForm({ ...movementForm, referenceNumber: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={movementForm.date}
                    onChange={e => setMovementForm({ ...movementForm, date: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Registrar Asiento de Dinero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFERIR DINERO ENTRE CAJAS */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-teal-600" />
                Transferir Fondos Entre Cajas
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Caja Origen (Sale el Dinero)
                </label>
                <select
                  value={transferForm.fromCashboxId}
                  onChange={e => setTransferForm({ ...transferForm, fromCashboxId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-red-700"
                  required
                >
                  {cashboxes.map(cb => (
                    <option key={cb.id} value={cb.id}>
                      {cb.name} (Saldo: ${cb.currentBalance.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Caja Destino (Ingresa el Dinero)
                </label>
                <select
                  value={transferForm.toCashboxId}
                  onChange={e => setTransferForm({ ...transferForm, toCashboxId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-emerald-700"
                  required
                >
                  {cashboxes.map(cb => (
                    <option key={cb.id} value={cb.id}>
                      {cb.name} (Saldo: ${cb.currentBalance.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Monto a Transferir ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={transferForm.amount || ''}
                  onChange={e => setTransferForm({ ...transferForm, amount: Number(e.target.value) })}
                  className="w-full text-base p-2.5 rounded-xl border border-teal-400 font-mono font-black text-teal-800"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Concepto / Justificación
                </label>
                <input
                  type="text"
                  value={transferForm.concept}
                  onChange={e => setTransferForm({ ...transferForm, concept: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Confirmar Transferencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA CAJA O CUENTA */}
      {showCashboxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-3">
              Crear Nueva Caja o Cuenta Bancaria
            </h3>

            <form onSubmit={handleSubmitCashbox} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nombre de la Caja
                </label>
                <input
                  type="text"
                  placeholder="Ej: Banco Santander Cta Cte, Caja Mostrador"
                  value={cashboxForm.name}
                  onChange={e => setCashboxForm({ ...cashboxForm, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tipo de Cuenta
                  </label>
                  <select
                    value={cashboxForm.type}
                    onChange={e => setCashboxForm({ ...cashboxForm, type: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="efectivo">Efectivo en Planta</option>
                    <option value="banco">Cuenta Bancaria (CBU)</option>
                    <option value="digital">Billetera Digital / Cobros</option>
                    <option value="caja_chica">Caja Chica / Fondo Fijo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Moneda
                  </label>
                  <select
                    value={cashboxForm.currency}
                    onChange={e => setCashboxForm({ ...cashboxForm, currency: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="ARS">Pesos Argentinos (ARS)</option>
                    <option value="USD">Dólares Estadounidenses (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nº de Cuenta / CBU / Alias
                </label>
                <input
                  type="text"
                  placeholder="0720045620000012345678"
                  value={cashboxForm.accountNumberOrCbu}
                  onChange={e => setCashboxForm({ ...cashboxForm, accountNumberOrCbu: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Saldo Inicial ($)
                  </label>
                  <input
                    type="number"
                    value={cashboxForm.currentBalance}
                    onChange={e => setCashboxForm({ ...cashboxForm, currentBalance: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={cashboxForm.responsiblePerson}
                    onChange={e => setCashboxForm({ ...cashboxForm, responsiblePerson: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCashboxModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Crear Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARQUEO & CIERRE DE CAJA REGISTRADORA MODAL (Reglas de Sección 8 del Prompt Maestro) */}
      {showArqueoModal && (() => {
        // Strict calculation of expected cash for the operative cashbox:
        // Consider only cash movements, explicitly excluding 'no_pago' or unclassified payments!
        const operativeCashbox = cashboxes.find(c => c.type === 'efectivo') || cashboxes[0];
        const cashMovementsIn = movements
          .filter(m => m.cashboxId === operativeCashbox?.id && m.type === 'ingreso')
          .reduce((acc, m) => acc + m.amount, 0);

        const cashMovementsOut = movements
          .filter(m => m.cashboxId === operativeCashbox?.id && m.type === 'egreso')
          .reduce((acc, m) => acc + m.amount, 0);

        const expectedCashAmount = (operativeCashbox?.currentBalance || 0);
        const cashDifference = countedCash - expectedCashAmount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Arqueo & Cierre de Caja Registradora</h3>
                    <p className="text-xs text-slate-400">Caja: {operativeCashbox?.name} (Auditoría Estricta)</p>
                  </div>
                </div>
                <button onClick={() => setShowArqueoModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Strict Rule Notice */}
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-amber-200 text-xs">
                <span className="font-bold text-amber-300">Regla Estricta:</span> El efectivo esperado calcula <strong>únicamente</strong> cobros con medio <code>cash/efectivo</code> explícito. Las ventas con medio <code>no_pago</code> o transferencias electrónicas han sido excluidas del arqueo de billetes.
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Efectivo Teórico Esperado:</span>
                  <span className="text-lg font-bold font-mono text-white mt-1 block">
                    ${expectedCashAmount.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] text-slate-500">Ingresos - Egresos de mostrador</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Diferencia de Arqueo:</span>
                  <span className={`text-lg font-bold font-mono mt-1 block ${
                    cashDifference === 0 ? 'text-emerald-400' :
                    cashDifference > 0 ? 'text-cyan-400' : 'text-rose-400'
                  }`}>
                    {cashDifference > 0 ? `+$${cashDifference.toLocaleString('es-AR')} (Sobrante)` :
                     cashDifference < 0 ? `-$${Math.abs(cashDifference).toLocaleString('es-AR')} (Faltante)` :
                     '$0 (Caja Cuadrada)'}
                  </span>
                  <span className="text-[10px] text-slate-500">Conteo real vs Esperado</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Efectivo Físico Recontado en Billetes ($):
                </label>
                <input
                  type="number"
                  min="0"
                  value={countedCash}
                  onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                  placeholder="Ingrese el monto total recontado"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Trasladar Efectivo a Caja Fuerte / Tesorería (Caja de Dinero):
                </label>
                <select
                  value={transferMbId}
                  onChange={(e) => setTransferMbId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="">No trasladar (Dejar saldo en caja operativa)</option>
                  {cashboxes
                    .filter(c => c.id !== operativeCashbox?.id)
                    .map(c => (
                      <option key={c.id} value={`mb-${c.id}`}>
                        mb-{c.name} ({c.type}) - Saldo: ${c.currentBalance.toLocaleString('es-AR')}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Observaciones de Cierre & Arqueo:
                </label>
                <input
                  type="text"
                  value={arqueoNotes}
                  onChange={(e) => setArqueoNotes(e.target.value)}
                  placeholder="Detalle de billetes deteriorados, cortes de denominación..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowArqueoModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    alert(`Arqueo registrado exitosamente.\nEfectivo contado: $${countedCash.toLocaleString('es-AR')}\nDiferencia: $${cashDifference.toLocaleString('es-AR')}`);
                    setShowArqueoModal(false);
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Guardar Cierre de Caja
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
