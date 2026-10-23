import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, SaleItem, SalePayment, DocumentType, PaymentMethod, Client, Remito } from '../../types';
import { ClientSelectorModal } from './ClientSelectorModal';
import { ProductSearchModal } from './ProductSearchModal';
import { CheckoutModal } from './CheckoutModal';
import { ImportRemitosModal } from './ImportRemitosModal';
import { TransformToDocumentModal } from './TransformToDocumentModal';
import {
  Search,
  RotateCw,
  User,
  Plus,
  Minus,
  Trash2,
  Package,
  Printer,
  Mail,
  Share2,
  XCircle,
  Banknote,
  Percent,
  Barcode,
  Keyboard,
  Warehouse,
  ChevronDown,
  FileCheck,
  Layers,
} from 'lucide-react';

interface QuantityInputProps {
  quantity: number;
  onChange: (qty: number) => void;
}

const QuantityInput: React.FC<QuantityInputProps> = ({ quantity, onChange }) => {
  const [text, setText] = useState(String(quantity));

  useEffect(() => {
    setText(String(quantity));
  }, [quantity]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const val = e.target.value;
        setText(val);
        const normalized = val.replace(',', '.');
        const num = parseFloat(normalized);
        if (!isNaN(num)) {
          onChange(num);
        } else if (val === '' || val === '-' || val === '.') {
          onChange(0);
        }
      }}
      className="w-16 text-center bg-slate-950 font-black text-amber-300 rounded border-2 border-slate-600 py-1 text-xs focus:border-blue-400 focus:outline-none"
    />
  );
};

