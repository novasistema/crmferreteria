import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Warehouse, StockTransfer, StockTransferItem } from '../../types';
import {
  Building,
  Store,
  Warehouse as WarehouseIcon,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  Package,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  FileText,
  Sliders,
  Landmark,
  ShieldCheck,
  Tag,
  Boxes,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export const BranchesManagementView: React.FC = () => {
  const {
    store,
    activeWarehouseId,
    setActiveWarehouseId,
    currentUser,
    setCurrentUser,
    setActiveModule,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'branches' | 'transfers' | 'stock_matrix' | 'branch_cash'>('branches');

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Warehouse | null>(null);
  const [branchFormData, setBranchFormData] = useState<Partial<Warehouse>>({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    whatsapp: '',
    email: '',
    managerName: '',
    fiscalPointOfSale: 1,
    type: 'branch_store',
    isMain: false,
    active: true,
  });

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string>(activeWarehouseId || '1');
  const [transferTo, setTransferTo] = useState<string>('2');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferSearchProduct, setTransferSearchProduct] = useState('');
  const [transferItems, setTransferItems] = useState<StockTransferItem[]>([]);

  // Search & Filter in Stock Matrix
  const [matrixSearch, setMatrixSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');

  // Calculate metrics per branch
  const getBranchMetrics = (branchId: string) => {
    // Total physical stock quantity in this branch
    let totalUnits = 0;
    let totalStockValue = 0;

    store.products.forEach((p) => {
      const branchStock = p.stockByWarehouse?.[branchId] ?? 0;
      if (branchStock > 0) {
        totalUnits += branchStock;
        totalStockValue += branchStock * (p.costPrice || 0);
      }
    });

    // Today's sales in this branch
    const todayStr = new Date().toISOString().split('T')[0];
    const branchSalesToday = store.sales
      .filter((s) => s.warehouseId === branchId && s.date.startsWith(todayStr) && s.status === 'completed')
      .reduce((acc, s) => acc + s.total, 0);

    // Associated cash registers
    const registers = store.cashRegisters.filter((r) => r.branchId === branchId);
    const hasOpenRegister = registers.some((r) => r.isOpen);

    // Associated money box balance
    const moneyBox = store.moneyBoxes.find((mb) => mb.branchId === branchId);
    const moneyBoxBalance = moneyBox ? moneyBox.currentBalance : 0;

    // Associated users
    const usersCount = store.users.filter((u) => u.branchId === branchId).length;

    return {
      totalUnits,
      totalStockValue,
      branchSalesToday,
      registers,
      hasOpenRegister,
      moneyBox,
      moneyBoxBalance,
      usersCount,
    };
  };

  const handleOpenNewBranchModal = () => {
    setEditingBranch(null);
    const nextPosNumber = Math.max(...store.warehouses.map((w) => w.fiscalPointOfSale || 1), 1) + 1;
    setBranchFormData({
      id: `wh-${Date.now()}`,
      name: '',
      code: `SUC-0${store.warehouses.length + 1}`,
      address: '',
      city: 'Córdoba',
      phone: '',
      whatsapp: '',
      email: '',
      managerName: '',
      fiscalPointOfSale: nextPosNumber,
      type: 'branch_store',
      isMain: false,
      active: true,
    });
    setIsBranchModalOpen(true);
  };

  const handleEditBranch = (wh: Warehouse) => {
    setEditingBranch(wh);
    setBranchFormData({ ...wh });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchFormData.name?.trim() || !branchFormData.code?.trim()) {
      showToast('Por favor ingrese nombre y código de sucursal', 'error');
      return;
    }

    const branchToSave: Warehouse = {
      id: editingBranch ? editingBranch.id : (branchFormData.id || `wh-${Date.now()}`),
      name: branchFormData.name.trim(),
      code: branchFormData.code.trim().toUpperCase(),
      address: branchFormData.address?.trim() || 'Sin dirección especificada',
      city: branchFormData.city?.trim() || '',
      phone: branchFormData.phone?.trim() || '',
      whatsapp: branchFormData.whatsapp?.trim() || '',
      email: branchFormData.email?.trim() || '',
      managerName: branchFormData.managerName?.trim() || '',
      fiscalPointOfSale: Number(branchFormData.fiscalPointOfSale) || 1,
      type: branchFormData.type || 'branch_store',
      isMain: Boolean(branchFormData.isMain),
      active: branchFormData.active !== undefined ? branchFormData.active : true,
    };

    store.saveWarehouse(branchToSave);
    showToast(
      editingBranch
        ? `Sucursal ${branchToSave.name} actualizada correctamente`
        : `Nueva sucursal ${branchToSave.name} agregada con caja y tesorería independiente`,
      'success'
    );
    setIsBranchModalOpen(false);
  };

  const handleDeleteBranch = (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar o desactivar la sucursal "${name}"?`)) {
      const ok = store.deleteWarehouse(id);
      if (ok) {
        showToast(`Sucursal "${name}" eliminada del sistema`, 'info');
      } else {
        showToast('No se puede eliminar la Casa Central predeterminada', 'error');
      }
    }
  };

  // Stock Transfer Actions
  const handleAddProductToTransfer = (prodId: string) => {
    const product = store.products.find((p) => p.id === prodId);
    if (!product) return;

    const availableStock = product.stockByWarehouse?.[transferFrom] ?? 0;
    if (availableStock <= 0) {
      showToast(`El producto "${product.name}" no tiene stock disponible en la sucursal de origen`, 'error');
      return;
    }

    const existingIndex = transferItems.findIndex((item) => item.productId === prodId);
    if (existingIndex >= 0) {
      if (transferItems[existingIndex].quantity + 1 > availableStock) {
        showToast(`Stock máximo alcanzado (${availableStock} disponibles)`, 'error');
        return;
      }
      const nextItems = [...transferItems];
      nextItems[existingIndex].quantity += 1;
      setTransferItems(nextItems);
    } else {
      setTransferItems([
        ...transferItems,
        {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          quantity: 1,
          unit: product.unit || 'u',
        },
      ]);
    }
  };

  const handleUpdateTransferQuantity = (prodId: string, quantity: number) => {
    const product = store.products.find((p) => p.id === prodId);
    const availableStock = product?.stockByWarehouse?.[transferFrom] ?? 0;

    if (quantity > availableStock) {
      showToast(`No puede transferir más de ${availableStock} unidades disponibles en origen`, 'error');
      quantity = availableStock;
    }

    if (quantity <= 0) {
      setTransferItems(transferItems.filter((i) => i.productId !== prodId));
    } else {
      setTransferItems(
        transferItems.map((item) => (item.productId === prodId ? { ...item, quantity } : item))
      );
    }
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferFrom === transferTo) {
      showToast('La sucursal de origen y destino no pueden ser iguales', 'error');
      return;
    }
    if (transferItems.length === 0) {
      showToast('Seleccione al menos un producto para transferir', 'error');
      return;
    }

    const trf = store.transferStock({
      fromWarehouseId: transferFrom,
      toWarehouseId: transferTo,
      items: transferItems,
      notes: transferNotes,
      user: currentUser,
    });

    showToast(`Transferencia ${trf.code} completada. Stock actualizado en ambas sucursales`, 'success');
    setIsTransferModalOpen(false);
    setTransferItems([]);
    setTransferNotes('');
  };

  const filteredMatrixProducts = store.products.filter((p) => {
    if (selectedProductCategory !== 'all' && p.category !== selectedProductCategory) return false;
    if (!matrixSearch.trim()) return true;
    const q = matrixSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white">Sucursales & Depósitos Multisede</h2>
              <span className="bg-blue-900/60 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-700/50">
                {store.warehouses.length} Sedes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Control de stock independiente, facturación por punto de venta, arqueos y cajas de dinero por sucursal
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setTransferFrom(activeWarehouseId);
              const otherWh = store.warehouses.find((w) => w.id !== activeWarehouseId) || store.warehouses[0];
              setTransferTo(otherWh.id);
              setTransferItems([]);
              setIsTransferModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transferir Stock</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewBranchModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Sucursal</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 bg-slate-900 border-b border-slate-800 flex space-x-1">
        <button
          type="button"
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'branches'
              ? 'border-blue-500 text-blue-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Sedes & Sucursales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'transfers'
              ? 'border-blue-500 text-blue-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Transferencias de Stock ({store.stockTransfers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stock_matrix')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'stock_matrix'
              ? 'border-blue-500 text-blue-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Matriz de Stock por Sede</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branch_cash')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'branch_cash'
              ? 'border-blue-500 text-blue-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Cajas & Dinero por Sucursal</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* TAB 1: BRANCHES CARDS */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            {/* Active Branch Indicator Banner */}
            <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-800/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Tu Sede Activa Actual:</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/60 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>En Operación</span>
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    {store.warehouses.find((w) => w.id === activeWarehouseId)?.name || 'Casa Central'}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Operar desde otra sede:</span>
                <select
                  value={activeWarehouseId}
                  onChange={(e) => {
                    setActiveWarehouseId(e.target.value);
                    const selectedWh = store.warehouses.find((w) => w.id === e.target.value);
                    if (selectedWh) {
                      showToast(`Sede de trabajo cambiada a: ${selectedWh.name}`, 'info');
                    }
                  }}
                  className="bg-slate-800 text-xs font-bold text-white border border-slate-700 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {store.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.isMain ? '(Casa Central)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Branch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {store.warehouses.map((wh) => {
                const metrics = getBranchMetrics(wh.id);
                const isSelected = wh.id === activeWarehouseId;

                return (
                  <div
                    key={wh.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900/95 border-blue-500 shadow-xl shadow-blue-950/40 ring-1 ring-blue-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="p-4 border-b border-slate-800/80 flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              wh.isMain
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : wh.type === 'warehouse'
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                            }`}
                          >
                            {wh.isMain ? (
                              <Building className="w-5 h-5" />
                            ) : wh.type === 'warehouse' ? (
                              <WarehouseIcon className="w-5 h-5" />
                            ) : (
                              <Store className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-white leading-snug">{wh.name}</h4>
                            </div>
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                                {wh.code}
                              </span>
                              {wh.isMain && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-950/80 text-amber-300 rounded border border-amber-700/50">
                                  Casa Central
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-800/80 text-slate-400 rounded">
                                Pto Vta #{String(wh.fiscalPointOfSale || 1).padStart(4, '0')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top Actions */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditBranch(wh)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                            title="Editar Datos"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!wh.isMain && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(wh.id, wh.name)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                              title="Eliminar Sucursal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Branch Contact Details */}
                      <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/60 space-y-1 text-xs text-slate-300">
                        <div className="flex items-center space-x-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          <span className="truncate">{wh.address || 'Sin dirección'} {wh.city ? `- ${wh.city}` : ''}</span>
                        </div>
                        {wh.phone && (
                          <div className="flex items-center space-x-2 text-slate-400">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                            <span>{wh.phone}</span>
                          </div>
                        )}
                        {wh.managerName && (
                          <div className="flex items-center space-x-2 text-slate-400">
                            <UserCheck className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                            <span>Encargado: {wh.managerName}</span>
                          </div>
                        )}
                      </div>

                      {/* Real-time Branch Metrics Grid */}
                      <div className="p-4 grid grid-cols-2 gap-2 text-left">
                        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Stock Físico</span>
                          <span className="text-sm font-black text-white">{metrics.totalUnits.toLocaleString('es-AR')} u</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            ${metrics.totalStockValue.toLocaleString('es-AR')} costo
                          </span>
                        </div>

                        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Ventas del Día</span>
                          <span className="text-sm font-black text-emerald-400">
                            ${metrics.branchSalesToday.toLocaleString('es-AR')}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Cobros de la sede</span>
                        </div>

                        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Caja Mostrador</span>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                metrics.hasOpenRegister ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            ></span>
                            <span className="text-xs font-bold text-slate-200">
                              {metrics.hasOpenRegister ? 'Abierta' : 'Cerrada'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Tesorería / Caja Fuerte</span>
                          <span className="text-xs font-black text-amber-400 block mt-0.5 truncate">
                            ${metrics.moneyBoxBalance.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {isSelected ? (
                        <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-bold px-2 py-1 bg-blue-950/50 rounded-lg border border-blue-800/40 w-full justify-center">
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          <span>Sede de Trabajo Actual</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveWarehouseId(wh.id);
                            showToast(`Has cambiado a la sede: ${wh.name}`, 'success');
                          }}
                          className="w-full py-1.5 px-3 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Operar desde esta Sede</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: STOCK TRANSFERS */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Historial de Transferencias de Mercadería</h3>
                <p className="text-xs text-slate-400">
                  Movimientos auditados de inventario entre depósitos, sucursales y casa central
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTransferFrom(activeWarehouseId);
                  const otherWh = store.warehouses.find((w) => w.id !== activeWarehouseId) || store.warehouses[0];
                  setTransferTo(otherWh.id);
                  setTransferItems([]);
                  setIsTransferModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Transferencia</span>
              </button>
            </div>

            {/* Transfers Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3">Comprobante</th>
                    <th className="p-3">Fecha & Hora</th>
                    <th className="p-3">Sede Origen</th>
                    <th className="p-3"></th>
                    <th className="p-3">Sede Destino</th>
                    <th className="p-3">Artículos Transferidos</th>
                    <th className="p-3 text-center">Unidades</th>
                    <th className="p-3">Operador</th>
                    <th className="p-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {store.stockTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No hay transferencias registradas todavía.
                      </td>
                    </tr>
                  ) : (
                    store.stockTransfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-indigo-400">{trf.code}</td>
                        <td className="p-3 text-slate-300">
                          {new Date(trf.date).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 font-bold text-slate-200">{trf.fromWarehouseName}</td>
                        <td className="p-3 text-slate-500">
                          <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                        </td>
                        <td className="p-3 font-bold text-emerald-400">{trf.toWarehouseName}</td>
                        <td className="p-3 text-slate-300 max-w-[240px]">
                          <div className="truncate">
                            {trf.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-white bg-slate-800/30">
                          {trf.totalQuantity}
                        </td>
                        <td className="p-3 text-slate-400">{trf.userName}</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px] font-bold border border-emerald-800/50">
                            Completada
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STOCK MATRIX */}
        {activeTab === 'stock_matrix' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex-1 min-w-[260px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código en toda la red de sucursales..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full bg-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedProductCategory}
                  onChange={(e) => setSelectedProductCategory(e.target.value)}
                  className="bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">Todas las Categorías</option>
                  {store.categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Precio Venta</th>
                    {store.warehouses.map((wh) => (
                      <th
                        key={wh.id}
                        className={`p-3 text-center ${
                          wh.id === activeWarehouseId ? 'bg-blue-950/60 text-blue-300 font-bold' : ''
                        }`}
                      >
                        {wh.name}
                      </th>
                    ))}
                    <th className="p-3 text-center bg-slate-800 text-white font-bold">Total Red</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredMatrixProducts.slice(0, 100).map((prod) => {
                    const totalUnits = Object.values(prod.stockByWarehouse || {}).reduce<number>(
                      (acc, s) => acc + (Number(s) || 0),
                      0
                    );

                    return (
                      <tr key={prod.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-400">{prod.code}</td>
                        <td className="p-3 font-semibold text-white max-w-[280px] truncate">{prod.name}</td>
                        <td className="p-3 text-slate-400">{prod.category}</td>
                        <td className="p-3 text-right font-bold text-amber-400">
                          ${prod.salePrice?.toLocaleString('es-AR')}
                        </td>
                        {store.warehouses.map((wh) => {
                          const qty = prod.stockByWarehouse?.[wh.id] ?? 0;
                          return (
                            <td
                              key={wh.id}
                              className={`p-3 text-center font-bold ${
                                qty <= 0 ? 'text-rose-400' : 'text-slate-200'
                              } ${wh.id === activeWarehouseId ? 'bg-blue-950/20' : ''}`}
                            >
                              {qty}
                            </td>
                          );
                        })}
                        <td className="p-3 text-center font-black text-emerald-400 bg-slate-800/40">
                          {totalUnits}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BRANCH CASH & MONEY BOXES */}
        {activeTab === 'branch_cash' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-white">Desglose de Cajas de Dinero y Registradoras por Sucursal</h3>
              <p className="text-xs text-slate-400">
                Al realizar el cierre de caja de una sucursal, el dinero se transfiere a la tesorería independiente de esa sucursal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {store.warehouses.map((wh) => {
                const registers = store.cashRegisters.filter((r) => r.branchId === wh.id);
                const moneyBoxes = store.moneyBoxes.filter((mb) => mb.branchId === wh.id);

                return (
                  <div key={wh.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Store className="w-4 h-4 text-blue-400" />
                        <h4 className="font-bold text-white text-sm">{wh.name}</h4>
                      </div>
                      <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {wh.code}
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Cash Registers in this branch */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Cajas Registradoras Mostrador
                        </span>
                        <div className="space-y-2">
                          {registers.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No hay cajas registradoras asignadas</p>
                          ) : (
                            registers.map((reg) => (
                              <div
                                key={reg.id}
                                className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between"
                              >
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-white">{reg.name}</span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                        reg.isOpen
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {reg.isOpen ? 'Abierta' : 'Cerrada'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{reg.code}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-black text-emerald-400">
                                    ${(reg.currentBalance || 0).toLocaleString('es-AR')}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Money Boxes / Safes in this branch */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Caja Fuerte / Tesorería de la Sucursal
                        </span>
                        <div className="space-y-2">
                          {moneyBoxes.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No hay caja de dinero asignada</p>
                          ) : (
                            moneyBoxes.map((mb) => (
                              <div
                                key={mb.id}
                                className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                                    <Landmark className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-white block">{mb.name}</span>
                                    <span className="text-[10px] text-slate-400">
                                      {mb.type === 'physical_box' ? 'Caja Fuerte Física' : 'Cuenta'} ({mb.currency})
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-black text-amber-400">
                                    ${mb.currentBalance.toLocaleString('es-AR')}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: NUEVA / EDITAR SUCURSAL */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-white text-base">
                  {editingBranch ? 'Editar Datos de Sucursal' : 'Nueva Sucursal / Depósito'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nombre de la Sede *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Sucursal Centro / Depósito Sur"
                    value={branchFormData.name}
                    onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Código / Sigla *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: SUC-02 / DEP-SUR"
                    value={branchFormData.code}
                    onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Tipo de Sede</label>
                  <select
                    value={branchFormData.type}
                    onChange={(e) => setBranchFormData({ ...branchFormData, type: e.target.value as any })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="branch_store">Sucursal Comercial (Venta al Público & POS)</option>
                    <option value="warehouse">Depósito / Almacén de Mercadería</option>
                    <option value="headquarters">Casa Central / Administración</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Punto de Venta ARCA / AFIP</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="ej: 6"
                    value={branchFormData.fiscalPointOfSale}
                    onChange={(e) => setBranchFormData({ ...branchFormData, fiscalPointOfSale: Number(e.target.value) })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Dirección Completa</label>
                  <input
                    type="text"
                    placeholder="Calle, Número, Barrio..."
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Ciudad / Localidad</label>
                  <input
                    type="text"
                    placeholder="ej: Alejandro Roca, Córdoba"
                    value={branchFormData.city}
                    onChange={(e) => setBranchFormData({ ...branchFormData, city: e.target.value })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Encargado / Responsable</label>
                  <input
                    type="text"
                    placeholder="Nombre del responsable"
                    value={branchFormData.managerName}
                    onChange={(e) => setBranchFormData({ ...branchFormData, managerName: e.target.value })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Teléfono / Fijo</label>
                  <input
                    type="text"
                    placeholder="ej: +54 358 435-4998"
                    value={branchFormData.phone}
                    onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Email de la Sucursal</label>
                  <input
                    type="email"
                    placeholder="sucursal@ferreteria.com"
                    value={branchFormData.email}
                    onChange={(e) => setBranchFormData({ ...branchFormData, email: e.target.value })}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branchFormData.isMain}
                    onChange={(e) => setBranchFormData({ ...branchFormData, isMain: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600"
                  />
                  <span className="text-xs font-bold text-white">Establecer como Casa Central (Sede Principal)</span>
                </label>
                <p className="text-[11px] text-slate-400 pl-5">
                  Al marcar como Casa Central, se convertirá en la sede por defecto de la empresa.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg"
                >
                  {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal & Asignar Cajas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA TRANSFERENCIA DE STOCK */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-white text-base">Nueva Transferencia de Stock entre Sedes</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4">
              {/* Origin & Destination Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Sede de Origen (Emisora) *</label>
                  <select
                    value={transferFrom}
                    onChange={(e) => {
                      setTransferFrom(e.target.value);
                      setTransferItems([]); // Clear items as stock origin changes
                    }}
                    className="w-full bg-slate-800 text-xs font-bold text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  >
                    {store.warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Sede de Destino (Receptora) *</label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full bg-slate-800 text-xs font-bold text-emerald-400 rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  >
                    {store.warehouses.map((w) => (
                      <option key={w.id} value={w.id} disabled={w.id === transferFrom}>
                        {w.name} {w.id === transferFrom ? '(Origen)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Search & Picker */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Buscar Producto en Sede de Origen</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Escriba nombre o código de barras para agregar a la transferencia..."
                    value={transferSearchProduct}
                    onChange={(e) => setTransferSearchProduct(e.target.value)}
                    className="w-full bg-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Dropdown search suggestions */}
                {transferSearchProduct.trim().length > 1 && (
                  <div className="mt-1 max-h-48 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-xl divide-y divide-slate-700/60 z-20">
                    {store.products
                      .filter((p) => {
                        const q = transferSearchProduct.toLowerCase();
                        return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
                      })
                      .slice(0, 8)
                      .map((prod) => {
                        const stockInOrigin = prod.stockByWarehouse?.[transferFrom] ?? 0;
                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              handleAddProductToTransfer(prod.id);
                              setTransferSearchProduct('');
                            }}
                            className="p-2.5 hover:bg-slate-700 flex items-center justify-between cursor-pointer text-xs"
                          >
                            <div>
                              <span className="font-bold text-white block">{prod.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{prod.code}</span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`font-black text-xs ${
                                  stockInOrigin > 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {stockInOrigin} disp. en origen
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Items in Transfer */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Artículos a Transferir ({transferItems.length})
                </label>
                <div className="bg-slate-950/60 rounded-xl border border-slate-800 max-h-56 overflow-y-auto divide-y divide-slate-800">
                  {transferItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No hay productos agregados. Utilice el buscador superior para seleccionar artículos.
                    </div>
                  ) : (
                    transferItems.map((item) => {
                      const prod = store.products.find((p) => p.id === item.productId);
                      const maxStock = prod?.stockByWarehouse?.[transferFrom] ?? 0;

                      return (
                        <div key={item.productId} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-white text-xs block truncate">{item.productName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.productCode} • Stock en origen: {maxStock} u
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="1"
                              max={maxStock}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateTransferQuantity(item.productId, Number(e.target.value))
                              }
                              className="w-16 bg-slate-800 text-center font-bold text-xs text-white rounded-lg py-1 border border-slate-700 focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">{item.unit || 'u'}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateTransferQuantity(item.productId, 0)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Motivo / Observaciones del Traslado</label>
                <input
                  type="text"
                  placeholder="ej: Reabastecimiento de mostrador, reposición por venta especial..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-800 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={transferItems.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg flex items-center space-x-1.5"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Confirmar y Descontar Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
