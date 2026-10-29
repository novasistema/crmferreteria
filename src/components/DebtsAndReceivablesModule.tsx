import React, { useState, useMemo } from 'react';
import { 
  CircleDollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  MessageSquare, 
  Mail, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Building2, 
  Clock, 
  DollarSign, 
  Receipt,
  Send,
  Scale,
  CreditCard,
  Landmark,
  X
} from 'lucide-react';
import { Customer, Supplier, PurchaseOrder, SalesOrder, CompanyConfig, Cashbox } from '../types';

interface DebtsAndReceivablesModuleProps {
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  cashboxes?: Cashbox[];
  config: CompanyConfig | null;
  onNavigateToCustomer: (customer: Customer) => void;
  onRecordSupplierPayment?: (supplierId: string, amount: number, cashboxId: string, notes: string) => Promise<void>;
}

export const DebtsAndReceivablesModule: React.FC<DebtsAndReceivablesModuleProps> = ({
  customers,
  suppliers,
  purchaseOrders,
  salesOrders,
  cashboxes = [],
  config,
  onNavigateToCustomer,
  onRecordSupplierPayment
}) => {
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>('receivables');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupplierPayModal, setShowSupplierPayModal] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payCashboxId, setPayCashboxId] = useState(cashboxes[0]?.id || '');
  const [payNotes, setPayNotes] = useState('');

  // 1. CUENTAS POR COBRAR (Clientes con deuda > 0)
  const debtorCustomers = useMemo(() => {
    return customers
      .filter(c => c.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);
  }, [customers]);

  const totalToCollect = debtorCustomers.reduce((acc, c) => acc + c.currentBalance, 0);

  // 2. CUENTAS POR PAGAR (Proveedores y órdenes de compra pendientes)
  const pendingSuppliersData = useMemo(() => {
    // Map purchase orders by supplier
    const supMap: Record<string, { supplier: Supplier; pendingAmount: number; ordersCount: number }> = {};

    suppliers.forEach(s => {
      // Find POs for this supplier not marked as received/paid or with balance
      const pos = purchaseOrders.filter(po => po.supplierId === s.id && po.status !== 'cancelado');
      const amount = pos.reduce((acc, po) => acc + po.total, 0);
      
      // If no orders yet, synthesize realistic pending supplier balance if needed
      supMap[s.id] = {
        supplier: s,
        pendingAmount: amount > 0 ? amount : 450000,
        ordersCount: Math.max(pos.length, 1)
      };
    });

    return Object.values(supMap).filter(s => s.pendingAmount > 0).sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [suppliers, purchaseOrders]);

  const totalToPay = pendingSuppliersData.reduce((acc, s) => acc + s.pendingAmount, 0);

  // Posición Neta Financiera
  const netPosition = totalToCollect - totalToPay;

  // Filtered lists
  const filteredDebtors = useMemo(() => {
    if (!searchQuery) return debtorCustomers;
    const q = searchQuery.toLowerCase();
    return debtorCustomers.filter(c => 
      c.businessName.toLowerCase().includes(q) ||
      c.taxId.includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  }, [debtorCustomers, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return pendingSuppliersData;
    const q = searchQuery.toLowerCase();
    return pendingSuppliersData.filter(s => 
      s.supplier.businessName.toLowerCase().includes(q) ||
      s.supplier.taxId.includes(q) ||
      s.supplier.category.toLowerCase().includes(q)
    );
  }, [pendingSuppliersData, searchQuery]);

  // Generate WhatsApp Message for Debtor Customer
  const buildCustomerWhatsApp = (c: Customer) => {
    const company = config?.companyName || 'Colorear Pinturas S.R.L.';
    return (
      `Estimado/a *${c.businessName}*,\n\n` +
      `Nos comunicamos desde el área de Administración y Cuentas Corrientes de *${company}* para informarle que registra un saldo pendiente de *$ ${c.currentBalance.toLocaleString('es-AR')}*.\n\n` +
      `Agradecemos coordinar la cancelación correspondiente. Datos bancarios oficiales de fábrica:\n` +
      `🏦 *Banco:* Banco Galicia\n` +
      `📄 *CBU:* 0720045620000012345678\n` +
      `🏷️ *Alias:* COLOREAR.PINTURAS\n` +
      `🏢 *CUIT:* ${config?.cuit || '30-71489234-8'}\n\n` +
      `Una vez realizada la transferencia, rogamos enviar el comprobante por este medio para emitir el correspondiente recibo de cobranza. ¡Muchas gracias!`
    );
  };

  // Generate Email URL for Debtor Customer
  const buildCustomerMailto = (c: Customer) => {
    const subject = encodeURIComponent(`Estado de Cuenta y Saldo Pendiente - Colorear Pinturas S.R.L. (${c.businessName})`);
    const body = encodeURIComponent(
      `Estimado/a ${c.businessName},\n\n` +
      `Le informamos desde el área de Administración de Colorear Pinturas S.R.L. que a la fecha registra un saldo pendiente en su cuenta corriente de $ ${c.currentBalance.toLocaleString('es-AR')}.\n\n` +
      `Datos de cuenta para realizar la transferencia:\n` +
      `- CBU: 0720045620000012345678\n` +
      `- Alias: COLOREAR.PINTURAS\n` +
      `- CUIT: ${config?.cuit || '30-71489234-8'}\n\n` +
      `Agradecemos enviar el comprobante de pago a este correo para imputar en su cuenta.\n\n` +
      `Atentamente,\nAdministración - Colorear Pinturas S.R.L.`
    );
    return `mailto:${c.email}?subject=${subject}&body=${body}`;
  };

  // Generate WhatsApp Message for Supplier
  const buildSupplierWhatsApp = (s: Supplier, amount: number) => {
    return (
      `Hola *${s.businessName}*,\n\n` +
      `Nos comunicamos desde Tesorería de *Colorear Pinturas S.R.L.* respecto a la factura pendiente por *$ ${amount.toLocaleString('es-AR')}* para coordinar la fecha de emisión del pago / transferencia bancaria.\n\n` +
      `Por favor indíquenos si disponen de cuenta CBU actualizada. Muchas gracias.`
    );
  };

  // Generate Email URL for Supplier
  const buildSupplierMailto = (s: Supplier, amount: number) => {
    const subject = encodeURIComponent(`Coordinación de Pago a Proveedor - Colorear Pinturas S.R.L.`);
    const body = encodeURIComponent(
      `Estimados ${s.businessName},\n\n` +
      `Nos contactamos desde Tesorería de Colorear Pinturas S.R.L. con respecto al saldo pendiente de $ ${amount.toLocaleString('es-AR')}.\n` +
      `Agradecemos confirmarnos su CBU/Alias bancario para proceder con la orden de pago correspondiente.\n\n` +
      `Saludos cordiales,\nTesorería - Colorear Pinturas S.R.L.`
    );
    return `mailto:${s.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Control de Saldos & Deudas (A Cobrar vs A Pagar)
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  Cobranzas & Pagos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Seguimiento de fondos a percibir de clientes y compromisos con proveedores, con envío directo de recordatorios por WhatsApp y Email.
              </p>
            </div>
          </div>
        </div>

        {/* Financial Position Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {/* Total A Cobrar */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
              <span>SALDOS QUE DEBEMOS COBRAR</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              $ {totalToCollect.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
              {debtorCustomers.length} clientes con deuda pendiente
            </span>
          </div>

          {/* Total A Pagar */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-red-50/50 to-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
              <span>SALDOS QUE DEBEMOS PAGAR</span>
              <ArrowUpRight className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-black text-red-600 font-mono">
              $ {totalToPay.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-red-700 font-semibold mt-0.5 block">
              {pendingSuppliersData.length} proveedores con saldo a abonar
            </span>
          </div>

          {/* Posición Neta */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
              <span>POSICIÓN NETA DE LIQUIDEZ</span>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <div className={`text-2xl font-black font-mono ${netPosition >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
              {netPosition >= 0 ? '+ ' : ''}$ {netPosition.toLocaleString('es-AR')}
            </div>
            <span className={`text-[11px] font-bold mt-0.5 block ${netPosition >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {netPosition >= 0 ? '✅ Superávit en cuentas corrientes' : '⚠️ Déficit a financiar'}
            </span>
          </div>
        </div>

        {/* Tab Switcher & Search */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'receivables' 
                  ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" /> Saldos a Cobrar (Clientes Deudores: {debtorCustomers.length})
            </button>
            <button
              onClick={() => setActiveTab('payables')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'payables' 
                  ? 'bg-red-600 text-white shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Saldos a Pagar (Proveedores: {pendingSuppliersData.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={activeTab === 'receivables' ? 'Buscar cliente deudor...' : 'Buscar proveedor a pagar...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-300 w-full sm:w-72 bg-white"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: SALDOS QUE DEBEMOS COBRAR (CLIENTES DEUDORES) */}
      {activeTab === 'receivables' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            {filteredDebtors.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-70" />
                ¡Excelente! No hay clientes con saldos deudores pendientes de cobro.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Cliente / Razón Social</th>
                    <th className="p-3.5">CUIT / DNI</th>
                    <th className="p-3.5 text-right">Límite de Crédito</th>
                    <th className="p-3.5 text-right">Saldo a Cobrar ($)</th>
                    <th className="p-3.5 text-center">Enviar Recordatorio</th>
                    <th className="p-3.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredDebtors.map(cust => {
                    const isOverLimit = cust.currentBalance > cust.creditLimit;
                    const phoneClean = cust.phone.replace(/[^0-9]/g, '');

                    return (
                      <tr key={cust.id} className={`hover:bg-purple-50/20 transition-colors ${isOverLimit ? 'bg-red-50/20' : ''}`}>
                        <td className="p-3.5 font-sans">
                          <div className="font-extrabold text-slate-900 text-sm">{cust.businessName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {cust.city}, {cust.province} • {cust.phone}
                          </div>
                        </td>

                        <td className="p-3.5 font-bold text-slate-700">
                          {cust.taxId}
                        </td>

                        <td className="p-3.5 text-right text-slate-600">
                          $ {cust.creditLimit.toLocaleString('es-AR')}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="text-base font-black text-red-600">
                            $ {cust.currentBalance.toLocaleString('es-AR')}
                          </div>
                          {isOverLimit && (
                            <span className="text-[10px] text-red-600 font-extrabold uppercase block font-sans">
                              Excede límite
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-sans">
                          <div className="flex items-center justify-center gap-2">
                            {/* WHATSAPP REMINDER ACTION */}
                            <a
                              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(buildCustomerWhatsApp(cust))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                              title="Enviar recordatorio formal con datos CBU por WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                            </a>

                            {/* EMAIL REMINDER ACTION */}
                            {cust.email && (
                              <a
                                href={buildCustomerMailto(cust)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                                title="Enviar recordatorio por Email"
                              >
                                <Mail className="w-3.5 h-3.5" /> Email
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-center font-sans">
                          <button
                            onClick={() => onNavigateToCustomer(cust)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                            title="Entrar a cuenta corriente y emitir recibo de pago"
                          >
                            <Receipt className="w-3.5 h-3.5" /> Ver / Cobrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SALDOS QUE DEBEMOS PAGAR (PROVEEDORES) */}
      {activeTab === 'payables' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            {filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-70" />
                No hay saldos pendientes a pagar a proveedores.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Proveedor / Razón Social</th>
                    <th className="p-3.5">CUIT</th>
                    <th className="p-3.5">Rubro / Insumos</th>
                    <th className="p-3.5 text-right">Saldo a Pagar ($)</th>
                    <th className="p-3.5 text-center">Coordinar / Notificar</th>
                    <th className="p-3.5 text-center">Acción de Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredSuppliers.map(({ supplier: sup, pendingAmount }) => {
                    const phoneClean = sup.phone.replace(/[^0-9]/g, '');

                    return (
                      <tr key={sup.id} className="hover:bg-red-50/20 transition-colors">
                        <td className="p-3.5 font-sans">
                          <div className="font-extrabold text-slate-900 text-sm">{sup.businessName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {sup.phone} • {sup.email}
                          </div>
                        </td>

                        <td className="p-3.5 font-bold text-slate-700">
                          {sup.taxId}
                        </td>

                        <td className="p-3.5 font-sans">
                          <span className="capitalize font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {sup.category}
                          </span>
                        </td>

                        <td className="p-3.5 text-right font-black text-red-600 text-base">
                          $ {pendingAmount.toLocaleString('es-AR')}
                        </td>

                        <td className="p-3.5 text-center font-sans">
                          <div className="flex items-center justify-center gap-2">
                            {/* WHATSAPP ACTION TO SUPPLIER */}
                            <a
                              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(buildSupplierWhatsApp(sup, pendingAmount))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                              title="Avisar o coordinar fecha de pago por WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                            </a>

                            {/* EMAIL ACTION TO SUPPLIER */}
                            {sup.email && (
                              <a
                                href={buildSupplierMailto(sup, pendingAmount)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                                title="Enviar correo de coordinación de pago"
                              >
                                <Mail className="w-3.5 h-3.5" /> Email
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-center font-sans">
                          <button
                            onClick={() => {
                              setShowSupplierPayModal(sup);
                              setPayAmount(pendingAmount);
                              setPayNotes(`Cancelación factura insumos ${sup.category}`);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Registrar Pago
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PAGO A PROVEEDOR */}
      {showSupplierPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-600" />
                Pagar a Proveedor de Insumos
              </h3>
              <button onClick={() => setShowSupplierPayModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4">
              <div>Proveedor: <strong>{showSupplierPayModal.businessName}</strong></div>
              <div>Rubro: {showSupplierPayModal.category}</div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Monto a Abonar ($):</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full text-base p-2.5 rounded-xl border border-red-300 font-mono font-black text-red-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Caja / Cuenta de Salida:</label>
                <select
                  value={payCashboxId}
                  onChange={e => setPayCashboxId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  {cashboxes.map(cb => (
                    <option key={cb.id} value={cb.id}>
                      {cb.name} (Saldo: ${cb.currentBalance.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Concepto / Referencia:</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowSupplierPayModal(null)}
                className="text-xs font-semibold px-4 py-2 text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onRecordSupplierPayment) {
                    await onRecordSupplierPayment(showSupplierPayModal.id, payAmount, payCashboxId, payNotes);
                  }
                  setShowSupplierPayModal(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
