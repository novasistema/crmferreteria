import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  ExternalLink, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Layers, 
  Building, 
  DollarSign, 
  Percent, 
  Download, 
  Edit3, 
  ArrowRightLeft,
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Product, 
  Supplier, 
  PurchaseInvoice, 
  PurchaseInvoiceItem, 
  PurchaseInvoiceType 
} from '../types';
import { ProductFormModal } from './ProductFormModal';

interface PurchaseInvoiceModuleProps {
  products: Product[];
  suppliers: Supplier[];
  purchaseInvoices?: PurchaseInvoice[];
  onSavePurchaseInvoice: (invoice: PurchaseInvoice) => Promise<void>;
  onSaveProduct: (product: Product) => Promise<void>;
  onClose?: () => void;
}

export const PurchaseInvoiceModule: React.FC<PurchaseInvoiceModuleProps> = ({
  products,
  suppliers,
  purchaseInvoices = [],
  onSavePurchaseInvoice,
  onSaveProduct,
  onClose
}) => {
  // Navigation: 'create' (form from image) vs 'history' (list of past invoices)
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Top fields state
  const [supplierSearch, setSupplierSearch] = useState('WILLY');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  const [invoiceType, setInvoiceType] = useState<PurchaseInvoiceType>('Factura X');
  const [posNumber, setPosNumber] = useState('1');
  const [invoiceNumber, setInvoiceNumber] = useState('3');

  const todayStr = new Date().toISOString().split('T')[0];
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState('');

  const [autoUpdateStock, setAutoUpdateStock] = useState(true);
  const [warehouse, setWarehouse] = useState('Depósito Central');
  const [autoUpdateCosts, setAutoUpdateCosts] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cuenta Corriente' | 'Efectivo' | 'Transferencia Bancaria' | 'Cheque' | 'Tarjeta Débito'>('Cuenta Corriente');

  // Line items state
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([
    {
      id: 'item-demo-1',
      productId: 'prod-llave-mesada',
      code: '181215',
      name: 'LLAVE 8 EN 1 BAJO MESADA',
      quantity: 3,
      unitPrice: 4800,
      discount1: 0,
      discount2: 0,
      discount3: 0,
      ivaRate: 21,
      subtotal: 14400,
      profitMarginPercent: 0,
      unitCostCalculated: 4800
    }
  ]);

  // "Agregar Productos" quick inputs
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [quickUnitPrice, setQuickUnitPrice] = useState<number>(0);
  const [quickQuantity, setQuickQuantity] = useState<number>(1);
  const [quickIva, setQuickIva] = useState<number>(21);
  const [quickDto1, setQuickDto1] = useState<number>(0);
  const [quickDto2, setQuickDto2] = useState<number>(0);
  const [quickDto3, setQuickDto3] = useState<number>(0);

  // Unit conversion modal / toggle
  const [showUnitConversion, setShowUnitConversion] = useState(false);
  const [conversionFactor, setConversionFactor] = useState<number>(12); // e.g. 1 Caja = 12 Unidades
  const [boxQuantity, setBoxQuantity] = useState<number>(1);

  // Taxes / Perceptions
  const [internalTax, setInternalTax] = useState<number>(0);
  const [otherTaxes, setOtherTaxes] = useState<number>(0);
  const [iibbPerception, setIibbPerception] = useState<number>(0);
  const [ivaPerception, setIvaPerception] = useState<number>(0);

  // Global discounts
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(0);
  const [extraDiscountPercent, setExtraDiscountPercent] = useState<number>(0);

  // Notes
  const [notes, setNotes] = useState('');

  // UI helpers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // Search filter for history tab
  const [historySearch, setHistorySearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Pre-match supplier from supplierSearch or initial load
  useEffect(() => {
    if (suppliers.length > 0) {
      const match = suppliers.find(s => 
        s.businessName.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        (s.taxId && s.taxId.includes(supplierSearch))
      );
      if (match) {
        setSelectedSupplier(match);
      } else {
        // default fallback if not found
        const first = suppliers[0];
        setSelectedSupplier(first);
        setSupplierSearch(first.businessName);
      }
    } else {
      // Mocked fallback if suppliers list is empty
      setSelectedSupplier({
        id: 'sup-willy',
        businessName: 'WILLY',
        taxId: '30-71234567-9',
        category: 'Herramientas y Sanitarios',
        currentBalance: -398335,
        paymentTerms: 'Cuenta Corriente',
        phone: '11-4567-8901',
        email: 'ventas@willy.com.ar',
        active: true,
        address: 'Av. Industrial 1200',
        city: 'Buenos Aires',
        contactName: 'Guillermo'
      } as Supplier);
    }
  }, [suppliers]);

  // Keyboard shortcut: F2 for new product
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsNewProductModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered suppliers for autocomplete
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(s => 
      s.businessName.toLowerCase().includes(q) ||
      (s.taxId && s.taxId.includes(q))
    );
  }, [suppliers, supplierSearch]);

  // Filtered products for quick add autocomplete
  const filteredProducts = useMemo(() => {
    if (!productQuery.trim()) return [];
    const q = productQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.supplierCode && p.supplierCode.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [products, productQuery]);

  // Handle selecting a product in "Agregar Productos"
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setProductQuery(`${prod.code} - ${prod.name}`);
    setIsProductDropdownOpen(false);
    const cost = prod.costListWithoutIva || prod.unitCost || 0;
    setQuickUnitPrice(cost);
    setQuickIva(prod.ivaRate ?? 21);
    if (prod.supplierDiscounts) {
      setQuickDto1(prod.supplierDiscounts[0] || 0);
      setQuickDto2(prod.supplierDiscounts[1] || 0);
      setQuickDto3(prod.supplierDiscounts[2] || 0);
    }
  };

  // Add Item to Table
  const handleAddItem = () => {
    if (!selectedProduct && !productQuery.trim()) {
      alert('Por favor busque y seleccione un producto antes de agregarlo.');
      return;
    }

    const qty = Number(quickQuantity) || 1;
    const price = Number(quickUnitPrice) || 0;
    const d1 = Number(quickDto1) || 0;
    const d2 = Number(quickDto2) || 0;
    const d3 = Number(quickDto3) || 0;

    // Net unit price after chained discounts
    let netUnit = price;
    if (d1 > 0) netUnit -= (netUnit * d1) / 100;
    if (d2 > 0) netUnit -= (netUnit * d2) / 100;
    if (d3 > 0) netUnit -= (netUnit * d3) / 100;

    const subtotal = netUnit * qty;

    const newItem: PurchaseInvoiceItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: selectedProduct?.id || `prod-custom-${Date.now()}`,
      code: selectedProduct?.code || 'S/C',
      name: selectedProduct?.name || productQuery,
      quantity: qty,
      unitPrice: price,
      discount1: d1,
      discount2: d2,
      discount3: d3,
      ivaRate: Number(quickIva) || 21,
      subtotal: subtotal,
      profitMarginPercent: selectedProduct?.profitMarginPercent || 0,
      unitCostCalculated: netUnit,
      primaryUnit: selectedProduct?.primaryUnit || 'Unidad'
    };

    setItems([...items, newItem]);

    // Reset quick inputs
    setProductQuery('');
    setSelectedProduct(null);
    setQuickUnitPrice(0);
    setQuickQuantity(1);
    setQuickDto1(0);
    setQuickDto2(0);
    setQuickDto3(0);
  };

  // Remove Item from Table
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Update Item in Table
  const handleUpdateItem = (index: number, field: keyof PurchaseInvoiceItem, val: any) => {
    const updated = [...items];
    const it = { ...updated[index], [field]: val };
    
    // Recalculate item subtotal
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    let net = price;
    if (it.discount1 > 0) net -= (net * it.discount1) / 100;
    if (it.discount2 > 0) net -= (net * it.discount2) / 100;
    if (it.discount3 > 0) net -= (net * it.discount3) / 100;
    it.unitCostCalculated = net;
    it.subtotal = net * qty;

    updated[index] = it;
    setItems(updated);
  };

  // Totals calculations
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
  }, [items]);

  const totalCalculated = useMemo(() => {
    let tot = itemsSubtotal;
    if (globalDiscountPercent > 0) {
      tot -= (tot * globalDiscountPercent) / 100;
    }
    if (extraDiscountPercent > 0) {
      tot -= (tot * extraDiscountPercent) / 100;
    }
    // Add taxes and perceptions
    tot += Number(internalTax) || 0;
    tot += Number(otherTaxes) || 0;
    tot += Number(iibbPerception) || 0;
    tot += Number(ivaPerception) || 0;
    return Math.max(0, tot);
  }, [itemsSubtotal, globalDiscountPercent, extraDiscountPercent, internalTax, otherTaxes, iibbPerception, ivaPerception]);

  // Save Purchase Invoice
  const handleSavePurchase = async () => {
    if (!selectedSupplier && !supplierSearch.trim()) {
      alert('Debe indicar un proveedor para la factura de compra.');
      return;
    }
    if (items.length === 0) {
      alert('Debe agregar al menos un producto a la factura de compra.');
      return;
    }

    setIsSubmitting(true);
    try {
      const invoice: PurchaseInvoice = {
        id: `fac-compra-${Date.now()}`,
        invoiceType,
        posNumber: posNumber.padStart(4, '0'),
        invoiceNumber: invoiceNumber.padStart(8, '0'),
        fullNumber: `${posNumber.padStart(4, '0')}-${invoiceNumber.padStart(8, '0')}`,
        supplierId: selectedSupplier?.id || `sup-${Date.now()}`,
        supplierName: selectedSupplier?.businessName || supplierSearch,
        date: invoiceDate,
        dueDate: dueDate || undefined,
        autoUpdateStock,
        warehouseId: warehouse,
        warehouseName: warehouse,
        autoUpdateCosts,
        paymentMethod,
        items,
        subtotal: itemsSubtotal,
        globalDiscountPercent: Number(globalDiscountPercent) || 0,
        extraDiscountPercent: Number(extraDiscountPercent) || 0,
        internalTax: Number(internalTax) || 0,
        otherTaxes: Number(otherTaxes) || 0,
        iibbPerception: Number(iibbPerception) || 0,
        ivaPerception: Number(ivaPerception) || 0,
        total: totalCalculated,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      await onSavePurchaseInvoice(invoice);

      showToast(`¡Factura ${invoice.invoiceType} ${invoice.fullNumber} guardada exitosamente!`);
      
      // Reset form to clean state
      setItems([]);
      setPosNumber('1');
      setInvoiceNumber(String(Number(invoiceNumber) + 1));
      setNotes('');
      setInternalTax(0);
      setOtherTaxes(0);
      setIibbPerception(0);
      setIvaPerception(0);
      setGlobalDiscountPercent(0);
      setExtraDiscountPercent(0);

    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al registrar la factura de compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unit conversion apply
  const handleApplyConversion = () => {
    const totalUnits = (Number(boxQuantity) || 1) * (Number(conversionFactor) || 1);
    setQuickQuantity(totalUnits);
    setShowUnitConversion(false);
    showToast(`Convertido: ${boxQuantity} cajas x ${conversionFactor} = ${totalUnits} unidades.`);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-16">
      
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-right">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR / TABS */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'create' ? 'Nueva Factura de Compra' : 'Historial de Facturas de Compra'}
            </h1>
            <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              Proveedores
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'create' 
              ? 'Registre una factura de proveedor, actualice stock y costos' 
              : 'Consulte y exporte facturas de compra registradas'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'create' ? 'history' : 'create')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{activeTab === 'create' ? `Ver Historial (${purchaseInvoices.length})` : '← Registrar Nueva Factura'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Cerrar módulo"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* TAB 1: NUEVA FACTURA DE COMPRA (Pixel-Perfect from Screenshot) */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in">
            
            {/* Top Right Supplier Balance Tag */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Datos de la Cabecera de Compra
              </div>

              {selectedSupplier && (
                <div className="flex items-center gap-2 self-end sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-medium text-slate-600">Saldo de Cuenta:</span>
                  <span className={`text-xs font-black font-mono ${
                    (selectedSupplier.currentBalance || 0) < 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    ${(selectedSupplier.currentBalance || -398335).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer ml-1" />
                </div>
              )}
            </div>

            {/* FORM ROW 1: Proveedor, Tipo, Numeración */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Proveedor con autocompletar */}
              <div className="md:col-span-6 relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proveedor *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setIsSupplierDropdownOpen(true);
                    }}
                    onFocus={() => setIsSupplierDropdownOpen(true)}
                    placeholder="Buscar proveedor por nombre o CUIT..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {supplierSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierSearch('');
                        setSelectedSupplier(null);
                      }}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {isSupplierDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {filteredSuppliers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        No se encontraron proveedores. Escriba para asignar uno nuevo.
                      </div>
                    ) : (
                      filteredSuppliers.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSupplier(s);
                            setSupplierSearch(s.businessName);
                            setIsSupplierDropdownOpen(false);
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-100 last:border-0 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{s.businessName}</span>
                            <span className="text-[11px] text-slate-400">{s.taxId || 'Sin CUIT'} • {s.category || 'General'}</span>
                          </div>
                          <span className={`font-mono font-bold text-[11px] ${
                            (s.currentBalance || 0) < 0 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            Saldo: ${(s.currentBalance || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Tipo de Documento */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo
                </label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as PurchaseInvoiceType)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Factura X">Factura X</option>
                  <option value="Factura A">Factura A</option>
                  <option value="Factura B">Factura B</option>
                  <option value="Factura C">Factura C</option>
                  <option value="Factura M">Factura M</option>
                  <option value="Remito R">Remito R</option>
                  <option value="Nota de Débito">Nota de Débito</option>
                  <option value="Nota de Crédito">Nota de Crédito</option>
                </select>
              </div>

              {/* Numeración: Punto de Venta -- Número */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numeración *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={posNumber}
                    onChange={(e) => setPosNumber(e.target.value)}
                    placeholder="1"
                    className="w-20 text-center py-2.5 px-2 rounded-xl border border-slate-300 text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-400 font-bold">--</span>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="3"
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* FORM ROW 2: Fechas, Stock checkbox, Depósito, Forma de pago, Costos */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Fecha Factura */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha Factura
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Vencimiento */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-blue-500 text-slate-700"
                />
              </div>

              {/* Depósito / Sucursal de recepción + Checkbox Stock */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoUpdateStock}
                    onChange={(e) => setAutoUpdateStock(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Actualizar stock automáticamente</span>
                </label>

                <label className="block text-[11px] font-bold text-slate-600">
                  Depósito / sucursal de recepción
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Depósito Central">Depósito Central</option>
                  <option value="Depósito Secundario / Planta">Depósito Secundario / Planta</option>
                  <option value="Local Mostrador">Local Mostrador</option>
                </select>
                <p className="text-[10px] text-slate-400 leading-tight">
                  La compra suma stock aquí y en el total general, una sola vez. La cuenta de pago no cambia este destino.
                </p>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoUpdateCosts}
                    onChange={(e) => setAutoUpdateCosts(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Actualizar costos de productos</span>
                </label>
              </div>

              {/* Forma de Pago */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Forma de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Tarjeta Débito">Tarjeta Débito</option>
                </select>
              </div>
            </div>

            {/* SECTION: AGREGAR PRODUCTOS (Exact matching inputs) */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">
                  Agregar Productos
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nuevo Producto (F2)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                {/* Producto input */}
                <div className="md:col-span-4 relative">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Producto
                  </label>
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => {
                      setProductQuery(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    placeholder="Buscar por nombre, código o código de barras..."
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:outline-none focus:border-blue-500"
                  />

                  {/* Autocomplete Dropdown */}
                  {isProductDropdownOpen && filteredProducts.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-xs"
                        >
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3">
                            <span>SKU: <strong className="text-slate-700 font-mono">{p.code}</strong></span>
                            {p.supplierCode && <span>Cód. Prov: {p.supplierCode}</span>}
                            <span>Stock: {p.stock}</span>
                            <span>Costo ref: ${p.unitCost || p.costListWithoutIva || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setShowUnitConversion(!showUnitConversion)}
                      className="text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                      <span>Conversión de unidad</span>
                    </button>
                  </div>
                </div>

                {/* Precio Unit. */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Precio Unit.
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickUnitPrice}
                    onChange={(e) => setQuickUnitPrice(Number(e.target.value) || 0)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-bold font-mono bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Cant. */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Cant.
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quickQuantity}
                    onChange={(e) => setQuickQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full py-2 px-2 text-center rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* IVA % */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    IVA %
                  </label>
                  <input
                    type="number"
                    value={quickIva}
                    onChange={(e) => setQuickIva(Number(e.target.value) || 0)}
                    className="w-full py-2 px-2 text-center rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Dto.1% */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Dto.1%
                  </label>
                  <input
                    type="number"
                    value={quickDto1}
                    onChange={(e) => setQuickDto1(Number(e.target.value) || 0)}
                    className="w-full py-2 px-2 text-center rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Dto.2% */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Dto.2%
                  </label>
                  <input
                    type="number"
                    value={quickDto2}
                    onChange={(e) => setQuickDto2(Number(e.target.value) || 0)}
                    className="w-full py-2 px-2 text-center rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Dto.3% */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Dto.3%
                  </label>
                  <input
                    type="number"
                    value={quickDto3}
                    onChange={(e) => setQuickDto3(Number(e.target.value) || 0)}
                    className="w-full py-2 px-2 text-center rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* + Agregar Button */}
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-2.5 px-3 bg-[#0256b8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* UNIT CONVERSION POPOVER */}
              {showUnitConversion && (
                <div className="p-3 bg-white border border-blue-200 rounded-xl shadow-md text-xs space-y-2 animate-in fade-in">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Conversión de Bultos / Cajas a Unidades</span>
                    <button onClick={() => setShowUnitConversion(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Cantidad de Cajas</label>
                      <input
                        type="number"
                        min={1}
                        value={boxQuantity}
                        onChange={(e) => setBoxQuantity(Number(e.target.value) || 1)}
                        className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <span className="text-slate-400 font-bold pt-4">x</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block">Unidades por Caja</label>
                      <input
                        type="number"
                        min={1}
                        value={conversionFactor}
                        onChange={(e) => setConversionFactor(Number(e.target.value) || 1)}
                        className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleApplyConversion}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                      >
                        Aplicar ({boxQuantity * conversionFactor} un.)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PRODUCTS TABLE (Matches screenshot layout) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="p-3 text-center w-10">#</th>
                      <th className="p-3">Código</th>
                      <th className="p-3 min-w-[200px]">Producto</th>
                      <th className="p-3 text-center w-16">Cant.</th>
                      <th className="p-3 text-right w-24">Precio</th>
                      <th className="p-3 text-center w-16">Dto.1%</th>
                      <th className="p-3 text-center w-16">Dto.2%</th>
                      <th className="p-3 text-center w-16">Dto.3%</th>
                      <th className="p-3 text-center w-14">IVA</th>
                      <th className="p-3 text-right w-28">Subtotal</th>
                      <th className="p-3 text-center w-20">Ganancia</th>
                      <th className="p-3 text-center w-28">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                          <p className="font-bold">No hay productos cargados en esta compra</p>
                          <p className="text-[11px] text-slate-400">Busca y agrega productos desde la barra superior</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{item.code}</td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 font-bold text-slate-900 bg-transparent text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                              className="w-14 text-center p-1.5 rounded-lg border border-slate-300 font-bold bg-white text-xs"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                              className="w-24 text-right p-1.5 rounded-lg border border-slate-300 font-bold font-mono bg-white text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              value={item.discount1}
                              onChange={(e) => handleUpdateItem(idx, 'discount1', Number(e.target.value))}
                              className="w-12 text-center p-1.5 rounded-lg border border-slate-300 text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              value={item.discount2}
                              onChange={(e) => handleUpdateItem(idx, 'discount2', Number(e.target.value))}
                              className="w-12 text-center p-1.5 rounded-lg border border-slate-300 text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              value={item.discount3}
                              onChange={(e) => handleUpdateItem(idx, 'discount3', Number(e.target.value))}
                              className="w-12 text-center p-1.5 rounded-lg border border-slate-300 text-xs"
                            />
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">
                            {item.ivaRate}%
                          </td>
                          <td className="p-3 text-right font-black font-mono text-slate-900">
                            ${(item.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-medium">
                            {item.profitMarginPercent || 0}%
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Costo Badge Button (Green outline in screenshot) */}
                              <button
                                type="button"
                                onClick={() => showToast(`Costo unitario calculado: $${(item.unitCostCalculated || item.unitPrice).toFixed(2)}`)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md border border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-[10px] font-black transition-colors"
                                title="Ver costo unitario calculado"
                              >
                                <ArrowRightLeft className="w-2.5 h-2.5" />
                                <span>Costo</span>
                              </button>

                              {/* Edit Line */}
                              <button
                                type="button"
                                onClick={() => {
                                  const prod = products.find(p => p.id === item.productId || p.code === item.code);
                                  if (prod) {
                                    handleSelectProduct(prod);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                title="Editar línea"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Line (Red Trash) */}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION: IMPUESTOS / PERCEPCIONES */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 space-y-3">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                IMPUESTOS / PERCEPCIONES
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Impuesto Interno
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={internalTax}
                    onChange={(e) => setInternalTax(Number(e.target.value) || 0)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Otros Impuestos
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={otherTaxes}
                    onChange={(e) => setOtherTaxes(Number(e.target.value) || 0)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Percepción IIBB
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={iibbPerception}
                    onChange={(e) => setIibbPerception(Number(e.target.value) || 0)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Percepción IVA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ivaPerception}
                    onChange={(e) => setIvaPerception(Number(e.target.value) || 0)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* TOTALS BAR (Subtotal, Dto %, Desc Extra %, Total) */}
            <div className="flex flex-wrap items-center justify-end gap-6 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Subtotal:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  ${itemsSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-600">Dto. %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={globalDiscountPercent}
                  onChange={(e) => setGlobalDiscountPercent(Number(e.target.value) || 0)}
                  className="w-16 py-1.5 px-2 text-center rounded-lg border border-slate-300 text-xs font-bold bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-600">Desc. Extra %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={extraDiscountPercent}
                  onChange={(e) => setExtraDiscountPercent(Number(e.target.value) || 0)}
                  className="w-16 py-1.5 px-2 text-center rounded-lg border border-slate-300 text-xs font-bold bg-white"
                />
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <span className="text-sm font-black text-slate-900">Total:</span>
                <div className="px-4 py-2 bg-white border border-slate-300 rounded-xl font-mono text-lg font-black text-[#ea580c] shadow-2xs">
                  {totalCalculated.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* NOTAS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Notas
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones de la factura de compra..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* FOOTER BUTTONS: Cancelar & Guardar Compra */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Desea limpiar el formulario de factura de compra?')) {
                    setItems([]);
                    setNotes('');
                  }
                }}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSavePurchase}
                className="px-6 py-2.5 bg-[#0256b8] hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando Compra...' : 'Guardar Compra'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORIAL DE FACTURAS DE COMPRA */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Facturas de Compra Registradas
                </h3>
                <p className="text-xs text-slate-500">
                  Historial de compras ingresadas al sistema
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Buscar por número o proveedor..."
                    className="pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tipo / Número</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3 text-center">Ítems</th>
                    <th className="p-3">Forma Pago</th>
                    <th className="p-3">Depósito</th>
                    <th className="p-3 text-right">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        Aún no hay facturas de compra registradas. Registre una desde la pestaña "Registrar Nueva Factura".
                      </td>
                    </tr>
                  ) : (
                    purchaseInvoices
                      .filter(inv => {
                        const q = historySearch.toLowerCase();
                        return !q || 
                          inv.fullNumber.toLowerCase().includes(q) ||
                          inv.supplierName.toLowerCase().includes(q) ||
                          inv.invoiceType.toLowerCase().includes(q);
                      })
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-slate-600">{inv.date}</td>
                          <td className="p-3 font-bold text-slate-900">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-1.5 font-mono text-[10px]">
                              {inv.invoiceType}
                            </span>
                            {inv.fullNumber}
                          </td>
                          <td className="p-3 font-bold text-slate-800">{inv.supplierName}</td>
                          <td className="p-3 text-center font-bold text-slate-600">{inv.items.length}</td>
                          <td className="p-3 text-slate-600">{inv.paymentMethod}</td>
                          <td className="p-3 text-slate-500 text-[11px]">{inv.warehouseName || 'Central'}</td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            ${inv.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* FULL PRODUCT MODAL (F2 shortcut) */}
      <ProductFormModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSave={async (newProd) => {
          await onSaveProduct(newProd);
          handleSelectProduct(newProd);
          setIsNewProductModalOpen(false);
          showToast(`Producto ${newProd.code} creado y seleccionado.`);
        }}
        suppliers={suppliers}
      />

    </div>
  );
};
