import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Printer, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Truck, 
  Trash2, 
  AlertTriangle,
  User,
  ShoppingBag,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  FileCheck
} from 'lucide-react';
import { Quote, QuoteStatus, Customer, Product, CompanyConfig, SalesOrder, DeliveryOrder } from '../types';
import { generateQuotePDF } from '../utils/quoteAndDeliveryPdfUtils';

interface QuotesModuleProps {
  quotes: Quote[];
  customers: Customer[];
  products: Product[];
  config: CompanyConfig | null;
  onSaveQuote: (quote: Quote) => Promise<void>;
  onDeleteQuote: (quoteId: string) => Promise<void>;
  onUpdateQuoteStatus: (quoteId: string, status: QuoteStatus) => Promise<void>;
  onConvertToSale: (quote: Quote) => Promise<void>;
  onConvertToRemito: (quote: Quote) => Promise<void>;
  onOpenTerminalWithQuote: (quote: Quote) => void;
  onOpenNewQuoteTerminal: () => void;
}

export const QuotesModule: React.FC<QuotesModuleProps> = ({
  quotes,
  customers,
  products,
  config,
  onSaveQuote,
  onDeleteQuote,
  onUpdateQuoteStatus,
  onConvertToSale,
  onConvertToRemito,
  onOpenTerminalWithQuote,
  onOpenNewQuoteTerminal
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<Quote | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Filtered quotes
  const filteredQuotes = quotes.filter(q => {
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesSearch = 
      searchQuery === '' ||
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerTaxId.includes(searchQuery) ||
      q.items.some(it => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // KPIs
  const totalQuotesCount = quotes.length;
  const totalQuotedAmount = quotes.reduce((acc, q) => acc + q.total, 0);
  const approvedQuotes = quotes.filter(q => q.status === 'aprobado' || q.status === 'convertido_a_pedido');
  const approvedAmount = approvedQuotes.reduce((acc, q) => acc + q.total, 0);
  const conversionRate = totalQuotesCount > 0 ? Math.round((approvedQuotes.length / totalQuotesCount) * 100) : 0;

  // Status badge styling
  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'aprobado':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Aprobado
          </span>
        );
      case 'convertido_a_pedido':
        return (
          <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-purple-600" /> Convertido a Venta
          </span>
        );
      case 'enviado':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <Send className="w-3 h-3 text-blue-600" /> Enviado al Cliente
          </span>
        );
      case 'vencido':
        return (
          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Vencido
          </span>
        );
      case 'rechazado':
        return (
          <span className="bg-slate-200 text-slate-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <XCircle className="w-3 h-3 text-slate-500" /> Rechazado
          </span>
        );
      case 'borrador':
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Borrador
          </span>
        );
    }
  };

  // Convert quote to sale
  const handleConvertSale = async (quote: Quote) => {
    if (!confirm(`¿Desea convertir el Presupuesto ${quote.quoteNumber} a una Orden de Venta / Factura confirmada?`)) return;
    setIsProcessingAction(true);
    try {
      await onConvertToSale(quote);
      await onUpdateQuoteStatus(quote.id, 'convertido_a_pedido');
      alert(`¡Presupuesto ${quote.quoteNumber} convertido exitosamente en Pedido de Venta!`);
    } catch (err) {
      console.error(err);
      alert('Error al convertir presupuesto a venta.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Convert quote to remito
  const handleConvertRemito = async (quote: Quote) => {
    if (!confirm(`¿Desea generar un Remito de Salida físico directamente desde el Presupuesto ${quote.quoteNumber}?`)) return;
    setIsProcessingAction(true);
    try {
      await onConvertToRemito(quote);
      alert(`¡Remito generado con éxito desde el Presupuesto ${quote.quoteNumber}!`);
    } catch (err) {
      console.error(err);
      alert('Error al generar remito desde presupuesto.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Informative Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-blue-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider">
              Módulo Comercial & Cotizaciones
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
              Conversión en 1 Clic a Venta o Remito
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Presupuestos & Cotizaciones de Pinturas
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Emita cotizaciones comerciales con validez de precios, descuentos especiales por volumen y listas diferenciadas (Mostrador, Mayorista, Distribuidor). Convierta cualquier presupuesto aprobado en Venta Facturada o Remito de Salida inmediatamente.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Presupuestos Emitidos</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalQuotesCount}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
            {approvedQuotes.length} confirmados o convertidos
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monto Total Cotizado</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-900 font-mono">
            ${totalQuotedAmount.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
            Precios vigentes con IVA
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monto Aprobado</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-900 font-mono">
            ${approvedAmount.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Ventas concretadas
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tasa de Conversión</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">
            {conversionRate}%
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
            Presupuestos a pedidos
          </div>
        </div>
      </div>

      {/* ACTION BAR & FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° Presupuesto, cliente, CUIT o producto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800"
            >
              <option value="all">Todos los Estados</option>
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado al Cliente</option>
              <option value="aprobado">Aprobado</option>
              <option value="convertido_a_pedido">Convertido a Venta</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </div>

        {/* Primary Action: Crear Presupuesto en Terminal */}
        <button
          onClick={onOpenNewQuoteTerminal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Presupuesto (Terminal Mostrador)</span>
        </button>
      </div>

      {/* QUOTES LIST */}
      <div className="space-y-3">
        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              No se encontraron presupuestos registrados con los filtros seleccionados.
            </p>
            <button
              onClick={onOpenNewQuoteTerminal}
              className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              Crear Primer Presupuesto
            </button>
          </div>
        ) : (
          filteredQuotes.map(quote => {
            const isExpired = new Date(quote.validUntil).getTime() < Date.now() && quote.status !== 'convertido_a_pedido' && quote.status !== 'aprobado';
            const totalUnits = quote.items.reduce((s, it) => s + it.quantity, 0);

            // WhatsApp Message
            const clientPhoneClean = (quote.customerPhone || '').replace(/[^0-9]/g, '');
            const customWhatsAppMsg = `Hola ${quote.customerName}, le enviamos el Presupuesto Oficial N° ${quote.quoteNumber} de Colorear Pinturas por un total de $${quote.total.toLocaleString('es-AR')}. Incluye ${totalUnits} bultos/envases con validez hasta el ${new Date(quote.validUntil).toLocaleDateString('es-AR')}. Para confirmar su pedido puede responder a este mensaje.`;

            return (
              <div 
                key={quote.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header row: Number, Date, Customer, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-xs">
                      {quote.quoteNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Fecha: {new Date(quote.date).toLocaleDateString('es-AR')}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      isExpired ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Vence: {new Date(quote.validUntil).toLocaleDateString('es-AR')} {isExpired ? '(Vencido)' : ''}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Lista: {quote.priceList}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(quote.status)}
                    <select
                      value={quote.status}
                      onChange={e => onUpdateQuoteStatus(quote.id, e.target.value as QuoteStatus)}
                      className="border border-slate-200 rounded-lg text-[11px] px-2 py-1 bg-white font-semibold text-slate-700"
                    >
                      <option value="borrador">Borrador</option>
                      <option value="enviado">Enviado</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="convertido_a_pedido">Convertido a Venta</option>
                      <option value="vencido">Vencido</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </div>
                </div>

                {/* Customer and Totals breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Cliente Destinatario:</span>
                    <strong className="text-slate-900 text-sm block">{quote.customerName}</strong>
                    <div className="text-slate-500 font-mono text-[11px]">
                      CUIT: {quote.customerTaxId || 'S/D'} {quote.customerPhone ? `| Tel: ${quote.customerPhone}` : ''}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Condición Comercial:</span>
                    <div className="font-semibold text-slate-800">{quote.paymentCondition || 'Contado contra entrega'}</div>
                    {quote.notes && (
                      <div className="text-[11px] text-slate-500 italic truncate max-w-xs">
                        Nota: {quote.notes}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Monto Cotizado:</span>
                    <div className="font-mono font-black text-xl text-blue-900">
                      ${quote.total.toLocaleString('es-AR')},00
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Subtotal: ${quote.subtotal.toLocaleString('es-AR')} {quote.taxAmount > 0 ? `+ IVA: $${quote.taxAmount.toLocaleString('es-AR')}` : ''}
                    </div>
                  </div>
                </div>

                {/* Items Summary Strip */}
                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                    <span>Detalle de Pinturas ({quote.items.length} productos | {totalUnits} bultos):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {quote.items.map((it, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200/80 flex justify-between items-center text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-800 truncate block">{it.productName}</span>
                          <span className="text-[10px] text-slate-500">{it.presentation} | ${it.unitPrice.toLocaleString('es-AR')} c/u</span>
                        </div>
                        <span className="font-mono font-black text-blue-800 shrink-0">
                          {it.quantity} un.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* PDF Download */}
                    <button
                      onClick={() => generateQuotePDF(quote, config)}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors"
                      title="Descargar presupuesto oficial en PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Descargar PDF</span>
                    </button>

                    {/* WhatsApp */}
                    {quote.customerPhone && (
                      <a
                        href={`https://wa.me/${clientPhoneClean}?text=${encodeURIComponent(customWhatsAppMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* Edit in Terminal */}
                    <button
                      onClick={() => onOpenTerminalWithQuote(quote)}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver / Cargar en Terminal</span>
                    </button>
                  </div>

                  {/* 1-Click Conversions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConvertRemito(quote)}
                      disabled={isProcessingAction}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                      title="Generar remito físico de entrega"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Emitir Remito</span>
                    </button>

                    <button
                      onClick={() => handleConvertSale(quote)}
                      disabled={isProcessingAction || quote.status === 'convertido_a_pedido'}
                      className={`flex items-center gap-1.5 text-xs font-black px-4 py-1.5 rounded-lg shadow-md transition-transform active:scale-95 disabled:opacity-50 ${
                        quote.status === 'convertido_a_pedido'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300 cursor-default'
                          : 'bg-[#d31627] hover:bg-red-700 text-white'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>
                        {quote.status === 'convertido_a_pedido' ? 'Ya Convertido a Venta' : 'Convertir a Pedido de Venta'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar presupuesto ${quote.quoteNumber}?`)) {
                          onDeleteQuote(quote.id);
                        }
                      }}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                      title="Eliminar presupuesto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
