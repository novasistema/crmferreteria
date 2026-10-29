import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  CircleDollarSign, 
  AlertTriangle, 
  MessageSquare, 
  Mail, 
  FileText, 
  CheckCircle, 
  Clock, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  Send,
  Building,
  Phone,
  MapPin,
  Truck,
  Printer,
  Download,
  Receipt,
  FileCheck2,
  Calendar,
  CreditCard,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { Customer, SalesOrder, FinancialTransaction, CompanyConfig, Transport } from '../types';
import { generatePaymentReminderWhatsApp } from '../utils/exportUtils';
import { generatePaymentReceiptPDF, buildWhatsAppReceiptMessage, PaymentReceiptData } from '../utils/receiptPdfUtils';

interface CustomersModuleProps {
  customers: Customer[];
  salesOrders: SalesOrder[];
  financialTransactions?: FinancialTransaction[];
  transports: Transport[];
  config: CompanyConfig | null;
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onRecordPayment: (
    customerId: string, 
    amount: number, 
    method: FinancialTransaction['paymentMethod'], 
    concept: string,
    receiptNumber?: string,
    bankInfo?: string,
    allocatedOrderIds?: string[]
  ) => Promise<void>;
  preselectedCustomer?: Customer | null;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({
  customers,
  salesOrders,
  financialTransactions = [],
  transports,
  config,
  onSaveCustomer,
  onRecordPayment,
  preselectedCustomer = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(preselectedCustomer);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [recentGeneratedReceipt, setRecentGeneratedReceipt] = useState<PaymentReceiptData | null>(null);

  // Filter for movements in current account
  const [movementFilter, setMovementFilter] = useState<'all' | 'sales' | 'payments'>('all');

  // New/Edit Customer form
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
    taxId: '',
    businessName: '',
    tradeName: '',
    taxCategory: 'responsable_inscripto',
    email: '',
    phone: '',
    address: '',
    city: 'Buenos Aires',
    province: 'Buenos Aires',
    priceList: 'mayorista',
    creditLimit: 1500000,
    currentBalance: 0,
    status: 'activo'
  });

