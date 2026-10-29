import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  RotateCw, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  FileText, 
  Truck, 
  User, 
  AlertCircle, 
  Calendar, 
  CreditCard, 
  Layers, 
  Bell, 
  Send, 
  MessageSquare, 
  Printer, 
  CheckCircle2,
  Package,
  Building,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ShoppingBag
} from 'lucide-react';
import { 
  Product, 
  Customer, 
  Cashbox, 
  CompanyConfig, 
  PosDocumentType, 
  PriceListType, 
  SalesOrder, 
  Quote, 
  DeliveryOrder, 
  DeliveryOrderItem,
  QuoteItem,
  SalesOrderItem,
  InvoiceType,
  Transport
} from '../types';
import { generateQuotePDF, generateRemitoPDF } from '../utils/quoteAndDeliveryPdfUtils';
import { SalesCheckoutFlowModal, CheckoutResult } from './SalesCheckoutFlowModal';

interface SalesPointOfSaleTerminalProps {
  products: Product[];
  customers: Customer[];
  cashboxes: Cashbox[];
  transports: Transport[];
  config: CompanyConfig | null;
  initialDocType?: PosDocumentType;
  initialCustomer?: Customer | null;
  preloadedItems?: {
    product: Product;
    quantity: number;
    unitPrice?: number;
    discount?: number;
  }[];
  onSaleCompleted?: (saleOrder: SalesOrder, cashboxId?: string, paymentMethod?: string) => Promise<void>;
  onQuoteCreated?: (quote: Quote) => Promise<void>;
  onRemitoCreated?: (remito: DeliveryOrder) => Promise<void>;
  onOpenCustomerManager?: () => void;
  onClearPreload?: () => void;
}

interface CartItem {
  id: string; // unique row id
  product: Product;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  batchNumber?: string;
  partidaNumber?: string;
}

