import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  writeBatch,
  getDocs,
  getDoc,
  query,
  where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { MODO_DEMO } from './services/appMode';
import {
  resolveSession,
  loginStaff,
  logoutAndReload,
  requestPasswordReset,
  translateAuthError,
  isSetupDone,
  runInitialSetup,
  getPublicBranding,
  savePublicBranding,
  createStaffUser,
  updateStaffProfile,
  createPortalAccess,
  revokePortalAccess,
  loginPortal,
  PublicBranding
} from './services/authService';
import { InitialSetupScreen } from './components/InitialSetupScreen';
import {
  db,
  auth,
  testConnection,
  seedInitialDataIfEmpty, 
  handleFirestoreError, 
  OperationType,
  syncOfficialAugust2026PriceList,
  INITIAL_FACTORY_USERS,
  seedUsersIfEmpty,
  seedFinanceAndStaffIfEmpty,
  seedSellersIfEmpty,
  seedLoyaltyAndInstallmentsIfEmpty,
  seedQuotesAndRemitosIfEmpty
} from './services/firebase';
import { 
  getStoredBackupConfig, 
  isBackupDue, 
  createFullBackupSnapshot, 
  downloadBackupPackage 
} from './services/backupAndResetService';
import { 
  RawMaterial, 
  Formula, 
  Product, 
  ProductionOrder, 
  SalesOrder, 
  Customer, 
  Transport, 
  Supplier, 
  PurchaseOrder, 
  FinancialTransaction, 
  InventoryMovement, 
  NotificationItem, 
  CompanyConfig, 
  ModuleKey, 
  SalesOrderStatus,
  AppUser,
  CheckItem,
  CheckStatus,
  Cashbox,
  CashMovement,
  Employee,
  SalaryPayment,
  DeliveryOrder,
  Seller,
  RouteSheet,
  InternalInstallmentPlan,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltyTransaction,
  LoyaltyRaffle,
  ArcaElectronicVoucher,
  CashRegisterSession,
  Quote,
  PurchaseOrderItem,
  PurchaseInvoice
} from './types';

