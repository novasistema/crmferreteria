import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Calendar, 
  User, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Info, 
  X,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileCheck2,
  Trash2,
  Building
} from 'lucide-react';
import { 
  InternalInstallmentPlan, 
  InstallmentFee, 
  InstallmentProductItem, 
  Customer, 
  Product, 
  CompanyConfig, 
  Cashbox 
} from '../types';

interface InternalInstallmentsModuleProps {
  plans: InternalInstallmentPlan[];
  customers: Customer[];
  products: Product[];
  cashboxes: Cashbox[];
  config: CompanyConfig | null;
  onSavePlan: (plan: InternalInstallmentPlan) => Promise<void>;
  onRecordFeePayment: (
    planId: string, 
    feeNumber: number, 
    amount: number, 
    method: 'efectivo' | 'transferencia' | 'cheque' | 'echeq',
    cashboxId?: string,
    receiptNumber?: string,
    notes?: string
  ) => Promise<void>;
}

export const InternalInstallmentsModule: React.FC<InternalInstallmentsModuleProps> = ({
  plans,
  customers,
  products,
  cashboxes,
  config,
  onSavePlan,
  onRecordFeePayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<InternalInstallmentPlan | null>(null);

  // New Plan Modal
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showPayFeeModal, setShowPayFeeModal] = useState<{ plan: InternalInstallmentPlan; fee: InstallmentFee } | null>(null);
  const [printContractPlan, setPrintContractPlan] = useState<InternalInstallmentPlan | null>(null);

  // Form State for New Plan
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedProducts, setSelectedProducts] = useState<InstallmentProductItem[]>([]);
  const [addProductId, setAddProductId] = useState(products[0]?.id || '');
  const [addProductQty, setAddProductQty] = useState(1);
  const [addProductCustomPrice, setAddProductCustomPrice] = useState<number>(() => {
    return products[0]?.priceWholesale || 0;
  });

  const [downPayment, setDownPayment] = useState<number>(0);
  const [downPaymentPaid, setDownPaymentPaid] = useState<boolean>(true);
  const [downPaymentReceipt, setDownPaymentReceipt] = useState<string>('');
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [frequency, setFrequency] = useState<'semanal' | 'quincenal' | 'mensual'>('mensual');
  const [interestRate, setInterestRate] = useState<number>(0); // 0% sin interés o recargo
  const [guarantorName, setGuarantorName] = useState<string>('');
  const [guarantorDni, setGuarantorDni] = useState<string>('');
  const [guarantorPhone, setGuarantorPhone] = useState<string>('');
  const [planNotes, setPlanNotes] = useState<string>('');

  // Fee Payment Modal state
  const [payFeeAmount, setPayFeeAmount] = useState<number>(0);
  const [payFeeMethod, setPayFeeMethod] = useState<'efectivo' | 'transferencia' | 'cheque' | 'echeq'>('efectivo');
  const [payFeeCashboxId, setPayFeeCashboxId] = useState<string>(cashboxes[0]?.id || '');
  const [payFeeReceiptNumber, setPayFeeReceiptNumber] = useState<string>('');
  const [payFeeNotes, setPayFeeNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize product selector price when selecting another product
  const handleSelectProductChange = (prodId: string) => {
    setAddProductId(prodId);
    const found = products.find(p => p.id === prodId);
    if (found) {
      setAddProductCustomPrice(found.priceWholesale || found.priceRetail || 0);
    }
  };

  const handleAddProductItem = () => {
    const prod = products.find(p => p.id === addProductId);
    if (!prod) return;
    const newItem: InstallmentProductItem = {
      productId: prod.id,
      productName: prod.name,
      code: prod.code,
      quantity: Number(addProductQty) || 1,
      unitPrice: Number(addProductCustomPrice) || 0,
      subtotal: (Number(addProductQty) || 1) * (Number(addProductCustomPrice) || 0)
    };
    setSelectedProducts(prev => [...prev, newItem]);
  };

  const handleRemoveProductItem = (idx: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculations for new plan
  const totalProductsAmount = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + item.subtotal, 0);
  }, [selectedProducts]);

  const financedAmount = useMemo(() => {
    const remaining = totalProductsAmount - (Number(downPayment) || 0);
    return remaining > 0 ? remaining : 0;
  }, [totalProductsAmount, downPayment]);

  const totalWithInterest = useMemo(() => {
    const rate = Number(interestRate) || 0;
    return financedAmount * (1 + rate / 100);
  }, [financedAmount, interestRate]);

  const calculatedFeeAmount = useMemo(() => {
    const count = Number(installmentsCount) || 1;
    return Math.round((totalWithInterest / count) * 100) / 100;
  }, [totalWithInterest, installmentsCount]);

  // Handle Create Plan with strict rule compliance:
  // REGLA EXACTA:
  // - La primera cuota vence el mismo día en que se crea el plan.
  // - La primera cuota NO se marca pagada automáticamente.
  // - Crear el plan NO equivale a cobrar la primera cuota.
  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert("Por favor agregue al menos un producto al plan de financiación.");
      return;
    }
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) {
      alert("Seleccione un cliente válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const count = Number(installmentsCount) || 3;
      const daysInterval = frequency === 'semanal' ? 7 : frequency === 'quincenal' ? 15 : 30;

      const generatedFees: InstallmentFee[] = [];
      for (let i = 1; i <= count; i++) {
        // REGLA: fee 1 vence HOY (el mismo día de creación del plan)
        let dueDate: string;
        if (i === 1) {
          dueDate = todayStr;
        } else {
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + (i - 1) * daysInterval);
          dueDate = nextDate.toISOString().split('T')[0];
        }

        generatedFees.push({
          feeNumber: i,
          dueDate: dueDate,
          amount: calculatedFeeAmount,
          status: 'pendiente', // REGLA: NO se marca pagada sola!
          notes: i === 1 ? 'Cuota 1 (Vence hoy al momento de constituir el acuerdo)' : `Cuota ${i}`
        });
      }

      const planNumber = `CUO-${today.getFullYear()}-${String(plans.length + 1).padStart(4, '0')}`;
      const newPlan: InternalInstallmentPlan = {
        id: `plan-${Date.now()}`,
        planNumber,
        customerId: customer.id,
        customerName: customer.businessName || customer.tradeName || 'Cliente',
        customerTaxId: customer.taxId,
        customerPhone: customer.phone,
        customerAddress: `${customer.address}, ${customer.city}`,
        products: selectedProducts,
        totalProductsAmount,
        downPayment: Number(downPayment) || 0,
        downPaymentPaid: Boolean(downPaymentPaid),
        downPaymentReceipt: downPaymentReceipt || undefined,
        financedAmount,
        installmentsCount: count,
        frequency,
        feeAmount: calculatedFeeAmount,
        interestRate: Number(interestRate) || 0,
        startDate: todayStr,
        status: 'vigente',
        fees: generatedFees,
        guarantorName: guarantorName || undefined,
        guarantorDni: guarantorDni || undefined,
        guarantorPhone: guarantorPhone || undefined,
        notes: planNotes || 'Plan de financiación interna de fábrica con contrato en 2 copias.',
        createdBy: 'Administración',
        createdAt: new Date().toISOString()
      };

      await onSavePlan(newPlan);
      setShowNewPlanModal(false);
      setSelectedPlan(newPlan);
      setSelectedProducts([]);
      setDownPayment(0);
      setGuarantorName('');
      setGuarantorDni('');
      setGuarantorPhone('');
    } catch (err) {
      console.error("Error creating installment plan:", err);
      alert("Ocurrió un error al guardar el plan de cuotas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fee payment execution
  const handleExecuteFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayFeeModal) return;
    setIsSubmitting(true);
    try {
      await onRecordFeePayment(
        showPayFeeModal.plan.id,
        showPayFeeModal.fee.feeNumber,
        Number(payFeeAmount),
        payFeeMethod,
        payFeeCashboxId,
        payFeeReceiptNumber,
        payFeeNotes
      );
      setShowPayFeeModal(null);
    } catch (err) {
      console.error("Error paying installment fee:", err);
      alert("Error al registrar el cobro de la cuota.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchSearch = 
        p.planNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerTaxId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [plans, searchTerm, statusFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalFinanced = plans.reduce((acc, p) => acc + p.financedAmount, 0);
    const totalCollected = plans.reduce((acc, p) => {
      const feeSum = p.fees.reduce((fAcc, f) => fAcc + (f.paidAmount || 0), 0);
      return acc + (p.downPaymentPaid ? p.downPayment : 0) + feeSum;
    }, 0);
    const activePlansCount = plans.filter(p => p.status === 'vigente' || p.status === 'al_dia').length;
    const overduePlansCount = plans.filter(p => p.status === 'moroso').length;
    return { totalFinanced, totalCollected, activePlansCount, overduePlansCount };
  }, [plans]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Cuotas Internas & Financiación Propia
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  Contrato en 2 Copias
                </span>
              </h2>
              <p className="text-sm text-slate-400">
                Créditos directos de fábrica sin intermediarios bancarios, vencimiento HOY para cuota inicial y control de cobranza.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nuevo Plan de Financiación
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Capital Financiado</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${stats.totalFinanced.toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total en cartera propia</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cobranzas Recaudadas</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            ${stats.totalCollected.toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Anticipos + cuotas cobradas</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Planes Activos</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono">
            {stats.activePlansCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Clientes al día o vigentes</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Vencidos / Morosos</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {stats.overduePlansCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Cuotas atrasadas con reclamo</div>
        </div>
      </div>

      {/* Strict Rule Notice Box */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">Reglas Maestras de Operación:</span>
          <p className="mt-0.5 text-slate-300">
            1. <strong>La primera cuota vence el mismo día en que se crea el plan</strong>.
            2. <strong>La primera cuota NO se marca pagada automáticamente</strong> (crear el plan no equivale a cobrar la cuota).
            3. El contrato se imprime en <strong>2 copias idénticas</strong>: Original para la empresa y Duplicado para el cliente con detalle de productos e importes individuales editables.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° plan, cliente o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="al_dia">Al Día</option>
            <option value="moroso">Moroso / En Mora</option>
            <option value="finalizado">Finalizado / Pagado</option>
          </select>
        </div>
      </div>

      {/* Plans List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Plan N°</th>
                <th className="px-4 py-3.5">Cliente & CUIT</th>
                <th className="px-4 py-3.5">Total & Anticipo</th>
                <th className="px-4 py-3.5">Financiado</th>
                <th className="px-4 py-3.5">Cuotas</th>
                <th className="px-4 py-3.5">Progreso</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron planes de financiación que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredPlans.map(plan => {
                  const paidFees = plan.fees.filter(f => f.status === 'pagada').length;
                  const totalFees = plan.fees.length;
                  const progressPct = Math.round((paidFees / totalFees) * 100);

                  return (
                    <tr key={plan.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">
                        {plan.planNumber}
                        <div className="text-[11px] text-slate-500 font-sans font-normal">
                          {plan.startDate}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{plan.customerName}</div>
                        <div className="text-xs text-slate-400 font-mono">{plan.customerTaxId}</div>
                      </td>

                      <td className="px-4 py-3 font-mono">
                        <div>${plan.totalProductsAmount.toLocaleString('es-AR')}</div>
                        <div className="text-xs text-emerald-400">
                          Anticipo: ${plan.downPayment.toLocaleString('es-AR')}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-white">
                        ${plan.financedAmount.toLocaleString('es-AR')}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">{plan.installmentsCount}</span>
                        <span className="text-xs text-slate-400"> x ${Math.round(plan.feeAmount).toLocaleString('es-AR')}</span>
                        <div className="text-[11px] text-slate-500 capitalize">{plan.frequency}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{paidFees}/{totalFees}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          plan.status === 'finalizado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          plan.status === 'moroso' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {plan.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedPlan(plan)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors title='Ver Cuotas'"
                            title="Ver Cuotas y Cobranzas"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPrintContractPlan(plan)}
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
                            title="Imprimir Contrato en 2 Copias"
                          >
                            <Printer className="w-4 h-4" />
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

      {/* Selected Plan Details & Fee Schedule View */}
      {selectedPlan && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-amber-400">{selectedPlan.planNumber}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                  Fecha Inicio: {selectedPlan.startDate}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{selectedPlan.customerName}</h3>
              <p className="text-sm text-slate-400 font-mono">CUIT: {selectedPlan.customerTaxId} | Tel: {selectedPlan.customerPhone || 'N/A'}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPrintContractPlan(selectedPlan)}
                className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir Contrato (2 Copias)
              </button>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Products in this plan */}
          <div>
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Pinturas y Productos Incluidos (Precios Individuales Acordados)
            </h4>
            <div className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2">Cantidad</th>
                    <th className="px-3 py-2 font-mono">P. Unitario Plan</th>
                    <th className="px-3 py-2 font-mono text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedPlan.products.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-mono text-amber-400">{item.code}</td>
                      <td className="px-3 py-2 font-medium text-white">{item.productName}</td>
                      <td className="px-3 py-2">{item.quantity} un.</td>
                      <td className="px-3 py-2 font-mono">${item.unitPrice.toLocaleString('es-AR')}</td>
                      <td className="px-3 py-2 font-mono text-right font-bold text-white">
                        ${item.subtotal.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fees Schedule */}
          <div>
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Cronograma de Cuotas y Cobranzas
            </h4>
            <div className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5">Cuota #</th>
                    <th className="px-3 py-2.5">Fecha Vencimiento</th>
                    <th className="px-3 py-2.5 font-mono">Importe Cuota</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5">Pagado</th>
                    <th className="px-3 py-2.5">Comprobante</th>
                    <th className="px-3 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedPlan.fees.map((fee) => {
                    const isOverdue = fee.status === 'pendiente' && new Date(fee.dueDate) < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <tr key={fee.feeNumber} className="hover:bg-slate-900/50">
                        <td className="px-3 py-2.5 font-bold text-white">
                          Cuota {fee.feeNumber} {fee.feeNumber === 1 && <span className="text-[10px] text-amber-400">(Vence Día Inicial)</span>}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-300">
                          {fee.dueDate}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-white">
                          ${fee.amount.toLocaleString('es-AR')}
                        </td>
                        <td className="px-3 py-2.5">
                          {fee.status === 'pagada' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                              PAGADA
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-semibold">
                              VENCIDA
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                              PENDIENTE
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          {fee.paidAmount ? (
                            <span className="text-emerald-400 font-bold">${fee.paidAmount.toLocaleString('es-AR')}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-400">
                          {fee.receiptNumber || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {fee.status !== 'pagada' ? (
                            <button
                              onClick={() => {
                                setPayFeeAmount(fee.amount);
                                setPayFeeReceiptNumber(`REC-CUO-${selectedPlan.planNumber}-${fee.feeNumber}`);
                                setShowPayFeeModal({ plan: selectedPlan, fee });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Cobrar Cuota
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cobrado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Plan de Financiación Interna */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  Confección de Plan de Financiación Interna
                </h3>
                <p className="text-xs text-slate-400">
                  Financiación con contrato legal de fábrica en 2 copias (Fábrica y Cliente).
                </p>
              </div>
              <button 
                onClick={() => setShowNewPlanModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Cliente Solicitante:
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.businessName || c.tradeName} (CUIT: {c.taxId}) - Lista: {c.priceList}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selector with Editable Unit Price for the Plan */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Agregar Pinturas al Plan (Precios Individuales sin modificar catálogo general):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <select
                      value={addProductId}
                      onChange={(e) => handleSelectProductChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} ({p.presentation})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant"
                      value={addProductQty}
                      onChange={(e) => setAddProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      placeholder="P. Unitario ($)"
                      value={addProductCustomPrice}
                      onChange={(e) => setAddProductCustomPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddProductItem}
                      className="w-full h-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Products List */}
                {selectedProducts.length > 0 && (
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-900 text-slate-400">
                        <tr>
                          <th className="px-2.5 py-1.5">Producto</th>
                          <th className="px-2.5 py-1.5">Cant</th>
                          <th className="px-2.5 py-1.5">P. Unitario Plan</th>
                          <th className="px-2.5 py-1.5">Subtotal</th>
                          <th className="px-2.5 py-1.5 text-right">Quitar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {selectedProducts.map((p, idx) => (
                          <tr key={idx}>
                            <td className="px-2.5 py-1.5">{p.productName}</td>
                            <td className="px-2.5 py-1.5">{p.quantity}</td>
                            <td className="px-2.5 py-1.5 font-mono">${p.unitPrice.toLocaleString('es-AR')}</td>
                            <td className="px-2.5 py-1.5 font-mono font-bold text-white">${p.subtotal.toLocaleString('es-AR')}</td>
                            <td className="px-2.5 py-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveProductItem(idx)}
                                className="text-rose-400 hover:text-rose-300 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Financial Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Anticipo / Entrega Inicial ($):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={downPayment}
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="checkbox"
                      id="downPaymentPaid"
                      checked={downPaymentPaid}
                      onChange={(e) => setDownPaymentPaid(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <label htmlFor="downPaymentPaid" className="text-xs text-slate-400">
                      Anticipo ya cobrado
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cantidad de Cuotas:
                  </label>
                  <select
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value={2}>2 Cuotas</option>
                    <option value={3}>3 Cuotas (Recomendado)</option>
                    <option value={4}>4 Cuotas</option>
                    <option value={6}>6 Cuotas</option>
                    <option value={12}>12 Cuotas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Frecuencia de Vencimiento:
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="mensual">Mensual (Cada 30 días)</option>
                    <option value="quincenal">Quincenal (Cada 15 días)</option>
                    <option value="semanal">Semanal (Cada 7 días)</option>
                  </select>
                </div>
              </div>

              {/* Guarantor / Aval Info */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase block">
                  Garante Comercial / Aval Adicional (Opcional):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre y Apellido Garante"
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="DNI / CUIT Garante"
                    value={guarantorDni}
                    onChange={(e) => setGuarantorDni(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono Garante"
                    value={guarantorPhone}
                    onChange={(e) => setGuarantorPhone(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Summary and Mandatory Rule Confirmation */}
              <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <div className="text-xs text-slate-400">Total a Financiar:</div>
                  <div className="text-xl font-bold font-mono text-white">
                    ${financedAmount.toLocaleString('es-AR')}
                  </div>
                  <div className="text-xs text-amber-400 font-semibold mt-0.5">
                    {installmentsCount} cuotas de ${Math.round(calculatedFeeAmount).toLocaleString('es-AR')} ({frequency})
                  </div>
                </div>

                <div className="text-xs text-slate-400 text-right">
                  <div>* 1ra Cuota vence: <span className="font-bold text-amber-300">HOY ({new Date().toISOString().split('T')[0]})</span></div>
                  <div>* Estado inicial: <span className="font-semibold text-white">Pendiente de cobro</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedProducts.length === 0}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Plan & Generar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cobro de Cuota Específica */}
      {showPayFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  Cobranza de Cuota #{showPayFeeModal.fee.feeNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Plan: {showPayFeeModal.plan.planNumber} - {showPayFeeModal.plan.customerName}
                </p>
              </div>
              <button
                onClick={() => setShowPayFeeModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteFeePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Importe a Cobrar ($):
                </label>
                <input
                  type="number"
                  value={payFeeAmount}
                  onChange={(e) => setPayFeeAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Medio de Pago:
                </label>
                <select
                  value={payFeeMethod}
                  onChange={(e) => setPayFeeMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                >
                  <option value="efectivo">Efectivo en Mostrador (Impacta Arqueo de Caja)</option>
                  <option value="transferencia">Transferencia Bancaria / CBU</option>
                  <option value="cheque">Cheque Físico de Terceros</option>
                  <option value="echeq">E-Cheq Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Caja o Cuenta Destino:
                </label>
                <select
                  value={payFeeCashboxId}
                  onChange={(e) => setPayFeeCashboxId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                >
                  {cashboxes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type}) - Saldo: ${c.currentBalance.toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  N° de Recibo Oficial:
                </label>
                <input
                  type="text"
                  value={payFeeReceiptNumber}
                  onChange={(e) => setPayFeeReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  placeholder="ej: REC-0001-00049102"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayFeeModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Registrando...' : 'Confirmar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MODAL: Contrato Legal de Financiación en 2 Copias */}
      {printContractPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl p-8 shadow-2xl my-8 space-y-8">
            <div className="flex items-center justify-between no-print border-b pb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-slate-800">
                  Vista Previa de Impresión: Contrato en 2 Copias (Original Empresa / Duplicado Cliente)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  Imprimir Documento
                </button>
                <button
                  onClick={() => setPrintContractPlan(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* COPIA 1: ORIGINAL (PARA LA EMPRESA) */}
            <div className="border-2 border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
                    {config?.companyName || 'COLOREAR PINTURAS S.A.'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {config?.fiscalAddress || 'Planta Industrial Km 38.5'} - CUIT: {config?.cuit || '30-71122334-4'}
                  </p>
                  <p className="text-xs text-slate-600 font-semibold mt-1">
                    CONTRATO DE VENTA EN CUOTAS CON FINANCIACIÓN INTERNA
                  </p>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-slate-900 text-white font-mono text-sm font-bold rounded">
                    EJEMPLAR ORIGINAL: EMPRESA
                  </div>
                  <div className="text-xs font-mono font-bold mt-1 text-slate-700">
                    PLAN: {printContractPlan.planNumber}
                  </div>
                  <div className="text-xs text-slate-500">
                    Fecha: {printContractPlan.startDate}
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="font-bold block text-slate-700">CLIENTE / DEUDOR:</span>
                  <div>{printContractPlan.customerName}</div>
                  <div>CUIT/DNI: {printContractPlan.customerTaxId}</div>
                  <div>Domicilio: {printContractPlan.customerAddress}</div>
                  <div>Teléfono: {printContractPlan.customerPhone || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-bold block text-slate-700">GARANTE / CODEUDOR (AVAL):</span>
                  <div>Nombre: {printContractPlan.guarantorName || 'Sin Garante adicional'}</div>
                  <div>DNI: {printContractPlan.guarantorDni || 'N/A'}</div>
                  <div>Teléfono: {printContractPlan.guarantorPhone || 'N/A'}</div>
                </div>
              </div>

              {/* Items detail */}
              <div>
                <span className="font-bold text-xs uppercase block mb-1">Pinturas y Mercadería Entregada:</span>
                <table className="w-full text-xs text-left border">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-1.5">Código</th>
                      <th className="p-1.5">Producto</th>
                      <th className="p-1.5 text-center">Cant.</th>
                      <th className="p-1.5 text-right font-mono">P. Unitario</th>
                      <th className="p-1.5 text-right font-mono">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {printContractPlan.products.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 font-mono">{item.code}</td>
                        <td className="p-1.5 font-medium">{item.productName}</td>
                        <td className="p-1.5 text-center">{item.quantity}</td>
                        <td className="p-1.5 text-right font-mono">${item.unitPrice.toLocaleString('es-AR')}</td>
                        <td className="p-1.5 text-right font-mono font-bold">${item.subtotal.toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Conditions */}
              <div className="grid grid-cols-3 gap-2 text-xs border p-2 bg-slate-50 rounded">
                <div>Total Venta: <span className="font-bold font-mono">${printContractPlan.totalProductsAmount.toLocaleString('es-AR')}</span></div>
                <div>Anticipo Inicial: <span className="font-bold font-mono text-emerald-700">${printContractPlan.downPayment.toLocaleString('es-AR')}</span></div>
                <div>Saldo Financiado: <span className="font-bold font-mono">${printContractPlan.financedAmount.toLocaleString('es-AR')}</span></div>
              </div>

              {/* Schedule */}
              <div>
                <span className="font-bold text-xs uppercase block mb-1">
                  Plan de Pagos ({printContractPlan.installmentsCount} Cuotas {printContractPlan.frequency}es):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  {printContractPlan.fees.map(f => (
                    <div key={f.feeNumber} className="border p-1.5 rounded bg-white text-center">
                      <div className="font-bold">Cuota #{f.feeNumber}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{f.dueDate}</div>
                      <div className="font-bold font-mono mt-0.5">${Math.round(f.amount).toLocaleString('es-AR')}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Clauses */}
              <p className="text-[10px] text-slate-500 text-justify leading-tight">
                El DEUDOR reconoce adeudar a la EMPRESA la suma total financiada estipulada en este instrumento, obligándose a cancelarla en los plazos y montos indicados en el cronograma de cuotas. La falta de pago de cualquiera de las cuotas a su respectivo vencimiento constituirá al deudor en mora de pleno derecho sin necesidad de interpelación judicial o extrajudicial previa.
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-1">
                  <div className="font-bold">Firma del Deudor</div>
                  <div className="text-[10px] text-slate-500">Aclaración y DNI</div>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <div className="font-bold">Firma del Garante</div>
                  <div className="text-[10px] text-slate-500">Aclaración y DNI</div>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <div className="font-bold">Por Colorear Pinturas</div>
                  <div className="text-[10px] text-slate-500">Firma Autorizada</div>
                </div>
              </div>
            </div>

            {/* CUT LINE */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t-2 border-dashed border-slate-400"></div>
              <span className="flex-shrink mx-4 text-xs text-slate-400 font-mono">
                CORTAR POR AQUÍ - DUPLICADO CLIENTE
              </span>
              <div className="flex-grow border-t-2 border-dashed border-slate-400"></div>
            </div>

            {/* COPIA 2: DUPLICADO (PARA EL CLIENTE) */}
            <div className="border-2 border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
                    {config?.companyName || 'COLOREAR PINTURAS S.A.'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    CONTRATO DE VENTA EN CUOTAS CON FINANCIACIÓN INTERNA
                  </p>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-amber-600 text-white font-mono text-sm font-bold rounded">
                    EJEMPLAR DUPLICADO: CLIENTE
                  </div>
                  <div className="text-xs font-mono font-bold mt-1 text-slate-700">
                    PLAN: {printContractPlan.planNumber}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="font-bold block text-slate-700">TITULAR:</span>
                  <div>{printContractPlan.customerName} (CUIT: {printContractPlan.customerTaxId})</div>
                </div>
                <div>
                  <span className="font-bold block text-slate-700">TOTAL FINANCIADO:</span>
                  <div className="font-mono font-bold">${printContractPlan.financedAmount.toLocaleString('es-AR')} en {printContractPlan.installmentsCount} cuotas de ${Math.round(printContractPlan.feeAmount).toLocaleString('es-AR')}</div>
                </div>
              </div>

              {/* Schedule summary */}
              <div>
                <span className="font-bold text-xs uppercase block mb-1">
                  Vencimientos de Cuotas a abonar:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  {printContractPlan.fees.map(f => (
                    <div key={f.feeNumber} className="border p-1.5 rounded bg-white text-center">
                      <div className="font-bold">Cuota #{f.feeNumber}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{f.dueDate}</div>
                      <div className="font-bold font-mono mt-0.5">${Math.round(f.amount).toLocaleString('es-AR')}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
                <div className="border-t border-slate-400 pt-1">
                  <div className="font-bold">Recibí Conforme (Cliente)</div>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <div className="font-bold">Por Colorear Pinturas S.A.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
