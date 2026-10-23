import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote, QuoteItem, PaymentMethod, SaleItem, SalePayment } from '../../types';
import { QuoteEditorModal } from './QuoteEditorModal';
import {
  FileText,
  Plus,
  Search,
  ShoppingCart,
  Printer,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  ArrowRight,
  Copy,
  Calendar,
  AlertCircle,
  CheckCircle2,
  User,
  Filter,
  Layers,
  ChevronRight,
  Building2,
  DollarSign,
  TrendingUp,
  Tag,
  Phone,
  Mail,
  MapPin,
  X,
} from 'lucide-react';

export const QuotesView: React.FC = () => {
  const { store, currentUser, showToast, setActiveModule } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'converted_to_sale' | 'expired'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<Quote | null>(null);

  // Filtered quotes based on search and status tabs
  const filteredQuotes = useMemo(() => {
    return store.quotes.filter((q) => {
      const isExpired = new Date(q.expiryDate) < new Date() && q.status === 'pending';

      // Status filter
      if (statusFilter === 'pending' && (q.status !== 'pending' || isExpired)) return false;
      if (statusFilter === 'converted_to_sale' && q.status !== 'converted_to_sale') return false;
      if (statusFilter === 'expired' && !isExpired && q.status !== 'expired') return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        q.code.toLowerCase().includes(term) ||
        q.clientName.toLowerCase().includes(term) ||
        (q.clientTaxId && q.clientTaxId.includes(term)) ||
        (q.notes && q.notes.toLowerCase().includes(term)) ||
        q.items.some((i) => i.productName.toLowerCase().includes(term) || i.productCode.toLowerCase().includes(term))
      );
    });
  }, [store.quotes, searchTerm, statusFilter]);

  // Key KPI stats
  const stats = useMemo(() => {
    const totalQuotes = store.quotes.length;
    const now = new Date();
    const active = store.quotes.filter((q) => q.status === 'pending' && new Date(q.expiryDate) >= now);
    const converted = store.quotes.filter((q) => q.status === 'converted_to_sale');
    const expired = store.quotes.filter((q) => q.status === 'pending' && new Date(q.expiryDate) < now);

    const activeAmount = active.reduce((acc, q) => acc + q.total, 0);
    const convertedAmount = converted.reduce((acc, q) => acc + q.total, 0);

    return {
      totalCount: totalQuotes,
      activeCount: active.length,
      convertedCount: converted.length,
      expiredCount: expired.length,
      activeAmount,
      convertedAmount,
    };
  }, [store.quotes]);

  // Open New Quote Modal
  const handleOpenNewQuote = () => {
    setEditingQuote(null);
    setIsEditorOpen(true);
  };

  // Open Edit Quote Modal
  const handleOpenEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setIsEditorOpen(true);
  };

  // Duplicate quote
  const handleDuplicateQuote = (quote: Quote) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const clonedItems: QuoteItem[] = quote.items.map((i) => ({ ...i }));
    const newQuote = store.createQuote({
      clientId: quote.clientId,
      items: clonedItems,
      validityDays: 7,
      notes: quote.notes ? `${quote.notes} (Copia de ${quote.code})` : 'Presupuesto duplicado.',
      warehouseId: quote.warehouseId,
      priceListId: quote.priceListId,
      discountPercent: quote.discountPercent,
      user: currentUser,
    });

    showToast(`Presupuesto duplicado como ${newQuote.code}`, 'success');
    setEditingQuote(newQuote);
    setIsEditorOpen(true);
  };

  // Delete quote
  const handleDeleteQuote = (quote: Quote) => {
    if (confirm(`¿Está seguro de eliminar el presupuesto ${quote.code}? Esta acción no se puede deshacer.`)) {
      store.deleteQuote(quote.id);
      showToast(`Presupuesto ${quote.code} eliminado correctamente`, 'info');
    }
  };

  // Direct conversion to sale
  const handleConvertToSale = (quote: Quote) => {
    if (quote.items.length === 0) {
      showToast('El presupuesto no contiene artículos', 'error');
      return;
    }

    const effectiveWarehouseId =
      quote.warehouseId || store.warehouses.find((w) => w.isMain)?.id || store.warehouses[0]?.id || '1';

    const saleItems: SaleItem[] = quote.items.map((i) => {
      const prod = store.products.find((p) => p.id === i.productId);
      return {
        productId: i.productId,
        productCode: i.productCode,
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit || prod?.unit || 'un.',
        unitPrice: i.unitPrice,
        discountPercent: i.discountPercent || 0,
        subtotal: i.subtotal,
        unitCost: prod?.costPrice || 0,
        vatRate: prod?.vatRate || 21,
      };
    });

    const payments: SalePayment[] = [
      {
        id: `pay-${Date.now()}`,
        method: 'cash',
        amount: quote.total,
        referenceNumber: `Presupuesto ${quote.code}`,
      },
    ];

    const sale = store.processSale({
      clientId: quote.clientId,
      warehouseId: effectiveWarehouseId,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      priceListId: quote.priceListId || '1',
      items: saleItems,
      discountAmount: quote.discountTotal || 0,
      payments,
      documentType: 'Factura B',
      notes: `Venta generada a partir del Presupuesto ${quote.code}. ${quote.notes || ''}`,
      user: currentUser,
    });

    quote.status = 'converted_to_sale';
    quote.convertedSaleId = sale.id;
    store.updateQuote(quote);

    showToast(`Presupuesto ${quote.code} facturado exitosamente. Ticket ${sale.ticketNumber}`, 'success');
    setActiveModule('sales_history');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Presupuestos & Cotizaciones</h2>
            <p className="text-xs text-slate-400">
              Creación y edición con formato POS, precios personalizados por ítem y facturación directa
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewQuote}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Presupuesto [F2]</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800/80 shrink-0">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Cotizaciones</span>
            <div className="text-lg font-black text-white">{stats.totalCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400">Vigentes (En Plazo)</span>
            <div className="text-lg font-black text-emerald-400">{stats.activeCount}</div>
            <span className="text-[10px] text-slate-400 font-mono">
              ${stats.activeAmount.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-cyan-400">Convertidos a Venta</span>
            <div className="text-lg font-black text-cyan-400">{stats.convertedCount}</div>
            <span className="text-[10px] text-slate-400 font-mono">
              ${stats.convertedAmount.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-400">Vencidos / No Aprobados</span>
            <div className="text-lg font-black text-rose-400">{stats.expiredCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por código (ej: PRE-0001), cliente, CUIT, producto u observaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white rounded-xl pl-9 pr-3 py-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({store.quotes.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vigentes ({stats.activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('converted_to_sale')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'converted_to_sale'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Facturados ({stats.convertedCount})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'expired'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vencidos ({stats.expiredCount})
            </button>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Mostrando <strong className="text-white">{filteredQuotes.length}</strong> presupuestos
        </span>
      </div>

      {/* List / Table */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {filteredQuotes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <FileText className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-300">No se encontraron presupuestos</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              No hay cotizaciones que coincidan con los criterios de búsqueda o el filtro seleccionado.
            </p>
            <button
              onClick={handleOpenNewQuote}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
            >
              Crear Nuevo Presupuesto
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700">
                <tr>
                  <th className="p-3.5">Código</th>
                  <th className="p-3.5">Fecha & Vencimiento</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5 text-center">Ítems</th>
                  <th className="p-3.5 text-right">Total Cotizado</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5">Vendedor</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredQuotes.map((q) => {
                  const isExpired = new Date(q.expiryDate) < new Date() && q.status === 'pending';
                  const totalItemsCount = q.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Code */}
                      <td className="p-3.5">
                        <span className="font-mono font-black text-amber-400 block">{q.code}</span>
                        {q.priceListId && (
                          <span className="text-[10px] text-slate-500">
                            {q.priceListId === 'pl-mayorista'
                              ? 'Mayorista'
                              : q.priceListId === 'pl-gremio'
                              ? 'Gremio'
                              : 'Minorista'}
                          </span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="p-3.5">
                        <span className="block text-white font-medium">
                          {new Date(q.date).toLocaleDateString('es-AR')}
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span
                            className={`text-[10px] font-semibold ${
                              isExpired ? 'text-rose-400 font-bold' : 'text-slate-400'
                            }`}
                          >
                            Vence: {new Date(q.expiryDate).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="p-3.5">
                        <span className="font-bold text-white block">{q.clientName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">CUIT/DNI: {q.clientTaxId}</span>
                      </td>

                      {/* Items Count */}
                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-300 font-mono font-bold rounded text-[11px] border border-slate-700">
                          {q.items.length} ({totalItemsCount} un.)
                        </span>
                      </td>

                      {/* Total */}
                      <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                        ${q.total.toLocaleString('es-AR')}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            q.status === 'converted_to_sale'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : isExpired
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {q.status === 'converted_to_sale'
                            ? 'Venta Facturada'
                            : isExpired
                            ? 'Vencido'
                            : 'Vigente'}
                        </span>
                      </td>

                      {/* User */}
                      <td className="p-3.5 text-slate-400">{q.userName}</td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Edit Quote Button */}
                          <button
                            onClick={() => handleOpenEditQuote(q)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 transition-colors"
                            title="Editar Presupuesto (Modificar productos y precios)"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Convert to Sale Button */}
                          {q.status === 'pending' && (
                            <button
                              onClick={() => handleConvertToSale(q)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center space-x-1 shadow transition-colors"
                              title="Facturar venta ahora con estos ítems y precios"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Facturar</span>
                            </button>
                          )}

                          {/* Print Button */}
                          <button
                            onClick={() => setSelectedQuoteForPrint(q)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title="Imprimir / Ver Comprobante PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate Button */}
                          <button
                            onClick={() => handleDuplicateQuote(q)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                            title="Duplicar Presupuesto"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteQuote(q)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition-colors"
                            title="Eliminar Presupuesto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POS-Style Quote Editor / Creator Modal */}
      <QuoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingQuote(null);
        }}
        quoteToEdit={editingQuote}
        onSaved={(savedQuote, shouldPrint) => {
          setIsEditorOpen(false);
          setEditingQuote(null);
          if (shouldPrint) {
            setSelectedQuoteForPrint(savedQuote);
          }
        }}
        onConvertToSale={(quote) => {
          setIsEditorOpen(false);
          setEditingQuote(null);
          handleConvertToSale(quote);
        }}
      />

      {/* Printable Quote Modal */}
      {selectedQuoteForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Header / Company */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-6 h-6 text-amber-600" />
                  <h2 className="text-xl font-black tracking-tight">{store.settings.tradeName}</h2>
                </div>
                <p className="text-xs text-slate-600">
                  {store.settings.legalName} • CUIT: <strong>{store.settings.cuit}</strong>
                </p>
                <p className="text-xs text-slate-600">
                  {store.settings.address} • Tel: {store.settings.phone}
                </p>
                <p className="text-xs text-slate-600">Condición IVA: Responsable Inscripto</p>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
                  PRESUPUESTO / COTIZACIÓN
                </div>
                <span className="text-xl font-black text-amber-600 font-mono block">
                  {selectedQuoteForPrint.code}
                </span>
                <span className="text-xs text-slate-500 block">
                  Fecha de Emisión: {new Date(selectedQuoteForPrint.date).toLocaleDateString('es-AR')}
                </span>
                <span className="text-xs text-rose-600 font-bold block">
                  Válido hasta: {new Date(selectedQuoteForPrint.expiryDate).toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>

            {/* Client Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Cliente</span>
                <strong className="text-sm text-slate-900 block">{selectedQuoteForPrint.clientName}</strong>
                <span className="text-slate-600">CUIT/DNI: {selectedQuoteForPrint.clientTaxId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Datos de Contacto</span>
                <span className="text-slate-700 block">
                  Dirección: {selectedQuoteForPrint.clientAddress || 'No especificada'}
                </span>
                <span className="text-slate-700 block">
                  Teléfono: {selectedQuoteForPrint.clientPhone || 'No especificado'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center">Cant.</th>
                  <th className="p-2.5">Código</th>
                  <th className="p-2.5">Descripción del Producto / Servicio</th>
                  <th className="p-2.5 text-right">P. Unitario</th>
                  <th className="p-2.5 text-center">Desc %</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedQuoteForPrint.items.map((i, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center font-bold">{i.quantity}</td>
                    <td className="p-2.5 font-mono text-slate-600">{i.productCode}</td>
                    <td className="p-2.5 font-medium">{i.productName}</td>
                    <td className="p-2.5 text-right font-mono">${i.unitPrice.toLocaleString('es-AR')}</td>
                    <td className="p-2.5 text-center font-mono">
                      {i.discountPercent ? `${i.discountPercent}%` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      ${i.subtotal.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <strong className="block text-slate-800 text-[11px] uppercase tracking-wider">
                  Condiciones Comerciales & Validez:
                </strong>
                <p className="text-slate-600 text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedQuoteForPrint.notes ||
                    'Presupuesto sujeto a variación luego del período de validez. Incluye IVA.'}
                </p>
                <div className="pt-2 text-[10px] text-slate-500">
                  Emitido por: {selectedQuoteForPrint.userName}
                </div>
              </div>

              <div className="text-right space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">
                    ${selectedQuoteForPrint.subtotal.toLocaleString('es-AR')}
                  </span>
                </div>
                {selectedQuoteForPrint.discountTotal > 0 && (
                  <div className="flex justify-between text-xs text-amber-700 font-semibold">
                    <span>
                      Descuento Bonificado ({selectedQuoteForPrint.discountPercent}%):
                    </span>
                    <span className="font-mono">
                      -${selectedQuoteForPrint.discountTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-2">
                  <span>TOTAL PRESUPUESTADO:</span>
                  <span className="font-mono text-emerald-700 text-lg">
                    ${selectedQuoteForPrint.total.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Valores expresados en Pesos Argentinos ($ ARS)</p>
              </div>
            </div>

            {/* Signatures Line for Print */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
              <div>
                <div className="border-b border-slate-300 w-44 mx-auto mb-1"></div>
                <span>Firma / Aceptación del Cliente</span>
              </div>
              <div>
                <div className="border-b border-slate-300 w-44 mx-auto mb-1"></div>
                <span>Firma Autorizada - {store.settings.tradeName}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedQuoteForPrint(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800 transition-colors"
              >
                Cerrar
              </button>

              <div className="flex items-center space-x-2">
                {selectedQuoteForPrint.status === 'pending' && (
                  <button
                    onClick={() => {
                      const q = selectedQuoteForPrint;
                      setSelectedQuoteForPrint(null);
                      handleConvertToSale(q);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-slate-950 shadow flex items-center space-x-1.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Facturar Venta Ahora</span>
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 shadow-lg flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Presupuesto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
