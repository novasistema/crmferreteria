import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FixedExpense, PaymentMethod } from '../../types';
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Building2,
  Users,
  Zap,
  Flame,
  Droplets,
  Calculator,
  Receipt,
  FileText,
  Shield,
  Megaphone,
  Wrench,
  Wifi,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building,
} from 'lucide-react';

export const FixedExpensesView: React.FC = () => {
  const { store, showToast, triggerRefresh } = useApp();

  // Selected period state (default to Sep 2026 or current)
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [payExpenseModalItem, setPayExpenseModalItem] = useState<FixedExpense | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    amount: number | string;
    dueDay: number | string;
    frequency: 'monthly' | 'bimonthly' | 'annual';
    active: boolean;
    paymentMethod: string;
    isCalculatedFromPersonnel: boolean;
    iconType: string;
    notes: string;
  }>({
    name: '',
    category: 'Luz / Servicios',
    amount: '',
    dueDay: 1,
    frequency: 'monthly',
    active: true,
    paymentMethod: 'cash',
    isCalculatedFromPersonnel: false,
    iconType: 'dollar',
    notes: '',
  });

  // Pay modal state
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payBoxId, setPayBoxId] = useState<string>('mb-admin');
  const [payAmount, setPayAmount] = useState<number>(0);

  // Month names in Spanish
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  const fullMonthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // List of expenses from store
  const expenses = store.fixedExpenses || [];

  // KPIs Calculations
  const activeExpenses = useMemo(() => {
    return expenses.filter((e) => e.active);
  }, [expenses]);

  const totalMonthlyActive = useMemo(() => {
    return activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [activeExpenses]);

  const totalAnnualEstimated = useMemo(() => {
    return totalMonthlyActive * 12;
  }, [totalMonthlyActive]);

  // Format currency helper
  const formatMoney = (val: number) => {
    return val.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Helper to render icon based on iconType or name
  const renderExpenseIcon = (item: FixedExpense) => {
    const type = item.iconType?.toLowerCase() || '';
    const name = item.name.toLowerCase();

    if (type === 'dollar' || name.includes('internet') || name.includes('celular') || name.includes('telefono')) {
      return <DollarSign className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'building' || name.includes('alquiler') || name.includes('local') || name.includes('galpon')) {
      return <Building2 className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'users' || item.isCalculatedFromPersonnel || name.includes('empleado') || name.includes('sueldo') || name.includes('personal')) {
      return <Users className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'zap' || type === 'sun' || name.includes('luz') || name.includes('electric') || name.includes('energia')) {
      return <Zap className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'flame' || name.includes('gas')) {
      return <Flame className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'droplet' || name.includes('agua') || name.includes('coop')) {
      return <Droplets className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'calculator' || name.includes('contador') || name.includes('honorario') || name.includes('estudio')) {
      return <Calculator className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'receipt' || name.includes('impuesto') || name.includes('muni') || name.includes('tasa') || name.includes('afip') || name.includes('rentas')) {
      return <Receipt className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'shield' || name.includes('seguro')) {
      return <Shield className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'megaphone' || name.includes('publicidad') || name.includes('marketing')) {
      return <Megaphone className="w-5 h-5 text-orange-500" />;
    }
    if (type === 'wrench' || name.includes('mantenimiento')) {
      return <Wrench className="w-5 h-5 text-orange-500" />;
    }

    return <DollarSign className="w-5 h-5 text-orange-500" />;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      name: '',
      category: 'Luz / Servicios',
      amount: '',
      dueDay: 1,
      frequency: 'monthly',
      active: true,
      isCalculatedFromPersonnel: false,
      iconType: 'dollar',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      category: expense.category || 'Otro',
      amount: expense.amount,
      dueDay: expense.dueDay || 1,
      frequency: expense.frequency || 'monthly',
      active: expense.active,
      paymentMethod: expense.paymentMethod || 'cash',
      isCalculatedFromPersonnel: !!expense.isCalculatedFromPersonnel,
      iconType: expense.iconType || 'dollar',
      notes: expense.notes || '',
    });
    setIsModalOpen(true);
  };

  // Toggle active switch
  const handleToggleActive = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const result = store.toggleFixedExpenseActive(id);
    showToast(result ? 'Gasto activado' : 'Gasto pausado / desactivado', 'info');
    triggerRefresh();
  };

  // Handle Save (Create or Update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Por favor ingrese un nombre para el gasto', 'error');
      return;
    }

    const numAmount = Number(formData.amount) || 0;
    const numDueDay = Math.min(31, Math.max(1, Number(formData.dueDay) || 1));

    const expensePayload: FixedExpense = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category as any,
      amount: numAmount,
      dueDay: numDueDay,
      frequency: formData.frequency,
      active: formData.active,
      paymentMethod: formData.paymentMethod,
      isCalculatedFromPersonnel: formData.isCalculatedFromPersonnel,
      iconType: formData.iconType,
      notes: formData.notes.trim(),
      lastPaidMonth: editingExpense?.lastPaidMonth,
    };

    store.saveFixedExpense(expensePayload);
    showToast(editingExpense ? 'Gasto actualizado con éxito' : 'Gasto fijo agregado con éxito', 'success');
    setIsModalOpen(false);
    triggerRefresh();
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    const success = store.deleteFixedExpense(id);
    if (success) {
      showToast('Gasto fijo eliminado', 'info');
      setDeleteConfirmId(null);
      triggerRefresh();
    }
  };

  // Sync with employee salaries
  const handleSyncEmployees = () => {
    const totalPayroll = store.employees
      .filter((emp) => emp.active)
      .reduce((sum, emp) => sum + (emp.baseSalary || 0), 0);

    setFormData((prev) => ({
      ...prev,
      amount: totalPayroll > 0 ? totalPayroll : 1800000,
      isCalculatedFromPersonnel: true,
      iconType: 'users',
    }));
    showToast(`Monto sincronizado con la nómina de sueldos ($ ${formatMoney(totalPayroll > 0 ? totalPayroll : 1800000)})`, 'success');
  };

  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState('Luz / Servicios');
  const [quickAmount, setQuickAmount] = useState<number | ''>('');
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<PaymentMethod>('cash');
  const [quickBoxId, setQuickBoxId] = useState<string>('mb-admin');

  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickAmount || Number(quickAmount) <= 0) {
      showToast('Por favor ingrese el nombre y monto del gasto', 'error');
      return;
    }
    const newExpense: FixedExpense = {
      id: `exp-${Date.now()}`,
      name: quickName.trim(),
      category: quickCategory as any,
      amount: Number(quickAmount),
      dueDay: new Date().getDate(),
      frequency: 'monthly',
      active: true,
      iconType: 'dollar',
      notes: `Pagado vía ${quickPaymentMethod}`,
    };
    store.saveFixedExpense(newExpense);
    showToast(`Gasto "${quickName}" registrado correctamente`, 'success');
    setQuickName('');
    setQuickAmount('');
    triggerRefresh();
  };

  return (
    <div id="fixed-expenses-view" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Gastos y Pagos</h1>
            <p className="text-sm text-slate-500">Registro rápido de gastos con formas de pago y control de cuentas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-add-fixed-expense"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Gasto Avanzado</span>
          </button>
        </div>
      </div>

      {/* QUICK EXPENSE REGISTRATION CARD (Prominently displayed first as requested) */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-white/25 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Registrar Gasto Rápido
          </span>
          <span className="text-xs text-orange-100 font-medium">Anota un nuevo gasto al instante con su forma de pago</span>
        </div>
        <form onSubmit={handleQuickRegister} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-orange-100 mb-1">Concepto / Nombre *</label>
            <input
              type="text"
              required
              placeholder="ej. Luz, Alquiler, Insumos..."
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-orange-100 mb-1">Categoría</label>
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-amber-300"
            >
              <option value="Luz / Servicios">Luz / Servicios</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Personal / Sueldos">Personal / Sueldos</option>
              <option value="Impuestos / AFIP">Impuestos / AFIP</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-orange-100 mb-1">Monto ($) *</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              placeholder="0.00"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 rounded-xl font-medium font-mono focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-orange-100 mb-1">Forma de Pago</label>
            <select
              value={quickPaymentMethod}
              onChange={(e) => setQuickPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 rounded-xl font-medium focus:ring-2 focus:ring-amber-300"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia Bancaria</option>
              <option value="debit">Tarjeta de Débito</option>
              <option value="credit">Tarjeta de Crédito</option>
              <option value="mercado_pago">Mercado Pago</option>
              <option value="account">Cuenta Corriente</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black px-4 py-2 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Gasto
            </button>
          </div>
        </form>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {/* Card 1: Total mensual (activos) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1.5">Total mensual (activos)</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-orange-500 tracking-tight">
            $ {formatMoney(totalMonthlyActive)}
          </p>
        </div>

        {/* Card 2: Gastos activos */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1.5">Gastos activos</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeExpenses.length}
          </p>
        </div>

        {/* Card 3: Total anual estimado */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1.5">Total anual estimado</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            $ {formatMoney(totalAnnualEstimated)}
          </p>
        </div>
      </div>

      {/* Main Expenses Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Detalle — {monthNames[selectedMonth]} {selectedYear}
            </h2>
          </div>

          {/* Month selector navigation */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear((y) => y - 1);
                } else {
                  setSelectedMonth((m) => m - 1);
                }
              }}
              className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-slate-700 px-2">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear((y) => y + 1);
                } else {
                  setSelectedMonth((m) => m + 1);
                }
              }}
              className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No hay gastos fijos configurados</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Carga tus gastos recurrentes mensuales (luz, alquiler, sueldos, internet, etc.) para proyectar tus finanzas.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar primer gasto</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((expense) => {
              return (
                <div
                  key={expense.id}
                  id={`expense-row-${expense.id}`}
                  className={`p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    expense.active ? 'hover:bg-slate-50/70' : 'bg-slate-50/40 opacity-70 hover:opacity-90'
                  }`}
                >
                  {/* Left: Icon, Name, Badges */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icon container */}
                    <div className="w-10 h-10 rounded-xl bg-orange-50/90 border border-orange-100/90 flex items-center justify-center shrink-0 shadow-2xs">
                      {renderExpenseIcon(expense)}
                    </div>

                    {/* Name and Badges */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-800 text-base truncate">
                        {expense.name}
                      </span>

                      {/* Badge: calculado de personal */}
                      {expense.isCalculatedFromPersonnel && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200/70 shrink-0">
                          <Users className="w-3 h-3" />
                          <span>calculado de personal</span>
                        </span>
                      )}

                      {/* Badge: vence día X */}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/70 shrink-0">
                        vence día {expense.dueDay || 1}
                      </span>
                    </div>
                  </div>

                  {/* Right: Amount, subtext, active toggle switch, edit, delete buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 pl-13 sm:pl-0">
                    {/* Amount & due text */}
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                        $ {formatMoney(Number(expense.amount) || 0)}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        dia {expense.dueDay || 1} c/mes
                      </p>
                    </div>

                    {/* Controls (Toggle Switch, Edit, Delete) */}
                    <div className="flex items-center gap-2">
                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={expense.active}
                        onClick={(e) => handleToggleActive(expense.id, e)}
                        title={expense.active ? 'Desactivar gasto' : 'Activar gasto'}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          expense.active ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            expense.active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(expense)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar gasto fijo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteConfirmId(expense.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar gasto fijo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Card Footer with Bottom-Right Summary Badge */}
        {expenses.length > 0 && (
          <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Mostrando {expenses.length} gastos fijos configurados ({activeExpenses.length} activos)
            </div>

            {/* Bottom-right amber summary badge matching screenshot */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl px-5 py-3 text-right shadow-2xs">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total activos / mes</p>
              <p className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight">
                $ {formatMoney(totalMonthlyActive)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Agregar / Editar Gasto Fijo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingExpense ? 'Editar Gasto Fijo' : 'Agregar Nuevo Gasto Fijo'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure los detalles del gasto recurrente mensual</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre del Gasto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Internet/celulares, Alquiler, Luz, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 transition"
                />
              </div>

              {/* Categoría & Frecuencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 bg-white transition"
                  >
                    <option value="Luz / Servicios">Luz / Servicios</option>
                    <option value="Alquiler">Alquiler</option>
                    <option value="Sueldos">Sueldos y Cargas</option>
                    <option value="Impuestos">Impuestos & Tasas</option>
                    <option value="Honorarios Profesionales">Honorarios Profesionales</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Seguros">Seguros</option>
                    <option value="Publicidad">Publicidad & Marketing</option>
                    <option value="Comunicaciones">Comunicaciones</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Frecuencia
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 bg-white transition"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
              </div>

              {/* Monto & Día de Vencimiento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Monto Mensual ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Día de Vencimiento (1 - 31)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">Día</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dueDay}
                      onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ícono Representativo
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[
                    { id: 'dollar', label: 'Dólar/General', icon: DollarSign },
                    { id: 'building', label: 'Inmueble/Local', icon: Building2 },
                    { id: 'users', label: 'Personal/Sueldos', icon: Users },
                    { id: 'zap', label: 'Luz/Energía', icon: Zap },
                    { id: 'flame', label: 'Gas', icon: Flame },
                    { id: 'droplet', label: 'Agua', icon: Droplets },
                    { id: 'calculator', label: 'Contador', icon: Calculator },
                    { id: 'receipt', label: 'Impuestos', icon: Receipt },
                  ].map((ic) => {
                    const IconComp = ic.icon;
                    const isSelected = formData.iconType === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, iconType: ic.id })}
                        title={ic.label}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-600 shadow-sm ring-2 ring-orange-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Switches: Calculado de personal & Activo */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                {/* Switch: Calculado de personal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Calcular desde nómina de empleados</p>
                      <p className="text-[11px] text-slate-500">Muestra el badge "calculado de personal"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.isCalculatedFromPersonnel && (
                      <button
                        type="button"
                        onClick={handleSyncEmployees}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        Sincronizar
                      </button>
                    )}
                    <input
                      type="checkbox"
                      id="chk-personnel"
                      checked={formData.isCalculatedFromPersonnel}
                      onChange={(e) => setFormData({ ...formData, isCalculatedFromPersonnel: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Switch: Gasto Activo */}
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Estado del Gasto</p>
                    <p className="text-[11px] text-slate-500">Los gastos activos se suman al total mensual</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notas u Observaciones (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Número de cliente, débito automático, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 transition"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {editingExpense ? 'Guardar Cambios' : 'Crear Gasto Fijo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">¿Eliminar gasto fijo?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Esta acción eliminará el gasto de la lista recurrente. Podrá volver a crearlo en cualquier momento.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
