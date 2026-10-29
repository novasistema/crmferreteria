import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  FileText, 
  Truck, 
  CheckCircle, 
  Clock, 
  Send, 
  Mail, 
  MessageSquare, 
  ArrowRight, 
  Printer, 
  Eye, 
  ShieldCheck, 
  Filter,
  DollarSign,
  PackageCheck,
  Building,
  Check,
  X,
  Package,
  Layers,
  AlertTriangle,
  History,
  FileCheck2,
  Calendar,
  User,
  BadgeAlert,
  ChevronDown,
  RotateCw,
  ShoppingBag,
  ExternalLink,
  Search,
  Trash2
} from 'lucide-react';
import { 
  SalesOrder, 
  SalesOrderStatus, 
  BillingType, 
  Customer, 
  Product, 
  Transport, 
  CompanyConfig, 
  SalesOrderItem,
  InvoiceType,
  DeliveryOrder,
  DeliveryOrderItem,
  ProductionOrder,
  Quote,
  QuoteStatus,
  Cashbox,
  PosDocumentType
} from '../types';
import { generateWhatsAppMessage } from '../utils/exportUtils';
import { generateQuotePDF, generateRemitoPDF } from '../utils/quoteAndDeliveryPdfUtils';
import { SalesPointOfSaleTerminal } from './SalesPointOfSaleTerminal';
import { QuotesModule } from './QuotesModule';

interface SalesOrdersModuleProps {
  salesOrders: SalesOrder[];
  customers: Customer[];
  products: Product[];
  productionOrders?: ProductionOrder[];
  transports: Transport[];
  cashboxes?: Cashbox[];
  quotes?: Quote[];
  standaloneRemitos?: DeliveryOrder[];
  config: CompanyConfig | null;
  onCreateOrder: (order: SalesOrder, cashboxId?: string, paymentMethod?: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: SalesOrderStatus, additionalData?: Partial<SalesOrder>) => Promise<void>;
  onDeliverOrderItems: (orderId: string, delivery: DeliveryOrder) => Promise<void>;
  onRecordOrderPayment: (orderId: string, amount: number) => Promise<void>;
  onSaveQuote?: (quote: Quote) => Promise<void>;
  onDeleteQuote?: (quoteId: string) => Promise<void>;
  onUpdateQuoteStatus?: (quoteId: string, status: QuoteStatus) => Promise<void>;
  onSaveStandaloneRemito?: (remito: DeliveryOrder) => Promise<void>;
}

