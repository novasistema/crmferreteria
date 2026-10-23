import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  FileText,
  Calculator,
  RefreshCw,
  Percent,
  Check,
  Building,
  Package,
  Layers,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Product, Supplier, Warehouse, Purchase, PurchaseItem, PaymentMethod } from '../../types';
import { ExtractedInvoiceData } from '../../lib/geminiInvoiceService';

interface NewPurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onSavePurchase: (purchase: Purchase) => void;
  onOpenAIImport?: () => void;
  preloadedData?: ExtractedInvoiceData | null;
}

export const NewPurchaseInvoiceModal: React.FC<NewPurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  products,
  suppliers,
  warehouses,
  onSavePurchase,
  onOpenAIImport,
  preloadedData,
}) => {
  // Main form states
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [invoiceType, setInvoiceType] = useState<
    'Factura A' | 'Factura B' | 'Factura C' | 'Factura M' | 'Remito' | 'Nota de Crédito' | 'Nota de Débito'
  >('Factura A');
  const [pointOfSale, setPointOfSale] = useState<string>('00001');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('00016770');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('1');
  const [autoUpdateStock, setAutoUpdateStock] = useState<boolean>(true);
  const [autoUpdateCosts, setAutoUpdateCosts] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'current_account'>('current_account');

  // Items list
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Item input form row
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemSearchTerm, setItemSearchTerm] = useState<string>('');
  const [customProductCode, setCustomProductCode] = useState<string>('');
  const [customProductName, setCustomProductName] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemVatRate, setItemVatRate] = useState<number>(21);
  const [itemDiscount1, setItemDiscount1] = useState<number>(0);
  const [itemDiscount2, setItemDiscount2] = useState<number>(0);
  const [itemDiscount3, setItemDiscount3] = useState<number>(0);
  const [itemProfitMargin, setItemProfitMargin] = useState<number>(35);

  // Editing item modal state
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editItemQty, setEditItemQty] = useState<number>(1);
  const [editItemPrice, setEditItemPrice] = useState<number>(0);
  const [editItemD1, setEditItemD1] = useState<number>(0);
  const [editItemD2, setEditItemD2] = useState<number>(0);
  const [editItemD3, setEditItemD3] = useState<number>(0);
  const [editItemVat, setEditItemVat] = useState<number>(21);
  const [editItemMargin, setEditItemMargin] = useState<number>(35);

  // Unit conversion modal / tool
  const [showUnitConverter, setShowUnitConverter] = useState<boolean>(false);
  const [packQuantity, setPackQuantity] = useState<number>(12);
  const [packPrice, setPackPrice] = useState<number>(0);

  // Taxes & Perceptions
  const [internalTax, setInternalTax] = useState<number>(0);
  const [otherTaxes, setOtherTaxes] = useState<number>(0);
  const [perceptionIIBB, setPerceptionIIBB] = useState<number>(0);
  const [perceptionIVA, setPerceptionIVA] = useState<number>(0);

  // Discounts
  const [generalDiscountPercent, setGeneralDiscountPercent] = useState<number>(0);
  // CRITICAL: "EL DESCUENTO EXTRA QUE DICE ABAJO, ESE DESCUENTO NO FIGURA Y NO REPERCUTE EN EL IVA, ES UN DESCUENTO EXTRA QUE ME HACE EL PROVEDOR, DESCUENTA PERO NO AFECTA AL IVA"
  const [extraDiscountPercent, setExtraDiscountPercent] = useState<number>(0);

  const [notes, setNotes] = useState<string>('');

  // Toast feedback
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // State for Catalog Browser Modal
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update inline item field
  const handleUpdateItemField = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    const it = { ...newItems[index], [field]: value };
    const qty = Number(it.quantity) || 1;
    const cost = Number(it.unitCost) || 0;
    const d1 = Number(it.discount1) || 0;
    const d2 = Number(it.discount2) || 0;
    const d3 = Number(it.discount3) || 0;
    const netUnit = cost * (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
    it.subtotal = Number((netUnit * qty).toFixed(2));
    newItems[index] = it;
    setItems(newItems);
  };

  const handleAdjustItemQty = (index: number, delta: number) => {
    const newItems = [...items];
    const it = newItems[index];
    const newQty = Math.max(1, (Number(it.quantity) || 1) + delta);
    handleUpdateItemField(index, 'quantity', newQty);
  };

  // Preload data if passed from AI extraction
  useEffect(() => {
    if (preloadedData && isOpen) {
      // Find matching supplier or default
      const foundSupplier = suppliers.find(
        (s) =>
          s.cuit.replace(/\D/g, '') === preloadedData.supplierTaxId.replace(/\D/g, '') ||
          s.name.toLowerCase().includes(preloadedData.supplierName.toLowerCase())
      );

      if (foundSupplier) {
        setSelectedSupplierId(foundSupplier.id);
      } else if (suppliers.length > 0) {
        setSelectedSupplierId(suppliers[0].id);
      }

      setInvoiceType(preloadedData.invoiceType);
      setPointOfSale(preloadedData.pointOfSale);
      setInvoiceNumber(preloadedData.invoiceNumber);
      if (preloadedData.date) setInvoiceDate(preloadedData.date);
      if (preloadedData.dueDate) setDueDate(preloadedData.dueDate);

      // Map items
      const mappedItems: PurchaseItem[] = preloadedData.items.map((it) => {
        const matchingProd = products.find(
          (p) => p.code === it.productCode || p.name.toLowerCase() === it.productName.toLowerCase()
        );

        return {
          productId: matchingProd ? matchingProd.id : `prod-temp-${Date.now()}-${Math.random()}`,
          productCode: it.productCode,
          productName: it.productName,
          quantity: it.quantity,
          unitCost: it.unitCost,
          vatRate: it.vatRate,
          discount1: it.discount1 || 0,
          discount2: it.discount2 || 0,
          discount3: it.discount3 || 0,
          subtotal: it.subtotal,
          profitMargin: it.profitMargin || (matchingProd?.marginPercent || 35),
          updateCost: true,
        };
      });

      setItems(mappedItems);
      setInternalTax(preloadedData.internalTax || 0);
      setOtherTaxes(preloadedData.otherTaxes || 0);
      setPerceptionIIBB(preloadedData.perceptionIIBB || 0);
      setPerceptionIVA(preloadedData.perceptionIVA || 0);
      setGeneralDiscountPercent(preloadedData.generalDiscountPercent || 0);
      setExtraDiscountPercent(preloadedData.extraDiscountPercent || 0);
      setNotes(preloadedData.notes || '');
    } else if (isOpen && items.length === 0) {
      // Default to initial state
      if (suppliers.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(suppliers[0].id);
      }
    }
  }, [preloadedData, isOpen, suppliers, products]);

  const currentSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  // Search products for autocomplete row (by name, code, barcode, supplierCode)
  const filteredProducts = useMemo(() => {
    if (!itemSearchTerm.trim()) return [];
    const term = itemSearchTerm.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          (p.barcode && p.barcode.toLowerCase().includes(term)) ||
          (p.supplierCode && p.supplierCode.toLowerCase().includes(term))
      )
      .slice(0, 12);
  }, [products, itemSearchTerm]);

  const handleSelectProduct = (p: Product, customQty?: number) => {
    const qty = customQty !== undefined ? customQty : (Number(itemQuantity) > 0 ? Number(itemQuantity) : 1);
    const cost = Number(p.costPrice) || 0;
    const vat = Number(p.vatRate) || 21;
    const margin = Number(p.marginPercent) || 35;

    // Check if item already exists in the invoice items table
    const existingIdx = items.findIndex(
      (i) => i.productId === p.id || (p.code && i.productCode && i.productCode.toLowerCase() === p.code.toLowerCase())
    );

    if (existingIdx >= 0) {
      const newItems = [...items];
      const existingItem = newItems[existingIdx];
      const newQty = existingItem.quantity + qty;
      const d1 = existingItem.discount1 || 0;
      const d2 = existingItem.discount2 || 0;
      const d3 = existingItem.discount3 || 0;
      const netUnit = existingItem.unitCost * (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
      
      newItems[existingIdx] = {
        ...existingItem,
        quantity: newQty,
        subtotal: Number((netUnit * newQty).toFixed(2)),
      };
      setItems(newItems);
      setFeedbackToast(`Se incrementó cantidad de "${p.name}" a ${newQty}`);
    } else {
      const netUnit = cost;
      const subtotal = Number((netUnit * qty).toFixed(2));
      const newItem: PurchaseItem = {
        productId: p.id,
        productCode: p.code || 'S/C',
        productName: p.name,
        quantity: qty,
        unitCost: cost,
        vatRate: vat,
        discount1: 0,
        discount2: 0,
        discount3: 0,
        subtotal,
        profitMargin: margin,
        updateCost: autoUpdateCosts,
      };
      setItems([...items, newItem]);
      setFeedbackToast(`"${p.name}" cargado a la factura ($${cost.toFixed(2)})`);
    }

    setTimeout(() => setFeedbackToast(null), 3000);

    // Reset item inputs
    setSelectedProductId('');
    setCustomProductCode('');
    setCustomProductName('');
    setItemSearchTerm('');
    setItemQuantity(1);
    setItemUnitPrice(0);
    setItemDiscount1(0);
    setItemDiscount2(0);
    setItemDiscount3(0);
  };

  const handleAddItem = () => {
    const name = (customProductName || itemSearchTerm).trim();
    if (!name) return;

    // Check if there is an exact matching product in catalog
    const exactMatch = products.find(
      (p) =>
        p.code.toLowerCase() === name.toLowerCase() ||
        p.name.toLowerCase() === name.toLowerCase() ||
        (p.barcode && p.barcode.toLowerCase() === name.toLowerCase())
    );

    if (exactMatch && !selectedProductId) {
      handleSelectProduct(exactMatch, Number(itemQuantity) || 1);
      return;
    }

    const qty = Number(itemQuantity) || 1;
    const cost = Number(itemUnitPrice) || 0;
    const d1 = Number(itemDiscount1) || 0;
    const d2 = Number(itemDiscount2) || 0;
    const d3 = Number(itemDiscount3) || 0;
    const vat = Number(itemVatRate) || 0;

    const netUnit = cost * (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
    const subtotal = Number((netUnit * qty).toFixed(2));

    const newItem: PurchaseItem = {
      productId: selectedProductId || `prod-custom-${Date.now()}`,
      productCode: customProductCode || 'S/C',
      productName: name,
      quantity: qty,
      unitCost: cost,
      vatRate: vat,
      discount1: d1,
      discount2: d2,
      discount3: d3,
      subtotal,
      profitMargin: Number(itemProfitMargin) || 35,
      updateCost: autoUpdateCosts,
    };

    setItems([...items, newItem]);
    setFeedbackToast(`"${name}" agregado a la factura`);
    setTimeout(() => setFeedbackToast(null), 3000);

    // Reset item inputs
    setSelectedProductId('');
    setCustomProductCode('');
    setCustomProductName('');
    setItemSearchTerm('');
    setItemQuantity(1);
    setItemUnitPrice(0);
    setItemDiscount1(0);
    setItemDiscount2(0);
    setItemDiscount3(0);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleToggleCostUpdate = (index: number) => {
    const newItems = [...items];
    const item = newItems[index];
    item.updateCost = !item.updateCost;
    setItems(newItems);

    const catalogProd = products.find((p) => p.id === item.productId || p.code === item.productCode);
    const prevCost = catalogProd?.costPrice || 0;
    const netUnitCost = item.unitCost * (1 - (item.discount1 || 0) / 100) * (1 - (item.discount2 || 0) / 100) * (1 - (item.discount3 || 0) / 100);
    const diff = prevCost > 0 ? ((netUnitCost - prevCost) / prevCost) * 100 : 0;

    const diffText = prevCost > 0 
      ? ` (Variación: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs catálogo)` 
      : ' (Nuevo costo registrado)';

    setFeedbackToast(
      item.updateCost
        ? `Costo activado para ${item.productName}: $${netUnitCost.toFixed(2)}${diffText}`
        : `Actualización de costo desactivada para ${item.productName}`
    );
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleOpenEditItem = (index: number) => {
    const it = items[index];
    setEditingItemIdx(index);
    setEditItemQty(it.quantity);
    setEditItemPrice(it.unitCost);
    setEditItemD1(it.discount1 || 0);
    setEditItemD2(it.discount2 || 0);
    setEditItemD3(it.discount3 || 0);
    setEditItemVat(it.vatRate);
    setEditItemMargin(it.profitMargin || 35);
  };

  const handleSaveEditItem = () => {
    if (editingItemIdx === null) return;
    const newItems = [...items];
    const it = newItems[editingItemIdx];

    const qty = Number(editItemQty) || 1;
    const cost = Number(editItemPrice) || 0;
    const d1 = Number(editItemD1) || 0;
    const d2 = Number(editItemD2) || 0;
    const d3 = Number(editItemD3) || 0;
    const vat = Number(editItemVat) || 0;

    const netUnit = cost * (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
    const subtotal = Number((netUnit * qty).toFixed(2));

    newItems[editingItemIdx] = {
      ...it,
      quantity: qty,
      unitCost: cost,
      discount1: d1,
      discount2: d2,
      discount3: d3,
      vatRate: vat,
      profitMargin: Number(editItemMargin) || 35,
      subtotal,
    };

    setItems(newItems);
    setEditingItemIdx(null);
  };

  const handleApplyUnitConversion = () => {
    if (packQuantity > 0 && packPrice > 0) {
      const unitCost = Number((packPrice / packQuantity).toFixed(2));
      setItemUnitPrice(unitCost);
      setShowUnitConverter(false);
    }
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    // 1. Net Subtotal from line items
    const rawSubtotal = items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

    // 2. General Discount (Fiscal) -> Reduces base imponible for VAT
    const generalDiscountAmount = (rawSubtotal * (Number(generalDiscountPercent) || 0)) / 100;
    const subtotalAfterGenDto = Math.max(0, rawSubtotal - generalDiscountAmount);

    // 3. VAT calculated on the net lines
    let totalVat = 0;
    items.forEach((it) => {
      const lineNet = (Number(it.subtotal) || 0) * (1 - (Number(generalDiscountPercent) || 0) / 100);
      const lineVat = (lineNet * (Number(it.vatRate) || 0)) / 100;
      totalVat += lineVat;
    });

    // 4. Perceptions and taxes
    const impInterno = Number(internalTax) || 0;
    const otrosImp = Number(otherTaxes) || 0;
    const percIIBB = Number(perceptionIIBB) || 0;
    const percIVA = Number(perceptionIVA) || 0;

    // 5. Total Fiscal Invoice = Base Gravada + IVA + Impuestos / Percepciones
    const totalFiscalInvoice = subtotalAfterGenDto + totalVat + impInterno + otrosImp + percIIBB + percIVA;

    // 6. CRITICAL RULE FOR EXTRA DISCOUNT:
    // "EL DESCUENTO EXTRA QUE DICE ABAJO, ESE DESCUENTO NO FIGURA Y NO REPERCUTE EN EL IVA, ES UN DESCUENTO EXTRA QUE ME HACE EL PROVEDOR, DESCUENTA PERO NO AFECTA AL IVA"
    const extraDiscountAmt = (subtotalAfterGenDto * (Number(extraDiscountPercent) || 0)) / 100;
    const finalTotalToPay = Math.max(0, totalFiscalInvoice - extraDiscountAmt);

    return {
      subtotal: rawSubtotal,
      subtotalAfterGenDto,
      generalDiscountAmount,
      vatAmount: totalVat,
      extraDiscountAmount: extraDiscountAmt,
      totalFiscalInvoice,
      finalTotalToPay,
    };
  }, [
    items,
    generalDiscountPercent,
    extraDiscountPercent,
    internalTax,
    otherTaxes,
    perceptionIIBB,
    perceptionIVA,
  ]);

  const handleSave = () => {
    if (!selectedSupplierId) {
      alert('Por favor selecciona un proveedor.');
      return;
    }
    if (items.length === 0) {
      alert('Por favor ingresa al menos un artículo en la factura.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const wh = warehouses.find((w) => w.id === selectedWarehouseId);
    const pos = pointOfSale.padStart(5, '0');
    const num = invoiceNumber.padStart(8, '0');
    const fullNum = `${pos}-${num}`;

    const purchase: Purchase = {
      id: `pur-${Date.now()}`,
      code: `COM-${fullNum}`,
      date: invoiceDate,
      dueDate,
      supplierId: selectedSupplierId,
      supplierName: supplier?.name || 'PROVEEDOR',
      supplierTaxId: supplier?.cuit || '30-00000000-0',
      supplierTaxCondition: supplier?.taxCondition || 'Responsable Inscripto',
      invoiceType,
      pointOfSale: pos,
      invoiceNumber: num,
      fullInvoiceNumber: fullNum,
      warehouseId: selectedWarehouseId,
      warehouseName: wh?.name || 'Casa Central',
      items,
      subtotal: calculatedTotals.subtotal,
      vatAmount: calculatedTotals.vatAmount,
      internalTax: Number(internalTax) || 0,
      otherTaxes: Number(otherTaxes) || 0,
      perceptionIIBB: Number(perceptionIIBB) || 0,
      perceptionIVA: Number(perceptionIVA) || 0,
      generalDiscountPercent: Number(generalDiscountPercent) || 0,
      generalDiscountAmount: calculatedTotals.generalDiscountAmount,
      extraDiscountPercent: Number(extraDiscountPercent) || 0,
      extraDiscountAmount: calculatedTotals.extraDiscountAmount,
      total: calculatedTotals.finalTotalToPay,
      paymentMethod,
      paymentStatus: paymentMethod === 'current_account' ? 'pending' : 'paid',
      paidAmount: paymentMethod === 'current_account' ? 0 : calculatedTotals.finalTotalToPay,
      balanceDue: paymentMethod === 'current_account' ? calculatedTotals.finalTotalToPay : 0,
      autoUpdateStock,
      autoUpdateCosts,
      notes,
      registeredByUserId: 'user-1',
      registeredByUserName: 'Carlos Mendoza',
      createdAt: new Date().toISOString(),
    };

    onSavePurchase(purchase);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (Screenshot 1 matching) */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Nueva Factura de Compra
              </h3>
              <p className="text-xs text-slate-500">
                Registre una factura de proveedor y actualice inventario y costos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Saldo de Cuenta Corriente del Proveedor (Screenshot 1 top right) */}
            {currentSupplier && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-600 font-medium">Saldo de Cuenta:</span>
                <span className={`text-xs font-mono font-black ${
                  (currentSupplier.currentBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  ${(currentSupplier.currentBalance || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-slate-400 text-xs">↗</span>
              </div>
            )}

            {onOpenAIImport && (
              <button
                type="button"
                onClick={onOpenAIImport}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Importar con IA</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{feedbackToast}</span>
            </div>
            <button onClick={() => setFeedbackToast(null)} className="text-emerald-200 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Top Form Row: Proveedor, Tipo, Numeración, Fechas, Depósito */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              
              {/* Proveedor */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Proveedor *
                </label>
                <div className="relative">
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.cuit})
                      </option>
                    ))}
                  </select>
                </div>
                {currentSupplier && (
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700">CUIT: {currentSupplier.cuit}</span>
                    <span>•</span>
                    <span>{currentSupplier.taxCondition}</span>
                  </div>
                )}
              </div>

              {/* Tipo de Comprobante */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo
                </label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as any)}
                  className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Factura A">Factura A</option>
                  <option value="Factura B">Factura B</option>
                  <option value="Factura C">Factura C</option>
                  <option value="Factura M">Factura M</option>
                  <option value="Remito">Remito</option>
                  <option value="Nota de Crédito">Nota de Crédito</option>
                  <option value="Nota de Débito">Nota de Débito</option>
                </select>
              </div>

              {/* Numeración: Punto de Venta -- Número */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Numeración *
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={5}
                    value={pointOfSale}
                    onChange={(e) => setPointOfSale(e.target.value)}
                    placeholder="00001"
                    className="w-20 h-9 px-2 text-center font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-slate-400 font-bold">--</span>
                  <input
                    type="text"
                    maxLength={8}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="00011122"
                    className="flex-1 h-9 px-2 text-center font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Fecha Factura */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha Factura
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Sub-row: Depósito, Vencimiento, Forma de Pago, Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-200/80 items-center">
              
              {/* Depósito */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Depósito Destino
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Forma de Pago */}
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Forma de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="current_account">Cuenta Corriente (a Pagar)</option>
                  <option value="cash">Efectivo de Caja</option>
                  <option value="bank_transfer">Transferencia Bancaria</option>
                  <option value="check">Cheque Propio / Cartera</option>
                </select>
              </div>

              {/* Vencimiento */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Checkboxes: Auto stock & Auto Cost */}
              <div className="md:col-span-4 flex items-center justify-end gap-4 pt-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={autoUpdateStock}
                    onChange={(e) => setAutoUpdateStock(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Actualizar stock automáticamente</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={autoUpdateCosts}
                    onChange={(e) => setAutoUpdateCosts(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Actualizar costos de productos</span>
                </label>
              </div>

            </div>
          </div>

          {/* Section: AGREGAR PRODUCTOS (Directly modeled after Screenshot 1) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Agregar Productos
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ver Catálogo Completo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('Nombre / Descripción del nuevo producto:');
                    if (name) {
                      const code = prompt('Código del producto:') || `PROD-${Date.now().toString().slice(-4)}`;
                      const cost = Number(prompt('Precio Costo ($):') || '0');
                      setCustomProductCode(code);
                      setCustomProductName(name);
                      setItemUnitPrice(cost);
                      setSelectedProductId(`prod-new-${Date.now()}`);
                    }
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nuevo Producto (F2)</span>
                </button>
              </div>
            </div>

            {/* Input Row for Products */}
            <div className="p-3 bg-white border-b border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                
                {/* Search / Product Name Autocomplete */}
                <div className="md:col-span-4 relative" ref={searchContainerRef}>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Buscar por nombre, código o código de barras...
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={itemSearchTerm || customProductName}
                      onChange={(e) => {
                        setItemSearchTerm(e.target.value);
                        setCustomProductName(e.target.value);
                        setIsSearchDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (itemSearchTerm || filteredProducts.length > 0) {
                          setIsSearchDropdownOpen(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredProducts.length > 0) {
                            handleSelectProduct(filteredProducts[0]);
                            setIsSearchDropdownOpen(false);
                          } else {
                            handleAddItem();
                            setIsSearchDropdownOpen(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsSearchDropdownOpen(false);
                        }
                      }}
                      placeholder="Escribí nombre, código o escaneá..."
                      className="w-full h-8 pl-8 pr-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isSearchDropdownOpen && filteredProducts.length > 0 && itemSearchTerm && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                        <span>Resultados de búsqueda</span>
                        <span>Clic para cargar</span>
                      </div>
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            handleSelectProduct(p);
                            setIsSearchDropdownOpen(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 rounded text-[11px]">{p.code}</span>
                              <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              {p.barcode && <span>Barras: {p.barcode}</span>}
                              <span>Stock actual: {p.stock ?? 0}</span>
                              {p.supplierCode && <span>Cód. Prov: {p.supplierCode}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-600 block">
                              ${p.costPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400">Costo Catálogo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conversion Button */}
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowUnitConverter(!showUnitConverter)}
                    className="w-full h-8 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Calcular precio unitario por caja o bulto"
                  >
                    <Calculator className="w-3.5 h-3.5 text-slate-500" />
                    <span>Conversión Bulto</span>
                  </button>
                </div>

                {/* Precio Unitario */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Precio Unit. ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemUnitPrice || ''}
                    onChange={(e) => setItemUnitPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full h-8 px-2 text-right font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Cantidad */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Cant.
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full h-8 px-1.5 text-center font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* IVA % */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    IVA %
                  </label>
                  <select
                    value={itemVatRate}
                    onChange={(e) => setItemVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 px-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={21}>21%</option>
                    <option value={10.5}>10.5%</option>
                    <option value={0}>0%</option>
                    <option value={27}>27%</option>
                  </select>
                </div>

                {/* Dto.1 % */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Dto.1%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={itemDiscount1 || ''}
                    onChange={(e) => setItemDiscount1(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full h-8 px-1 text-center font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Add Button */}
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                    title="Cargar a la factura"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Unit Converter Popover */}
              {showUnitConverter && (
                <div className="mt-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-900">Conversor de Bulto/Caja:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-blue-700">Cant. unidades por caja:</span>
                    <input
                      type="number"
                      value={packQuantity}
                      onChange={(e) => setPackQuantity(parseFloat(e.target.value) || 1)}
                      className="w-16 h-7 px-1.5 text-center font-bold bg-white border border-blue-300 rounded-md text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-blue-700">Precio de la caja ($):</span>
                    <input
                      type="number"
                      value={packPrice || ''}
                      onChange={(e) => setPackPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-24 h-7 px-2 font-bold bg-white border border-blue-300 rounded-md text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUnitConversion}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Calcular Unitario (${packQuantity > 0 ? (packPrice / packQuantity).toFixed(2) : 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUnitConverter(false)}
                    className="text-blue-500 hover:text-blue-700 ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Table of Line Items (Exact columns from Screenshot 1!) */}
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2 w-20">Código</th>
                    <th className="py-2 px-2.5">Producto</th>
                    <th className="py-2 px-2 text-center w-28">Cant.</th>
                    <th className="py-2 px-2.5 text-right w-28">Precio Costo</th>
                    <th className="py-2 px-1 text-center w-12">Dto.1%</th>
                    <th className="py-2 px-1 text-center w-12">Dto.2%</th>
                    <th className="py-2 px-1 text-center w-12">Dto.3%</th>
                    <th className="py-2 px-1 text-center w-12">IVA</th>
                    <th className="py-2 px-2.5 text-right w-24">Subtotal</th>
                    <th className="py-2 px-2 text-center w-24">Ganancia</th>
                    <th className="py-2 px-2 text-center w-28">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        No hay artículos agregados. Escribí en el buscador de arriba o abrí el catálogo para cargar productos a la factura.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const catalogProd = products.find((p) => p.id === item.productId || p.code === item.productCode);
                      const prevCost = catalogProd?.costPrice || 0;
                      const netUnitCost = item.unitCost * (1 - (item.discount1 || 0) / 100) * (1 - (item.discount2 || 0) / 100) * (1 - (item.discount3 || 0) / 100);
                      const costDiffPercent = prevCost > 0 ? ((netUnitCost - prevCost) / prevCost) * 100 : 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2 px-2 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-2 font-mono font-bold text-slate-700">{item.productCode}</td>
                          <td className="py-2 px-2.5 font-medium text-slate-900">{item.productName}</td>
                          
                          {/* Interactive Quantity */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustItemQty(idx, -1)}
                                className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemField(idx, 'quantity', Math.max(1, parseFloat(e.target.value) || 1))}
                                className="w-12 h-6 text-center font-bold bg-white border border-slate-300 rounded text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleAdjustItemQty(idx, 1)}
                                className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Editable Unit Cost */}
                          <td className="py-2 px-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-400 text-[10px]">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitCost}
                                onChange={(e) => handleUpdateItemField(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                                className="w-20 h-6 text-right font-mono font-bold bg-white border border-slate-300 rounded text-xs px-1"
                              />
                            </div>
                          </td>

                          <td className="py-2 px-1 text-center text-slate-600">{item.discount1 || 0}%</td>
                          <td className="py-2 px-1 text-center text-slate-600">{item.discount2 || 0}%</td>
                          <td className="py-2 px-1 text-center text-slate-600">{item.discount3 || 0}%</td>
                          <td className="py-2 px-1 text-center font-semibold text-slate-700">{item.vatRate}%</td>
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-blue-700">
                            ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          
                          {/* Ganancia & Variación % (Screenshot 1 matching) */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-bold text-slate-700 text-[11px]">{item.profitMargin || 35}%</span>
                              {prevCost > 0 ? (
                                <div className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                  costDiffPercent > 0.05
                                    ? 'text-rose-600 font-black'
                                    : costDiffPercent < -0.05
                                    ? 'text-emerald-600 font-black'
                                    : 'text-slate-400'
                                }`}>
                                  <span>{costDiffPercent > 0 ? `+${costDiffPercent.toFixed(1)}%` : `${costDiffPercent.toFixed(1)}%`}</span>
                                  <span>{costDiffPercent > 0.05 ? '↗' : costDiffPercent < -0.05 ? '↘' : '='}</span>
                                </div>
                              ) : (
                                <span className="text-[9px] text-blue-600 font-bold">Nuevo</span>
                              )}
                            </div>
                          </td>

                          {/* Acciones: Botón Actualización de Costo + Editar + Eliminar (Screenshot 1 matching) */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Botón [ 🔄 Costo ] */}
                              <button
                                type="button"
                                onClick={() => handleToggleCostUpdate(idx)}
                                className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  item.updateCost
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-500 hover:bg-emerald-100 shadow-2xs'
                                    : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                                }`}
                                title={
                                  item.updateCost
                                    ? `Actualizará el costo de ${item.productName} a $${netUnitCost.toFixed(2)} (${costDiffPercent >= 0 ? '+' : ''}${costDiffPercent.toFixed(1)}%) al guardar la compra`
                                    : 'Clic para activar actualización de costo de este producto en el catálogo'
                                }
                              >
                                <RefreshCw className={`w-3 h-3 ${item.updateCost ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Costo</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditItem(idx)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Editar línea"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Quitar artículo"
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

          {/* Section: IMPUESTOS / PERCEPCIONES (Screenshot 1 matching) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <h5 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2">
              IMPUESTOS / PERCEPCIONES
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Impuesto Interno
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={internalTax || ''}
                  onChange={(e) => setInternalTax(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full h-8 px-2 text-right font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Otros Impuestos
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={otherTaxes || ''}
                  onChange={(e) => setOtherTaxes(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full h-8 px-2 text-right font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Percepción IIBB
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={perceptionIIBB || ''}
                  onChange={(e) => setPerceptionIIBB(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full h-8 px-2 text-right font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Percepción IVA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={perceptionIVA || ''}
                  onChange={(e) => setPerceptionIVA(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full h-8 px-2 text-right font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: TOTALES Y DESCUENTOS (Screenshot 1 matching bottom bar) */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              
              {/* Subtotal */}
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subtotal Neto</span>
                <span className="text-base font-mono font-bold text-slate-200">
                  ${calculatedTotals.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* IVA */}
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">IVA Liquidado</span>
                <span className="text-base font-mono font-bold text-slate-200">
                  ${calculatedTotals.vatAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Dto. % General Fiscal */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-300 font-medium">Dto. %</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={generalDiscountPercent || ''}
                  onChange={(e) => setGeneralDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-12 h-7 px-1 text-center font-bold bg-slate-900 border border-slate-600 rounded text-white text-xs"
                />
              </div>

              {/* Desc. Extra % (CRITICAL: DOES NOT AFFECT VAT CALCULATION!) */}
              <div className="flex items-center gap-1.5 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-600/40">
                <div>
                  <div className="flex items-center gap-1 text-amber-300 font-semibold">
                    <span>Desc. Extra %</span>
                    <span
                      title="Descuento extra comercial del proveedor: No repercute en la base imponible ni en el IVA fiscal."
                      className="cursor-help text-amber-400"
                    >
                      <HelpCircle className="w-3 h-3" />
                    </span>
                  </div>
                  <span className="text-[9px] text-amber-400/80 block">No afecta IVA</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={extraDiscountPercent || ''}
                  onChange={(e) => setExtraDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-12 h-7 px-1 text-center font-bold bg-slate-900 border border-amber-500 rounded text-amber-300 text-xs"
                />
              </div>

            </div>

            {/* Total Final */}
            <div className="text-right pl-4 border-l border-slate-700/80">
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
                Total Comprobante
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400">
                ${calculatedTotals.finalTotalToPay.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Factura de Compra</span>
          </button>
        </div>

      </div>

      {/* Line Item Edit Modal */}
      {editingItemIdx !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150 text-slate-800 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Editar Artículo</h4>
                <p className="text-slate-500 font-medium">{items[editingItemIdx]?.productName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItemIdx(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Cantidad</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={editItemQty}
                  onChange={(e) => setEditItemQty(parseFloat(e.target.value) || 1)}
                  className="w-full h-8 px-2 text-center font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Precio Unitario ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editItemPrice}
                  onChange={(e) => setEditItemPrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 text-right font-mono font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Dto.1 %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={editItemD1}
                  onChange={(e) => setEditItemD1(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 text-center font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Dto.2 %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={editItemD2}
                  onChange={(e) => setEditItemD2(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 text-center font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Dto.3 %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={editItemD3}
                  onChange={(e) => setEditItemD3(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 text-center font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Tasa IVA %</label>
                <select
                  value={editItemVat}
                  onChange={(e) => setEditItemVat(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 font-semibold border border-slate-300 rounded-lg"
                >
                  <option value={21}>21%</option>
                  <option value={10.5}>10.5%</option>
                  <option value={0}>0%</option>
                  <option value={27}>27%</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Margen de Ganancia %</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={editItemMargin}
                  onChange={(e) => setEditItemMargin(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 font-bold border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingItemIdx(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditItem}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
              >
                Aplicar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Browser Modal */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150 text-slate-800 text-xs">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Catálogo de Productos</h4>
                  <p className="text-slate-500 text-[11px]">Selecciona productos para cargarlos inmediatamente a la factura de compra</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar por código, nombre, categoría o código de barras..."
                  className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Products List Table */}
            <div className="overflow-y-auto flex-1 p-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Nombre</th>
                    <th className="py-2 px-2 text-center">Stock</th>
                    <th className="py-2 px-3 text-right">Costo Catálogo</th>
                    <th className="py-2 px-3 text-right">Precio Venta</th>
                    <th className="py-2 px-3 text-center w-24">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter((p) => {
                      if (!catalogSearch) return true;
                      const q = catalogSearch.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        p.code.toLowerCase().includes(q) ||
                        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                        (p.supplierCode && p.supplierCode.toLowerCase().includes(q)) ||
                        (p.category && p.category.toLowerCase().includes(q))
                      );
                    })
                    .map((p) => {
                      const alreadyInInvoice = items.some((it) => it.productId === p.id || it.productCode === p.code);
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{p.code}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            <div>{p.name}</div>
                            {p.category && <span className="text-[10px] text-slate-400">{p.category}</span>}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700">{p.stock ?? 0}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                            ${(p.costPrice || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                            ${(p.salePrice || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectProduct(p);
                              }}
                              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer ${
                                alreadyInInvoice
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{alreadyInInvoice ? '+1 más' : 'Cargar'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Artículos cargados en la factura: <strong className="text-slate-800">{items.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
              >
                Listo / Volver a Factura
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

