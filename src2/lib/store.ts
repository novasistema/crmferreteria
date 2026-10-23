import {
  Product,
  ProductCombo,
  Client,
  Supplier,
  Sale,
  SaleItem,
  SalePayment,
  CashRegister,
  CashRegisterSession,
  CashMovement,
  MoneyBox,
  ClientAccountMovement,
  ClientReceipt,
  LoyaltyReward,
  LoyaltyBonusRule,
  LoyaltySurvey,
  LoyaltyBranch,
  LoyaltyConfig,
  LoyaltyTransaction,
  LoyaltyRedemption,
  LoyaltyRaffle,
  InternalInstallmentPlan,
  TechnicalServiceOrder,
  Employee,
  EmployeeAdvance,
  EmployeePayment,
  EmployeeAbsence,
  EmployeeVacation,
  EmployeeSpecialDate,
  FixedExpense,
  ExpenseCategory,
  ExpenseRecord,
  CheckWalletItem,
  StockMovement,
  CompanySettings,
  PriceList,
  ProductCategory,
  Brand,
  Warehouse,
  User,
  DocumentType,
  ElectronicInvoice,
  PaymentMethod,
  ShippingCarrier,
  CurrencyConfig,
  MessageTemplate,
  DocumentPrintConfig,
  Quote,
  QuoteItem,
  Remito,
  RemitoItem,
  StockTransfer,
  StockTransferItem,
  PurchaseOrder,
  PurchaseOrderItem,
  PendingPurchaseItem,
  Purchase,
  PurchaseItem,
  SupplierAccountMovement,
  SupplierPaymentOrder,
  EcommerceConfig,
  EcommerceOrder,
  SaleReturn,
  SupplierReturn,
  SaleReturnItem,
  SupplierReturnItem,
  InstallmentRateOption,
  InternalInstallmentsConfig,
  RoleDefinition,
  SystemModuleInfo,
  TaskItem,
  LoanPlan,
  LoanInstallment,
} from '../types';
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_USERS,
  INITIAL_ROLES,
  ALL_SYSTEM_MODULES,
  INITIAL_WAREHOUSES,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_PRICE_LISTS,
  INITIAL_PRODUCTS,
  INITIAL_COMBOS,
  INITIAL_CLIENTS,
  INITIAL_SUPPLIERS,
  INITIAL_PENDING_PURCHASE_ITEMS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PURCHASES,
  INITIAL_SUPPLIER_ACCOUNT_MOVEMENTS,
  INITIAL_SUPPLIER_PAYMENT_ORDERS,
  INITIAL_CASH_REGISTERS,
  INITIAL_CASH_MOVEMENTS,
  INITIAL_MONEY_BOXES,
  INITIAL_LOYALTY_REWARDS,
  INITIAL_LOYALTY_RAFFLE,
  INITIAL_LOYALTY_CONFIG,
  INITIAL_LOYALTY_BONUS_RULES,
  INITIAL_LOYALTY_SURVEYS,
  INITIAL_LOYALTY_BRANCHES,
  INITIAL_INSTALLMENT_PLANS,
  INITIAL_INSTALLMENTS_CONFIG,
  INITIAL_SERVICE_ORDERS,
  INITIAL_EMPLOYEES,
  INITIAL_EMPLOYEE_ADVANCES,
  INITIAL_EMPLOYEE_PAYMENTS,
  INITIAL_EMPLOYEE_SPECIAL_DATES,
  INITIAL_EMPLOYEE_ABSENCES,
  INITIAL_EMPLOYEE_VACATIONS,
  INITIAL_FIXED_EXPENSES,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_CHECKS,
  INITIAL_CURRENCY_CONFIG,
  INITIAL_SHIPPING_CARRIERS,
  INITIAL_MESSAGE_TEMPLATES,
  INITIAL_PRINT_CONFIGS,
  INITIAL_REMITOS,
  INITIAL_QUOTES,
  INITIAL_STOCK_TRANSFERS,
  INITIAL_ECOMMERCE_CONFIG,
  INITIAL_ECOMMERCE_ORDERS,
  INITIAL_SALE_RETURNS,
  INITIAL_SUPPLIER_RETURNS,
  INITIAL_TASKS,
  INITIAL_LOAN_PLANS,
} from './initialData';
import { db } from './firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