  // Payment Receipt form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<FinancialTransaction['paymentMethod']>('transferencia');
  const [paymentConcept, setPaymentConcept] = useState('Cancelación parcial factura / cuenta corriente');
  const [paymentBankInfo, setPaymentBankInfo] = useState('');
  const [selectedOrderIdsToPay, setSelectedOrderIdsToPay] = useState<string[]>([]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const filteredCustomers = customers.filter(c => 
    c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.taxId.includes(searchQuery) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.tradeName && c.tradeName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sync selectedCustomer with updated data from customers prop
  const currentCustomerData = useMemo(() => {
    if (!selectedCustomer) return null;
    return customers.find(c => c.id === selectedCustomer.id) || selectedCustomer;
  }, [customers, selectedCustomer]);

  // Customer order history & invoices (Debits)
  const customerOrders = useMemo(() => {
    if (!currentCustomerData) return [];
    return salesOrders.filter(o => 
      o.customerId === currentCustomerData.id || 
      o.customerTaxId === currentCustomerData.taxId
    );
  }, [currentCustomerData, salesOrders]);

  // Customer payment transactions (Credits)
  const customerPayments = useMemo(() => {
    if (!currentCustomerData) return [];
    return financialTransactions.filter(tx => 
      tx.type === 'cobro_cliente' && 
      (tx.entityId === currentCustomerData.id || tx.entityName === currentCustomerData.businessName)
    );
  }, [currentCustomerData, financialTransactions]);

  // Consolidated Chronological Ledger of Movements with running progressive balance
  const customerLedger = useMemo(() => {
    if (!currentCustomerData) return [];

    interface LedgerItem {
      id: string;
      date: string;
      type: 'venta' | 'cobranza';
      reference: string;
      concept: string;
      debit: number;   // Suman a la deuda
      credit: number;  // Restan a la deuda
      runningBalance: number;
      paymentMethod?: string;
      status?: string;
    }

    const items: Omit<LedgerItem, 'runningBalance'>[] = [];

    // Add Sales (Debits)
    customerOrders.forEach(order => {
      items.push({
        id: `order-${order.id}`,
        date: order.date,
        type: 'venta',
        reference: order.orderNumber,
        concept: `${order.billingType === 'arca' ? (order.invoiceType || 'Factura Oficial') : 'Comprobante Venta Fábrica'} (${order.items.length} items)`,
        debit: order.total,
        credit: 0,
        status: order.paymentStatus
      });
    });

    // Add Payments (Credits)
    customerPayments.forEach(pay => {
      items.push({
        id: `pay-${pay.id}`,
        date: pay.date,
        type: 'cobranza',
        reference: pay.receiptNumber || 'REC-S/N',
        concept: pay.concept || 'Cobranza / Pago a cuenta corriente',
        debit: 0,
        credit: pay.amount,
        paymentMethod: pay.paymentMethod,
        status: 'imputado'
      });
    });

    // Sort ascending by date to calculate accurate running balance
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const ledgerWithBalance: LedgerItem[] = items.map(it => {
      running += (it.debit - it.credit);
      return {
        ...it,
        runningBalance: running
      };
    });

    // Return in reverse chronological order (newest first) for UI display
    return ledgerWithBalance.reverse();
  }, [currentCustomerData, customerOrders, customerPayments]);

  const filteredLedger = useMemo(() => {
    if (movementFilter === 'sales') return customerLedger.filter(m => m.type === 'venta');
    if (movementFilter === 'payments') return customerLedger.filter(m => m.type === 'cobranza');
    return customerLedger;
  }, [customerLedger, movementFilter]);

  // Open Payment modal with auto-populated defaults
  const handleOpenPaymentModal = () => {
    if (!currentCustomerData) return;
    const autoRecNumber = `REC-0001-${String(Math.floor(Math.random() * 89999 + 10000)).padStart(8, '0')}`;
    setPaymentReceiptNumber(autoRecNumber);
    setPaymentAmount(currentCustomerData.currentBalance > 0 ? currentCustomerData.currentBalance : 0);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('transferencia');
    setPaymentConcept(`Cobranza / Cancelación cuenta corriente ${currentCustomerData.businessName}`);
    setPaymentBankInfo('');
    setSelectedOrderIdsToPay([]);
    setShowPaymentModal(true);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.taxId || !customerForm.businessName) return;

    const newCust: Customer = {
      id: customerForm.id || `cust-${Date.now()}`,
      taxId: customerForm.taxId.trim(),
      businessName: customerForm.businessName,
      tradeName: customerForm.tradeName,
      taxCategory: customerForm.taxCategory || 'responsable_inscripto',
      email: customerForm.email || '',
      phone: customerForm.phone || '',
      address: customerForm.address || '',
      city: customerForm.city || '',
      province: customerForm.province || '',
      transportId: customerForm.transportId,
      transportName: transports.find(t => t.id === customerForm.transportId)?.name,
      priceList: customerForm.priceList || 'mayorista',
      creditLimit: Number(customerForm.creditLimit) || 0,
      currentBalance: Number(customerForm.currentBalance) || 0,
      status: customerForm.status || 'activo'
    };

    await onSaveCustomer(newCust);
    setShowCustomerModal(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomerData || paymentAmount <= 0) return;

    setIsSubmittingPayment(true);
    try {
      const recNumber = paymentReceiptNumber || `REC-0001-${Math.floor(Math.random() * 89999 + 10000)}`;
      const prevBal = currentCustomerData.currentBalance;
      const newBal = Math.max(0, prevBal - paymentAmount);

      await onRecordPayment(
        currentCustomerData.id, 
        paymentAmount, 
        paymentMethod, 
        paymentConcept,
        recNumber,
        paymentBankInfo,
        selectedOrderIdsToPay
      );

      // Prepare receipt data for printing / downloading
      const allocatedOrders = customerOrders
        .filter(o => selectedOrderIdsToPay.includes(o.id))
        .map(o => o.orderNumber);

      const receiptData: PaymentReceiptData = {
        receiptNumber: recNumber,
        date: paymentDate,
        customer: currentCustomerData,
        amount: paymentAmount,
        paymentMethod,
        concept: paymentConcept,
        bankOrCheckInfo: paymentBankInfo,
        previousBalance: prevBal,
        newBalance: newBal,
        allocatedOrderNumbers: allocatedOrders.length > 0 ? allocatedOrders : undefined
      };

      setRecentGeneratedReceipt(receiptData);
      setShowPaymentModal(false);
    } catch (err) {
      console.error("Error submitting payment receipt:", err);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Toggle order allocation in payment modal
  const toggleOrderToPay = (order: SalesOrder) => {
    setSelectedOrderIdsToPay(prev => {
      const exists = prev.includes(order.id);
      if (exists) {
        return prev.filter(id => id !== order.id);
      } else {
        const next = [...prev, order.id];
        // Automatically suggest paying sum of selected orders
        const sum = customerOrders
          .filter(o => next.includes(o.id))
          .reduce((acc, o) => acc + o.total, 0);
        setPaymentAmount(sum);
        return next;
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Cuentas Corrientes & Clientes
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  Libro Mayor & Cobranzas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acceso a estados de cuenta, detalle de comprobantes, imputación de pagos y emisión in-situ de recibos oficiales.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCustomerForm({
                taxId: '',
                businessName: '',
                tradeName: '',
                taxCategory: 'responsable_inscripto',
                email: '',
                phone: '',
                address: '',
                city: 'Buenos Aires',
                province: 'Buenos Aires',
                priceList: 'mayorista',
                creditLimit: 1500000,
                currentBalance: 0,
                status: 'activo'
              });
              setShowCustomerModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Alta de Cliente / Pinturería
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Razón Social, CUIT, DNI, localidad..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Mostrando <strong>{filteredCustomers.length}</strong> de {customers.length} cuentas
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Cliente / Razón Social</th>
                <th className="p-3.5">CUIT / DNI</th>
                <th className="p-3.5">Lista</th>
                <th className="p-3.5">Transporte Asignado</th>
                <th className="p-3.5 text-right">Límite Crédito</th>
                <th className="p-3.5 text-right">Saldo Cuenta Corriente</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(c => {
                const hasDebt = c.currentBalance > 0;
                const isOverLimit = c.currentBalance > c.creditLimit;
                const whatsappMsg = generatePaymentReminderWhatsApp(c, config || undefined);
                const phoneClean = c.phone.replace(/[^0-9]/g, '');

                return (
                  <tr 
                    key={c.id} 
                    className={`hover:bg-purple-50/30 transition-colors cursor-pointer ${isOverLimit ? 'bg-red-50/20' : ''}`}
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900 hover:text-purple-700 flex items-center gap-1.5">
                        {c.businessName}
                        {c.tradeName && <span className="text-[11px] font-normal text-slate-500">({c.tradeName})</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">{c.city}, {c.province} • {c.phone}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {c.taxId}
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {c.priceList}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 truncate max-w-xs">
                      {c.transportName || 'Directo fábrica'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      $ {c.creditLimit.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      <div className={`font-black text-sm ${hasDebt ? 'text-red-600' : 'text-emerald-700'}`}>
                        $ {c.currentBalance.toLocaleString('es-AR')}
                      </div>
                      {isOverLimit && (
                        <span className="text-[10px] text-red-600 font-extrabold uppercase block">
                          Excede Límite
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 shadow-xs"
                          title="Entrar a ver todos los datos, movimientos y hacer recibo de pago"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Entrar Cta. Cte.
                        </button>
                        {hasDebt && (
                          <a
                            href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-lg transition-colors"
                            title="Enviar recordatorio de pago por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setCustomerForm(c);
                            setShowCustomerModal(true);
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
                          title="Editar ficha del cliente"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL CUSTOMER CURRENT ACCOUNT MODAL / STATEMENT VIEW */}
      {currentCustomerData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-gradient-to-r from-purple-50 via-slate-50 to-white">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-purple-600 text-white shadow-md">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      {currentCustomerData.businessName}
                    </h2>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                      Cuenta Corriente
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      CUIT/DNI: {currentCustomerData.taxId}
                    </span>
                    <span className="capitalize text-slate-500">
                      {currentCustomerData.taxCategory.replace('_', ' ')}
                    </span>
                    <span>• {currentCustomerData.city}, {currentCustomerData.province}</span>
                    <span>• Tel: {currentCustomerData.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* ACTION: MAKE PAYMENT RECEIPT RIGHT HERE */}
                <button
                  onClick={handleOpenPaymentModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <CircleDollarSign className="w-4 h-4" /> + Hacer Recibo de Pago
                </button>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body: Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Top Details & Financial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Balance Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saldo Actual Cuenta Corriente
                  </span>
                  <div className={`text-2xl font-black font-mono mt-1 ${currentCustomerData.currentBalance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    $ {currentCustomerData.currentBalance.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {currentCustomerData.currentBalance > 0 ? '⚠️ Saldo deudor pendiente' : '✅ Cuenta al día'}
                  </span>
                </div>

                {/* Credit Limit Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Límite de Crédito Asignado
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-800 mt-1">
                    $ {currentCustomerData.creditLimit.toLocaleString('es-AR')}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${currentCustomerData.currentBalance > currentCustomerData.creditLimit ? 'bg-red-600' : 'bg-purple-600'}`}
                        style={{ width: `${Math.min(100, Math.round((currentCustomerData.currentBalance / (currentCustomerData.creditLimit || 1)) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {Math.round((currentCustomerData.currentBalance / (currentCustomerData.creditLimit || 1)) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Assigned Logistics & Price List */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Comercial & Logística
                  </span>
                  <div className="mt-1.5 space-y-1">
                    <div>
                      <span className="text-slate-400">Lista:</span>{' '}
                      <strong className="capitalize text-slate-800">{currentCustomerData.priceList}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Transporte:</span>{' '}
                      <strong className="text-slate-800">{currentCustomerData.transportName || 'A designar'}</strong>
                    </div>
                  </div>
                </div>

                {/* Fast WhatsApp Reminder */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs flex flex-col justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Aviso por WhatsApp
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Enviar estado de saldo con datos CBU de fábrica.
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${currentCustomerData.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(generatePaymentReminderWhatsApp(currentCustomerData, config || undefined))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-center text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Send className="w-3 h-3" /> Enviar Estado de Cuenta
                  </a>
                </div>
              </div>

              {/* MOVEMENTS & LEDGER TABLE */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Ledger Toolbar & Filters */}
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Movimientos de la Cuenta Corriente (Libro Mayor)
                    </h3>
                  </div>

                  {/* Filter tabs */}
                  <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                    <button
                      onClick={() => setMovementFilter('all')}
                      className={`px-3 py-1 rounded-md transition-all ${movementFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Todos ({customerLedger.length})
                    </button>
                    <button
                      onClick={() => setMovementFilter('sales')}
                      className={`px-3 py-1 rounded-md transition-all ${movementFilter === 'sales' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Ventas / Facturas ({customerOrders.length})
                    </button>
                    <button
                      onClick={() => setMovementFilter('payments')}
                      className={`px-3 py-1 rounded-md transition-all ${movementFilter === 'payments' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Cobranzas / Recibos ({customerPayments.length})
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {filteredLedger.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-400">
                      No hay movimientos registrados en este período para este cliente.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/60 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Tipo / Comprobante</th>
                          <th className="p-3">Detalle & Imputación</th>
                          <th className="p-3 text-right">Débito (+)</th>
                          <th className="p-3 text-right">Crédito (-)</th>
                          <th className="p-3 text-right">Saldo Progresivo</th>
                          <th className="p-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {filteredLedger.map(m => {
                          const isSale = m.type === 'venta';
                          const dateStr = new Date(m.date).toLocaleDateString('es-AR');

                          return (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-slate-600 font-sans">
                                {dateStr}
                              </td>
                              <td className="p-3 font-sans">
                                <div className="flex items-center gap-1.5">
                                  {isSale ? (
                                    <span className="p-1 rounded bg-blue-50 text-blue-700">
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </span>
                                  ) : (
                                    <span className="p-1 rounded bg-emerald-50 text-emerald-700">
                                      <ArrowDownLeft className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                  <div>
                                    <strong className="text-slate-900 font-mono">{m.reference}</strong>
                                    <span className="text-[10px] text-slate-400 block font-sans">
                                      {isSale ? 'Venta / Factura' : `Cobranza (${m.paymentMethod || 'Efectivo'})`}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-sans text-slate-700">
                                {m.concept}
                              </td>
                              <td className="p-3 text-right font-black text-slate-900">
                                {m.debit > 0 ? `$ ${m.debit.toLocaleString('es-AR')}` : '-'}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700">
                                {m.credit > 0 ? `-$ ${m.credit.toLocaleString('es-AR')}` : '-'}
                              </td>
                              <td className="p-3 text-right font-black text-slate-900">
                                $ {m.runningBalance.toLocaleString('es-AR')}
                              </td>
                              <td className="p-3 text-center font-sans">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                  m.status === 'pagado' || m.status === 'imputado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Dirección de entrega: <strong>{currentCustomerData.address}, {currentCustomerData.city}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenPaymentModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Receipt className="w-4 h-4" /> Emitir Recibo de Pago
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HACER RECIBO DE PAGO IN SITU */}
      {showPaymentModal && currentCustomerData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Emitir Recibo Oficial de Pago
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cliente: <strong>{currentCustomerData.businessName}</strong> (CUIT: {currentCustomerData.taxId})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Debt Alert */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Saldo actual a cancelar:</span>
                <span className="text-lg font-black text-red-600 font-mono">
                  $ {currentCustomerData.currentBalance.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(currentCustomerData.currentBalance)}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-[11px]"
                >
                  Total Deuda (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(Math.round(currentCustomerData.currentBalance / 2))}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1 rounded-lg text-[11px]"
                >
                  50%
                </button>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {/* Receipt Number & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nº Comprobante Recibo
                  </label>
                  <input
                    type="text"
                    value={paymentReceiptNumber}
                    onChange={e => setPaymentReceiptNumber(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Fecha de Cobranza
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Importe Recibido ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    className="w-full text-base p-2 rounded-xl border border-emerald-400 font-mono font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Medio de Cobro
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="echeq">E-Cheq</option>
                    <option value="cheque">Cheque Físico</option>
                    <option value="efectivo">Efectivo en Mostrador</option>
                  </select>
                </div>
              </div>

              {/* Bank or Check Ref */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Banco / Nro de Cheque o Transferencia / Comprobante
                </label>
                <input
                  type="text"
                  placeholder="Ej: Banco Galicia Transf #99482 / Cheque #884920 Vto 20/09"
                  value={paymentBankInfo}
                  onChange={e => setPaymentBankInfo(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Concept */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Concepto / Detalle
                </label>
                <input
                  type="text"
                  value={paymentConcept}
                  onChange={e => setPaymentConcept(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              {/* Pending Orders Allocation Selection */}
              {customerOrders.filter(o => o.paymentStatus !== 'pagado').length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Imputar a Pedidos Pendientes (Opcional):
                  </label>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    {customerOrders.filter(o => o.paymentStatus !== 'pagado').map(order => (
                      <label 
                        key={order.id} 
                        className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-purple-50/50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedOrderIdsToPay.includes(order.id)}
                            onChange={() => toggleOrderToPay(order)}
                            className="rounded text-purple-600"
                          />
                          <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>
                          <span className="text-[10px] text-slate-400">({order.billingType.toUpperCase()})</span>
                        </div>
                        <span className="font-mono font-black text-slate-900">
                          $ {order.total.toLocaleString('es-AR')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> Confirmar & Generar Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP / MODAL: RECENTLY GENERATED RECEIPT (DOWNLOAD / WHATSAPP) */}
      {recentGeneratedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-70 animate-in zoom-in-95">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileCheck2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              ¡Recibo de Pago Emitido con Éxito!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprobante <strong>{recentGeneratedReceipt.receiptNumber}</strong> por valor de{' '}
              <strong className="text-emerald-700 font-mono text-sm">
                $ {recentGeneratedReceipt.amount.toLocaleString('es-AR')}
              </strong>
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <strong>{recentGeneratedReceipt.customer.businessName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo Actualizado:</span>
                <strong className="font-mono text-slate-900">
                  $ {recentGeneratedReceipt.newBalance.toLocaleString('es-AR')}
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => generatePaymentReceiptPDF(recentGeneratedReceipt, config)}
                className="w-full bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Descargar Recibo Oficial en PDF
              </button>

              <a
                href={`https://wa.me/${recentGeneratedReceipt.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buildWhatsAppReceiptMessage(recentGeneratedReceipt, config))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" /> Enviar Recibo por WhatsApp
              </a>

              <button
                onClick={() => setRecentGeneratedReceipt(null)}
                className="w-full text-xs font-semibold py-2 text-slate-500 hover:text-slate-800"
              >
                Finalizar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTA O EDICIÓN DE CLIENTE */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              {customerForm.id ? 'Editar Cliente' : 'Alta de Nuevo Cliente / Pinturería'}
            </h3>

            <form onSubmit={handleCustomerSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    CUIT o DNI (Obligatorio)
                  </label>
                  <input
                    type="text"
                    value={customerForm.taxId}
                    onChange={e => setCustomerForm({ ...customerForm, taxId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    placeholder="30-71489234-8"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Condición Fiscal
                  </label>
                  <select
                    value={customerForm.taxCategory}
                    onChange={e => setCustomerForm({ ...customerForm, taxCategory: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="responsable_inscripto">Responsable Inscripto</option>
                    <option value="monotributo">Monotributo</option>
                    <option value="consumidor_final">Consumidor Final</option>
                    <option value="exento">Exento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Razón Social (Nombre Legal)
                </label>
                <input
                  type="text"
                  value={customerForm.businessName}
                  onChange={e => setCustomerForm({ ...customerForm, businessName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  placeholder="Pinturerías Centro S.A."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nombre Fantasía
                  </label>
                  <input
                    type="text"
                    value={customerForm.tradeName || ''}
                    onChange={e => setCustomerForm({ ...customerForm, tradeName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    placeholder="Pinturería El Color"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Lista de Precios
                  </label>
                  <select
                    value={customerForm.priceList}
                    onChange={e => setCustomerForm({ ...customerForm, priceList: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="mayorista">Mayorista</option>
                    <option value="distribuidor">Distribuidor / Fábrica</option>
                    <option value="minorista">Minorista</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Teléfono / WhatsApp (con código de país)
                  </label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    placeholder="+54 9 11 4890-7000"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    placeholder="compras@pintureria.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Domicilio
                  </label>
                  <input
                    type="text"
                    value={customerForm.address}
                    onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    placeholder="Av. Rivadavia 1234"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Localidad
                  </label>
                  <input
                    type="text"
                    value={customerForm.city}
                    onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    placeholder="Buenos Aires"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={customerForm.province}
                    onChange={e => setCustomerForm({ ...customerForm, province: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    placeholder="Buenos Aires"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Transporte Habitual
                  </label>
                  <select
                    value={customerForm.transportId || ''}
                    onChange={e => setCustomerForm({ ...customerForm, transportId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="">Directo Fábrica / Retira</option>
                    {transports.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.serviceArea})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Límite de Crédito ($)
                  </label>
                  <input
                    type="number"
                    value={customerForm.creditLimit}
                    onChange={e => setCustomerForm({ ...customerForm, creditLimit: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Guardar Ficha Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