// Components
import { Header } from './components/Header';
import { DesktopModule } from './components/DesktopModule';
import { ProductionModule } from './components/ProductionModule';
import { SalesOrdersModule } from './components/SalesOrdersModule';
import { SellersModule } from './components/SellersModule';
import { PriceListModule } from './components/PriceListModule';
import { InventoryModule } from './components/InventoryModule';
import { SupplierOrdersModule } from './components/SupplierOrdersModule';
import { PurchaseInvoiceModule } from './components/PurchaseInvoiceModule';
import { CustomersModule } from './components/CustomersModule';
import { LogisticsModule } from './components/LogisticsModule';
import { PurchasesModule } from './components/PurchasesModule';
import { FinancesModule } from './components/FinancesModule';
import { ReportsModule } from './components/ReportsModule';
import { CustomerPortal } from './components/CustomerPortal';
import { SettingsModule } from './components/SettingsModule';
import { LoginScreen } from './components/LoginScreen';
import { UsersModule } from './components/UsersModule';
import { ChecksModule } from './components/ChecksModule';
import { CashboxModule } from './components/CashboxModule';
import { AccountingAndProfitabilityModule } from './components/AccountingAndProfitabilityModule';
import { EmployeesModule } from './components/EmployeesModule';
import { DebtsAndReceivablesModule } from './components/DebtsAndReceivablesModule';
import { MobileSellerApp } from './components/MobileSellerApp';
import { InternalInstallmentsModule } from './components/InternalInstallmentsModule';
import { LoyaltyModule } from './components/LoyaltyModule';
import { ArcaFiscalModule } from './components/ArcaFiscalModule';
import { SystemAssistantModule } from './components/SystemAssistantModule';
import { CreatorModuleControlModal } from './components/CreatorModuleControlModal';
import { TabsBar, TabItem } from './components/TabsBar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { exportPriceListToExcel } from './utils/exportUtils';
import { CombosModule } from './components/products/CombosModule';
import { FaltantesModule } from './components/products/FaltantesModule';
import { AjusteStockModule } from './components/products/AjusteStockModule';
import { ModificacionMasivaModule } from './components/products/ModificacionMasivaModule';
import { DepositosSucursalesModule } from './components/products/DepositosSucursalesModule';
import { ImportarDatosModule } from './components/products/ImportarDatosModule';
import { MarcasRubrosModule } from './components/products/MarcasRubrosModule';
import { EtiquetasPrecioModule } from './components/products/EtiquetasPrecioModule';
import { ListasPreciosModule } from './components/products/ListasPreciosModule';
import { ActualizacionPreciosModule } from './components/products/ActualizacionPreciosModule';
import { TransferenciasModule } from './components/products/TransferenciasModule';
import { PedidosSucursalModule } from './components/products/PedidosSucursalModule';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('desktop');
  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    { id: 'desktop', label: 'Escritorio', closable: false },
    { id: 'sales', label: 'Ventas (POS)', closable: true }
  ]);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const getModuleLabel = (mod: ModuleKey): string => {
    switch (mod) {
      case 'desktop': return 'Escritorio';
      case 'sales': return 'Ventas (POS)';
      case 'inventory': return 'Inventario';
      case 'combos': return 'Combos / Packs';
      case 'faltantes': return 'Faltantes & Alertas';
      case 'stock_adjustments': return 'Ajuste de Stock';
      case 'mass_modification': return 'Modificación Masiva';
      case 'warehouses': return 'Depósitos / Sucursales';
      case 'transfers': return 'Transferencias';
      case 'branch_orders': return 'Pedidos Sucursal';
      case 'import_products': return 'Importar Productos';
      case 'import_stock': return 'Importar Stock';
      case 'brands_categories': return 'Marcas & Rubros';
      case 'price_tags': return 'Etiquetas de Precio';
      case 'prices': return 'Listas de Precios';
      case 'update_prices': return 'Actualizar Precios';
      case 'customers': return 'Clientes & Cuentas';
      case 'sellers': return 'Vendedores & Rutas';
      case 'production': return 'Producción & Lotes';
      case 'purchases': return 'Compras & Proveedores';
      case 'cashboxes': return 'Cajas de Dinero';
      case 'finances': return 'Finanzas';
      case 'checks': return 'Cheques & E-Cheqs';
      case 'accounting': return 'Contabilidad & IVA';
      case 'profitability': return 'Estado de Resultados';
      case 'employees': return 'Personal & Sueldos';
      case 'installments': return 'Cuotas Internas';
      case 'loyalty': return 'Fidelización & Puntos';
      case 'logistics': return 'Transportes & Logística';
      case 'supplier_orders': return 'Pedidos Proveedor';
      case 'purchase_invoices': return 'Facturas Insumos';
      case 'arca_fiscal': return 'Facturación ARCA';
      case 'reports': return 'Dashboard con Barras';
      case 'ai_assistant': return 'Asistente del Sistema';
      case 'settings': return 'Configuración';
      case 'users': return 'Usuarios & Roles';
      case 'customer_portal': return 'Portal Clientes';
      default: return 'Módulo';
    }
  };

  const handleSelectModuleWithTab = (mod: ModuleKey) => {
    setActiveModule(mod);
    setOpenTabs(prev => {
      if (prev.some(t => t.id === mod)) return prev;
      return [...prev, { id: mod, label: getModuleLabel(mod), closable: mod !== 'desktop' }];
    });
  };

  const handleCloseTab = (id: ModuleKey) => {
    if (id === 'desktop') return;
    setOpenTabs(prev => {
      const nextTabs = prev.filter(t => t.id !== id);
      if (activeModule === id) {
        const lastTab = nextTabs[nextTabs.length - 1];
        setActiveModule(lastTab ? lastTab.id : 'desktop');
      }
      return nextTabs;
    });
  };

  // Listen for F10 shortcut for fast Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [isCreatorModuleControlOpen, setIsCreatorModuleControlOpen] = useState(false);
  const [portalClientTaxId, setPortalClientTaxId] = useState<string | null>(() => {
    if (!MODO_DEMO) return null; // en producción lo define la sesión de Firebase Auth
    return localStorage.getItem('colorear_portal_client_tax_id');
  });
  const [preloadedProductionData, setPreloadedProductionData] = useState<{ formula?: Formula; order?: ProductionOrder } | null>(null);

  // App Users & Current Authenticated Staff
  const [appUsers, setAppUsers] = useState<AppUser[]>(MODO_DEMO ? INITIAL_FACTORY_USERS : []);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    // En producción la sesión la maneja Firebase Auth (no se confía en localStorage)
    if (!MODO_DEMO) return null;
    try {
      const saved = localStorage.getItem('colorear_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Sesión de datos: qué se puede leer de Firestore según quién inició sesión
  //  - 'demo': todo (modo demo)
  //  - 'staff': personal con cuenta real (modo producción)
  //  - 'portal': cliente del portal (solo sus propios datos)
  //  - null: nadie logueado (modo producción) → no se carga ningún dato
  const [dataSession, setDataSession] = useState<'demo' | 'staff' | 'portal' | null>(MODO_DEMO ? 'demo' : null);
  const [portalCustomerId, setPortalCustomerId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(MODO_DEMO);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [publicBranding, setPublicBranding] = useState<PublicBranding | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [portalAccessList, setPortalAccessList] = useState<{ uid: string; customerId: string; createdAt?: string }[]>([]);
  const setupInProgressRef = useRef(false);

  // State collections synced from Firestore
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [routeSheets, setRouteSheets] = useState<RouteSheet[]>([]);
  const [internalInstallments, setInternalInstallments] = useState<InternalInstallmentPlan[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);
  const [loyaltyRedemptions, setLoyaltyRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loyaltyRaffles, setLoyaltyRaffles] = useState<LoyaltyRaffle[]>([]);
  const [arcaVouchers, setArcaVouchers] = useState<ArcaElectronicVoucher[]>([]);
  const [cashRegisterSessions, setCashRegisterSessions] = useState<CashRegisterSession[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [standaloneRemitos, setStandaloneRemitos] = useState<DeliveryOrder[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [activeSellerContext, setActiveSellerContext] = useState<Seller | null>(null);
  const [isMobileSellerAppOpen, setIsMobileSellerAppOpen] = useState(false);

  // Active Draft Supplier Order state (shared between Inventory and SupplierOrdersModule)
  const [supplierOrderDraft, setSupplierOrderDraft] = useState<PurchaseOrderItem[]>([]);
  const [supplierOrderDraftSupplierId, setSupplierOrderDraftSupplierId] = useState<string | null>(null);

  const handleAddToSupplierOrder = (item: PurchaseOrderItem, supplierId: string) => {
    setSupplierOrderDraftSupplierId(supplierId);
    setSupplierOrderDraft(prev => {
      const existingIdx = prev.findIndex(it => it.productId === item.productId && it.productId !== undefined);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + item.quantity;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQty,
          subtotal: newQty * copy[existingIdx].unitCost
        };
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleClearSupplierOrderDraft = () => {
    setSupplierOrderDraft([]);
    setSupplierOrderDraftSupplierId(null);
  };

  const [isLoading, setIsLoading] = useState(true);

  // Sync browser title with dynamic company name
  useEffect(() => {
    const titleName = companyConfig?.tradeName || companyConfig?.companyName || 'Colorear Pinturas';
    document.title = `${titleName} - CRM & ERP Industrial`;
  }, [companyConfig]);

  // MODO PRODUCCIÓN: escuchar la sesión de Firebase Auth y decidir qué ve cada usuario
  useEffect(() => {
    if (MODO_DEMO) return;

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (setupInProgressRef.current) return; // la configuración inicial resuelve su propia sesión
      try {
        if (!fbUser) {
          const [setupDone, branding] = await Promise.all([isSetupDone(), getPublicBranding()]);
          setNeedsInitialSetup(!setupDone);
          setPublicBranding(branding);
          setCurrentUser(null);
          setDataSession(null);
          setIsLoading(false);
          setAuthResolved(true);
          return;
        }

        const session = await resolveSession(fbUser);
        if (session.kind === 'staff') {
          setNeedsInitialSetup(false);
          setCurrentUser(session.user);
          setDataSession('staff');
          if (session.user.role === 'vendedor_calle') {
            setIsMobileSellerAppOpen(true);
          } else {
            setActiveModule('desktop');
          }
        } else if (session.kind === 'portal') {
          setPortalCustomerId(session.customerId);
          setActiveModule('customer_portal');
          setDataSession('portal');
        } else {
          setLoginNotice(session.reason);
          await auth.signOut();
          return; // onAuthStateChanged vuelve a dispararse con fbUser = null
        }
        setAuthResolved(true);
      } catch (err) {
        console.error('Error resolviendo la sesión:', err);
        setLoginNotice('No se pudo verificar tu acceso. Revisá la conexión e intentá de nuevo.');
        setIsLoading(false);
        setAuthResolved(true);
      }
    });
    return () => unsub();
  }, []);

  // Vendedor de calle: vincular su ficha de vendedor cuando se cargan los vendedores
  useEffect(() => {
    if (MODO_DEMO || !currentUser || currentUser.role !== 'vendedor_calle' || activeSellerContext) return;
    const matchSeller = sellers.find(s =>
      (s.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      s.name.toLowerCase().includes(currentUser.name.toLowerCase())
    );
    if (matchSeller) setActiveSellerContext(matchSeller);
  }, [sellers, currentUser, activeSellerContext]);

  // MODO PRODUCCIÓN: mantener actualizado el logo/nombre que se ve en la pantalla de login
  useEffect(() => {
    if (MODO_DEMO || !companyConfig || dataSession !== 'staff') return;
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'creador') return;
    const sameBranding =
      publicBranding &&
      publicBranding.companyName === (companyConfig.companyName || '') &&
      publicBranding.tradeName === (companyConfig.tradeName || '') &&
      publicBranding.logoUrl === (companyConfig.logoUrl || '') &&
      publicBranding.address === (companyConfig.plantAddress || companyConfig.fiscalAddress || '');
    if (sameBranding) return;
    savePublicBranding(companyConfig)
      .then(() => setPublicBranding({
        companyName: companyConfig.companyName || '',
        tradeName: companyConfig.tradeName || '',
        logoUrl: companyConfig.logoUrl || '',
        address: companyConfig.plantAddress || companyConfig.fiscalAddress || ''
      }))
      .catch(err => console.warn('No se pudo actualizar la marca pública:', err));
  }, [companyConfig, dataSession, currentUser, publicBranding]);

  // MODO PRODUCCIÓN, portal de clientes: cargar SOLO los datos del cliente logueado
  useEffect(() => {
    if (dataSession !== 'portal' || !portalCustomerId) return;
    const unsubs: (() => void)[] = [];

    unsubs.push(onSnapshot(doc(db, 'customers', portalCustomerId), snap => {
      if (snap.exists()) {
        const cust = { id: snap.id, ...snap.data() } as Customer;
        setCustomers([cust]);
        setPortalClientTaxId(cust.taxId);
      }
      setIsLoading(false);
    }, err => {
      console.error('Portal: no se pudo leer el cliente', err);
      setIsLoading(false);
    }));

    unsubs.push(onSnapshot(query(collection(db, 'sales_orders'), where('customerId', '==', portalCustomerId)), snap => {
      setSalesOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesOrder)));
    }, err => console.warn('Portal: no se pudieron leer los pedidos', err)));

    unsubs.push(onSnapshot(collection(db, 'loyalty_rewards'), snap => {
      setLoyaltyRewards(snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyReward)));
    }, err => console.warn('Portal: no se pudieron leer los premios', err)));

    getDoc(doc(db, 'company_config', 'main_config'))
      .then(snap => { if (snap.exists()) setCompanyConfig(snap.data() as CompanyConfig); })
      .catch(err => console.warn('Portal: no se pudo leer la configuración', err));

    return () => unsubs.forEach(u => u());
  }, [dataSession, portalCustomerId]);

  // Initialize and attach Firestore real-time listeners (modo demo y personal logueado)
  useEffect(() => {
    if (dataSession !== 'demo' && dataSession !== 'staff') return;
    let unsubscribes: (() => void)[] = [];

    const initializeApp = async () => {
      try {
        if (dataSession === 'demo') {
          // Solo en modo demo: login anónimo + datos de ejemplo
          await testConnection();
          await seedInitialDataIfEmpty();
          await seedUsersIfEmpty();
          await seedFinanceAndStaffIfEmpty();
          await seedSellersIfEmpty();
          await seedLoyaltyAndInstallmentsIfEmpty();
          await seedQuotesAndRemitosIfEmpty();

          // Check if official August 2026 catalog with SKUs needs to be synchronized
          try {
            const prodSnap = await getDocs(collection(db, 'products'));
            if (prodSnap.size < 50) {
              await syncOfficialAugust2026PriceList();
            }
          } catch (prodErr) {
            console.warn("Catalog synchronization deferred:", prodErr);
          }
        } else {
          setIsLoading(true);
          // Accesos al portal de clientes (para el módulo Usuarios)
          const unsubPortal = onSnapshot(collection(db, 'portal_access'), snap => {
            setPortalAccessList(snap.docs.map(d => ({ uid: d.id, customerId: d.data().customerId, createdAt: d.data().createdAt })));
          }, error => console.warn('No se pudieron leer los accesos al portal:', error));
          unsubscribes.push(unsubPortal);
        }

        // 1. Raw Materials
        const unsubRaw = onSnapshot(collection(db, 'raw_materials'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as RawMaterial));
          setRawMaterials(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'raw_materials');
        });
        unsubscribes.push(unsubRaw);

        // 2. Formulas
        const unsubForm = onSnapshot(collection(db, 'formulas'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Formula));
          setFormulas(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'formulas');
        });
        unsubscribes.push(unsubForm);

        // 3. Products
        const unsubProd = onSnapshot(collection(db, 'products'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
          setProducts(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'products');
        });
        unsubscribes.push(unsubProd);

        // 4. Production Orders
        const unsubPO = onSnapshot(collection(db, 'production_orders'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionOrder));
          setProductionOrders(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'production_orders');
        });
        unsubscribes.push(unsubPO);

        // 5. Sales Orders
        const unsubSO = onSnapshot(collection(db, 'sales_orders'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesOrder));
          setSalesOrders(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'sales_orders');
        });
        unsubscribes.push(unsubSO);

        // 6. Customers
        const unsubCust = onSnapshot(collection(db, 'customers'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
          setCustomers(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'customers');
        });
        unsubscribes.push(unsubCust);

        // 7. Transports
        const unsubTrans = onSnapshot(collection(db, 'transports'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transport));
          setTransports(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'transports');
        });
        unsubscribes.push(unsubTrans);

        // 8. Suppliers
        const unsubSup = onSnapshot(collection(db, 'suppliers'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
          setSuppliers(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'suppliers');
        });
        unsubscribes.push(unsubSup);

        // 9. Purchase Orders
        const unsubPurch = onSnapshot(collection(db, 'purchase_orders'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseOrder));
          setPurchaseOrders(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'purchase_orders');
        });
        unsubscribes.push(unsubPurch);

        // 9b. Purchase Invoices (Facturas de Compra)
        const unsubPI = onSnapshot(collection(db, 'purchase_invoices'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseInvoice));
          setPurchaseInvoices(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'purchase_invoices');
        });
        unsubscribes.push(unsubPI);

        // 10. Financial Transactions
        const unsubTx = onSnapshot(collection(db, 'financial_transactions'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialTransaction));
          setFinancialTransactions(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'financial_transactions');
        });
        unsubscribes.push(unsubTx);

        // 11. Inventory Movements
        const unsubMov = onSnapshot(collection(db, 'inventory_movements'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryMovement));
          setInventoryMovements(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'inventory_movements');
        });
        unsubscribes.push(unsubMov);

        // 12. Notifications
        const unsubNotif = onSnapshot(collection(db, 'notifications'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
          setNotifications(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'notifications');
        });
        unsubscribes.push(unsubNotif);

        // 13. Company Config
        const unsubConfig = onSnapshot(collection(db, 'company_config'), snap => {
          if (!snap.empty) {
            setCompanyConfig(snap.docs[0].data() as CompanyConfig);
          }
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'company_config');
        });
        unsubscribes.push(unsubConfig);

        // 14. App Users & Factory Staff
        const unsubUsers = onSnapshot(collection(db, 'app_users'), snap => {
          if (!snap.empty) {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
            setAppUsers(items);
          }
        }, error => {
          console.warn('Could not read app_users in real time, using initial list:', error);
        });
        unsubscribes.push(unsubUsers);

        // 15. Checks & E-Cheqs
        const unsubChecks = onSnapshot(collection(db, 'checks'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CheckItem));
          setChecks(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'checks');
        });
        unsubscribes.push(unsubChecks);

        // 16. Cashboxes & Bank Accounts
        const unsubBoxes = onSnapshot(collection(db, 'cashboxes'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashbox));
          setCashboxes(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'cashboxes');
        });
        unsubscribes.push(unsubBoxes);

        // 17. Cash Movements (Detailed ledger)
        const unsubCashMov = onSnapshot(collection(db, 'cash_movements'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CashMovement));
          setCashMovements(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'cash_movements');
        });
        unsubscribes.push(unsubCashMov);

        // 18. Employees & Staff
        const unsubEmp = onSnapshot(collection(db, 'employees'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
          setEmployees(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'employees');
        });
        unsubscribes.push(unsubEmp);

        // 19. Salary Payments & Advances
        const unsubSal = onSnapshot(collection(db, 'salary_payments'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SalaryPayment));
          setSalaryPayments(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'salary_payments');
        });
        unsubscribes.push(unsubSal);

        // 20. Sellers (Vendedores de calle)
        const unsubSellers = onSnapshot(collection(db, 'sellers'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Seller));
          setSellers(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'sellers');
        });
        unsubscribes.push(unsubSellers);

        // 21. Route Sheets (Hojas de ruta de preventa)
        const unsubRoutes = onSnapshot(collection(db, 'route_sheets'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as RouteSheet));
          setRouteSheets(items);
        }, error => {
          handleFirestoreError(error, OperationType.GET, 'route_sheets');
        });
        unsubscribes.push(unsubRoutes);

        // 22. Internal Installments
        const unsubInst = onSnapshot(collection(db, 'internal_installments'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as InternalInstallmentPlan));
          setInternalInstallments(items);
        }, error => {
          console.warn("Could not listen to internal_installments:", error);
        });
        unsubscribes.push(unsubInst);

        // 23. Loyalty Rewards
        const unsubRew = onSnapshot(collection(db, 'loyalty_rewards'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyReward));
          setLoyaltyRewards(items);
        }, error => {
          console.warn("Could not listen to loyalty_rewards:", error);
        });
        unsubscribes.push(unsubRew);

        // 24. Loyalty Redemptions
        const unsubRed = onSnapshot(collection(db, 'loyalty_redemptions'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyRedemption));
          setLoyaltyRedemptions(items);
        }, error => {
          console.warn("Could not listen to loyalty_redemptions:", error);
        });
        unsubscribes.push(unsubRed);

        // 25. Loyalty Transactions
        const unsubLtx = onSnapshot(collection(db, 'loyalty_transactions'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyTransaction));
          setLoyaltyTransactions(items);
        }, error => {
          console.warn("Could not listen to loyalty_transactions:", error);
        });
        unsubscribes.push(unsubLtx);

        // 26. Loyalty Raffles
        const unsubRaf = onSnapshot(collection(db, 'loyalty_raffles'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyRaffle));
          setLoyaltyRaffles(items);
        }, error => {
          console.warn("Could not listen to loyalty_raffles:", error);
        });
        unsubscribes.push(unsubRaf);

        // 27. ARCA Electronic Vouchers
        const unsubArca = onSnapshot(collection(db, 'arca_vouchers'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ArcaElectronicVoucher));
          setArcaVouchers(items);
        }, error => {
          console.warn("Could not listen to arca_vouchers:", error);
        });
        unsubscribes.push(unsubArca);

        // 28. Cash Register Sessions (POS Shifts)
        const unsubReg = onSnapshot(collection(db, 'cash_register_sessions'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CashRegisterSession));
          setCashRegisterSessions(items);
        }, error => {
          console.warn("Could not listen to cash_register_sessions:", error);
        });
        unsubscribes.push(unsubReg);

        // 29. Quotes & Presupuestos Comerciales
        const unsubQuotes = onSnapshot(collection(db, 'quotes'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote));
          setQuotes(items);
        }, error => {
          console.warn("Could not listen to quotes:", error);
        });
        unsubscribes.push(unsubQuotes);

        // 30. Standalone Remitos & Órdenes de Entrega
        const unsubRemitos = onSnapshot(collection(db, 'delivery_orders'), snap => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as DeliveryOrder));
          setStandaloneRemitos(items);
        }, error => {
          console.warn("Could not listen to delivery_orders:", error);
        });
        unsubscribes.push(unsubRemitos);

        setIsLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [dataSession]);

  // Auto-redirect if active seller persona cannot access current module
  useEffect(() => {
    if (activeSellerContext && activeSellerContext.allowedModules && activeSellerContext.allowedModules.length > 0) {
      if (!activeSellerContext.allowedModules.includes(activeModule)) {
        setActiveModule(activeSellerContext.allowedModules[0] || 'sellers');
      }
    }
  }, [activeSellerContext, activeModule]);

  // Automated Backup scheduler check based on configured frequency
  useEffect(() => {
    const checkAutomatedBackup = async () => {
      const backupCfg = getStoredBackupConfig();
      if (isBackupDue(backupCfg)) {
        if (backupCfg.autoDownload) {
          try {
            console.log("Plazo de copia de seguridad alcanzado. Generando backup automático...");
            const pkg = await createFullBackupSnapshot(companyConfig);
            downloadBackupPackage(pkg);
          } catch (e) {
            console.warn("Fallo en la descarga automática del backup:", e);
          }
        }
      }
    };

    // Run 5 seconds after load so initial data is synced
    const timer = setTimeout(checkAutomatedBackup, 5000);
    return () => clearTimeout(timer);
  }, [companyConfig]);

  // --- ACTIONS & AUTOMATIONS ---

  // Complete Production Order: Auto-deduct raw materials & auto-add finished paint to product stock
  const handleCompleteProductionOrder = async (order: ProductionOrder) => {
    try {
      const formula = formulas.find(f => f.id === order.formulaId);
      if (!formula) return;

      const batch = writeBatch(db);

      // 1. Update order status
      const orderRef = doc(db, 'production_orders', order.id);
      batch.update(orderRef, {
        status: 'completada',
        completedAt: new Date().toISOString()
      });

      // 2. Deduct raw materials proportionally
      formula.items.forEach(item => {
        const consumedKg = (item.percentageOrKg / 100) * order.targetKg;
        const mat = rawMaterials.find(m => m.id === item.rawMaterialId);
        if (mat) {
          const newStock = Math.max(0, mat.currentStock - consumedKg);
          const matRef = doc(db, 'raw_materials', mat.id);
          batch.update(matRef, { currentStock: newStock });

          // Kardex entry for material exit
          const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 999)}`;
          const movRef = doc(db, 'inventory_movements', movId);
          batch.set(movRef, {
            id: movId,
            itemType: 'raw_material',
            itemId: mat.id,
            itemName: mat.name,
            movementType: 'salida_produccion',
            quantity: -consumedKg,
            unit: mat.unit,
            reference: order.orderNumber,
            user: order.operatorName,
            date: new Date().toISOString()
          });
        }
      });

      // 3. Add finished paint product stock
      // Find matching product in catalog
      const matchingProduct = products.find(p => 
        p.name.toLowerCase().includes(order.productName.toLowerCase()) ||
        order.productName.toLowerCase().includes(p.name.toLowerCase())
      ) || products[0];

      if (matchingProduct) {
        const prodRef = doc(db, 'products', matchingProduct.id);
        batch.update(prodRef, {
          stock: matchingProduct.stock + order.packageCount
        });

        // Kardex entry for finished product entry
        const movProdId = `mov-${Date.now()}-prod`;
        const movProdRef = doc(db, 'inventory_movements', movProdId);
        batch.set(movProdRef, {
          id: movProdId,
          itemType: 'product',
          itemId: matchingProduct.id,
          itemName: `${matchingProduct.name} (${matchingProduct.presentation})`,
          movementType: 'entrada_produccion',
          quantity: order.packageCount,
          unit: 'unidades',
          reference: `${order.orderNumber} - Lote: ${order.batchNumber} | Partida: ${order.partidaNumber || 'P-01'}`,
          batchNumber: order.batchNumber,
          partidaNumber: order.partidaNumber || '',
          user: order.operatorName,
          date: new Date().toISOString()
        });
      }

      // 4. Create automatic notification: Production finished
      const notifId = `notif-${Date.now()}`;
      const notifRef = doc(db, 'notifications', notifId);
      batch.set(notifRef, {
        id: notifId,
        title: 'Producción Concluida & Stock en Alta',
        message: `Orden ${order.orderNumber} finalizada: Se dieron de alta ${order.packageCount} envases de ${order.productName} y se descontó la materia prima en tiempo real.`,
        type: 'produccion_progreso',
        targetEntityId: order.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: 'production'
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'production_orders');
    }
  };

  // Create new production order
  const handleCreateProductionOrder = async (order: ProductionOrder) => {
    try {
      await setDoc(doc(db, 'production_orders', order.id), order);
      // Automatic notification
      const notifId = `notif-${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        title: 'Nueva Orden de Fabricación Iniciada',
        message: `Orden ${order.orderNumber} en proceso: ${order.targetKg} kg de ${order.productName} a envasar en ${order.packageCount} unidades.`,
        type: 'produccion_progreso',
        targetEntityId: order.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: 'production'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'production_orders');
    }
  };

  // Update sales order stage & notify when ready/dispatched
  const handleUpdateOrderStatus = async (orderId: string, status: SalesOrderStatus, additionalData?: Partial<SalesOrder>) => {
    try {
      const order = salesOrders.find(o => o.id === orderId);
      if (!order) return;

      const orderRef = doc(db, 'sales_orders', orderId);
      await updateDoc(orderRef, {
        status,
        ...additionalData
      });

      // Automatic notifications based on stage
      if (status === 'preparando_remito' || status === 'facturado') {
        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          title: 'Pedido Listo para Despacho',
          message: `El pedido ${order.orderNumber} de ${order.customerName} tiene el remito preparado y está listo para ser recogido por ${order.transportName || 'transporte'}.`,
          type: 'pedido_listo',
          targetEntityId: orderId,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: 'sales'
        });
      } else if (status === 'despachado') {
        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          title: 'Pedido Despachado al Transporte',
          message: `El pedido ${order.orderNumber} salió de planta con ${order.transportName}. Código de seguimiento: ${order.trackingCode}.`,
          type: 'despacho_en_camino',
          targetEntityId: orderId,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: 'sales'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sales_orders');
    }
  };

  // Emit Delivery Order (Despacho / Remito Parcial) and deduct stock in real time
  const handleDeliverOrderItems = async (orderId: string, delivery: DeliveryOrder) => {
    try {
      const order = salesOrders.find(o => o.id === orderId);
      if (!order) return;

      const batch = writeBatch(db);

      // 1. Deduct finished goods stock for each item delivered
      let totalUnitsDeliveredNow = 0;
      delivery.items.forEach(delItem => {
        if (delItem.quantity <= 0) return;
        totalUnitsDeliveredNow += delItem.quantity;
        const prod = products.find(p => p.id === delItem.productId);
        if (prod) {
          const newStock = Math.max(0, prod.stock - delItem.quantity);
          const pRef = doc(db, 'products', prod.id);
          batch.update(pRef, { stock: newStock });

          // Kardex inventory movement entry with industrial batch and partida traceability
          const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;
          const movRef = doc(db, 'inventory_movements', movId);
          batch.set(movRef, {
            id: movId,
            itemType: 'product',
            itemId: prod.id,
            itemName: `${prod.name} (${prod.presentation})`,
            movementType: 'salida_venta',
            quantity: -delItem.quantity,
            unit: 'unidades',
            reference: `Orden Entrega ${delivery.deliveryNumber} - Factura ${order.invoiceNumber || 'Anticipada'} - ${order.customerName}${delItem.batchNumber ? ` [Lote: ${delItem.batchNumber}${delItem.partidaNumber ? ` / Part: ${delItem.partidaNumber}` : ''}]` : ''}`,
            user: delivery.driverName || 'Depósito Fábrica',
            batchNumber: delItem.batchNumber || undefined,
            partidaNumber: delItem.partidaNumber || undefined,
            date: new Date().toISOString()
          });
        }
      });

      // 2. Update line items delivered quantities
      const updatedItems = order.items.map(it => {
        const deliveredMatch = delivery.items.find(di => di.productId === it.productId);
        const addedQty = deliveredMatch ? deliveredMatch.quantity : 0;
        const totalDelivered = (it.deliveredQuantity || 0) + addedQty;
        return {
          ...it,
          deliveredQuantity: totalDelivered
        };
      });

      // 3. Compute overall delivery status
      const totalOrderedQty = updatedItems.reduce((acc, it) => acc + it.quantity, 0);
      const totalDeliveredQty = updatedItems.reduce((acc, it) => acc + (it.deliveredQuantity || 0), 0);

      let deliveryStatus: 'pendiente_entrega' | 'entrega_parcial' | 'entrega_total' = 'pendiente_entrega';
      let overallStatus = order.status;

      if (totalDeliveredQty >= totalOrderedQty) {
        deliveryStatus = 'entrega_total';
        overallStatus = 'entregado';
      } else if (totalDeliveredQty > 0) {
        deliveryStatus = 'entrega_parcial';
        overallStatus = 'entrega_parcial';
      }

      const existingDeliveries = order.deliveryOrders || [];
      const updatedDeliveries = [...existingDeliveries, delivery];

      // 4. Update sales order in Firestore
      const orderRef = doc(db, 'sales_orders', orderId);
      batch.update(orderRef, {
        items: updatedItems,
        deliveryStatus,
        status: overallStatus,
        deliveryOrders: updatedDeliveries,
        remitoNumber: delivery.deliveryNumber
      });

      // Also record into root collection 'delivery_orders'
      const delRef = doc(db, 'delivery_orders', delivery.id);
      batch.set(delRef, delivery);

      // 5. Automatic Notification for logistics & dispatch
      const notifId = `notif-${Date.now()}`;
      const notifRef = doc(db, 'notifications', notifId);
      batch.set(notifRef, {
        id: notifId,
        title: `Mercadería Despachada (${delivery.deliveryNumber})`,
        message: `Despacho de ${totalUnitsDeliveredNow} unidades para ${order.customerName}. Saldo restante: ${Math.max(0, totalOrderedQty - totalDeliveredQty)} unidades.`,
        type: 'despacho_en_camino',
        targetEntityId: orderId,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: 'sales'
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales_orders');
    }
  };

  // Record payment in Customer checking account
  const handleRecordCustomerPayment = async (
    customerId: string, 
    amount: number, 
    method: FinancialTransaction['paymentMethod'], 
    concept: string,
    receiptNumber?: string,
    bankInfo?: string,
    allocatedOrderIds?: string[]
  ) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const batch = writeBatch(db);

      // 1. Update customer balance
      const newBalance = Math.max(0, customer.currentBalance - amount);
      const custRef = doc(db, 'customers', customerId);
      batch.update(custRef, { currentBalance: newBalance });

      // 2. Add financial transaction with full receipt information
      const txId = `tx-${Date.now()}`;
      const txRef = doc(db, 'financial_transactions', txId);
      const finalReceiptNumber = receiptNumber || `REC-0001-${String(Math.floor(Math.random() * 89999 + 10000)).padStart(8, '0')}`;

      batch.set(txRef, {
        id: txId,
        type: 'cobro_cliente',
        direction: 'ingreso',
        amount,
        date: new Date().toISOString(),
        entityId: customerId,
        entityName: customer.businessName,
        paymentMethod: method,
        concept,
        receiptNumber: finalReceiptNumber,
        notes: bankInfo || ''
      });

      // 3. If allocated to specific orders, mark them as paid in the database
      if (allocatedOrderIds && allocatedOrderIds.length > 0) {
        allocatedOrderIds.forEach(orderId => {
          const oRef = doc(db, 'sales_orders', orderId);
          batch.update(oRef, {
            paymentStatus: 'pagado',
            paidAmount: amount
          });
        });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers');
    }
  };

  // Receive purchase order & ingest merchandise/raw materials into stock
  const handleReceivePurchaseOrder = async (po: PurchaseOrder) => {
    try {
      const batch = writeBatch(db);

      // 1. Mark PO as received
      const poRef = doc(db, 'purchase_orders', po.id);
      batch.update(poRef, { 
        status: 'recibido',
        receivedAt: new Date().toISOString()
      });

      // 2. Update stock for each item (Products or Raw Materials)
      po.items.forEach((it, idx) => {
        // Finished product merchandise
        if (it.productId) {
          const prod = products.find(p => p.id === it.productId);
          if (prod) {
            const prodRef = doc(db, 'products', prod.id);
            const updates: Partial<Product> = {
              stock: (prod.stock || 0) + it.quantity
            };
            if (it.unitCost > 0) {
              updates.costListWithoutIva = it.unitCost;
            }
            batch.update(prodRef, updates);

            // Log inventory movement
            const movId = `mov-prod-${Date.now()}-${idx}`;
            const movRef = doc(db, 'inventory_movements', movId);
            batch.set(movRef, {
              id: movId,
              itemType: 'product',
              itemId: prod.id,
              itemName: prod.name,
              movementType: 'entrada_compra',
              quantity: it.quantity,
              unit: prod.primaryUnit || 'Unidad',
              reference: po.orderNumber,
              user: 'Recepción Proveedores',
              date: new Date().toISOString()
            });
          }
        } else if (it.rawMaterialId) {
          // Raw chemical material
          const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
          if (mat) {
            const matRef = doc(db, 'raw_materials', mat.id);
            batch.update(matRef, {
              currentStock: mat.currentStock + it.quantity,
              unitCost: it.unitCost
            });

            // Log movement
            const movId = `mov-raw-${Date.now()}-${it.rawMaterialId}`;
            const movRef = doc(db, 'inventory_movements', movId);
            batch.set(movRef, {
              id: movId,
              itemType: 'raw_material',
              itemId: mat.id,
              itemName: mat.name,
              movementType: 'entrada_compra',
              quantity: it.quantity,
              unit: mat.unit,
              reference: po.orderNumber,
              user: 'Administración Compras',
              date: new Date().toISOString()
            });
          }
        }
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'purchase_orders');
    }
  };

  // Notification mark read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  // --- CHECKS / E-CHEQS HANDLERS ---
  const handleSaveCheck = async (chk: CheckItem) => {
    try {
      await setDoc(doc(db, 'checks', chk.id), chk);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'checks');
    }
  };

  const handleUpdateCheckStatus = async (checkId: string, status: CheckStatus, notes?: string, destinationId?: string) => {
    try {
      const chk = checks.find(c => c.id === checkId);
      if (!chk) return;
      const batch = writeBatch(db);
      const chkRef = doc(db, 'checks', checkId);

      const updateData: Partial<CheckItem> = { status };
      if (notes) updateData.notes = notes;

      if (status === 'depositado' || status === 'cobrado') {
        updateData.depositDate = new Date().toISOString();
        if (destinationId) {
          updateData.cashboxId = destinationId;
          const box = cashboxes.find(b => b.id === destinationId);
          if (box) {
            batch.update(doc(db, 'cashboxes', box.id), {
              currentBalance: box.currentBalance + chk.amount
            });
            // Record cash movement
            const movId = `mov-chk-${Date.now()}`;
            batch.set(doc(db, 'cash_movements', movId), {
              id: movId,
              cashboxId: box.id,
              cashboxName: box.name,
              type: 'ingreso',
              amount: chk.amount,
              category: 'cobranza_clientes',
              concept: `Acreditación Cheque Nº ${chk.checkNumber} (${chk.bankName})`,
              date: new Date().toISOString(),
              referenceNumber: chk.checkNumber,
              user: currentUser?.name || 'Tesorería',
              createdAt: new Date().toISOString()
            });
          }
        }
      } else if (status === 'entregado_proveedor' && destinationId) {
        updateData.deliveredToSupplierId = destinationId;
        const sup = suppliers.find(s => s.id === destinationId);
        if (sup) {
          updateData.deliveredToSupplierName = sup.businessName;
        }
      }

      batch.update(chkRef, updateData);
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'checks');
    }
  };

  // --- CASHBOX & MOVEMENTS HANDLERS ---
  const handleSaveCashbox = async (box: Cashbox) => {
    try {
      await setDoc(doc(db, 'cashboxes', box.id), box);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'cashboxes');
    }
  };

  const handleAddCashMovement = async (mov: CashMovement) => {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'cash_movements', mov.id), mov);

      const box = cashboxes.find(b => b.id === mov.cashboxId);
      if (box) {
        const delta = mov.type === 'ingreso' ? mov.amount : -mov.amount;
        batch.update(doc(db, 'cashboxes', box.id), {
          currentBalance: Math.max(0, box.currentBalance + delta)
        });
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'cash_movements');
    }
  };

  const handleTransferBetweenCashboxes = async (fromId: string, toId: string, amount: number, concept: string) => {
    try {
      const fromBox = cashboxes.find(b => b.id === fromId);
      const toBox = cashboxes.find(b => b.id === toId);
      if (!fromBox || !toBox) return;

      const batch = writeBatch(db);
      batch.update(doc(db, 'cashboxes', fromId), {
        currentBalance: Math.max(0, fromBox.currentBalance - amount)
      });
      batch.update(doc(db, 'cashboxes', toId), {
        currentBalance: toBox.currentBalance + amount
      });

      const movId = `trf-${Date.now()}`;
      batch.set(doc(db, 'cash_movements', movId), {
        id: movId,
        cashboxId: fromId,
        cashboxName: fromBox.name,
        type: 'transferencia',
        amount,
        category: 'transferencia_entre_cajas',
        concept: concept || `Transferencia hacia ${toBox.name}`,
        date: new Date().toISOString(),
        destinationCashboxId: toId,
        destinationCashboxName: toBox.name,
        user: currentUser?.name || 'Administración',
        createdAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'cashboxes');
    }
  };

  const handleRecordSupplierPayment = async (supplierId: string, amount: number, cashboxId: string, notes: string) => {
    try {
      const sup = suppliers.find(s => s.id === supplierId);
      const box = cashboxes.find(b => b.id === cashboxId);
      const batch = writeBatch(db);

      if (box) {
        batch.update(doc(db, 'cashboxes', box.id), {
          currentBalance: Math.max(0, box.currentBalance - amount)
        });
      }

      const txId = `tx-sup-${Date.now()}`;
      batch.set(doc(db, 'financial_transactions', txId), {
        id: txId,
        type: 'pago_proveedor',
        direction: 'egreso',
        amount,
        date: new Date().toISOString(),
        entityId: supplierId,
        entityName: sup?.businessName || 'Proveedor',
        paymentMethod: box?.type === 'banco' ? 'transferencia' : 'efectivo',
        concept: notes || `Pago a proveedor ${sup?.businessName || ''}`,
        receiptNumber: `OP-${Date.now().toString().slice(-6)}`
      });

      const movId = `mov-sup-${Date.now()}`;
      batch.set(doc(db, 'cash_movements', movId), {
        id: movId,
        cashboxId: cashboxId || (cashboxes[0]?.id || 'box-planta'),
        cashboxName: box?.name || 'Caja Planta',
        type: 'egreso',
        amount,
        category: 'materias_primas',
        concept: `Pago a proveedor: ${sup?.businessName || ''}. ${notes}`,
        date: new Date().toISOString(),
        user: currentUser?.name || 'Finanzas',
        createdAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'suppliers');
    }
  };

  // --- STAFF & SALARY HANDLERS ---
  const handleSaveEmployee = async (emp: Employee) => {
    try {
      await setDoc(doc(db, 'employees', emp.id), emp);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'employees');
    }
  };

  const handleRecordSalaryPayment = async (payment: SalaryPayment) => {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'salary_payments', payment.id), payment);

      const box = cashboxes.find(b => b.id === payment.cashboxId);
      if (box) {
        batch.update(doc(db, 'cashboxes', box.id), {
          currentBalance: Math.max(0, box.currentBalance - payment.netAmount)
        });
      }

      const movId = `mov-sal-${Date.now()}`;
      batch.set(doc(db, 'cash_movements', movId), {
        id: movId,
        cashboxId: payment.cashboxId || 'box-planta',
        cashboxName: box?.name || 'Caja Planta',
        type: 'egreso',
        amount: payment.netAmount,
        category: payment.paymentType === 'adelanto' ? 'adelanto_sueldos' : 'sueldos_jornales',
        concept: `Liquidación ${payment.paymentNumber} - ${payment.employeeName} (${payment.period})`,
        date: payment.date || new Date().toISOString(),
        employeeId: payment.employeeId,
        employeeName: payment.employeeName,
        user: currentUser?.name || 'Recursos Humanos',
        createdAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'salary_payments');
    }
  };

  // Customer Portal Login / Logout
  const handleLoginClient = (taxId: string) => {
    setPortalClientTaxId(taxId);
    localStorage.setItem('colorear_portal_client_tax_id', taxId);
    setActiveModule('customer_portal');
  };

  const handlePortalLogin = async (taxId: string, code: string): Promise<string | null> => {
    try {
      return await loginPortal(taxId, code); // onAuthStateChanged carga los datos del cliente
    } catch (err) {
      console.error('Error en login del portal:', err);
      return 'No se pudo ingresar. Intentá de nuevo en unos minutos.';
    }
  };

  const handleLogoutClient = () => {
    if (!MODO_DEMO) {
      logoutAndReload();
      return;
    }
    setPortalClientTaxId(null);
    localStorage.removeItem('colorear_portal_client_tax_id');
  };

  // --- INTERNAL INSTALLMENTS (CUOTAS INTERNAS) HANDLERS ---
  const handleSaveInstallmentPlan = async (plan: InternalInstallmentPlan) => {
    try {
      await setDoc(doc(db, 'internal_installments', plan.id), plan);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'internal_installments');
    }
  };

  const handleRecordFeePayment = async (
    planId: string, 
    feeNumber: number, 
    amount: number, 
    method: 'efectivo' | 'transferencia' | 'cheque' | 'echeq',
    cashboxId?: string,
    receiptNumber?: string,
    notes?: string
  ) => {
    try {
      const plan = internalInstallments.find(p => p.id === planId);
      if (!plan) return;
      const batch = writeBatch(db);

      // 1. Update plan fee
      const updatedFees = plan.fees.map(f => {
        if (f.feeNumber === feeNumber) {
          return {
            ...f,
            status: 'pagada' as const,
            paidAmount: amount,
            paidDate: new Date().toISOString().split('T')[0],
            paymentMethod: method,
            receiptNumber,
            notes
          };
        }
        return f;
      });

      const allPaid = updatedFees.every(f => f.status === 'pagada');
      const planRef = doc(db, 'internal_installments', planId);
      batch.update(planRef, {
        fees: updatedFees,
        status: allPaid ? 'finalizado' : 'vigente'
      });

      // 2. If target cashbox is given, update balance and log cash movement
      const targetBox = cashboxes.find(b => b.id === cashboxId) || cashboxes[0];
      if (targetBox) {
        batch.update(doc(db, 'cashboxes', targetBox.id), {
          currentBalance: targetBox.currentBalance + amount
        });

        const movId = `mov-fee-${Date.now()}`;
        batch.set(doc(db, 'cash_movements', movId), {
          id: movId,
          cashboxId: targetBox.id,
          cashboxName: targetBox.name,
          type: 'ingreso',
          amount,
          category: 'cobranza_clientes',
          concept: `Cobro Cuota #${feeNumber} - Plan ${plan.planNumber} (${plan.customerName})`,
          referenceNumber: receiptNumber || `REC-CUO-${feeNumber}`,
          date: new Date().toISOString().split('T')[0],
          user: currentUser?.name || 'Administración',
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'internal_installments');
    }
  };

  // --- LOYALTY (FIDELIZACIÓN) HANDLERS ---
  const handleSaveLoyaltyReward = async (reward: LoyaltyReward) => {
    try {
      await setDoc(doc(db, 'loyalty_rewards', reward.id), reward);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'loyalty_rewards');
    }
  };

  const handleAdjustPoints = async (customerId: string, points: number, concept: string) => {
    try {
      const cust = customers.find(c => c.id === customerId);
      if (!cust) return;
      if (cust.hasCurrentAccount) {
        alert("Cliente excluido de fidelización por tener Cuenta Corriente.");
        return;
      }
      const batch = writeBatch(db);
      const currentPts = cust.loyaltyPoints || 0;
      const newPts = Math.max(0, currentPts + points);
      const custRef = doc(db, 'customers', customerId);
      batch.update(custRef, { loyaltyPoints: newPts });

      const txId = `ltx-${Date.now()}`;
      batch.set(doc(db, 'loyalty_transactions', txId), {
        id: txId,
        customerId,
        type: 'ajuste_manual',
        points,
        referenceType: 'manual',
        description: concept,
        date: new Date().toISOString().split('T')[0]
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'loyalty_transactions');
    }
  };

  const handleRedeemLoyaltyReward = async (customerId: string, rewardId: string): Promise<string | null> => {
    try {
      const cust = customers.find(c => c.id === customerId);
      const rew = loyaltyRewards.find(r => r.id === rewardId);
      if (!cust || !rew) return null;
      if (cust.hasCurrentAccount) return null;
      if ((cust.loyaltyPoints || 0) < rew.pointsCost || rew.stock <= 0) return null;

      const batch = writeBatch(db);
      const redemptionCode = `CJ-${Math.floor(Math.random() * 899999 + 100000)}`;
      const redId = `red-${Date.now()}`;

      // Deduct points
      const custRef = doc(db, 'customers', customerId);
      batch.update(custRef, {
        loyaltyPoints: (cust.loyaltyPoints || 0) - rew.pointsCost,
        loyaltyTotalRedeemed: (cust.loyaltyTotalRedeemed || 0) + rew.pointsCost
      });

      // Deduct reward stock
      const rewRef = doc(db, 'loyalty_rewards', rewardId);
      batch.update(rewRef, { stock: Math.max(0, rew.stock - 1) });

      // Save redemption coupon
      batch.set(doc(db, 'loyalty_redemptions', redId), {
        id: redId,
        code: redemptionCode,
        customerId,
        customerName: cust.businessName || cust.tradeName || 'Cliente',
        customerTaxId: cust.taxId,
        rewardId,
        rewardTitle: rew.title,
        pointsCost: rew.pointsCost,
        date: new Date().toISOString().split('T')[0],
        status: 'emitido'
      });

      // Log transaction
      const txId = `ltx-${Date.now()}`;
      batch.set(doc(db, 'loyalty_transactions', txId), {
        id: txId,
        customerId,
        type: 'canje_premio',
        points: -rew.pointsCost,
        referenceType: 'redemption',
        referenceId: redId,
        description: `Canje de premio: ${rew.title} (Cupón ${redemptionCode})`,
        date: new Date().toISOString().split('T')[0]
      });

      await batch.commit();
      return redemptionCode;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleValidateCoupon = async (couponCode: string): Promise<boolean> => {
    try {
      const red = loyaltyRedemptions.find(r => r.code === couponCode && r.status === 'emitido');
      if (!red) return false;
      await updateDoc(doc(db, 'loyalty_redemptions', red.id), {
        status: 'entregado',
        deliveredAt: new Date().toISOString(),
        deliveredBy: currentUser?.name || 'Mostrador'
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleEnterRaffle = async (customerId: string, raffleId: string) => {
    try {
      const cust = customers.find(c => c.id === customerId);
      const raf = loyaltyRaffles.find(r => r.id === raffleId);
      if (!cust || !raf) return;
      if (cust.hasCurrentAccount) return;
      if ((cust.loyaltyPoints || 0) < raf.pointsPerEntry) return;

      const batch = writeBatch(db);
      const custRef = doc(db, 'customers', customerId);
      batch.update(custRef, {
        loyaltyPoints: (cust.loyaltyPoints || 0) - raf.pointsPerEntry
      });

      const rafRef = doc(db, 'loyalty_raffles', raffleId);
      batch.update(rafRef, {
        totalEntries: (raf.totalEntries || 0) + 1
      });

      const txId = `ltx-${Date.now()}`;
      batch.set(doc(db, 'loyalty_transactions', txId), {
        id: txId,
        customerId,
        type: 'sorteo_entrada',
        points: -raf.pointsPerEntry,
        referenceType: 'raffle',
        referenceId: raffleId,
        description: `Entrada para: ${raf.title}`,
        date: new Date().toISOString().split('T')[0]
      });

      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetLoyaltyProgram = async () => {
    try {
      const batch = writeBatch(db);
      customers.forEach(c => {
        batch.update(doc(db, 'customers', c.id), {
          loyaltyPoints: 0,
          loyaltyTotalEarned: 0,
          loyaltyTotalRedeemed: 0
        });
      });
      loyaltyTransactions.forEach(t => {
        batch.delete(doc(db, 'loyalty_transactions', t.id));
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  // --- ARCA AUTHORIZATION HANDLER ---
  const handleAuthorizeOrderManually = async (orderId: string, pointOfSale: number, invoiceType: string): Promise<ArcaElectronicVoucher> => {
    const order = salesOrders.find(o => o.id === orderId);
    if (!order) throw new Error("Orden no encontrada");

    const ptoVta = pointOfSale || 4;
    const vNumber = `${String(ptoVta).padStart(4, '0')}-${String(Math.floor(Math.random() * 89999 + 10000)).padStart(8, '0')}`;
    const generatedCae = `74${Date.now().toString().slice(-12)}`;
    const dueCae = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const qrData = {
      ver: 1,
      fecha: todayStr,
      cuit: parseInt(order.customerTaxId?.replace(/[^0-9]/g, '') || '30711223344'),
      ptoVta: ptoVta,
      tipoCmp: invoiceType === 'FACTURA_A' ? 1 : 6,
      nroCmp: parseInt(vNumber.split('-')[1]),
      importe: order.total,
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: 80,
      nroDocRec: parseInt(order.customerTaxId?.replace(/[^0-9]/g, '') || '0'),
      tipoCodigoAutorizacion: 'A',
      codigoAutorizacion: parseInt(generatedCae)
    };
    const b64 = btoa(JSON.stringify(qrData));
    const afipQrUrl = `https://www.afip.gob.ar/fe/qr/?p=${b64}`;

    const newVoucher: ArcaElectronicVoucher = {
      id: `arc-${Date.now()}`,
      voucherNumber: vNumber,
      voucherType: invoiceType as any || 'FACTURA_A',
      pointOfSale: ptoVta,
      date: todayStr,
      customerId: order.customerId,
      customerName: order.customerName,
      customerTaxId: order.customerTaxId,
      taxCategory: 'responsable_inscripto',
      netAmount: Math.round(order.total / 1.21),
      iva21: Math.round(order.total - order.total / 1.21),
      total: order.total,
      cae: generatedCae,
      caeVto: dueCae,
      afipQrUrl,
      status: 'autorizado',
      environment: companyConfig?.arcaEnvironment || 'homologacion',
      associatedOrderId: order.id,
      createdAt: new Date().toISOString()
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'arca_vouchers', newVoucher.id), newVoucher);
    batch.update(doc(db, 'sales_orders', order.id), {
      status: 'facturado',
      cae: generatedCae,
      caeVto: dueCae,
      invoiceNumber: vNumber
    });
    await batch.commit();

    return newVoucher;
  };

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('colorear_current_user', JSON.stringify(user));
    if (user.role === 'vendedor_calle') {
      const matchSeller = sellers.find(s => 
        (s.email && s.email.toLowerCase() === user.email.toLowerCase()) || 
        s.name.toLowerCase().includes(user.name.toLowerCase())
      );
      if (matchSeller) {
        setActiveSellerContext(matchSeller);
      }
      setIsMobileSellerAppOpen(true);
    } else {
      setActiveModule('desktop');
    }
  };

  // --- MODO PRODUCCIÓN: login real con Firebase Auth ---
  const handlePasswordLogin = async (email: string, password: string): Promise<string | null> => {
    setLoginNotice(null);
    try {
      await loginStaff(email, password);
      return null; // onAuthStateChanged se encarga del resto
    } catch (err) {
      return translateAuthError(err);
    }
  };

  const handleForgotPassword = async (email: string): Promise<string | null> => {
    try {
      await requestPasswordReset(email);
      return null;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // No revelar si el email existe o no
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') return null;
      return translateAuthError(err);
    }
  };

  const handleInitialSetup = async (params: { name: string; email: string; password: string; companyName: string }): Promise<string | null> => {
    try {
      // Se marca antes para que el listener de sesión no intente resolver un usuario a medio crear
      setupInProgressRef.current = true;
      await runInitialSetup(params);
      const session = auth.currentUser ? await resolveSession(auth.currentUser) : null;
      if (session && session.kind === 'staff') {
        setNeedsInitialSetup(false);
        setCurrentUser(session.user);
        setDataSession('staff');
        setActiveModule('desktop');
        setAuthResolved(true);
      }
      return null;
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code.startsWith('auth/')) return translateAuthError(err);
      console.error('Error en la configuración inicial:', err);
      return 'No se pudo completar la configuración. Revisá que las reglas de Firestore estén publicadas.';
    } finally {
      setupInProgressRef.current = false;
    }
  };

  const handleLogout = () => {
    if (!MODO_DEMO) {
      logoutAndReload();
      return;
    }
    setCurrentUser(null);
    setIsMobileSellerAppOpen(false);
    localStorage.removeItem('colorear_current_user');
  };

  const handleToggleSystemModule = async (moduleKey: ModuleKey, enabled: boolean) => {
    try {
      const currentToggles = companyConfig?.systemModuleToggles || {};
      const updatedToggles: Partial<Record<ModuleKey, boolean>> = { ...currentToggles, [moduleKey]: enabled };
      const cfgRef = doc(db, 'company_config', 'main_config');
      await updateDoc(cfgRef, { systemModuleToggles: updatedToggles });
      setCompanyConfig(prev => prev ? { ...prev, systemModuleToggles: updatedToggles } : null);
    } catch (e) {
      console.error('Error toggling system module:', e);
    }
  };

  const handleBatchToggleSystemModules = async (updates: Partial<Record<ModuleKey, boolean>>) => {
    try {
      const currentToggles = companyConfig?.systemModuleToggles || {};
      const updatedToggles: Partial<Record<ModuleKey, boolean>> = { ...currentToggles, ...updates };
      const cfgRef = doc(db, 'company_config', 'main_config');
      await updateDoc(cfgRef, { systemModuleToggles: updatedToggles });
      setCompanyConfig(prev => prev ? { ...prev, systemModuleToggles: updatedToggles } : null);
    } catch (e) {
      console.error('Error batch updating system modules:', e);
    }
  };

  const ALL_MODULES_LIST: ModuleKey[] = [
    'desktop', 'reports', 'ai_assistant', 'production', 'purchases', 'prices',
    'sales', 'sellers', 'customers', 'installments', 'loyalty', 'logistics',
    'customer_portal', 'finances', 'checks', 'cashboxes', 'arca_fiscal',
    'accounting', 'profitability', 'employees', 'users', 'settings'
  ];

  const activeModulesCount = ALL_MODULES_LIST.filter(k => companyConfig?.systemModuleToggles?.[k] !== false).length;

  // Calculations for badges
  const productionActiveCount = productionOrders.filter(o => o.status === 'en_proceso' || o.status === 'planificada').length;
  const pendingDispatchCount = salesOrders.filter(o => o.status === 'preparando_remito' || o.status === 'facturado').length;
  const pendingPaymentCount = customers.filter(c => c.currentBalance > 0).length;

  const urgentChecksCount = checks.filter(c => {
    if (c.status !== 'en_cartera') return false;
    const dueTime = new Date(c.dueDate).getTime();
    const nowTime = new Date().getTime();
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <img 
          src="/assets/aistudio/colorear-500px_0158e3cb.webp" 
          alt="Colorear Pinturas" 
          className="h-16 w-auto object-contain mb-4 animate-pulse"
        />
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span>Conectando con base de datos en tiempo real Firestore...</span>
        </div>
      </div>
    );
  }

  // MODO PRODUCCIÓN: instalación nueva, todavía no hay ningún usuario
  if (!MODO_DEMO && needsInitialSetup && !currentUser) {
    return <InitialSetupScreen onSetup={handleInitialSetup} />;
  }

  // MODO PRODUCCIÓN: la app de preventistas solo se abre con un usuario logueado
  const canOpenMobileSellerApp = MODO_DEMO || !!currentUser;

  // Dedicated Mobile App for Street Traveling Salesmen (Preventistas / Vendedores de Calle)
  if (isMobileSellerAppOpen && canOpenMobileSellerApp) {
    return (
      <MobileSellerApp
        sellers={sellers}
        routeSheets={routeSheets}
        customers={customers}
        products={products}
        salesOrders={salesOrders}
        financialTransactions={financialTransactions}
        config={companyConfig}
        activeSellerContext={activeSellerContext}
        onSetActiveSellerContext={setActiveSellerContext}
        onCloseMobileApp={() => setIsMobileSellerAppOpen(false)}
        onCreateSalesOrder={async (order) => {
          await setDoc(doc(db, 'sales_orders', order.id), order);
          const cust = customers.find(c => c.id === order.customerId);
          if (cust && order.paymentStatus !== 'pagado') {
            await updateDoc(doc(db, 'customers', cust.id), {
              currentBalance: cust.currentBalance + order.total
            });
          }
        }}
        onRecordCustomerPayment={handleRecordCustomerPayment}
        onSaveRouteSheet={async (sheet) => {
          await setDoc(doc(db, 'route_sheets', sheet.id), sheet);
        }}
      />
    );
  }

  // Not logged in: show LoginScreen or Customer Portal
  if (!currentUser) {
    if (activeModule === 'customer_portal') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <img 
                src={companyConfig?.logoUrl || "/assets/aistudio/colorear-500px_0158e3cb.webp"} 
                alt={companyConfig?.tradeName || "Colorear Pinturas"} 
                className="h-6 w-auto brightness-0 invert" 
              />
              <span>Portal Oficial de Clientes & Pinturerías</span>
            </div>
            <button
              onClick={() => {
                if (!MODO_DEMO && dataSession === 'portal') {
                  logoutAndReload();
                  return;
                }
                setActiveModule('desktop');
              }}
              className="text-slate-300 hover:text-white flex items-center gap-1 font-bold underline"
            >
              ← Volver al Acceso de Personal de Fábrica
            </button>
          </div>
          <CustomerPortal
            customers={customers}
            salesOrders={salesOrders}
            rewards={loyaltyRewards}
            config={companyConfig}
            activeClientTaxId={portalClientTaxId}
            onLoginClient={handleLoginClient}
            onLogoutClient={handleLogoutClient}
            onRedeemReward={handleRedeemLoyaltyReward}
            requireAccessCode={!MODO_DEMO}
            onLoginWithCode={handlePortalLogin}
          />
        </div>
      );
    }

    // En producción, antes de iniciar sesión solo se conoce la marca pública (logo y nombre)
    const loginConfig: CompanyConfig | null = MODO_DEMO
      ? companyConfig
      : publicBranding
        ? ({
            companyName: publicBranding.companyName,
            tradeName: publicBranding.tradeName,
            logoUrl: publicBranding.logoUrl || undefined,
            plantAddress: publicBranding.address
          } as CompanyConfig)
        : null;

    return (
      <LoginScreen
        users={MODO_DEMO ? appUsers : []}
        onLogin={handleLogin}
        onOpenCustomerPortal={() => setActiveModule('customer_portal')}
        onOpenMobileSellerApp={MODO_DEMO ? () => setIsMobileSellerAppOpen(true) : undefined}
        config={loginConfig}
        modoDemo={MODO_DEMO}
        onPasswordLogin={handlePasswordLogin}
        onForgotPassword={handleForgotPassword}
        initialError={loginNotice}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Header Nova Systems */}
      <Header
        activeModule={activeModule}
        setActiveModule={handleSelectModuleWithTab}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearAllNotifications={handleClearAllNotifications}
        config={companyConfig}
        portalClientTaxId={portalClientTaxId}
        currentUser={currentUser}
        activeSellerContext={activeSellerContext}
        onSetActiveSellerContext={setActiveSellerContext}
        onLogout={handleLogout}
        onExitPortal={handleLogoutClient}
        onOpenCustomerPortalModal={() => handleSelectModuleWithTab('customer_portal')}
        onOpenMobileSellerApp={() => setIsMobileSellerAppOpen(true)}
        onOpenCreatorModuleControl={() => setIsCreatorModuleControlOpen(true)}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        activeModulesCount={activeModulesCount}
      />

      {/* Pestañas secundarias de navegación (Tabs bar) con opción de cierre (✕) */}
      <TabsBar
        openTabs={openTabs}
        activeTab={activeModule}
        onSelectTab={handleSelectModuleWithTab}
        onCloseTab={handleCloseTab}
        onNewTabClick={() => setIsGlobalSearchOpen(true)}
      />

      {/* Main Container - Full Width Content View (Only Horizontal Navigation Bar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Content View */}
        <main className="flex-1 h-full overflow-y-auto bg-slate-100 relative">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {currentUser?.role !== 'creador' && companyConfig?.systemModuleToggles?.[activeModule] === false ? (
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 text-center shadow-xl max-w-md mx-auto my-16 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-3xl shadow-xs">
                  ⚠️
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Módulo No Disponible</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                  Este módulo ha sido temporalmente desactivado en la configuración general del sistema por la administración / Creador.
                </p>
                <button
                  onClick={() => handleSelectModuleWithTab('desktop')}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  ← Volver al Escritorio Principal
                </button>
              </div>
            ) : (
              <>
                {activeModule === 'desktop' && (
            <DesktopModule
              setActiveModule={handleSelectModuleWithTab}
              productionOrders={productionOrders}
              salesOrders={salesOrders}
              customers={customers}
              rawMaterials={rawMaterials}
              products={products}
              config={companyConfig}
              onOpenNewProductionModal={() => handleSelectModuleWithTab('production')}
              onOpenNewSalesModal={() => handleSelectModuleWithTab('sales')}
              onExportPriceListExcel={() => exportPriceListToExcel(products, companyConfig || undefined)}
              onNavigateToCustomer={(cust) => handleSelectModuleWithTab('customers')}
              onOpenMobileSellerApp={() => setIsMobileSellerAppOpen(true)}
            />
          )}

          {activeModule === 'production' && (
            <ProductionModule
              rawMaterials={rawMaterials}
              formulas={formulas}
              productionOrders={productionOrders}
              products={products}
              inventoryMovements={inventoryMovements}
              onSaveRawMaterial={async (mat) => {
                await setDoc(doc(db, 'raw_materials', mat.id), mat);
              }}
              onDeleteRawMaterial={async (id) => {
                await deleteDoc(doc(db, 'raw_materials', id));
              }}
              onSaveFormula={async (formula) => {
                await setDoc(doc(db, 'formulas', formula.id), formula);
              }}
              onDeleteFormula={async (id) => {
                await deleteDoc(doc(db, 'formulas', id));
              }}
              onCreateProductionOrder={handleCreateProductionOrder}
              onCompleteProductionOrder={handleCompleteProductionOrder}
              onUpdateOrderStatus={async (orderId, status) => {
                await updateDoc(doc(db, 'production_orders', orderId), { status });
              }}
              onSendToPriceList={(preloadData) => {
                setPreloadedProductionData(preloadData);
                setActiveModule('prices');
              }}
            />
          )}

          {activeModule === 'sales' && (
            <SalesOrdersModule
              salesOrders={salesOrders}
              customers={customers}
              products={products}
              productionOrders={productionOrders}
              transports={transports}
              cashboxes={cashboxes}
              quotes={quotes}
              standaloneRemitos={standaloneRemitos}
              config={companyConfig}
              onCreateOrder={async (order, cashboxId, paymentMethod) => {
                const batch = writeBatch(db);
                batch.set(doc(db, 'sales_orders', order.id), order);

                const cust = customers.find(c => c.id === order.customerId);
                if (cust && order.paymentStatus !== 'pagado') {
                  batch.update(doc(db, 'customers', cust.id), {
                    currentBalance: cust.currentBalance + order.total
                  });
                }

                // If cash payment and cashbox selected, record cash movement
                if (cashboxId && paymentMethod === 'efectivo' && order.paymentStatus === 'pagado') {
                  const targetBox = cashboxes.find(b => b.id === cashboxId);
                  if (targetBox) {
                    batch.update(doc(db, 'cashboxes', targetBox.id), {
                      currentBalance: targetBox.currentBalance + order.total,
                      updatedAt: new Date().toISOString()
                    });

                    const movId = `cmov-${Date.now()}`;
                    batch.set(doc(db, 'cash_movements', movId), {
                      id: movId,
                      cashboxId: targetBox.id,
                      cashboxName: targetBox.name,
                      type: 'ingreso',
                      amount: order.total,
                      category: 'venta_mostrador',
                      concept: `Cobro en mostrador Venta ${order.orderNumber} - ${order.customerName}`,
                      date: new Date().toISOString().split('T')[0],
                      referenceNumber: order.invoiceNumber || order.orderNumber,
                      user: currentUser?.name || 'Ventas Mostrador',
                      createdAt: new Date().toISOString()
                    });
                  }
                }

                // REGLA EXACTA SECCIÓN 10 PROMPT MAESTRO:
                // - pointsPerCurrency = 0.01 (1 punto cada $100)
                // - Los clientes con hasCurrentAccount === true quedan SIEMPRE EXCLUIDOS
                // - referenceType: "sale" y referenceId
                if (cust && !cust.hasCurrentAccount && cust.loyaltyEligible !== false) {
                  const pointsEarned = Math.floor(order.total * 0.01);
                  if (pointsEarned > 0) {
                    batch.update(doc(db, 'customers', cust.id), {
                      loyaltyPoints: (cust.loyaltyPoints || 0) + pointsEarned,
                      loyaltyTotalEarned: (cust.loyaltyTotalEarned || cust.loyaltyPoints || 0) + pointsEarned
                    });

                    const txId = `ltx-sale-${order.id}`;
                    batch.set(doc(db, 'loyalty_transactions', txId), {
                      id: txId,
                      customerId: cust.id,
                      type: 'acumulacion_compra',
                      points: pointsEarned,
                      referenceType: 'sale',
                      referenceId: order.id,
                      description: `Puntos por compra contado en Pedido ${order.orderNumber} ($${order.total.toLocaleString('es-AR')})`,
                      date: new Date().toISOString().split('T')[0]
                    });
                  }
                }

                await batch.commit();
              }}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeliverOrderItems={handleDeliverOrderItems}
              onRecordOrderPayment={async (orderId, amount) => {
                await updateDoc(doc(db, 'sales_orders', orderId), {
                  paymentStatus: 'pagado',
                  paidAmount: amount
                });
              }}
              onSaveQuote={async (quote) => {
                await setDoc(doc(db, 'quotes', quote.id), quote);
              }}
              onDeleteQuote={async (quoteId) => {
                await deleteDoc(doc(db, 'quotes', quoteId));
              }}
              onUpdateQuoteStatus={async (quoteId, status) => {
                await updateDoc(doc(db, 'quotes', quoteId), { status });
              }}
              onSaveStandaloneRemito={async (remito) => {
                const batch = writeBatch(db);
                batch.set(doc(db, 'delivery_orders', remito.id), remito);

                // Discount real physical product stock for each delivered item
                remito.items.forEach(it => {
                  const prod = products.find(p => p.id === it.productId);
                  if (prod) {
                    const newStock = Math.max(0, prod.stock - it.quantity);
                    batch.update(doc(db, 'products', prod.id), { stock: newStock });

                    const movId = `mov-rem-${remito.id}-${it.productId}`;
                    batch.set(doc(db, 'inventory_movements', movId), {
                      id: movId,
                      itemType: 'product',
                      itemId: prod.id,
                      itemName: prod.name,
                      movementType: 'salida_venta',
                      quantity: -it.quantity,
                      unit: prod.presentation || 'un',
                      reference: remito.deliveryNumber,
                      batchNumber: it.batchNumber,
                      partidaNumber: it.partidaNumber,
                      user: currentUser?.name || 'Depósito Despacho',
                      date: new Date().toISOString()
                    });
                  }
                });

                await batch.commit();
              }}
            />
          )}

          {activeModule === 'sellers' && (
            <SellersModule
              sellers={sellers}
              routeSheets={routeSheets}
              customers={customers}
              salesOrders={salesOrders}
              financialTransactions={financialTransactions}
              config={companyConfig}
              currentUser={currentUser}
              activeSellerContext={activeSellerContext}
              onSetActiveSellerContext={setActiveSellerContext}
              onSaveSeller={async (seller) => {
                await setDoc(doc(db, 'sellers', seller.id), seller);
              }}
              onDeleteSeller={async (sellerId) => {
                await deleteDoc(doc(db, 'sellers', sellerId));
              }}
              onSaveRouteSheet={async (routeSheet) => {
                await setDoc(doc(db, 'route_sheets', routeSheet.id), routeSheet);
              }}
              onDeleteRouteSheet={async (routeSheetId) => {
                await deleteDoc(doc(db, 'route_sheets', routeSheetId));
              }}
              onOpenMobileSellerApp={() => setIsMobileSellerAppOpen(true)}
            />
          )}

          {activeModule === 'prices' && (
            <div className="space-y-4">
              <ListasPreciosModule />
              <div className="pt-4 border-t border-slate-200">
                <details className="group">
                  <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-800 list-none flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span>Ver Catálogo Completo de Productos, Fórmulas de Lista y Exportación PDF/Excel</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="pt-3">
                    <PriceListModule
                      products={products}
                      formulas={formulas}
                      productionOrders={productionOrders}
                      initialPreload={preloadedProductionData}
                      onClearPreload={() => setPreloadedProductionData(null)}
                      config={companyConfig}
                      onSaveProduct={async (product) => {
                        await setDoc(doc(db, 'products', product.id), product);
                      }}
                      onDeleteProduct={async (id) => {
                        await deleteDoc(doc(db, 'products', id));
                      }}
                      onBulkPriceUpdate={async (increasePct, target, category) => {
                        const batch = writeBatch(db);
                        const factor = 1 + increasePct / 100;
                        const targetProducts = category && category !== 'all'
                          ? products.filter(p => p.category === category)
                          : products;
                        targetProducts.forEach(p => {
                          const ref = doc(db, 'products', p.id);
                          const updates: Partial<Product> = {};
                          if (target === 'sale_only' || target === 'cost_and_sale') {
                            updates.priceDistributor = Math.round(p.priceDistributor * factor);
                            updates.priceWholesale = Math.round(p.priceWholesale * factor);
                            updates.priceRetail = Math.round(p.priceRetail * factor);
                          }
                          if (target === 'cost_only' || target === 'cost_and_sale') {
                            updates.unitCost = Math.round(p.unitCost * factor);
                          }
                          batch.update(ref, updates);
                        });
                        if ((target === 'cost_only' || target === 'cost_and_sale') && (!category || category === 'all')) {
                          rawMaterials.forEach(m => {
                            const mRef = doc(db, 'raw_materials', m.id);
                            batch.update(mRef, {
                              unitCost: Math.round(m.unitCost * factor)
                            });
                          });
                        }
                        await batch.commit();
                      }}
                      onSyncOfficialCatalog={syncOfficialAugust2026PriceList}
                    />
                  </div>
                </details>
              </div>
            </div>
          )}

          {activeModule === 'inventory' && (
            <InventoryModule
              products={products}
              suppliers={suppliers}
              activeDraft={supplierOrderDraft}
              activeDraftSupplierId={supplierOrderDraftSupplierId}
              onAddToSupplierOrder={handleAddToSupplierOrder}
              onOpenSupplierOrders={() => setActiveModule('supplier_orders')}
              onSaveProduct={async (product) => {
                await setDoc(doc(db, 'products', product.id), product);
              }}
              onDeleteProduct={async (id) => {
                await deleteDoc(doc(db, 'products', id));
              }}
              onSendToPos={(product) => {
                setActiveModule('sales');
              }}
              onBulkRecalculate={async () => {
                const batch = writeBatch(db);
                products.forEach(p => {
                  const unitCost = p.unitCost || 1000;
                  const priceRetail = p.priceRetail || Math.round(unitCost * 1.5);
                  const priceWholesale = p.priceWholesale || Math.round(unitCost * 1.3);
                  const priceDistributor = p.priceDistributor || Math.round(unitCost * 1.2);
                  batch.update(doc(db, 'products', p.id), {
                    priceRetail,
                    priceWholesale,
                    priceDistributor
                  });
                });
                await batch.commit();
              }}
            />
          )}

          {activeModule === 'combos' && (
            <CombosModule products={products} />
          )}

          {activeModule === 'faltantes' && (
            <FaltantesModule 
              products={products}
              onOpenSupplierOrderWithItems={() => setActiveModule('supplier_orders')}
            />
          )}

          {activeModule === 'stock_adjustments' && (
            <AjusteStockModule products={products} />
          )}

          {activeModule === 'mass_modification' && (
            <ModificacionMasivaModule 
              products={products}
              onUpdateProducts={() => {}}
            />
          )}

          {activeModule === 'warehouses' && (
            <DepositosSucursalesModule />
          )}

          {activeModule === 'transfers' && (
            <TransferenciasModule products={products} />
          )}

          {activeModule === 'branch_orders' && (
            <PedidosSucursalModule products={products} />
          )}

          {activeModule === 'import_products' && (
            <ImportarDatosModule mode="products" />
          )}

          {activeModule === 'import_stock' && (
            <ImportarDatosModule mode="stock" />
          )}

          {activeModule === 'brands_categories' && (
            <MarcasRubrosModule />
          )}

          {activeModule === 'price_tags' && (
            <EtiquetasPrecioModule products={products} />
          )}

          {activeModule === 'update_prices' && (
            <ActualizacionPreciosModule 
              products={products}
              suppliers={suppliers}
              onApplyPricesUpdate={async (count) => {
                // updates in price
              }}
            />
          )}

          {activeModule === 'supplier_orders' && (
            <SupplierOrdersModule
              purchaseOrders={purchaseOrders}
              products={products}
              suppliers={suppliers}
              config={companyConfig}
              activeDraft={supplierOrderDraft}
              activeDraftSupplierId={supplierOrderDraftSupplierId}
              onUpdateDraft={(items, supplierId) => {
                setSupplierOrderDraft(items);
                setSupplierOrderDraftSupplierId(supplierId);
              }}
              onClearDraft={handleClearSupplierOrderDraft}
              onSavePurchaseOrder={async (po) => {
                await setDoc(doc(db, 'purchase_orders', po.id), po);
              }}
              onReceivePurchaseOrder={handleReceivePurchaseOrder}
              onDeletePurchaseOrder={async (id) => {
                await deleteDoc(doc(db, 'purchase_orders', id));
              }}
              onNavigateToInventory={() => setActiveModule('inventory')}
            />
          )}

          {activeModule === 'purchase_invoices' && (
            <PurchaseInvoiceModule
              products={products}
              suppliers={suppliers}
              purchaseInvoices={purchaseInvoices}
              onSavePurchaseInvoice={async (invoice) => {
                const batch = writeBatch(db);
                batch.set(doc(db, 'purchase_invoices', invoice.id), invoice);

                // 1. If autoUpdateStock: update stock for each item & create inventory_movement
                if (invoice.autoUpdateStock) {
                  invoice.items.forEach(it => {
                    const prod = products.find(p => p.id === it.productId || p.code === it.code);
                    if (prod) {
                      const newStock = (prod.stock || 0) + it.quantity;
                      const updates: any = { stock: newStock };
                      if (invoice.autoUpdateCosts && it.unitCostCalculated) {
                        updates.unitCost = it.unitCostCalculated;
                        updates.costListWithoutIva = it.unitPrice;
                      }
                      batch.update(doc(db, 'products', prod.id), updates);

                      const movId = `mov-compra-${invoice.id}-${it.productId}`;
                      batch.set(doc(db, 'inventory_movements', movId), {
                        id: movId,
                        itemType: 'product',
                        itemId: prod.id,
                        itemName: prod.name,
                        movementType: 'entrada_compra',
                        quantity: it.quantity,
                        unit: it.primaryUnit || prod.primaryUnit || 'Unidad',
                        reference: `${invoice.invoiceType} ${invoice.fullNumber}`,
                        user: currentUser?.name || 'Administración Compras',
                        date: invoice.date
                      });
                    }
                  });
                }

                // 2. If paymentMethod is Cuenta Corriente, update supplier balance
                if (invoice.paymentMethod === 'Cuenta Corriente') {
                  const sup = suppliers.find(s => s.id === invoice.supplierId);
                  if (sup) {
                    const updatedBal = (sup.currentBalance || 0) - invoice.total;
                    batch.update(doc(db, 'suppliers', sup.id), { currentBalance: updatedBal });
                  }
                }

                // 3. Register transaction in finances
                const txId = `tx-compra-${invoice.id}`;
                batch.set(doc(db, 'financial_transactions', txId), {
                  id: txId,
                  date: invoice.date,
                  type: 'egreso',
                  category: 'Materia Prima / Mercadería Proveedores',
                  description: `Factura de Compra ${invoice.invoiceType} ${invoice.fullNumber} - ${invoice.supplierName}`,
                  amount: invoice.total,
                  paymentMethod: invoice.paymentMethod,
                  referenceId: invoice.id,
                  createdBy: currentUser?.name || 'Compras'
                });

                await batch.commit();
              }}
              onSaveProduct={async (prod) => {
                await setDoc(doc(db, 'products', prod.id), prod);
              }}
              onClose={() => setActiveModule('inventory')}
            />
          )}

          {activeModule === 'customers' && (
            <CustomersModule
              customers={customers}
              salesOrders={salesOrders}
              financialTransactions={financialTransactions}
              transports={transports}
              config={companyConfig}
              onSaveCustomer={async (cust) => {
                await setDoc(doc(db, 'customers', cust.id), cust);
              }}
              onRecordPayment={handleRecordCustomerPayment}
            />
          )}

          {activeModule === 'logistics' && (
            <LogisticsModule
              transports={transports}
              salesOrders={salesOrders}
              customers={customers}
              onSaveTransport={async (trans) => {
                await setDoc(doc(db, 'transports', trans.id), trans);
              }}
            />
          )}

          {activeModule === 'purchases' && (
            <PurchasesModule
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              rawMaterials={rawMaterials}
              financialTransactions={financialTransactions}
              cashboxes={cashboxes}
              checks={checks}
              config={companyConfig}
              onSaveSupplier={async (sup) => {
                await setDoc(doc(db, 'suppliers', sup.id), sup);
              }}
              onCreatePurchaseOrder={async (po) => {
                await setDoc(doc(db, 'purchase_orders', po.id), po);
              }}
              onReceivePurchaseOrder={handleReceivePurchaseOrder}
              onRecordSupplierPayment={handleRecordSupplierPayment}
            />
          )}

          {activeModule === 'finances' && (
            <DebtsAndReceivablesModule
              customers={customers}
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              salesOrders={salesOrders}
              cashboxes={cashboxes}
              config={companyConfig}
              onNavigateToCustomer={(customer) => setActiveModule('customers')}
              onRecordSupplierPayment={handleRecordSupplierPayment}
            />
          )}

          {activeModule === 'checks' && (
            <ChecksModule
              checks={checks}
              customers={customers}
              suppliers={suppliers}
              cashboxes={cashboxes}
              onSaveCheck={handleSaveCheck}
              onUpdateCheckStatus={handleUpdateCheckStatus}
            />
          )}

          {activeModule === 'cashboxes' && (
            <CashboxModule
              cashboxes={cashboxes}
              movements={cashMovements}
              onSaveCashbox={handleSaveCashbox}
              onAddMovement={handleAddCashMovement}
              onTransferBetweenCashboxes={handleTransferBetweenCashboxes}
            />
          )}

          {activeModule === 'accounting' && (
            <AccountingAndProfitabilityModule
              salesOrders={salesOrders}
              purchaseOrders={purchaseOrders}
              productionOrders={productionOrders}
              products={products}
              rawMaterials={rawMaterials}
              cashMovements={cashMovements}
              config={companyConfig}
              initialTab="iva_reports"
            />
          )}

          {activeModule === 'profitability' && (
            <AccountingAndProfitabilityModule
              salesOrders={salesOrders}
              purchaseOrders={purchaseOrders}
              productionOrders={productionOrders}
              products={products}
              rawMaterials={rawMaterials}
              cashMovements={cashMovements}
              config={companyConfig}
              initialTab="income_statement"
            />
          )}

          {activeModule === 'employees' && (
            <EmployeesModule
              employees={employees}
              salaryPayments={salaryPayments}
              cashboxes={cashboxes}
              config={companyConfig}
              onSaveEmployee={handleSaveEmployee}
              onRecordSalaryPayment={handleRecordSalaryPayment}
            />
          )}

          {activeModule === 'reports' && (
            <ReportsModule
              productionOrders={productionOrders}
              salesOrders={salesOrders}
              products={products}
              rawMaterials={rawMaterials}
              customers={customers}
              onNavigateToCustomer={(cust) => setActiveModule('customers')}
              onNavigateModule={setActiveModule}
            />
          )}

          {activeModule === 'customer_portal' && (
            <CustomerPortal
              customers={customers}
              salesOrders={salesOrders}
              rewards={loyaltyRewards}
              config={companyConfig}
              activeClientTaxId={portalClientTaxId}
              onLoginClient={handleLoginClient}
              onLogoutClient={handleLogoutClient}
              onRedeemReward={handleRedeemLoyaltyReward}
            />
          )}

          {activeModule === 'installments' && (
            <InternalInstallmentsModule
              plans={internalInstallments}
              customers={customers}
              products={products}
              cashboxes={cashboxes}
              config={companyConfig}
              onSavePlan={handleSaveInstallmentPlan}
              onRecordFeePayment={handleRecordFeePayment}
            />
          )}

          {activeModule === 'loyalty' && (
            <LoyaltyModule
              customers={customers}
              rewards={loyaltyRewards}
              redemptions={loyaltyRedemptions}
              transactions={loyaltyTransactions}
              raffles={loyaltyRaffles}
              config={companyConfig}
              onSaveReward={handleSaveLoyaltyReward}
              onAdjustPoints={handleAdjustPoints}
              onRedeemReward={handleRedeemLoyaltyReward}
              onValidateCoupon={handleValidateCoupon}
              onEnterRaffle={handleEnterRaffle}
              onResetLoyaltyProgram={handleResetLoyaltyProgram}
            />
          )}

          {activeModule === 'arca_fiscal' && (
            <ArcaFiscalModule
              vouchers={arcaVouchers}
              salesOrders={salesOrders}
              customers={customers}
              config={companyConfig}
              onAuthorizeOrderManually={handleAuthorizeOrderManually}
              onSendInvoiceWhatsApp={(voucher, phone) => {
                const text = encodeURIComponent(`Hola, le enviamos el comprobante fiscal ${voucher.voucherType} N° ${voucher.voucherNumber} con CAE ${voucher.cae} emitido por Colorear Pinturas S.A. Verificación oficial: ${voucher.afipQrUrl}`);
                window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
              }}
            />
          )}

          {activeModule === 'ai_assistant' && (
            <SystemAssistantModule
              rawMaterials={rawMaterials}
              formulas={formulas}
              products={products}
              productionOrders={productionOrders}
              salesOrders={salesOrders}
              suppliers={suppliers}
              customers={customers}
            />
          )}

          {activeModule === 'settings' && (
            <SettingsModule
              config={companyConfig}
              onSaveConfig={async (cfg) => {
                await setDoc(doc(db, 'company_config', 'main_config'), cfg);
                setCompanyConfig(cfg);
              }}
              onResetCompleted={() => {
                setSalesOrders([]);
                setProductionOrders([]);
                setPurchaseOrders([]);
                setFinancialTransactions([]);
                setInventoryMovements([]);
                setChecks([]);
                setCashMovements([]);
                setSalaryPayments([]);
              }}
              onOpenCreatorModuleControl={() => setIsCreatorModuleControlOpen(true)}
            />
          )}

          {activeModule === 'users' && (
            <UsersModule
              users={appUsers}
              currentUser={currentUser}
              modoDemo={MODO_DEMO}
              onSaveUser={async (user) => {
                if (MODO_DEMO) {
                  await setDoc(doc(db, 'app_users', user.id), user);
                } else {
                  await updateStaffProfile(user);
                }
              }}
              onCreateUser={MODO_DEMO ? undefined : async (params) => {
                await createStaffUser(params);
              }}
              onSendPasswordReset={MODO_DEMO ? undefined : async (email) => {
                await requestPasswordReset(email);
              }}
              onDeleteUser={async (id) => {
                if (MODO_DEMO) {
                  await deleteDoc(doc(db, 'app_users', id));
                } else {
                  // En producción se desactiva (la cuenta de acceso queda bloqueada por las reglas)
                  const u = appUsers.find(x => x.id === id);
                  if (u) await updateStaffProfile({ ...u, active: false });
                }
              }}
              customers={customers}
              portalAccessList={portalAccessList}
              onCreatePortalAccess={MODO_DEMO ? undefined : createPortalAccess}
              onRevokePortalAccess={MODO_DEMO ? undefined : revokePortalAccess}
            />
          )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Creator Master Module Control Modal */}
      <CreatorModuleControlModal
        isOpen={isCreatorModuleControlOpen}
        onClose={() => setIsCreatorModuleControlOpen(false)}
        systemModuleToggles={companyConfig?.systemModuleToggles}
        onToggleModule={handleToggleSystemModule}
        onBatchToggleModules={handleBatchToggleSystemModules}
        onNavigateToModule={(mod) => handleSelectModuleWithTab(mod)}
      />

      {/* Global Search Spotlight Modal (F10) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        products={products}
        customers={customers}
        onSelectModule={handleSelectModuleWithTab}
        onSelectCustomer={(c) => {
          handleSelectModuleWithTab('customers');
        }}
        onSelectProduct={(p) => {
          handleSelectModuleWithTab('inventory');
        }}
      />
    </div>
  );
}
