import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import {
  ArrowUpDown,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Receipt,
  ShoppingCart,
  Truck,
  DollarSign,
  Building,
  CreditCard,
  X,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface UnifiedMovement {
  id: string;
  date: string;
  type: 'ingreso' | 'egreso';
  category: string;
  entityName: string;
  description: string;
  paymentMethod: string;
  amount: number;
  branchName?: string;
  sourceType: 'sale' | 'purchase' | 'cash_movement' | 'expense' | 'client_receipt' | 'supplier_payment';
  originalItem?: any;
}

export const MovementsQueryView: React.FC = () => {
  const { store, showToast, triggerRefresh } = useApp();

  // Filters State
  const [dateFrom, setDateFrom] = useState<string>('2026-08-01');
  const [dateTo, setDateTo] = useState<string>('2026-08-28');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'ingreso' | 'egreso'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [selectedMovement, setSelectedMovement] = useState<UnifiedMovement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editConcept, setEditConcept] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);

  // Build unified list of movements across sales, purchases, expenses, cash movements
  const allMovements = useMemo<UnifiedMovement[]>(() => {
    const list: UnifiedMovement[] = [];

    // 1. Completed Sales (Ingresos)
    store.sales.forEach((s) => {
      const pmLabel = s.paymentMethods?.map((p) => p.method).join(', ') || s.paymentMethod || 'Efectivo';
      const formattedPm =
        pmLabel.toLowerCase().includes('mercadopago') || pmLabel.toLowerCase().includes('transfer')
          ? 'MercadoPago Transferencia'
          : pmLabel.toLowerCase().includes('card') || pmLabel.toLowerCase().includes('tarjeta')
          ? 'Tarjeta Débito'
          : pmLabel.toLowerCase().includes('corriente')
          ? 'Cuenta Corriente'
          : 'Efectivo';

      list.push({
        id: `sale-${s.id}`,
        date: s.date,
        type: 'ingreso',
        category: 'Venta',
        entityName: s.clientName || 'Consumidor Final',
        description: `Venta ${s.invoiceNumber || s.ticketNumber || `ING-${s.id.slice(-8)}`}`,
        paymentMethod: formattedPm,
        amount: s.total,
        branchName: s.warehouseName || 'Casa Central',
        sourceType: 'sale',
        originalItem: s,
      });
    });

    // 2. Completed Purchases / Supplier Payments (Egresos)
    store.purchases.forEach((p) => {
      list.push({
        id: `purch-${p.id}`,
        date: p.date,
        type: 'egreso',
        category: 'Pago Compra',
        entityName: p.supplierName || 'Proveedor',
        description: `Pago compra - FC ${p.invoiceNumber || `FAC-${p.id.slice(-6)}`}`,
        paymentMethod: p.paymentCondition === 'cash' ? 'Efectivo' : 'Transferencia Bancaria',
        amount: p.total,
        branchName: p.warehouseName || 'Casa Central',
        sourceType: 'purchase',
        originalItem: p,
      });
    });

    // 3. Registered Expenses (Egresos)
    store.expenses.forEach((e) => {
      list.push({
        id: `exp-${e.id}`,
        date: e.date,
        type: 'egreso',
        category: 'Gasto',
        entityName: e.supplierName || e.beneficiaryName || 'Gasto General',
        description: `${e.categoryName}: ${e.description}`,
        paymentMethod: e.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
        amount: e.amount,
        branchName: 'Casa Central',
        sourceType: 'expense',
        originalItem: e,
      });
    });

    // 4. Cash Movements in boxes/sessions
    store.cashMovements.forEach((cm) => {
      // Avoid duplicates if reference is already included
      if (cm.referenceType === 'sale' || cm.referenceType === 'purchase') return;

      const isIngreso = cm.amount > 0 || cm.type === 'manual_inflow' || cm.type === 'client_payment';
      const categoryName =
        cm.type === 'client_payment'
          ? 'Cobro Cta Cte'
          : cm.type === 'supplier_payment'
          ? 'Pago Proveedor'
          : cm.type === 'expense'
          ? 'Gasto'
          : cm.type === 'transfer'
          ? 'Transferencia'
          : isIngreso
          ? 'Ingreso Vario'
          : 'Egreso Vario';

      list.push({
        id: `cm-${cm.id}`,
        date: cm.date,
        type: isIngreso ? 'ingreso' : 'egreso',
        category: categoryName,
        entityName: cm.userName || 'Administración',
        description: cm.concept,
        paymentMethod: cm.paymentMethod === 'cash' ? 'Efectivo' : cm.paymentMethod || 'Efectivo',
        amount: Math.abs(cm.amount),
        branchName: 'Casa Central',
        sourceType: 'cash_movement',
        originalItem: cm,
      });
    });

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.sales, store.purchases, store.expenses, store.cashMovements]);

  // Filtered movements based on all UI criteria
  const filteredMovements = useMemo(() => {
    return allMovements.filter((m) => {
      // Date filter
      if (dateFrom && m.date.slice(0, 10) < dateFrom) return false;
      if (dateTo && m.date.slice(0, 10) > dateTo) return false;

      // Direction filter
      if (directionFilter !== 'all' && m.type !== directionFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;

      // Payment method filter
      if (paymentMethodFilter !== 'all') {
        if (!m.paymentMethod.toLowerCase().includes(paymentMethodFilter.toLowerCase())) return false;
      }

      // Branch filter
      if (branchFilter !== 'all' && m.branchName !== branchFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          m.entityName.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.paymentMethod.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allMovements, dateFrom, dateTo, directionFilter, categoryFilter, paymentMethodFilter, branchFilter, searchTerm]);

  // Aggregate KPI Calculations
  const totalIngresosAmount = useMemo(() => {
    return filteredMovements.filter((m) => m.type === 'ingreso').reduce((acc, m) => acc + m.amount, 0);
  }, [filteredMovements]);

  const countIngresos = useMemo(() => {
    return filteredMovements.filter((m) => m.type === 'ingreso').length;
  }, [filteredMovements]);

  const totalEgresosAmount = useMemo(() => {
    return filteredMovements.filter((m) => m.type === 'egreso').reduce((acc, m) => acc + m.amount, 0);
  }, [filteredMovements]);

  const countEgresos = useMemo(() => {
    return filteredMovements.filter((m) => m.type === 'egreso').length;
  }, [filteredMovements]);

  const resultadoNeto = totalIngresosAmount - totalEgresosAmount;
  const totalMovementsCount = filteredMovements.length;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Entidad', 'Descripción', 'Forma de Pago', 'Importe'];
    const rows = filteredMovements.map((m) => [
      m.date,
      m.type === 'ingreso' ? 'Ingreso' : 'Egreso',
      m.category,
      `"${m.entityName.replace(/"/g, '""')}"`,
      `"${m.description.replace(/"/g, '""')}"`,
      m.paymentMethod,
      (m.type === 'ingreso' ? m.amount : -m.amount).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `consulta_movimientos_${dateFrom || 'inicio'}_a_${dateTo || 'fin'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo CSV exportado exitosamente', 'success');
  };

  // Delete movement
  const handleDeleteMovement = (mov: UnifiedMovement) => {
    if (confirm(`¿Eliminar este movimiento "${mov.description}"?`)) {
      if (mov.sourceType === 'cash_movement' && mov.originalItem?.id) {
        store.deleteCashMovement(mov.originalItem.id);
      }
      showToast('Movimiento eliminado', 'info');
      triggerRefresh();
    }
  };

  // Format currency
  const formatMoney = (val: number) => {
    return `$${Math.abs(val).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format DateTime
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ArrowUpDown className="w-7 h-7 text-amber-500" />
            Consulta de Movimientos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pagos, cobros, recibos y movimientos financieros
          </p>
        </div>

        <button
          id="btn-export-csv"
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-400" />
          Exportar CSV
        </button>
      </div>

      {/* Filter Bar Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
          {/* Desde */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Desde</label>
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Hasta */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Hasta</label>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Dirección</label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="ingreso">Solo Ingresos (+)</option>
              <option value="egreso">Solo Egresos (-)</option>
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas</option>
              <option value="Venta">Venta</option>
              <option value="Pago Compra">Pago Compra</option>
              <option value="Gasto">Gasto</option>
              <option value="Cobro Cta Cte">Cobro Cta Cte</option>
              <option value="Pago Proveedor">Pago Proveedor</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>

          {/* Forma de Pago */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Forma de Pago</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas</option>
              <option value="Efectivo">Efectivo</option>
              <option value="MercadoPago">MercadoPago Transferencia</option>
              <option value="Tarjeta">Tarjeta Débito / Crédito</option>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Cuenta Corriente">Cuenta Corriente</option>
            </select>
          </div>

          {/* Sucursal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Sucursal</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas</option>
              <option value="Casa Central">Casa Central</option>
              <option value="Bruzzone Express">Bruzzone Express</option>
              <option value="Depósito Central">Depósito Central</option>
            </select>
          </div>

          {/* Buscar */}
          <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Buscar</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nombre, referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ingresos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">
              Ingresos ({countIngresos})
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">
              {formatMoney(totalIngresosAmount)}
            </span>
          </div>
        </div>

        {/* Card 2: Egresos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800/40 flex items-center justify-center text-rose-400 shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">
              Egresos ({countEgresos})
            </span>
            <span className="text-lg font-black text-rose-400 font-mono tracking-tight">
              {formatMoney(totalEgresosAmount)}
            </span>
          </div>
        </div>

        {/* Card 3: Resultado Neto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Resultado Neto</span>
            <span
              className={`text-lg font-black font-mono tracking-tight ${
                resultadoNeto >= 0 ? 'text-blue-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(resultadoNeto)}
            </span>
          </div>
        </div>

        {/* Card 4: Total Movimientos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Total Movimientos</span>
            <span className="text-xl font-black text-white font-mono">{totalMovementsCount}</span>
          </div>
        </div>
      </div>

      {/* Movements Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Entidad</th>
                <th className="py-3.5 px-4">Descripción</th>
                <th className="py-3.5 px-4">Forma Pago</th>
                <th className="py-3.5 px-4 text-right">Importe</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-medium">
                    No se encontraron movimientos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isIngreso = mov.type === 'ingreso';
                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(mov.date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isIngreso
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
                          }`}
                        >
                          {isIngreso ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isIngreso ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {mov.category.includes('Venta') && <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />}
                          {mov.category.includes('Compra') && <Truck className="w-3.5 h-3.5 text-amber-400" />}
                          {mov.category.includes('Gasto') && <CreditCard className="w-3.5 h-3.5 text-purple-400" />}
                          {mov.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white max-w-[180px] truncate">
                        {mov.entityName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[220px] truncate">
                        {mov.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {mov.paymentMethod || '-'}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-black font-mono text-xs whitespace-nowrap ${
                          isIngreso ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIngreso ? '+' : '-'}
                        {formatMoney(mov.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Ver detalles"
                            onClick={() => {
                              setSelectedMovement(mov);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Editar concepto"
                            onClick={() => {
                              setSelectedMovement(mov);
                              setEditConcept(mov.description);
                              setEditAmount(mov.amount);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Eliminar movimiento"
                            onClick={() => handleDeleteMovement(mov)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal: Detalle de Movimiento */}
      {isDetailModalOpen && selectedMovement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Detalle del Movimiento
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Tipo:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                      selectedMovement.type === 'ingreso'
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-rose-950 text-rose-300'
                    }`}
                  >
                    {selectedMovement.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Fecha y Hora:</span>
                  <span className="text-white font-mono">{formatDateTime(selectedMovement.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Categoría:</span>
                  <span className="text-white font-semibold">{selectedMovement.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Entidad / Cliente / Proveedor:</span>
                  <span className="text-white font-bold">{selectedMovement.entityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Forma de Pago:</span>
                  <span className="text-slate-200">{selectedMovement.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Sucursal:</span>
                  <span className="text-slate-200">{selectedMovement.branchName || 'Casa Central'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-300 font-extrabold text-sm">Importe:</span>
                  <span
                    className={`font-black font-mono text-base ${
                      selectedMovement.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedMovement.type === 'ingreso' ? '+' : '-'}
                    {formatMoney(selectedMovement.amount)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Descripción / Referencia:</span>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 font-medium">
                  {selectedMovement.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Movimiento */}
      {isEditModalOpen && selectedMovement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                Editar Concepto
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  value={editConcept}
                  onChange={(e) => setEditConcept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMovement.sourceType === 'cash_movement' && selectedMovement.originalItem?.id) {
                      const mov = store.cashMovements.find((m) => m.id === selectedMovement.originalItem.id);
                      if (mov) {
                        mov.concept = editConcept;
                        store.saveCashRegister(store.cashRegisters[0]);
                      }
                    }
                    setIsEditModalOpen(false);
                    showToast('Movimiento actualizado', 'success');
                    triggerRefresh();
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
