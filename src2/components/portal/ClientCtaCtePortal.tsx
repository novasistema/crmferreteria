import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientAccountMovement, Remito, Sale } from '../../types';
import {
  CreditCard,
  Building2,
  DollarSign,
  FileText,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Download,
  Printer,
  Send,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  ChevronRight,
  ShieldCheck,
  Building,
  HelpCircle,
  Copy,
  Receipt,
  LogOut,
  Globe,
  Plus,
  Package,
} from 'lucide-react';

interface ClientCtaCtePortalProps {
  client: Client;
  onLogout: () => void;
  onReturnToWeb: () => void;
}

export const ClientCtaCtePortal: React.FC<ClientCtaCtePortalProps> = ({
  client,
  onLogout,
  onReturnToWeb,
}) => {
  const { store, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'movements' | 'remitos' | 'report_payment' | 'new_order'>('movements');
  const [filterType, setFilterType] = useState<'all' | 'invoices' | 'remitos' | 'payments'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30_days'>('all');

  // Payment reporting form state
  const [paymentAmount, setPaymentAmount] = useState<number>(client.currentBalance > 0 ? client.currentBalance : 0);
  const [paymentMethodReport, setPaymentMethodReport] = useState('Transferencia Bancaria');
  const [transferRef, setTransferRef] = useState('');
  const [transferBank, setTransferBank] = useState('Banco Galicia');
  const [transferNotes, setTransferNotes] = useState('');
  const [isReportSubmitted, setIsReportSubmitted] = useState(false);

  // New Order / Quote Request
  const [orderItemsText, setOrderItemsText] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(client.address || '');
  const [urgentDelivery, setUrgentDelivery] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Selected movement for detail preview
  const [selectedMovement, setSelectedMovement] = useState<ClientAccountMovement | null>(null);

  // Fetch client movements from store
  const clientMovements = store.clientAccountMovements
    .filter((m) => m.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Fetch client remitos
  const clientRemitos = store.remitos.filter((r) => r.clientId === client.id);

  // Calculations
  const availableCredit = Math.max(0, client.creditLimit - client.currentBalance);
  const creditUsagePercent = client.creditLimit > 0
    ? Math.min(100, Math.round((client.currentBalance / client.creditLimit) * 100))
    : 0;

  const totalInvoiced = clientMovements
    .filter((m) => m.type === 'invoice')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalPaid = clientMovements
    .filter((m) => m.type === 'payment')
    .reduce((acc, m) => acc + m.amount, 0);

  const filteredMovements = clientMovements.filter((m) => {
    if (filterType === 'invoices' && m.type !== 'invoice') return false;
    if (filterType === 'remitos' && m.type !== 'remito') return false;
    if (filterType === 'payments' && m.type !== 'payment') return false;
    return true;
  });

  const handleCopyBanking = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado al portapapeles`, 'success');
  };

  const handleSendPaymentReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0 || !transferRef.trim()) {
      showToast('Por favor ingrese el importe y el número de comprobante o referencia.', 'error');
      return;
    }

    // Register movement or receipt notification
    setIsReportSubmitted(true);
    showToast('Aviso de transferencia enviado exitosamente a Administración.', 'success');
  };

  const handleSendOrderRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderItemsText.trim()) {
      showToast('Por favor ingrese los artículos o materiales solicitados.', 'error');
      return;
    }

    const whatsappMessage = `*SOLICITUD DE PEDIDO EN CUENTA CORRIENTE*\n\n*Cliente:* ${client.name}\n*CUIT:* ${client.taxId}\n*Dirección de Entrega:* ${deliveryAddress}\n*Prioridad:* ${urgentDelivery ? 'URGENTE EN OBRA' : 'Normal'}\n\n*Materiales Solicitados:*\n${orderItemsText}\n\n*Observaciones:* ${orderNotes || 'Ninguna'}`;
    const whatsappUrl = `https://wa.me/5493584354998?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    showToast('Pedido enviado a su asesor comercial vía WhatsApp', 'success');
    setOrderItemsText('');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950 text-slate-100 font-sans custom-scrollbar">
      {/* Top Navbar for Client Portal */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                FERRETERÍA BRUZZONE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                Portal Cuenta Corriente
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cliente: <span className="font-bold text-white">{client.name}</span> • CUIT/DNI: <span className="font-mono text-slate-300">{client.taxId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onReturnToWeb}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Web de Inicio</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/30 flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Account Financial Status Banners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo Deudor */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Saldo Deudor Actual
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              ${client.currentBalance.toLocaleString('es-AR')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              {client.currentBalance > 0 ? (
                <span className="text-amber-400 font-semibold flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> Saldo pendiente de pago
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Cuenta al día sin deuda
                </span>
              )}
            </p>
          </div>

          {/* Límite de Crédito */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Límite de Crédito
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ${client.creditLimit.toLocaleString('es-AR')}
            </div>
            <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  creditUsagePercent > 85 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${creditUsagePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {creditUsagePercent}% de la línea de crédito utilizada
            </p>
          </div>

          {/* Crédito Disponible */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Crédito Disponible
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              ${availableCredit.toLocaleString('es-AR')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Monto disponible para nuevos retiros en sucursal
            </p>
          </div>

          {/* Facturación y Remitos */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Remitos de Entrega
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
              {clientRemitos.length} comprobantes
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Entregas registradas en obras y talleres
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'movements'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Estado de Cuenta & Movimientos ({clientMovements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remitos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'remitos'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Remitos de Entrega ({clientRemitos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report_payment')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'report_payment'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Informar Pago / Transferencia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new_order')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'new_order'
                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Solicitar Pedido / Cotización de Materiales</span>
          </button>
        </div>

        {/* TAB 1: MOVEMENTS & ACCOUNT LEDGER */}
        {activeTab === 'movements' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white">Detalle de Comprobantes y Pagos</h3>
                <p className="text-xs text-slate-400">
                  Historial cronológico de compras con remito, facturación y pagos recibidos
                </p>
              </div>

              {/* Sub-Filters */}
              <div className="flex items-center space-x-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-slate-950 text-xs font-semibold text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">Todos los Comprobantes</option>
                  <option value="invoices">Facturas / Débitos</option>
                  <option value="remitos">Remitos de Entrega</option>
                  <option value="payments">Pagos y Recibos</option>
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir Resumen</span>
                </button>
              </div>
            </div>

            {/* Movements Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Tipo / Comprobante</th>
                    <th className="py-3 px-3">Detalle / Concepto</th>
                    <th className="py-3 px-3 text-right">Débito (+)</th>
                    <th className="py-3 px-3 text-right">Crédito / Pago (-)</th>
                    <th className="py-3 px-3 text-right">Saldo Acumulado</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No hay movimientos registrados para este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => {
                      const isInvoice = mov.type === 'invoice';
                      const isPayment = mov.type === 'payment';
                      const isRemito = mov.type === 'remito';

                      return (
                        <tr key={mov.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {new Date(mov.date).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center space-x-1 ${
                                isInvoice
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : isPayment
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {isPayment ? <ArrowDownLeft className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                              <span>{mov.documentNumber || mov.type.toUpperCase()}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-medium max-w-xs truncate">
                            {mov.description}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-rose-400">
                            {isInvoice || isRemito ? `$${mov.amount.toLocaleString('es-AR')}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-emerald-400">
                            {isPayment ? `$${mov.amount.toLocaleString('es-AR')}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-white font-mono">
                            ${mov.runningBalance?.toLocaleString('es-AR') || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                showToast(`Descargando comprobante ${mov.documentNumber}...`, 'info');
                              }}
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                              title="Descargar Comprobante PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
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

        {/* TAB 2: REMITOS DE ENTREGA */}
        {activeTab === 'remitos' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white">Remitos de Entrega de Mercadería</h3>
                <p className="text-xs text-slate-400">
                  Control de despachos y recepciones en obra o sucursal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientRemitos.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-slate-500">
                  No hay remitos de entrega registrados para este cliente.
                </div>
              ) : (
                clientRemitos.map((remito) => (
                  <div
                    key={remito.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-black">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">{remito.code}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {new Date(remito.date).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {remito.status === 'invoiced' ? 'Facturado' : 'Pendiente de Facturar'}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg text-xs space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-semibold">Artículos entregados:</p>
                      {remito.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="font-bold text-white">${item.subtotal.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400">Total Remitado:</span>
                      <span className="font-black text-amber-400">${remito.total.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INFORMAR PAGO / TRANSFERENCIA BANCARIA */}
        {activeTab === 'report_payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Banking Data of Ferretería Bruzzone */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Datos Bancarios para Transferencias</h4>
                  <p className="text-[11px] text-slate-400">Ferretería Bruzzone (SERASSIO MAURICIO)</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Banco</span>
                  <p className="font-black text-white">Banco Galicia / Banco Nación</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Alias CBU</span>
                    <span className="font-mono font-black text-amber-400 text-sm">ferreteria.bruzzone</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyBanking('ferreteria.bruzzone', 'Alias')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copiar Alias"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">CBU</span>
                    <span className="font-mono font-black text-white text-xs">0070123130000049182391</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyBanking('0070123130000049182391', 'CBU')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copiar CBU"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">CUIT Titular</span>
                    <span className="font-mono font-black text-white text-xs">20-30800287-0</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyBanking('20-30800287-0', 'CUIT')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copiar CUIT"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-[11px] text-emerald-300 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    Una vez transferido, cargue el formulario contiguo y la acreditación impactará automáticamente en su saldo.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Payment Notification Form */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-base font-extrabold text-white">Formulario de Aviso de Transferencia</h3>
                <p className="text-xs text-slate-400">
                  Notifique su pago para emitir el recibo oficial y liberar su crédito
                </p>
              </div>

              {isReportSubmitted ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-white">¡Aviso de Pago Registrado con Éxito!</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Hemos recibido la constancia de su transferencia por{' '}
                    <span className="font-bold text-emerald-400">${paymentAmount.toLocaleString('es-AR')}</span>. Nuestro equipo administrativo validará la acreditación y le enviará el Recibo Oficial.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReportSubmitted(false);
                      setTransferRef('');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow"
                  >
                    Informar Otro Pago
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendPaymentReport} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Monto Transferido ($) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 text-white font-extrabold text-sm rounded-xl p-3 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Banco de Origen / Billetera *
                      </label>
                      <input
                        type="text"
                        required
                        value={transferBank}
                        onChange={(e) => setTransferBank(e.target.value)}
                        placeholder="Ej. Banco Galicia, MercadoPago, etc."
                        className="w-full bg-slate-950 text-white text-xs font-semibold rounded-xl p-3 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        N° de Comprobante / Referencia Transferencia *
                      </label>
                      <input
                        type="text"
                        required
                        value={transferRef}
                        onChange={(e) => setTransferRef(e.target.value)}
                        placeholder="Ej. TRANSF-8910482"
                        className="w-full bg-slate-950 text-white text-xs font-mono rounded-xl p-3 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Fecha de la Operación *
                      </label>
                      <input
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Observaciones / Imputar a Factura Específica:
                    </label>
                    <textarea
                      rows={2}
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                      placeholder="Ej. Pago correspondiente a compras de la semana en obra..."
                      className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Comprobante de Pago</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SOLICITAR PEDIDO / COTIZACIÓN */}
        {activeTab === 'new_order' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 max-w-3xl mx-auto">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">Solicitud Directa de Pedido o Cotización</h3>
                <p className="text-xs text-slate-400">
                  Envíe su listado de materiales y herramientas para preparar entrega o retiro en sucursal
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <form onSubmit={handleSendOrderRequest} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Listado de Materiales y Cantidades Requeridas *
                </label>
                <textarea
                  rows={4}
                  required
                  value={orderItemsText}
                  onChange={(e) => setOrderItemsText(e.target.value)}
                  placeholder="Ej:&#10;- 20 bolsas Cemento Holcim 50kg&#10;- 10 barras de Hierro del 8mm&#10;- 1 caja Discos de Corte Tyrolit 115mm&#10;- 2 baldes Pintura Látex Exterior 20L"
                  className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-700 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Dirección de Entrega / Destino de Obra *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ej. Bv. Chacabuco 1250, Nave 3"
                    className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={urgentDelivery}
                    onChange={(e) => setUrgentDelivery(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-700"
                  />
                  <label htmlFor="urgent" className="font-bold text-amber-400 cursor-pointer">
                    Solicitud Prioritaria / Urgente en Obra
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Indicaciones adicionales para el chofer / flete:
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ej. Descarga con pluma / horario de 8 a 12hs"
                  className="w-full bg-slate-950 text-white rounded-xl p-3 border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Pedido por WhatsApp a su Asesor de Cuenta</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
