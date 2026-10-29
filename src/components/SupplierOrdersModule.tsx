import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Send, 
  FileText, 
  Download, 
  Trash2, 
  X, 
  AlertTriangle, 
  Package, 
  Building2, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  ArrowRight,
  Filter,
  PackageCheck
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem, Product, Supplier, CompanyConfig } from '../types';
import { generatePurchaseOrderPDF, buildPurchaseOrderWhatsAppMessage } from '../utils/purchaseOrderPdfUtils';
import * as XLSX from 'xlsx';

interface SupplierOrdersModuleProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  suppliers: Supplier[];
  config: CompanyConfig | null;
  onSavePurchaseOrder: (order: PurchaseOrder) => Promise<void>;
  onReceivePurchaseOrder: (order: PurchaseOrder) => Promise<void>;
  onDeletePurchaseOrder?: (orderId: string) => Promise<void>;
  // Active draft shared with Inventory
  activeDraft: PurchaseOrderItem[];
  activeDraftSupplierId: string | null;
  onUpdateDraft: (items: PurchaseOrderItem[], supplierId: string | null) => void;
  onClearDraft: () => void;
  onNavigateToInventory?: () => void;
}

export const SupplierOrdersModule: React.FC<SupplierOrdersModuleProps> = ({
  purchaseOrders,
  products,
  suppliers,
  config,
  onSavePurchaseOrder,
  onReceivePurchaseOrder,
  onDeletePurchaseOrder,
  activeDraft,
  activeDraftSupplierId,
  onUpdateDraft,
  onClearDraft,
  onNavigateToInventory
}) => {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'builder'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Builder State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    activeDraftSupplierId || suppliers[0]?.id || ''
  );
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    config?.plantAddress || config?.fiscalAddress || 'Planta Industrial Pilar'
  );
  const [orderNotes, setOrderNotes] = useState<string>('Rogamos confirmar recepción y fecha estimada de despacho.');
  
  // Product search inside builder
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<Product | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(10);
  const [addUnitCost, setAddUnitCost] = useState<number>(0);

  // WhatsApp Dispatch Modal State
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<PurchaseOrder | null>(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Receive Order Modal State
  const [receiveModalOrder, setReceiveModalOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [isSubmittingReceive, setIsSubmittingReceive] = useState(false);

  // Sync builder supplier with activeDraftSupplierId when it changes
  React.useEffect(() => {
    if (activeDraftSupplierId) {
      setSelectedSupplierId(activeDraftSupplierId);
    }
  }, [activeDraftSupplierId]);

  // Selected supplier object
  const currentSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(order => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      // Supplier filter
      if (supplierFilter !== 'all' && order.supplierId !== supplierFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesOrder = order.orderNumber?.toLowerCase().includes(q);
        const matchesSup = order.supplierName?.toLowerCase().includes(q);
        const matchesItem = order.items?.some(it => 
          it.productName?.toLowerCase().includes(q) || 
          it.productCode?.toLowerCase().includes(q) ||
          it.supplierCode?.toLowerCase().includes(q)
        );
        if (!matchesOrder && !matchesSup && !matchesItem) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [purchaseOrders, statusFilter, supplierFilter, searchQuery]);

  // KPIs
  const totalOrdersCount = purchaseOrders.length;
  const draftOrdersCount = purchaseOrders.filter(o => o.status === 'borrador').length;
  const sentOrdersCount = purchaseOrders.filter(o => o.status === 'enviado' || o.status === 'solicitado').length;
  const receivedOrdersCount = purchaseOrders.filter(o => o.status === 'recibido').length;
  const pendingTotalAmount = purchaseOrders
    .filter(o => o.status === 'enviado' || o.status === 'solicitado' || o.status === 'borrador')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Filtered products for quick add in builder
  const filteredProductsForAdd = useMemo(() => {
    if (!productSearch.trim()) {
      // Suggest products that belong to this supplier or have low stock
      if (currentSupplier) {
        const supMatches = products.filter(p => 
          p.supplierId === currentSupplier.id || 
          (p.supplierName && p.supplierName.toLowerCase() === currentSupplier.businessName.toLowerCase())
        );
        if (supMatches.length > 0) return supMatches.slice(0, 10);
      }
      return products.slice(0, 8);
    }
    const q = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.supplierCode && p.supplierCode.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [products, productSearch, currentSupplier]);

  // Select a product to add
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductToAdd(prod);
    setProductSearch(`${prod.code} - ${prod.name}`);
    const cost = prod.costListWithoutIva || prod.unitCost || 0;
    setAddUnitCost(cost);
    // Smart quantity default based on minStock
    const needed = (prod.minStock || 0) > prod.stock ? (prod.minStock || 0) - prod.stock : 10;
    setAddQuantity(Math.max(1, needed));
  };

  // Add item to draft
  const handleAddItemToDraft = () => {
    if (!selectedProductToAdd) return;

    const existingIndex = activeDraft.findIndex(it => it.productId === selectedProductToAdd.id);
    let updated: PurchaseOrderItem[];

    const unitCost = Number(addUnitCost) || 0;
    const qty = Number(addQuantity) || 1;
    const subtotal = qty * unitCost;

    if (existingIndex >= 0) {
      updated = [...activeDraft];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + qty,
        unitCost: unitCost,
        subtotal: (updated[existingIndex].quantity + qty) * unitCost
      };
    } else {
      const newItem: PurchaseOrderItem = {
        productId: selectedProductToAdd.id,
        productCode: selectedProductToAdd.code,
        supplierCode: selectedProductToAdd.supplierCode || '',
        productName: selectedProductToAdd.name,
        presentation: selectedProductToAdd.presentation,
        unit: selectedProductToAdd.primaryUnit || 'Unidad',
        quantity: qty,
        unitCost: unitCost,
        subtotal: subtotal
      };
      updated = [...activeDraft, newItem];
    }

    onUpdateDraft(updated, selectedSupplierId);
    // Reset product picker
    setSelectedProductToAdd(null);
    setProductSearch('');
    setAddQuantity(10);
    setAddUnitCost(0);
  };

  // Remove item from draft
  const handleRemoveDraftItem = (index: number) => {
    const updated = activeDraft.filter((_, idx) => idx !== index);
    onUpdateDraft(updated, updated.length > 0 ? selectedSupplierId : null);
  };

  // Update item quantity in draft
  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveDraftItem(index);
      return;
    }
    const updated = [...activeDraft];
    updated[index] = {
      ...updated[index],
      quantity: newQty,
      subtotal: newQty * updated[index].unitCost
    };
    onUpdateDraft(updated, selectedSupplierId);
  };

  // Update item unit cost in draft
  const handleUpdateItemCost = (index: number, newCost: number) => {
    const updated = [...activeDraft];
    updated[index] = {
      ...updated[index],
      unitCost: newCost,
      subtotal: updated[index].quantity * newCost
    };
    onUpdateDraft(updated, selectedSupplierId);
  };

  // Calculations for current draft
  const draftSubtotal = useMemo(() => {
    return activeDraft.reduce((sum, it) => sum + (it.subtotal || 0), 0);
  }, [activeDraft]);

  const discountPercentage = currentSupplier?.discountPercentage || 0;
  const draftDiscountAmount = (draftSubtotal * discountPercentage) / 100;
  const draftTotal = draftSubtotal - draftDiscountAmount;

  // Generate Next Order Number
  const generateNextOrderNumber = () => {
    const currentYear = new Date().getFullYear();
    const count = purchaseOrders.length + 1;
    return `OC-${currentYear}-${String(count).padStart(4, '0')}`;
  };

  // Close & Save Order ("Cerrar Pedido")
  const handleCloseAndSaveOrder = async (targetStatus: 'enviado' | 'solicitado' | 'borrador' = 'enviado') => {
    if (!selectedSupplierId || !currentSupplier) {
      alert('Por favor selecciona un proveedor para el pedido.');
      return;
    }
    if (activeDraft.length === 0) {
      alert('El pedido debe tener al menos un producto.');
      return;
    }

    const orderNumber = generateNextOrderNumber();
    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber: orderNumber,
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.businessName,
      supplierTaxId: currentSupplier.taxId,
      supplierPhone: currentSupplier.phone,
      supplierEmail: currentSupplier.email,
      date: new Date().toISOString(),
      deliveryDate: deliveryDate || undefined,
      deliveryAddress: deliveryAddress,
      notes: orderNotes,
      items: activeDraft,
      status: targetStatus,
      subtotalBeforeDiscount: draftSubtotal,
      discountPercentage: discountPercentage,
      discountAmount: draftDiscountAmount,
      total: draftTotal,
      createdAt: new Date().toISOString()
    };

    try {
      await onSavePurchaseOrder(newOrder);
      // Clear active draft
      onClearDraft();
      // Switch back to orders list
      setActiveTab('orders');
      // Automatically open WhatsApp Dispatch modal!
      handleOpenWhatsAppModal(newOrder);
    } catch (err) {
      console.error('Error saving purchase order:', err);
      alert('Ocurrió un error al guardar el pedido.');
    }
  };

  // Open WhatsApp Modal
  const handleOpenWhatsAppModal = (order: PurchaseOrder) => {
    setWhatsAppModalOrder(order);
    const sup = suppliers.find(s => s.id === order.supplierId);
    const phone = order.supplierPhone || sup?.phone || '';
    setWhatsAppPhone(phone);
    setIsCopied(false);
  };

  // Format clean WhatsApp Link
  const getWhatsAppLink = (order: PurchaseOrder, rawPhone: string) => {
    let clean = rawPhone.replace(/\D/g, '');
    // If Argentine number without country code, add 549
    if (clean.startsWith('11') || clean.startsWith('15') || (clean.length === 10 && !clean.startsWith('54'))) {
      clean = `549${clean}`;
    } else if (clean.startsWith('54') && !clean.startsWith('549') && clean.length === 12) {
      clean = `549${clean.substring(2)}`;
    }
    const message = buildPurchaseOrderWhatsAppMessage(
      order, 
      config?.tradeName || config?.companyName || 'Colorear Pinturas'
    );
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  };

  // Copy WhatsApp message to clipboard
  const handleCopyWhatsAppMessage = (order: PurchaseOrder) => {
    const text = buildPurchaseOrderWhatsAppMessage(
      order, 
      config?.tradeName || config?.companyName || 'Colorear Pinturas'
    );
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Open Receive Order Modal
  const handleOpenReceiveModal = (order: PurchaseOrder) => {
    setReceiveModalOrder(order);
    const initial: Record<string, number> = {};
    order.items.forEach(it => {
      initial[it.productId || it.productCode || it.productName || ''] = it.quantity;
    });
    setReceiveQuantities(initial);
  };

  // Confirm Ingest to Stock
  const handleConfirmReceiveOrder = async () => {
    if (!receiveModalOrder) return;
    setIsSubmittingReceive(true);
    try {
      await onReceivePurchaseOrder(receiveModalOrder);
      setReceiveModalOrder(null);
    } catch (err) {
      console.error('Error receiving order:', err);
      alert('Error al ingresar mercadería al stock.');
    } finally {
      setIsSubmittingReceive(false);
    }
  };

  // Export orders list to Excel
  const handleExportOrdersToExcel = () => {
    const data = filteredOrders.map(o => ({
      'N° Orden': o.orderNumber,
      'Fecha': new Date(o.date).toLocaleDateString('es-AR'),
      'Proveedor': o.supplierName,
      'CUIT': o.supplierTaxId || '',
      'Teléfono': o.supplierPhone || '',
      'Cant. Ítems': o.items?.length || 0,
      'Total (ARS)': o.total,
      'Estado': o.status.toUpperCase(),
      'Lugar de Entrega': o.deliveryAddress || '',
      'Notas': o.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos Proveedores');
    XLSX.writeFile(wb, `Pedidos_Proveedores_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Pedidos de Mercadería a Proveedores
              </h1>
              <p className="text-xs text-slate-500">
                Arma órdenes de reposición por proveedor, cierra el pedido y envíalo directamente por WhatsApp o PDF
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'orders' ? (
            <>
              <button
                type="button"
                onClick={handleExportOrdersToExcel}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                title="Exportar órdenes a Excel"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Excel
              </button>
              
              {activeDraft.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-300 shadow-xs animate-pulse"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Borrador en Curso ({activeDraft.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedSupplierId(suppliers[0]?.id || '');
                  setActiveTab('builder');
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo Pedido a Proveedor
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 transition-colors shadow-xs"
            >
              ← Ver Historial de Pedidos
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Pedidos</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{totalOrdersCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Histórico registrado</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">En Borrador</span>
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-800 mt-1">
            {draftOrdersCount + (activeDraft.length > 0 ? 1 : 0)}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">
            {activeDraft.length > 0 ? `${activeDraft.length} ítems en carrito actual` : 'Sin armar'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Enviados / WhatsApp</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-800 mt-1">{sentOrdersCount}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Esperando entrega</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Recibidos</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1">{receivedOrdersCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Ingresados a stock</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Monto Pendiente</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">
            ${pendingTotalAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">En órdenes abiertas</div>
        </div>
      </div>

      {/* TAB 1: ORDERS LIST VIEW */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Active Draft Banner Reminder if exists */}
          {activeDraft.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-950">
                    Tienes un pedido de mercadería en armado con {activeDraft.length} {activeDraft.length === 1 ? 'producto' : 'productos'}
                  </h4>
                  <p className="text-xs text-amber-800">
                    Proveedor asignado: <span className="font-bold">{currentSupplier?.businessName || 'Sin asignar'}</span> • Subtotal: ${draftSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onClearDraft()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  Continuar y Cerrar Pedido →
                </button>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por N° orden, proveedor, SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Estado:</span>
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="all">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="enviado">Enviado (WhatsApp)</option>
                <option value="solicitado">Solicitado</option>
                <option value="recibido">Recibido (En Stock)</option>
                <option value="cancelado">Cancelado</option>
              </select>

              {/* Supplier Filter */}
              <select
                value={supplierFilter}
                onChange={e => setSupplierFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium max-w-[180px] truncate"
              >
                <option value="all">Todos los proveedores</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.businessName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">N° Orden</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Ítems</th>
                    <th className="py-3 px-4 text-right">Total Est.</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <Package className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                          <p className="font-semibold text-slate-600">No se encontraron pedidos de mercadería</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            Puedes armar un pedido desde el botón de arriba o utilizando el ícono de carrito 🛒 en el módulo de Inventario.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('builder')}
                            className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                          >
                            + Armar Nuevo Pedido
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const sup = suppliers.find(s => s.id === order.supplierId);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Order Number */}
                          <td className="py-3 px-4 font-mono font-bold text-blue-900">
                            {order.orderNumber}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-slate-600">
                            {order.date ? new Date(order.date).toLocaleDateString('es-AR') : '-'}
                          </td>

                          {/* Supplier */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{order.supplierName}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {order.supplierPhone ? (
                                <span className="flex items-center gap-0.5 text-emerald-700">
                                  <Phone className="w-2.5 h-2.5" />
                                  {order.supplierPhone}
                                </span>
                              ) : (
                                <span>Sin teléfono</span>
                              )}
                              {order.supplierTaxId && <span>• CUIT: {order.supplierTaxId}</span>}
                            </div>
                          </td>

                          {/* Items count & preview */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-700">
                              {order.items?.length || 0} {order.items?.length === 1 ? 'producto' : 'productos'}
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {order.items?.map(i => `${i.quantity}x ${i.productName || i.rawMaterialName}`).join(', ')}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                            ${Number(order.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            {order.status === 'recibido' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Recibido
                              </span>
                            ) : order.status === 'enviado' || order.status === 'solicitado' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <Send className="w-3 h-3 text-blue-600" />
                                Enviado WhatsApp
                              </span>
                            ) : order.status === 'borrador' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Borrador
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                                {order.status}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* WhatsApp Dispatch Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppModal(order)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200"
                                title="Enviar o reenviar por WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>

                              {/* Download PDF Button */}
                              <button
                                type="button"
                                onClick={() => generatePurchaseOrderPDF(order, config, sup)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                                title="Descargar Orden en PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Receive Order Button (Stock Ingestion) */}
                              {order.status !== 'recibido' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiveModal(order)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200 flex items-center gap-1"
                                  title="Ingresar productos recibidos al stock"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  Recibir
                                </button>
                              )}

                              {/* Delete Order if borrador */}
                              {order.status === 'borrador' && onDeletePurchaseOrder && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar el borrador ${order.orderNumber}?`)) {
                                      onDeletePurchaseOrder(order.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar borrador"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
        </div>
      )}

      {/* TAB 2: ORDER BUILDER ("Armando pedido de mercadería") */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Supplier Selector & Items Table (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Supplier Selector Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="text-sm font-black text-slate-800">
                    Proveedor Destinatario del Pedido
                  </h3>
                </div>
                {onNavigateToInventory && (
                  <button
                    type="button"
                    onClick={onNavigateToInventory}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Buscar en Inventario →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Seleccionar Proveedor *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => {
                      setSelectedSupplierId(e.target.value);
                      onUpdateDraft(activeDraft, e.target.value);
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Elige un proveedor --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} {s.phone ? `(${s.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {currentSupplier && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{currentSupplier.businessName}</span>
                      {currentSupplier.discountPercentage ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          {currentSupplier.discountPercentage}% desc. acordado
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp / Tel: <strong className="text-slate-800">{currentSupplier.phone || 'Sin teléfono'}</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      CUIT: {currentSupplier.taxId || 'Sin CUIT'} • {currentSupplier.paymentTerms || 'Condición habitual'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Product Search & Fast Adder Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-sm font-black text-slate-800">
                  Agregar Productos a la Orden
                </h3>
              </div>

              {/* Product Search & Dropdown Picker */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Buscar Producto por Nombre, SKU o Código Proveedor:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ej: GUANTE, LÁTEX, 276091, 3621030000..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                {/* Autocomplete / Suggested list */}
                {filteredProductsForAdd.length > 0 && !selectedProductToAdd && (
                  <div className="mt-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 shadow-sm">
                    {filteredProductsForAdd.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.presentation && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                                {p.presentation}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>SKU: {p.code}</span>
                            {p.supplierCode && <span>• Cód. Prov: <strong className="text-slate-600">{p.supplierCode}</strong></span>}
                            <span>• Stock Actual: <strong className={p.stock <= (p.minStock || 0) ? 'text-red-600' : 'text-slate-700'}>{p.stock}</strong></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-800">
                            ${Number(p.costListWithoutIva || p.unitCost || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold hover:underline">
                            + Seleccionar
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity, Cost & Add Button for the selected product */}
              {selectedProductToAdd && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">Producto Seleccionado:</span>
                      <h4 className="font-bold text-slate-900 text-xs">
                        {selectedProductToAdd.name} ({selectedProductToAdd.code})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProductToAdd(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕ Cambiar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Cantidad a Pedir:
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setAddQuantity(prev => Math.max(1, prev - 1))}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-l-lg font-bold text-slate-700 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={addQuantity}
                          onChange={e => setAddQuantity(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full text-center text-xs py-1.5 border-y border-slate-300 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setAddQuantity(prev => prev + 1)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-r-lg font-bold text-slate-700 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Costo Unit. Ref. (ARS):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={addUnitCost}
                        onChange={e => setAddUnitCost(Number(e.target.value) || 0)}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItemToDraft}
                        className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Añadir al Pedido
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Items in Active Draft Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="text-sm font-black text-slate-800">
                    Productos del Pedido ({activeDraft.length})
                  </h3>
                </div>
                {activeDraft.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearDraft}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    Vaciar lista
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">SKU / Cód. Prov</th>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">Cantidad</th>
                      <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeDraft.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-1.5 stroke-1" />
                          <p className="font-semibold text-slate-600">El pedido está vacío</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Busca productos arriba o presiona el botón 🛒 en el Inventario para añadirlos.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      activeDraft.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                            <div>{item.productCode || '-'}</div>
                            {item.supplierCode && (
                              <div className="text-[10px] text-slate-400">Prov: {item.supplierCode}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{item.productName}</div>
                            {item.presentation && (
                              <span className="text-[10px] text-slate-500">{item.presentation}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                                className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                              >
                                -
                              </button>
                              <span className="px-2 py-0.5 font-bold font-mono text-slate-800 min-w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                                className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            <input
                              type="number"
                              value={item.unitCost}
                              onChange={e => handleUpdateItemCost(idx, Number(e.target.value) || 0)}
                              className="w-20 text-right p-1 text-xs border border-slate-200 rounded font-mono"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ${Number(item.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Quitar del pedido"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Cierre (1 col) */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 sticky top-16">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h3 className="text-sm font-black text-slate-800">
                  Resumen & Cierre del Pedido
                </h3>
              </div>

              {/* Order Delivery & Notes */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Lugar de Entrega
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium"
                    placeholder="Dirección o planta de entrega"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Fecha Solicitada de Despacho (Opcional)
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Observaciones para el Proveedor
                  </label>
                  <textarea
                    rows={3}
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium"
                    placeholder="Instrucciones de entrega, embalaje, remito, etc."
                  />
                </div>
              </div>

              {/* Totals Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Cant. Ítems:</span>
                  <span className="font-bold">{activeDraft.length}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total Unidades:</span>
                  <span className="font-bold font-mono">
                    {activeDraft.reduce((sum, it) => sum + (it.quantity || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal Estimado:</span>
                  <span className="font-mono">${draftSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-medium">
                    <span>Descuento Acordado ({discountPercentage}%):</span>
                    <span className="font-mono">-${draftDiscountAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-slate-900 font-black text-sm">
                  <span>TOTAL ESTIMADO:</span>
                  <span className="text-base text-blue-900 font-mono">
                    ${draftTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Close & WhatsApp */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={activeDraft.length === 0 || !selectedSupplierId}
                  onClick={() => handleCloseAndSaveOrder('enviado')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Cerrar y Enviar por WhatsApp
                </button>

                <button
                  type="button"
                  disabled={activeDraft.length === 0 || !selectedSupplierId}
                  onClick={() => handleCloseAndSaveOrder('borrador')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-xs transition-colors border border-slate-300"
                >
                  Guardar como Borrador
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP DISPATCH & CONFIRMATION MODAL */}
      {whatsAppModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Enviar Pedido por WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    Orden de Compra: <strong className="text-blue-900 font-mono">{whatsAppModalOrder.orderNumber}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Phone Verification Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Número de WhatsApp del Proveedor ({whatsAppModalOrder.supplierName}):
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej: +54 9 11 4890-7000 o 1155667788"
                  value={whatsAppPhone}
                  onChange={e => setWhatsAppPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Se limpiará automáticamente el formato internacional (+54 9...)
              </span>
            </div>

            {/* Live Message Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Vista Previa del Mensaje:</span>
                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppMessage(whatsAppModalOrder)}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiado al portapapeles</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar texto</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {buildPurchaseOrderWhatsAppMessage(
                  whatsAppModalOrder,
                  config?.tradeName || config?.companyName || 'Colorear Pinturas'
                )}
              </div>
            </div>

            {/* Actions: Open WA, Download PDF, Done */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <a
                href={getWhatsAppLink(whatsAppModalOrder, whatsAppPhone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // Mark as enviado
                  onSavePurchaseOrder({
                    ...whatsAppModalOrder,
                    status: 'enviado',
                    whatsappSentAt: new Date().toISOString()
                  });
                }}
                className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir WhatsApp Web / App
              </a>

              <button
                type="button"
                onClick={() => {
                  const sup = suppliers.find(s => s.id === whatsAppModalOrder.supplierId);
                  generatePurchaseOrderPDF(whatsAppModalOrder, config, sup);
                }}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors border border-slate-300 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>

              <button
                type="button"
                onClick={() => setWhatsAppModalOrder(null)}
                className="w-full sm:w-auto px-4 py-3 text-slate-500 hover:text-slate-800 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE ORDER MODAL (STOCK INGESTION) */}
      {receiveModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ingresar Mercadería a Stock
                  </h3>
                  <p className="text-xs text-slate-500">
                    Orden <strong className="font-mono text-blue-900">{receiveModalOrder.orderNumber}</strong> • {receiveModalOrder.supplierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiveModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Confirma los productos recibidos para actualizar automáticamente el stock en el inventario y registrar el movimiento de compra:
            </p>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px]">
                    <th className="p-2.5">Producto</th>
                    <th className="p-2.5 text-center">Pedido</th>
                    <th className="p-2.5 text-right">Recibido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receiveModalOrder.items.map((it, idx) => {
                    const key = it.productId || it.productCode || it.productName || String(idx);
                    return (
                      <tr key={idx}>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800">{it.productName || it.rawMaterialName}</div>
                          <div className="text-[10px] text-slate-400">SKU: {it.productCode || '-'}</div>
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono">
                          {it.quantity} {it.unit || ''}
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">
                          +{receiveQuantities[key] || it.quantity} u.
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReceiveModalOrder(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingReceive}
                onClick={handleConfirmReceiveOrder}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isSubmittingReceive ? (
                  <span>Ingresando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar e Ingresar a Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
