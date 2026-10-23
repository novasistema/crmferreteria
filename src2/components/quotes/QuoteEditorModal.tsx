import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Quote, QuoteItem, Client } from '../../types';
import { ClientSelectorModal } from '../pos/ClientSelectorModal';
import { ProductSearchModal } from '../pos/ProductSearchModal';
import {
  FileText,
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
  DollarSign,
  Layers,
  CheckCircle2,
  Calendar,
  Percent,
  Edit3,
  Clock,
  Printer,
  ShoppingCart,
  Save,
  Tag,
} from 'lucide-react';

interface QuoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteToEdit?: Quote | null;
  onSaved: (quote: Quote, shouldPrint?: boolean) => void;
  onConvertToSale?: (quote: Quote) => void;
}

export const QuoteEditorModal: React.FC<QuoteEditorModalProps> = ({
  isOpen,
  onClose,
  quoteToEdit,
  onSaved,
  onConvertToSale,
}) => {
  const { store, currentUser, activeWarehouseId, showToast } = useApp();

  const isEditing = Boolean(quoteToEdit);

  // General configuration state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    quoteToEdit?.warehouseId || activeWarehouseId || store.warehouses[0]?.id || '1'
  );
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>(
    quoteToEdit?.priceListId || '1'
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(
    quoteToEdit?.clientId || store.clients[0]?.id || '1'
  );
  const [validityDays, setValidityDays] = useState<number>(7);
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('');
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(
    quoteToEdit?.discountPercent || 0
  );
  const [notes, setNotes] = useState<string>(
    quoteToEdit?.notes ||
      'Precios sujetos a variación luego del período de validez. Incluye IVA. Entrega a coordinar.'
  );

  // Items in Quote
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Submodals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form when modal opens or quoteToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (quoteToEdit) {
        setSelectedWarehouseId(quoteToEdit.warehouseId || activeWarehouseId || store.warehouses[0]?.id || '1');
        setSelectedPriceListId(quoteToEdit.priceListId || '1');
        setSelectedClientId(quoteToEdit.clientId);
        setGlobalDiscountPercent(quoteToEdit.discountPercent || 0);
        setNotes(quoteToEdit.notes || 'Precios sujetos a variación luego del período de validez.');
        setItems(
          quoteToEdit.items.map((i) => ({
            ...i,
            unitPrice: i.unitPrice,
            discountPercent: i.discountPercent || 0,
            subtotal: i.subtotal,
          }))
        );

        if (quoteToEdit.expiryDate) {
          const expDate = new Date(quoteToEdit.expiryDate);
          const now = new Date();
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if ([7, 15, 30, 45, 60].includes(diffDays)) {
            setValidityDays(diffDays);
            setCustomExpiryDate('');
          } else {
            setValidityDays(-1);
            setCustomExpiryDate(expDate.toISOString().slice(0, 10));
          }
        }
      } else {
        // New Quote defaults
        setSelectedWarehouseId(activeWarehouseId || store.warehouses[0]?.id || '1');
        setSelectedPriceListId('1');
        setSelectedClientId(store.clients[0]?.id || '1');
        setValidityDays(7);
        setCustomExpiryDate('');
        setGlobalDiscountPercent(0);
        setNotes('Precios sujetos a variación luego del período de validez. Incluye IVA. Entrega a coordinar.');
        setItems([]);
      }

      setSearchQuery('');
      setShowDropdown(false);
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [isOpen, quoteToEdit, activeWarehouseId, store.warehouses, store.clients]);

  // Selected client memo
  const selectedClient = useMemo(() => {
    return (
      store.clients.find((c) => c.id === selectedClientId) ||
      store.clients[0] || {
        id: '1',
        code: 'CLI-001',
        name: 'Consumidor Final',
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

  // Sync client's preferred price list on client change if not editing
  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    if (!isEditing && client.priceListId) {
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
          (p.brandName && p.brandName.toLowerCase().includes(cleaned)) ||
          (p.rubro && p.rubro.toLowerCase().includes(cleaned))
        );
      })
      .slice(0, 8);
  }, [searchQuery, store.products]);

  // Add Product to Quote
  const handleAddToCart = (product: Product, quantityToAdd: number = 1, customPrice?: number) => {
    const defaultPrice = customPrice !== undefined ? customPrice : getProductUnitPrice(product);

    setItems((prev) => {
      const idx = prev.findIndex((item) => item.productId === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + quantityToAdd;
        const currentPrice = customPrice !== undefined ? customPrice : updated[idx].unitPrice;
        const disc = updated[idx].discountPercent || 0;
        const sub = Math.round(newQty * currentPrice * (1 - disc / 100));

        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          unitPrice: currentPrice,
          subtotal: sub,
        };
        return updated;
      }

      const itemSubtotal = Math.round(defaultPrice * quantityToAdd);
      return [
        ...prev,
        {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          quantity: quantityToAdd,
          unit: product.unit || 'un.',
          brandName: product.brandName,
          unitPrice: defaultPrice,
          originalPrice: getProductUnitPrice(product),
          costPrice: product.costPrice || 0,
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

  // Keyboard shortcut listener for Quote POS window
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
        handleSave(false);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (items.length > 0 && confirm('¿Desea vaciar todos los artículos del presupuesto?')) {
          setItems([]);
          showToast('Presupuesto vaciado', 'info');
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

      // Exact barcode match first
      const exactBarcode = store.products.find(
        (p) => p.active && p.barcode && p.barcode.toLowerCase() === query
      );
      if (exactBarcode) {
        handleAddToCart(exactBarcode, quantity);
        return;
      }

      // Exact code match
      const exactCode = store.products.find(
        (p) => p.active && p.code && p.code.toLowerCase() === query
      );
      if (exactCode) {
        handleAddToCart(exactCode, quantity);
        return;
      }

      // Highlighted match from dropdown
      if (searchMatches.length > 0) {
        const selected = searchMatches[selectedProductIndex] || searchMatches[0];
        if (selected) {
          handleAddToCart(selected, quantity);
          return;
        }
      }

      showToast(`No se encontró producto para "${raw}"`, 'warning');
    }
  };

  // Quantity modification
  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const disc = item.discountPercent || 0;
        const sub = Math.round(newQty * item.unitPrice * (1 - disc / 100));
        return {
          ...item,
          quantity: newQty,
          subtotal: sub,
        };
      })
    );
  };

  // Unit Price modification (Custom price for quote!)
  const handleUpdateUnitPrice = (index: number, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const disc = item.discountPercent || 0;
        const sub = Math.round(item.quantity * validPrice * (1 - disc / 100));
        return {
          ...item,
          unitPrice: validPrice,
          subtotal: sub,
        };
      })
    );
  };

  // Item Discount modification
  const handleUpdateItemDiscount = (index: number, newDiscount: number) => {
    const validDiscount = Math.min(100, Math.max(0, newDiscount));
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const sub = Math.round(item.quantity * item.unitPrice * (1 - validDiscount / 100));
        return {
          ...item,
          discountPercent: validDiscount,
          subtotal: sub,
        };
      })
    );
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    showToast('Artículo eliminado del presupuesto', 'info');
  };

  // Update prices if user changes price list
  const handlePriceListChange = (newPriceListId: string) => {
    setSelectedPriceListId(newPriceListId);
    if (items.length > 0) {
      if (
        confirm(
          '¿Desea actualizar los precios unitarios de los productos ya cargados a la nueva lista seleccionada?'
        )
      ) {
        setItems((prev) =>
          prev.map((item) => {
            const product = store.products.find((p) => p.id === item.productId);
            if (!product) return item;

            let newPrice = product.priceMinorista;
            if (newPriceListId === 'pl-mayorista' || newPriceListId === 'mayorista') {
              newPrice = product.priceMayorista || product.priceMinorista;
            } else if (newPriceListId === 'pl-gremio' || newPriceListId === 'gremio') {
              newPrice = product.priceGremio || product.priceMinorista;
            }

            const disc = item.discountPercent || 0;
            return {
              ...item,
              unitPrice: newPrice,
              originalPrice: newPrice,
              subtotal: Math.round(item.quantity * newPrice * (1 - disc / 100)),
            };
          })
        );
        showToast('Precios actualizados a la nueva lista', 'success');
      }
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [items]);

  const discountTotal = useMemo(() => {
    if (globalDiscountPercent <= 0) return 0;
    return Math.round((subtotal * globalDiscountPercent) / 100);
  }, [subtotal, globalDiscountPercent]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountTotal);
  }, [subtotal, discountTotal]);

  const totalUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Expiry date calculation
  const calculatedExpiryDate = useMemo(() => {
    if (validityDays === -1 && customExpiryDate) {
      return new Date(customExpiryDate + 'T23:59:59').toISOString();
    }
    const days = validityDays > 0 ? validityDays : 7;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }, [validityDays, customExpiryDate]);

  // Submit / Save Quote
  const handleSave = (shouldPrint: boolean = false) => {
    if (items.length === 0) {
      showToast('Agregue al menos un producto para generar el presupuesto', 'error');
      searchInputRef.current?.focus();
      return;
    }

    if (isEditing && quoteToEdit) {
      const updatedQuote: Quote = {
        ...quoteToEdit,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientTaxId: selectedClient.taxId,
        clientAddress: selectedClient.address,
        clientPhone: selectedClient.phone,
        warehouseId: selectedWarehouseId,
        priceListId: selectedPriceListId,
        expiryDate: calculatedExpiryDate,
        items,
        subtotal,
        discountPercent: globalDiscountPercent,
        discountTotal,
        total,
        notes,
      };

      const saved = store.updateQuote(updatedQuote);
      showToast(`Presupuesto ${saved.code} actualizado exitosamente`, 'success');
      onSaved(saved, shouldPrint);
    } else {
      const newQuote = store.createQuote({
        clientId: selectedClient.id,
        items,
        validityDays: validityDays > 0 ? validityDays : 7,
        notes,
        warehouseId: selectedWarehouseId,
        priceListId: selectedPriceListId,
        discountPercent: globalDiscountPercent,
        user: currentUser,
      });

      // Override custom expiry date if user selected a custom date
      if (validityDays === -1 && customExpiryDate) {
        newQuote.expiryDate = calculatedExpiryDate;
        store.updateQuote(newQuote);
      }

      showToast(`Presupuesto ${newQuote.code} creado exitosamente`, 'success');
      onSaved(newQuote, shouldPrint);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  {isEditing ? `Editar Presupuesto: ${quoteToEdit?.code}` : 'Nuevo Presupuesto / Cotización'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    isEditing
                      ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {isEditing ? 'Modo Edición' : 'Vigente'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Formato POS interactivo con edición de precios en tiempo real, descuentos y validez
              </p>
            </div>
          </div>

          {/* Quick Selectors (Client, Price List, Warehouse, Validity) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Client Badge & Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3 space-x-2">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 leading-none">Cliente</span>
                <span className="text-xs font-bold text-white max-w-[160px] truncate leading-tight">
                  {selectedClient.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors flex items-center space-x-1"
                title="Cambiar cliente (F1)"
              >
                <span>F1</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Price List Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3 space-x-2">
              <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 leading-none">Lista de Precios</span>
                <select
                  value={selectedPriceListId}
                  onChange={(e) => handlePriceListChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
                >
                  <option value="1" className="bg-slate-900 text-white">
                    Minorista (Base)
                  </option>
                  <option value="pl-mayorista" className="bg-slate-900 text-white">
                    Mayorista (-15%)
                  </option>
                  <option value="pl-gremio" className="bg-slate-900 text-white">
                    Gremio / Obras (-20%)
                  </option>
                </select>
              </div>
            </div>

            {/* Warehouse Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3 space-x-2">
              <Warehouse className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 leading-none">Depósito</span>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
                >
                  {store.warehouses.map((w) => (
                    <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Validity Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3 space-x-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 leading-none">Validez</span>
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value))}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
                >
                  <option value="7" className="bg-slate-900 text-white">
                    7 Días Corridos
                  </option>
                  <option value="15" className="bg-slate-900 text-white">
                    15 Días Corridos
                  </option>
                  <option value="30" className="bg-slate-900 text-white">
                    30 Días Corridos
                  </option>
                  <option value="60" className="bg-slate-900 text-white">
                    60 Días Corridos
                  </option>
                  <option value="-1" className="bg-slate-900 text-white">
                    Fecha Personalizada
                  </option>
                </select>
              </div>
            </div>

            {validityDays === -1 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-1.5">
                <input
                  type="date"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none"
                />
              </div>
            )}

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors ml-1"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-7xl w-full mx-auto p-4 gap-3">
        {/* Search & Action Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Autocomplete Input */}
          <div className="relative flex-1 min-w-[320px]">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
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
                onFocus={() => setShowDropdown(true)}
                placeholder="Escanee código de barra, código SKU o escriba nombre de producto (ej: 3*martillo)..."
                className="w-full bg-slate-950 text-white text-xs rounded-xl pl-9 pr-24 py-2.5 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder-slate-500 font-medium"
              />
              <div className="absolute right-2 flex items-center space-x-1">
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                  Enter ↵
                </span>
              </div>
            </div>

            {/* Live Autocomplete Dropdown */}
            {showDropdown && searchMatches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800">
                <div className="p-2 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Resultados coincidentes ({searchMatches.length})</span>
                  <span>Use ↑ / ↓ y presione Enter para agregar</span>
                </div>
                {searchMatches.map((product, idx) => {
                  const unitPrice = getProductUnitPrice(product);
                  const whStock =
                    product.stockByWarehouse?.[selectedWarehouseId] ?? product.stock ?? 0;
                  const isSelected = idx === selectedProductIndex;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      onMouseEnter={() => setSelectedProductIndex(idx)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-500/20 text-white' : 'hover:bg-slate-800/60 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                          <Package className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-black text-amber-400">
                              {product.code}
                            </span>
                            <span className="text-xs font-bold text-white">{product.name}</span>
                            {product.brandName && (
                              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400">
                                {product.brandName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                            <span>
                              Stock:{' '}
                              <strong className={whStock > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {whStock} {product.unit || 'un.'}
                              </strong>
                            </span>
                            {product.barcode && (
                              <span className="font-mono">Barras: {product.barcode}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-emerald-400 block">
                          ${unitPrice.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-slate-400">Precio Unitario</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span>[F2] Catálogo / Buscar</span>
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Desea vaciar todos los artículos del presupuesto actual?')) {
                    setItems([]);
                    showToast('Presupuesto vaciado', 'info');
                  }
                }}
                className="px-3 py-2 bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-bold rounded-xl border border-slate-700 hover:border-rose-800 flex items-center space-x-1.5 transition-colors"
                title="Limpiar (F9)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>[F9] Vaciar</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
          {/* Table Header */}
          <div className="p-3 bg-slate-800/90 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[10px] grid grid-cols-12 gap-2 items-center">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Código & Producto</div>
            <div className="col-span-2 text-center">Cantidad</div>
            <div className="col-span-2 text-right">P. Unitario ($) (Editable)</div>
            <div className="col-span-1 text-center">Desc %</div>
            <div className="col-span-1 text-right">Subtotal</div>
            <div className="col-span-1 text-center">Quitar</div>
          </div>

          {/* Table Body / Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/60 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400">
                  <ShoppingCart className="w-8 h-8 opacity-40" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">El presupuesto no contiene artículos</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Escanee un código de barras, use la barra de búsqueda o presione{' '}
                    <strong className="text-amber-400">F2</strong> para abrir el catálogo completo.
                  </p>
                </div>
              </div>
            ) : (
              items.map((item, idx) => {
                const product = store.products.find((p) => p.id === item.productId);
                const whStock =
                  product?.stockByWarehouse?.[selectedWarehouseId] ?? product?.stock ?? 0;
                const isPriceModified =
                  item.originalPrice !== undefined && item.unitPrice !== item.originalPrice;

                return (
                  <div
                    key={item.productId + idx}
                    className="p-2.5 hover:bg-slate-800/40 rounded-xl transition-colors grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    {/* Index */}
                    <div className="col-span-1 text-center font-mono font-bold text-slate-500">
                      {idx + 1}
                    </div>

                    {/* Product Code & Name */}
                    <div className="col-span-4 flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-amber-400 font-bold">{item.productCode}</span>
                        <span className="font-bold text-white truncate">{item.productName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        {item.brandName && <span>Marca: {item.brandName}</span>}
                        <span>
                          Stock en depósito:{' '}
                          <strong className={whStock > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {whStock} {item.unit || 'un.'}
                          </strong>
                        </span>
                        {isPriceModified && (
                          <span className="text-amber-400 font-semibold flex items-center space-x-0.5">
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>Precio modificado</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="col-span-2 flex items-center justify-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) handleUpdateQuantity(idx, val);
                        }}
                        className="w-14 bg-slate-950 text-center font-black text-white rounded-lg p-1 border border-slate-700 focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Editable Unit Price */}
                    <div className="col-span-2 flex items-center justify-end space-x-1">
                      <span className="text-slate-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) handleUpdateUnitPrice(idx, val);
                        }}
                        className="w-24 bg-slate-950 text-right font-black font-mono text-emerald-400 rounded-lg px-2 py-1 border border-slate-700 focus:border-amber-500 focus:outline-none"
                        title="Haga clic para editar el precio unitario de este presupuesto"
                      />
                    </div>

                    {/* Editable Discount Percent */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="relative w-14">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) handleUpdateItemDiscount(idx, val);
                          }}
                          className="w-full bg-slate-950 text-center font-bold text-amber-300 rounded-lg p-1 pr-4 border border-slate-700 focus:border-amber-500 focus:outline-none text-xs"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Calculated Subtotal */}
                    <div className="col-span-1 text-right font-mono font-black text-white text-xs">
                      ${item.subtotal.toLocaleString('es-AR')}
                    </div>

                    {/* Delete Item Action */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Quitar producto"
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

        {/* Bottom Summary & Confirmation Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Notes & Commercial Terms */}
          <div className="md:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Condiciones Comerciales & Observaciones</span>
              </label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() =>
                    setNotes(
                      'Precios sujetos a variación luego del período de validez. Incluye IVA. Entrega a coordinar.'
                    )
                  }
                  className="text-[10px] text-slate-400 hover:text-amber-300 underline"
                >
                  Estándar
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() =>
                    setNotes(
                      'Cotización especial para obra. Condiciones: 50% anticipo y 50% contra entrega. Flete bonificado.'
                    )
                  }
                  className="text-[10px] text-slate-400 hover:text-amber-300 underline"
                >
                  Obra
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() =>
                    setNotes(
                      'Precios válidos por pago contado / transferencia bancaria inmediata. Sujeto a disponibilidad de stock.'
                    )
                  }
                  className="text-[10px] text-slate-400 hover:text-amber-300 underline"
                >
                  Transferencia
                </button>
              </div>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escriba condiciones de entrega, garantía, forma de pago o validez..."
              className="w-full bg-slate-950 text-xs text-slate-200 rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Discounts & Totals Box */}
          <div className="md:col-span-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Subtotal ({totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}):</span>
              <span className="font-mono font-bold text-slate-200">
                ${subtotal.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <span>Desc. Global:</span>
                <div className="relative inline-block w-12 ml-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalDiscountPercent}
                    onChange={(e) => setGlobalDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-center font-bold text-amber-300 rounded px-1 py-0.5 text-xs border border-slate-700 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <span>%</span>
              </span>
              <span className="font-mono font-bold text-amber-400">
                -${discountTotal.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-xs font-black uppercase text-slate-300">Total Cotizado:</span>
              <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                ${total.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-3 flex flex-col space-y-2">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={items.length === 0}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 font-bold rounded-xl text-xs border border-amber-500/30 flex items-center justify-center space-x-1 transition-colors disabled:opacity-50"
                title="Guardar e Imprimir Comprobante"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={items.length === 0}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Actualizar Presupuesto [F8]' : 'Guardar Presupuesto [F8]'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submodals: Client Selector & Product Catalog Search */}
      <ClientSelectorModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clients={store.clients}
        selectedClientId={selectedClientId}
        onSelectClient={handleSelectClient}
      />

      <ProductSearchModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        products={store.products}
        warehouseId={selectedWarehouseId}
        priceListId={selectedPriceListId}
        onAddProduct={(product, qty) => {
          handleAddToCart(product, qty || 1);
          setIsProductModalOpen(false);
        }}
      />
    </div>
  );
};
