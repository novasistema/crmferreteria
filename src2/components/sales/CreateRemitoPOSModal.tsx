import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Remito, RemitoItem, Client, DocumentType } from '../../types';
import { ClientSelectorModal } from '../pos/ClientSelectorModal';
import { ProductSearchModal } from '../pos/ProductSearchModal';
import {
  Truck,
  Search,
  User,
  Plus,
  Minus,
  Trash2,
  Package,
  Barcode,
  Keyboard,
  Warehouse,
  ChevronDown,
  FileCheck,
  X,
  AlertTriangle,
  RotateCw,
  MapPin,
  FileText,
  DollarSign,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface CreateRemitoPOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (remito: Remito) => void;
}

export const CreateRemitoPOSModal: React.FC<CreateRemitoPOSModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { store, currentUser, activeWarehouseId, showToast } = useApp();

  // Header options state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    activeWarehouseId || store.warehouses[0]?.id || '1'
  );
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('1');
  const [selectedClientId, setSelectedClientId] = useState<string>(store.clients[0]?.id || '1');
  const [shippingCarrierId, setShippingCarrierId] = useState<string>('');
  const [driverInfo, setDriverInfo] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('Mercadería entregada en conformidad.');

  // Cart & item management
  const [items, setItems] = useState<RemitoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Submodals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync selected client
  const selectedClient = useMemo(() => {
    return (
      store.clients.find((c) => c.id === selectedClientId) ||
      store.clients[0] || {
        id: '1',
        code: 'CLI-001',
        name: 'Cliente Ocasional',
        taxCondition: 'Consumidor Final' as const,
        taxId: '00-00000000-0',
        email: '',
        phone: '',
        address: '',
        city: '',
        priceListId: '1',
        hasCurrentAccount: false,
        currentBalance: 0,
        creditLimit: 0,
        loyaltyEligible: true,
        loyaltyPoints: 0,
        loyaltyTier: 'Bronce' as const,
        active: true,
        createdAt: new Date().toISOString(),
      }
    );
  }, [store.clients, selectedClientId]);

  // Sync client address and price list on client change
  useEffect(() => {
    if (selectedClient) {
      if (selectedClient.address) {
        setDeliveryAddress(
          `${selectedClient.address}${selectedClient.city ? ', ' + selectedClient.city : ''}`
        );
      }
      if (selectedClient.priceListId) {
        setSelectedPriceListId(selectedClient.priceListId);
      }
    }
  }, [selectedClient]);

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    if (client.address) {
      setDeliveryAddress(`${client.address}${client.city ? ', ' + client.city : ''}`);
    }
    if (client.priceListId) {
      setSelectedPriceListId(client.priceListId);
    }
    setIsClientModalOpen(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // Unit price calculation based on price list
  const getProductUnitPrice = useCallback(
    (product: Product): number => {
      if (selectedPriceListId === 'pl-mayorista' || selectedPriceListId === 'mayorista') {
        return product.priceMayorista || product.priceMinorista;
      }
      if (selectedPriceListId === 'pl-gremio' || selectedPriceListId === 'gremio') {
        return product.priceGremio || product.priceMinorista;
      }
      return product.priceMinorista;
    },
    [selectedPriceListId]
  );

  // Live autocomplete matches for search input
  const searchMatches = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) return [];

    const cleaned = raw.includes('*') ? raw.split('*')[1]?.trim() : raw;
    if (!cleaned) return [];

    return store.products
      .filter((p) => {
        if (!p.active) return false;
        return (
          p.name.toLowerCase().includes(cleaned) ||
          p.code.toLowerCase().includes(cleaned) ||
          (p.barcode && p.barcode.includes(cleaned)) ||
          (p.supplierCode && p.supplierCode.toLowerCase().includes(cleaned)) ||
          (p.brandName && p.brandName.toLowerCase().includes(cleaned))
        );
      })
      .slice(0, 8);
  }, [searchQuery, store.products]);

  // Add Product to Cart
  const handleAddToCart = (product: Product, quantityToAdd: number = 1) => {
    const currentWhStock =
      product.stockByWarehouse?.[selectedWarehouseId] ?? product.stock ?? 0;

    if (currentWhStock <= 0 && !store.settings.allowNegativeStock) {
      showToast(
        `Alerta: Sin stock de ${product.name} en el depósito seleccionado (Stock: ${currentWhStock})`,
        'warning'
      );
    }

    const price = getProductUnitPrice(product);

    setItems((prev) => {
      const idx = prev.findIndex((item) => item.productId === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + quantityToAdd;
        const sub = newQty * updated[idx].unitPrice * (1 - (updated[idx].discountPercent || 0) / 100);
        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          subtotal: sub,
        };
        return updated;
      }

      const itemSubtotal = price * quantityToAdd;
      return [
        ...prev,
        {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          quantity: quantityToAdd,
          unit: product.unit || 'unidad',
          unitPrice: price,
          discountPercent: 0,
          subtotal: itemSubtotal,
        },
      ];
    });

    showToast(`+ ${quantityToAdd} ${product.unit || 'un.'} ${product.name}`, 'success');
    setSearchQuery('');
    setShowDropdown(false);
    searchInputRef.current?.focus();
  };

  // Keyboard shortcut listener for POS Remito window
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isClientModalOpen || isProductModalOpen) return;

      if (e.key === 'F1') {
        e.preventDefault();
        setIsClientModalOpen(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsProductModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleSubmitRemito();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (items.length > 0 && confirm('¿Desea limpiar los artículos del remito?')) {
          setItems([]);
          showToast('Remito reiniciado', 'info');
        }
      } else if (e.key === 'Escape') {
        if (showDropdown) {
          setShowDropdown(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isClientModalOpen,
    isProductModalOpen,
    items,
    showDropdown,
    onClose,
  ]);

  // Focus search input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle Search Input Keydown
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchMatches.length > 0) {
        setSelectedProductIndex((prev) => Math.min(prev + 1, searchMatches.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchMatches.length > 0) {
        setSelectedProductIndex((prev) => Math.max(prev - 1, 0));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const raw = searchQuery.trim();
      if (!raw) return;

      let quantity = 1;
      let query = raw.toLowerCase();

      if (raw.includes('*')) {
        const parts = raw.split('*');
        const parsedQty = parseFloat(parts[0]);
        if (!isNaN(parsedQty) && parsedQty > 0) {
          quantity = parsedQty;
          query = parts.slice(1).join('*').trim().toLowerCase();
        }
      }

      const exactMatch = store.products.find(
        (p) =>
          p.active &&
          (p.code.toLowerCase() === query ||
            (p.barcode && p.barcode.toLowerCase() === query) ||
            (p.supplierCode && p.supplierCode.toLowerCase() === query))
      );

      if (exactMatch) {
        handleAddToCart(exactMatch, quantity);
        return;
      }

      if (searchMatches[selectedProductIndex]) {
        handleAddToCart(searchMatches[selectedProductIndex], quantity);
        return;
      }

      if (searchMatches.length === 1) {
        handleAddToCart(searchMatches[0], quantity);
        return;
      }

      if (searchMatches.length > 1) {
        setShowDropdown(true);
      } else {
        setIsProductModalOpen(true);
      }
    }
  };

  // Quantity and price updates
  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const sub = newQty * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
      updated[index] = {
        ...item,
        quantity: newQty,
        subtotal: sub,
      };
      return updated;
    });
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const sub = item.quantity * Math.max(0, newPrice) * (1 - (item.discountPercent || 0) / 100);
      updated[index] = {
        ...item,
        unitPrice: Math.max(0, newPrice),
        subtotal: sub,
      };
      return updated;
    });
  };

  const handleUpdateItemDiscount = (index: number, newDisc: number) => {
    const discClean = Math.max(0, Math.min(100, newDisc || 0));
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const sub = item.quantity * item.unitPrice * (1 - discClean / 100);
      updated[index] = {
        ...item,
        discountPercent: discClean,
        subtotal: sub,
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    showToast('Artículo eliminado del remito', 'info');
  };

  // Totals
  const totalItemsCount = items.length;
  const totalUnitsCount = items.reduce((acc, i) => acc + (i.quantity || 0), 0);
  const grandTotal = items.reduce((acc, i) => acc + (i.subtotal || 0), 0);

  // Submit and create Remito
  const handleSubmitRemito = () => {
    if (isProcessing) return;
    if (items.length === 0) {
      showToast('Agregue al menos un producto al remito antes de emitir', 'error');
      searchInputRef.current?.focus();
      return;
    }

    setIsProcessing(true);
    try {
      const finalNotes = [
        notes.trim(),
        driverInfo.trim() ? `Chofer / Patente: ${driverInfo.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const newRemito = store.createRemito({
        clientId: selectedClient.id,
        warehouseId: selectedWarehouseId,
        items,
        shippingCarrierId: shippingCarrierId || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        notes: finalNotes,
        user: currentUser,
      });

      showToast(`¡Remito ${newRemito.code} emitido con éxito! Stock descontado.`, 'success');
      onCreated(newRemito);
    } catch (err: any) {
      showToast(`Error al emitir el remito: ${err.message || 'Error inesperado'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full h-[96vh] max-w-[1400px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* 1. TOP STATUS & CONFIGURATION BAR (Similar to POS Header) */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Title Badge */}
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
              <Truck className="w-4 h-4 text-amber-400" />
              <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[11px]">
                Emisión de Remito POS
              </span>
            </div>

            {/* Fecha */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Fecha:</span>
              <span className="font-bold text-white font-mono">{todayFormatted}</span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* Depósito de Origen */}
            <div className="flex items-center space-x-1.5">
              <Warehouse className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Depósito Salida:</span>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="bg-slate-900 text-slate-100 font-bold px-2 py-1 rounded border border-slate-700 focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                {store.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* Lista de Precios */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Lista Precio Ref:</span>
              <select
                value={selectedPriceListId}
                onChange={(e) => setSelectedPriceListId(e.target.value)}
                className="bg-slate-900 text-amber-400 font-bold px-2 py-1 rounded border border-slate-700 focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                {store.priceLists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Transportista selector */}
            <div className="flex items-center space-x-1.5 hidden md:flex">
              <span className="text-slate-400">Transporte:</span>
              <select
                value={shippingCarrierId}
                onChange={(e) => setShippingCarrierId(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 focus:border-amber-400 focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="">Flete Propio / Mostrador</option>
                {store.shippingCarriers.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. CLIENT & DISPATCH INFORMATION BAR (Similar to POS Client Bar) */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center text-xs shrink-0">
          {/* Client Details & F1 Button */}
          <div className="lg:col-span-6 flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
            >
              <User className="w-4 h-4" />
              <span>[F1] CLIENTE</span>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-sm truncate">
                  {selectedClient.name}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedClient.taxCondition || 'CF'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5 truncate">
                <span>CUIT: {selectedClient.taxId || '00-00000000-0'}</span>
                {selectedClient.phone && <span>• Tel: {selectedClient.phone}</span>}
                {selectedClient.hasCurrentAccount && (
                  <span className="text-emerald-400 font-bold">• Cta Cte Habilitada</span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address & Driver Info */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Dirección de entrega / Obra..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Truck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={driverInfo}
                onChange={(e) => setDriverInfo(e.target.value)}
                placeholder="Chofer, DNI, Patente vehículo..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. PRODUCT SCANNER & FAST SEARCH BAR (Identical to POS search) */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="relative flex items-center gap-2">
            {/* Multiplier / Barcode Search Input */}
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  setSelectedProductIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Escanear código de barras o ingresar código / descripción (ej: 5*100903)... [F2 para Catálogo]"
                className="w-full bg-slate-900 text-white font-mono text-sm pl-11 pr-24 py-3 rounded-xl border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none placeholder-slate-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-slate-400 text-xs">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                  ENTER
                </span>
                <span>Cargar</span>
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && searchMatches.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <div className="p-2 bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between">
                    <span>Resultados coincidentes ({searchMatches.length})</span>
                    <span className="text-amber-400 font-normal">Use ↑ ↓ y ENTER</span>
                  </div>
                  {searchMatches.map((product, idx) => {
                    const whStock =
                      product.stockByWarehouse?.[selectedWarehouseId] ?? product.stock ?? 0;
                    const price = getProductUnitPrice(product);
                    const isSelected = idx === selectedProductIndex;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddToCart(product, 1)}
                        className={`w-full text-left p-2.5 flex items-center justify-between text-xs border-b border-slate-800/60 last:border-0 transition-colors cursor-pointer ${
                          isSelected ? 'bg-amber-500/20 text-white' : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {product.code}
                          </span>
                          <div>
                            <span className="font-semibold text-white block">{product.name}</span>
                            <span className="text-[11px] text-slate-400">
                              {product.brandName || 'S/M'} • {product.rubro || 'General'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Stock Depósito</span>
                            <span
                              className={`font-mono font-bold ${
                                whStock > 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {whStock} {product.unit || 'un.'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Precio Ref.</span>
                            <span className="font-mono font-bold text-amber-400">
                              ${price.toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* F2 Button for Catalog Modal */}
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm shrink-0 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>[F2] CATÁLOGO</span>
            </button>
          </div>
        </div>

        {/* 4. ITEMS TABLE (POS-style Cart Grid) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-950/60">
          {items.length === 0 ? (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800/80 rounded-2xl p-6 text-center">
              <Package className="w-14 h-14 text-slate-600 mb-3 stroke-1 animate-pulse" />
              <h4 className="text-base font-bold text-slate-300">
                El Remito no contiene artículos cargados
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Utilice el lector de código de barras, ingrese el código o descripción arriba, o
                presione <strong className="text-amber-400">[F2]</strong> para buscar productos en el catálogo.
              </p>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                + Abrir Buscador de Artículos (F2)
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 w-28">Código</th>
                    <th className="p-3">Descripción del Producto</th>
                    <th className="p-3 text-center w-36">Cantidad</th>
                    <th className="p-3 text-center w-20">Unidad</th>
                    <th className="p-3 text-right w-28">Precio Ref.</th>
                    <th className="p-3 text-center w-24">Bonif %</th>
                    <th className="p-3 text-right w-32">Subtotal</th>
                    <th className="p-3 text-center w-12">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {items.map((item, idx) => {
                    const prod = store.products.find((p) => p.id === item.productId);
                    const whStock =
                      prod?.stockByWarehouse?.[selectedWarehouseId] ?? prod?.stock ?? 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        {/* Index */}
                        <td className="p-3 text-center text-slate-500 font-mono font-bold">
                          {idx + 1}
                        </td>

                        {/* Code */}
                        <td className="p-3 font-mono font-bold text-amber-400 text-xs">
                          {item.productCode}
                        </td>

                        {/* Name & stock indicator */}
                        <td className="p-3">
                          <div className="font-semibold text-white text-xs">{item.productName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span>
                              Stock Depósito:{' '}
                              <strong
                                className={whStock >= item.quantity ? 'text-emerald-400' : 'text-rose-400'}
                              >
                                {whStock}
                              </strong>
                            </span>
                            {whStock < item.quantity && (
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                ⚠ Stock insuficiente
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Quantity with +/- Stepper */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemQuantity(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 bg-slate-950 border border-slate-700 text-white font-mono font-bold text-center py-1 rounded text-xs focus:border-amber-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="p-3 text-center text-slate-400 font-medium text-xs">
                          {item.unit || 'un.'}
                        </td>

                        {/* Unit Price */}
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)
                            }
                            className="w-24 bg-slate-950 border border-slate-700 text-white font-mono text-right py-1 px-1.5 rounded text-xs focus:border-amber-400 focus:outline-none"
                          />
                        </td>

                        {/* Discount */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent || 0}
                            onChange={(e) =>
                              handleUpdateItemDiscount(idx, parseFloat(e.target.value) || 0)
                            }
                            placeholder="0%"
                            className="w-16 bg-slate-950 border border-slate-700 text-slate-200 font-mono text-center py-1 rounded text-xs focus:border-amber-400 focus:outline-none"
                          />
                        </td>

                        {/* Subtotal */}
                        <td className="p-3 text-right font-mono font-extrabold text-white text-xs">
                          ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Remove Action */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Eliminar artículo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. SUMMARY, OBSERVATIONS & POS ACTION FOOTER (Identical to POS Checkout Bar) */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Notes and Observaciones */}
          <div className="w-full md:w-5/12 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones de entrega, N° Orden de Compra, etc..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Metrics & Action Buttons */}
          <div className="w-full md:w-7/12 flex flex-wrap items-center justify-end gap-3 sm:gap-4">
            {/* Metric Items */}
            <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Artículos
              </span>
              <span className="font-mono font-bold text-slate-200 text-xs">
                {totalItemsCount} ítems ({totalUnitsCount} un.)
              </span>
            </div>

            {/* Total Valued Amount */}
            <div className="bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Valor Estimado Carga
              </span>
              <span className="font-mono font-black text-amber-400 text-lg sm:text-xl">
                ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Clear / Cancel Buttons */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              [ESC] Cancelar
            </button>

            {/* HUGE EMIT REMITO BUTTON (F8) */}
            <button
              type="button"
              onClick={handleSubmitRemito}
              disabled={items.length === 0 || isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl flex items-center space-x-2 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>EMITIR REMITO (F8)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submodal: Client Selector (F1) */}
      {isClientModalOpen && (
        <ClientSelectorModal
          isOpen={isClientModalOpen}
          onClose={() => {
            setIsClientModalOpen(false);
            searchInputRef.current?.focus();
          }}
          clients={store.clients}
          selectedClientId={selectedClientId}
          onSelectClient={handleSelectClient}
        />
      )}

      {/* Submodal: Product Search (F2) */}
      {isProductModalOpen && (
        <ProductSearchModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            searchInputRef.current?.focus();
          }}
          products={store.products}
          warehouseId={selectedWarehouseId}
          priceListId={selectedPriceListId}
          onAddProduct={(product, qty) => {
            handleAddToCart(product, qty || 1);
            setIsProductModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