const STORAGE_PREFIX = 'nova_erp_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    // Asynchronously sync key collections to Firestore when available
    try {
      const docRef = doc(db, 'nova_system_data', key);
      setDoc(docRef, { data: value, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch {
      // ignore
    }
  } catch (e) {
    console.warn(`Error saving ${key} to storage:`, e);
  }
}

export class ERPStore {
  private static instance: ERPStore;

  public settings: CompanySettings;
  public users: User[];
  public warehouses: Warehouse[];
  public categories: ProductCategory[];
  public brands: Brand[];
  public priceLists: PriceList[];
  public products: Product[];
  public combos: ProductCombo[];
  public clients: Client[];
  public suppliers: Supplier[];
  public sales: Sale[];
  public stockMovements: StockMovement[];
  public cashRegisters: CashRegister[];
  public cashSessions: CashRegisterSession[];
  public cashMovements: CashMovement[];
  public moneyBoxes: MoneyBox[];
  public clientAccountMovements: ClientAccountMovement[];
  public clientReceipts: ClientReceipt[];
  public loyaltyRewards: LoyaltyReward[];
  public loyaltyTransactions: LoyaltyTransaction[];
  public loyaltyRedemptions: LoyaltyRedemption[];
  public loyaltyRaffles: LoyaltyRaffle[];
  public loyaltyBonusRules: LoyaltyBonusRule[];
  public loyaltySurveys: LoyaltySurvey[];
  public loyaltyBranches: LoyaltyBranch[];
  public loyaltyConfig: LoyaltyConfig;
  public installmentPlans: InternalInstallmentPlan[];
  public installmentsConfig: InternalInstallmentsConfig;
  public serviceOrders: TechnicalServiceOrder[];
  public employees: Employee[];
  public employeeAdvances: EmployeeAdvance[];
  public employeePayments: EmployeePayment[];
  public employeeAbsences: EmployeeAbsence[];
  public employeeVacations: EmployeeVacation[];
  public employeeSpecialDates: EmployeeSpecialDate[];
  public fixedExpenses: FixedExpense[];
  public expenseCategories: ExpenseCategory[];
  public expenses: ExpenseRecord[];
  public checks: CheckWalletItem[];
  public currencyConfig: CurrencyConfig;
  public shippingCarriers: ShippingCarrier[];
  public messageTemplates: MessageTemplate[];
  public printConfigs: DocumentPrintConfig[];
  public remitos: Remito[];
  public quotes: Quote[];
  public stockTransfers: StockTransfer[];
  public purchaseOrders: PurchaseOrder[];
  public pendingPurchaseItems: PendingPurchaseItem[];
  public purchases: Purchase[];
  public supplierAccountMovements: SupplierAccountMovement[];
  public supplierPaymentOrders: SupplierPaymentOrder[];
  public ecommerceConfig: EcommerceConfig;
  public ecommerceOrders: EcommerceOrder[];
  public saleReturns: SaleReturn[];
  public supplierReturns: SupplierReturn[];
  public roles: RoleDefinition[];
  public systemModules: SystemModuleInfo[];
  public tasks: TaskItem[];
  public loanPlans: LoanPlan[];

  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.settings = getLocal('settings', INITIAL_COMPANY_SETTINGS);
    this.users = getLocal('users', INITIAL_USERS);
    this.roles = getLocal('roles', INITIAL_ROLES);
    this.systemModules = getLocal('systemModules', ALL_SYSTEM_MODULES);
    this.warehouses = getLocal('warehouses', INITIAL_WAREHOUSES);
    this.categories = getLocal('categories', INITIAL_CATEGORIES);
    this.brands = getLocal('brands', INITIAL_BRANDS);
    this.priceLists = getLocal('priceLists', INITIAL_PRICE_LISTS);
    const rawProducts = getLocal('products', INITIAL_PRODUCTS);
    // Normalize products so stockByWarehouse has valid warehouse IDs and stock is synchronized
    this.products = rawProducts.map((p) => {
      const stockByWh = { ...(p.stockByWarehouse || {}) };
      // Migrate legacy keys if present
      if (stockByWh['wh-central'] !== undefined && stockByWh['1'] === undefined) {
        stockByWh['1'] = stockByWh['wh-central'];
        delete stockByWh['wh-central'];
      }
      if (stockByWh['wh-sucursal'] !== undefined && stockByWh['2'] === undefined) {
        stockByWh['2'] = stockByWh['wh-sucursal'];
        delete stockByWh['wh-sucursal'];
      }
      if (stockByWh['wh-deposito'] !== undefined && stockByWh['4'] === undefined) {
        stockByWh['4'] = stockByWh['wh-deposito'];
        delete stockByWh['wh-deposito'];
      }
      if (stockByWh['wh-main'] !== undefined && stockByWh['1'] === undefined) {
        stockByWh['1'] = stockByWh['wh-main'];
        delete stockByWh['wh-main'];
      }
      // Ensure all warehouses exist
      this.warehouses.forEach((w) => {
        if (stockByWh[w.id] === undefined) {
          stockByWh[w.id] = 0;
        }
      });
      // Recalculate total stock from warehouse breakdown if warehouse entries exist, else default to p.stock
      const totalStock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
      return {
        ...p,
        stockByWarehouse: stockByWh,
        stock: totalStock > 0 || Object.keys(stockByWh).length > 0 ? totalStock : (p.stock || 0),
      };
    });
    this.combos = getLocal('combos', INITIAL_COMBOS);
    this.clients = getLocal('clients', INITIAL_CLIENTS);
    this.suppliers = getLocal('suppliers', INITIAL_SUPPLIERS);
    this.sales = getLocal('sales', []);
    this.stockMovements = getLocal('stockMovements', []);
    this.cashRegisters = getLocal('cashRegisters', INITIAL_CASH_REGISTERS);
    const defaultSessions = [
      {
        id: 'sess-mostrador',
        registerId: 'reg-mostrador',
        registerName: 'Caja mostrador',
        openedByUserId: 'user-1',
        openedByUserName: 'Carlos Mendoza',
        openedAt: '2026-08-28T20:13:00Z',
        initialCash: 0,
        expectedCash: 1741492.19,
        totalSalesCash: 160945.6,
        totalSalesCards: 2000.0,
        totalSalesTransfer: 1578546.59,
        totalSalesCurrentAccount: 190999.03,
        totalInflows: 1741492.19,
        totalOutflows: 0,
        status: 'open' as const,
      },
    ];
    let loadedSessions = getLocal('cashSessions', defaultSessions);
    if (!loadedSessions || loadedSessions.length === 0) {
      loadedSessions = defaultSessions;
    }
    // Ensure open register has matching open session
    this.cashRegisters.forEach((reg) => {
      if (reg.isOpen) {
        const hasOpen = loadedSessions.some((s: any) => s.registerId === reg.id && s.status === 'open');
        if (!hasOpen) {
          loadedSessions.unshift({
            id: `sess-${reg.id}-${Date.now()}`,
            registerId: reg.id,
            registerName: reg.name,
            openedByUserId: 'user-1',
            openedByUserName: 'Carlos Mendoza',
            openedAt: '2026-08-28T20:13:00Z',
            initialCash: 0,
            expectedCash: reg.currentBalance || 0,
            totalSalesCash: reg.id === 'reg-mostrador' ? 160945.6 : (reg.currentBalance || 0),
            totalSalesCards: reg.id === 'reg-mostrador' ? 2000.0 : 0,
            totalSalesTransfer: reg.id === 'reg-mostrador' ? 1578546.59 : 0,
            totalSalesCurrentAccount: reg.id === 'reg-mostrador' ? 190999.03 : 0,
            totalInflows: reg.currentBalance || 0,
            totalOutflows: 0,
            status: 'open',
          });
        }
      }
    });
    this.cashSessions = loadedSessions;
    this.cashMovements = getLocal('cashMovements', INITIAL_CASH_MOVEMENTS);
    this.moneyBoxes = getLocal('moneyBoxes', INITIAL_MONEY_BOXES);
    this.expenseCategories = getLocal('expenseCategories', INITIAL_EXPENSE_CATEGORIES);
    this.expenses = getLocal('expenses', []);
    this.checks = getLocal('checks', INITIAL_CHECKS);
    this.clientAccountMovements = getLocal('clientAccountMovements', [
      {
        id: 'cam-1',
        date: '2026-08-01T10:00:00Z',
        clientId: 'cli-aconcagua',
        clientName: 'Constructora Aconcagua S.A.',
        type: 'sale_debt',
        amount: 845200,
        balanceAfter: 845200,
        referenceType: 'sale',
        referenceId: 'VTA-HIST-01',
        concept: 'Compra Materiales Obra Torre Jardín - Factura A 0001-00012900',
        userId: 'user-1',
      },
      {
        id: 'cam-2',
        date: '2026-08-05T15:30:00Z',
        clientId: 'cli-taller-rossi',
        clientName: 'Taller Mecánico Rossi Hnos',
        type: 'sale_debt',
        amount: 195000,
        balanceAfter: 195000,
        referenceType: 'sale',
        referenceId: 'VTA-HIST-02',
        concept: 'Compra Insumos Taller - Remito 0001-00004910',
        userId: 'user-1',
      },
    ]);
    this.clientReceipts = getLocal('clientReceipts', []);
    this.loyaltyRewards = getLocal('loyaltyRewards', INITIAL_LOYALTY_REWARDS);
    this.loyaltyTransactions = getLocal('loyaltyTransactions', [
      {
        id: 'lt-1',
        date: '2026-08-02T11:00:00Z',
        clientId: 'cli-laura-vecina',
        clientName: 'Laura Fernandez',
        type: 'earned_sale',
        points: 1250,
        balanceAfter: 1250,
        referenceType: 'sale',
        referenceId: 'VTA-HIST-03',
        description: 'Puntos acreditados por compra en mostrador',
      },
      {
        id: 'lt-2',
        date: '2026-08-03T16:00:00Z',
        clientId: 'cli-martin-electrico',
        clientName: 'Martín Bossio (Instalaciones Eléctricas)',
        type: 'earned_sale',
        points: 480,
        balanceAfter: 480,
        referenceType: 'sale',
        referenceId: 'VTA-HIST-04',
        description: 'Puntos por compra de rollos de cables e insumos',
      },
    ]);
    this.loyaltyRedemptions = getLocal('loyaltyRedemptions', []);
    this.loyaltyRaffles = getLocal('loyaltyRaffles', [INITIAL_LOYALTY_RAFFLE]);
    this.loyaltyBonusRules = getLocal('loyaltyBonusRules', INITIAL_LOYALTY_BONUS_RULES);
    this.loyaltySurveys = getLocal('loyaltySurveys', INITIAL_LOYALTY_SURVEYS);
    this.loyaltyBranches = getLocal('loyaltyBranches', INITIAL_LOYALTY_BRANCHES);
    this.loyaltyConfig = getLocal('loyaltyConfig', INITIAL_LOYALTY_CONFIG);
    this.installmentPlans = getLocal('installmentPlans', INITIAL_INSTALLMENT_PLANS);
    this.installmentsConfig = getLocal('installmentsConfig', INITIAL_INSTALLMENTS_CONFIG);
    this.serviceOrders = getLocal('serviceOrders', INITIAL_SERVICE_ORDERS);
    this.employees = getLocal('employees', INITIAL_EMPLOYEES);
    this.employeeAdvances = getLocal('employeeAdvances', INITIAL_EMPLOYEE_ADVANCES);
    this.employeePayments = getLocal('employeePayments', INITIAL_EMPLOYEE_PAYMENTS);
    this.employeeAbsences = getLocal('employeeAbsences', INITIAL_EMPLOYEE_ABSENCES);
    this.employeeVacations = getLocal('employeeVacations', INITIAL_EMPLOYEE_VACATIONS);
    this.employeeSpecialDates = getLocal('employeeSpecialDates', INITIAL_EMPLOYEE_SPECIAL_DATES);
    this.fixedExpenses = getLocal('fixedExpenses', INITIAL_FIXED_EXPENSES);
    this.currencyConfig = getLocal('currencyConfig', INITIAL_CURRENCY_CONFIG);
    this.shippingCarriers = getLocal('shippingCarriers', INITIAL_SHIPPING_CARRIERS);
    this.messageTemplates = getLocal('messageTemplates', INITIAL_MESSAGE_TEMPLATES);
    this.printConfigs = getLocal('printConfigs', INITIAL_PRINT_CONFIGS);
    this.remitos = getLocal('remitos', INITIAL_REMITOS);
    this.quotes = getLocal('quotes', INITIAL_QUOTES);
    this.stockTransfers = getLocal('stockTransfers', INITIAL_STOCK_TRANSFERS);
    this.purchaseOrders = getLocal('purchaseOrders', INITIAL_PURCHASE_ORDERS);
    this.pendingPurchaseItems = getLocal('pendingPurchaseItems', INITIAL_PENDING_PURCHASE_ITEMS);
    const localPurchases = getLocal('purchases', INITIAL_PURCHASES);
    if (!localPurchases || localPurchases.length < INITIAL_PURCHASES.length) {
      const existingIds = new Set((localPurchases || []).map((p: any) => p.id));
      const merged = [...(localPurchases || [])];
      for (const initP of INITIAL_PURCHASES) {
        if (!existingIds.has(initP.id)) {
          merged.push(initP);
        }
      }
      this.purchases = merged;
      setLocal('purchases', this.purchases);
    } else {
      this.purchases = localPurchases;
    }
    this.supplierAccountMovements = getLocal('supplierAccountMovements', INITIAL_SUPPLIER_ACCOUNT_MOVEMENTS);
    this.supplierPaymentOrders = getLocal('supplierPaymentOrders', INITIAL_SUPPLIER_PAYMENT_ORDERS);
    this.ecommerceConfig = {
      ...INITIAL_ECOMMERCE_CONFIG,
      ...(getLocal('ecommerceConfig', INITIAL_ECOMMERCE_CONFIG) || {}),
      selectedCategoryIds:
        (getLocal('ecommerceConfig', INITIAL_ECOMMERCE_CONFIG) || {}).selectedCategoryIds ||
        INITIAL_ECOMMERCE_CONFIG.selectedCategoryIds,
      selectedMobileModules:
        (getLocal('ecommerceConfig', INITIAL_ECOMMERCE_CONFIG) || {}).selectedMobileModules ||
        INITIAL_ECOMMERCE_CONFIG.selectedMobileModules,
    };
    this.ecommerceOrders = getLocal('ecommerceOrders', INITIAL_ECOMMERCE_ORDERS) || INITIAL_ECOMMERCE_ORDERS;
    this.saleReturns = getLocal('saleReturns', INITIAL_SALE_RETURNS);
    this.supplierReturns = getLocal('supplierReturns', INITIAL_SUPPLIER_RETURNS);
    this.tasks = getLocal('tasks', INITIAL_TASKS);
    this.loanPlans = getLocal('loanPlans', INITIAL_LOAN_PLANS);

    this.tryCloudSync();
  }

  public static getInstance(): ERPStore {
    if (!ERPStore.instance) {
      ERPStore.instance = new ERPStore();
    }
    return ERPStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private async tryCloudSync() {
    if (typeof window === 'undefined') return;
    try {
      const colRef = collection(db, 'nova_system_data');
      onSnapshot(
        colRef,
        (snapshot) => {
          let hasChanges = false;
          snapshot.docChanges().forEach((change) => {
            const docId = change.doc.id;
            const docData = change.doc.data();
            if (docData && docData.data !== undefined) {
              const val = docData.data;
              switch (docId) {
                case 'settings':
                  this.settings = val;
                  hasChanges = true;
                  break;
                case 'users':
                  this.users = val;
                  hasChanges = true;
                  break;
                case 'warehouses':
                  this.warehouses = val;
                  hasChanges = true;
                  break;
                case 'categories':
                  this.categories = val;
                  hasChanges = true;
                  break;
                case 'brands':
                  this.brands = val;
                  hasChanges = true;
                  break;
                case 'priceLists':
                  this.priceLists = val;
                  hasChanges = true;
                  break;
                case 'products':
                  this.products = val;
                  hasChanges = true;
                  break;
                case 'combos':
                  this.combos = val;
                  hasChanges = true;
                  break;
                case 'clients':
                  this.clients = val;
                  hasChanges = true;
                  break;
                case 'suppliers':
                  this.suppliers = val;
                  hasChanges = true;
                  break;
                case 'sales':
                  this.sales = val;
                  hasChanges = true;
                  break;
                case 'stockMovements':
                  this.stockMovements = val;
                  hasChanges = true;
                  break;
                case 'cashRegisters':
                  this.cashRegisters = val;
                  hasChanges = true;
                  break;
                case 'cashSessions':
                  this.cashSessions = val;
                  hasChanges = true;
                  break;
                case 'cashMovements':
                  this.cashMovements = val;
                  hasChanges = true;
                  break;
                case 'moneyBoxes':
                  this.moneyBoxes = val;
                  hasChanges = true;
                  break;
                case 'clientAccountMovements':
                  this.clientAccountMovements = val;
                  hasChanges = true;
                  break;
                case 'clientReceipts':
                  this.clientReceipts = val;
                  hasChanges = true;
                  break;
                case 'loyaltyRewards':
                  this.loyaltyRewards = val;
                  hasChanges = true;
                  break;
                case 'loyaltyTransactions':
                  this.loyaltyTransactions = val;
                  hasChanges = true;
                  break;
                case 'loyaltyRedemptions':
                  this.loyaltyRedemptions = val;
                  hasChanges = true;
                  break;
                case 'loyaltyRaffles':
                  this.loyaltyRaffles = val;
                  hasChanges = true;
                  break;
                case 'installmentPlans':
                  this.installmentPlans = val;
                  hasChanges = true;
                  break;
                case 'loanPlans':
                  this.loanPlans = val;
                  hasChanges = true;
                  break;
                case 'serviceOrders':
                  this.serviceOrders = val;
                  hasChanges = true;
                  break;
                case 'employees':
                  this.employees = val;
                  hasChanges = true;
                  break;
                case 'employeeAdvances':
                  this.employeeAdvances = val;
                  hasChanges = true;
                  break;
                case 'employeePayments':
                  this.employeePayments = val;
                  hasChanges = true;
                  break;
                case 'employeeAbsences':
                  this.employeeAbsences = val;
                  hasChanges = true;
                  break;
                case 'employeeVacations':
                  this.employeeVacations = val;
                  hasChanges = true;
                  break;
                case 'employeeSpecialDates':
                  this.employeeSpecialDates = val;
                  hasChanges = true;
                  break;
                case 'fixedExpenses':
                  this.fixedExpenses = val;
                  hasChanges = true;
                  break;
                case 'currencyConfig':
                  this.currencyConfig = val;
                  hasChanges = true;
                  break;
                case 'shippingCarriers':
                  this.shippingCarriers = val;
                  hasChanges = true;
                  break;
                case 'messageTemplates':
                  this.messageTemplates = val;
                  hasChanges = true;
                  break;
                case 'printConfigs':
                  this.printConfigs = val;
                  hasChanges = true;
                  break;
                case 'remitos':
                  this.remitos = val;
                  hasChanges = true;
                  break;
                case 'quotes':
                  this.quotes = val;
                  hasChanges = true;
                  break;
                case 'stockTransfers':
                  this.stockTransfers = val;
                  hasChanges = true;
                  break;
                case 'purchases':
                  this.purchases = val;
                  hasChanges = true;
                  break;
                case 'supplierAccountMovements':
                  this.supplierAccountMovements = val;
                  hasChanges = true;
                  break;
                case 'supplierPaymentOrders':
                  this.supplierPaymentOrders = val;
                  hasChanges = true;
                  break;
                case 'saleReturns':
                  this.saleReturns = val;
                  hasChanges = true;
                  break;
                case 'supplierReturns':
                  this.supplierReturns = val;
                  hasChanges = true;
                  break;
              }
              try {
                localStorage.setItem(STORAGE_PREFIX + docId, JSON.stringify(val));
              } catch {
                // ignore
              }
            }
          });
          if (hasChanges) {
            this.notify();
          }
        },
        (error) => {
          // Gracefully fallback to local storage persistence during offline/transient periods
          const msg = error instanceof Error ? error.message : String(error);
          if (!msg.includes('unavailable') && !msg.includes('offline')) {
            console.warn('Firestore real-time sync status:', msg);
          }
        }
      );
    } catch (e) {
      console.warn('Cloud sync init error:', e);
    }
  }

  // ==========================================
  // TRANSACTIONAL SALES LOGIC
  // ==========================================
  public processSale(params: {
    clientId: string;
    warehouseId: string;
    sellerId: string;
    sellerName: string;
    priceListId: string;
    items: SaleItem[];
    discountAmount: number;
    payments: SalePayment[];
    documentType: DocumentType;
    notes?: string;
    user: User;
  }): Sale {
    const client = this.clients.find((c) => c.id === params.clientId) || this.clients[0];
    const subtotal = params.items.reduce((acc, item) => acc + item.subtotal, 0);
    const total = Math.max(0, subtotal - params.discountAmount);
    const vatAmount = params.items.reduce((acc, item) => {
      const itemNet = item.subtotal / (1 + item.vatRate / 100);
      return acc + (item.subtotal - itemNet);
    }, 0);

    const saleIndex = this.sales.length + 1;
    const saleCode = `VTA-${new Date().getFullYear()}-${String(saleIndex).padStart(6, '0')}`;
    const invoiceNumber = `0001-${String(saleIndex).padStart(8, '0')}`;

    // 1. Stock deduction
    const newProducts = [...this.products];
    const newStockMovements: StockMovement[] = [...this.stockMovements];
    const effectiveWarehouseId = params.warehouseId || this.warehouses.find((w) => w.isMain)?.id || this.warehouses[0]?.id || '1';

    for (const item of params.items) {
      const prodIdx = newProducts.findIndex((p) => p.id === item.productId);
      if (prodIdx >= 0) {
        const prod = { ...newProducts[prodIdx] };
        const prevStock = prod.stock || 0;
        
        const stockByWh = { ...(prod.stockByWarehouse || {}) };
        this.warehouses.forEach((w) => {
          if (stockByWh[w.id] === undefined) stockByWh[w.id] = 0;
        });

        const currentWhStock = stockByWh[effectiveWarehouseId] ?? 0;
        stockByWh[effectiveWarehouseId] = Math.max(0, currentWhStock - item.quantity);
        prod.stockByWarehouse = stockByWh;
        
        // Recalculate total product stock across all warehouses
        prod.stock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
        newProducts[prodIdx] = prod;

        newStockMovements.push({
          id: `sm-${Date.now()}-${item.productId}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          warehouseId: effectiveWarehouseId,
          warehouseName: this.warehouses.find((w) => w.id === effectiveWarehouseId)?.name || 'Casa Central',
          type: 'sale',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stock,
          referenceType: 'sale',
          referenceId: saleCode,
          reason: `Venta mostrador ${saleCode}`,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
    }
    this.products = newProducts;
    setLocal('products', this.products);
    this.stockMovements = newStockMovements;
    setLocal('stockMovements', this.stockMovements);

    // 2. Fiscal authorization simulation/real
    const isFiscal = ['factura_a', 'factura_b', 'factura_c'].includes(params.documentType);
    const mockCae = isFiscal ? `74389102938${Math.floor(100 + Math.random() * 900)}` : undefined;
    const caeDate = new Date();
    caeDate.setDate(caeDate.getDate() + 10);

    const fiscalData = {
      cae: mockCae,
      caeExpiresAt: mockCae ? caeDate.toISOString().split('T')[0] : undefined,
      invoiceNumber,
      invoiceType: params.documentType,
      pointOfSale: this.settings.fiscalPointOfSale,
      fiscalStatus: isFiscal ? ('authorized' as const) : ('not_fiscal' as const),
      qrData: isFiscal
        ? `https://www.afip.gob.ar/fe/qr/?p=${btoa(
            JSON.stringify({
              ver: 1,
              fecha: new Date().toISOString().split('T')[0],
              cuit: this.settings.cuit.replace(/-/g, ''),
              ptoVta: this.settings.fiscalPointOfSale,
              tipoCmp: params.documentType === 'factura_a' ? 1 : params.documentType === 'factura_b' ? 6 : 11,
              nroCmp: saleIndex,
              importe: total,
              moneda: 'PES',
              ctz: 1,
              tipoDocRec: client.taxCondition === 'Responsable Inscripto' ? 80 : 96,
              nroDocRec: client.taxId.replace(/-/g, ''),
              tipoCodAut: 'E',
              codAut: mockCae,
            })
          )}`
        : undefined,
      authorizedAt: isFiscal ? new Date().toISOString() : undefined,
    };

    // 3. Payments handling & Cash Sessions
    // Find active session for this branch or user's assigned cash register
    const branchRegisters = this.cashRegisters.filter((r) => r.branchId === params.warehouseId);
    const branchRegisterIds = branchRegisters.map((r) => r.id);
    let activeSession = this.cashSessions.find(
      (s) => s.status === 'open' && (branchRegisterIds.includes(s.registerId) || s.registerId === params.user.assignedCashRegisterId)
    );
    if (!activeSession) {
      // Fallback to any open session
      activeSession = this.cashSessions.find((s) => s.status === 'open');
    }

    let cashPaid = 0;
    let cardPaid = 0;
    let transferPaid = 0;
    let currentAccountAmount = 0;

    params.payments.forEach((p) => {
      if (p.method === 'cash') cashPaid += p.amount;
      else if (p.method === 'debit_card' || p.method === 'credit_card') cardPaid += p.amount;
      else if (p.method === 'bank_transfer' || p.method === 'mercadopago_qr') transferPaid += p.amount;
      else if (p.method === 'current_account') currentAccountAmount += p.amount;
    });

    if (activeSession) {
      activeSession.totalSalesCash += cashPaid;
      activeSession.totalSalesCards += cardPaid;
      activeSession.totalSalesTransfer += transferPaid;
      activeSession.totalSalesCurrentAccount += currentAccountAmount;
      // STRICT RULE: expectedCash only counts 'cash' payments
      activeSession.expectedCash += cashPaid;

      if (cashPaid > 0) {
        this.cashMovements.push({
          id: `cm-${Date.now()}-cash`,
          date: new Date().toISOString(),
          sessionId: activeSession.id,
          boxId: activeSession.registerId,
          type: 'sale_inflow',
          paymentMethod: 'cash',
          amount: cashPaid,
          concept: `Cobro Venta ${saleCode} (Efectivo)`,
          referenceType: 'sale',
          referenceId: saleCode,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
      setLocal('cashSessions', this.cashSessions);
      setLocal('cashMovements', this.cashMovements);
    }

    // 4. Client Current Account debit (if payment method includes current_account / no_pago)
    if (currentAccountAmount > 0) {
      const clientIdx = this.clients.findIndex((c) => c.id === client.id);
      if (clientIdx >= 0) {
        const updatedClient = { ...this.clients[clientIdx] };
        updatedClient.currentBalance += currentAccountAmount;
        this.clients[clientIdx] = updatedClient;
        setLocal('clients', this.clients);

        this.clientAccountMovements.push({
          id: `cam-${Date.now()}`,
          date: new Date().toISOString(),
          clientId: client.id,
          clientName: client.name,
          type: 'sale_debt',
          amount: currentAccountAmount,
          balanceAfter: updatedClient.currentBalance,
          referenceType: 'sale',
          referenceId: saleCode,
          concept: `Venta a cuenta corriente ${saleCode} (${params.documentType.toUpperCase()})`,
          userId: params.user.id,
        });
        setLocal('clientAccountMovements', this.clientAccountMovements);
      }
    }

    // 5. Loyalty Points Logic
    // STRICT BUSINESS RULES:
    // - pointsPerCurrency = 0.01 (1 pt per $100)
    // - Clients with hasCurrentAccount === true are STRICTLY EXCLUDED from loyalty points
    // - Payments with 'current_account' (no_pago) do NOT generate points
    let pointsEarned = 0;
    const eligibleAmount = total - currentAccountAmount;

    if (!client.hasCurrentAccount && client.loyaltyEligible && eligibleAmount > 0) {
      pointsEarned = Math.floor(eligibleAmount * (this.settings.pointsPerCurrency || 0.01));

      if (pointsEarned > 0) {
        const clientIdx = this.clients.findIndex((c) => c.id === client.id);
        if (clientIdx >= 0) {
          const updatedClient = { ...this.clients[clientIdx] };
          updatedClient.loyaltyPoints = (updatedClient.loyaltyPoints || 0) + pointsEarned;
          // Update Tier
          if (updatedClient.loyaltyPoints >= 2000) updatedClient.loyaltyTier = 'Platino';
          else if (updatedClient.loyaltyPoints >= 1000) updatedClient.loyaltyTier = 'Oro';
          else if (updatedClient.loyaltyPoints >= 300) updatedClient.loyaltyTier = 'Plata';
          else updatedClient.loyaltyTier = 'Bronce';

          this.clients[clientIdx] = updatedClient;
          setLocal('clients', this.clients);

          this.loyaltyTransactions.push({
            id: `lt-${Date.now()}`,
            date: new Date().toISOString(),
            clientId: client.id,
            clientName: client.name,
            type: 'earned_sale',
            points: pointsEarned,
            balanceAfter: updatedClient.loyaltyPoints,
            referenceType: 'sale',
            referenceId: saleCode,
            description: `Puntos por venta ${saleCode} ($${eligibleAmount.toLocaleString('es-AR')})`,
            userId: params.user.id,
          });
          setLocal('loyaltyTransactions', this.loyaltyTransactions);
        }
      }
    }

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      code: saleCode,
      date: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      clientTaxId: client.taxId,
      clientTaxCondition: client.taxCondition,
      warehouseId: params.warehouseId,
      sellerId: params.sellerId,
      sellerName: params.sellerName,
      priceListId: params.priceListId,
      items: params.items,
      subtotal,
      discountAmount: params.discountAmount,
      vatAmount,
      total,
      payments: params.payments,
      paymentStatus: currentAccountAmount > 0 ? (cashPaid + cardPaid + transferPaid > 0 ? 'partial' : 'pending_account') : 'paid',
      documentType: params.documentType,
      fiscalData,
      cashRegisterSessionId: activeSession?.id,
      loyaltyPointsEarned: pointsEarned,
      notes: params.notes,
      status: 'completed',
    };

    this.sales.unshift(newSale);
    setLocal('sales', this.sales);
    this.notify();
    return newSale;
  }

  // ==========================================
  // REFUND / DEVOLUCIÓN DE VENTA
  // ==========================================
  public processRefund(saleId: string, reason: string, user: User): boolean {
    const saleIdx = this.sales.findIndex((s) => s.id === saleId);
    if (saleIdx < 0) return false;
    const sale = this.sales[saleIdx];
    if (sale.status === 'refunded') return false;

    // 1. Restore product stock
    const newProducts = [...this.products];
    const newMovements = [...this.stockMovements];
    const effectiveWarehouseId = sale.warehouseId || this.warehouses.find((w) => w.isMain)?.id || this.warehouses[0]?.id || '1';

    for (const item of sale.items) {
      const pIdx = newProducts.findIndex((p) => p.id === item.productId);
      if (pIdx >= 0) {
        const prod = { ...newProducts[pIdx] };
        const prev = prod.stock || 0;
        const stockByWh = { ...(prod.stockByWarehouse || {}) };
        this.warehouses.forEach((w) => {
          if (stockByWh[w.id] === undefined) stockByWh[w.id] = 0;
        });
        const whStock = stockByWh[effectiveWarehouseId] || 0;
        stockByWh[effectiveWarehouseId] = whStock + item.quantity;
        prod.stockByWarehouse = stockByWh;
        prod.stock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
        newProducts[pIdx] = prod;

        newMovements.push({
          id: `sm-ref-${Date.now()}-${item.productId}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          warehouseId: effectiveWarehouseId,
          warehouseName: this.warehouses.find((w) => w.id === effectiveWarehouseId)?.name || 'Casa Central',
          type: 'return',
          quantity: item.quantity,
          previousStock: prev,
          newStock: prod.stock,
          referenceType: 'sale',
          referenceId: sale.code,
          reason: `Devolución venta ${sale.code}: ${reason}`,
          userId: user.id,
          userName: user.name,
        });
      }
    }
    this.products = newProducts;
    setLocal('products', this.products);
    this.stockMovements = newMovements;
    setLocal('stockMovements', this.stockMovements);

    // 2. Adjust client balance if was on current account
    const ctaCtePayment = sale.payments.find((p) => p.method === 'current_account');
    if (ctaCtePayment) {
      const cliIdx = this.clients.findIndex((c) => c.id === sale.clientId);
      if (cliIdx >= 0) {
        const cl = { ...this.clients[cliIdx] };
        cl.currentBalance = Math.max(0, cl.currentBalance - ctaCtePayment.amount);
        this.clients[cliIdx] = cl;
        setLocal('clients', this.clients);

        this.clientAccountMovements.push({
          id: `cam-ref-${Date.now()}`,
          date: new Date().toISOString(),
          clientId: cl.id,
          clientName: cl.name,
          type: 'return_credit',
          amount: ctaCtePayment.amount,
          balanceAfter: cl.currentBalance,
          referenceType: 'refund',
          referenceId: sale.code,
          concept: `Nota de Crédito por Devolución ${sale.code}`,
          userId: user.id,
        });
        setLocal('clientAccountMovements', this.clientAccountMovements);
      }
    }

    // 3. Mark sale as refunded
    sale.status = 'refunded';
    sale.cancelledAt = new Date().toISOString();
    sale.cancelledReason = reason;
    this.sales[saleIdx] = sale;
    setLocal('sales', this.sales);

    // 4. Register in saleReturns collection
    const returnCount = (this.saleReturns?.length || 0) + 1;
    const returnCode = `DEV-VTA-0001-${String(returnCount).padStart(8, '0')}`;
    const returnRecord: SaleReturn = {
      id: `dev-vta-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: returnCode,
      date: new Date().toISOString(),
      saleId: sale.id,
      saleCode: sale.code,
      clientId: sale.clientId,
      clientName: sale.clientName,
      clientTaxId: sale.clientTaxId,
      items: sale.items.map((it) => ({
        productId: it.productId,
        productCode: it.productCode,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.quantity * it.unitPrice,
        disposition: 'restock',
        warehouseId: effectiveWarehouseId,
      })),
      total: sale.total,
      reason,
      refundMethod: ctaCtePayment ? 'current_account' : 'cash',
      creditNoteNumber: `NC-0001-${String(Date.now()).slice(-8)}`,
      warehouseId: effectiveWarehouseId,
      warehouseName: this.warehouses.find((w) => w.id === effectiveWarehouseId)?.name || 'Casa Central',
      userId: user.id,
      userName: user.name,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    this.saleReturns = [returnRecord, ...(this.saleReturns || [])];
    setLocal('saleReturns', this.saleReturns);

    this.notify();
    return true;
  }

  // ==========================================
  // BORRAR / ELIMINAR VENTA PERMANENTEMENTE
  // ==========================================
  public deleteSale(
    saleId: string,
    options?: { restoreStock?: boolean; user?: User; reason?: string }
  ): boolean {
    const saleIdx = this.sales.findIndex((s) => s.id === saleId);
    if (saleIdx < 0) return false;

    const sale = this.sales[saleIdx];
    const restoreStock = options?.restoreStock !== false;
    const user = options?.user || this.users[0];
    const reason = options?.reason || 'Eliminación manual de venta';
    const effectiveWarehouseId = sale.warehouseId || this.warehouses[0]?.id || '1';

    // 1. Reponer stock en depósito si corresponde
    if (restoreStock && sale.status === 'completed') {
      const newProducts = [...this.products];
      const newMovements = [...this.stockMovements];

      for (const item of sale.items) {
        const pIdx = newProducts.findIndex((p) => p.id === item.productId);
        if (pIdx >= 0) {
          const prod = { ...newProducts[pIdx] };
          const prev = prod.stock || 0;
          const stockByWh = { ...(prod.stockByWarehouse || {}) };
          this.warehouses.forEach((w) => {
            if (stockByWh[w.id] === undefined) stockByWh[w.id] = 0;
          });
          const whStock = stockByWh[effectiveWarehouseId] || 0;
          stockByWh[effectiveWarehouseId] = whStock + item.quantity;
          prod.stockByWarehouse = stockByWh;
          prod.stock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
          newProducts[pIdx] = prod;

          newMovements.push({
            id: `sm-del-${Date.now()}-${item.productId}-${Math.random().toString(36).substr(2, 4)}`,
            date: new Date().toISOString(),
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            warehouseId: effectiveWarehouseId,
            warehouseName: this.warehouses.find((w) => w.id === effectiveWarehouseId)?.name || 'Casa Central',
            type: 'return',
            quantity: item.quantity,
            previousStock: prev,
            newStock: prod.stock,
            referenceType: 'sale',
            referenceId: sale.code,
            reason: `Restitución por borrado de venta ${sale.code}: ${reason}`,
            userId: user.id,
            userName: user.name,
          });
        }
      }
      this.products = newProducts;
      setLocal('products', this.products);
      this.stockMovements = newMovements;
      setLocal('stockMovements', this.stockMovements);
    }

    // 2. Revertir saldo deudor en cuenta corriente si aplicaba
    const ctaCtePayment = sale.payments.find((p) => p.method === 'current_account');
    if (ctaCtePayment && sale.status === 'completed') {
      const cliIdx = this.clients.findIndex((c) => c.id === sale.clientId);
      if (cliIdx >= 0) {
        const cl = { ...this.clients[cliIdx] };
        cl.currentBalance = Math.max(0, cl.currentBalance - ctaCtePayment.amount);
        this.clients[cliIdx] = cl;
        setLocal('clients', this.clients);

        this.clientAccountMovements.push({
          id: `cam-del-${Date.now()}`,
          date: new Date().toISOString(),
          clientId: cl.id,
          clientName: cl.name,
          type: 'return_credit',
          amount: ctaCtePayment.amount,
          balanceAfter: cl.currentBalance,
          referenceType: 'refund',
          referenceId: sale.code,
          concept: `Reversión por eliminación de venta ${sale.code}`,
          userId: user.id,
        });
        setLocal('clientAccountMovements', this.clientAccountMovements);
      }
    }

    // 3. Eliminar la venta de la colección
    this.sales = this.sales.filter((s) => s.id !== saleId);
    setLocal('sales', this.sales);

    this.notify();
    return true;
  }

  // ==========================================
  // FACTURACIÓN ELECTRÓNICA DIRECTA DE VENTA
  // ==========================================
  public emitElectronicInvoiceForSale(params: {
    saleId: string;
    documentType: DocumentType;
    pointOfSale?: number;
    clientId?: string;
    clientName?: string;
    clientTaxId?: string;
    clientTaxCondition?: string;
    notes?: string;
  }): Sale | null {
    const saleIdx = this.sales.findIndex((s) => s.id === params.saleId);
    if (saleIdx < 0) return null;
    const sale = { ...this.sales[saleIdx] };

    const ptoVta = params.pointOfSale || this.settings.fiscalPointOfSale || 1;

    // Calculate sequential number for this doc type
    const countFiscal =
      this.sales.filter(
        (s) => s.documentType === params.documentType && s.fiscalData?.cae
      ).length + 1;

    let letter = 'B';
    let tipoCmp = 6;
    if (params.documentType === 'factura_a') {
      letter = 'A';
      tipoCmp = 1;
    } else if (params.documentType === 'factura_c') {
      letter = 'C';
      tipoCmp = 11;
    } else if (params.documentType === 'factura_b') {
      letter = 'B';
      tipoCmp = 6;
    }

    const invoiceNumber = `${letter}-${String(ptoVta).padStart(4, '0')}-${String(countFiscal).padStart(8, '0')}`;
    const mockCae = `74389102938${Math.floor(1000 + Math.random() * 9000)}`;
    const caeDate = new Date();
    caeDate.setDate(caeDate.getDate() + 10);

    const clientTaxId = (params.clientTaxId || sale.clientTaxId || '20-00000000-0').replace(/-/g, '');
    const companyCuit = (this.settings.cuit || '30-71234567-8').replace(/-/g, '');

    const fiscalData: ElectronicInvoice = {
      cae: mockCae,
      caeExpiresAt: caeDate.toISOString().split('T')[0],
      invoiceNumber,
      invoiceType: params.documentType,
      pointOfSale: ptoVta,
      fiscalStatus: 'authorized',
      authorizedAt: new Date().toISOString(),
      qrData: `https://www.afip.gob.ar/fe/qr/?p=${btoa(
        JSON.stringify({
          ver: 1,
          fecha: new Date().toISOString().split('T')[0],
          cuit: companyCuit,
          ptoVta: ptoVta,
          tipoCmp,
          nroCmp: countFiscal,
          importe: sale.total,
          moneda: 'PES',
          ctz: 1,
          tipoDocRec:
            (params.clientTaxCondition || sale.clientTaxCondition) === 'Responsable Inscripto'
              ? 80
              : 96,
          nroDocRec: clientTaxId,
          tipoCodAut: 'E',
          codAut: mockCae,
        })
      )}`,
    };

    sale.documentType = params.documentType;
    sale.fiscalData = fiscalData;
    if (params.clientName) sale.clientName = params.clientName;
    if (params.clientTaxId) sale.clientTaxId = params.clientTaxId;
    if (params.clientTaxCondition) sale.clientTaxCondition = params.clientTaxCondition;
    if (params.notes) sale.notes = (sale.notes ? sale.notes + ' | ' : '') + params.notes;

    this.sales[saleIdx] = sale;
    setLocal('sales', this.sales);
    this.notify();
    return sale;
  }

  // ==========================================
  // COBRANZAS CTA CTE / CLIENT RECEIPTS
  // ==========================================
  public registerClientReceipt(params: {
    clientId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    destinationBoxId: string;
    date?: string;
    paymentMethodsDetail?: { method: PaymentMethod; boxId: string; amount: number }[];
    retainedTaxes?: number;
    retainedTaxesDetail?: { type: string; certificateNumber: string; date: string; amount: number }[];
    appliedToSales?: { saleId: string; saleCode: string; amountApplied: number }[];
    notes?: string;
    user: User;
  }): ClientReceipt {
    const client = this.clients.find((c) => c.id === params.clientId)!;
    const receiptIndex = this.clientReceipts.length + 1;
    const receiptNumber = `REC-0001-${String(receiptIndex).padStart(8, '0')}`;
    const effectiveDate = params.date || new Date().toISOString();

    const totalRetained = params.retainedTaxes || 0;
    const totalAmount = params.amount; // total receipt (money paid + retentions)

    // Decrement client debt by totalAmount (money + retentions)
    const clientIdx = this.clients.findIndex((c) => c.id === client.id);
    if (clientIdx >= 0) {
      const cl = { ...this.clients[clientIdx] };
      cl.currentBalance = Math.max(0, cl.currentBalance - totalAmount);
      this.clients[clientIdx] = cl;
      setLocal('clients', this.clients);

      // Detailed concept for client account movements showing payments and retentions
      const payDesc = params.paymentMethodsDetail && params.paymentMethodsDetail.length > 0
        ? params.paymentMethodsDetail.map(p => `${p.method.toUpperCase()} $${p.amount.toLocaleString('es-AR')}`).join(', ')
        : `${params.paymentMethod.toUpperCase()} $${Math.max(0, totalAmount - totalRetained)}`;

      const retDesc = params.retainedTaxesDetail && params.retainedTaxesDetail.length > 0
        ? ` | Retenciones: ` + params.retainedTaxesDetail.map(r => `${r.type} ($${r.amount.toLocaleString('es-AR')})`).join(', ')
        : '';

      this.clientAccountMovements.push({
        id: `cam-rec-${Date.now()}`,
        date: effectiveDate,
        clientId: cl.id,
        clientName: cl.name,
        type: 'payment_credit',
        amount: totalAmount,
        balanceAfter: cl.currentBalance,
        referenceType: 'receipt',
        referenceId: receiptNumber,
        concept: `Recibo ${receiptNumber} - Pagos: [${payDesc}]${retDesc}`,
        receiptNumber,
        userId: params.user.id,
      });
      setLocal('clientAccountMovements', this.clientAccountMovements);
    }

    // Process payment methods (actual money entering cash / bank / etc., excluding retenciones certificates)
    const paymentRows = params.paymentMethodsDetail && params.paymentMethodsDetail.length > 0
      ? params.paymentMethodsDetail
      : [{ method: params.paymentMethod, boxId: params.destinationBoxId, amount: Math.max(0, totalAmount - totalRetained) }];

    for (const pRow of paymentRows) {
      if (pRow.amount <= 0) continue;
      if (pRow.boxId.startsWith('reg-')) {
        const activeSession = this.cashSessions.find((s) => s.status === 'open' && s.registerId === pRow.boxId);
        if (activeSession) {
          if (pRow.method === 'cash') {
            activeSession.expectedCash += pRow.amount;
          }
          activeSession.totalInflows += pRow.amount;
          setLocal('cashSessions', this.cashSessions);

          this.cashMovements.push({
            id: `cm-rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            date: effectiveDate,
            sessionId: activeSession.id,
            boxId: activeSession.registerId,
            type: 'client_payment',
            paymentMethod: pRow.method,
            amount: pRow.amount,
            concept: `Cobro Recibo ${receiptNumber} - ${client.name}`,
            referenceType: 'client_receipt',
            referenceId: receiptNumber,
            userId: params.user.id,
            userName: params.user.name,
          });
          setLocal('cashMovements', this.cashMovements);
        }
      } else if (pRow.boxId.startsWith('mb-')) {
        const mbIdx = this.moneyBoxes.findIndex((m) => m.id === pRow.boxId);
        if (mbIdx >= 0) {
          const mb = { ...this.moneyBoxes[mbIdx] };
          mb.currentBalance += pRow.amount;
          this.moneyBoxes[mbIdx] = mb;
          setLocal('moneyBoxes', this.moneyBoxes);
        }
      }
    }

    // Update applied sales status if provided
    if (params.appliedToSales && params.appliedToSales.length > 0) {
      for (const appSale of params.appliedToSales) {
        const sIdx = this.sales.findIndex((s) => s.id === appSale.saleId || s.code === appSale.saleCode);
        if (sIdx >= 0) {
          const s = { ...this.sales[sIdx] };
          s.paymentStatus = 'paid';
          this.sales[sIdx] = s;
        }
      }
      setLocal('sales', this.sales);
    }

    const receipt: ClientReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber,
      date: effectiveDate,
      clientId: client.id,
      clientName: client.name,
      totalAmount: totalAmount,
      paymentMethod: params.paymentMethod,
      destinationBoxId: params.destinationBoxId,
      paymentMethodsDetail: params.paymentMethodsDetail,
      retainedTaxes: totalRetained,
      retainedTaxesDetail: params.retainedTaxesDetail,
      appliedToSales: params.appliedToSales || [],
      notes: params.notes,
      userId: params.user.id,
    };

    this.clientReceipts.unshift(receipt);
    setLocal('clientReceipts', this.clientReceipts);
    this.notify();
    return receipt;
  }

  public addManualClientAccountMovement(params: {
    clientId: string;
    type: 'adjustment_debit' | 'adjustment_credit';
    amount: number;
    concept: string;
    documentNumber?: string;
    date?: string;
    user: User;
  }): ClientAccountMovement | null {
    const clientIdx = this.clients.findIndex((c) => c.id === params.clientId);
    if (clientIdx < 0) return null;

    const cl = { ...this.clients[clientIdx] };
    const effectiveDate = params.date || new Date().toISOString();

    if (params.type === 'adjustment_debit') {
      cl.currentBalance += params.amount;
    } else {
      cl.currentBalance = Math.max(0, cl.currentBalance - params.amount);
    }

    this.clients[clientIdx] = cl;
    setLocal('clients', this.clients);

    const movement: ClientAccountMovement = {
      id: `cam-manual-${Date.now()}`,
      date: effectiveDate,
      clientId: cl.id,
      clientName: cl.name,
      type: params.type,
      amount: params.amount,
      balanceAfter: cl.currentBalance,
      referenceType: 'manual',
      referenceId: params.documentNumber,
      concept: params.concept || (params.type === 'adjustment_debit' ? 'Débito Manual' : 'Crédito Manual'),
      receiptNumber: params.documentNumber,
      userId: params.user.id,
    };

    this.clientAccountMovements.push(movement);
    setLocal('clientAccountMovements', this.clientAccountMovements);
    this.notify();
    return movement;
  }

  // ==========================================
  // CASH REGISTER CLOSING & OPENING
  // ==========================================
  public closeCashSession(
    sessionId: string,
    actualCash: number,
    notes: string,
    user: User,
    destinationMoneyBoxId?: string
  ): CashRegisterSession | null {
    const sessionIdx = this.cashSessions.findIndex((s) => s.id === sessionId);
    if (sessionIdx < 0) return null;

    const session = { ...this.cashSessions[sessionIdx] };
    session.closedByUserId = user.id;
    session.closedByUserName = user.name;
    session.closedAt = new Date().toISOString();
    session.actualCash = actualCash;
    session.cashDifference = actualCash - session.expectedCash;
    session.status = 'closed';
    session.notes = notes;

    this.cashSessions[sessionIdx] = session;
    setLocal('cashSessions', this.cashSessions);

    // Update cash register state
    const regIdx = this.cashRegisters.findIndex((r) => r.id === session.registerId);
    let branchId = '1';
    let branchName = 'Casa Central';
    if (regIdx >= 0) {
      branchId = this.cashRegisters[regIdx].branchId || '1';
      this.cashRegisters[regIdx].isOpen = false;
      this.cashRegisters[regIdx].currentSessionId = undefined;
      setLocal('cashRegisters', this.cashRegisters);
    }
    const wh = this.warehouses.find((w) => w.id === branchId);
    if (wh) branchName = wh.name;

    // Strict rule: Deposit/transfer actual cash count to the branch's specific Money Box
    let targetBox = this.moneyBoxes.find((mb) => destinationMoneyBoxId ? mb.id === destinationMoneyBoxId : mb.branchId === branchId);
    
    // If no money box found for this branch, find or create one
    if (!targetBox) {
      if (branchId === '1' || branchId === 'wh-main') {
        targetBox = this.moneyBoxes.find((mb) => mb.id === 'mb-central') || this.moneyBoxes[0];
      } else {
        const newMb: MoneyBox = {
          id: `mb-${branchId}`,
          name: `Caja de Dinero / Tesorería - ${branchName}`,
          branchId: branchId,
          type: 'physical_box',
          currency: 'ARS',
          currentBalance: 0,
          active: true,
        };
        this.moneyBoxes.push(newMb);
        targetBox = newMb;
        setLocal('moneyBoxes', this.moneyBoxes);
      }
    }

    if (targetBox && actualCash > 0) {
      const targetBoxIdx = this.moneyBoxes.findIndex((mb) => mb.id === targetBox!.id);
      if (targetBoxIdx >= 0) {
        const mb = { ...this.moneyBoxes[targetBoxIdx] };
        mb.currentBalance += actualCash;
        this.moneyBoxes[targetBoxIdx] = mb;
        setLocal('moneyBoxes', this.moneyBoxes);

        this.cashMovements.push({
          id: `cm-close-${Date.now()}`,
          date: new Date().toISOString(),
          sessionId: session.id,
          boxId: mb.id,
          type: 'transfer',
          paymentMethod: 'cash',
          amount: actualCash,
          concept: `Cierre Arqueo ${session.registerName} (${branchName}) -> Ingreso a ${mb.name}`,
          referenceType: 'sale',
          referenceId: session.id,
          userId: user.id,
          userName: user.name,
        });
        setLocal('cashMovements', this.cashMovements);
      }
    }

    this.notify();
    return session;
  }

  public saveWarehouse(warehouse: Warehouse): void {
    const idx = this.warehouses.findIndex((w) => w.id === warehouse.id);
    if (warehouse.isMain) {
      this.warehouses.forEach((w) => {
        if (w.id !== warehouse.id) w.isMain = false;
      });
    }

    if (idx >= 0) {
      this.warehouses[idx] = warehouse;
    } else {
      this.warehouses.push(warehouse);

      // Initialize stock for all products in this new warehouse
      this.products = this.products.map((prod) => {
        const stockByWh = { ...(prod.stockByWarehouse || {}) };
        if (stockByWh[warehouse.id] === undefined) {
          stockByWh[warehouse.id] = 0;
        }
        return {
          ...prod,
          stockByWarehouse: stockByWh,
        };
      });
      setLocal('products', this.products);

      // Create default Cash Register for this branch if not exists
      const existingReg = this.cashRegisters.find((r) => r.branchId === warehouse.id);
      if (!existingReg) {
        const newReg: CashRegister = {
          id: `reg-${warehouse.id}`,
          name: `Caja Mostrador - ${warehouse.name}`,
          code: `CAJA-${warehouse.code || warehouse.id}`,
          branchId: warehouse.id,
          isOpen: false,
          active: true,
          currentBalance: 0,
        };
        this.cashRegisters.push(newReg);
        setLocal('cashRegisters', this.cashRegisters);
      }

      // Create default Money Box (Caja de Dinero) for this branch
      const existingMb = this.moneyBoxes.find((m) => m.branchId === warehouse.id);
      if (!existingMb) {
        const newMb: MoneyBox = {
          id: `mb-${warehouse.id}`,
          name: `Caja Fuerte / Tesorería - ${warehouse.name}`,
          branchId: warehouse.id,
          type: 'physical_box',
          currency: 'ARS',
          currentBalance: 0,
          active: true,
        };
        this.moneyBoxes.push(newMb);
        setLocal('moneyBoxes', this.moneyBoxes);
      }
    }

    setLocal('warehouses', this.warehouses);
    this.notify();
  }

  public deleteWarehouse(id: string): boolean {
    const wh = this.warehouses.find((w) => w.id === id);
    if (!wh || wh.isMain) return false;
    this.warehouses = this.warehouses.filter((w) => w.id !== id);
    setLocal('warehouses', this.warehouses);
    this.notify();
    return true;
  }

  public transferStock(params: {
    fromWarehouseId: string;
    toWarehouseId: string;
    items: StockTransferItem[];
    notes?: string;
    user: User;
  }): StockTransfer {
    const fromWh = this.warehouses.find((w) => w.id === params.fromWarehouseId) || this.warehouses[0];
    const toWh = this.warehouses.find((w) => w.id === params.toWarehouseId) || this.warehouses[1] || this.warehouses[0];
    const totalQuantity = params.items.reduce((acc, i) => acc + i.quantity, 0);

    const transferIndex = this.stockTransfers.length + 1;
    const transferCode = `TRF-0001-${String(transferIndex).padStart(6, '0')}`;

    const newProducts = [...this.products];
    const newStockMovements = [...this.stockMovements];

    for (const item of params.items) {
      const prodIdx = newProducts.findIndex((p) => p.id === item.productId);
      if (prodIdx >= 0) {
        const prod = { ...newProducts[prodIdx] };
        const stockByWh = { ...(prod.stockByWarehouse || {}) };

        const currentFromStock = stockByWh[fromWh.id] || 0;
        const currentToStock = stockByWh[toWh.id] || 0;

        stockByWh[fromWh.id] = Math.max(0, currentFromStock - item.quantity);
        stockByWh[toWh.id] = currentToStock + item.quantity;

        prod.stockByWarehouse = stockByWh;
        prod.stock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
        newProducts[prodIdx] = prod;

        newStockMovements.push({
          id: `sm-trf-out-${Date.now()}-${item.productId}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          warehouseId: fromWh.id,
          warehouseName: fromWh.name,
          type: 'transfer',
          quantity: item.quantity,
          previousStock: currentFromStock,
          newStock: stockByWh[fromWh.id],
          referenceType: 'transfer',
          referenceId: transferCode,
          reason: `Transferencia saliente hacia ${toWh.name}`,
          userId: params.user.id,
          userName: params.user.name,
        });

        newStockMovements.push({
          id: `sm-trf-in-${Date.now()}-${item.productId}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          warehouseId: toWh.id,
          warehouseName: toWh.name,
          type: 'transfer',
          quantity: item.quantity,
          previousStock: currentToStock,
          newStock: stockByWh[toWh.id],
          referenceType: 'transfer',
          referenceId: transferCode,
          reason: `Transferencia entrante desde ${fromWh.name}`,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
    }

    this.products = newProducts;
    setLocal('products', this.products);
    this.stockMovements = newStockMovements;
    setLocal('stockMovements', this.stockMovements);

    const newTransfer: StockTransfer = {
      id: `trf-${Date.now()}`,
      code: transferCode,
      date: new Date().toISOString(),
      fromWarehouseId: fromWh.id,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      items: params.items,
      totalQuantity,
      status: 'completed',
      notes: params.notes,
      userId: params.user.id,
      userName: params.user.name,
    };

    this.stockTransfers.unshift(newTransfer);
    setLocal('stockTransfers', this.stockTransfers);
    this.notify();
    return newTransfer;
  }

  public saveCashRegister(register: CashRegister): void {
    const idx = this.cashRegisters.findIndex((r) => r.id === register.id);
    if (idx >= 0) {
      this.cashRegisters[idx] = register;
    } else {
      this.cashRegisters.push(register);
    }
    setLocal('cashRegisters', this.cashRegisters);
    this.notify();
  }

  public deleteCashRegister(id: string): boolean {
    if (this.cashRegisters.length <= 1) return false;
    this.cashRegisters = this.cashRegisters.filter((r) => r.id !== id);
    setLocal('cashRegisters', this.cashRegisters);
    this.notify();
    return true;
  }

  public saveMoneyBox(moneyBox: MoneyBox): void {
    const idx = this.moneyBoxes.findIndex((m) => m.id === moneyBox.id);
    if (idx >= 0) {
      this.moneyBoxes[idx] = moneyBox;
    } else {
      this.moneyBoxes.push(moneyBox);
    }
    setLocal('moneyBoxes', this.moneyBoxes);
    this.notify();
  }

  public deleteMoneyBox(id: string): boolean {
    if (this.moneyBoxes.length <= 1) return false;
    this.moneyBoxes = this.moneyBoxes.filter((m) => m.id !== id);
    setLocal('moneyBoxes', this.moneyBoxes);
    this.notify();
    return true;
  }

  public openCashSession(registerId: string, initialCash: number, user: User): CashRegisterSession {
    const reg = this.cashRegisters.find((r) => r.id === registerId) || this.cashRegisters[0];
    const newSession: CashRegisterSession = {
      id: `sess-${Date.now()}`,
      registerId: reg.id,
      registerName: reg.name,
      openedByUserId: user.id,
      openedByUserName: user.name,
      openedAt: new Date().toISOString(),
      initialCash,
      expectedCash: initialCash,
      totalSalesCash: 0,
      totalSalesCards: 0,
      totalSalesTransfer: 0,
      totalSalesCurrentAccount: 0,
      totalInflows: 0,
      totalOutflows: 0,
      status: 'open',
    };

    this.cashSessions.unshift(newSession);
    setLocal('cashSessions', this.cashSessions);

    const regIdx = this.cashRegisters.findIndex((r) => r.id === reg.id);
    if (regIdx >= 0) {
      this.cashRegisters[regIdx].isOpen = true;
      this.cashRegisters[regIdx].currentSessionId = newSession.id;
      setLocal('cashRegisters', this.cashRegisters);
    }

    this.notify();
    return newSession;
  }

  // ==========================================
  // CASH & BANK TRANSFERS, EXPENSES, CHECKS
  // ==========================================
  public transferBetweenRegisters(params: {
    fromRegisterId: string;
    toRegisterId: string;
    amount: number;
    description?: string;
    user: User;
  }): boolean {
    const fromReg = this.cashRegisters.find((r) => r.id === params.fromRegisterId);
    const toReg = this.cashRegisters.find((r) => r.id === params.toRegisterId);
    if (!fromReg || !toReg || params.amount <= 0) return false;

    fromReg.currentBalance = (fromReg.currentBalance || 0) - params.amount;
    toReg.currentBalance = (toReg.currentBalance || 0) + params.amount;

    const movementOut: CashMovement = {
      id: `mov-tr-out-${Date.now()}`,
      date: new Date().toISOString(),
      boxId: fromReg.id,
      type: 'transfer',
      paymentMethod: 'cash',
      amount: -params.amount,
      concept: `Transferencia a ${toReg.name}: ${params.description || 'Movimiento entre cajas'}`,
      userId: params.user.id,
      userName: params.user.name,
    };

    const movementIn: CashMovement = {
      id: `mov-tr-in-${Date.now() + 1}`,
      date: new Date().toISOString(),
      boxId: toReg.id,
      type: 'transfer',
      paymentMethod: 'cash',
      amount: params.amount,
      concept: `Transferencia desde ${fromReg.name}: ${params.description || 'Movimiento entre cajas'}`,
      userId: params.user.id,
      userName: params.user.name,
    };

    this.cashMovements.unshift(movementIn, movementOut);
    setLocal('cashMovements', this.cashMovements);
    setLocal('cashRegisters', this.cashRegisters);
    this.notify();
    return true;
  }

  public transferBetweenMoneyBoxes(params: {
    fromBoxId: string;
    toBoxId: string;
    amount: number;
    description?: string;
    user: User;
  }): boolean {
    const fromBox = this.moneyBoxes.find((m) => m.id === params.fromBoxId);
    const toBox = this.moneyBoxes.find((m) => m.id === params.toBoxId);
    if (!fromBox || !toBox || params.amount <= 0) return false;

    fromBox.currentBalance = (fromBox.currentBalance || 0) - params.amount;
    toBox.currentBalance = (toBox.currentBalance || 0) + params.amount;

    const movementOut: CashMovement = {
      id: `mov-bank-tr-out-${Date.now()}`,
      date: new Date().toISOString(),
      boxId: fromBox.id,
      type: 'transfer',
      paymentMethod: fromBox.type === 'bank_account' ? 'transfer' : 'cash',
      amount: -params.amount,
      concept: `Transferencia a ${toBox.name}: ${params.description || 'Transferencia entre cuentas'}`,
      userId: params.user.id,
      userName: params.user.name,
    };

    const movementIn: CashMovement = {
      id: `mov-bank-tr-in-${Date.now() + 1}`,
      date: new Date().toISOString(),
      boxId: toBox.id,
      type: 'transfer',
      paymentMethod: toBox.type === 'bank_account' ? 'transfer' : 'cash',
      amount: params.amount,
      concept: `Transferencia desde ${fromBox.name}: ${params.description || 'Transferencia entre cuentas'}`,
      userId: params.user.id,
      userName: params.user.name,
    };

    this.cashMovements.unshift(movementIn, movementOut);
    setLocal('cashMovements', this.cashMovements);
    setLocal('moneyBoxes', this.moneyBoxes);
    this.notify();
    return true;
  }

  public transferFromRegisterToMoneyBox(params: {
    fromRegisterId: string;
    toBoxId: string;
    amount: number;
    description?: string;
    user: User;
  }): boolean {
    const fromReg = this.cashRegisters.find((r) => r.id === params.fromRegisterId);
    const toBox = this.moneyBoxes.find((m) => m.id === params.toBoxId);
    if (!fromReg || !toBox || params.amount <= 0) return false;

    fromReg.currentBalance = (fromReg.currentBalance || 0) - params.amount;
    toBox.currentBalance = (toBox.currentBalance || 0) + params.amount;

    // If active open session exists for this register, update outflow
    const activeSession = this.cashSessions.find((s) => s.registerId === fromReg.id && s.status === 'open');
    if (activeSession) {
      activeSession.expectedCash = Math.max(0, (activeSession.expectedCash || 0) - params.amount);
      activeSession.totalOutflows = (activeSession.totalOutflows || 0) + params.amount;
      setLocal('cashSessions', this.cashSessions);
    }

    const movementOut: CashMovement = {
      id: `mov-reg-mb-out-${Date.now()}`,
      date: new Date().toISOString(),
      boxId: fromReg.id,
      sessionId: activeSession?.id,
      type: 'transfer',
      paymentMethod: 'cash',
      amount: -params.amount,
      concept: `Rendición/Transferencia a ${toBox.name}: ${params.description || 'Pase a caja fuerte'}`,
      userId: params.user.id,
      userName: params.user.name,
    };

    const movementIn: CashMovement = {
      id: `mov-reg-mb-in-${Date.now() + 1}`,
      date: new Date().toISOString(),
      boxId: toBox.id,
      type: 'transfer',
      paymentMethod: 'cash',
      amount: params.amount,
      concept: `Ingreso desde ${fromReg.name}: ${params.description || 'Pase de mostrador'}`,
      userId: params.user.id,
      userName: params.user.name,
    };

    this.cashMovements.unshift(movementIn, movementOut);
    setLocal('cashMovements', this.cashMovements);
    setLocal('cashRegisters', this.cashRegisters);
    setLocal('moneyBoxes', this.moneyBoxes);
    this.notify();
    return true;
  }

  public addMoneyBoxMovement(params: {
    boxId: string;
    type: 'manual_inflow' | 'manual_outflow';
    amount: number;
    concept: string;
    paymentMethod?: PaymentMethod;
    date?: string;
    user: User;
  }): boolean {
    const box = this.moneyBoxes.find((m) => m.id === params.boxId);
    if (!box || params.amount <= 0) return false;

    const isOutflow = params.type === 'manual_outflow';
    const signedAmount = isOutflow ? -params.amount : params.amount;
    box.currentBalance = (box.currentBalance || 0) + signedAmount;

    const newMovement: CashMovement = {
      id: `cm-mb-${Date.now()}`,
      date: params.date || new Date().toISOString(),
      boxId: box.id,
      type: params.type,
      paymentMethod: params.paymentMethod || (box.type === 'bank_account' ? 'transfer' : 'cash'),
      amount: signedAmount,
      concept: params.concept,
      userId: params.user.id,
      userName: params.user.name,
    };

    this.cashMovements.unshift(newMovement);
    setLocal('cashMovements', this.cashMovements);
    setLocal('moneyBoxes', this.moneyBoxes);
    this.notify();
    return true;
  }

  public recalculateMoneyBoxBalance(boxId: string): number {
    const box = this.moneyBoxes.find((m) => m.id === boxId);
    if (!box) return 0;
    const boxMovements = this.cashMovements.filter((m) => m.boxId === boxId);
    const sum = boxMovements.reduce((acc, m) => acc + (m.amount || 0), 0);
    // If there are recorded movements, sync balance; else keep positive existing balance
    if (boxMovements.length > 0) {
      box.currentBalance = sum;
    }
    setLocal('moneyBoxes', this.moneyBoxes);
    this.notify();
    return box.currentBalance;
  }

  public deleteCashMovement(movementId: string): boolean {
    const mov = this.cashMovements.find((m) => m.id === movementId);
    if (!mov) return false;

    // Revert balance on target box if applicable
    const mb = this.moneyBoxes.find((m) => m.id === mov.boxId);
    if (mb) {
      mb.currentBalance = (mb.currentBalance || 0) - mov.amount;
      setLocal('moneyBoxes', this.moneyBoxes);
    }
    const reg = this.cashRegisters.find((r) => r.id === mov.boxId);
    if (reg) {
      reg.currentBalance = (reg.currentBalance || 0) - mov.amount;
      setLocal('cashRegisters', this.cashRegisters);
    }

    this.cashMovements = this.cashMovements.filter((m) => m.id !== movementId);
    setLocal('cashMovements', this.cashMovements);
    this.notify();
    return true;
  }

  public saveExpenseCategory(category: ExpenseCategory): void {
    const idx = this.expenseCategories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      this.expenseCategories[idx] = category;
    } else {
      this.expenseCategories.push(category);
    }
    setLocal('expenseCategories', this.expenseCategories);
    this.notify();
  }

  public deleteExpenseCategory(id: string): boolean {
    this.expenseCategories = this.expenseCategories.filter((c) => c.id !== id);
    setLocal('expenseCategories', this.expenseCategories);
    this.notify();
    return true;
  }

  public registerExpense(expense: ExpenseRecord): void {
    this.expenses.unshift(expense);
    setLocal('expenses', this.expenses);

    // Update category statistics
    const cat = this.expenseCategories.find((c) => c.id === expense.categoryId);
    if (cat) {
      cat.periodAmount = (cat.periodAmount || 0) + expense.amount;
      cat.paymentsCount = (cat.paymentsCount || 0) + 1;
      setLocal('expenseCategories', this.expenseCategories);
    }

    // Deduct from register or money box
    const reg = this.cashRegisters.find((r) => r.id === expense.sourceBoxOrBankId);
    if (reg) {
      reg.currentBalance = (reg.currentBalance || 0) - expense.amount;
      setLocal('cashRegisters', this.cashRegisters);
    }
    const mb = this.moneyBoxes.find((m) => m.id === expense.sourceBoxOrBankId);
    if (mb) {
      mb.currentBalance = (mb.currentBalance || 0) - expense.amount;
      setLocal('moneyBoxes', this.moneyBoxes);
    }

    // Create cash movement
    const movement: CashMovement = {
      id: `mov-exp-${Date.now()}`,
      date: expense.date,
      boxId: expense.sourceBoxOrBankId,
      type: 'expense',
      paymentMethod: expense.paymentMethod,
      amount: -expense.amount,
      concept: `Gasto [${expense.categoryName}]: ${expense.description}`,
      userId: expense.userId,
      userName: expense.userName,
    };
    this.cashMovements.unshift(movement);
    setLocal('cashMovements', this.cashMovements);

    this.notify();
  }

  public saveCheck(check: CheckWalletItem): void {
    const idx = this.checks.findIndex((c) => c.id === check.id);
    if (idx >= 0) {
      this.checks[idx] = check;
    } else {
      this.checks.unshift(check);
    }
    setLocal('checks', this.checks);
    this.notify();
  }

  public deleteCheck(id: string): void {
    this.checks = this.checks.filter((c) => c.id !== id);
    setLocal('checks', this.checks);
    this.notify();
  }

  public updateCheckStatus(
    id: string,
    status: CheckWalletItem['status'],
    extra?: { deliveredTo?: string; deliveryDate?: string; notes?: string }
  ): void {
    const chk = this.checks.find((c) => c.id === id);
    if (chk) {
      chk.status = status;
      if (extra?.deliveredTo !== undefined) chk.deliveredTo = extra.deliveredTo;
      if (extra?.deliveryDate !== undefined) chk.deliveryDate = extra.deliveryDate;
      if (extra?.notes !== undefined) chk.notes = extra.notes;
      setLocal('checks', this.checks);
      this.notify();
    }
  }

  // ==========================================
  // INTERNAL INSTALLMENTS / CUOTAS DE LA CASA
  // ==========================================
  public saveInstallmentsConfig(config: InternalInstallmentsConfig): void {
    this.installmentsConfig = config;
    setLocal('installmentsConfig', this.installmentsConfig);
    this.notify();
  }

  public createInstallmentPlan(params: {
    clientId: string;
    items: { productId?: string; productName: string; quantity: number; unitPrice: number; subtotal: number }[];
    totalCashPrice: number;
    downPayment: number;
    installmentsCount: number;
    interestRatePercent: number;
    firstDueDate?: string;
    notes?: string;
    user: User;
  }): InternalInstallmentPlan {
    const client = this.clients.find((c) => c.id === params.clientId);
    const clientName = client ? client.name : 'Cliente General';
    const clientTaxId = client ? client.taxId : '';
    const clientPhone = client ? client.phone : '';

    const financedAmount = Math.max(0, params.totalCashPrice - (params.downPayment || 0));
    const totalFinancedWithInterest = financedAmount * (1 + (params.interestRatePercent || 0) / 100);
    const installmentAmount = totalFinancedWithInterest / (params.installmentsCount || 1);

    const planCode = `FIN-${new Date().getFullYear()}-${String(this.installmentPlans.length + 101).padStart(5, '0')}`;
    const baseDate = params.firstDueDate ? new Date(params.firstDueDate) : new Date();

    const schedule = [];
    for (let i = 1; i <= params.installmentsCount; i++) {
      const d = new Date(baseDate.getTime());
      if (i > 1) {
        d.setMonth(d.getMonth() + (i - 1));
      }

      schedule.push({
        number: i,
        dueDate: d.toISOString().split('T')[0],
        amount: Math.round(installmentAmount * 100) / 100,
        isPaid: false,
      });
    }

    const plan: InternalInstallmentPlan = {
      id: `plan-${Date.now()}`,
      code: planCode,
      clientId: params.clientId,
      clientName,
      clientTaxId,
      clientPhone,
      date: new Date().toISOString(),
      items: params.items,
      totalCashPrice: params.totalCashPrice,
      downPayment: params.downPayment || 0,
      financedAmount,
      installmentsCount: params.installmentsCount,
      interestRatePercent: params.interestRatePercent,
      totalFinancedWithInterest: Math.round(totalFinancedWithInterest * 100) / 100,
      installmentAmount: Math.round(installmentAmount * 100) / 100,
      schedule,
      status: 'active',
      notes: params.notes,
      userId: params.user.id,
    };

    this.installmentPlans.unshift(plan);
    setLocal('installmentPlans', this.installmentPlans);
    this.notify();
    return plan;
  }

  public payInstallment(
    planId: string,
    installmentNumber: number,
    paymentMethod: PaymentMethod,
    user: User,
    options?: { boxId?: string; notes?: string }
  ): boolean {
    const planIdx = this.installmentPlans.findIndex((p) => p.id === planId);
    if (planIdx < 0) return false;
    const plan = { ...this.installmentPlans[planIdx] };
    const inst = plan.schedule.find((s) => s.number === installmentNumber);
    if (!inst || inst.isPaid) return false;

    const receiptNumber = `REC-CUOTA-${plan.code}-${installmentNumber}`;
    inst.isPaid = true;
    inst.paidAt = new Date().toISOString();
    inst.paidAmount = inst.amount;
    inst.receiptNumber = receiptNumber;
    inst.paymentMethod = paymentMethod;

    // Check if all paid
    if (plan.schedule.every((s) => s.isPaid)) {
      plan.status = 'completed';
    }

    this.installmentPlans[planIdx] = plan;
    setLocal('installmentPlans', this.installmentPlans);

    // Register cash inflow if paid in cash
    const activeSession = this.cashSessions.find((s) => s.status === 'open');
    if (activeSession && paymentMethod === 'cash') {
      activeSession.expectedCash += inst.amount;
      activeSession.totalInflows += inst.amount;
      setLocal('cashSessions', this.cashSessions);

      this.cashMovements.push({
        id: `cm-cuota-${Date.now()}`,
        date: new Date().toISOString(),
        sessionId: activeSession.id,
        boxId: options?.boxId || activeSession.registerId,
        type: 'client_payment',
        paymentMethod: 'cash',
        amount: inst.amount,
        concept: `Cobro Cuota ${installmentNumber}/${plan.installmentsCount} Plan ${plan.code} - ${plan.clientName}`,
        referenceType: 'client_receipt',
        referenceId: receiptNumber,
        userId: user.id,
        userName: user.name,
      });
      setLocal('cashMovements', this.cashMovements);
    }

    this.notify();
    return true;
  }

  public deleteInstallmentPlan(planId: string): boolean {
    const prevLen = this.installmentPlans.length;
    this.installmentPlans = this.installmentPlans.filter((p) => p.id !== planId);
    if (this.installmentPlans.length !== prevLen) {
      setLocal('installmentPlans', this.installmentPlans);
      this.notify();
      return true;
    }
    return false;
  }

  // ==========================================
  // MASS PRICE UPDATER
  // ==========================================
  public massUpdatePrices(params: {
    percentage: number; // e.g. +15% or -5%
    categoryId?: string;
    brandId?: string;
    targetField: 'cost' | 'minorista' | 'all';
  }): number {
    let affected = 0;
    const factor = 1 + params.percentage / 100;

    this.products.forEach((p) => {
      if (params.categoryId && params.categoryId !== 'all' && p.categoryId !== params.categoryId) return;
      if (params.brandId && params.brandId !== 'all' && p.brandId !== params.brandId) return;

      if (params.targetField === 'cost' || params.targetField === 'all') {
        p.costPrice = Math.round(p.costPrice * factor);
      }
      if (params.targetField === 'minorista' || params.targetField === 'all') {
        p.priceMinorista = Math.round(p.priceMinorista * factor);
        p.priceGremio = Math.round(p.priceGremio * factor);
        p.priceMayorista = Math.round(p.priceMayorista * factor);
      }
      affected++;
    });

    setLocal('products', this.products);
    this.notify();
    return affected;
  }

  // ==========================================
  // GENERIC CRUD HELPERS
  // ==========================================
  public saveProduct(product: Product): void {
    const stockByWh = { ...(product.stockByWarehouse || {}) };
    this.warehouses.forEach((w) => {
      if (stockByWh[w.id] === undefined) {
        stockByWh[w.id] = 0;
      }
    });
    const totalStock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
    const normalizedProduct: Product = {
      ...product,
      stockByWarehouse: stockByWh,
      stock: totalStock > 0 || Object.keys(stockByWh).length > 0 ? totalStock : (product.stock || 0),
    };

    const idx = this.products.findIndex((p) => p.id === normalizedProduct.id);
    if (idx >= 0) {
      this.products[idx] = normalizedProduct;
    } else {
      this.products.unshift(normalizedProduct);
    }
    setLocal('products', this.products);
    this.notify();
  }

  public toggleProductActive(id: string): boolean {
    const prod = this.products.find((p) => p.id === id);
    if (!prod) return false;
    prod.active = !prod.active;
    setLocal('products', this.products);
    this.notify();
    return prod.active;
  }

  public deleteProduct(id: string): boolean {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.products.splice(idx, 1);
      setLocal('products', this.products);
      this.notify();
      return true;
    }
    return false;
  }

  public bulkDeleteProducts(ids: string[]): number {
    const idSet = new Set(ids);
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => !idSet.has(p.id));
    const deletedCount = initialLen - this.products.length;
    setLocal('products', this.products);
    this.notify();
    return deletedCount;
  }

  public bulkToggleActive(ids: string[], active: boolean): number {
    const idSet = new Set(ids);
    let count = 0;
    this.products.forEach((p) => {
      if (idSet.has(p.id)) {
        p.active = active;
        count++;
      }
    });
    setLocal('products', this.products);
    this.notify();
    return count;
  }

  public saveClient(client: Client): void {
    // Ensure rule: hasCurrentAccount === true forces loyaltyEligible = false
    if (client.hasCurrentAccount) {
      client.loyaltyEligible = false;
    }
    const idx = this.clients.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      this.clients[idx] = client;
    } else {
      this.clients.unshift(client);
    }
    setLocal('clients', this.clients);
    this.notify();
  }

  public saveSupplier(supplier: Supplier): void {
    const idx = this.suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      this.suppliers[idx] = supplier;
    } else {
      this.suppliers.unshift(supplier);
    }
    setLocal('suppliers', this.suppliers);
    this.notify();
  }

  public applySupplierDiscount(supplierId: string, discountPercent: number): number {
    let updatedCount = 0;
    this.products.forEach((p) => {
      // Check if product belongs to supplier or has supplier SKU mapping
      const matchesSupplierId = p.supplierId === supplierId;
      const matchesSkuSupplier = p.supplierSkus?.some((s) => s.supplierId === supplierId);

      if (matchesSupplierId || matchesSkuSupplier) {
        // Apply discount to costPrice or record as discount1 / recalculate
        const currentCost = p.costPrice || 0;
        if (currentCost > 0) {
          const discountFactor = 1 - discountPercent / 100;
          const newCost = Math.round(currentCost * discountFactor * 100) / 100;
          p.costPrice = newCost;
          p.discount1 = discountPercent;

          // Recalculate minorista price using margin
          const margin = p.marginPercent ?? 35;
          const vatMultiplier = 1 + (p.vatRate || 21) / 100;
          p.priceMinorista = Math.round(newCost * (1 + margin / 100) * vatMultiplier);
          if (p.priceMayorista) {
            p.priceMayorista = Math.round(newCost * (1 + (p.wholesaleMarginPercent || 20) / 100) * vatMultiplier);
          }
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      setLocal('products', this.products);
      this.notify();
    }
    return updatedCount;
  }

  public saveServiceOrder(order: TechnicalServiceOrder): void {
    const idx = this.serviceOrders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.serviceOrders[idx] = order;
    } else {
      this.serviceOrders.unshift(order);
    }
    setLocal('serviceOrders', this.serviceOrders);
    this.notify();
  }

  public deleteServiceOrder(id: string): boolean {
    const idx = this.serviceOrders.findIndex((o) => o.id === id);
    if (idx >= 0) {
      this.serviceOrders.splice(idx, 1);
      setLocal('serviceOrders', this.serviceOrders);
      this.notify();
      return true;
    }
    return false;
  }

  public getNextServiceOrderNumber(): string {
    const year = new Date().getFullYear();
    const currentMax = this.serviceOrders.reduce((max, o) => {
      const match = o.orderNumber?.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 45);
    return `SRV-${year}-${String(currentMax + 1).padStart(5, '0')}`;
  }

  public generateWithdrawCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ==========================================
  // PURCHASE ORDERS (PEDIDOS DE COMPRA)
  // ==========================================
  public savePurchaseOrder(order: PurchaseOrder): void {
    const idx = this.purchaseOrders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.purchaseOrders[idx] = { ...order, updatedAt: new Date().toISOString() };
    } else {
      this.purchaseOrders.unshift({ ...order, createdAt: order.createdAt || new Date().toISOString() });
    }
    setLocal('purchaseOrders', this.purchaseOrders);
    this.notify();
  }

  public deletePurchaseOrder(id: string): boolean {
    const idx = this.purchaseOrders.findIndex((o) => o.id === id);
    if (idx >= 0) {
      this.purchaseOrders.splice(idx, 1);
      setLocal('purchaseOrders', this.purchaseOrders);
      this.notify();
      return true;
    }
    return false;
  }

  public duplicatePurchaseOrder(id: string): PurchaseOrder | null {
    const original = this.purchaseOrders.find((o) => o.id === id);
    if (!original) return null;

    const newCode = this.generatePurchaseOrderCode();
    const cloned: PurchaseOrder = {
      ...JSON.parse(JSON.stringify(original)),
      id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: newCode,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.purchaseOrders.unshift(cloned);
    setLocal('purchaseOrders', this.purchaseOrders);
    this.notify();
    return cloned;
  }

  public generatePurchaseOrderCode(): string {
    const randPart1 = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PO-${randPart1}--${randPart2}`;
  }

  public receivePurchaseOrder(
    id: string,
    warehouseId: string,
    invoiceNumber: string = '',
    userId: string = 'user-1',
    userName: string = 'Carlos Mendoza'
  ): boolean {
    const order = this.purchaseOrders.find((o) => o.id === id);
    if (!order) return false;

    // Update status
    order.status = 'completed';
    order.warehouseId = warehouseId;
    if (invoiceNumber) order.invoiceNumber = invoiceNumber;
    order.updatedAt = new Date().toISOString();

    // Increment stocks & create stock movements
    order.items.forEach((item) => {
      const prod = this.products.find((p) => p.id === item.productId || p.code === item.productCode);
      if (prod) {
        if (!prod.stockByWarehouse) prod.stockByWarehouse = {};
        const prevWhStock = prod.stockByWarehouse[warehouseId] || 0;
        prod.stockByWarehouse[warehouseId] = prevWhStock + item.quantity;
        prod.stock = Object.values(prod.stockByWarehouse).reduce((a, b) => a + (Number(b) || 0), 0);
        if (item.unitCost > 0) {
          prod.costPrice = item.unitCost;
        }

        const whName = this.warehouses.find((w) => w.id === warehouseId)?.name || 'Depósito Central';
        this.stockMovements.unshift({
          id: `sm-po-${Date.now()}-${item.productId}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          warehouseId,
          warehouseName: whName,
          type: 'purchase',
          quantity: item.quantity,
          previousStock: prod.stock - item.quantity,
          newStock: prod.stock,
          referenceType: 'purchase_order',
          referenceId: order.code,
          reason: `Ingreso por Pedido de Compra ${order.code}${invoiceNumber ? ` - FC: ${invoiceNumber}` : ''}`,
          userId,
          userName,
        });
      }
    });

    setLocal('products', this.products);
    setLocal('stockMovements', this.stockMovements);
    setLocal('purchaseOrders', this.purchaseOrders);

    // Also register purchase invoice in this.purchases
    const existingPur = this.purchases.find(
      (p) => p.code === order.code || (invoiceNumber && p.invoiceNumber === invoiceNumber)
    );
    if (!existingPur) {
      const whName = this.warehouses.find((w) => w.id === warehouseId)?.name || 'Casa Central';
      const supplier = this.suppliers.find((s) => s.id === order.supplierId);
      const cleanInvNum = (invoiceNumber || order.code.replace('PO-', '')).slice(0, 8).padStart(8, '0');
      const newPurchase: Purchase = {
        id: `pur-po-${order.id}`,
        code: `COM-${new Date().getFullYear()}-${order.code.replace('PO-', '')}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        supplierTaxId: order.supplierTaxId || supplier?.taxId || '30-00000000-0',
        supplierTaxCondition: supplier?.taxCondition || 'Responsable Inscripto',
        invoiceType: 'Factura A',
        pointOfSale: '00001',
        invoiceNumber: cleanInvNum,
        fullInvoiceNumber: `00001-${cleanInvNum}`,
        warehouseId,
        warehouseName: whName,
        items: order.items.map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          vatRate: item.vatRate || 21,
          discount1: 0,
          discount2: 0,
          discount3: 0,
          subtotal: item.subtotal || item.quantity * item.unitCost,
          profitMargin: 40,
          updateCost: true,
        })),
        subtotal: order.subtotal || order.total,
        vatAmount: order.taxTotal || (order.total * 0.21),
        internalTax: 0,
        otherTaxes: 0,
        perceptionIIBB: 0,
        perceptionIVA: 0,
        generalDiscountPercent: 0,
        generalDiscountAmount: 0,
        extraDiscountPercent: 0,
        extraDiscountAmount: 0,
        total: order.total || (order.subtotal + (order.taxTotal || 0)),
        paymentMethod: 'current_account',
        paymentStatus: 'pending',
        paidAmount: 0,
        balanceDue: order.total || (order.subtotal + (order.taxTotal || 0)),
        autoUpdateStock: false,
        autoUpdateCosts: true,
        notes: `Comprobante generado por recepción del Pedido ${order.code}. ${order.notes || ''}`,
        registeredByUserId: userId,
        registeredByUserName: userName,
        createdAt: new Date().toISOString(),
      };
      this.purchases.unshift(newPurchase);
      setLocal('purchases', this.purchases);
    }

    this.notify();
    return true;
  }

  // ================= PENDING PURCHASE ITEMS (PEDIDOS PENDIENTES) =================
  public addPendingPurchaseItem(item: Omit<PendingPurchaseItem, 'id'> & { id?: string }): void {
    const existing = this.pendingPurchaseItems.find(
      (p) => p.productId === item.productId && p.targetSupplierId === item.targetSupplierId
    );
    if (existing) {
      existing.quantity += item.quantity;
      if (item.unitCost > 0) existing.unitCost = item.unitCost;
    } else {
      const newItem: PendingPurchaseItem = {
        ...item,
        id: item.id || `pend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      this.pendingPurchaseItems.push(newItem);
    }
    setLocal('pendingPurchaseItems', this.pendingPurchaseItems);
    this.notify();
  }

  public updatePendingPurchaseItem(id: string, updates: Partial<PendingPurchaseItem>): void {
    const item = this.pendingPurchaseItems.find((p) => p.id === id);
    if (item) {
      Object.assign(item, updates);
      setLocal('pendingPurchaseItems', this.pendingPurchaseItems);
      this.notify();
    }
  }

  public removePendingPurchaseItem(id: string): void {
    const idx = this.pendingPurchaseItems.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.pendingPurchaseItems.splice(idx, 1);
      setLocal('pendingPurchaseItems', this.pendingPurchaseItems);
      this.notify();
    }
  }

  public clearPendingPurchaseItems(): void {
    this.pendingPurchaseItems = [];
    setLocal('pendingPurchaseItems', this.pendingPurchaseItems);
    this.notify();
  }

  public createPurchaseOrdersFromPending(supplierId?: string): PurchaseOrder[] {
    const itemsToProcess = supplierId
      ? this.pendingPurchaseItems.filter((p) => p.targetSupplierId === supplierId)
      : [...this.pendingPurchaseItems];

    if (itemsToProcess.length === 0) return [];

    // Group items by targetSupplierId
    const groups: { [supId: string]: PendingPurchaseItem[] } = {};
    itemsToProcess.forEach((item) => {
      const supKey = item.targetSupplierId || 'sin-proveedor';
      if (!groups[supKey]) groups[supKey] = [];
      groups[supKey].push(item);
    });

    const createdOrders: PurchaseOrder[] = [];

    Object.entries(groups).forEach(([supKey, groupItems]) => {
      const sup = this.suppliers.find((s) => s.id === supKey);
      const supplierName = sup?.name || groupItems[0]?.targetSupplierName || 'PROVEEDOR GENERAL';
      const orderCode = this.generatePurchaseOrderCode();

      const orderItems: PurchaseOrderItem[] = groupItems.map((item) => ({
        productId: item.productId,
        productCode: item.sku,
        supplierProductCode: item.supplierProductCode,
        productName: item.productName,
        originalSupplierId: item.originalSupplierId,
        originalSupplierName: item.originalSupplierName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        vatRate: item.vatRate ?? 21,
        subtotal: item.quantity * item.unitCost,
      }));

      const subtotal = orderItems.reduce((sum, it) => sum + it.subtotal, 0);
      const taxTotal = orderItems.reduce((sum, it) => sum + (it.subtotal * (it.vatRate / 100)), 0);
      const total = subtotal + taxTotal;

      const newOrder: PurchaseOrder = {
        id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: orderCode,
        supplierId: sup?.id || supKey,
        supplierName: supplierName,
        supplierTaxId: sup?.cuit,
        supplierPhone: sup?.phone,
        supplierEmail: sup?.email,
        date: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        items: orderItems,
        subtotal,
        taxTotal,
        total,
        status: 'draft',
        notes: 'Generado automáticamente desde productos pendientes de pedir.',
        paymentCondition: 'credit',
        warehouseId: this.warehouses[0]?.id || '1',
        userId: 'user-1',
        userName: 'Carlos Mendoza',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.purchaseOrders.unshift(newOrder);
      createdOrders.push(newOrder);
    });

    // Remove processed items from pendingPurchaseItems
    const processedIds = new Set(itemsToProcess.map((i) => i.id));
    this.pendingPurchaseItems = this.pendingPurchaseItems.filter((i) => !processedIds.has(i.id));

    setLocal('purchaseOrders', this.purchaseOrders);
    setLocal('pendingPurchaseItems', this.pendingPurchaseItems);
    this.notify();

    return createdOrders;
  }

  // ================= PURCHASES & SUPPLIER INVOICES =================
  public savePurchase(purchase: Purchase): void {
    const existingIdx = this.purchases.findIndex((p) => p.id === purchase.id);

    if (existingIdx >= 0) {
      this.purchases[existingIdx] = purchase;
    } else {
      this.purchases.unshift(purchase);
    }

    // 1. Stock Updates if enabled
    if (purchase.autoUpdateStock && purchase.items && purchase.items.length > 0) {
      const whId = purchase.warehouseId || '1';
      const whName = this.warehouses.find((w) => w.id === whId)?.name || 'Casa Central';

      purchase.items.forEach((item) => {
        const prod = this.products.find((p) => p.id === item.productId || p.code === item.productCode);
        if (prod) {
          if (!prod.stockByWarehouse) prod.stockByWarehouse = {};
          const prevWhStock = prod.stockByWarehouse[whId] || 0;
          prod.stockByWarehouse[whId] = prevWhStock + item.quantity;
          prod.stock = Object.values(prod.stockByWarehouse).reduce((a, b) => a + (Number(b) || 0), 0);

          // Update cost if specified or autoUpdateCosts
          if (purchase.autoUpdateCosts || item.updateCost) {
            prod.costPrice = item.unitCost;
            if (item.profitMargin && item.profitMargin > 0) {
              prod.marginPercent = item.profitMargin;
              const vatMultiplier = 1 + (prod.vatRate || 21) / 100;
              prod.priceMinorista = Math.round(item.unitCost * (1 + item.profitMargin / 100) * vatMultiplier);
            }
          }

          this.stockMovements.unshift({
            id: `sm-pur-${Date.now()}-${item.productId}`,
            date: new Date().toISOString(),
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            warehouseId: whId,
            warehouseName: whName,
            type: 'purchase',
            quantity: item.quantity,
            previousStock: prod.stock - item.quantity,
            newStock: prod.stock,
            referenceType: 'purchase',
            referenceId: purchase.fullInvoiceNumber || purchase.code,
            reason: `Compra - ${purchase.invoiceType} ${purchase.fullInvoiceNumber || purchase.code} (${purchase.supplierName})`,
            userId: purchase.registeredByUserId || 'user-1',
            userName: purchase.registeredByUserName || 'Carlos Mendoza',
          });
        }
      });
    }

    // 2. Register/Update Supplier Product Mappings (Equivalences)
    if (purchase.supplierId && purchase.items && purchase.items.length > 0) {
      const supId = purchase.supplierId;
      const supplierObj = this.suppliers.find(s => s.id === supId);
      const supName = supplierObj ? supplierObj.name : purchase.supplierName;
      const purDate = purchase.date || new Date().toISOString().split('T')[0];

      purchase.items.forEach((item) => {
        if (item.productId && item.productCode) {
          const prod = this.products.find((p) => p.id === item.productId);
          if (prod) {
            if (!prod.supplierSkus) prod.supplierSkus = [];
            const existingMapping = prod.supplierSkus.find(
              (s) => s.supplierId === supId && s.supplierCode.toLowerCase() === item.productCode.toLowerCase()
            );
            if (existingMapping) {
              existingMapping.lastCost = item.unitCost;
              existingMapping.lastPurchaseDate = purDate;
              existingMapping.supplierDescription = item.productName;
            } else {
              prod.supplierSkus.push({
                supplierId: supId,
                supplierName: supName,
                supplierCode: item.productCode,
                supplierDescription: item.productName,
                lastCost: item.unitCost,
                lastPurchaseDate: purDate,
              });
            }
          }
        }
      });
      setLocal('products', this.products);
    }

    // 3. Supplier Balance & Account Movement
    const supplier = this.suppliers.find((s) => s.id === purchase.supplierId || s.name === purchase.supplierName);
    if (supplier) {
      if (purchase.paymentMethod === 'current_account' || purchase.paymentStatus === 'pending') {
        supplier.currentBalance = (supplier.currentBalance || 0) + purchase.total;
        
        this.supplierAccountMovements.unshift({
          id: `sam-${Date.now()}`,
          date: purchase.date ? new Date(purchase.date).toISOString() : new Date().toISOString(),
          supplierId: supplier.id,
          supplierName: supplier.name,
          type: 'purchase_debt',
          amount: purchase.total,
          balanceAfter: supplier.currentBalance,
          referenceType: 'purchase',
          referenceId: purchase.id,
          concept: `${purchase.invoiceType} ${purchase.fullInvoiceNumber || purchase.code}`,
          documentNumber: purchase.fullInvoiceNumber || purchase.code,
          userId: purchase.registeredByUserId || 'user-1',
          userName: purchase.registeredByUserName || 'Carlos Mendoza',
        });
      } else if (purchase.paymentStatus === 'paid') {
        this.cashMovements.unshift({
          id: `cm-pur-${Date.now()}`,
          sessionId: 'sess-active-1',
          boxId: 'reg-1',
          type: 'supplier_payment',
          amount: purchase.total,
          paymentMethod: purchase.paymentMethod as PaymentMethod,
          concept: `Pago directo compra ${purchase.invoiceType} ${purchase.fullInvoiceNumber || purchase.code} - ${purchase.supplierName}`,
          referenceType: 'purchase',
          referenceId: purchase.id,
          date: new Date().toISOString(),
          userId: purchase.registeredByUserId || 'user-1',
          userName: purchase.registeredByUserName || 'Carlos Mendoza',
        });
      }
    }

    setLocal('purchases', this.purchases);
    setLocal('products', this.products);
    setLocal('stockMovements', this.stockMovements);
    setLocal('suppliers', this.suppliers);
    setLocal('supplierAccountMovements', this.supplierAccountMovements);
    setLocal('cashMovements', this.cashMovements);
    this.notify();
  }

  public deletePurchase(id: string): boolean {
    const idx = this.purchases.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const pur = this.purchases[idx];

    if (pur.paymentMethod === 'current_account' || pur.paymentStatus === 'pending') {
      const supplier = this.suppliers.find((s) => s.id === pur.supplierId);
      if (supplier) {
        supplier.currentBalance = Math.max(0, (supplier.currentBalance || 0) - pur.total);
        this.supplierAccountMovements.unshift({
          id: `sam-rev-${Date.now()}`,
          date: new Date().toISOString(),
          supplierId: supplier.id,
          supplierName: supplier.name,
          type: 'credit_note',
          amount: pur.total,
          balanceAfter: supplier.currentBalance,
          referenceType: 'manual',
          concept: `Anulación de Compra ${pur.fullInvoiceNumber || pur.code}`,
          documentNumber: pur.fullInvoiceNumber || pur.code,
          userId: 'user-1',
          userName: 'Carlos Mendoza',
        });
      }
    }

    this.purchases.splice(idx, 1);
    setLocal('purchases', this.purchases);
    setLocal('suppliers', this.suppliers);
    setLocal('supplierAccountMovements', this.supplierAccountMovements);
    this.notify();
    return true;
  }

  // ================= SUPPLIER PAYMENT ORDERS (ÓRDENES DE PAGO) =================
  public saveSupplierPaymentOrder(order: SupplierPaymentOrder): void {
    const idx = this.supplierPaymentOrders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.supplierPaymentOrders[idx] = order;
    } else {
      this.supplierPaymentOrders.unshift(order);
    }

    // Reduce supplier balance
    const supplier = this.suppliers.find((s) => s.id === order.supplierId);
    if (supplier) {
      supplier.currentBalance = Math.max(0, (supplier.currentBalance || 0) - order.totalAmount);
      
      this.supplierAccountMovements.unshift({
        id: `sam-op-${Date.now()}`,
        date: order.date ? new Date(order.date).toISOString() : new Date().toISOString(),
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: 'payment_credit',
        amount: order.totalAmount,
        balanceAfter: supplier.currentBalance,
        referenceType: 'payment_order',
        referenceId: order.id,
        concept: `Orden de Pago ${order.paymentOrderNumber}`,
        documentNumber: order.paymentOrderNumber,
        userId: order.userId || 'user-1',
        userName: order.userName || 'Carlos Mendoza',
      });
    }

    // Apply to purchases if specified
    if (order.appliedToPurchases && order.appliedToPurchases.length > 0) {
      order.appliedToPurchases.forEach((app) => {
        const pur = this.purchases.find((p) => p.id === app.purchaseId || p.fullInvoiceNumber === app.invoiceNumber);
        if (pur) {
          pur.paidAmount = (pur.paidAmount || 0) + app.amountApplied;
          pur.balanceDue = Math.max(0, pur.total - pur.paidAmount);
          pur.paymentStatus = pur.balanceDue <= 0 ? 'paid' : 'partial';
        }
      });
      setLocal('purchases', this.purchases);
    }

    // Cash / Money Box outflow
    this.cashMovements.unshift({
      id: `cm-op-${Date.now()}`,
      sessionId: 'sess-active-1',
      boxId: order.destinationBoxId || 'mb-macro',
      type: 'supplier_payment',
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      concept: `Orden de Pago ${order.paymentOrderNumber} a ${order.supplierName}`,
      referenceType: 'supplier_receipt',
      referenceId: order.id,
      date: new Date().toISOString(),
      userId: order.userId || 'user-1',
      userName: order.userName || 'Carlos Mendoza',
    });

    setLocal('supplierPaymentOrders', this.supplierPaymentOrders);
    setLocal('suppliers', this.suppliers);
    setLocal('supplierAccountMovements', this.supplierAccountMovements);
    setLocal('cashMovements', this.cashMovements);
    this.notify();
  }

  public saveSupplierManualMovement(movement: {
    supplierId: string;
    amount: number;
    type: 'adjustment_debit' | 'adjustment_credit';
    concept?: string;
    documentNumber?: string;
    date?: string;
    userId?: string;
    userName?: string;
  }): void {
    const supplier = this.suppliers.find((s) => s.id === movement.supplierId);
    if (!supplier) return;

    if (movement.type === 'adjustment_debit') {
      supplier.currentBalance = (supplier.currentBalance || 0) + movement.amount;
    } else {
      supplier.currentBalance = Math.max(0, (supplier.currentBalance || 0) - movement.amount);
    }

    const fullMovement: SupplierAccountMovement = {
      id: `sam-man-${Date.now()}`,
      date: movement.date || new Date().toISOString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      type: movement.type,
      amount: movement.amount,
      balanceAfter: supplier.currentBalance,
      referenceType: 'manual',
      concept: movement.concept || (movement.type === 'adjustment_debit' ? 'Ajuste de Débito Manual' : 'Ajuste de Crédito Manual'),
      documentNumber: movement.documentNumber || `AJ-${Date.now().toString().slice(-5)}`,
      userId: movement.userId || 'user-1',
      userName: movement.userName || 'Carlos Mendoza',
    };

    this.supplierAccountMovements.unshift(fullMovement);
    setLocal('suppliers', this.suppliers);
    setLocal('supplierAccountMovements', this.supplierAccountMovements);
    this.notify();
  }

  public getNextPaymentOrderNumber(): string {
    const count = this.supplierPaymentOrders.length + 1;
    return `OP-0001-${count.toString().padStart(8, '0')}`;
  }

  public getNextPurchaseCode(): string {
    const count = this.purchases.length + 1;
    return `COM-0001-${count.toString().padStart(7, '0')}`;
  }

  public updateSettings(newSettings: Partial<CompanySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    setLocal('settings', this.settings);
    this.notify();
  }

  public saveSettings(newSettings: Partial<CompanySettings>): void {
    this.updateSettings(newSettings);
  }

  public saveCurrencyConfig(config: CurrencyConfig): void {
    this.currencyConfig = config;
    setLocal('currencyConfig', this.currencyConfig);
    this.notify();
  }

  public saveShippingCarrier(carrier: ShippingCarrier): void {
    const idx = this.shippingCarriers.findIndex((c) => c.id === carrier.id);
    if (idx >= 0) {
      this.shippingCarriers[idx] = carrier;
    } else {
      this.shippingCarriers.push(carrier);
    }
    setLocal('shippingCarriers', this.shippingCarriers);
    this.notify();
  }

  public deleteShippingCarrier(id: string): void {
    this.shippingCarriers = this.shippingCarriers.filter((c) => c.id !== id);
    setLocal('shippingCarriers', this.shippingCarriers);
    this.notify();
  }

  public saveUser(user: User): void {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.users[idx] = user;
    } else {
      this.users.push(user);
    }
    setLocal('users', this.users);
    this.notify();
  }

  public deleteUser(id: string): void {
    // Remove or soft disable
    this.users = this.users.filter((u) => u.id !== id);
    setLocal('users', this.users);
    this.notify();
  }

  public saveRole(role: RoleDefinition): void {
    const idx = this.roles.findIndex((r) => r.id === role.id);
    if (idx >= 0) {
      this.roles[idx] = role;
    } else {
      this.roles.push(role);
    }
    setLocal('roles', this.roles);
    this.notify();
  }

  public deleteRole(id: string): void {
    this.roles = this.roles.filter((r) => r.id !== id);
    setLocal('roles', this.roles);
    this.notify();
  }

  public saveSystemModule(mod: SystemModuleInfo): void {
    const idx = this.systemModules.findIndex((m) => m.id === mod.id);
    if (idx >= 0) {
      this.systemModules[idx] = mod;
    } else {
      this.systemModules.push(mod);
    }
    setLocal('systemModules', this.systemModules);
    this.notify();
  }

  public toggleModuleStatus(id: string): void {
    const mod = this.systemModules.find((m) => m.id === id);
    if (mod) {
      mod.isEnabled = !mod.isEnabled;
      setLocal('systemModules', this.systemModules);
      this.notify();
    }
  }

  public saveMessageTemplate(template: MessageTemplate): void {
    const idx = this.messageTemplates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      this.messageTemplates[idx] = template;
    } else {
      this.messageTemplates.push(template);
    }
    setLocal('messageTemplates', this.messageTemplates);
    this.notify();
  }

  public savePrintConfig(config: DocumentPrintConfig): void {
    const idx = this.printConfigs.findIndex((c) => c.id === config.id);
    if (idx >= 0) {
      this.printConfigs[idx] = config;
    } else {
      this.printConfigs.push(config);
    }
    setLocal('printConfigs', this.printConfigs);
    this.notify();
  }

  public createRemito(params: {
    clientId: string;
    warehouseId: string;
    items: RemitoItem[];
    shippingCarrierId?: string;
    deliveryAddress?: string;
    notes?: string;
    user: User;
  }): Remito {
    const client = this.clients.find((c) => c.id === params.clientId) || this.clients[0];
    const warehouse = this.warehouses.find((w) => w.id === params.warehouseId) || this.warehouses[0];
    const subtotal = params.items.reduce((acc, i) => acc + i.subtotal, 0);
    const total = subtotal;

    const remitoIndex = this.remitos.length + 1;
    const remitoCode = `REM-0001-${String(remitoIndex).padStart(8, '0')}`;

    // Deduct stock for delivery note
    const newProducts = [...this.products];
    const newStockMovements: StockMovement[] = [...this.stockMovements];
    const effectiveWarehouseId = params.warehouseId || warehouse.id;

    for (const item of params.items) {
      const prodIdx = newProducts.findIndex((p) => p.id === item.productId);
      if (prodIdx >= 0) {
        const prod = { ...newProducts[prodIdx] };
        const prevStock = prod.stock || 0;
        const stockByWh = { ...(prod.stockByWarehouse || {}) };
        this.warehouses.forEach((w) => {
          if (stockByWh[w.id] === undefined) stockByWh[w.id] = 0;
        });

        const currentWhStock = stockByWh[effectiveWarehouseId] ?? 0;
        stockByWh[effectiveWarehouseId] = Math.max(0, currentWhStock - item.quantity);
        prod.stockByWarehouse = stockByWh;
        prod.stock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
        newProducts[prodIdx] = prod;

        newStockMovements.push({
          id: `sm-rem-${Date.now()}-${item.productId}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          warehouseId: effectiveWarehouseId,
          warehouseName: warehouse.name,
          type: 'out',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stock,
          referenceType: 'manual_adjustment',
          referenceId: remitoCode,
          reason: `Salida por Remito de Entrega ${remitoCode}`,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
    }

    this.products = newProducts;
    setLocal('products', this.products);
    this.stockMovements = newStockMovements;
    setLocal('stockMovements', this.stockMovements);

    const carrier = this.shippingCarriers.find((c) => c.id === params.shippingCarrierId);

    const newRemito: Remito = {
      id: `rem-${Date.now()}`,
      code: remitoCode,
      date: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      clientTaxId: client.taxId,
      clientTaxCondition: client.taxCondition,
      clientAddress: client.address,
      warehouseId: effectiveWarehouseId,
      warehouseName: warehouse.name,
      items: params.items,
      subtotal,
      total,
      status: 'pending_invoice',
      shippingCarrierId: params.shippingCarrierId,
      shippingCarrierName: carrier?.name,
      deliveryAddress: params.deliveryAddress || client.address,
      notes: params.notes,
      userId: params.user.id,
      userName: params.user.name,
    };

    this.remitos.unshift(newRemito);
    setLocal('remitos', this.remitos);
    this.notify();
    return newRemito;
  }

  public createQuote(params: {
    clientId: string;
    items: QuoteItem[];
    validityDays?: number;
    notes?: string;
    warehouseId?: string;
    priceListId?: string;
    discountPercent?: number;
    user: User;
  }): Quote {
    const client = this.clients.find((c) => c.id === params.clientId) || this.clients[0];
    const subtotal = params.items.reduce((acc, i) => acc + i.subtotal, 0);
    const discountPercent = params.discountPercent || 0;
    const discountTotal = discountPercent > 0 ? (subtotal * discountPercent) / 100 : 0;
    const total = Math.max(0, subtotal - discountTotal);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (params.validityDays || 7));

    const quoteIndex = this.quotes.length + 1;
    const quoteCode = `PRE-0001-${String(quoteIndex).padStart(7, '0')}`;

    const newQuote: Quote = {
      id: `quo-${Date.now()}`,
      code: quoteCode,
      date: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      clientId: client.id,
      clientName: client.name,
      clientTaxId: client.taxId,
      clientAddress: client.address,
      clientPhone: client.phone,
      warehouseId: params.warehouseId,
      priceListId: params.priceListId,
      items: params.items,
      subtotal,
      discountPercent,
      discountTotal,
      total,
      status: 'pending',
      notes: params.notes || 'Presupuesto sujeto a disponibilidad de stock y variación de precios.',
      userId: params.user.id,
      userName: params.user.name,
    };

    this.quotes.unshift(newQuote);
    setLocal('quotes', this.quotes);
    this.notify();
    return newQuote;
  }

  public updateQuote(updatedQuote: Quote): Quote {
    const subtotal = updatedQuote.items.reduce((acc, i) => acc + i.subtotal, 0);
    const discountPercent = updatedQuote.discountPercent || 0;
    const discountTotal = discountPercent > 0 ? (subtotal * discountPercent) / 100 : (updatedQuote.discountTotal || 0);
    const total = Math.max(0, subtotal - discountTotal);

    const normalizedQuote: Quote = {
      ...updatedQuote,
      subtotal,
      discountPercent,
      discountTotal,
      total,
    };

    this.quotes = this.quotes.map((q) => (q.id === normalizedQuote.id ? normalizedQuote : q));
    setLocal('quotes', this.quotes);
    this.notify();
    return normalizedQuote;
  }

  public deleteQuote(quoteId: string): void {
    this.quotes = this.quotes.filter((q) => q.id !== quoteId);
    setLocal('quotes', this.quotes);
    this.notify();
  }

  public markRemitosAsInvoiced(remitoIds: string[], saleId: string, saleCode: string): void {
    let changed = false;
    this.remitos = this.remitos.map((r) => {
      if (remitoIds.includes(r.id)) {
        changed = true;
        return {
          ...r,
          status: 'invoiced',
          invoicedSaleId: saleId,
          invoicedSaleCode: saleCode,
        };
      }
      return r;
    });

    if (changed) {
      setLocal('remitos', this.remitos);
      this.notify();
    }
  }

  public cancelRemito(remitoId: string): boolean {
    const idx = this.remitos.findIndex((r) => r.id === remitoId);
    if (idx < 0) return false;
    const rem = this.remitos[idx];
    if (rem.status === 'cancelled') return false;

    // Restore stock if it was not already invoiced
    if (rem.status === 'pending_invoice') {
      const newProducts = [...this.products];
      const effectiveWarehouseId = rem.warehouseId || '1';

      for (const item of rem.items) {
        const pIdx = newProducts.findIndex((p) => p.id === item.productId);
        if (pIdx >= 0) {
          const prod = { ...newProducts[pIdx] };
          const stockByWh = { ...(prod.stockByWarehouse || {}) };
          const cur = stockByWh[effectiveWarehouseId] || 0;
          stockByWh[effectiveWarehouseId] = cur + item.quantity;
          prod.stockByWarehouse = stockByWh;
          prod.stock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
          newProducts[pIdx] = prod;
        }
      }
      this.products = newProducts;
      setLocal('products', this.products);
    }

    this.remitos[idx] = {
      ...rem,
      status: 'cancelled',
    };
    setLocal('remitos', this.remitos);
    this.notify();
    return true;
  }

  // ==========================================
  // PERSONAL / RRHH / SUELDOS / GESTIÓN EMPLEADOS
  // ==========================================
  public saveEmployee(emp: Employee): Employee {
    const existingIdx = this.employees.findIndex((e) => e.id === emp.id);
    let updated: Employee;
    if (existingIdx >= 0) {
      updated = { ...emp };
      this.employees[existingIdx] = updated;
    } else {
      updated = {
        ...emp,
        id: emp.id || `emp-${Date.now()}`,
        code: emp.code || `EMP-${String(this.employees.length + 1).padStart(2, '0')}`,
      };
      this.employees.push(updated);
    }
    setLocal('employees', this.employees);
    this.notify();
    return updated;
  }

  public deleteEmployee(employeeId: string): boolean {
    const idx = this.employees.findIndex((e) => e.id === employeeId);
    if (idx < 0) return false;
    // Set inactive (dar de baja)
    this.employees[idx] = {
      ...this.employees[idx],
      active: false,
    };
    setLocal('employees', this.employees);
    this.notify();
    return true;
  }

  public registerEmployeeAdvance(adv: EmployeeAdvance, user: User): EmployeeAdvance {
    const newAdv: EmployeeAdvance = {
      ...adv,
      id: adv.id || `adv-${Date.now()}`,
      receiptNumber: adv.receiptNumber || `ADE-0001-${String(this.employeeAdvances.length + 1).padStart(8, '0')}`,
      date: adv.date || new Date().toISOString().slice(0, 10),
      status: 'paid',
    };

    this.employeeAdvances.unshift(newAdv);
    setLocal('employeeAdvances', this.employeeAdvances);

    // If paid via cash, register cash outflow in active session
    if (adv.paymentMethod === 'cash' && adv.boxId) {
      const activeSession = this.cashSessions.find((s) => s.status === 'open' && s.registerId === adv.boxId) ||
        this.cashSessions.find((s) => s.status === 'open');
      if (activeSession) {
        activeSession.expectedCash -= adv.amount;
        activeSession.totalOutflows += adv.amount;
        setLocal('cashSessions', this.cashSessions);

        this.cashMovements.push({
          id: `cm-adv-${Date.now()}`,
          date: new Date().toISOString(),
          sessionId: activeSession.id,
          boxId: activeSession.registerId,
          type: 'expense',
          paymentMethod: 'cash',
          amount: adv.amount,
          concept: `Adelanto de Sueldo - ${adv.employeeName} (${adv.reason || 'S/M'})`,
          referenceType: 'employee_advance',
          referenceId: newAdv.receiptNumber,
          userId: user.id,
          userName: user.name,
        });
        setLocal('cashMovements', this.cashMovements);
      }
    }

    this.notify();
    return newAdv;
  }

  public deleteEmployeeAdvance(advanceId: string): boolean {
    const idx = this.employeeAdvances.findIndex((a) => a.id === advanceId);
    if (idx < 0) return false;
    this.employeeAdvances.splice(idx, 1);
    setLocal('employeeAdvances', this.employeeAdvances);
    this.notify();
    return true;
  }

  public registerEmployeePayment(pay: EmployeePayment, user: User): EmployeePayment {
    const newPay: EmployeePayment = {
      ...pay,
      id: pay.id || `pay-${Date.now()}`,
      receiptNumber: pay.receiptNumber || `REC-SUELDO-${pay.periodMonth.replace('-', '')}-${String(this.employeePayments.length + 1).padStart(2, '0')}`,
      date: pay.date || new Date().toISOString().slice(0, 10),
      status: 'paid',
    };

    this.employeePayments.unshift(newPay);
    setLocal('employeePayments', this.employeePayments);

    // If paid in cash, record outflow
    if (pay.paymentMethod === 'cash') {
      const activeSession = this.cashSessions.find((s) => s.status === 'open');
      if (activeSession) {
        activeSession.expectedCash -= pay.netAmount;
        activeSession.totalOutflows += pay.netAmount;
        setLocal('cashSessions', this.cashSessions);

        this.cashMovements.push({
          id: `cm-pay-${Date.now()}`,
          date: new Date().toISOString(),
          sessionId: activeSession.id,
          boxId: activeSession.registerId,
          type: 'expense',
          paymentMethod: 'cash',
          amount: pay.netAmount,
          concept: `Pago Sueldo/Haberes - ${pay.employeeName} (Período: ${pay.periodMonth})`,
          referenceType: 'employee_payment',
          referenceId: newPay.receiptNumber,
          userId: user.id,
          userName: user.name,
        });
        setLocal('cashMovements', this.cashMovements);
      }
    }

    this.notify();
    return newPay;
  }

  public deleteEmployeePayment(paymentId: string): boolean {
    const idx = this.employeePayments.findIndex((p) => p.id === paymentId);
    if (idx < 0) return false;
    this.employeePayments.splice(idx, 1);
    setLocal('employeePayments', this.employeePayments);
    this.notify();
    return true;
  }

  public registerEmployeeAbsence(absence: EmployeeAbsence): EmployeeAbsence {
    const newAbs: EmployeeAbsence = {
      ...absence,
      id: absence.id || `abs-${Date.now()}`,
      date: absence.date || new Date().toISOString().slice(0, 10),
    };
    this.employeeAbsences.unshift(newAbs);
    setLocal('employeeAbsences', this.employeeAbsences);
    this.notify();
    return newAbs;
  }

  public deleteEmployeeAbsence(absenceId: string): boolean {
    const idx = this.employeeAbsences.findIndex((a) => a.id === absenceId);
    if (idx < 0) return false;
    this.employeeAbsences.splice(idx, 1);
    setLocal('employeeAbsences', this.employeeAbsences);
    this.notify();
    return true;
  }

  public registerEmployeeVacation(vac: EmployeeVacation): EmployeeVacation {
    const newVac: EmployeeVacation = {
      ...vac,
      id: vac.id || `vac-${Date.now()}`,
      status: 'scheduled',
    };
    this.employeeVacations.unshift(newVac);
    setLocal('employeeVacations', this.employeeVacations);
    this.notify();
    return newVac;
  }

  public deleteEmployeeVacation(vacationId: string): boolean {
    const idx = this.employeeVacations.findIndex((v) => v.id === vacationId);
    if (idx < 0) return false;
    this.employeeVacations.splice(idx, 1);
    setLocal('employeeVacations', this.employeeVacations);
    this.notify();
    return true;
  }

  public saveEmployeeSpecialDate(sd: EmployeeSpecialDate): EmployeeSpecialDate {
    const existingIdx = this.employeeSpecialDates.findIndex((d) => d.id === sd.id);
    let updated: EmployeeSpecialDate;
    if (existingIdx >= 0) {
      updated = { ...sd };
      this.employeeSpecialDates[existingIdx] = updated;
    } else {
      updated = {
        ...sd,
        id: sd.id || `sd-${Date.now()}`,
      };
      this.employeeSpecialDates.push(updated);
    }
    setLocal('employeeSpecialDates', this.employeeSpecialDates);
    this.notify();
    return updated;
  }

  public deleteEmployeeSpecialDate(sdId: string): boolean {
    const idx = this.employeeSpecialDates.findIndex((d) => d.id === sdId);
    if (idx < 0) return false;
    this.employeeSpecialDates.splice(idx, 1);
    setLocal('employeeSpecialDates', this.employeeSpecialDates);
    this.notify();
    return true;
  }

  public restoreBackupData(): void {
    this.settings = INITIAL_COMPANY_SETTINGS;
    this.warehouses = INITIAL_WAREHOUSES;
    this.products = INITIAL_PRODUCTS;
    this.clients = INITIAL_CLIENTS;
    this.suppliers = INITIAL_SUPPLIERS;
    this.cashRegisters = INITIAL_CASH_REGISTERS;
    this.priceLists = INITIAL_PRICE_LISTS;
    this.fixedExpenses = INITIAL_FIXED_EXPENSES;
    this.purchases = INITIAL_PURCHASES;
    this.supplierAccountMovements = INITIAL_SUPPLIER_ACCOUNT_MOVEMENTS;
    this.supplierPaymentOrders = INITIAL_SUPPLIER_PAYMENT_ORDERS;
    
    setLocal('settings', this.settings);
    setLocal('warehouses', this.warehouses);
    setLocal('products', this.products);
    setLocal('clients', this.clients);
    setLocal('suppliers', this.suppliers);
    setLocal('cashRegisters', this.cashRegisters);
    setLocal('priceLists', this.priceLists);
    setLocal('fixedExpenses', this.fixedExpenses);
    setLocal('purchases', this.purchases);
    setLocal('supplierAccountMovements', this.supplierAccountMovements);
    setLocal('supplierPaymentOrders', this.supplierPaymentOrders);
    
    this.notify();
  }

  public importBackupData(data: any): void {
    if (!data) return;
    if (data.company) {
      this.settings = { ...this.settings, ...data.company };
      setLocal('settings', this.settings);
    }
    if (data.products && Array.isArray(data.products)) {
      this.products = data.products;
      setLocal('products', this.products);
    }
    if (data.clients && Array.isArray(data.clients)) {
      this.clients = data.clients;
      setLocal('clients', this.clients);
    }
    if (data.suppliers && Array.isArray(data.suppliers)) {
      this.suppliers = data.suppliers;
      setLocal('suppliers', this.suppliers);
    }
    if (data.priceLists && Array.isArray(data.priceLists)) {
      this.priceLists = data.priceLists;
      setLocal('priceLists', this.priceLists);
    }
    if (data.warehouses && Array.isArray(data.warehouses)) {
      this.warehouses = data.warehouses;
      setLocal('warehouses', this.warehouses);
    }
    if (data.fixedExpenses && Array.isArray(data.fixedExpenses)) {
      this.fixedExpenses = data.fixedExpenses;
      setLocal('fixedExpenses', this.fixedExpenses);
    }
    this.notify();
  }

  public importSqlBackupData(sqlText: string): void {
    if (!sqlText) return;
    try {
      const newProducts: any[] = [];
      const newClients: any[] = [];
      const newSuppliers: any[] = [];
      const newSales: any[] = [];

      const insertRegex = /INSERT INTO\s+([a-zA-Z0-9_]+)[^)]*\bVALUES\b\s*\(([^;]+)\)/gi;
      let match;
      while ((match = insertRegex.exec(sqlText)) !== null) {
        const tableName = match[1].toLowerCase();
        const rawValues = match[2];
        const values = parseSqlValues(rawValues);

        if (tableName.includes('product') || tableName.includes('articulo') || tableName.includes('item')) {
          newProducts.push({
            id: `prod-${Math.random().toString(36).substring(2, 9)}`,
            code: values[1] || values[0] || `SKU-${Math.floor(Math.random() * 10000)}`,
            name: values[2] || values[1] || 'Producto Importado',
            salePrice: Number(values[3]) || Number(values[5]) || 1500,
            costPrice: Number(values[4]) || Number(values[6]) || 800,
            stock: Number(values[5]) || Number(values[7]) || 10,
            stockMin: 5,
            category: 'General',
            active: true,
          });
        } else if (tableName.includes('client') || tableName.includes('cliente') || tableName.includes('customer')) {
          newClients.push({
            id: `cli-${Math.random().toString(36).substring(2, 9)}`,
            name: values[1] || values[0] || 'Cliente Importado',
            cuit: values[2] || '',
            phone: values[3] || '',
            address: values[4] || '',
            currentBalance: Number(values[5]) || 0,
            hasCurrentAccount: true,
          });
        } else if (tableName.includes('supplier') || tableName.includes('proveedor')) {
          newSuppliers.push({
            id: `sup-${Math.random().toString(36).substring(2, 9)}`,
            name: values[1] || values[0] || 'Proveedor Importado',
            phone: values[2] || '',
            email: values[3] || '',
            active: true,
          });
        } else if (tableName.includes('sale') || tableName.includes('venta') || tableName.includes('factura')) {
          newSales.push({
            id: `sale-${Math.random().toString(36).substring(2, 9)}`,
            clientName: values[1] || 'Consumidor Final',
            total: Number(values[2]) || 5000,
            date: new Date().toLocaleDateString('es-AR'),
            items: [],
            status: 'Completado',
          });
        }
      }

      if (newProducts.length > 0) {
        this.products = [...newProducts, ...this.products];
        setLocal('products', this.products);
      }
      if (newClients.length > 0) {
        this.clients = [...newClients, ...this.clients];
        setLocal('clients', this.clients);
      }
      if (newSuppliers.length > 0) {
        this.suppliers = [...newSuppliers, ...this.suppliers];
        setLocal('suppliers', this.suppliers);
      }
      if (newSales.length > 0) {
        this.sales = [...newSales, ...this.sales];
        setLocal('sales', this.sales);
      }

      this.notify();
    } catch (err) {
      console.error('Error parsing SQL backup:', err);
    }
  }

  // --- Price Lists Methods ---

  public addPriceList(list: Omit<PriceList, 'id'>): PriceList {
    const newList: PriceList = {
      ...list,
      id: 'pl-' + Date.now(),
      active: list.active ?? true,
    };
    if (newList.isDefault) {
      this.priceLists = this.priceLists.map((pl) => ({ ...pl, isDefault: false }));
    }
    this.priceLists = [...this.priceLists, newList];
    setLocal('priceLists', this.priceLists);
    this.notify();
    return newList;
  }

  public updatePriceList(id: string, updates: Partial<PriceList>): void {
    if (updates.isDefault) {
      this.priceLists = this.priceLists.map((pl) => ({ ...pl, isDefault: pl.id === id }));
    }
    this.priceLists = this.priceLists.map((pl) => (pl.id === id ? { ...pl, ...updates } : pl));
    setLocal('priceLists', this.priceLists);
    this.notify();
  }

  public deletePriceList(id: string): boolean {
    const target = this.priceLists.find((pl) => pl.id === id);
    if (target?.isDefault) return false;
    this.priceLists = this.priceLists.filter((pl) => pl.id !== id);
    setLocal('priceLists', this.priceLists);
    this.notify();
    return true;
  }

  // --- E-Commerce & Distribuidora Methods ---

  public updateEcommerceConfig(updates: Partial<EcommerceConfig>): void {
    this.ecommerceConfig = { ...this.ecommerceConfig, ...updates };
    setLocal('ecommerceConfig', this.ecommerceConfig);
    this.notify();
  }

  public toggleProductPublishOnline(productId: string, publishOnline: boolean): void {
    this.products = this.products.map((p) => (p.id === productId ? { ...p, publishOnline } : p));
    setLocal('products', this.products);
    this.notify();
  }

  public toggleProductPublishWholesale(productId: string, publishWholesale: boolean): void {
    this.products = this.products.map((p) => (p.id === productId ? { ...p, publishWholesale } : p));
    setLocal('products', this.products);
    this.notify();
  }

  public toggleProductFeatured(productId: string, isFeatured: boolean): void {
    this.products = this.products.map((p) => (p.id === productId ? { ...p, isFeatured } : p));
    setLocal('products', this.products);
    this.notify();
  }

  public toggleProductOnOffer(productId: string, isOnOffer: boolean): void {
    this.products = this.products.map((p) => (p.id === productId ? { ...p, isOnOffer } : p));
    setLocal('products', this.products);
    this.notify();
  }

  public updateProductEcommerce(productId: string, updates: Partial<Product>): void {
    this.products = this.products.map((p) => (p.id === productId ? { ...p, ...updates } : p));
    setLocal('products', this.products);
    this.notify();
  }

  public batchTogglePublishOnline(productIds: string[], publishOnline: boolean): void {
    const idSet = new Set(productIds);
    this.products = this.products.map((p) => (idSet.has(p.id) ? { ...p, publishOnline } : p));
    setLocal('products', this.products);
    this.notify();
  }

  public applyWholesaleMarginToAll(marginPercent: number): void {
    this.products = this.products.map((p) => {
      const cost = p.costPrice || 0;
      const wholesaleCustomPrice = Math.round(cost * (1 + marginPercent / 100) * 100) / 100;
      return {
        ...p,
        wholesaleMarginPercent: marginPercent,
        wholesaleCustomPrice,
      };
    });
    this.ecommerceConfig = {
      ...this.ecommerceConfig,
      wholesaleDefaultMargin: marginPercent,
    };
    setLocal('products', this.products);
    setLocal('ecommerceConfig', this.ecommerceConfig);
    this.notify();
  }

  public updateProductWholesale(productId: string, updates: Partial<Product>): void {
    this.products = this.products.map((p) => (p.id === productId ? { ...p, ...updates } : p));
    setLocal('products', this.products);
    this.notify();
  }

  public addEcommerceOrder(order: EcommerceOrder): void {
    this.ecommerceOrders = [order, ...this.ecommerceOrders];
    setLocal('ecommerceOrders', this.ecommerceOrders);
    this.notify();
  }

  public updateEcommerceOrderStatus(
    orderId: string,
    status: EcommerceOrder['status'],
    paymentStatus?: EcommerceOrder['paymentStatus']
  ): void {
    this.ecommerceOrders = this.ecommerceOrders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status,
        ...(paymentStatus ? { paymentStatus } : {}),
      };
    });
    setLocal('ecommerceOrders', this.ecommerceOrders);
    this.notify();
  }

  // --- Devoluciones (Ventas y Proveedores) ---

  public registerSaleReturn(params: {
    saleId?: string;
    saleCode?: string;
    clientId: string;
    clientName: string;
    clientTaxId?: string;
    items: SaleReturnItem[];
    total: number;
    reason: string;
    notes?: string;
    refundMethod: 'cash' | 'credit_note' | 'current_account' | 'exchange_voucher';
    creditNoteNumber?: string;
    warehouseId: string;
    user: User;
  }): SaleReturn {
    const count = this.saleReturns.length + 1;
    const code = `DEV-VTA-0001-${String(count).padStart(8, '0')}`;
    const ncNumber = params.creditNoteNumber || `NC-0001-${String(Date.now()).slice(-8)}`;
    const effectiveWarehouseId = params.warehouseId || this.warehouses.find((w) => w.isMain)?.id || this.warehouses[0]?.id || '1';
    const whName = this.warehouses.find((w) => w.id === effectiveWarehouseId)?.name || 'Casa Central';

    const newReturn: SaleReturn = {
      id: `dev-vta-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code,
      date: new Date().toISOString(),
      saleId: params.saleId,
      saleCode: params.saleCode,
      clientId: params.clientId,
      clientName: params.clientName,
      clientTaxId: params.clientTaxId,
      items: params.items,
      total: params.total,
      reason: params.reason,
      notes: params.notes,
      refundMethod: params.refundMethod,
      creditNoteNumber: ncNumber,
      warehouseId: effectiveWarehouseId,
      warehouseName: whName,
      userId: params.user.id,
      userName: params.user.name,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    // 1. Stock Adjustment for restocked items
    const newProducts = [...this.products];
    const newMovements = [...this.stockMovements];

    for (const item of params.items) {
      if (item.disposition === 'restock') {
        const pIdx = newProducts.findIndex((p) => p.id === item.productId);
        if (pIdx >= 0) {
          const prod = { ...newProducts[pIdx] };
          const prev = prod.stock || 0;
          const stockByWh = { ...(prod.stockByWarehouse || {}) };
          this.warehouses.forEach((w) => {
            if (stockByWh[w.id] === undefined) stockByWh[w.id] = 0;
          });
          const whStock = stockByWh[effectiveWarehouseId] || 0;
          stockByWh[effectiveWarehouseId] = whStock + item.quantity;
          prod.stockByWarehouse = stockByWh;
          prod.stock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
          newProducts[pIdx] = prod;

          newMovements.unshift({
            id: `sm-ret-${Date.now()}-${item.productId}-${Math.random().toString(36).substr(2, 4)}`,
            date: new Date().toISOString(),
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            warehouseId: effectiveWarehouseId,
            warehouseName: whName,
            type: 'return',
            quantity: item.quantity,
            previousStock: prev,
            newStock: prod.stock,
            referenceType: 'sale',
            referenceId: code,
            reason: `Devolución de venta ${code}: ${params.reason} (${item.productName})`,
            userId: params.user.id,
            userName: params.user.name,
          });
        }
      }
    }
    this.products = newProducts;
    setLocal('products', this.products);
    this.stockMovements = newMovements;
    setLocal('stockMovements', this.stockMovements);

    // 2. Financial / Account Adjustment
    if (params.refundMethod === 'current_account' || params.refundMethod === 'credit_note') {
      const cliIdx = this.clients.findIndex((c) => c.id === params.clientId);
      if (cliIdx >= 0) {
        const cl = { ...this.clients[cliIdx] };
        cl.currentBalance = (cl.currentBalance || 0) - params.total;
        this.clients[cliIdx] = cl;
        setLocal('clients', this.clients);

        this.clientAccountMovements.unshift({
          id: `cam-ret-${Date.now()}`,
          date: new Date().toISOString(),
          clientId: cl.id,
          clientName: cl.name,
          type: 'return_credit',
          amount: params.total,
          balanceAfter: cl.currentBalance,
          referenceType: 'refund',
          referenceId: code,
          concept: `Nota de Crédito por Devolución ${code} (Ref: ${params.saleCode || 'Venta'})`,
          userId: params.user.id,
        });
        setLocal('clientAccountMovements', this.clientAccountMovements);
      }
    } else if (params.refundMethod === 'cash') {
      const activeSession = this.cashSessions.find((s) => s.status === 'open');
      if (activeSession) {
        const newMovements = [...this.cashMovements];
        newMovements.unshift({
          id: `cm-ret-${Date.now()}`,
          date: new Date().toISOString(),
          sessionId: activeSession.id,
          boxId: activeSession.registerId,
          type: 'manual_outflow',
          paymentMethod: 'cash',
          amount: params.total,
          concept: `Reintegro efectivo devolución ${code} - ${params.clientName}`,
          userId: params.user.id,
          userName: params.user.name,
        });
        this.cashMovements = newMovements;
        setLocal('cashMovements', this.cashMovements);
      }
    }

    // 3. Mark original sale if full return
    if (params.saleId) {
      const sIdx = this.sales.findIndex((s) => s.id === params.saleId);
      if (sIdx >= 0) {
        const originalSale = this.sales[sIdx];
        if (params.total >= originalSale.total) {
          originalSale.status = 'refunded';
          originalSale.cancelledAt = new Date().toISOString();
          originalSale.cancelledReason = `Devolución total comprobante ${code}`;
          this.sales[sIdx] = originalSale;
          setLocal('sales', this.sales);
        }
      }
    }

    this.saleReturns.unshift(newReturn);
    setLocal('saleReturns', this.saleReturns);
    this.notify();
    return newReturn;
  }

  public registerSupplierReturn(params: {
    purchaseId?: string;
    purchaseCode?: string;
    supplierId: string;
    supplierName: string;
    supplierTaxId?: string;
    items: SupplierReturnItem[];
    total: number;
    reason: string;
    notes?: string;
    creditMethod: 'supplier_current_account' | 'cash_refund' | 'supplier_credit_note';
    supplierCreditNoteNumber?: string;
    warehouseId: string;
    user: User;
  }): SupplierReturn {
    const count = this.supplierReturns.length + 1;
    const code = `DEV-PRV-0001-${String(count).padStart(8, '0')}`;
    const effectiveWarehouseId = params.warehouseId || this.warehouses.find((w) => w.isMain)?.id || this.warehouses[0]?.id || '1';
    const whName = this.warehouses.find((w) => w.id === effectiveWarehouseId)?.name || 'Casa Central';

    const newReturn: SupplierReturn = {
      id: `dev-prv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code,
      date: new Date().toISOString(),
      purchaseId: params.purchaseId,
      purchaseCode: params.purchaseCode,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      supplierTaxId: params.supplierTaxId,
      items: params.items,
      total: params.total,
      reason: params.reason,
      notes: params.notes,
      creditMethod: params.creditMethod,
      supplierCreditNoteNumber: params.supplierCreditNoteNumber,
      warehouseId: effectiveWarehouseId,
      warehouseName: whName,
      userId: params.user.id,
      userName: params.user.name,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    // 1. Discount stock (returned to supplier)
    const newProducts = [...this.products];
    const newMovements = [...this.stockMovements];

    for (const item of params.items) {
      const pIdx = newProducts.findIndex((p) => p.id === item.productId);
      if (pIdx >= 0) {
        const prod = { ...newProducts[pIdx] };
        const prev = prod.stock || 0;
        const stockByWh = { ...(prod.stockByWarehouse || {}) };
        this.warehouses.forEach((w) => {
          if (stockByWh[w.id] === undefined) stockByWh[w.id] = 0;
        });
        const whStock = stockByWh[effectiveWarehouseId] || 0;
        stockByWh[effectiveWarehouseId] = Math.max(0, whStock - item.quantity);
        prod.stockByWarehouse = stockByWh;
        prod.stock = Object.values(stockByWh).reduce((acc, s) => acc + (Number(s) || 0), 0);
        newProducts[pIdx] = prod;

        newMovements.unshift({
          id: `sm-ret-prv-${Date.now()}-${item.productId}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          warehouseId: effectiveWarehouseId,
          warehouseName: whName,
          type: 'return',
          quantity: -item.quantity,
          previousStock: prev,
          newStock: prod.stock,
          referenceType: 'purchase',
          referenceId: code,
          reason: `Devolución a proveedor ${params.supplierName} (${code}): ${params.reason}`,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
    }
    this.products = newProducts;
    setLocal('products', this.products);
    this.stockMovements = newMovements;
    setLocal('stockMovements', this.stockMovements);

    // 2. Adjust supplier balance / debt
    const supplier = this.suppliers.find((s) => s.id === params.supplierId || s.name === params.supplierName);
    if (supplier) {
      if (params.creditMethod === 'supplier_current_account' || params.creditMethod === 'supplier_credit_note') {
        supplier.currentBalance = Math.max(0, (supplier.currentBalance || 0) - params.total);
        this.supplierAccountMovements.unshift({
          id: `sam-ret-${Date.now()}`,
          date: new Date().toISOString(),
          supplierId: supplier.id,
          supplierName: supplier.name,
          type: 'credit_note',
          amount: params.total,
          balanceAfter: supplier.currentBalance,
          referenceType: 'credit_note',
          referenceId: code,
          concept: `Nota de Crédito por Devolución a Proveedor ${code}`,
          userId: params.user.id,
        });
        setLocal('suppliers', this.suppliers);
        setLocal('supplierAccountMovements', this.supplierAccountMovements);
      } else if (params.creditMethod === 'cash_refund') {
        const activeSession = this.cashSessions.find((s) => s.status === 'open');
        if (activeSession) {
          this.cashMovements.unshift({
            id: `cm-ret-prv-${Date.now()}`,
            date: new Date().toISOString(),
            sessionId: activeSession.id,
            boxId: activeSession.registerId,
            type: 'manual_inflow',
            paymentMethod: 'cash',
            amount: params.total,
            concept: `Reintegro dinero por devolución a proveedor ${params.supplierName} (${code})`,
            userId: params.user.id,
            userName: params.user.name,
          });
          setLocal('cashMovements', this.cashMovements);
        }
      }
    }

    this.supplierReturns.unshift(newReturn);
    setLocal('supplierReturns', this.supplierReturns);
    this.notify();
    return newReturn;
  }

  // ==========================================
  // PROGRAMA DE FIDELIZACIÓN / LOYALTY MODULE
  // ==========================================
  public saveLoyaltyConfig(config: LoyaltyConfig): void {
    this.loyaltyConfig = config;
    setLocal('loyaltyConfig', this.loyaltyConfig);
    this.notify();
  }

  public saveLoyaltyReward(reward: LoyaltyReward): void {
    const idx = this.loyaltyRewards.findIndex((r) => r.id === reward.id);
    if (idx >= 0) {
      this.loyaltyRewards[idx] = reward;
    } else {
      this.loyaltyRewards.unshift(reward);
    }
    setLocal('loyaltyRewards', this.loyaltyRewards);
    this.notify();
  }

  public deleteLoyaltyReward(id: string): boolean {
    const prevLen = this.loyaltyRewards.length;
    this.loyaltyRewards = this.loyaltyRewards.filter((r) => r.id !== id);
    if (this.loyaltyRewards.length !== prevLen) {
      setLocal('loyaltyRewards', this.loyaltyRewards);
      this.notify();
      return true;
    }
    return false;
  }

  public saveLoyaltyBonusRule(rule: LoyaltyBonusRule): void {
    const idx = this.loyaltyBonusRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.loyaltyBonusRules[idx] = rule;
    } else {
      this.loyaltyBonusRules.unshift(rule);
    }
    setLocal('loyaltyBonusRules', this.loyaltyBonusRules);
    this.notify();
  }

  public deleteLoyaltyBonusRule(id: string): boolean {
    const prevLen = this.loyaltyBonusRules.length;
    this.loyaltyBonusRules = this.loyaltyBonusRules.filter((r) => r.id !== id);
    if (this.loyaltyBonusRules.length !== prevLen) {
      setLocal('loyaltyBonusRules', this.loyaltyBonusRules);
      this.notify();
      return true;
    }
    return false;
  }

  public saveLoyaltySurvey(survey: LoyaltySurvey): void {
    const idx = this.loyaltySurveys.findIndex((s) => s.id === survey.id);
    if (idx >= 0) {
      this.loyaltySurveys[idx] = survey;
    } else {
      this.loyaltySurveys.unshift(survey);
    }
    setLocal('loyaltySurveys', this.loyaltySurveys);
    this.notify();
  }

  public deleteLoyaltySurvey(id: string): boolean {
    const prevLen = this.loyaltySurveys.length;
    this.loyaltySurveys = this.loyaltySurveys.filter((s) => s.id !== id);
    if (this.loyaltySurveys.length !== prevLen) {
      setLocal('loyaltySurveys', this.loyaltySurveys);
      this.notify();
      return true;
    }
    return false;
  }

  public saveLoyaltyBranch(branch: LoyaltyBranch): void {
    if (branch.isMain) {
      this.loyaltyBranches.forEach((b) => {
        if (b.id !== branch.id) b.isMain = false;
      });
    }
    const idx = this.loyaltyBranches.findIndex((b) => b.id === branch.id);
    if (idx >= 0) {
      this.loyaltyBranches[idx] = branch;
    } else {
      this.loyaltyBranches.unshift(branch);
    }
    setLocal('loyaltyBranches', this.loyaltyBranches);
    this.notify();
  }

  public deleteLoyaltyBranch(id: string): boolean {
    const prevLen = this.loyaltyBranches.length;
    this.loyaltyBranches = this.loyaltyBranches.filter((b) => b.id !== id);
    if (this.loyaltyBranches.length !== prevLen) {
      setLocal('loyaltyBranches', this.loyaltyBranches);
      this.notify();
      return true;
    }
    return false;
  }

  public saveLoyaltyRaffle(raffle: LoyaltyRaffle): void {
    const idx = this.loyaltyRaffles.findIndex((r) => r.id === raffle.id);
    if (idx >= 0) {
      this.loyaltyRaffles[idx] = raffle;
    } else {
      this.loyaltyRaffles.unshift(raffle);
    }
    setLocal('loyaltyRaffles', this.loyaltyRaffles);
    this.notify();
  }

  public deleteLoyaltyRaffle(id: string): boolean {
    const prevLen = this.loyaltyRaffles.length;
    this.loyaltyRaffles = this.loyaltyRaffles.filter((r) => r.id !== id);
    if (this.loyaltyRaffles.length !== prevLen) {
      setLocal('loyaltyRaffles', this.loyaltyRaffles);
      this.notify();
      return true;
    }
    return false;
  }

  public drawLoyaltyRaffle(raffleId: string): { winnerClientId: string; winnerClientName: string } | null {
    const raffle = this.loyaltyRaffles.find((r) => r.id === raffleId);
    if (!raffle) return null;

    // Filter transactions for this raffle or eligible clients
    const eligibleClients = this.clients.filter((c) => c.loyaltyEligible && !c.hasCurrentAccount);
    if (eligibleClients.length === 0) return null;

    const winner = eligibleClients[Math.floor(Math.random() * eligibleClients.length)];
    raffle.status = 'drawn';
    raffle.winnerClientId = winner.id;
    raffle.winnerClientName = winner.name;
    raffle.drawDate = new Date().toISOString();

    setLocal('loyaltyRaffles', this.loyaltyRaffles);
    this.notify();
    return { winnerClientId: winner.id, winnerClientName: winner.name };
  }

  public addLoyaltyPoints(
    clientId: string,
    pointsToAdd: number,
    reason: string,
    referenceType: 'sale' | 'reward_redemption' | 'manual' | 'raffle' | 'survey' = 'manual',
    referenceId?: string,
    userId: string = 'user-1'
  ): boolean {
    const cliIdx = this.clients.findIndex((c) => c.id === clientId);
    if (cliIdx < 0) return false;

    const client = { ...this.clients[cliIdx] };
    if (client.hasCurrentAccount || !client.loyaltyEligible) {
      return false; // Excluded from loyalty
    }

    const currentPoints = client.loyaltyPoints || 0;
    const newBalance = Math.max(0, currentPoints + pointsToAdd);
    const lifetime = (client.loyaltyLifetimePoints || currentPoints) + (pointsToAdd > 0 ? pointsToAdd : 0);

    // Calculate Tier based on points balance
    let tier: 'Bronce' | 'Plata' | 'Oro' | 'Platino' = 'Bronce';
    if (newBalance >= 6000) tier = 'Platino';
    else if (newBalance >= 3000) tier = 'Oro';
    else if (newBalance >= 1000) tier = 'Plata';

    client.loyaltyPoints = newBalance;
    client.loyaltyLifetimePoints = lifetime;
    client.loyaltyTier = tier;
    this.clients[cliIdx] = client;
    setLocal('clients', this.clients);

    const transaction: LoyaltyTransaction = {
      id: `tx-loyalty-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      type: pointsToAdd >= 0 ? (referenceType === 'sale' ? 'earned_sale' : 'manual_adjustment') : 'manual_adjustment',
      points: pointsToAdd,
      balanceAfter: newBalance,
      referenceType,
      referenceId,
      description: reason,
      userId,
    };

    this.loyaltyTransactions.unshift(transaction);
    setLocal('loyaltyTransactions', this.loyaltyTransactions);
    this.notify();
    return true;
  }

  public redeemLoyaltyReward(
    clientId: string,
    rewardId: string,
    userId: string = 'user-1'
  ): { success: boolean; message: string; redemption?: LoyaltyRedemption } {
    const cliIdx = this.clients.findIndex((c) => c.id === clientId);
    if (cliIdx < 0) return { success: false, message: 'Cliente no encontrado' };

    const client = { ...this.clients[cliIdx] };
    const rewardIdx = this.loyaltyRewards.findIndex((r) => r.id === rewardId);
    if (rewardIdx < 0) return { success: false, message: 'Premio no encontrado' };

    const reward = { ...this.loyaltyRewards[rewardIdx] };
    const cost = reward.pointsRequired ?? reward.pointsCost;

    if (client.loyaltyPoints < cost) {
      return { success: false, message: `Puntos insuficientes (${client.loyaltyPoints} de ${cost})` };
    }
    if (reward.stock <= 0) {
      return { success: false, message: 'Premio sin stock disponible' };
    }

    // Deduct points
    client.loyaltyPoints -= cost;
    this.clients[cliIdx] = client;
    setLocal('clients', this.clients);

    // Deduct stock
    reward.stock = Math.max(0, reward.stock - 1);
    if (reward.stockAvailable !== undefined) reward.stockAvailable = reward.stock;
    this.loyaltyRewards[rewardIdx] = reward;
    setLocal('loyaltyRewards', this.loyaltyRewards);

    // Generate unique CANJE code matching screenshots
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `CANJE-${randomCode}`;

    const redemption: LoyaltyRedemption = {
      id: `red-${Date.now()}-${randomCode}`,
      code,
      date: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      rewardId: reward.id,
      rewardTitle: reward.name || reward.title,
      pointsSpent: cost,
      status: 'issued',
    };

    this.loyaltyRedemptions.unshift(redemption);
    setLocal('loyaltyRedemptions', this.loyaltyRedemptions);

    // Transaction record
    const transaction: LoyaltyTransaction = {
      id: `tx-red-${Date.now()}`,
      date: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      type: 'redeemed_reward',
      points: -cost,
      balanceAfter: client.loyaltyPoints,
      referenceType: 'reward_redemption',
      referenceId: code,
      description: `Canje de premio: ${reward.name || reward.title} (Código: ${code})`,
      userId,
    };
    this.loyaltyTransactions.unshift(transaction);
    setLocal('loyaltyTransactions', this.loyaltyTransactions);

    this.notify();
    return { success: true, message: 'Canje generado exitosamente', redemption };
  }

  public validateAndDeliverRedemption(
    code: string,
    userId: string = 'user-1'
  ): { success: boolean; message: string; redemption?: LoyaltyRedemption } {
    const cleanCode = code.trim().toUpperCase();
    const red = this.loyaltyRedemptions.find(
      (r) => r.code.toUpperCase() === cleanCode || r.code.toUpperCase() === `CANJE-${cleanCode}`
    );

    if (!red) {
      return { success: false, message: `No se encontró ningún canje con el código "${code}".` };
    }

    if (red.status === 'delivered') {
      return {
        success: false,
        message: `El canje ${red.code} ya fue entregado previamente el ${new Date(red.deliveredAt || red.date).toLocaleDateString('es-AR')}.`,
        redemption: red,
      };
    }

    if (red.status === 'cancelled') {
      return { success: false, message: `El canje ${red.code} se encuentra cancelado.`, redemption: red };
    }

    red.status = 'delivered';
    red.deliveredAt = new Date().toISOString();
    red.deliveredByUserId = userId;

    setLocal('loyaltyRedemptions', this.loyaltyRedemptions);
    this.notify();
    return {
      success: true,
      message: `¡Canje validado! Entregar "${red.rewardTitle}" a ${red.clientName}.`,
      redemption: red,
    };
  }

  public resetAllLoyaltyPoints(): void {
    this.clients = this.clients.map((c) => ({
      ...c,
      loyaltyPoints: 0,
      loyaltyLifetimePoints: 0,
      loyaltyTier: 'Bronce',
    }));
    this.loyaltyTransactions = [];
    setLocal('clients', this.clients);
    setLocal('loyaltyTransactions', this.loyaltyTransactions);
    this.notify();
  }

  // ================= FIXED EXPENSES (GASTOS FIJOS) =================
  public saveFixedExpense(expense: FixedExpense): void {
    const idx = this.fixedExpenses.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      this.fixedExpenses[idx] = expense;
    } else {
      this.fixedExpenses.push(expense);
    }
    setLocal('fixedExpenses', this.fixedExpenses);
    this.notify();
  }

  public deleteFixedExpense(id: string): boolean {
    const prevLen = this.fixedExpenses.length;
    this.fixedExpenses = this.fixedExpenses.filter((e) => e.id !== id);
    if (this.fixedExpenses.length !== prevLen) {
      setLocal('fixedExpenses', this.fixedExpenses);
      this.notify();
      return true;
    }
    return false;
  }

  public toggleFixedExpenseActive(id: string): boolean {
    const exp = this.fixedExpenses.find((e) => e.id === id);
    if (!exp) return false;
    exp.active = !exp.active;
    setLocal('fixedExpenses', this.fixedExpenses);
    this.notify();
    return exp.active;
  }

  public recalculatePersonnelExpenses(): number {
    const totalSalary = this.employees
      .filter((e) => e.active)
      .reduce((sum, e) => sum + (e.baseSalary || 0), 0);
    const empExpense = this.fixedExpenses.find((e) => e.isCalculatedFromPersonnel || e.name.toLowerCase().includes('empleado') || e.name.toLowerCase().includes('sueldo'));
    if (empExpense && totalSalary > 0) {
      empExpense.amount = totalSalary;
      setLocal('fixedExpenses', this.fixedExpenses);
      this.notify();
    }
    return totalSalary;
  }

  // --- Task Management Methods ---
  public addTask(task: Omit<TaskItem, 'id' | 'createdAt'>): TaskItem {
    const newTask: TaskItem = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    setLocal('tasks', this.tasks);
    this.notify();
    return newTask;
  }

  public updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = {
      ...this.tasks[idx],
      ...updates,
      completedAt: updates.status === 'Completada' ? new Date().toISOString() : (updates.status ? undefined : this.tasks[idx].completedAt),
    };
    setLocal('tasks', this.tasks);
    this.notify();
    return this.tasks[idx];
  }

  public toggleTaskStatus(id: string): TaskItem | null {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    const newStatus = task.status === 'Completada' ? 'Pendiente' : 'Completada';
    return this.updateTask(id, { status: newStatus });
  }

  public deleteTask(id: string): boolean {
    const prevLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    if (this.tasks.length !== prevLen) {
      setLocal('tasks', this.tasks);
      this.notify();
      return true;
    }
    return false;
  }

  // --- Loan Planning Management Methods ---
  public createLoanPlan(params: {
    name: string;
    creditor: string;
    date: string;
    receivedAmount: number;
    installmentsCount: number;
    installmentAmount: number;
    frequency: 'monthly' | 'biweekly' | 'weekly' | 'custom';
    firstDueDate: string;
    dueDay: number;
    interestRate: number;
    expenses: number;
    destination: 'stock' | 'reforma' | 'equipamiento' | 'capital_trabajo' | 'distribuidora' | 'other';
    notes?: string;
    grossMarginPercent?: number;
    monthlyExpensesConsidered?: number;
    sellingDaysMonth?: number;
    sellingDaysWeek?: number;
    user: User;
  }): LoanPlan {
    const totalToReturn = (params.installmentsCount * params.installmentAmount) + (params.expenses || 0);
    const planCode = `PRÉSTAMO-${new Date().getFullYear()}-${String(this.loanPlans.length + 1).padStart(3, '0')}`;
    const baseDate = new Date(params.firstDueDate);

    const schedule: LoanInstallment[] = [];
    for (let i = 1; i <= params.installmentsCount; i++) {
      const d = new Date(baseDate.getTime());
      if (params.frequency === 'monthly') {
        d.setMonth(d.getMonth() + (i - 1));
      } else if (params.frequency === 'biweekly') {
        d.setDate(d.getDate() + (i - 1) * 14);
      } else if (params.frequency === 'weekly') {
        d.setDate(d.getDate() + (i - 1) * 7);
      } else {
        d.setMonth(d.getMonth() + (i - 1));
      }

      schedule.push({
        number: i,
        dueDate: d.toISOString().split('T')[0],
        amount: Math.round(params.installmentAmount * 100) / 100,
        status: 'pending',
        reservedAmount: 0,
        paidAmount: 0,
      });
    }

    const loanPlan: LoanPlan = {
      id: `loan-${Date.now()}`,
      code: planCode,
      name: params.name,
      creditor: params.creditor,
      date: params.date,
      receivedAmount: params.receivedAmount,
      installmentsCount: params.installmentsCount,
      installmentAmount: params.installmentAmount,
      frequency: params.frequency,
      firstDueDate: params.firstDueDate,
      dueDay: params.dueDay,
      interestRate: params.interestRate || 0,
      expenses: params.expenses || 0,
      totalToReturn: Math.round(totalToReturn * 100) / 100,
      destination: params.destination,
      notes: params.notes,
      stockPurchasesSpent: 0,
      grossMarginPercent: params.grossMarginPercent || 35,
      monthlyExpensesConsidered: params.monthlyExpensesConsidered || 1500000,
      sellingDaysMonth: params.sellingDaysMonth || 24,
      sellingDaysWeek: params.sellingDaysWeek || 6,
      schedule,
      contributions: [],
      status: 'active',
      userId: params.user.id,
      userName: params.user.name || 'Admin',
      createdAt: new Date().toISOString(),
    };

    this.loanPlans.unshift(loanPlan);
    setLocal('loanPlans', this.loanPlans);
    this.notify();
    return loanPlan;
  }

  public payLoanInstallment(
    loanId: string,
    installmentNumber: number,
    paymentMethod: string,
    user: User,
    options?: { cashBoxId?: string; notes?: string }
  ): boolean {
    const idx = this.loanPlans.findIndex((l) => l.id === loanId);
    if (idx === -1) return false;
    const loan = { ...this.loanPlans[idx] };
    const inst = loan.schedule.find((s) => s.number === installmentNumber);
    if (!inst || inst.status === 'paid') return false;

    inst.status = 'paid';
    inst.paidAmount = inst.amount;
    inst.paidAt = new Date().toISOString();
    inst.paymentMethod = paymentMethod;
    inst.cashBoxId = options?.cashBoxId;
    if (options?.notes) {
      inst.notes = options.notes;
    }

    if (loan.schedule.every((s) => s.status === 'paid')) {
      loan.status = 'completed';
    }

    this.loanPlans[idx] = loan;
    setLocal('loanPlans', this.loanPlans);

    const activeSession = this.cashSessions.find((s) => s.status === 'open');
    if (activeSession && paymentMethod === 'cash') {
      activeSession.expectedCash -= inst.amount;
      setLocal('cashSessions', this.cashSessions);
    }

    this.notify();
    return true;
  }

  public addLoanContribution(
    loanId: string,
    amount: number,
    description: string,
    user: User
  ): boolean {
    const idx = this.loanPlans.findIndex((l) => l.id === loanId);
    if (idx === -1) return false;
    const loan = { ...this.loanPlans[idx] };

    const contrib = {
      id: `contrib-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      description,
      userId: user.id,
      userName: user.name || 'Admin',
    };

    loan.contributions.unshift(contrib);

    let remainingToAdd = amount;
    for (const inst of loan.schedule) {
      if (remainingToAdd <= 0) break;
      if (inst.status !== 'paid') {
        const needed = inst.amount - inst.reservedAmount;
        if (needed > 0) {
          const toAdd = Math.min(needed, remainingToAdd);
          inst.reservedAmount += toAdd;
          remainingToAdd -= toAdd;
          if (inst.reservedAmount >= inst.amount) {
            inst.status = 'reserved';
          } else if (inst.reservedAmount > 0) {
            inst.status = 'partial' as any;
          }
        }
      }
    }

    this.loanPlans[idx] = loan;
    setLocal('loanPlans', this.loanPlans);
    this.notify();
    return true;
  }

  public updateLoanStockSpent(loanId: string, amount: number): boolean {
    const idx = this.loanPlans.findIndex((l) => l.id === loanId);
    if (idx === -1) return false;
    this.loanPlans[idx].stockPurchasesSpent = Math.max(0, amount);
    setLocal('loanPlans', this.loanPlans);
    this.notify();
    return true;
  }

  public deleteLoanPlan(loanId: string): boolean {
    const prev = this.loanPlans.length;
    this.loanPlans = this.loanPlans.filter((l) => l.id !== loanId);
    if (this.loanPlans.length !== prev) {
      setLocal('loanPlans', this.loanPlans);
      this.notify();
      return true;
    }
    return false;
  }
}

function parseSqlValues(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if ((char === "'" || char === '"') && (i === 0 || str[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inString = false;
      } else {
        current += char;
      }
    } else if (char === ',' && !inString) {
      result.push(current.trim().replace(/^['"]|['"]$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    result.push(current.trim().replace(/^['"]|['"]$/g, ''));
  }
  return result;
}

export const erpStore = ERPStore.getInstance();