export const POSView: React.FC = () => {
  const {
    store,
    currentUser,
    activeWarehouseId,
    setActiveWarehouseId,
    setPreviewSale,
    showToast,
    globalSearch,
    setGlobalSearch,
    pendingRemitoToBill,
    setPendingRemitoToBill,
    setActiveModule,
    setPreviewClientPortal,
  } = useApp();

  // Search & Input state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Cart & sale options
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('1'); // Default to Cliente Ocasional / ID 1
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('1');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('ticket');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState<string>('1');

  // Adjustments & flags
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(0);
  const [printOnSave, setPrintOnSave] = useState<boolean>(true);
  const [sendEmailOnSave, setSendEmailOnSave] = useState<boolean>(false);
  const [sendWhatsappOnSave, setSendWhatsappOnSave] = useState<boolean>(false);

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isImportRemitosModalOpen, setIsImportRemitosModalOpen] = useState(false);
  const [isTransformModalOpen, setIsTransformModalOpen] = useState(false);
  const [importedRemitoIds, setImportedRemitoIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected client object
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

  // Pending remitos for the selected client
  const pendingClientRemitos = useMemo(() => {
    return store.remitos.filter(
      (r) => r.clientId === selectedClient.id && r.status === 'pending_invoice'
    );
  }, [store.remitos, selectedClient.id]);

  // Handle client selection and price list syncing
  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    if (client.priceListId) {
      setSelectedPriceListId(client.priceListId);
    }
    const clientDiscount = (client as any).discountPercent;
    if (typeof clientDiscount === 'number' && clientDiscount > 0) {
      setGlobalDiscountPercent(clientDiscount);
    }
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // Helper to get unit price according to price list
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

  // Live autocomplete matches for typed search
  const searchMatches = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) return [];

    // Check multiplier format: "3*codigo"
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

  // Sync global search from top header
  useEffect(() => {
    if (globalSearch) {
      setSearchQuery(globalSearch);
      setShowDropdown(true);
      searchInputRef.current?.focus();
    }
  }, [globalSearch]);

  // Barcode scanner input handler & auto-focus
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleBarcodeScanner = (e: KeyboardEvent) => {
      if (isClientModalOpen || isProductModalOpen || isCheckoutModalOpen) return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 60) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.trim().length >= 3) {
          const scannedCode = barcodeBuffer.trim().toLowerCase();
          const matchedProduct = store.products.find(
            (p) =>
              p.active &&
              ((p.barcode && p.barcode.toLowerCase() === scannedCode) ||
                p.code.toLowerCase() === scannedCode ||
                (p.supplierCode && p.supplierCode.toLowerCase() === scannedCode))
          );
          if (matchedProduct) {
            handleAddToCart(matchedProduct, 1);
            barcodeBuffer = '';
            e.preventDefault();
            return;
          }
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        if (document.activeElement !== searchInputRef.current && barcodeBuffer.length === 1) {
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleBarcodeScanner);
    return () => {
      window.removeEventListener('keydown', handleBarcodeScanner);
    };
  }, [store.products, isClientModalOpen, isProductModalOpen, isCheckoutModalOpen]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in a modal or non-pos input
      if (isClientModalOpen || isProductModalOpen || isCheckoutModalOpen) return;

      if (e.key === 'F1') {
        e.preventDefault();
        setIsClientModalOpen(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsProductModalOpen(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsTransformModalOpen(true);
        } else {
          showToast('Agregue productos para transformar a remito o presupuesto', 'warning');
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        // Cycle price lists
        if (store.priceLists.length > 0) {
          const currentIndex = store.priceLists.findIndex((p) => p.id === selectedPriceListId);
          const nextIndex = (currentIndex + 1) % store.priceLists.length;
          setSelectedPriceListId(store.priceLists[nextIndex].id);
          showToast(`Lista de precio: ${store.priceLists[nextIndex].name}`, 'info');
        }
      } else if (e.key === 'F7') {
        e.preventDefault();
        const disc = prompt('Ingrese % de Bonificación/Descuento global:', globalDiscountPercent.toString());
        if (disc !== null) {
          setGlobalDiscountPercent(Math.max(0, Math.min(100, parseFloat(disc) || 0)));
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCheckoutModalOpen(true);
        } else {
          showToast('Agregue productos a la venta antes de cobrar', 'warning');
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && confirm('¿Desea iniciar una nueva venta y limpiar los artículos?')) {
          setCart([]);
          setGlobalDiscountPercent(0);
          showToast('Venta reiniciada', 'info');
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isClientModalOpen,
    isProductModalOpen,
    isCheckoutModalOpen,
    cart,
    selectedPriceListId,
    store.priceLists,
    globalDiscountPercent,
    showToast,
  ]);

  // Focus search input on initial mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Automatically load pending Remito to bill if directed from RemitosView
  useEffect(() => {
    if (pendingRemitoToBill) {
      const remito = pendingRemitoToBill;
      
      // 1. Select the client from the remito if found
      if (remito.clientId) {
        setSelectedClientId(remito.clientId);
        const cli = store.clients.find((c) => c.id === remito.clientId);
        if (cli?.priceListId) {
          setSelectedPriceListId(cli.priceListId);
        }
        // Set document type according to client fiscal condition
        if (cli?.taxCondition === 'Responsable Inscripto') {
          setSelectedDocType('factura_a');
        } else {
          setSelectedDocType('factura_b');
        }
      }

      // 2. Map remito items to cart items
      const newItems: SaleItem[] = remito.items.map((item) => {
        const existingProduct = store.products.find((p) => p.id === item.productId);
        return {
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit || 'unidad',
          unitCost: existingProduct?.costPrice || 0,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          vatRate: existingProduct?.vatRate || 21,
          subtotal: item.subtotal,
        };
      });

      setCart(newItems);
      setImportedRemitoIds([remito.id]);
      showToast(`Remito ${remito.code} (${remito.clientName}) cargado listo para facturar`, 'success');

      // 3. Clear pending remito to prevent re-triggering
      setPendingRemitoToBill(null);
    }
  }, [pendingRemitoToBill, store.products, store.clients, setPendingRemitoToBill, showToast]);

  // Add Product to Cart
  const handleAddToCart = (product: Product, quantityToAdd: number = 1) => {
    const currentWhStock = product.stockByWarehouse?.[activeWarehouseId] ?? product.stock ?? 0;
    if (currentWhStock <= 0 && !store.settings.allowNegativeStock) {
      const currentWhName = store.warehouses.find((w) => w.id === activeWarehouseId)?.name || 'la sucursal';
      showToast(`Sin stock de ${product.name} en ${currentWhName}`, 'error');
      return;
    }

    const price = getProductUnitPrice(product);

    setCart((prev) => {
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
          unitCost: product.costPrice || 0,
          unitPrice: price,
          discountPercent: 0,
          vatRate: product.vatRate || 21,
          subtotal: itemSubtotal,
        },
      ];
    });

    showToast(`+ ${quantityToAdd} ${product.unit || 'un.'} ${product.name}`, 'success');
    setSearchQuery('');
    setShowDropdown(false);
    searchInputRef.current?.focus();
  };

  // Search input keydown handler
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

      // Extract multiplier if provided (e.g. 3*100903 or 5*77912345)
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

      // Check exact code, barcode, or SKU match
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

      // If dropdown item is highlighted
      if (searchMatches[selectedProductIndex]) {
        handleAddToCart(searchMatches[selectedProductIndex], quantity);
        return;
      }

      // If exactly 1 match
      if (searchMatches.length === 1) {
        handleAddToCart(searchMatches[0], quantity);
        return;
      }

      // If multiple or no match, open advanced lookup
      if (searchMatches.length > 1) {
        setShowDropdown(true);
      } else {
        setIsProductModalOpen(true);
      }
    }
  };

  // Update item quantity
  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCart((prev) => {
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

  // Update item discount %
  const handleUpdateItemDiscount = (index: number, discount: number) => {
    const validDiscount = Math.max(0, Math.min(100, discount || 0));
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const sub = item.quantity * item.unitPrice * (1 - validDiscount / 100);
      updated[index] = {
        ...item,
        discountPercent: validDiscount,
        subtotal: sub,
      };
      return updated;
    });
  };

  // Remove item from cart
  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    searchInputRef.current?.focus();
  };

  // Totals calculations
  const rawSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const globalDiscountAmount = useMemo(() => {
    return (rawSubtotal * globalDiscountPercent) / 100;
  }, [rawSubtotal, globalDiscountPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, rawSubtotal - globalDiscountAmount);
  }, [rawSubtotal, globalDiscountAmount]);

  const totalQuantityUnits = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Import remitos items into POS cart
  const handleImportRemitos = (selectedRemitos: Remito[], priceOption: 'keep' | 'update') => {
    const newItems: SaleItem[] = [];
    const remitoIds: string[] = [];

    for (const remito of selectedRemitos) {
      remitoIds.push(remito.id);
      for (const item of remito.items) {
        const existingProduct = store.products.find((p) => p.id === item.productId);
        const unitPriceToUse =
          priceOption === 'update' && existingProduct
            ? getProductUnitPrice(existingProduct)
            : item.unitPrice;
        const discount = item.discountPercent || 0;
        const subtotal = item.quantity * unitPriceToUse * (1 - discount / 100);

        newItems.push({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit || 'unidad',
          unitCost: existingProduct?.costPrice || 0,
          unitPrice: unitPriceToUse,
          discountPercent: discount,
          vatRate: existingProduct?.vatRate || 21,
          subtotal,
        });
      }
    }

    setCart((prev) => {
      const merged = [...prev];
      for (const newItem of newItems) {
        const existingIdx = merged.findIndex((m) => m.productId === newItem.productId);
        if (existingIdx >= 0) {
          const current = merged[existingIdx];
          const totalQty = current.quantity + newItem.quantity;
          merged[existingIdx] = {
            ...current,
            quantity: totalQty,
            subtotal: totalQty * current.unitPrice * (1 - (current.discountPercent || 0) / 100),
          };
        } else {
          merged.push(newItem);
        }
      }
      return merged;
    });

    setImportedRemitoIds((prev) => Array.from(new Set([...prev, ...remitoIds])));
    const modeText = priceOption === 'update' ? 'actualizados al precio de hoy' : 'manteniendo precio original';
    showToast(`Se importaron ${selectedRemitos.length} remito(s) (${modeText})`, 'success');
  };

  // Transform cart to Remito
  const handleTransformToRemito = (params: {
    warehouseId: string;
    deliveryAddress: string;
    notes: string;
    clearCart: boolean;
  }) => {
    if (cart.length === 0) return;
    const remitoItems = cart.map((i) => ({
      productId: i.productId,
      productCode: i.productCode,
      productName: i.productName,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
      subtotal: i.subtotal,
    }));

    const newRem = store.createRemito({
      clientId: selectedClient.id,
      warehouseId: params.warehouseId,
      items: remitoItems,
      deliveryAddress: params.deliveryAddress,
      notes: params.notes,
      user: currentUser,
    });

    showToast(`Remito ${newRem.code} generado correctamente y stock descontado`, 'success');
    if (params.clearCart) {
      setCart([]);
      setGlobalDiscountPercent(0);
      setImportedRemitoIds([]);
    }
  };

  // Transform cart to Quote
  const handleTransformToQuote = (params: {
    validityDays: number;
    notes: string;
    clearCart: boolean;
  }) => {
    if (cart.length === 0) return;
    const quoteItems = cart.map((i) => ({
      productId: i.productId,
      productCode: i.productCode,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent || 0,
      subtotal: i.subtotal,
    }));

    const newQ = store.createQuote({
      clientId: selectedClient.id,
      items: quoteItems,
      validityDays: params.validityDays,
      notes: params.notes,
      user: currentUser,
    });

    showToast(`Presupuesto ${newQ.code} generado con éxito`, 'success');
    if (params.clearCart) {
      setCart([]);
      setGlobalDiscountPercent(0);
      setImportedRemitoIds([]);
    }
  };

  // Execute sale finalization
  const handleFinalizeSale = (paymentDetails: {
    method: PaymentMethod;
    cashTendered: number;
    cardBrand?: string;
    installments?: number;
    printTicket: boolean;
    sendEmail: boolean;
    sendWhatsapp: boolean;
    documentType?: DocumentType;
  }) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Build payment payload
      const payments: SalePayment[] = [
        {
          id: `pay-${Date.now()}`,
          method: paymentDetails.method,
          amount: grandTotal,
          cardBrand: paymentDetails.cardBrand,
          cardInstallments: paymentDetails.installments,
        },
      ];

      // Current account check
      if (paymentDetails.method === 'current_account') {
        if (!selectedClient.hasCurrentAccount) {
          showToast(`El cliente ${selectedClient.name} no tiene cuenta corriente habilitada`, 'error');
          setIsProcessing(false);
          return;
        }
        if (
          selectedClient.creditLimit > 0 &&
          selectedClient.currentBalance + grandTotal > selectedClient.creditLimit
        ) {
          showToast(`Límite de crédito excedido ($${selectedClient.creditLimit.toLocaleString('es-AR')})`, 'error');
          setIsProcessing(false);
          return;
        }
      }

      const docTypeToUse = paymentDetails.documentType || selectedDocType;

      const completedSale = store.processSale({
        clientId: selectedClient.id,
        warehouseId: activeWarehouseId,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        priceListId: selectedPriceListId,
        items: cart,
        discountAmount: globalDiscountAmount,
        payments,
        documentType: docTypeToUse,
        notes: importedRemitoIds.length > 0 ? `Facturación de Remitos importados (${importedRemitoIds.length})` : '',
        user: currentUser,
      });

      // If remitos were imported, mark them as invoiced
      if (importedRemitoIds.length > 0) {
        store.markRemitosAsInvoiced(importedRemitoIds, completedSale.id, completedSale.code);
        setImportedRemitoIds([]);
      }

      showToast(`¡Venta ${completedSale.code} (${docTypeToUse.toUpperCase()}) registrada con éxito!`, 'success');
      setCart([]);
      setGlobalDiscountPercent(0);
      setIsCheckoutModalOpen(false);

      if (paymentDetails.printTicket) {
        setPreviewSale(completedSale);
      }
    } catch (err: any) {
      showToast(`Error al procesar la venta: ${err.message || 'Error inesperado'}`, 'error');
    } finally {
      setIsProcessing(false);
      searchInputRef.current?.focus();
    }
  };

  // Format today's date
  const todayFormatted = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 select-none overflow-hidden">
      {/* 1. TOP CONFIGURATION BAR (Fecha | Tipo Doc | Forma Pago | Caja | Lista Precio) */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Fecha */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Fecha:</span>
            <span className="font-bold text-white font-mono">{todayFormatted}</span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Tipo Doc */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Tipo Doc:</span>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
              className="bg-slate-900 text-white font-bold px-2 py-1 rounded border border-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="ticket">Ingreso Simple</option>
              <option value="factura_b">Factura B (Consumidor Final)</option>
              <option value="factura_a">Factura A (Resp. Inscripto)</option>
              <option value="remito">Remito de Entrega</option>
              <option value="presupuesto">Presupuesto</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Forma Pago */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Forma pago:</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="bg-slate-900 text-amber-400 font-bold px-2 py-1 rounded border border-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="cash">Efectivo</option>
              <option value="debit_card">Tarjeta Débito</option>
              <option value="credit_card">Tarjeta Crédito</option>
              <option value="bank_transfer">Transferencia</option>
              <option value="current_account">Cuenta Corriente</option>
              <option value="check">Cheque</option>
              <option value="mercadopago_qr">MercadoPago QR</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Caja */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Caja:</span>
            <select
              value={selectedCashRegisterId}
              onChange={(e) => setSelectedCashRegisterId(e.target.value)}
              className="bg-slate-900 text-slate-200 font-semibold px-2 py-1 rounded border border-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {store.cashRegisters.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Lista Precio */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Lista Precio:</span>
            <select
              value={selectedPriceListId}
              onChange={(e) => setSelectedPriceListId(e.target.value)}
              className="bg-slate-900 text-amber-400 font-bold px-2 py-1 rounded border border-slate-700 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {store.priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Depósito */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
            <Warehouse className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={activeWarehouseId}
              onChange={(e) => setActiveWarehouseId(e.target.value)}
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              {store.warehouses.map((w) => (
                <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. CLIENT SELECTION ROW (Prominent Orange/Amber bordered block matching the user's design) */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <span className="text-sm font-bold text-amber-500 shrink-0">Cliente:</span>

          <button
            type="button"
            onClick={() => setIsClientModalOpen(true)}
            className="flex-1 max-w-lg bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold text-xs px-3.5 py-1.5 rounded-lg border border-amber-500/50 hover:border-amber-400 flex items-center justify-between transition-all shadow-sm group cursor-pointer"
            title="Cambiar o buscar cliente (F1)"
          >
            <div className="flex items-center space-x-2 truncate">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate text-white group-hover:text-amber-300">
                {selectedClient.name}
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                ({selectedClient.taxCondition} • {selectedClient.taxId || 'S/N'})
              </span>
            </div>
            <span className="text-xs text-amber-500 font-mono font-bold pl-2 shrink-0">
              ↕ F1
            </span>
          </button>

          {/* Client Cta Cte balance & button right next to client name */}
          {selectedClient.hasCurrentAccount && (
            <div className="flex items-center space-x-2.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg shrink-0 shadow-md">
              <span className="text-xs text-slate-300 font-medium">Saldo Cta. Cte:</span>
              <span
                className={`text-xs font-mono font-bold ${
                  selectedClient.currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                ${selectedClient.currentBalance.toLocaleString('es-AR')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPreviewClientPortal(selectedClient);
                  setActiveModule('clients_ctacte');
                }}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all flex items-center space-x-1"
                title="Ver Cuenta Corriente del Cliente"
              >
                <span>Ver Cta. Cte.</span>
              </button>
            </div>
          )}

          {/* Traer Remitos Button if client has pending remitos */}
          {pendingClientRemitos.length > 0 && (
            <button
              type="button"
              onClick={() => setIsImportRemitosModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-400/80 text-amber-300 hover:text-amber-100 font-black text-xs shadow-md cursor-pointer animate-pulse transition-all shrink-0"
              title="Importar remitos pendientes del cliente para facturar"
            >
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>Traer Remitos ({pendingClientRemitos.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. POS TABLE & EMBEDDED SEARCH BAR (Blue Table Header matching design) */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden">
        {/* Table Header with Corporate Blue background */}
        <div className="bg-blue-600 text-white !text-white font-extrabold text-xs px-3 py-2.5 grid grid-cols-12 gap-1 tracking-wider uppercase shadow-md shrink-0 [&_*]:!text-white">
          <div className="col-span-5">Código y Descripción</div>
          <div className="col-span-2 text-center">Cantidad</div>
          <div className="col-span-1 text-center">Medida</div>
          <div className="col-span-2 text-right">Precio (ARS)</div>
          <div className="col-span-1 text-right">Bonif %</div>
          <div className="col-span-1 text-right">Total</div>
        </div>

        {/* 4. FAST SEARCH INPUT (Integrated directly below header as requested) */}
        <div className="bg-slate-900 border-b border-slate-700/80 p-1.5 relative shrink-0">
          <div className="flex items-center space-x-1.5 bg-slate-950 rounded-lg border border-blue-500/60 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 px-3 py-1.5">
            <Search className="w-4 h-4 text-blue-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Presione Enter para agregar un producto (Ej: 3*CODIGO, o escriba descripción / escanee código de barras)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowDropdown(false);
                }}
                className="text-slate-400 hover:text-white px-1 text-xs"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(false);
                searchInputRef.current?.focus();
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
              title="Recargar buscador"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1 transition-colors"
              title="Buscar en catálogo general (F2)"
            >
              <Search className="w-3 h-3" />
              <span>F2</span>
            </button>
          </div>

          {/* Autocomplete dropdown overlay */}
          {showDropdown && searchMatches.length > 0 && (
            <div className="absolute left-1.5 right-1.5 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-800">
              {searchMatches.map((p, idx) => {
                const isSelected = idx === selectedProductIndex;
                const price = getProductUnitPrice(p);
                const stock = p.stockByWarehouse[activeWarehouseId] || 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p, 1)}
                    onMouseEnter={() => setSelectedProductIndex(idx)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isSelected ? 'bg-blue-900/40 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-mono text-amber-400 font-bold">{p.code}</span>
                      <span className="font-semibold text-white truncate">{p.name}</span>
                      {p.brandName && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">
                          {p.brandName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 shrink-0 font-mono">
                      <span className="text-slate-400 text-[11px]">Stock: {stock}</span>
                      <span className="font-bold text-amber-400">${price.toLocaleString('es-AR')}</span>
                      <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-sans font-bold">
                        Enter ↵
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. TABLE BODY (Items list or empty state) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
              <Package className="w-16 h-16 text-slate-500 mb-3 stroke-[1.2]" />
              <p className="text-sm font-semibold text-slate-200">Busque y agregue productos a la venta</p>
              <p className="text-xs text-slate-400 mt-1">
                Escriba en el buscador superior o use <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-600 font-mono text-[10px]">F2</kbd>
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/80">
              {cart.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="px-3 py-2.5 grid grid-cols-12 gap-1 items-center text-xs hover:bg-slate-800 transition-colors group bg-slate-900/90"
                >
                  {/* Codigo y Descripcion en un solo renglón */}
                  <div className="col-span-5 flex items-center space-x-2 truncate">
                    <span className="font-mono font-bold text-amber-300 shrink-0">{item.productCode}</span>
                    <span className="font-semibold text-white truncate text-sm">{item.productName}</span>
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-2 flex items-center justify-center">
                    <QuantityInput
                      quantity={item.quantity}
                      onChange={(newQty) => handleUpdateItemQuantity(idx, newQty)}
                    />
                  </div>

                  {/* Uni. Medida */}
                  <div className="col-span-1 text-center text-slate-300 text-[11px] font-medium">
                    {item.unit}
                  </div>

                  {/* Precio Unitario */}
                  <div className="col-span-2 text-right font-mono font-bold text-slate-100">
                    ${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>

                  {/* Bonif % */}
                  <div className="col-span-1 flex justify-end">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent || 0}
                      onChange={(e) => handleUpdateItemDiscount(idx, parseFloat(e.target.value) || 0)}
                      className="w-12 text-center bg-slate-950 text-emerald-300 font-bold rounded border border-slate-600 py-1 text-xs focus:border-blue-400 focus:outline-none"
                      placeholder="%"
                    />
                  </div>

                  {/* Total & Delete Button */}
                  <div className="col-span-1 text-right font-mono font-black text-amber-300 flex items-center justify-end space-x-1">
                    <span className="truncate">${item.subtotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors shrink-0"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. FOOTER (Matching user screenshot: Green badge, Checkboxes, Subtotal, Bonif %, Total, F8 Cobrar, Cancelar) */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 space-y-2.5 shrink-0">
          {/* Sub-bar with count badge & checkboxes */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {/* Product and Row Count Badge (Green border pill like in screenshot) */}
              <div className="px-3 py-1 rounded-full border border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold text-[11px]">
                Productos = {totalQuantityUnits} | Filas = {cart.length} (Max=300)
              </div>

              {/* Output checkboxes */}
              <div className="flex items-center space-x-4 text-[11px] text-slate-300">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printOnSave}
                    onChange={(e) => setPrintOnSave(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-orange-500 focus:ring-0"
                  />
                  <span>Imprimir al Guardar?</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailOnSave}
                    onChange={(e) => setSendEmailOnSave(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-orange-500 focus:ring-0"
                  />
                  <span>Envía e-mail?</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWhatsappOnSave}
                    onChange={(e) => setSendWhatsappOnSave(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-orange-500 focus:ring-0"
                  />
                  <span>Envía WhatsApp?</span>
                </label>
              </div>
            </div>

            {/* SubTotal and Bonif/Rec input */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-medium">SubTotal:</span>
                <span className="font-mono font-bold text-white">
                  ${rawSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 text-[11px]">% Bonif/Rec.:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={globalDiscountPercent || ''}
                  onChange={(e) => setGlobalDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  placeholder="0"
                  className="w-16 bg-slate-950 text-emerald-400 font-bold text-center px-2 py-0.5 rounded border border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Bar (Total | F8 Cobrar | Cancelar) */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Big Total Display */}
            <div className="flex items-baseline space-x-3">
              <span className="text-sm font-black text-slate-400 uppercase tracking-wider">Total:</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight font-mono">
                ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Transform to Remito / Quote button */}
              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) {
                    setIsTransformModalOpen(true);
                  } else {
                    showToast('Agregue productos antes de transformar a remito o presupuesto', 'warning');
                  }
                }}
                disabled={cart.length === 0}
                className="px-4 py-2.5 rounded-xl bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 hover:text-white font-bold text-xs tracking-wide shadow flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer transition-all active:scale-95 border border-cyan-600/60"
                title="Transformar la venta actual a Remito de Entrega o Presupuesto (F6)"
              >
                <Layers className="w-4 h-4 text-cyan-300" />
                <span>Transformar a Remito / Presupuesto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) {
                    setIsCheckoutModalOpen(true);
                  } else {
                    showToast('Agregue productos a la venta', 'warning');
                  }
                }}
                disabled={cart.length === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-sm tracking-wide shadow-lg flex items-center space-x-2 disabled:opacity-50 cursor-pointer transition-all active:scale-95 border border-emerald-600"
              >
                <Banknote className="w-4 h-4" />
                <span>$ F8 Cobrar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0 && confirm('¿Desea cancelar la venta actual y vaciar el carrito?')) {
                    setCart([]);
                    setGlobalDiscountPercent(0);
                    setImportedRemitoIds([]);
                    showToast('Venta cancelada', 'info');
                  }
                }}
                disabled={cart.length === 0}
                className="px-5 py-2.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-sm tracking-wide shadow flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer transition-all active:scale-95 border border-rose-600"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint Ribbon */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5">
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-white font-bold font-mono">F1</kbd> Cliente</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-white font-bold font-mono">F2</kbd> Catálogo</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-white font-bold font-mono">F4</kbd> Lista Precio</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-cyan-400 font-bold font-mono">F6</kbd> Remito/Presupuesto</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-white font-bold font-mono">F7</kbd> Bonif/Recargo</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-emerald-400 font-bold font-mono">F8</kbd> Cobrar</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-white font-bold font-mono">F9</kbd> Nueva Venta</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-white font-bold font-mono">Esc</kbd> Cancelar</span>
          </div>
        </div>
      </div>

      {/* 7. MODALS */}
      {/* Client Selector (F1) */}
      <ClientSelectorModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clients={store.clients}
        selectedClientId={selectedClientId}
        onSelectClient={handleSelectClient}
      />

      {/* Product Search (F2) */}
      <ProductSearchModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        products={store.products}
        warehouseId={activeWarehouseId}
        priceListId={selectedPriceListId}
        onAddProduct={handleAddToCart}
      />

      {/* Import Remitos Modal */}
      <ImportRemitosModal
        isOpen={isImportRemitosModalOpen}
        onClose={() => setIsImportRemitosModalOpen(false)}
        client={selectedClient}
        pendingRemitos={pendingClientRemitos}
        onImportRemitos={handleImportRemitos}
      />

      {/* Transform to Document Modal (Remito / Quote) */}
      <TransformToDocumentModal
        isOpen={isTransformModalOpen}
        onClose={() => setIsTransformModalOpen(false)}
        client={selectedClient}
        cart={cart}
        warehouses={store.warehouses}
        activeWarehouseId={activeWarehouseId}
        onTransformToRemito={handleTransformToRemito}
        onTransformToQuote={handleTransformToQuote}
      />

      {/* Checkout / Multi-payment (F8) */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        total={grandTotal}
        selectedDocType={selectedDocType}
        selectedClient={selectedClient}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onConfirmSale={handleFinalizeSale}
        isProcessing={isProcessing}
        initialPrintTicket={printOnSave}
        initialSendEmail={sendEmailOnSave}
        initialSendWhatsapp={sendWhatsappOnSave}
      />
    </div>
  );
};