export const SalesOrdersModule: React.FC<SalesOrdersModuleProps> = ({
  salesOrders,
  customers,
  products,
  productionOrders = [],
  transports,
  cashboxes = [],
  quotes = [],
  standaloneRemitos = [],
  config,
  onCreateOrder,
  onUpdateOrderStatus,
  onDeliverOrderItems,
  onRecordOrderPayment,
  onSaveQuote,
  onDeleteQuote,
  onUpdateQuoteStatus,
  onSaveStandaloneRemito
}) => {
  // Main Top-level View Tabs
  const [activeMainTab, setActiveMainTab] = useState<'pos_terminal' | 'presupuestos' | 'remitos' | 'pedidos_anticipados'>('pos_terminal');
  
  // Terminal Preload State
  const [terminalInitialDocType, setTerminalInitialDocType] = useState<PosDocumentType>('ingreso_simple');
  const [terminalPreloadedItems, setTerminalPreloadedItems] = useState<{ product: Product; quantity: number; unitPrice?: number; discount?: number }[] | undefined>(undefined);
  const [terminalInitialCustomer, setTerminalInitialCustomer] = useState<Customer | null>(null);

  // Filters for orders list
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // IN-PAGE / NON-MODAL Advance Sales Order Form state (User Request: "que venta pedidos anticipado no sea emergente")
  const [showInlineNewOrderForm, setShowInlineNewOrderForm] = useState(false);
  const [inlineCustomerId, setInlineCustomerId] = useState(customers[0]?.id || '');
  const [inlineBillingType, setInlineBillingType] = useState<BillingType>('arca');
  const [inlineTransportId, setInlineTransportId] = useState<string>(customers[0]?.transportId || transports[0]?.id || '');
  const [inlineOrderItems, setInlineOrderItems] = useState<{ productId: string; quantity: number; discount: number }[]>([
    { productId: products[0]?.id || '', quantity: 10, discount: 0 }
  ]);
  const [inlineOrderNotes, setInlineOrderNotes] = useState('');

  // Modals for partial delivery & viewing documents
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<SalesOrder | null>(null);
  const [viewDeliveriesOrder, setViewDeliveriesOrder] = useState<SalesOrder | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ 
    order: SalesOrder; 
    type: 'remito' | 'factura' | 'orden_entrega'; 
    delivery?: DeliveryOrder;
  } | null>(null);

  // Partial Delivery Form state
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTransportName, setDeliveryTransportName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPlateOrDni, setDriverPlateOrDni] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverDni, setReceiverDni] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [dispatchItems, setDispatchItems] = useState<{ [productId: string]: number }>({});
  const [dispatchBatches, setDispatchBatches] = useState<{ [productId: string]: { batchNumber: string; partidaNumber: string } }>({});
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  const selectedInlineCustomer = customers.find(c => c.id === inlineCustomerId) || customers[0];

  // Helper: compute order delivery statistics
  const getOrderDeliveryStats = (order: SalesOrder) => {
    const totalOrdered = order.items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    const totalDelivered = order.items.reduce((acc, it) => acc + (it.deliveredQuantity || 0), 0);
    const pending = Math.max(0, totalOrdered - totalDelivered);
    const percentage = totalOrdered > 0 ? Math.min(100, Math.round((totalDelivered / totalOrdered) * 100)) : 0;
    return { totalOrdered, totalDelivered, pending, percentage };
  };

  // Price determination based on customer's price list
  const getProductPriceForCustomer = (product: Product, cust?: Customer) => {
    if (!cust) return product.priceWholesale;
    switch (cust.priceList) {
      case 'distribuidor': return product.priceDistributor || product.priceWholesale;
      case 'minorista': return product.priceRetail || product.priceWholesale;
      case 'mayorista':
      default:
        return product.priceWholesale;
    }
  };

  // Calculate inline order totals
  const calculatedInlineItems: SalesOrderItem[] = inlineOrderItems.map(item => {
    const prod = products.find(p => p.id === item.productId);
    const unitPrice = prod ? getProductPriceForCustomer(prod, selectedInlineCustomer) : 0;
    const subtotal = (unitPrice * item.quantity) * (1 - item.discount / 100);
    return {
      productId: item.productId,
      productName: prod ? `${prod.name} (${prod.presentation})` : 'Pintura',
      code: prod?.code || '',
      presentation: prod?.presentation || '',
      quantity: Number(item.quantity) || 1,
      deliveredQuantity: 0,
      unitPrice,
      discount: Number(item.discount) || 0,
      subtotal
    };
  });

  const inlineSubtotal = calculatedInlineItems.reduce((acc, it) => acc + it.subtotal, 0);
  const inlineTaxAmount = inlineBillingType === 'arca' ? inlineSubtotal * 0.21 : 0;
  const inlineTotal = inlineSubtotal + inlineTaxAmount;

  // Add line item
  const addInlineItemRow = () => {
    if (products.length === 0) return;
    setInlineOrderItems([...inlineOrderItems, { productId: products[0].id, quantity: 5, discount: 0 }]);
  };

  const removeInlineItemRow = (idx: number) => {
    setInlineOrderItems(inlineOrderItems.filter((_, i) => i !== idx));
  };

  // Submit in-page order (Factura Anticipada - NON-MODAL)
  const handleCreateInlineOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInlineCustomer || calculatedInlineItems.length === 0) return;

    const orderNumber = `PED-${new Date().getFullYear()}-${String(salesOrders.length + 85).padStart(3, '0')}`;
    const transport = transports.find(t => t.id === inlineTransportId);

    let invoiceType: InvoiceType = 'FACTURA_A';
    if (inlineBillingType === 'no_arca') {
      invoiceType = 'RECIBO_X_NO_ARCA';
    } else {
      if (selectedInlineCustomer.taxCategory === 'consumidor_final' || selectedInlineCustomer.taxCategory === 'monotributo') {
        invoiceType = 'FACTURA_B';
      }
    }

    const invoiceNumber = inlineBillingType === 'arca' 
      ? `FAC-${invoiceType === 'FACTURA_A' ? 'A' : 'B'}-0004-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(8, '0')}`
      : `REC-X-0001-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(8, '0')}`;
    const cae = inlineBillingType === 'arca' ? String(Math.floor(Math.random() * 89999999999999 + 10000000000000)) : undefined;
    const caeVto = inlineBillingType === 'arca' ? new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0] : undefined;

    const newOrder: SalesOrder = {
      id: `order-${Date.now()}`,
      orderNumber,
      customerId: selectedInlineCustomer.id,
      customerName: selectedInlineCustomer.businessName,
      customerTaxId: selectedInlineCustomer.taxId,
      customerPhone: selectedInlineCustomer.phone,
      customerEmail: selectedInlineCustomer.email,
      customerAddress: `${selectedInlineCustomer.address}, ${selectedInlineCustomer.city}`,
      billingType: inlineBillingType,
      invoiceType,
      invoiceNumber,
      cae,
      caeVto,
      date: new Date().toISOString(),
      status: 'facturado',
      deliveryStatus: 'pendiente_entrega',
      deliveryOrders: [],
      paymentStatus: 'pendiente',
      transportId: inlineTransportId,
      transportName: transport?.name || 'A coordinar con fábrica',
      trackingCode: `TRK-COL-${Math.floor(Math.random() * 89999 + 10000)}`,
      items: calculatedInlineItems,
      subtotal: inlineSubtotal,
      taxAmount: inlineTaxAmount,
      total: inlineTotal,
      paidAmount: 0,
      notes: inlineOrderNotes
    };

    await onCreateOrder(newOrder);
    setShowInlineNewOrderForm(false);
    setInlineOrderNotes('');
  };

  // Open delivery modal for an order
  const handleOpenDeliveryModal = (order: SalesOrder) => {
    setDeliveryModalOrder(order);
    const nextDeliveryNum = `OE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(4, '0')}`;
    setDeliveryNumber(nextDeliveryNum);
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setDeliveryTransportName(order.transportName || 'Retiro en Planta / Propio');
    setDriverName('');
    setDriverPlateOrDni('');
    setReceiverName(order.customerName);
    setReceiverDni('');
    setDeliveryNotes('');

    const initialDispatches: { [productId: string]: number } = {};
    const initialBatches: { [productId: string]: { batchNumber: string; partidaNumber: string } } = {};

    order.items.forEach(it => {
      const delivered = it.deliveredQuantity || 0;
      const pending = Math.max(0, it.quantity - delivered);
      initialDispatches[it.productId] = pending;

      const matchingPO = productionOrders.find(po => 
        (po.productId === it.productId || po.productName.toLowerCase().includes(it.productName.toLowerCase()))
      );

      const defaultBatch = matchingPO?.batchNumber || `LOT-${new Date().getFullYear()}-00${Math.floor(Math.random() * 20 + 35)}`;
      const defaultPartida = matchingPO?.partidaNumber || `PAR-2610-0${Math.floor(Math.random() * 20 + 35)}`;

      initialBatches[it.productId] = {
        batchNumber: defaultBatch,
        partidaNumber: defaultPartida
      };
    });

    setDispatchItems(initialDispatches);
    setDispatchBatches(initialBatches);
  };

  // Fill all remaining pending items
  const handleFillAllPending = () => {
    if (!deliveryModalOrder) return;
    const allPending: { [productId: string]: number } = {};
    deliveryModalOrder.items.forEach(it => {
      const delivered = it.deliveredQuantity || 0;
      allPending[it.productId] = Math.max(0, it.quantity - delivered);
    });
    setDispatchItems(allPending);
  };

  // Confirm partial or full delivery
  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryModalOrder) return;

    const itemsToDeliver: DeliveryOrderItem[] = [];
    let totalQty = 0;

    deliveryModalOrder.items.forEach(it => {
      const qty = Number(dispatchItems[it.productId]) || 0;
      if (qty > 0) {
        itemsToDeliver.push({
          productId: it.productId,
          productName: it.productName,
          code: it.code,
          presentation: it.presentation,
          quantity: qty,
          unit: it.presentation,
          unitPrice: it.unitPrice,
          subtotal: it.unitPrice * qty,
          batchNumber: dispatchBatches[it.productId]?.batchNumber?.trim() || undefined,
          partidaNumber: dispatchBatches[it.productId]?.partidaNumber?.trim() || undefined
        });
        totalQty += qty;
      }
    });

    if (itemsToDeliver.length === 0 || totalQty <= 0) {
      alert('Debes indicar al menos un producto y una cantidad mayor a 0 para generar la Orden de Entrega.');
      return;
    }

    setIsSubmittingDelivery(true);
    try {
      const newDelivery: DeliveryOrder = {
        id: `del-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        deliveryNumber: deliveryNumber.trim() || `OE-${Date.now()}`,
        salesOrderId: deliveryModalOrder.id,
        salesOrderNumber: deliveryModalOrder.orderNumber,
        customerId: deliveryModalOrder.customerId,
        customerName: deliveryModalOrder.customerName,
        customerAddress: deliveryModalOrder.customerAddress,
        customerPhone: deliveryModalOrder.customerPhone,
        date: deliveryDate,
        items: itemsToDeliver,
        transportName: deliveryTransportName,
        driverName: driverName.trim() || 'Depósito Fábrica',
        driverDniOrPlate: driverPlateOrDni.trim() || undefined,
        receiverName: receiverName.trim() || deliveryModalOrder.customerName,
        receiverDni: receiverDni.trim() || undefined,
        notes: deliveryNotes.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      await onDeliverOrderItems(deliveryModalOrder.id, newDelivery);

      // Auto download Remito PDF
      generateRemitoPDF(newDelivery, config);

      setDeliveryModalOrder(null);
    } catch (err) {
      console.error('Error emitting delivery order:', err);
      alert('Error al generar la orden de entrega. Por favor intenta nuevamente.');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  // Consolidated delivery orders across all sales orders AND standalone remitos
  const allConsolidatedDeliveries: { delivery: DeliveryOrder; order?: SalesOrder }[] = [];
  
  // 1. From advance sales orders
  salesOrders.forEach(o => {
    if (o.deliveryOrders && o.deliveryOrders.length > 0) {
      o.deliveryOrders.forEach(del => {
        allConsolidatedDeliveries.push({ delivery: del, order: o });
      });
    }
  });

  // 2. From standalone remitos (created in terminal)
  standaloneRemitos.forEach(del => {
    // Avoid duplicates if already counted in sales order
    if (!allConsolidatedDeliveries.some(d => d.delivery.id === del.id)) {
      allConsolidatedDeliveries.push({ delivery: del });
    }
  });

  allConsolidatedDeliveries.sort((a, b) => new Date(b.delivery.date).getTime() - new Date(a.delivery.date).getTime());

  // Filter orders for the advance orders list
  const filteredOrders = salesOrders.filter(order => {
    const { pending, totalDelivered, totalOrdered } = getOrderDeliveryStats(order);
    if (deliveryFilter === 'pendiente' && totalDelivered > 0) return false;
    if (deliveryFilter === 'parcial' && (totalDelivered === 0 || pending === 0)) return false;
    if (deliveryFilter === 'total' && pending > 0) return false;

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesBilling = billingFilter === 'all' || order.billingType === billingFilter;
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerTaxId.includes(searchQuery) ||
      (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
    return matchesStatus && matchesBilling && matchesSearch;
  });

  // Global counts
  const totalInvoicedOrders = salesOrders.length;
  const totalUnitsInvoiced = salesOrders.reduce((acc, o) => acc + o.items.reduce((s, it) => s + (it.quantity || 0), 0), 0);
  const totalUnitsDelivered = salesOrders.reduce((acc, o) => acc + o.items.reduce((s, it) => s + (it.deliveredQuantity || 0), 0), 0);
  const totalUnitsPending = Math.max(0, totalUnitsInvoiced - totalUnitsDelivered);
  const ordersPendingDeliveryCount = salesOrders.filter(o => getOrderDeliveryStats(o).pending > 0).length;

  // Convert Quote into Sales Order Handler
  const handleConvertQuoteToSale = async (quote: Quote) => {
    const orderNumber = `PED-${new Date().getFullYear()}-${String(salesOrders.length + 86).padStart(3, '0')}`;
    const invoiceNumber = `FAC-B-0004-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(8, '0')}`;

    const newOrder: SalesOrder = {
      id: `order-from-quote-${quote.id}-${Date.now()}`,
      orderNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerTaxId: quote.customerTaxId,
      customerPhone: quote.customerPhone,
      customerEmail: quote.customerEmail,
      customerAddress: quote.customerAddress,
      billingType: 'arca',
      invoiceType: 'FACTURA_B',
      invoiceNumber,
      date: new Date().toISOString(),
      status: 'facturado',
      deliveryStatus: 'pendiente_entrega',
      deliveryOrders: [],
      paymentStatus: 'pendiente',
      items: quote.items.map(it => ({
        productId: it.productId,
        productName: it.productName,
        code: it.code,
        presentation: it.presentation,
        quantity: it.quantity,
        deliveredQuantity: 0,
        unitPrice: it.unitPrice,
        discount: it.discount,
        subtotal: it.subtotal
      })),
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      paidAmount: 0,
      notes: `Convertido de Presupuesto ${quote.quoteNumber}. ${quote.notes || ''}`
    };

    await onCreateOrder(newOrder);
  };

  // Convert Quote into Standalone Remito Handler
  const handleConvertQuoteToRemito = async (quote: Quote) => {
    const deliveryNumber = `REM-0001-${String(Math.floor(Math.random() * 89999 + 10000)).padStart(8, '0')}`;
    const newRemito: DeliveryOrder = {
      id: `rem-from-quote-${Date.now()}`,
      deliveryNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerTaxId: quote.customerTaxId,
      customerAddress: quote.customerAddress || 'Retiro en Planta',
      customerPhone: quote.customerPhone,
      date: new Date().toISOString().split('T')[0],
      items: quote.items.map(it => ({
        productId: it.productId,
        productName: it.productName,
        code: it.code,
        presentation: it.presentation,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        batchNumber: `LOT-${new Date().getFullYear()}-042`,
        partidaNumber: 'PAR-2610-042'
      })),
      transportName: 'Logística de Fábrica',
      driverName: 'Depósito Central',
      receiverName: quote.customerName,
      totalAmount: quote.total,
      notes: `Generado desde Presupuesto ${quote.quoteNumber}`,
      createdAt: new Date().toISOString()
    };

    if (onSaveStandaloneRemito) {
      await onSaveStandaloneRemito(newRemito);
    }
    generateRemitoPDF(newRemito, config);
  };

  return (
    <div className="space-y-6">
      
      {/* MASTER TOP-LEVEL TABS (POS Terminal, Presupuestos, Remitos, Facturas Anticipadas) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {/* 1. Terminal Mostrador POS */}
          <button
            onClick={() => setActiveMainTab('pos_terminal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeMainTab === 'pos_terminal'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-300" />
            <span>Terminal POS Mostrador</span>
            <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.5 rounded-full font-mono">
              F8
            </span>
          </button>

          {/* 2. Presupuestos & Cotizaciones */}
          <button
            onClick={() => setActiveMainTab('presupuestos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeMainTab === 'presupuestos'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>Presupuestos & Cotizaciones</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeMainTab === 'presupuestos' ? 'bg-indigo-900 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {quotes.length}
            </span>
          </button>

          {/* 3. Remitos & Despachos */}
          <button
            onClick={() => setActiveMainTab('remitos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeMainTab === 'remitos'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-200" />
            <span>Remitos & Despachos</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeMainTab === 'remitos' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {allConsolidatedDeliveries.length}
            </span>
          </button>

          {/* 4. Pedidos & Facturación Anticipada (In-page) */}
          <button
            onClick={() => setActiveMainTab('pedidos_anticipados')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeMainTab === 'pedidos_anticipados'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            <span>Pedidos & Facturación Anticipada</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeMainTab === 'pedidos_anticipados' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {salesOrders.length}
            </span>
          </button>
        </div>

        {/* Quick Context Switchers */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setTerminalInitialDocType('ingreso_simple');
              setActiveMainTab('pos_terminal');
            }}
            className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Venta
          </button>
          <button
            onClick={() => {
              setTerminalInitialDocType('presupuesto');
              setActiveMainTab('pos_terminal');
            }}
            className="text-[11px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Presupuesto
          </button>
          <button
            onClick={() => {
              setTerminalInitialDocType('remito');
              setActiveMainTab('pos_terminal');
            }}
            className="text-[11px] font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Remito
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: TERMINAL POS MOSTRADOR (MATCHES SCREENSHOT EXACTLY)
         ========================================================================= */}
      {activeMainTab === 'pos_terminal' && (
        <SalesPointOfSaleTerminal
          products={products}
          customers={customers}
          cashboxes={cashboxes}
          transports={transports}
          config={config}
          initialDocType={terminalInitialDocType}
          initialCustomer={terminalInitialCustomer}
          preloadedItems={terminalPreloadedItems}
          onClearPreload={() => setTerminalPreloadedItems(undefined)}
          onSaleCompleted={async (order, cashboxId, paymentMethod) => {
            await onCreateOrder(order, cashboxId, paymentMethod);
          }}
          onQuoteCreated={async (quote) => {
            if (onSaveQuote) {
              await onSaveQuote(quote);
            }
          }}
          onRemitoCreated={async (remito) => {
            if (onSaveStandaloneRemito) {
              await onSaveStandaloneRemito(remito);
            }
          }}
        />
      )}

      {/* =========================================================================
          VIEW 2: PRESUPUESTOS & COTIZACIONES
         ========================================================================= */}
      {activeMainTab === 'presupuestos' && (
        <QuotesModule
          quotes={quotes}
          customers={customers}
          products={products}
          config={config}
          onSaveQuote={async (q) => {
            if (onSaveQuote) await onSaveQuote(q);
          }}
          onDeleteQuote={async (qId) => {
            if (onDeleteQuote) await onDeleteQuote(qId);
          }}
          onUpdateQuoteStatus={async (qId, st) => {
            if (onUpdateQuoteStatus) await onUpdateQuoteStatus(qId, st);
          }}
          onConvertToSale={handleConvertQuoteToSale}
          onConvertToRemito={handleConvertQuoteToRemito}
          onOpenTerminalWithQuote={(q) => {
            const customerObj = customers.find(c => c.id === q.customerId) || null;
            setTerminalInitialCustomer(customerObj);
            setTerminalInitialDocType('presupuesto');
            const itemsPreload = q.items.map(it => {
              const matchedProduct = products.find(p => p.id === it.productId) || {
                id: it.productId,
                code: it.code,
                name: it.productName,
                category: 'Pinturas',
                presentation: it.presentation,
                volumeOrWeight: it.presentation,
                color: 'Blanco',
                stock: 50,
                minStock: 10,
                priceWholesale: it.unitPrice,
                priceRetail: it.unitPrice,
                priceDistributor: it.unitPrice,
                unitCost: it.unitPrice * 0.6
              };
              return {
                product: matchedProduct,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                discount: it.discount
              };
            });
            setTerminalPreloadedItems(itemsPreload);
            setActiveMainTab('pos_terminal');
          }}
          onOpenNewQuoteTerminal={() => {
            setTerminalInitialDocType('presupuesto');
            setTerminalPreloadedItems(undefined);
            setActiveMainTab('pos_terminal');
          }}
        />
      )}

      {/* =========================================================================
          VIEW 3: HISTORIAL GLOBAL DE REMITOS Y DESPACHOS FÍSICOS
         ========================================================================= */}
      {activeMainTab === 'remitos' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Historial de Remitos de Salida & Despachos Físicos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro de mercadería despachada con firma de chofer y receptor conforme. Cada remito descuenta stock físico automáticamente.
              </p>
            </div>
            
            <button
              onClick={() => {
                setTerminalInitialDocType('remito');
                setActiveMainTab('pos_terminal');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Emitir Remito en Terminal
            </button>
          </div>

          {allConsolidatedDeliveries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Aún no se han emitido remitos u órdenes de entrega.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase border-y border-slate-200">
                  <tr>
                    <th className="p-3">N° Remito Oficial</th>
                    <th className="p-3">Fecha Despacho</th>
                    <th className="p-3">Destinatario / Cliente</th>
                    <th className="p-3">Transporte & Chofer</th>
                    <th className="p-3">Origen</th>
                    <th className="p-3 text-center">Bultos Entregados</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allConsolidatedDeliveries.map(({ delivery, order }) => {
                    const totalItemsInDelivery = delivery.items.reduce((s, it) => s + it.quantity, 0);
                    return (
                      <tr key={delivery.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                            {delivery.deliveryNumber}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {new Date(delivery.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{delivery.customerName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{delivery.customerAddress || 'Planta'}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-800 font-semibold">{delivery.driverName || 'Depósito'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {delivery.transportName || 'Propio'} {delivery.driverDniOrPlate ? `(${delivery.driverDniOrPlate})` : ''}
                          </div>
                        </td>
                        <td className="p-3">
                          {order ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              Pedido {order.orderNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Mostrador Directo
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-900">
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                            {totalItemsInDelivery} un.
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => generateRemitoPDF(delivery, config)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                            title="Descargar PDF oficial con duplicado para chofer y receptor"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Imprimir Remito R</span>
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
      )}

      {/* =========================================================================
          VIEW 4: PEDIDOS & FACTURACIÓN ANTICIPADA (IN-PAGE FORM, NON-MODAL!)
         ========================================================================= */}
      {activeMainTab === 'pedidos_anticipados' && (
        <div className="space-y-5">
          {/* Informative Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-4xl space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider">
                  Modelo Fábrica: Factura Anticipada & Remitos Parciales
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Stock Se Da de Baja Únicamente al Despachar
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                Ventas, Facturación Anticipada & Órdenes de Entrega
              </h1>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Facture de manera anticipada a pinturerías y constructoras. El stock se descuenta en cada remito conforme la mercadería se retira o despacha por transporte.
              </p>
            </div>
          </div>

          {/* Quick KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Pedidos</div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">{totalInvoicedOrders}</div>
              <div className="text-[11px] text-slate-500">{totalUnitsInvoiced.toLocaleString('es-AR')} un. facturadas</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Entregado</div>
              <div className="text-xl font-black text-emerald-700 font-mono mt-1">{totalUnitsDelivered.toLocaleString('es-AR')} un.</div>
              <div className="text-[11px] text-emerald-600">Con remito firmado</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Saldo por Entregar</div>
              <div className="text-xl font-black text-amber-800 font-mono mt-1">{totalUnitsPending.toLocaleString('es-AR')} un.</div>
              <div className="text-[11px] text-amber-700">{ordersPendingDeliveryCount} pedidos con saldo</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Cobranza</div>
              <div className="text-xl font-black text-purple-800 font-mono mt-1">
                {salesOrders.filter(o => o.paymentStatus === 'pagado').length} pagados
              </div>
              <div className="text-[11px] text-purple-700">Control estricto cta cte</div>
            </div>
          </div>

          {/* Action Row & In-Page Form Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por N° Pedido, cliente, CUIT o factura..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <select
                value={deliveryFilter}
                onChange={e => setDeliveryFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs bg-white font-semibold"
              >
                <option value="all">Todas las Entregas</option>
                <option value="pendiente">Solo Pendientes de Despacho</option>
                <option value="parcial">Solo Entregas Parciales</option>
                <option value="total">Entrega Total Completada</option>
              </select>
            </div>

            {/* BUTTON TO TOGGLE NON-MODAL IN-PAGE ORDER FORM */}
            <button
              onClick={() => setShowInlineNewOrderForm(!showInlineNewOrderForm)}
              className="bg-[#d31627] hover:bg-red-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              {showInlineNewOrderForm ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Ocultar Formulario de Facturación</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Facturar Nuevo Pedido Anticipado (En Página)</span>
                </>
              )}
            </button>
          </div>

          {/* =========================================================================
              NON-MODAL IN-PAGE FORM (Requested: "que venta pedidos anticipado no sea emergente")
             ========================================================================= */}
          {showInlineNewOrderForm && (
            <div className="bg-white rounded-2xl border-2 border-red-500/80 p-5 shadow-xl animate-in slide-in-from-top-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      Facturar Pedido Anticipado (Carga en Página Directa)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cargue el pedido sin ventanas emergentes. Emite la factura comercial y prepara el pedido para despacho en remitos parciales.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInlineNewOrderForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInlineOrderSubmit} className="space-y-4">
                {/* Customer and Billing Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Cliente / Pinturería Destinataria
                    </label>
                    <select
                      value={inlineCustomerId}
                      onChange={e => {
                        setInlineCustomerId(e.target.value);
                        const c = customers.find(cust => cust.id === e.target.value);
                        if (c?.transportId) setInlineTransportId(c.transportId);
                      }}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-slate-50"
                      required
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.businessName} ({c.taxId}) - Lista: {c.priceList.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Modalidad Fiscal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInlineBillingType('arca')}
                        className={`text-xs font-bold py-2.5 rounded-xl border transition-all ${
                          inlineBillingType === 'arca'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Oficial ARCA (IVA 21%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineBillingType('no_arca')}
                        className={`text-xs font-bold py-2.5 rounded-xl border transition-all ${
                          inlineBillingType === 'no_arca'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Interno / Recibo X
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transport selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Transporte o Expreso Acordado
                  </label>
                  <select
                    value={inlineTransportId}
                    onChange={e => setInlineTransportId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {transports.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} - Zona: {t.serviceArea}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Pinturas y Cantidades a Facturar
                    </label>
                    <button
                      type="button"
                      onClick={addInlineItemRow}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Otra Línea
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {inlineOrderItems.map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      const unitPrice = prod ? getProductPriceForCustomer(prod, selectedInlineCustomer) : 0;
                      return (
                        <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                          <select
                            value={item.productId}
                            onChange={e => {
                              const newItems = [...inlineOrderItems];
                              newItems[idx].productId = e.target.value;
                              setInlineOrderItems(newItems);
                            }}
                            className="flex-1 text-xs p-2 rounded-lg border border-slate-300 font-bold bg-white"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.code} - {p.name} ({p.presentation}) - Stock: {p.stock} un.
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500 font-semibold">Cant:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => {
                                const newItems = [...inlineOrderItems];
                                newItems[idx].quantity = Number(e.target.value);
                                setInlineOrderItems(newItems);
                              }}
                              className="w-16 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center bg-white"
                            />
                          </div>

                          <div className="w-28 text-right font-mono font-bold text-slate-900">
                            ${(unitPrice * item.quantity).toLocaleString('es-AR')}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeInlineItemRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtotal & Total display */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Neto:</span>
                    <strong className="font-mono text-slate-900">${inlineSubtotal.toLocaleString('es-AR')}</strong>
                  </div>
                  {inlineBillingType === 'arca' && (
                    <div className="flex justify-between text-blue-700">
                      <span>IVA 21%:</span>
                      <strong className="font-mono">${inlineTaxAmount.toLocaleString('es-AR')}</strong>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                    <span className="text-slate-900">TOTAL FACTURA:</span>
                    <span className="text-red-700 font-mono">${inlineTotal.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Observaciones y Dirección de Entrega
                  </label>
                  <textarea
                    rows={2}
                    value={inlineOrderNotes}
                    onChange={e => setInlineOrderNotes(e.target.value)}
                    placeholder="Horario de recepción, persona de contacto en depósito, etc."
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineNewOrderForm(false)}
                    className="text-xs font-bold text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#d31627] hover:bg-red-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md"
                  >
                    Confirmar y Facturar Pedido
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ORDERS LIST */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                No se encontraron pedidos con los filtros seleccionados.
              </div>
            ) : (
              filteredOrders.map(order => {
                const stats = getOrderDeliveryStats(order);
                const deliveriesCount = order.deliveryOrders ? order.deliveryOrders.length : 0;
                const clientPhoneClean = (order.customerPhone || '').replace(/[^0-9]/g, '');
                const customWhatsAppMsg = `Hola ${order.customerName}, le informamos el estado de su Factura ${order.invoiceNumber || order.orderNumber}: se han entregado ${stats.totalDelivered} de ${stats.totalOrdered} unidades (${stats.percentage}% completado). Saldo pendiente: ${stats.pending} unidades.`;

                return (
                  <div 
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-xs">
                          {order.orderNumber}
                        </span>
                        {order.invoiceNumber && (
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {order.invoiceNumber}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(order.date).toLocaleDateString('es-AR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {stats.pending === 0 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Entrega Total
                          </span>
                        ) : stats.totalDelivered > 0 ? (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-600" /> Entrega Parcial ({stats.percentage}%)
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <Package className="w-3 h-3 text-amber-600" /> Pendiente Despacho
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Totals */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Cliente:</span>
                        <strong className="text-slate-900 text-sm block">{order.customerName}</strong>
                        <div className="text-slate-500 font-mono text-[11px]">{order.customerTaxId}</div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Despacho Físico:</span>
                          <strong className="font-mono text-slate-800">{stats.totalDelivered} / {stats.totalOrdered} un.</strong>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${stats.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {deliveriesCount > 0 ? `${deliveriesCount} remito(s) emitido(s)` : 'Sin despachos aún'}
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Facturado:</span>
                        <div className="font-mono font-black text-xl text-slate-900">${order.total.toLocaleString('es-AR')},00</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          order.paymentStatus === 'pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {order.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente Pago'}
                        </span>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        {order.customerPhone && (
                          <a
                            href={`https://wa.me/${clientPhoneClean}?text=${encodeURIComponent(customWhatsAppMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg font-bold border border-emerald-200"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {deliveriesCount > 0 && (
                          <button
                            onClick={() => setViewDeliveriesOrder(order)}
                            className="flex items-center gap-1 text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg font-bold border border-purple-200"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Ver Remitos ({deliveriesCount})</span>
                          </button>
                        )}
                      </div>

                      <div>
                        {stats.pending > 0 ? (
                          <button
                            onClick={() => handleOpenDeliveryModal(order)}
                            className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Emitir Remito de Salida ({stats.pending} pendientes)</span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle className="w-4 h-4" />
                            <span>Entregado al 100%</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: NUEVA ORDEN DE ENTREGA / REMITO PARCIAL */}
      {deliveryModalOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Emitir Remito de Salida / Despacho
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pedido: <strong>{deliveryModalOrder.orderNumber}</strong> | Factura: <strong>{deliveryModalOrder.invoiceNumber || 'Factura Anticipada'}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDeliveryModalOrder(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cliente:</span>
                  <div className="font-extrabold text-slate-900 text-sm">{deliveryModalOrder.customerName}</div>
                  <div className="text-slate-500 text-[11px]">{deliveryModalOrder.customerAddress}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Transporte:</span>
                  <div className="font-bold text-slate-800">{deliveryModalOrder.transportName || 'Propio de fábrica'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    N° de Remito Oficial (R)
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryNumber}
                    onChange={e => setDeliveryNumber(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fecha de Despacho
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Chofer / Retira
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Patente / DNI Chofer
                  </label>
                  <input
                    type="text"
                    value={driverPlateOrDni}
                    onChange={e => setDriverPlateOrDni(e.target.value)}
                    placeholder="Ej: AF 123 CD"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Cantidades a Entregar en este Remito
                  </label>
                  <button
                    type="button"
                    onClick={handleFillAllPending}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    Entregar todo lo pendiente
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {deliveryModalOrder.items.map(it => {
                    const delivered = it.deliveredQuantity || 0;
                    const pending = Math.max(0, it.quantity - delivered);
                    return (
                      <div key={it.productId} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div>
                          <strong className="text-slate-800 block">{it.productName}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Facturado: {it.quantity} un. | Entregado: {delivered} un. | <strong>Saldo: {pending} un.</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={pending}
                            value={dispatchItems[it.productId] ?? 0}
                            onChange={e => {
                              const v = Math.min(pending, Math.max(0, parseInt(e.target.value) || 0));
                              setDispatchItems(prev => ({ ...prev, [it.productId]: v }));
                            }}
                            className="w-16 p-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold"
                          />
                          <span className="text-slate-400 font-bold">un</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOrder(null)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDelivery}
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{isSubmittingDelivery ? 'Emitiendo...' : 'Confirmar Despacho y Descargar Remito'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER REMITOS DE UNA ORDEN */}
      {viewDeliveriesOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Remitos de Entrega: {viewDeliveriesOrder.orderNumber}
              </h3>
              <button onClick={() => setViewDeliveriesOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {viewDeliveriesOrder.deliveryOrders?.map(del => (
                <div key={del.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {del.deliveryNumber}
                    </span>
                    <div className="text-slate-600 font-semibold mt-1">
                      Fecha: {new Date(del.date).toLocaleDateString('es-AR')} | Chofer: {del.driverName}
                    </div>
                  </div>
                  <button
                    onClick={() => generateRemitoPDF(del, config)}
                    className="flex items-center gap-1 text-xs font-bold bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-100"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewDeliveriesOrder(null)}
                className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