export const SalesPointOfSaleTerminal: React.FC<SalesPointOfSaleTerminalProps> = ({
  products,
  customers,
  cashboxes,
  transports,
  config,
  initialDocType = 'ingreso_simple',
  initialCustomer = null,
  preloadedItems,
  onSaleCompleted,
  onQuoteCreated,
  onRemitoCreated,
  onOpenCustomerManager,
  onClearPreload
}) => {
  // 1. Top Bar State
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [docType, setDocType] = useState<PosDocumentType>(initialDocType);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'cuenta_corriente' | 'cheque' | 'mercado_pago' | 'tarjeta'>('efectivo');
  const [selectedCashboxId, setSelectedCashboxId] = useState<string>(() => {
    const defaultBox = cashboxes.find(c => c.isDefault) || cashboxes[0];
    return defaultBox?.id || '';
  });
  const [priceList, setPriceList] = useState<PriceListType>('minorista'); // 'minorista' (Efectivo/Mostrador), 'mayorista', 'distribuidor'

  // 2. Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomer?.id || 'occasional');
  const [showCustomerSearchModal, setShowCustomerSearchModal] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientTaxId, setQuickClientTaxId] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');

  // 3. Remito Specific State
  const [selectedTransportName, setSelectedTransportName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPlateOrDni, setDriverPlateOrDni] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverDni, setReceiverDni] = useState('');

  // 4. Quote Specific State
  const [quoteValidityDays, setQuoteValidityDays] = useState(15);
  const [quotePaymentCondition, setQuotePaymentCondition] = useState('Efectivo / Contado contra entrega');

  // 5. Cart / Product Rows State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productSearchInput, setProductSearchInput] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [globalDiscountPct, setGlobalDiscountPct] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [printOnSave, setPrintOnSave] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsapp, setSendWhatsapp] = useState(true);

  // 6. UI Modals
  const [showMpModal, setShowMpModal] = useState(false);
  const [showProductCatalogModal, setShowProductCatalogModal] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<{ title: string; message: string; docId?: string; type: string } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update initial customer if changed from outside
  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomerId(initialCustomer.id);
      setPriceList(initialCustomer.priceList || 'minorista');
    }
  }, [initialCustomer]);

  // Handle preloaded items (e.g. from converting a Quote or Route Sheet)
  useEffect(() => {
    if (preloadedItems && preloadedItems.length > 0) {
      const converted: CartItem[] = preloadedItems.map((item, idx) => ({
        id: `row-${Date.now()}-${idx}`,
        product: item.product,
        quantity: item.quantity,
        unit: item.product.presentation || 'Balde 20L',
        unitPrice: item.unitPrice ?? getProductPrice(item.product, priceList),
        discount: item.discount ?? 0,
        batchNumber: `LOT-2026-0${Math.floor(Math.random() * 20 + 35)}`,
        partidaNumber: `PAR-2610-0${Math.floor(Math.random() * 20 + 35)}`
      }));
      setCartItems(converted);
      if (onClearPreload) onClearPreload();
    }
  }, [preloadedItems]);

  // Determine current customer object
  const currentCustomer: Customer | null = selectedCustomerId === 'occasional' 
    ? null 
    : customers.find(c => c.id === selectedCustomerId) || null;

  // Sync price list when selecting a registered customer
  const handleSelectCustomer = (cust: Customer | 'occasional') => {
    if (cust === 'occasional') {
      setSelectedCustomerId('occasional');
      setPriceList('minorista'); // Mostrador efectivo
      setReceiverName('');
    } else {
      setSelectedCustomerId(cust.id);
      setPriceList(cust.priceList || 'mayorista');
      setReceiverName(cust.businessName);
      if (cust.transportName) {
        setSelectedTransportName(cust.transportName);
      }
      // Re-evaluate item prices according to the new price list if user agrees
      setCartItems(prev => prev.map(item => ({
        ...item,
        unitPrice: getProductPrice(item.product, cust.priceList || 'mayorista')
      })));
    }
    setShowCustomerSearchModal(false);
  };

  // Helper: get price based on list
  function getProductPrice(prod: Product, list: PriceListType): number {
    switch (list) {
      case 'distribuidor':
        return prod.priceDistributor || prod.priceWholesale || 0;
      case 'mayorista':
        return prod.priceWholesale || 0;
      case 'minorista':
      default:
        return prod.priceRetail || prod.priceWholesale || 0;
    }
  }

  // Handle price list change manually
  const handlePriceListChange = (newList: PriceListType) => {
    setPriceList(newList);
    setCartItems(prev => prev.map(item => ({
      ...item,
      unitPrice: getProductPrice(item.product, newList)
    })));
  };

  // Filter products for fast search
  const filteredProducts = products.filter(p => {
    if (!productSearchInput.trim()) return false;
    const q = productSearchInput.toLowerCase().trim();
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.color && p.color.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  // Add product to cart
  const handleAddProductToCart = (prod: Product) => {
    const existingIndex = cartItems.findIndex(it => it.product.id === prod.id);
    if (existingIndex >= 0) {
      // Increment quantity
      setCartItems(prev => prev.map((it, idx) => idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      const price = getProductPrice(prod, priceList);
      const newItem: CartItem = {
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        product: prod,
        quantity: 1,
        unit: prod.presentation || 'Unidad',
        unitPrice: price,
        discount: 0,
        batchNumber: `LOT-2026-0${Math.floor(Math.random() * 20 + 35)}`,
        partidaNumber: `PAR-2610-0${Math.floor(Math.random() * 20 + 35)}`
      };
      setCartItems(prev => [newItem, ...prev]);
    }
    setProductSearchInput('');
    setIsSearchDropdownOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Keyboard shortcut listener for F8 and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        handleExecutePrimaryAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, docType, paymentMethod, selectedCashboxId, currentCustomer, globalDiscountPct, selectedTransportName, driverName]);

  // Computations
  const subTotalRaw = cartItems.reduce((acc, it) => {
    const lineDiscount = it.discount > 0 ? (1 - it.discount / 100) : 1;
    return acc + (it.unitPrice * it.quantity * lineDiscount);
  }, 0);

  const globalDiscountAmount = globalDiscountPct > 0 ? (subTotalRaw * (globalDiscountPct / 100)) : 0;
  const subTotalAfterDiscount = Math.max(0, subTotalRaw - globalDiscountAmount);

  // ARCA Tax calculation: Factura A and Factura B include 21% IVA
  const isFiscalArca = docType === 'factura_a' || docType === 'factura_b';
  const taxAmount = isFiscalArca ? Math.round(subTotalAfterDiscount * 0.21) : 0;
  const grandTotal = docType === 'remito' ? 0 : (subTotalAfterDiscount + taxAmount);

  const totalProductsCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalRowsCount = cartItems.length;

  // Clear / Cancel current order
  const handleClearCart = () => {
    if (cartItems.length > 0) {
      if (!confirm('¿Desea cancelar y limpiar todos los productos de la venta actual?')) return;
    }
    setCartItems([]);
    setGlobalDiscountPct(0);
    setOrderNotes('');
    setProductSearchInput('');
  };

  // Execute primary action: Cobrar (Sale) / Guardar Presupuesto (Quote) / Emitir Remito (Delivery)
  const handleExecutePrimaryAction = async () => {
    if (cartItems.length === 0) {
      alert('Debe agregar al menos un producto a la lista antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (docType === 'presupuesto') {
        // --- 1. CREAR PRESUPUESTO COMERCIAL ---
        const quoteNumber = `PRES-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(4, '0')}`;
        const validUntil = new Date(Date.now() + quoteValidityDays * 86400000).toISOString().split('T')[0];

        const quoteItems: QuoteItem[] = cartItems.map(it => ({
          productId: it.product.id,
          productName: `${it.product.name} (${it.product.presentation})`,
          code: it.product.code,
          presentation: it.product.presentation,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount,
          subtotal: Math.round(it.unitPrice * it.quantity * (1 - it.discount / 100))
        }));

        const newQuote: Quote = {
          id: `quote-${Date.now()}`,
          quoteNumber,
          date: docDate,
          validUntil,
          customerId: currentCustomer ? currentCustomer.id : 'occasional',
          customerName: currentCustomer ? currentCustomer.businessName : (quickClientName || 'Cliente Ocasional Mostrador'),
          customerTaxId: currentCustomer ? currentCustomer.taxId : (quickClientTaxId || '00-00000000-0'),
          customerPhone: currentCustomer ? currentCustomer.phone : quickClientPhone,
          customerEmail: currentCustomer ? currentCustomer.email : undefined,
          customerAddress: currentCustomer ? `${currentCustomer.address}, ${currentCustomer.city}` : undefined,
          priceList,
          paymentCondition: quotePaymentCondition,
          items: quoteItems,
          subtotal: subTotalRaw,
          discountPercentage: globalDiscountPct,
          discountAmount: globalDiscountAmount,
          taxAmount,
          total: subTotalAfterDiscount + taxAmount,
          status: 'borrador',
          notes: orderNotes.trim() || undefined,
          createdBy: 'Terminal Mostrador',
          createdAt: new Date().toISOString()
        };

        if (onQuoteCreated) {
          await onQuoteCreated(newQuote);
        }

        // Auto download PDF
        generateQuotePDF(newQuote, config);

        setSuccessBanner({
          title: 'Presupuesto Generado con Éxito',
          message: `Se emitió el presupuesto ${quoteNumber} con validez hasta ${validUntil}. Se descargó el PDF oficial.`,
          docId: newQuote.id,
          type: 'presupuesto'
        });

        // Reset
        setCartItems([]);
        setOrderNotes('');

      } else if (docType === 'remito') {
        // --- 2. EMITIR REMITO DE SALIDA (DESPACHO FÍSICO) ---
        const deliveryNumber = `REM-0001-${String(Math.floor(Math.random() * 89999 + 10000)).padStart(8, '0')}`;
        
        const remitoItems: DeliveryOrderItem[] = cartItems.map(it => ({
          productId: it.product.id,
          productName: `${it.product.name} (${it.product.presentation})`,
          code: it.product.code,
          presentation: it.product.presentation,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          subtotal: Math.round(it.unitPrice * it.quantity),
          batchNumber: it.batchNumber || 'LOT-2026-042',
          partidaNumber: it.partidaNumber || 'PAR-2610-042'
        }));

        const newRemito: DeliveryOrder = {
          id: `rem-${Date.now()}`,
          deliveryNumber,
          customerId: currentCustomer ? currentCustomer.id : 'occasional',
          customerName: currentCustomer ? currentCustomer.businessName : (quickClientName || 'Cliente Ocasional / Retiro en Planta'),
          customerTaxId: currentCustomer ? currentCustomer.taxId : quickClientTaxId,
          customerAddress: currentCustomer ? `${currentCustomer.address}, ${currentCustomer.city}` : 'Retiro por mostrador fábrica',
          customerPhone: currentCustomer ? currentCustomer.phone : quickClientPhone,
          date: docDate,
          items: remitoItems,
          transportName: selectedTransportName.trim() || 'Logística Propia Fábrica',
          driverName: driverName.trim() || 'Depósito Central',
          driverDniOrPlate: driverPlateOrDni.trim() || undefined,
          receiverName: receiverName.trim() || (currentCustomer ? currentCustomer.businessName : 'Receptor en Destino'),
          receiverDni: receiverDni.trim() || undefined,
          notes: orderNotes.trim() || undefined,
          totalAmount: subTotalAfterDiscount,
          createdAt: new Date().toISOString()
        };

        if (onRemitoCreated) {
          await onRemitoCreated(newRemito);
        }

        // Auto download Remito PDF
        generateRemitoPDF(newRemito, config);

        setSuccessBanner({
          title: 'Remito de Salida Emitido',
          message: `Se emitió el remito ${deliveryNumber} con ${totalProductsCount} bultos despachados y stock dado de baja.`,
          docId: newRemito.id,
          type: 'remito'
        });

        // Reset
        setCartItems([]);
        setOrderNotes('');

      } else {
        // --- 3. COBRAR VENTA DIRECTA: FLUJO INTERACTIVO EN 2 PASOS (Tipo de Comprobante -> Método de Pago) ---
        setIsCheckoutModalOpen(true);
      }
    } catch (err) {
      console.error('Error executing POS action:', err);
      alert('Ocurrió un error al procesar el documento. Por favor revise los campos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback cuando se confirma el flujo de cobro en 2 pasos (Tipo de Comprobante + Método de Pago)
  const handleConfirmCheckoutFlow = async (result: CheckoutResult) => {
    setIsSubmitting(true);
    try {
      const orderNumber = `VTA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 89999 + 10000)).padStart(5, '0')}`;
      
      const isArca = result.billingType === 'arca';
      const docLetter = result.docType === 'factura_a' ? 'A' : result.docType === 'factura_b' ? 'B' : result.docType === 'factura_c' ? 'C' : 'X';
      const invoiceNumber = isArca 
        ? `FAC-${docLetter}-0004-${String(Math.floor(Math.random() * 89999999 + 10000000)).padStart(8, '0')}`
        : `TKT-X-0001-${String(Math.floor(Math.random() * 89999999 + 10000000)).padStart(8, '0')}`;
      
      const cae = isArca ? String(Math.floor(Math.random() * 89999999999999 + 10000000000000)) : undefined;
      const caeVto = isArca ? new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] : undefined;

      const saleItems: SalesOrderItem[] = cartItems.map(it => ({
        productId: it.product.id,
        productName: `${it.product.name} (${it.product.presentation})`,
        code: it.product.code,
        presentation: it.product.presentation,
        quantity: it.quantity,
        deliveredQuantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
        subtotal: Math.round(it.unitPrice * it.quantity * (1 - it.discount / 100)),
        batchNumber: it.batchNumber,
        partidaNumber: it.partidaNumber
      }));

      const isPendingPayment = result.paymentMethod === 'cuenta_corriente' || result.paymentMethod === 'no_pago';

      const newSaleOrder: SalesOrder = {
        id: `sale-${Date.now()}`,
        orderNumber,
        customerId: currentCustomer ? currentCustomer.id : 'occasional',
        customerName: currentCustomer ? currentCustomer.businessName : (quickClientName || 'Cliente Ocasional Mostrador'),
        customerTaxId: currentCustomer ? currentCustomer.taxId : (quickClientTaxId || '00-00000000-0'),
        customerPhone: currentCustomer ? currentCustomer.phone : quickClientPhone,
        customerEmail: currentCustomer ? currentCustomer.email : undefined,
        customerAddress: currentCustomer ? `${currentCustomer.address}, ${currentCustomer.city}` : 'Mostrador Fábrica',
        billingType: result.billingType,
        invoiceType: result.invoiceType,
        invoiceNumber,
        cae,
        caeVto,
        date: new Date().toISOString(),
        status: 'entregado',
        deliveryStatus: 'entrega_total',
        paymentStatus: isPendingPayment ? 'pendiente' : 'pagado',
        paidAmount: isPendingPayment ? 0 : grandTotal,
        items: saleItems,
        subtotal: subTotalRaw,
        taxAmount,
        total: grandTotal,
        notes: orderNotes.trim() || undefined
      };

      if (onSaleCompleted) {
        await onSaleCompleted(newSaleOrder, result.cashboxId || selectedCashboxId, result.paymentMethod);
      }

      setSuccessBanner({
        title: 'Venta Registrada Exitosamente',
        message: `${result.docType === 'ingreso_venta' ? 'Ingreso de Venta' : result.docType.toUpperCase().replace('_', ' ')} ${invoiceNumber} por $${grandTotal.toLocaleString('es-AR')}. Forma de pago: ${result.paymentMethod.toUpperCase().replace('_', ' ')}.`,
        docId: newSaleOrder.id,
        type: 'venta'
      });

      // Reset
      setCartItems([]);
      setOrderNotes('');
      setIsCheckoutModalOpen(false);
    } catch (err) {
      console.error('Error confirming checkout flow:', err);
      alert('Error al registrar la venta. Verifique los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-[calc(100vh-140px)] flex flex-col font-sans select-none pb-20">
      
      {/* SUCCESS BANNER NOTIFICATION */}
      {successBanner && (
        <div className="bg-emerald-600 text-white p-3.5 px-6 flex items-center justify-between shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
            <div>
              <h4 className="font-black text-sm">{successBanner.title}</h4>
              <p className="text-xs text-emerald-100">{successBanner.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setSuccessBanner(null)}
            className="p-1 rounded-lg hover:bg-emerald-700 text-emerald-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* TOP HEADER CONTROLS BAR (Inspired by Screenshot) */}
      <div className="bg-white border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Left segment: Date, Doc Type, Payment method */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
          
          {/* Fecha */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">Fecha:</span>
            <input 
              type="date"
              value={docDate}
              onChange={e => setDocDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 font-mono text-xs bg-slate-50 text-slate-900"
            />
          </div>

          {/* Tipo Doc */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">Tipo Doc:</span>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as PosDocumentType)}
              className={`border rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                docType === 'presupuesto' 
                  ? 'border-blue-600 bg-blue-50 text-blue-800' 
                  : docType === 'remito'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="ingreso_simple">Ingreso Simple (Venta Mostrador)</option>
              <option value="factura_a">Factura A (Oficial ARCA)</option>
              <option value="factura_b">Factura B (Oficial ARCA)</option>
              <option value="remito">Remito (Traslado de Mercadería)</option>
              <option value="presupuesto">Presupuesto (Cotización Comercial)</option>
            </select>
          </div>

          {/* Forma de pago (Active for sales and quotes) */}
          {docType !== 'remito' && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800">Forma pago:</span>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="border border-amber-300 bg-amber-50 text-amber-900 font-bold rounded px-2 py-1 text-xs"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="cuenta_corriente">Cuenta Corriente</option>
                <option value="cheque">Cheque / E-Cheq</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="tarjeta">Tarjeta Débito / Crédito</option>
              </select>
            </div>
          )}

          {/* Special Remito Badge */}
          {docType === 'remito' && (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold">
              🚚 Despacho Físico con Baja de Stock
            </span>
          )}

          {/* Special Presupuesto Badge */}
          {docType === 'presupuesto' && (
            <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-[11px] font-bold">
              📄 Cotización con Validez de Precios
            </span>
          )}
        </div>

        {/* Right segment: Caja & Lista Precio */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Caja Selector */}
          {docType !== 'presupuesto' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Caja:</span>
              <select
                value={selectedCashboxId}
                onChange={e => setSelectedCashboxId(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 bg-white font-medium text-slate-800 text-xs"
              >
                {cashboxes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (${c.currentBalance.toLocaleString('es-AR')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lista Precio Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Lista Precio:</span>
            <select
              value={priceList}
              onChange={e => handlePriceListChange(e.target.value as PriceListType)}
              className="border border-slate-300 rounded px-2 py-1 bg-white font-bold text-slate-800 text-xs uppercase"
            >
              <option value="minorista">EFECTIVO / MOSTRADOR</option>
              <option value="mayorista">LISTA MAYORISTA</option>
              <option value="distribuidor">LISTA DISTRIBUIDOR</option>
            </select>
          </div>
        </div>
      </div>

      {/* CLIENTE BAR & EXTENDED CONFIG (Matches screenshot layout) */}
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Cliente:</span>
          
          {/* Selector de cliente: Botón destacado con diseño especial (fondo naranja claro, borde naranja y nombre del cliente) */}
          <button
            onClick={() => setShowCustomerSearchModal(true)}
            className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100/90 border-2 border-orange-400 text-orange-950 font-black px-3.5 py-1.5 rounded-lg shadow-sm transition-all group"
          >
            <User className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs tracking-tight">
              {currentCustomer ? currentCustomer.businessName : '👤 Cliente Ocasional / Mostrador'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-orange-600" />
          </button>

          {currentCustomer && (
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                CUIT: {currentCustomer.taxId}
              </span>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase">
                {currentCustomer.taxCategory.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                currentCustomer.currentBalance > 0 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {currentCustomer.currentBalance > 0 
                  ? `Deuda: $${currentCustomer.currentBalance.toLocaleString('es-AR')}` 
                  : 'Saldo al día'}
              </span>
              <button 
                onClick={() => handleSelectCustomer('occasional')}
                className="text-slate-400 hover:text-slate-600 ml-1"
                title="Cambiar a Cliente Ocasional"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!currentCustomer && (
            <span className="text-[11px] text-slate-500 italic">
              (Consumidor final en mostrador - CUIT 00-00000000-0)
            </span>
          )}
        </div>

        {/* Dynamic fields for Remito or Presupuesto */}
        {docType === 'remito' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Chofer:</span>
            <input
              type="text"
              placeholder="Nombre chofer"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              className="border border-slate-300 rounded px-2 py-0.5 text-xs w-36 bg-white"
            />
            <span className="text-slate-500 font-semibold">Patente:</span>
            <input
              type="text"
              placeholder="Patente/DNI"
              value={driverPlateOrDni}
              onChange={e => setDriverPlateOrDni(e.target.value)}
              className="border border-slate-300 rounded px-2 py-0.5 text-xs w-28 bg-white uppercase"
            />
          </div>
        )}

        {docType === 'presupuesto' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-bold">Validez:</span>
              <select
                value={quoteValidityDays}
                onChange={e => setQuoteValidityDays(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white font-semibold"
              >
                <option value={7}>7 días</option>
                <option value={15}>15 días</option>
                <option value={30}>30 días</option>
                <option value={60}>60 días</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-bold">Cond. Pago:</span>
              <input
                type="text"
                value={quotePaymentCondition}
                onChange={e => setQuotePaymentCondition(e.target.value)}
                placeholder="Ej: Contado / Cheque 30d"
                className="border border-slate-300 rounded px-2 py-0.5 text-xs w-48 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* CABECERA DE TABLA EN AZUL CORPORATIVO (bg-blue-600) Y TEXTO BLANCO */}
      <div className="bg-blue-600 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider grid grid-cols-12 items-center shadow-xs">
        <div className="col-span-2">Código</div>
        <div className="col-span-4">Descripción</div>
        <div className="col-span-1 text-center">Cantidad</div>
        <div className="col-span-1 text-center">Uni. Medida</div>
        <div className="col-span-2 text-right">Precio (ARS)</div>
        <div className="col-span-1 text-center">Bonif.</div>
        <div className="col-span-1 text-right">Total</div>
      </div>

      {/* QUICK PRODUCT SEARCH / ENTRY BAR */}
      <div className="relative bg-white border-b border-slate-300 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Presione Enter para agregar un producto (busque por código, nombre o color)"
              value={productSearchInput}
              onChange={e => {
                setProductSearchInput(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => setIsSearchDropdownOpen(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredProducts.length > 0) {
                    handleAddProductToCart(filteredProducts[0]);
                  }
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-slate-400 font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setProductSearchInput('');
              setIsSearchDropdownOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refrescar búsqueda"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowProductCatalogModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-2xs"
            title="Explorar catálogo completo de pinturas"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {isSearchDropdownOpen && filteredProducts.length > 0 && (
          <div className="absolute left-4 right-16 top-full z-40 bg-white border border-slate-200 shadow-xl rounded-b-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {filteredProducts.map(p => {
              const price = getProductPrice(p, priceList);
              return (
                <div
                  key={p.id}
                  onClick={() => handleAddProductToCart(p)}
                  className="p-2.5 px-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                      {p.code}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.category} | {p.presentation} | Stock fábrica: <strong>{p.stock} un.</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-slate-900 text-sm">
                      ${price.toLocaleString('es-AR')}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase">
                      Lista {priceList}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PRODUCT LIST TABLE / ROWS (OR EMPTY STATE) */}
      <div className="flex-1 overflow-y-auto bg-white min-h-[320px]">
        {cartItems.length === 0 ? (
          /* Empty state matching the screenshot: Cube icon + text */
          <div className="flex flex-col items-center justify-center h-72 text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
              <Package className="w-10 h-10" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              {docType === 'presupuesto'
                ? 'Busque y agregue productos al presupuesto'
                : docType === 'remito'
                ? 'Busque y agregue productos a la orden de remito'
                : 'Busque y agregue productos a la venta'}
            </p>
            <button
              onClick={() => setShowProductCatalogModal(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 underline"
            >
              <Search className="w-3.5 h-3.5" /> Ver catálogo completo de pinturas
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cartItems.map((item, index) => {
              const lineDiscount = item.discount > 0 ? (1 - item.discount / 100) : 1;
              const lineTotal = Math.round(item.unitPrice * item.quantity * lineDiscount);

              return (
                <div 
                  key={item.id}
                  className={`grid grid-cols-12 items-center px-4 py-2 text-xs transition-colors ${
                    index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                  } hover:bg-blue-50/40`}
                >
                  {/* Código */}
                  <div className="col-span-2 font-mono font-bold text-blue-800">
                    {item.product.code}
                  </div>

                  {/* Descripción */}
                  <div className="col-span-4 pr-2">
                    <span className="font-bold text-slate-800 block truncate">
                      {item.product.name}
                    </span>
                    {docType === 'remito' && (
                      <span className="text-[10px] text-emerald-700 block font-mono">
                        Lote: {item.batchNumber} {item.partidaNumber ? `| Partida: ${item.partidaNumber}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Cantidad con controles + / - */}
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const newQty = Math.max(1, item.quantity - 1);
                        setCartItems(prev => prev.map(it => it.id === item.id ? { ...it, quantity: newQty } : it));
                      }}
                      className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-black flex items-center justify-center text-xs transition-colors"
                      title="Disminuir cantidad"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setCartItems(prev => prev.map(it => it.id === item.id ? { ...it, quantity: val } : it));
                      }}
                      className="w-10 text-center font-bold border border-slate-300 rounded px-0.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCartItems(prev => prev.map(it => it.id === item.id ? { ...it, quantity: it.quantity + 1 } : it));
                      }}
                      className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-black flex items-center justify-center text-xs transition-colors"
                      title="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  {/* Uni. Medida */}
                  <div className="col-span-1 text-center text-slate-600 font-medium">
                    {item.unit}
                  </div>

                  {/* Precio Unitario (ARS) */}
                  <div className="col-span-2 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setCartItems(prev => prev.map(it => it.id === item.id ? { ...it, unitPrice: val } : it));
                      }}
                      className="w-24 text-right font-mono font-bold border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Bonif % */}
                  <div className="col-span-1 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={e => {
                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setCartItems(prev => prev.map(it => it.id === item.id ? { ...it, discount: val } : it));
                      }}
                      placeholder="0"
                      className="w-12 text-center border border-slate-300 rounded px-1 py-1 text-xs font-mono"
                    />
                  </div>

                  {/* Total & Action */}
                  <div className="col-span-1 flex items-center justify-end gap-2 text-right">
                    <span className="font-mono font-black text-slate-900 text-xs">
                      ${lineTotal.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => setCartItems(prev => prev.filter(it => it.id !== item.id))}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                      title="Quitar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BARRA INFERIOR DE RESUMEN Y TOTALES (FONDO OSCURO bg-slate-900) */}
      <div className="bg-slate-900 text-white px-5 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 fixed bottom-0 left-0 right-0 z-30 shadow-2xl">
        
        {/* Left Side: Indicador de productos y filas + Casillas de verificación */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Indicador de estado de productos y filas */}
          <div className="border border-slate-700 bg-slate-800/90 text-slate-200 px-3 py-1.5 rounded-lg font-bold font-mono text-xs shadow-inner">
            Productos = <span className="text-orange-400 font-black">{totalProductsCount}</span> | Filas = <span className="text-orange-400 font-black">{totalRowsCount}</span>
          </div>

          {/* Casillas de verificación */}
          <div className="flex items-center gap-3.5 text-xs text-slate-300 font-medium">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={printOnSave}
                onChange={e => setPrintOnSave(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-orange-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span>Imprimir al Guardar?</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span>Envía e-mail?</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={sendWhatsapp}
                onChange={e => setSendWhatsapp(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span>WhatsApp?</span>
            </label>
          </div>
        </div>

        {/* Right Side: Subtotal, Bonif/Recargo, Total Naranja Gigante y Botones */}
        <div className="flex flex-wrap items-center gap-5 sm:gap-6">
          
          {/* Subtotal */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subtotal</span>
            <span className="font-mono font-bold text-slate-200 text-sm">
              ${subTotalRaw.toLocaleString('es-AR')},00
            </span>
          </div>

          {/* Campo de Bonificación / Recargo */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 font-semibold">% Bonif/Rec.:</span>
            <input
              type="number"
              min="-100"
              max="100"
              value={globalDiscountPct}
              onChange={e => setGlobalDiscountPct(parseInt(e.target.value) || 0)}
              className="w-14 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center font-mono font-bold text-white focus:outline-none focus:border-orange-500"
              placeholder="0"
            />
          </div>

          {/* TOTAL DESTACADO EN COLOR NARANJA BRILLANTE DE GRAN TAMAÑO */}
          <div className="flex items-baseline gap-2 pl-2 border-l border-slate-800">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">
              {docType === 'remito' ? 'Bultos:' : 'Total:'}
            </span>
            <span className="font-mono font-black text-3xl sm:text-4xl text-orange-500 tracking-tight leading-none drop-shadow-sm">
              {docType === 'remito' ? `${totalProductsCount} un.` : `$${grandTotal.toLocaleString('es-AR')},00`}
            </span>
          </div>

          {/* BOTONES DE ACCIÓN RÁPIDA: Verde F8 Cobrar y Rojo Cancelar */}
          <div className="flex items-center gap-2.5">
            {/* Botón verde "F8 Cobrar" */}
            <button
              onClick={handleExecutePrimaryAction}
              disabled={isSubmitting || cartItems.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-6 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Cobrar o registrar venta (Atajo: F8)"
            >
              {docType === 'presupuesto' ? (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'F8 Guardar'}</span>
                </>
              ) : docType === 'remito' ? (
                <>
                  <Truck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Emitiendo...' : 'F8 Remitir'}</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>{isSubmitting ? 'Cobrando...' : 'F8 Cobrar'}</span>
                </>
              )}
            </button>

            {/* Botón rojo "Cancelar" */}
            <button
              onClick={handleClearCart}
              disabled={isSubmitting || cartItems.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              title="Cancelar y limpiar venta"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>

        </div>
      </div>

      {/* MODAL: CUSTOMER SELECTOR & ON-THE-FLY CREATION */}
      {showCustomerSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                Seleccionar o Registrar Cliente
              </h3>
              <button onClick={() => setShowCustomerSearchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Option: Cliente Ocasional Mostrador */}
            <div 
              onClick={() => handleSelectCustomer('occasional')}
              className="p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 hover:bg-amber-100/60 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div>
                <strong className="text-amber-950 text-xs block">👤 Cliente Ocasional / Mostrador Fábrica</strong>
                <span className="text-[11px] text-amber-800">Consumidor final, pago contado efectivo o tarjeta. CUIT 00-00000000-0.</span>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-md">
                Elegir Ocasional
              </span>
            </div>

            {/* Search Input for Registered Customers */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente registrado por Razón Social o CUIT..."
                value={customerSearchQuery}
                onChange={e => setCustomerSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Customers List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {customers
                .filter(c => 
                  c.businessName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                  c.taxId.includes(customerSearchQuery)
                )
                .map(cust => (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className="p-2.5 px-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{cust.businessName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        CUIT: {cust.taxId} | Lista: <span className="uppercase font-semibold">{cust.priceList}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cust.currentBalance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {cust.currentBalance > 0 ? `Deuda $${cust.currentBalance.toLocaleString('es-AR')}` : 'Al día'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Fast Walk-in Client Form (if not creating full account) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block text-[11px] uppercase">
                Datos Rápidos para el Comprobante (Sin crear cuenta corriente):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nombre o Razón Social"
                  value={quickClientName}
                  onChange={e => setQuickClientName(e.target.value)}
                  className="border border-slate-300 rounded p-1.5 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="DNI o CUIT"
                  value={quickClientTaxId}
                  onChange={e => setQuickClientTaxId(e.target.value)}
                  className="border border-slate-300 rounded p-1.5 text-xs bg-white font-mono"
                />
              </div>
              <input
                type="text"
                placeholder="Teléfono / WhatsApp para envío de comprobante"
                value={quickClientPhone}
                onChange={e => setQuickClientPhone(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCustomerSearchModal(false)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULL PRODUCT CATALOG EXPLORER */}
      {showProductCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Catálogo Oficial de Pinturas Colorear
                </h3>
                <p className="text-xs text-slate-500">
                  Seleccione los productos para agregarlos a la venta / presupuesto.
                </p>
              </div>
              <button onClick={() => setShowProductCatalogModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-3">
              {products.map(p => {
                const price = getProductPrice(p, priceList);
                return (
                  <div
                    key={p.id}
                    className="p-3 hover:bg-slate-50 flex items-center justify-between transition-colors text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {p.code}
                        </span>
                        <strong className="text-slate-900">{p.name}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Categoría: {p.category} | Envase: {p.presentation} | Stock: <strong>{p.stock} un.</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono font-black text-sm text-slate-900">
                        ${price.toLocaleString('es-AR')}
                      </div>
                      <button
                        onClick={() => {
                          handleAddProductToCart(p);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowProductCatalogModal(false)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MERCADO PAGO QUICK CHECK */}
      {showMpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-black text-sm">
                  MP
                </div>
                <h3 className="font-black text-slate-900 text-sm">
                  Notificaciones de Cobro Mercado Pago
                </h3>
              </div>
              <button onClick={() => setShowMpModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900 space-y-1">
              <p className="font-bold">QR Estático y Cobro en Mostrador:</p>
              <p className="text-[11px] text-sky-800">
                Los clientes pueden abonar escaneando el código QR de Colorear Pinturas en el mostrador.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase text-[10px]">Últimos pagos acreditados:</span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-800">Transferencia MP #9821038</div>
                  <div className="text-[10px] text-slate-500">Hace 4 minutos • Aprobado</div>
                </div>
                <span className="font-mono font-black text-emerald-700">$54.200,00</span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentMethod('mercado_pago');
                setShowMpModal(false);
              }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs"
            >
              Usar Mercado Pago para esta Venta
            </button>
          </div>
        </div>
      )}

      {/* MODAL: FLUJO DE COBRO EN 2 PASOS (Tipo de Comprobante -> Método de Pago) */}
      <SalesCheckoutFlowModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        totalAmount={grandTotal}
        customer={currentCustomer}
        cashboxes={cashboxes}
        onConfirm={handleConfirmCheckoutFlow}
      />
    </div>
  );
};
