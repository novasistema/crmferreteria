import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InternalInstallmentPlan, PaymentMethod, InstallmentRateOption } from '../../types';
import {
  CreditCard,
  AlertTriangle,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  Settings,
  Plus,
  Search,
  Printer,
  Trash2,
  MessageSquare,
  Package,
  FileText,
  X,
  Check,
  Building,
  User as UserIcon,
  ChevronDown,
  Info,
  ArrowRight,
  Receipt,
  Download,
  Share2,
} from 'lucide-react';

export const InternalInstallmentsView: React.FC = () => {
  const { store, currentUser, showToast } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'activos' | 'vencidos' | 'completados' | 'configuracion'>('activos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [selectedPlanForPrint, setSelectedPlanForPrint] = useState<InternalInstallmentPlan | null>(null);
  const [payingPlan, setPayingPlan] = useState<InternalInstallmentPlan | null>(null);
  const [payingInstallmentNumber, setPayingInstallmentNumber] = useState<number>(1);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payBoxId, setPayBoxId] = useState<string>('');
  const [planToDelete, setPlanToDelete] = useState<InternalInstallmentPlan | null>(null);
  const [whatsappPlan, setWhatsappPlan] = useState<InternalInstallmentPlan | null>(null);

  // New Plan form state
  const [selectedClientId, setSelectedClientId] = useState(store.clients[0]?.id || '');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [customConcept, setCustomConcept] = useState('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [planItems, setPlanItems] = useState<
    { productId?: string; productName: string; quantity: number; unitPrice: number; subtotal: number }[]
  >([]);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [interestPercent, setInterestPercent] = useState<number>(8);
  const [firstDueDate, setFirstDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [planNotes, setPlanNotes] = useState<string>('Plan de cuotas de la casa');

  // Config tab state
  const [configOptions, setConfigOptions] = useState<InstallmentRateOption[]>(
    store.installmentsConfig?.options || [
      { installments: 2, surchargePercent: 5.0, description: '2 cuotas' },
      { installments: 3, surchargePercent: 8.0, description: '3 cuotas' },
      { installments: 4, surchargePercent: 0.0, description: '4 cuotas' },
      { installments: 5, surchargePercent: 0.0, description: '5 cuotas' },
      { installments: 6, surchargePercent: 20.0, description: '6 cuotas' },
      { installments: 9, surchargePercent: 0.0, description: '9 cuotas' },
      { installments: 12, surchargePercent: 0.0, description: '12 cuotas' },
      { installments: 18, surchargePercent: 0.0, description: '18 cuotas' },
      { installments: 24, surchargePercent: 0.0, description: '24 cuotas' },
    ]
  );

  // Format currency ARS
  const formatMoney = (amount: number) => {
    return (
      '$' +
      amount.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  // Format Date DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR');
    } catch {
      return dateStr;
    }
  };

  // Check if a plan is overdue
  const isPlanOverdue = (plan: InternalInstallmentPlan) => {
    if (plan.status === 'completed' || plan.status === 'cancelled') return false;
    const today = new Date().toISOString().split('T')[0];
    return plan.schedule.some((s) => !s.isPaid && s.dueDate < today);
  };

  // Get next due installment
  const getNextDueInstallment = (plan: InternalInstallmentPlan) => {
    return plan.schedule.find((s) => !s.isPaid);
  };

  // KPI Calculations
  const activePlans = useMemo(() => {
    return store.installmentPlans.filter((p) => p.status === 'active');
  }, [store.installmentPlans]);

  const overduePlans = useMemo(() => {
    return activePlans.filter((p) => isPlanOverdue(p));
  }, [activePlans]);

  const completedPlans = useMemo(() => {
    return store.installmentPlans.filter((p) => p.status === 'completed');
  }, [store.installmentPlans]);

  const currentMonthDueTotal = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let total = 0;
    activePlans.forEach((plan) => {
      plan.schedule.forEach((s) => {
        if (!s.isPaid && s.dueDate.startsWith(currentYearMonth)) {
          total += s.amount;
        }
      });
    });
    return total;
  }, [activePlans]);

  const totalPendingBalance = useMemo(() => {
    let total = 0;
    activePlans.forEach((plan) => {
      plan.schedule.forEach((s) => {
        if (!s.isPaid) {
          total += s.amount;
        }
      });
    });
    return total;
  }, [activePlans]);

  // Tab Filtering
  const currentTabPlans = useMemo(() => {
    let plans: InternalInstallmentPlan[] = [];
    if (activeTab === 'activos') {
      plans = activePlans;
    } else if (activeTab === 'vencidos') {
      plans = overduePlans;
    } else if (activeTab === 'completados') {
      plans = completedPlans;
    }

    if (!searchTerm.trim()) return plans;
    const q = searchTerm.toLowerCase();
    return plans.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.clientTaxId.includes(q) ||
        p.items.some((it) => it.productName.toLowerCase().includes(q))
    );
  }, [activeTab, activePlans, overduePlans, completedPlans, searchTerm]);

  // Filtered Products for Search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return store.products.slice(0, 8);
    const q = productSearch.toLowerCase();
    return store.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [productSearch, store.products]);

  // Add product to items list
  const handleAddProduct = (prod: any) => {
    const existing = planItems.find((it) => it.productId === prod.id);
    if (existing) {
      setPlanItems(
        planItems.map((it) =>
          it.productId === prod.id
            ? { ...it, quantity: it.quantity + 1, subtotal: (it.quantity + 1) * it.unitPrice }
            : it
        )
      );
    } else {
      const price = prod.priceMinorista || prod.costPrice * 1.3 || 1000;
      setPlanItems([
        ...planItems,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          unitPrice: price,
          subtotal: price,
        },
      ]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  // Add custom concept
  const handleAddCustomConcept = () => {
    if (!customConcept.trim() || customPrice <= 0) {
      showToast('Ingresá una descripción y un precio válido', 'error');
      return;
    }
    setPlanItems([
      ...planItems,
      {
        productName: customConcept.trim().toUpperCase(),
        quantity: customQty > 0 ? customQty : 1,
        unitPrice: customPrice,
        subtotal: (customQty > 0 ? customQty : 1) * customPrice,
      },
    ]);
    setCustomConcept('');
    setCustomQty(1);
    setCustomPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setPlanItems(planItems.filter((_, idx) => idx !== index));
  };

  // Base Items Total
  const totalBasePrice = useMemo(() => {
    return planItems.reduce((acc, it) => acc + it.subtotal, 0);
  }, [planItems]);

  // Handle installments count change & auto-apply surcharge
  const handleSelectInstallmentsCount = (count: number) => {
    setInstallmentsCount(count);
    const opt = configOptions.find((o) => o.installments === count);
    if (opt) {
      setInterestPercent(opt.surchargePercent);
    }
  };

  // Open New Plan modal with initial values
  const handleOpenNewPlan = () => {
    setSelectedClientId(store.clients[0]?.id || '');
    setPlanItems([]);
    setDownPayment(0);
    handleSelectInstallmentsCount(3);
    setFirstDueDate(new Date().toISOString().split('T')[0]);
    setPlanNotes('Financiación propia de la casa');
    setIsNewPlanOpen(true);
  };

  // Create Plan
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (planItems.length === 0) {
      showToast('Agregá al menos un producto o concepto al plan', 'error');
      return;
    }
    if (!selectedClientId) {
      showToast('Seleccioná un cliente', 'error');
      return;
    }

    const plan = store.createInstallmentPlan({
      clientId: selectedClientId,
      items: planItems,
      totalCashPrice: totalBasePrice,
      downPayment,
      installmentsCount,
      interestRatePercent: interestPercent,
      firstDueDate,
      notes: planNotes,
      user: currentUser,
    });

    showToast(`Plan de cuotas ${plan.code} generado correctamente`, 'success');
    setIsNewPlanOpen(false);
    setSelectedPlanForPrint(plan);
  };

  // Pay Installment
  const handleConfirmPay = () => {
    if (!payingPlan) return;
    const success = store.payInstallment(
      payingPlan.id,
      payingInstallmentNumber,
      payMethod,
      currentUser,
      { boxId: payBoxId }
    );
    if (success) {
      showToast(`Cuota N° ${payingInstallmentNumber} cobrada con éxito`, 'success');
      setPayingPlan(null);
    } else {
      showToast('No se pudo registrar el cobro de la cuota', 'error');
    }
  };

  // Delete Plan
  const handleConfirmDelete = () => {
    if (!planToDelete) return;
    const success = store.deleteInstallmentPlan(planToDelete.id);
    if (success) {
      showToast(`Plan ${planToDelete.code} eliminado`, 'success');
      setPlanToDelete(null);
    } else {
      showToast('Error al eliminar el plan', 'error');
    }
  };

  // Save Surcharges Config
  const handleSaveConfig = () => {
    store.saveInstallmentsConfig({ options: configOptions });
    showToast('Configuración de recargos guardada correctamente', 'success');
  };

  // Update a single config option
  const handleUpdateConfigOption = (
    installments: number,
    field: 'surchargePercent' | 'description',
    value: any
  ) => {
    setConfigOptions(
      configOptions.map((opt) =>
        opt.installments === installments ? { ...opt, [field]: value } : opt
      )
    );
  };

  // WhatsApp reminder message
  const handleSendWhatsApp = (plan: InternalInstallmentPlan) => {
    const nextInst = getNextDueInstallment(plan);
    const client = store.clients.find((c) => c.id === plan.clientId);
    const phone = plan.clientPhone || client?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const message = `Hola *${plan.clientName}*, te recordamos desde *${
      store.settings.tradeName || 'Ferretería Bruzzone'
    }* que tu cuota N° ${nextInst ? nextInst.number : 1}/${plan.installmentsCount} del plan *${
      plan.code
    }* por un valor de *${formatMoney(
      nextInst ? nextInst.amount : plan.installmentAmount
    )}* vence el *${formatDate(
      nextInst ? nextInst.dueDate : ''
    )}*.\n\nPuedes abonarla en nuestro mostrador o por transferencia bancaria. ¡Muchas gracias!`;

    if (cleanPhone) {
      window.open(`https://wa.me/549${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard.writeText(message);
      showToast('Mensaje de recordatorio copiado al portapapeles (Cliente sin teléfono)', 'info');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-900 text-slate-100">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Cuotas Internas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Financiación propia para tus clientes.</p>
        </div>

        <button
          onClick={handleOpenNewPlan}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Plan</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Planes Activos */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-400 mb-2">
              <span>Planes Activos</span>
              <CreditCard className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400">{activePlans.length}</div>
          </div>

          {/* 2. Vencidos */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-400 mb-2">
              <span>Vencidos</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">{overduePlans.length}</div>
          </div>

          {/* 3. Este Mes */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-2">
              <span>Este Mes</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {formatMoney(currentMonthDueTotal)}
            </div>
          </div>

          {/* 4. Total Pendiente */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-2">
              <span>Total Pendiente</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {formatMoney(totalPendingBalance)}
            </div>
          </div>
        </div>

        {/* Tabs & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('activos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'activos'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Activos ({activePlans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('vencidos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'vencidos'
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Vencidos ({overduePlans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('completados')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'completados'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completados ({completedPlans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('configuracion')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'configuracion'
                  ? 'bg-slate-700 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuración</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'configuracion' && (
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente, concepto o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-1.5 border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Tab 1, 2, 3: Plans Table */}
        {activeTab !== 'configuracion' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Concepto</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Cuotas</th>
                    <th className="py-3 px-4 text-right">Valor Cuota</th>
                    <th className="py-3 px-4 text-center">Pagadas</th>
                    <th className="py-3 px-4">Próx. Vto.</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {currentTabPlans.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No hay planes registrados en esta sección.
                      </td>
                    </tr>
                  ) : (
                    currentTabPlans.map((plan) => {
                      const paidCount = plan.schedule.filter((s) => s.isPaid).length;
                      const nextInst = getNextDueInstallment(plan);
                      const isOverdue = isPlanOverdue(plan);
                      const isCompleted = plan.status === 'completed' || paidCount === plan.installmentsCount;

                      const conceptText =
                        plan.items.length > 0
                          ? plan.items
                              .map((it) => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.productName}`)
                              .join(', ')
                          : 'Financiación directa';

                      return (
                        <tr
                          key={plan.id}
                          className="hover:bg-slate-800/40 transition group font-medium"
                        >
                          {/* Cliente */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white uppercase text-xs">
                              {plan.clientName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {plan.code} • {plan.clientTaxId || 'Consumidor Final'}
                            </div>
                          </td>

                          {/* Concepto */}
                          <td className="py-3.5 px-4 max-w-[200px] truncate" title={conceptText}>
                            <span className="text-slate-300 uppercase text-[11px] font-semibold block truncate">
                              {conceptText}
                            </span>
                          </td>

                          {/* Total */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                            {formatMoney(plan.totalFinancedWithInterest)}
                          </td>

                          {/* Cuotas */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                            {plan.installmentsCount}
                          </td>

                          {/* Valor Cuota */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-400">
                            {formatMoney(plan.installmentAmount)}
                          </td>

                          {/* Pagadas */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span
                              className={
                                isCompleted
                                  ? 'text-emerald-400'
                                  : paidCount > 0
                                  ? 'text-blue-400'
                                  : 'text-slate-400'
                              }
                            >
                              {paidCount}/{plan.installmentsCount}
                            </span>
                          </td>

                          {/* Próx. Vto. */}
                          <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                            {nextInst ? (
                              <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                                {formatDate(nextInst.dueDate)}
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Al día</span>
                            )}
                          </td>

                          {/* Estado Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {isCompleted ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Completado
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                Vencido
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                                Activo
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Cobrar */}
                              {!isCompleted && (
                                <button
                                  onClick={() => {
                                    setPayingPlan(plan);
                                    setPayingInstallmentNumber(nextInst ? nextInst.number : 1);
                                    setPayMethod('cash');
                                    setPayBoxId(store.cashRegisters[0]?.id || '');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Cobrar Cuota"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Cobrar</span>
                                </button>
                              )}

                              {/* Imprimir Contrato / Detalle */}
                              <button
                                onClick={() => setSelectedPlanForPrint(plan)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                                title="Imprimir Plan / Contrato"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* WhatsApp Reminder */}
                              <button
                                onClick={() => handleSendWhatsApp(plan)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-300 border border-slate-700 transition cursor-pointer"
                                title="Recordatorio por WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Eliminar Plan */}
                              <button
                                onClick={() => setPlanToDelete(plan)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition cursor-pointer"
                                title="Eliminar Plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Configuración (Recargos por cantidad de cuotas) */}
        {activeTab === 'configuracion' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 max-w-4xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Recargos por cantidad de cuotas
                </h3>
                <p className="text-xs text-slate-400">
                  Establecé el porcentaje de recargo automático y la descripción según la cantidad de cuotas.
                </p>
              </div>
            </div>

            {/* List of Surcharge Tiers */}
            <div className="divide-y divide-slate-800">
              {configOptions.map((opt) => (
                <div
                  key={opt.installments}
                  className="py-3 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="w-28 font-bold text-white text-sm">
                    {opt.installments} cuotas
                  </div>

                  <div className="flex items-center gap-4 flex-1">
                    {/* % Recargo Input */}
                    <div className="w-36">
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        % Recargo
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={opt.surchargePercent}
                          onChange={(e) =>
                            handleUpdateConfigOption(
                              opt.installments,
                              'surchargePercent',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-slate-800 text-white font-mono text-xs rounded-xl px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Descripción Input */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={opt.description}
                        onChange={(e) =>
                          handleUpdateConfigOption(
                            opt.installments,
                            'description',
                            e.target.value
                          )
                        }
                        className="w-full bg-slate-800 text-white text-xs rounded-xl px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Badge Preview */}
                    <div className="w-28 text-right pt-4">
                      {opt.surchargePercent > 0 ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-blue-950 text-blue-300 border border-blue-800">
                          +{opt.surchargePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400">
                          Sin recargo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={handleSaveConfig}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: NUEVO PLAN DE CUOTAS (Matches Screenshot 2)         */}
      {/* ========================================================= */}
      {isNewPlanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">Nuevo Plan de Cuotas</h3>
                <p className="text-xs text-slate-400">
                  Cargá los productos o conceptos y configurá el plan.
                </p>
              </div>
              <button
                onClick={() => setIsNewPlanOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              {/* Cliente */}
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">Cliente</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-xl p-2.5 border border-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  {store.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.taxId || 'Sin CUIT/DNI'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Buscar Producto */}
              <div className="relative">
                <label className="font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span>Buscar Producto</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Escribí nombre, SKU o código..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full bg-slate-800 text-white rounded-xl pl-9 pr-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Dropdown search results */}
                {showProductDropdown && productSearch.trim().length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar divide-y divide-slate-700/50">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleAddProduct(p)}
                        className="p-2.5 hover:bg-slate-700 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <div className="font-bold text-white uppercase text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Cód: {p.code} • Stock: {p.stock}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-blue-400">
                          {formatMoney(p.priceMinorista || p.costPrice * 1.3)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Agregar Concepto Libre */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Agregar concepto libre</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Descripción (ej. Desmalezadora 52cc)"
                    value={customConcept}
                    onChange={(e) => setCustomConcept(e.target.value)}
                    className="flex-1 bg-slate-800 text-white rounded-xl px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                    className="w-16 bg-slate-800 text-white text-center rounded-xl px-2 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Precio unit"
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    className="w-28 bg-slate-800 text-white font-mono rounded-xl px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none text-right"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomConcept}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Items List in Plan */}
              {planItems.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Artículos incluidos ({planItems.length})
                  </div>
                  <div className="divide-y divide-slate-800/80 max-h-36 overflow-y-auto custom-scrollbar">
                    {planItems.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                        <div className="flex-1 pr-2">
                          <span className="font-bold text-white uppercase">{item.productName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.quantity} x {formatMoney(item.unitPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white">
                            {formatMoney(item.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold">
                    <span className="text-slate-400">Total Base:</span>
                    <span className="text-white font-mono text-sm">{formatMoney(totalBasePrice)}</span>
                  </div>
                </div>
              )}

              {/* Cuotas Buttons & Config */}
              <div className="space-y-2 pt-1">
                <label className="font-bold text-slate-300 block">Cantidad de Cuotas</label>
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                  {[2, 3, 4, 5, 6, 9, 12, 18, 24].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSelectInstallmentsCount(num)}
                      className={`py-2 text-center rounded-xl font-bold transition text-xs cursor-pointer ${
                        installmentsCount === num
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">
                    % Recargo Financiero
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={interestPercent}
                    onChange={(e) => setInterestPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-white font-mono rounded-xl p-2 border border-slate-700 text-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">
                    Anticipo / Entrega ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={downPayment || ''}
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 text-white font-mono rounded-xl p-2 border border-slate-700 text-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">
                    1° Vencimiento
                  </label>
                  <input
                    type="date"
                    value={firstDueDate}
                    onChange={(e) => setFirstDueDate(e.target.value)}
                    className="w-full bg-slate-800 text-white rounded-xl p-2 border border-slate-700"
                  />
                </div>
              </div>

              {/* Calculation Summary Card */}
              {totalBasePrice > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/50 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-blue-300 font-bold uppercase">
                      Total Financiado ({installmentsCount} cuotas de{' '}
                      {formatMoney(
                        Math.max(
                          0,
                          (totalBasePrice - downPayment) * (1 + interestPercent / 100)
                        ) / installmentsCount
                      )}
                      )
                    </div>
                    <div className="text-xl font-black text-blue-400 font-mono">
                      {formatMoney(
                        Math.max(
                          0,
                          (totalBasePrice - downPayment) * (1 + interestPercent / 100)
                        )
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <span>Recargo: +{interestPercent}%</span>
                    <span className="block">Anticipo: {formatMoney(downPayment)}</span>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPlanOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={planItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer"
                >
                  Crear Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COBRAR CUOTA                                       */}
      {/* ========================================================= */}
      {payingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Cobro de Cuota</h3>
                <p className="text-xs text-slate-400">Plan {payingPlan.code}</p>
              </div>
              <button
                onClick={() => setPayingPlan(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-white uppercase text-xs">
                {payingPlan.clientName}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-semibold">
                  Cuota N° {payingInstallmentNumber} de {payingPlan.installmentsCount}
                </span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  {formatMoney(payingPlan.installmentAmount)}
                </span>
              </div>
            </div>

            {/* Select which installment to pay */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Seleccionar Cuota a Cobrar
              </label>
              <select
                value={payingInstallmentNumber}
                onChange={(e) => setPayingInstallmentNumber(parseInt(e.target.value))}
                className="w-full bg-slate-800 text-white text-xs rounded-xl p-2.5 border border-slate-700"
              >
                {payingPlan.schedule
                  .filter((s) => !s.isPaid)
                  .map((s) => (
                    <option key={s.number} value={s.number}>
                      Cuota {s.number} - Vto: {formatDate(s.dueDate)} - {formatMoney(s.amount)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Medio de Pago</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-800 text-white text-xs rounded-xl p-2.5 border border-slate-700"
              >
                <option value="cash">Efectivo (Ingresa a Caja Mostrador)</option>
                <option value="bank_transfer">Transferencia Bancaria</option>
                <option value="debit_card">Tarjeta Débito</option>
                <option value="credit_card">Tarjeta Crédito</option>
                <option value="mercadopago">MercadoPago / QR</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPayingPlan(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ELIMINAR PLAN                                      */}
      {/* ========================================================= */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Eliminar Plan de Cuotas</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="text-white font-bold uppercase">{planToDelete.clientName}</div>
              <div className="text-slate-400 font-mono">
                {planToDelete.code} • Total: {formatMoney(planToDelete.totalFinancedWithInterest)}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition cursor-pointer"
              >
                Eliminar Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: IMPRESIÓN DE CONTRATO / PLAN DE CUOTAS (2 Copias)  */}
      {/* ========================================================= */}
      {selectedPlanForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Header Impresión */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight uppercase">
                  {store.settings.tradeName || 'Ferretería Bruzzone'}
                </h2>
                <p className="text-xs text-slate-600">
                  {store.settings.address || 'Doctor Carlos L Rocha 128, Alejandro Roca'}
                </p>
                <p className="text-xs text-slate-600">
                  CUIT: {store.settings.cuit || '30-71459812-4'} • Tel: {store.settings.phone || '0358-4354998'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                  PAGARÉ & CONTRATO DE FINANCIACIÓN
                </span>
                <span className="text-base font-black text-blue-700 font-mono">
                  {selectedPlanForPrint.code}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Fecha: {formatDate(selectedPlanForPrint.date)}
                </span>
              </div>
            </div>

            {/* Client and Items breakdown */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <strong className="block text-slate-500 uppercase text-[10px]">Titular:</strong>
                <span className="font-bold text-sm uppercase">{selectedPlanForPrint.clientName}</span>
                <span className="block text-slate-600">
                  DNI/CUIT: {selectedPlanForPrint.clientTaxId || 'Consumidor Final'}
                </span>
                {selectedPlanForPrint.clientPhone && (
                  <span className="block text-slate-600">Tel: {selectedPlanForPrint.clientPhone}</span>
                )}
              </div>
              <div className="text-right">
                <strong className="block text-slate-500 uppercase text-[10px]">Resumen Financiero:</strong>
                <span>
                  Total Base: <strong>{formatMoney(selectedPlanForPrint.totalCashPrice)}</strong>
                </span>
                <span className="block">
                  Anticipo: {formatMoney(selectedPlanForPrint.downPayment)}
                </span>
                <span className="block text-blue-700 font-black text-sm">
                  Total Financiado: {formatMoney(selectedPlanForPrint.totalFinancedWithInterest)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Artículos / Conceptos Financiados:
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-600 text-[10px]">
                    <tr>
                      <th className="p-2">Descripción</th>
                      <th className="p-2 text-center">Cant.</th>
                      <th className="p-2 text-right">Unitario</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedPlanForPrint.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold uppercase">{it.productName}</td>
                        <td className="p-2 text-center">{it.quantity}</td>
                        <td className="p-2 text-right font-mono">{formatMoney(it.unitPrice)}</td>
                        <td className="p-2 text-right font-mono font-bold">{formatMoney(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Installments Schedule */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Cronograma de Vencimientos ({selectedPlanForPrint.installmentsCount} Cuotas):
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-600 text-[10px]">
                    <tr>
                      <th className="p-2">Cuota</th>
                      <th className="p-2">Fecha Vencimiento</th>
                      <th className="p-2 text-right">Importe</th>
                      <th className="p-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedPlanForPrint.schedule.map((s) => (
                      <tr key={s.number}>
                        <td className="p-2 font-bold">
                          Cuota {s.number} de {selectedPlanForPrint.installmentsCount}
                        </td>
                        <td className="p-2">{formatDate(s.dueDate)}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {formatMoney(s.amount)}
                        </td>
                        <td className="p-2 text-center font-bold">
                          {s.isPaid ? (
                            <span className="text-emerald-600">Abonada ({formatDate(s.paidAt || '')})</span>
                          ) : (
                            <span className="text-slate-500">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
                <span className="font-bold">Firma del Cliente</span>
                <span className="text-[10px] text-slate-500 block">Conforme pagaré y recepción</span>
              </div>
              <div>
                <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
                <span className="font-bold">Firma Autorizada Comercio</span>
                <span className="text-[10px] text-slate-500 block">Duplicado de control</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedPlanForPrint(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-black text-white shadow flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
