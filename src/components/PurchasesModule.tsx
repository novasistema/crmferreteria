import React, { useState, useMemo } from 'react';
import { 
  PackageSearch, 
  Plus, 
  Truck, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText, 
  Layers, 
  Building2,
  X,
  Check,
  Percent,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Wallet,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Edit3,
  Tag,
  Download,
  Filter,
  Printer
} from 'lucide-react';
import { Supplier, PurchaseOrder, RawMaterial, FinancialTransaction, Cashbox, CheckItem, CompanyConfig } from '../types';

interface PurchasesModuleProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  rawMaterials: RawMaterial[];
  financialTransactions?: FinancialTransaction[];
  cashboxes?: Cashbox[];
  checks?: CheckItem[];
  config?: CompanyConfig | null;
  onSaveSupplier: (supplier: Supplier) => Promise<void>;
  onCreatePurchaseOrder: (po: PurchaseOrder) => Promise<void>;
  onReceivePurchaseOrder: (po: PurchaseOrder) => Promise<void>;
  onRecordSupplierPayment?: (supplierId: string, amount: number, cashboxId: string, notes: string) => Promise<void>;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  suppliers,
  purchaseOrders,
  rawMaterials,
  financialTransactions = [],
  cashboxes = [],
  checks = [],
  config,
  onSaveSupplier,
  onCreatePurchaseOrder,
  onReceivePurchaseOrder,
  onRecordSupplierPayment
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('suppliers');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  
  // Modals
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  
  // Supplier form (New or Edit)
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    businessName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    category: 'Resinas & Polímeros',
    paymentTerms: '30 días F.F.',
    discountPercentage: 0,
    discountConcept: ''
  });

  // Discount fast-edit state for the selected supplier
  const [editingDiscountPct, setEditingDiscountPct] = useState<number>(0);
  const [editingDiscountConcept, setEditingDiscountConcept] = useState<string>('');

  // Payment to supplier state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payCashboxId, setPayCashboxId] = useState<string>(cashboxes[0]?.id || 'box-planta');
  const [payMethod, setPayMethod] = useState<'efectivo' | 'transferencia' | 'cheque'>('transferencia');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Purchase Order form state
  const [poSupplierId, setPoSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ rawMaterialId: string; quantity: number; unitCost: number }[]>([
    { rawMaterialId: rawMaterials[0]?.id || '', quantity: 1000, unitCost: rawMaterials[0]?.unitCost || 2500 }
  ]);
  const [poNotes, setPoNotes] = useState('');

  // Active supplier object when in detail view
  const currentSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Filtered suppliers list
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(s => 
      s.businessName.toLowerCase().includes(q) ||
      s.taxId.includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearch]);

  // When a supplier is selected for new PO, sync supplier's default discount
  const activePoSupplier = suppliers.find(s => s.id === poSupplierId) || suppliers[0];
  const poSupplierDiscount = activePoSupplier?.discountPercentage || 0;

  // Calculate PO items
  const calculatedPoItems = poItems.map(it => {
    const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
    return {
      rawMaterialId: it.rawMaterialId,
      rawMaterialName: mat?.name || 'Insumo Químico',
      quantity: Number(it.quantity) || 1,
      unitCost: Number(it.unitCost) || 0,
      subtotal: (Number(it.quantity) || 1) * (Number(it.unitCost) || 0)
    };
  });

  const poSubtotal = calculatedPoItems.reduce((acc, it) => acc + it.subtotal, 0);
  const poDiscountAmount = Math.round((poSubtotal * poSupplierDiscount) / 100);
  const poTotalWithDiscount = Math.max(0, poSubtotal - poDiscountAmount);

  // --- MOVEMENTS LEDGER FOR SELECTED SUPPLIER ---
  const supplierLedger = useMemo(() => {
    if (!currentSupplier) return [];

    interface SupplierMovement {
      id: string;
      date: string;
      type: 'compra' | 'pago' | 'descuento';
      typeLabel: string;
      docNumber: string;
      concept: string;
      debit: number; // Aumenta deuda con el proveedor
      credit: number; // Disminuye deuda (pagos)
      discountAmount?: number;
      discountPct?: number;
      runningBalance: number;
      status?: string;
      originalPo?: PurchaseOrder;
    }

    const movements: SupplierMovement[] = [];

    // 1. Purchase Orders from this supplier
    const supplierPOs = purchaseOrders.filter(po => po.supplierId === currentSupplier.id);
    supplierPOs.forEach(po => {
      // Calculate effective debit
      const subtotal = po.subtotalBeforeDiscount || po.total;
      const discount = po.discountAmount || 0;
      const netTotal = po.total;

      movements.push({
        id: `po-${po.id}`,
        date: po.date,
        type: 'compra',
        typeLabel: 'Orden de Compra / Insumos',
        docNumber: po.orderNumber,
        concept: po.items.map(it => `${it.quantity} x ${it.rawMaterialName}`).join(', '),
        debit: netTotal,
        credit: 0,
        discountAmount: discount,
        discountPct: po.discountPercentage || currentSupplier.discountPercentage || 0,
        runningBalance: 0,
        status: po.status,
        originalPo: po
      });
    });

    // 2. Payments recorded for this supplier from financialTransactions
    const supplierTxs = financialTransactions.filter(tx => 
      tx.type === 'pago_proveedor' && (
        tx.entityId === currentSupplier.id ||
        (tx.entityName && tx.entityName.toLowerCase() === currentSupplier.businessName.toLowerCase())
      )
    );

    supplierTxs.forEach(tx => {
      movements.push({
        id: `tx-${tx.id}`,
        date: tx.date,
        type: 'pago',
        typeLabel: 'Pago a Proveedor / OP',
        docNumber: tx.receiptNumber || 'OP-S/N',
        concept: `${tx.concept || 'Cancelación saldo insumos'} (${tx.paymentMethod.toUpperCase()})`,
        debit: 0,
        credit: tx.amount,
        runningBalance: 0
      });
    });

    // 3. Cheques delivered/endorsed to this supplier
    const supplierChecks = checks.filter(chk => 
      chk.deliveredToSupplierId === currentSupplier.id ||
      (chk.deliveredToSupplierName && chk.deliveredToSupplierName.toLowerCase() === currentSupplier.businessName.toLowerCase())
    );

    supplierChecks.forEach(chk => {
      movements.push({
        id: `chk-${chk.id}`,
        date: chk.issueDate || chk.createdAt,
        type: 'pago',
        typeLabel: 'Endoso Cheque / E-Cheq',
        docNumber: `CHQ #${chk.checkNumber}`,
        concept: `Cheque ${chk.bankName} - Vto: ${chk.dueDate}`,
        debit: 0,
        credit: chk.amount,
        runningBalance: 0
      });
    });

    // Sort chronologically ascending
    movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute progressive running balance
    let balance = 0;
    movements.forEach(m => {
      balance += (m.debit - m.credit);
      m.runningBalance = balance;
    });

    // Return in reverse chronological order (newest first)
    return movements.reverse();
  }, [currentSupplier, purchaseOrders, financialTransactions, checks]);

  // Total balance calculated from ledger
  const computedBalance = supplierLedger.length > 0 ? supplierLedger[0].runningBalance : (currentSupplier?.currentBalance || 0);

  // Total purchases and total payments
  const totalPurchased = supplierLedger.filter(m => m.type === 'compra').reduce((acc, m) => acc + m.debit, 0);
  const totalPaid = supplierLedger.filter(m => m.type === 'pago').reduce((acc, m) => acc + m.credit, 0);

  // Open Edit Modal for a Supplier
  const handleOpenEditSupplier = (sup: Supplier) => {
    setSupplierForm({
      id: sup.id,
      businessName: sup.businessName,
      taxId: sup.taxId,
      email: sup.email,
      phone: sup.phone,
      address: sup.address || '',
      category: sup.category,
      paymentTerms: sup.paymentTerms,
      discountPercentage: sup.discountPercentage || 0,
      discountConcept: sup.discountConcept || ''
    });
    setShowSupplierModal(true);
  };

  // Open Quick Discount Modal
  const handleOpenDiscountModal = (sup: Supplier) => {
    setEditingDiscountPct(sup.discountPercentage || 0);
    setEditingDiscountConcept(sup.discountConcept || '');
    setShowDiscountModal(true);
  };

  // Save updated discount to supplier
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;

    const updatedSupplier: Supplier = {
      ...currentSupplier,
      discountPercentage: Number(editingDiscountPct) || 0,
      discountConcept: editingDiscountConcept.trim()
    };

    await onSaveSupplier(updatedSupplier);
    setShowDiscountModal(false);
  };

  // Save new or edited supplier
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.businessName || !supplierForm.taxId) return;

    const newSupplier: Supplier = {
      id: supplierForm.id || `sup-${Date.now()}`,
      businessName: supplierForm.businessName,
      taxId: supplierForm.taxId,
      email: supplierForm.email || '',
      phone: supplierForm.phone || '',
      address: supplierForm.address || '',
      category: supplierForm.category || 'Materia Prima',
      paymentTerms: supplierForm.paymentTerms || 'Contado',
      discountPercentage: Number(supplierForm.discountPercentage) || 0,
      discountConcept: supplierForm.discountConcept || '',
      currentBalance: supplierForm.currentBalance || 0
    };

    await onSaveSupplier(newSupplier);
    setShowSupplierModal(false);
  };

  // Handle Recording Payment to Supplier
  const handleRecordPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier || payAmount <= 0) return;
    if (!onRecordSupplierPayment) return;

    setIsSubmittingPay(true);
    try {
      const notes = payNotes || `Pago ${payMethod.toUpperCase()} a ${currentSupplier.businessName}`;
      await onRecordSupplierPayment(currentSupplier.id, payAmount, payCashboxId, notes);
      setShowPayModal(false);
      setPayAmount(0);
      setPayNotes('');
    } catch (err) {
      console.error('Error recording supplier payment:', err);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Handle PO Submit
  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePoSupplier || calculatedPoItems.length === 0) return;

    const orderNumber = `OC-${new Date().getFullYear()}-${String(purchaseOrders.length + 15).padStart(3, '0')}`;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber,
      supplierId: activePoSupplier.id,
      supplierName: activePoSupplier.businessName,
      date: new Date().toISOString(),
      items: calculatedPoItems,
      subtotalBeforeDiscount: poSubtotal,
      discountPercentage: poSupplierDiscount,
      discountAmount: poDiscountAmount,
      total: poTotalWithDiscount,
      status: 'solicitado',
      notes: poNotes
    };

    await onCreatePurchaseOrder(newPO);
    setShowPOModal(false);
    setPoNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
              <PackageSearch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Compras, Proveedores & Cuentas Corrientes
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                  Insumos Químicos & Envases
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión de cuentas corrientes de proveedores, descuentos comerciales acordados, pagos y recepción de materias primas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSupplierForm({
                  businessName: '',
                  taxId: '',
                  email: '',
                  phone: '',
                  address: '',
                  category: 'Resinas & Polímeros',
                  paymentTerms: '30 días F.F.',
                  discountPercentage: 0,
                  discountConcept: ''
                });
                setShowSupplierModal(true);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              Nuevo Proveedor
            </button>
            <button
              onClick={() => {
                if (currentSupplier) {
                  setPoSupplierId(currentSupplier.id);
                }
                setShowPOModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Orden de Compra
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        {!selectedSupplierId && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Proveedores & Cuentas Corrientes ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Órdenes de Compra & Recepción ({purchaseOrders.length})
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: CUENTA CORRIENTE DETALLADA DE UN PROVEEDOR      */}
      {/* ======================================================== */}
      {selectedSupplierId && currentSupplier && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Back button and Supplier Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSupplierId(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Volver al listado de proveedores"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {currentSupplier.businessName}
                    </h2>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      {currentSupplier.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>CUIT: <strong className="font-mono text-slate-800">{currentSupplier.taxId}</strong></span>
                    <span>•</span>
                    <span>Tel: <strong className="text-slate-800">{currentSupplier.phone || 'S/D'}</strong></span>
                    <span>•</span>
                    <span>Condición: <strong className="text-slate-800">{currentSupplier.paymentTerms}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenDiscountModal(currentSupplier)}
                  className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  <Percent className="w-4 h-4 text-amber-700" />
                  Editar Descuento Acordado
                </button>
                <button
                  onClick={() => {
                    setPayAmount(Math.max(0, computedBalance));
                    setShowPayModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Registrar Pago / OP
                </button>
                <button
                  onClick={() => {
                    setPoSupplierId(currentSupplier.id);
                    setShowPOModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nueva OC
                </button>
              </div>
            </div>

            {/* Metrics Bar with Discount Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
              {/* Descuento que nos otorga */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200">
                <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
                  <span>Descuento Otorgado</span>
                  <Percent className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-amber-950">
                    {currentSupplier.discountPercentage || 0}%
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold uppercase">
                    Bonificación
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 truncate mt-1">
                  {currentSupplier.discountConcept || 'Sin concepto de descuento cargado'}
                </p>
              </div>

              {/* Saldo Deudor Actual */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Saldo a Pagar (Deuda)</span>
                  <Wallet className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900">
                  $ {computedBalance.toLocaleString('es-AR')}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {computedBalance > 0 ? 'Saldo pendiente de cancelación' : 'Cuenta al día / sin deuda'}
                </span>
              </div>

              {/* Total Compras Recibidas */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Total Insumos Facturados</span>
                  <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  $ {totalPurchased.toLocaleString('es-AR')}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Órdenes y compras históricas
                </span>
              </div>

              {/* Total Pagado */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Total Pagos Realizados</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  $ {totalPaid.toLocaleString('es-AR')}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Transferencias, cheques y efectivo
                </span>
              </div>
            </div>
          </div>

          {/* Ledger of Movements Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Libro de Movimientos & Extracto de Cuenta Corriente
                </h3>
                <p className="text-xs text-slate-500">
                  Cronograma histórico de órdenes de compra, descuentos aplicados y pagos efectuados.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {supplierLedger.length} movimientos registrados
              </span>
            </div>

            {supplierLedger.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Este proveedor no posee movimientos registrados aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Comprobante</th>
                      <th className="px-4 py-3">Concepto / Detalle Insumos</th>
                      <th className="px-4 py-3 text-right">Desc. Proveedor</th>
                      <th className="px-4 py-3 text-right">Debe (Compra)</th>
                      <th className="px-4 py-3 text-right">Haber (Pago)</th>
                      <th className="px-4 py-3 text-right">Saldo Progresivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierLedger.map((mov) => {
                      const isPurchase = mov.type === 'compra';
                      const isPayment = mov.type === 'pago';

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {new Date(mov.date).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            <span className="font-bold text-slate-900 block">{mov.docNumber}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded inline-block ${
                              isPurchase ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {mov.typeLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 max-w-xs">
                            <span className="line-clamp-2">{mov.concept}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {mov.discountAmount && mov.discountAmount > 0 ? (
                              <div>
                                <span className="font-bold text-amber-700">-{mov.discountPct}%</span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  -${mov.discountAmount.toLocaleString('es-AR')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            {mov.debit > 0 ? `$ ${mov.debit.toLocaleString('es-AR')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                            {mov.credit > 0 ? `$ ${mov.credit.toLocaleString('es-AR')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                            $ {mov.runningBalance.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: LISTADO DE PROVEEDORES (GRID)                   */}
      {/* ======================================================== */}
      {!selectedSupplierId && activeTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                placeholder="Buscar por razón social, CUIT o categoría..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-slate-800">{filteredSuppliers.length}</strong> de {suppliers.length} proveedores
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map(s => {
              const discount = s.discountPercentage || 0;
              const balance = s.currentBalance || 0;

              return (
                <div 
                  key={s.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {s.category}
                      </span>
                      {discount > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Percent className="w-3 h-3 text-amber-700" />
                          {discount}% Descuento
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        {s.businessName}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">CUIT: {s.taxId}</p>
                    </div>

                    {/* Descuento Detalle */}
                    {discount > 0 && s.discountConcept && (
                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{s.discountConcept}</span>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                      <div>Tel: <span className="font-medium text-slate-800">{s.phone || 'S/D'}</span></div>
                      <div>Email: <span className="font-medium text-slate-800">{s.email || 'S/D'}</span></div>
                      <div>Condición Pago: <strong className="text-slate-800">{s.paymentTerms}</strong></div>
                    </div>
                  </div>

                  {/* Footer with Balance and CTA */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Saldo Adeudado</span>
                      <strong className="font-mono text-sm text-slate-900">
                        $ {balance.toLocaleString('es-AR')}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditSupplier(s)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Editar datos del proveedor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedSupplierId(s.id)}
                        className="flex items-center gap-1 bg-slate-900 hover:bg-black text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition-colors"
                      >
                        Ver Cta. Cte. →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: ÓRDENES DE COMPRA & RECEPCIÓN                   */}
      {/* ======================================================== */}
      {!selectedSupplierId && activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseOrders.map(po => {
              const isReceived = po.status === 'recibido';

              return (
                <div key={po.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-slate-900">{po.orderNumber}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isReceived ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {po.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{po.supplierName}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(po.date).toLocaleDateString('es-AR')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Insumos Solicitados:</span>
                    <div className="space-y-1">
                      {po.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-slate-800">{it.quantity} un x {it.rawMaterialName}</span>
                          <span className="font-mono font-bold">$ {it.subtotal.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {po.discountAmount && po.discountAmount > 0 && (
                    <div className="text-xs text-amber-800 flex items-center justify-between px-1">
                      <span>Descuento Proveedor ({po.discountPercentage}%):</span>
                      <span className="font-mono font-bold">-${po.discountAmount.toLocaleString('es-AR')}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Insumos</span>
                      <strong className="font-mono text-sm text-slate-900">$ {po.total.toLocaleString('es-AR')}</strong>
                    </div>

                    {!isReceived ? (
                      <button
                        onClick={() => onReceivePurchaseOrder(po)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recepcionar & Stock
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Ingresado a Stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR DESCUENTO PROVEEDOR                        */}
      {/* ======================================================== */}
      {showDiscountModal && currentSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Descuento Otorgado por el Proveedor
                  </h3>
                  <p className="text-xs text-slate-500">{currentSupplier.businessName}</p>
                </div>
              </div>
              <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Porcentaje de Descuento Acordado (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editingDiscountPct}
                    onChange={e => setEditingDiscountPct(Number(e.target.value))}
                    className="w-full text-base font-mono font-bold p-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/20"
                    placeholder="Ej: 10"
                    required
                  />
                  <span className="absolute right-3 top-3 text-sm font-bold text-slate-400">%</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {[5, 8, 10, 12, 15].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setEditingDiscountPct(pct)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Concepto / Motivo del Descuento
                </label>
                <input
                  type="text"
                  value={editingDiscountConcept}
                  onChange={e => setEditingDiscountConcept(e.target.value)}
                  placeholder="Ej: Descuento comercial por compras > 1000 kg o Pronto Pago"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Este porcentaje se aplicará automáticamente al generar nuevas órdenes de compra a este proveedor.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  Guardar Descuento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR PAGO A PROVEEDOR IN-SITU                */}
      {/* ======================================================== */}
      {showPayModal && currentSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Registrar Pago a Proveedor
                  </h3>
                  <p className="text-xs text-slate-500">{currentSupplier.businessName}</p>
                </div>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaySubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Monto a Pagar (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="1"
                    value={payAmount}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="w-full text-base font-mono font-bold pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Deuda actual: <strong>${computedBalance.toLocaleString('es-AR')}</strong></span>
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.max(0, computedBalance))}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Pagar Saldo Total
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Caja o Cuenta Origen
                </label>
                <select
                  value={payCashboxId}
                  onChange={e => setPayCashboxId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                >
                  {cashboxes.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Saldo: ${b.currentBalance.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Medio de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['transferencia', 'efectivo', 'cheque'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayMethod(method)}
                      className={`py-2 text-xs font-bold uppercase rounded-xl border transition-all ${
                        payMethod === method
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notas / Nro. Comprobante / CBU
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="Ej: Transf. Galicia #9812 - Pago factura de resina"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  {isSubmittingPay ? 'Procesando...' : 'Confirmar Pago & Descargar OP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NUEVA ORDEN DE COMPRA (CON DESCUENTO)             */}
      {/* ======================================================== */}
      {showPOModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Emitir Orden de Compra de Materias Primas
              </h3>
              <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePOSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Proveedor</label>
                <select
                  value={poSupplierId}
                  onChange={e => setPoSupplierId(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.businessName} {s.discountPercentage ? `(Desc: ${s.discountPercentage}%)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount notice banner */}
              {poSupplierDiscount > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span>Descuento de proveedor activo: <strong>{poSupplierDiscount}%</strong></span>
                  </div>
                  <span className="font-mono font-bold text-amber-900">
                    Ahorro: -${poDiscountAmount.toLocaleString('es-AR')}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Insumos Solicitados</label>
                  <button
                    type="button"
                    onClick={() => setPoItems([...poItems, { rawMaterialId: rawMaterials[0]?.id || '', quantity: 500, unitCost: rawMaterials[0]?.unitCost || 1000 }])}
                    className="text-xs font-bold text-[#d31627] hover:underline"
                  >
                    + Agregar Insumo
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {poItems.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                      <select
                        value={it.rawMaterialId}
                        onChange={e => {
                          const items = [...poItems];
                          const mat = rawMaterials.find(m => m.id === e.target.value);
                          items[idx].rawMaterialId = e.target.value;
                          if (mat) items[idx].unitCost = mat.unitCost;
                          setPoItems(items);
                        }}
                        className="flex-1 text-xs p-1.5 rounded-lg border border-slate-300"
                      >
                        {rawMaterials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={e => {
                          const items = [...poItems];
                          items[idx].quantity = Number(e.target.value);
                          setPoItems(items);
                        }}
                        className="w-20 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                        placeholder="Cant."
                      />
                      <input
                        type="number"
                        min="1"
                        value={it.unitCost}
                        onChange={e => {
                          const items = [...poItems];
                          items[idx].unitCost = Number(e.target.value);
                          setPoItems(items);
                        }}
                        className="w-24 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                        placeholder="Costo"
                      />
                      <button
                        type="button"
                        onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-200">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono font-bold">$ {poSubtotal.toLocaleString('es-AR')}</span>
                </div>
                {poSupplierDiscount > 0 && (
                  <div className="flex items-center justify-between text-amber-700">
                    <span>Descuento {poSupplierDiscount}%:</span>
                    <span className="font-mono font-bold">-${poDiscountAmount.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Neto de Orden:</span>
                  <span className="font-mono">$ {poTotalWithDiscount.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observaciones</label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  placeholder="Ej: Entregar en planta Pilar, pallet cerrado"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs"
                >
                  Generar Orden de Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NUEVO O EDITAR PROVEEDOR                          */}
      {/* ======================================================== */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">
              {supplierForm.id ? 'Editar Proveedor' : 'Registrar Proveedor de Materias Primas'}
            </h3>

            <form onSubmit={handleSupplierSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social</label>
                <input
                  type="text"
                  value={supplierForm.businessName}
                  onChange={e => setSupplierForm({ ...supplierForm, businessName: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CUIT</label>
                  <input
                    type="text"
                    value={supplierForm.taxId}
                    onChange={e => setSupplierForm({ ...supplierForm, taxId: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
                  <input
                    type="text"
                    value={supplierForm.category}
                    onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    placeholder="Ej: Resinas, Envases"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Condición de Pago</label>
                <input
                  type="text"
                  value={supplierForm.paymentTerms}
                  onChange={e => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                  placeholder="Ej: 30 días F.F. o Cheques 30/60"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* SECCIÓN DESCUENTO QUE NOS OTORGA */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <span className="text-xs font-bold text-amber-900 uppercase block">
                  Descuento Otorgado por el Proveedor
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">% Descuento</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={supplierForm.discountPercentage || 0}
                        onChange={e => setSupplierForm({ ...supplierForm, discountPercentage: Number(e.target.value) })}
                        className="w-full text-xs font-bold font-mono p-2 rounded-lg border border-slate-300"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Motivo / Condición</label>
                    <input
                      type="text"
                      value={supplierForm.discountConcept || ''}
                      onChange={e => setSupplierForm({ ...supplierForm, discountConcept: e.target.value })}
                      placeholder="Ej: Pronto pago o volumen"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                >
                  {supplierForm.id ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
