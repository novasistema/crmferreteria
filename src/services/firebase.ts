import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { generateColorearProducts } from './colorearPriceListData';
import { 
  RawMaterial, 
  Formula, 
  Product, 
  Customer, 
  Transport, 
  Supplier, 
  CompanyConfig, 
  ProductionOrder, 
  SalesOrder, 
  NotificationItem, 
  FinancialTransaction,
  InventoryMovement,
  AppUser,
  CheckItem,
  Cashbox,
  CashMovement,
  Employee,
  SalaryPayment,
  Seller,
  RouteSheet,
  InternalInstallmentPlan,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltyTransaction,
  LoyaltyRaffle,
  CashRegisterSession,
  ArcaElectronicVoucher,
  Quote,
  DeliveryOrder
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Configuración de Firebase: si están definidas las variables VITE_FIREBASE_* (en Vercel),
// se usan esas; si no, se usa firebase-applet-config.json (proyecto original de AI Studio).
// Así el mismo código sirve para cada cliente, cada uno con su propio proyecto de Firebase.
const env = import.meta.env;
export const activeFirebaseConfig = env.VITE_FIREBASE_PROJECT_ID
  ? {
      apiKey: env.VITE_FIREBASE_API_KEY as string,
      authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string) || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID as string,
      storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET as string) || `${env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
      appId: env.VITE_FIREBASE_APP_ID as string,
      // Vacío = base de datos "(default)" del proyecto
      firestoreDatabaseId: (env.VITE_FIREBASE_DATABASE_ID as string) || '(default)'
    }
  : firebaseConfig;

const app = initializeApp(activeFirebaseConfig);
export const db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth).catch((authErr) => {
        console.warn("Anonymous sign-in note:", authErr);
      });
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline or starting up.");
    }
    return false;
  }
}

// Seed realistic starter data for Colorear Pinturas
export async function seedInitialDataIfEmpty() {
  try {
    const rawMaterialsSnap = await getDocs(collection(db, 'raw_materials'));
    if (!rawMaterialsSnap.empty) {
      return; // Already seeded
    }

    const batch = writeBatch(db);

    // Initial Raw Materials
    const initialRawMaterials: RawMaterial[] = [
      { id: 'rm-1', code: 'MP-RES-01', name: 'Resina Acrílica Estirenada (50% Sólidos)', category: 'resina', unit: 'kg', currentStock: 3450, minStock: 800, unitCost: 3100, supplierName: 'Química del Plata S.A.', updatedAt: new Date().toISOString() },
      { id: 'rm-2', code: 'MP-PIG-01', name: 'Dióxido de Titanio R-902 (Blanco puro)', category: 'pigmento', unit: 'kg', currentStock: 1820, minStock: 500, unitCost: 5400, supplierName: 'Pigmentos Industriales', updatedAt: new Date().toISOString() },
      { id: 'rm-3', code: 'MP-CAR-01', name: 'Carbonato de Calcio Micronizado (Malla 400)', category: 'carga', unit: 'kg', currentStock: 8500, minStock: 2000, unitCost: 450, supplierName: 'Minerales Cordillera', updatedAt: new Date().toISOString() },
      { id: 'rm-4', code: 'MP-CAR-02', name: 'Caolín Calcinado Superblanco', category: 'carga', unit: 'kg', currentStock: 4200, minStock: 1000, unitCost: 820, supplierName: 'Minerales Cordillera', updatedAt: new Date().toISOString() },
      { id: 'rm-5', code: 'MP-ADI-01', name: 'Dispersante Policarboxilato Sódico', category: 'aditivo', unit: 'kg', currentStock: 480, minStock: 150, unitCost: 4800, supplierName: 'Aditivos Especiales', updatedAt: new Date().toISOString() },
      { id: 'rm-6', code: 'MP-ADI-02', name: 'Antiespumante Mineral Base Silicón', category: 'aditivo', unit: 'kg', currentStock: 240, minStock: 80, unitCost: 7200, supplierName: 'Aditivos Especiales', updatedAt: new Date().toISOString() },
      { id: 'rm-7', code: 'MP-ADI-03', name: 'Espesante Celulósico HEC (Alta viscosidad)', category: 'aditivo', unit: 'kg', currentStock: 310, minStock: 100, unitCost: 8900, supplierName: 'Aditivos Especiales', updatedAt: new Date().toISOString() },
      { id: 'rm-8', code: 'MP-ADI-04', name: 'Biocida Isotiazolinona (In-can)', category: 'aditivo', unit: 'kg', currentStock: 190, minStock: 60, unitCost: 6500, supplierName: 'Química del Plata S.A.', updatedAt: new Date().toISOString() },
      { id: 'rm-9', code: 'MP-ENV-20', name: 'Balde Plástico 20 Litros Blanco C/Manija y Tapa', category: 'envase', unit: 'unidad', currentStock: 1250, minStock: 300, unitCost: 3800, supplierName: 'Envases Plásticos del Sol', updatedAt: new Date().toISOString() },
      { id: 'rm-10', code: 'MP-ENV-10', name: 'Balde Plástico 10 Litros C/Manija y Tapa', category: 'envase', unit: 'unidad', currentStock: 850, minStock: 200, unitCost: 2400, supplierName: 'Envases Plásticos del Sol', updatedAt: new Date().toISOString() },
      { id: 'rm-11', code: 'MP-ENV-04', name: 'Lata Hojalata 4 Litros Litografiada Colorear', category: 'envase', unit: 'unidad', currentStock: 1400, minStock: 400, unitCost: 1950, supplierName: 'Metalgráfica Centro', updatedAt: new Date().toISOString() },
      { id: 'rm-12', code: 'MP-ENV-01', name: 'Lata Hojalata 1 Litro Litografiada Colorear', category: 'envase', unit: 'unidad', currentStock: 2100, minStock: 500, unitCost: 1100, supplierName: 'Metalgráfica Centro', updatedAt: new Date().toISOString() },
      { id: 'rm-13', code: 'MP-SOL-01', name: 'Aguarrás Mineral Desodorizado', category: 'solvente', unit: 'litro', currentStock: 2900, minStock: 600, unitCost: 2100, supplierName: 'Solventes Petroquímica', updatedAt: new Date().toISOString() }
    ];

    initialRawMaterials.forEach(rm => {
      batch.set(doc(db, 'raw_materials', rm.id), rm);
    });

    // Master Formulas (Base 100 kg)
    const initialFormulas: Formula[] = [
      {
        id: 'form-latex-int',
        code: 'FOR-LAT-01',
        name: 'Látex Interior Lavable Mate Premium (Base 100 kg)',
        paintType: 'Látex Interior',
        density: 1.38,
        theoreticalCostPerKg: 1845.5,
        baseQuantity: 100,
        notes: 'Fórmula balanceada con excelente poder cubritivo y lavabilidad. Molienda en dispersor rápido a 1800 rpm.',
        createdAt: new Date().toISOString(),
        items: [
          { rawMaterialId: 'rm-1', rawMaterialName: 'Resina Acrílica Estirenada (50% Sólidos)', percentageOrKg: 22, unit: 'kg' },
          { rawMaterialId: 'rm-2', rawMaterialName: 'Dióxido de Titanio R-902 (Blanco puro)', percentageOrKg: 14, unit: 'kg' },
          { rawMaterialId: 'rm-3', rawMaterialName: 'Carbonato de Calcio Micronizado (Malla 400)', percentageOrKg: 28, unit: 'kg' },
          { rawMaterialId: 'rm-4', rawMaterialName: 'Caolín Calcinado Superblanco', percentageOrKg: 6, unit: 'kg' },
          { rawMaterialId: 'rm-5', rawMaterialName: 'Dispersante Policarboxilato Sódico', percentageOrKg: 0.8, unit: 'kg' },
          { rawMaterialId: 'rm-6', rawMaterialName: 'Antiespumante Mineral Base Silicón', percentageOrKg: 0.4, unit: 'kg' },
          { rawMaterialId: 'rm-7', rawMaterialName: 'Espesante Celulósico HEC (Alta viscosidad)', percentageOrKg: 0.6, unit: 'kg' },
          { rawMaterialId: 'rm-8', rawMaterialName: 'Biocida Isotiazolinona (In-can)', percentageOrKg: 0.2, unit: 'kg' }
        ]
      },
      {
        id: 'form-latex-ext',
        code: 'FOR-LAT-02',
        name: 'Impermeabilizante Frentes y Muros Exterior (Base 100 kg)',
        paintType: 'Impermeabilizante Exterior',
        density: 1.34,
        theoreticalCostPerKg: 2190.0,
        baseQuantity: 100,
        notes: 'Película elástica hidro-repelente con filtro UV y aditivo anti-hongos reforzado.',
        createdAt: new Date().toISOString(),
        items: [
          { rawMaterialId: 'rm-1', rawMaterialName: 'Resina Acrílica Estirenada (50% Sólidos)', percentageOrKg: 32, unit: 'kg' },
          { rawMaterialId: 'rm-2', rawMaterialName: 'Dióxido de Titanio R-902 (Blanco puro)', percentageOrKg: 16, unit: 'kg' },
          { rawMaterialId: 'rm-3', rawMaterialName: 'Carbonato de Calcio Micronizado (Malla 400)', percentageOrKg: 22, unit: 'kg' },
          { rawMaterialId: 'rm-5', rawMaterialName: 'Dispersante Policarboxilato Sódico', percentageOrKg: 0.9, unit: 'kg' },
          { rawMaterialId: 'rm-6', rawMaterialName: 'Antiespumante Mineral Base Silicón', percentageOrKg: 0.5, unit: 'kg' },
          { rawMaterialId: 'rm-7', rawMaterialName: 'Espesante Celulósico HEC (Alta viscosidad)', percentageOrKg: 0.7, unit: 'kg' },
          { rawMaterialId: 'rm-8', rawMaterialName: 'Biocida Isotiazolinona (In-can)', percentageOrKg: 0.3, unit: 'kg' }
        ]
      },
      {
        id: 'form-membrana',
        code: 'FOR-MEM-01',
        name: 'Membrana en Pasta Poliuretánica Fibrada (Base 100 kg)',
        paintType: 'Membrana Líquida',
        density: 1.30,
        theoreticalCostPerKg: 2420.0,
        baseQuantity: 100,
        notes: 'Para techos y terrazas transitables con microfibras incorporadas.',
        createdAt: new Date().toISOString(),
        items: [
          { rawMaterialId: 'rm-1', rawMaterialName: 'Resina Acrílica Estirenada (50% Sólidos)', percentageOrKg: 38, unit: 'kg' },
          { rawMaterialId: 'rm-2', rawMaterialName: 'Dióxido de Titanio R-902 (Blanco puro)', percentageOrKg: 10, unit: 'kg' },
          { rawMaterialId: 'rm-3', rawMaterialName: 'Carbonato de Calcio Micronizado (Malla 400)', percentageOrKg: 25, unit: 'kg' },
          { rawMaterialId: 'rm-5', rawMaterialName: 'Dispersante Policarboxilato Sódico', percentageOrKg: 0.7, unit: 'kg' },
          { rawMaterialId: 'rm-6', rawMaterialName: 'Antiespumante Mineral Base Silicón', percentageOrKg: 0.6, unit: 'kg' },
          { rawMaterialId: 'rm-7', rawMaterialName: 'Espesante Celulósico HEC (Alta viscosidad)', percentageOrKg: 0.9, unit: 'kg' }
        ]
      }
    ];

    initialFormulas.forEach(f => {
      batch.set(doc(db, 'formulas', f.id), f);
    });

    // Finished Products Catalog: Official Colorear Pinturas Agosto 2026 list with 2-letter + 4-digit SKU codes
    const initialProducts = generateColorearProducts();

    initialProducts.forEach(p => {
      batch.set(doc(db, 'products', p.id), p);
    });

    // Transports / Logistics Carriers
    const initialTransports: Transport[] = [
      { id: 'trans-1', name: 'Expreso Cruz del Sur', contactName: 'Mariano Varela', phone: '+54 11 4987-6543', serviceArea: 'Buenos Aires, CABA, Patagonia, Cuyo', vehicleType: 'Semirremolques térmicos y paqueteros', capacityKg: 28000, address: 'Av. Amancio Alcorta 3100, CABA', active: true },
      { id: 'trans-2', name: 'Transportes La Sevillanita', contactName: 'Gustavo Benítez', phone: '+54 381 452-9800', serviceArea: 'Tucumán, Salta, Jujuy, Santiago del Estero, Córdoba', vehicleType: 'Tractor con acoplado sider', capacityKg: 26000, address: 'Ruta 9 Km 1290, Tucumán', active: true },
      { id: 'trans-3', name: 'Camión Fábrica Colorear #1 (Mercedes Benz Atego)', contactName: 'Roberto Gómez (Chofer planta)', phone: '+54 11 5566-7788', serviceArea: 'Gran Buenos Aires, Rosario, La Plata (Entregas directas)', vehicleType: 'Chasis playo con barandas fijas', capacityKg: 9500, address: 'Base Planta Industrial Colorear', active: true },
      { id: 'trans-4', name: 'Logística Andreani Distribución', contactName: 'Centro Operativo Express', phone: '+54 11 4890-2000', serviceArea: 'Cobertura nacional puerta a puerta', vehicleType: 'Furgones y utilitarios medianos', capacityKg: 3500, address: 'Polo Industrial Norlog, Tigre', active: true }
    ];

    initialTransports.forEach(t => {
      batch.set(doc(db, 'transports', t.id), t);
    });

    // Customers (with DNI/CUIT for Portal Access)
    const initialCustomers: Customer[] = [
      {
        id: 'cust-1',
        taxId: '30-71234567-9',
        businessName: 'Pinturerías del Centro S.R.L.',
        tradeName: 'Pinturerías Centro (3 Sucursales)',
        taxCategory: 'responsable_inscripto',
        email: 'compras@pintureriascentro.com.ar',
        phone: '+54 11 4321-7890',
        address: 'Av. Corrientes 4520',
        city: 'CABA',
        province: 'Buenos Aires',
        transportId: 'trans-3',
        transportName: 'Camión Fábrica Colorear #1 (Mercedes Benz Atego)',
        priceList: 'distribuidor',
        creditLimit: 3500000,
        currentBalance: 785000, // Owes 785.000
        status: 'activo'
      },
      {
        id: 'cust-2',
        taxId: '30-68912345-4',
        businessName: 'Ferretería Industrial Norte S.A.',
        tradeName: 'Ferretería del Norte',
        taxCategory: 'responsable_inscripto',
        email: 'administracion@ferreterianorte.com.ar',
        phone: '+54 341 489-1122',
        address: 'Bv. Oroño 2850',
        city: 'Rosario',
        province: 'Santa Fe',
        transportId: 'trans-1',
        transportName: 'Expreso Cruz del Sur',
        priceList: 'mayorista',
        creditLimit: 2000000,
        currentBalance: 340000,
        status: 'activo'
      },
      {
        id: 'cust-3',
        taxId: '20-28945612-8',
        businessName: 'Carlos Alberto Rodríguez (Pintor & Contratista)',
        tradeName: 'Rodríguez Obras & Revestimientos',
        taxCategory: 'monotributo',
        email: 'carlosrodriguezpinturas@gmail.com',
        phone: '+54 11 6789-0123',
        address: 'Calle Mitre 845',
        city: 'San Martín',
        province: 'Buenos Aires',
        transportId: 'trans-3',
        transportName: 'Camión Fábrica Colorear #1 (Mercedes Benz Atego)',
        priceList: 'minorista',
        creditLimit: 500000,
        currentBalance: 0,
        status: 'activo'
      },
      {
        id: 'cust-4',
        taxId: '33-54321987-9',
        businessName: 'Constructora del Sur S.A.',
        tradeName: 'Edificios del Plata',
        taxCategory: 'responsable_inscripto',
        email: 'obras@constructoradelsur.com.ar',
        phone: '+54 223 456-7890',
        address: 'Av. Colón 1920',
        city: 'Mar del Plata',
        province: 'Buenos Aires',
        transportId: 'trans-1',
        transportName: 'Expreso Cruz del Sur',
        priceList: 'distribuidor',
        creditLimit: 5000000,
        currentBalance: 1250000,
        status: 'activo'
      }
    ];

    initialCustomers.forEach(c => {
      batch.set(doc(db, 'customers', c.id), c);
    });

    // Suppliers
    const initialSuppliers: Supplier[] = [
      { 
        id: 'sup-1', 
        businessName: 'Química del Plata S.A.', 
        taxId: '30-55112233-4', 
        email: 'ventas@quimicadelplata.com.ar', 
        phone: '+54 11 4755-1234', 
        category: 'Resinas sintéticas y solventes', 
        paymentTerms: '30 días F.F.',
        discountPercentage: 10,
        discountConcept: 'Descuento comercial por compras superiores a 1.000 kg',
        currentBalance: 950000
      },
      { 
        id: 'sup-2', 
        businessName: 'Pigmentos Industriales S.R.L.', 
        taxId: '30-66223344-5', 
        email: 'contacto@pigmentosind.com.ar', 
        phone: '+54 11 4200-9876', 
        category: 'Dióxidos y óxidos de hierro', 
        paymentTerms: 'Cheques 30/60',
        discountPercentage: 5,
        discountConcept: 'Bonificación por pronto pago 15 días',
        currentBalance: 720000
      },
      { 
        id: 'sup-3', 
        businessName: 'Minerales Cordillera', 
        taxId: '30-77334455-6', 
        email: 'pedidos@mineralescordillera.com.ar', 
        phone: '+54 264 423-4567', 
        category: 'Carbonatos, caolines y talcos', 
        paymentTerms: 'Transferencia 15 días',
        discountPercentage: 8,
        discountConcept: 'Descuento por carga completa de camión tolva',
        currentBalance: 480000
      },
      { 
        id: 'sup-4', 
        businessName: 'Envases Plásticos del Sol', 
        taxId: '30-88445566-7', 
        email: 'ventas@envasesdelsol.com.ar', 
        phone: '+54 11 4455-6677', 
        category: 'Baldes plásticos 10L y 20L', 
        paymentTerms: 'Contra entrega',
        discountPercentage: 7,
        discountConcept: 'Descuento directo por compra de pallet completo',
        currentBalance: 310000
      }
    ];

    initialSuppliers.forEach(s => {
      batch.set(doc(db, 'suppliers', s.id), s);
    });

    // Active Production Order
    const initialProductionOrders: ProductionOrder[] = [
      {
        id: 'po-1',
        orderNumber: 'OP-2026-0042',
        formulaId: 'form-latex-int',
        productName: 'Látex Interior Colorear Mate Blanco',
        batchNumber: 'LOT-2026-0042',
        partidaNumber: 'PAR-2610-042',
        manufacturingTank: 'Dispersor Cowles #1 (2.000 L)',
        manufacturingDate: '2026-10-22',
        expirationDate: '2028-10-22',
        viscosityKU: 102,
        densityReal: 1.38,
        ph: 8.8,
        qcStatus: 'aprobado',
        qcInspector: 'Bioq. Laura Méndez (Control Calidad)',
        targetKg: 1000,
        packagingType: 'balde_20l',
        packageCount: 36, // ~27.6 kg per 20L bucket with density 1.38
        status: 'en_proceso',
        materialCost: 1845500,
        operatorName: 'Martín Ibarra (Jefe Planta)',
        notes: 'Molienda fina comprobada en Hegman grado 6. Pase a tina de envasado completado.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'po-2',
        orderNumber: 'OP-2026-0041',
        formulaId: 'form-latex-ext',
        productName: 'Impermeabilizante Frentes Colorear Máxima Protección',
        batchNumber: 'LOT-2026-0041',
        partidaNumber: 'PAR-2610-041',
        manufacturingTank: 'Dispersor Cowles #2 (1.000 L)',
        manufacturingDate: '2026-10-20',
        expirationDate: '2028-10-20',
        viscosityKU: 104,
        densityReal: 1.34,
        ph: 8.9,
        qcStatus: 'aprobado',
        qcInspector: 'Bioq. Laura Méndez (Control Calidad)',
        targetKg: 2000,
        packagingType: 'balde_20l',
        packageCount: 74,
        status: 'completada',
        materialCost: 4380000,
        operatorName: 'Carlos Vega',
        notes: 'Producción finalizada exitosamente. Control de calidad aprobado (Viscosidad Krebs 104 KU, pH 8.9).',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];

    initialProductionOrders.forEach(po => {
      batch.set(doc(db, 'production_orders', po.id), po);
    });

    // Sample Sales Orders (spanning the order lifecycle: Remito, Preparado, Facturación ARCA/no-ARCA, Despacho)
    const initialSalesOrders: SalesOrder[] = [
      {
        id: 'order-101',
        orderNumber: 'PED-2026-089',
        customerId: 'cust-1',
        customerName: 'Pinturerías del Centro S.R.L.',
        customerTaxId: '30-71234567-9',
        customerPhone: '+54 11 4321-7890',
        customerEmail: 'compras@pintureriascentro.com.ar',
        customerAddress: 'Av. Corrientes 4520, CABA',
        billingType: 'arca',
        invoiceType: 'FACTURA_A',
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'despachado',
        paymentStatus: 'pendiente',
        transportId: 'trans-3',
        transportName: 'Camión Fábrica Colorear #1 (Mercedes Benz Atego)',
        trackingCode: 'TRK-COL-2026-789',
        remitoNumber: 'REM-R0001-00001842',
        remitoDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        invoiceNumber: 'FAC-A-0004-00000912',
        cae: '74128956321458',
        caeVto: '2026-10-30',
        items: [
          { productId: 'prod-1', productName: 'Látex Interior Colorear Mate Blanco 20L', code: 'COL-LAT-20', presentation: '20 Litros', quantity: 15, unitPrice: 42500, discount: 0, subtotal: 637500 },
          { productId: 'prod-4', productName: 'Impermeabilizante Frentes Colorear 20L', code: 'COL-EXT-20', presentation: '20 Litros', quantity: 10, unitPrice: 51800, discount: 0, subtotal: 518000 }
        ],
        subtotal: 1155500,
        taxAmount: 242655, // 21% IVA
        total: 1398155,
        paidAmount: 613155,
        notes: 'Entrega en depósito central antes de las 14:00 hs.'
      },
      {
        id: 'order-102',
        orderNumber: 'PED-2026-090',
        customerId: 'cust-2',
        customerName: 'Ferretería Industrial Norte S.A.',
        customerTaxId: '30-68912345-4',
        customerPhone: '+54 341 489-1122',
        customerEmail: 'administracion@ferreterianorte.com.ar',
        customerAddress: 'Bv. Oroño 2850, Rosario, Santa Fe',
        billingType: 'arca',
        invoiceType: 'FACTURA_A',
        date: new Date().toISOString(),
        status: 'preparando_remito',
        paymentStatus: 'pendiente',
        transportId: 'trans-1',
        transportName: 'Expreso Cruz del Sur',
        trackingCode: 'TRK-CDS-992144',
        remitoNumber: 'REM-R0001-00001843',
        remitoDate: new Date().toISOString(),
        items: [
          { productId: 'prod-7', productName: 'Esmalte Sintético 3 en 1 Colorear 4L', code: 'COL-ESM-04', presentation: '4 Litros', quantity: 20, unitPrice: 22800, discount: 5, subtotal: 433200 },
          { productId: 'prod-6', productName: 'Membrana en Pasta Fibrada Colorear 20L', code: 'COL-MEM-20', presentation: '20 Litros', quantity: 6, unitPrice: 64900, discount: 0, subtotal: 389400 }
        ],
        subtotal: 822600,
        taxAmount: 172746,
        total: 995346,
        paidAmount: 0,
        notes: 'Cargar paletizado y flejado para expreso.'
      },
      {
        id: 'order-103',
        orderNumber: 'PED-2026-091',
        customerId: 'cust-3',
        customerName: 'Carlos Alberto Rodríguez (Pintor & Contratista)',
        customerTaxId: '20-28945612-8',
        customerPhone: '+54 11 6789-0123',
        customerEmail: 'carlosrodriguezpinturas@gmail.com',
        customerAddress: 'Calle Mitre 845, San Martín',
        billingType: 'no_arca', // Venta interna no fiscal
        invoiceType: 'RECIBO_X_NO_ARCA',
        date: new Date().toISOString(),
        status: 'ingresado',
        paymentStatus: 'pagado',
        transportId: 'trans-3',
        transportName: 'Camión Fábrica Colorear #1',
        trackingCode: 'TRK-COL-2026-791',
        items: [
          { productId: 'prod-1', productName: 'Látex Interior Colorear Mate Blanco 20L', code: 'COL-LAT-20', presentation: '20 Litros', quantity: 4, unitPrice: 69800, discount: 10, subtotal: 251280 }
        ],
        subtotal: 251280,
        taxAmount: 0,
        total: 251280,
        paidAmount: 251280,
        notes: 'Abona por transferencia bancaria anticipada. Retira personal de obra.'
      }
    ];

    initialSalesOrders.forEach(so => {
      batch.set(doc(db, 'sales_orders', so.id), so);
    });

    // Initial Inventory Movements (Kardex)
    const initialMovements: InventoryMovement[] = [
      {
        id: 'mov-1',
        itemType: 'raw_material',
        itemId: 'rm-1',
        itemName: 'Resina Acrílica Estirenada (50% Sólidos)',
        movementType: 'entrada_compra',
        quantity: 2000,
        unit: 'kg',
        reference: 'RECEP-OC-2026-015',
        user: 'Administración Compras',
        date: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'mov-2',
        itemType: 'raw_material',
        itemId: 'rm-1',
        itemName: 'Resina Acrílica Estirenada (50% Sólidos)',
        movementType: 'salida_produccion',
        quantity: -640,
        unit: 'kg',
        reference: 'OP-2026-0041',
        user: 'Operador Planta',
        date: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'mov-3',
        itemType: 'product',
        itemId: 'prod-4',
        itemName: 'Impermeabilizante Frentes Colorear Máxima Protección 20L',
        movementType: 'entrada_produccion',
        quantity: 74,
        unit: 'baldes',
        reference: 'OP-2026-0041',
        user: 'Jefe Planta',
        date: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];

    initialMovements.forEach(m => {
      batch.set(doc(db, 'inventory_movements', m.id), m);
    });

    // Initial Notifications
    const initialNotifications: NotificationItem[] = [
      {
        id: 'notif-1',
        title: 'Pago pendiente vencido',
        message: 'Pinturerías del Centro S.R.L. registra un saldo vencido de $785.000 (Factura FAC-A-0004-00000912).',
        type: 'pago_pendiente',
        targetEntityId: 'cust-1',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        actionUrl: 'customers'
      },
      {
        id: 'notif-2',
        title: 'Pedido listo para entrega',
        message: 'El pedido PED-2026-090 de Ferretería Industrial Norte tiene el remito preparado y está listo para retiro por Cruz del Sur.',
        type: 'pedido_listo',
        targetEntityId: 'order-102',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        actionUrl: 'sales'
      },
      {
        id: 'notif-3',
        title: 'Lote de producción en proceso',
        message: 'Orden OP-2026-0042 (1.000 kg Látex Interior) pasó a fase de envasado en baldes de 20L.',
        type: 'produccion_progreso',
        targetEntityId: 'po-1',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        actionUrl: 'production'
      },
      {
        id: 'notif-4',
        title: 'Despacho en viaje',
        message: 'El camión de fábrica inició el reparto hacia depósito CABA para la orden PED-2026-089.',
        type: 'despacho_en_camino',
        targetEntityId: 'order-101',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        actionUrl: 'logistics'
      }
    ];

    initialNotifications.forEach(n => {
      batch.set(doc(db, 'notifications', n.id), n);
    });

    // Financial Transactions (Daily Cash Flow)
    const initialTransactions: FinancialTransaction[] = [
      { id: 'tx-1', type: 'cobro_cliente', direction: 'ingreso', amount: 613155, date: new Date().toISOString(), entityId: 'cust-1', entityName: 'Pinturerías del Centro S.R.L.', paymentMethod: 'transferencia', concept: 'Cobro parcial pedido PED-2026-089', receiptNumber: 'REC-0001-000412' },
      { id: 'tx-2', type: 'pago_proveedor', direction: 'egreso', amount: 950000, date: new Date(Date.now() - 86400000).toISOString(), entityId: 'sup-1', entityName: 'Química del Plata S.A.', paymentMethod: 'echeq', concept: 'Pago factura resina acrílica F-4890', receiptNumber: 'OP-PAG-912' },
      { id: 'tx-3', type: 'cobro_cliente', direction: 'ingreso', amount: 251280, date: new Date().toISOString(), entityId: 'cust-3', entityName: 'Carlos Alberto Rodríguez', paymentMethod: 'transferencia', concept: 'Cobro contado orden PED-2026-091', receiptNumber: 'REC-0001-000413' },
      { id: 'tx-4', type: 'gasto_operativo', direction: 'egreso', amount: 180000, date: new Date(Date.now() - 86400000 * 2).toISOString(), entityName: 'Mantenimiento Electromecánico', paymentMethod: 'transferencia', concept: 'Servicio técnico preventivo dispersor industrial #2' }
    ];

    initialTransactions.forEach(tx => {
      batch.set(doc(db, 'financial_transactions', tx.id), tx);
    });

    // Company Configuration & ARCA Parameters
    const initialConfig: CompanyConfig = {
      id: 'main_config',
      companyName: 'Colorear Pinturas S.R.L.',
      tradeName: 'Colorear PINTURAS',
      logoUrl: '/assets/aistudio/colorear-500px_0158e3cb.webp',
      cuit: '30-71489234-8',
      arcaPointOfSale: 4,
      arcaEnvironment: 'homologacion', // o produccion
      grossIncomeNumber: '901-294812-3',
      activityStartDate: '01/03/2012',
      fiscalAddress: 'Av. Industria Química 4520, Parque Industrial Pilar, Buenos Aires',
      plantAddress: 'Ruta 8 Km 58, Parque Industrial Pilar, Buenos Aires',
      phone: '+54 11 4890-7000',
      whatsappNumber: '5491148907000',
      email: 'administracion@colorearpinturas.com.ar',
      notificationWhatsappTemplate: 'Hola {cliente}, le informamos desde Colorear Pinturas que su pedido {pedido} se encuentra {estado}. Transporte asignado: {transporte}. Seguimiento: {tracking}. Muchas gracias.',
      paymentReminderTemplate: 'Estimado/a {cliente}, le recordamos desde el área de administración de Colorear Pinturas que registra un saldo pendiente de ${monto}. Agradecemos coordinar la cancelación correspondiente. Datos de cuenta CBU: 0720045620000012345678.'
    };

    batch.set(doc(db, 'company_config', 'main_config'), initialConfig);

    await batch.commit();
    console.log('Colorear Pinturas database initialized successfully with complete paint factory dataset.');
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

export const INITIAL_FACTORY_USERS: AppUser[] = [
  {
    id: 'user-creador',
    name: 'Creador del Sistema / Master Owner',
    email: 'creador@colorearpinturas.com.ar',
    role: 'creador',
    roleLabel: 'Creador & Dueño Absoluto del Sistema',
    password: 'mastercreator',
    avatarColor: '#4f46e5',
    active: true,
    phone: '+54 11 9999-0000',
    allowedModules: [
      'desktop', 'production', 'sales', 'sellers', 'prices', 'customers',
      'installments', 'loyalty', 'checks', 'cashboxes', 'arca_fiscal',
      'accounting', 'profitability', 'employees', 'logistics', 'purchases',
      'finances', 'reports', 'customer_portal', 'ai_assistant', 'settings', 'users'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-admin',
    name: 'Carlos Rossi',
    email: 'admin@colorearpinturas.com.ar',
    role: 'admin',
    roleLabel: 'Gerente General & Admin',
    password: 'admin',
    avatarColor: '#d31627',
    active: true,
    phone: '+54 11 4890-7001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-prod',
    name: 'Ing. Martín Valenzuela',
    email: 'produccion@colorearpinturas.com.ar',
    role: 'produccion',
    roleLabel: 'Jefe de Planta & Fórmulas',
    password: 'planta',
    avatarColor: '#ea580c',
    active: true,
    phone: '+54 11 4890-7002',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-ventas',
    name: 'Florencia Gómez',
    email: 'ventas@colorearpinturas.com.ar',
    role: 'ventas',
    roleLabel: 'Ventas, Pedidos & ARCA',
    password: 'ventas',
    avatarColor: '#0284c7',
    active: true,
    phone: '+54 11 4890-7003',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-logistica',
    name: 'Roberto Méndez',
    email: 'logistica@colorearpinturas.com.ar',
    role: 'logistica',
    roleLabel: 'Logística & Despachos',
    password: 'chofer',
    avatarColor: '#16a34a',
    active: true,
    phone: '+54 11 4890-7004',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-finanzas',
    name: 'Mariana Benítez',
    email: 'finanzas@colorearpinturas.com.ar',
    role: 'finanzas',
    roleLabel: 'Cuentas Corrientes & Finanzas',
    password: 'finanzas',
    avatarColor: '#7c3aed',
    active: true,
    phone: '+54 11 4890-7005',
    createdAt: new Date().toISOString()
  }
];

export async function seedUsersIfEmpty(): Promise<AppUser[]> {
  try {
    const userSnap = await getDocs(collection(db, 'app_users'));
    if (!userSnap.empty) {
      const existing = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
      // Ensure creator user exists in database
      const hasCreator = existing.some(u => u.role === 'creador' || u.id === 'user-creador');
      if (!hasCreator) {
        const creatorUser = INITIAL_FACTORY_USERS[0];
        await setDoc(doc(db, 'app_users', creatorUser.id), creatorUser);
        return [creatorUser, ...existing];
      }
      return existing;
    }
    const batch = writeBatch(db);
    INITIAL_FACTORY_USERS.forEach(u => {
      batch.set(doc(db, 'app_users', u.id), u);
    });
    await batch.commit();
    return INITIAL_FACTORY_USERS;
  } catch (e) {
    console.warn("Could not seed users from firestore, using local defaults:", e);
    return INITIAL_FACTORY_USERS;
  }
}

// Function to synchronize or update all 170+ items from the official Colorear Pinturas Agosto 2026 price list with SKUs
export async function syncOfficialAugust2026PriceList(): Promise<Product[]> {
  const products = generateColorearProducts();
  const batch = writeBatch(db);

  products.forEach(p => {
    batch.set(doc(db, 'products', p.id), p);
  });

  await batch.commit();
  console.log(`Synchronized ${products.length} official Colorear Pinturas products with SKU codes.`);
  return products;
}

// Initial cashboxes, checks portfolio and employees for the factory
export async function seedFinanceAndStaffIfEmpty() {
  try {
    const boxSnap = await getDocs(collection(db, 'cashboxes'));
    if (!boxSnap.empty) return; // already seeded

    const batch = writeBatch(db);

    // Initial Cashboxes
    const initialCashboxes: Cashbox[] = [
      {
        id: 'box-planta',
        name: 'Caja Mostrador Planta (Efectivo)',
        type: 'efectivo',
        currency: 'ARS',
        currentBalance: 840000,
        responsiblePerson: 'Tesorería Planta',
        isDefault: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'box-galicia',
        name: 'Banco Galicia Cta. Cte. Operativa',
        type: 'banco',
        currency: 'ARS',
        currentBalance: 5820000,
        accountNumberOrCbu: '0720045620000012345678',
        bankName: 'Banco Galicia',
        responsiblePerson: 'Administración & Finanzas',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'box-fuerte',
        name: 'Caja Fuerte / Tesorería Central',
        type: 'efectivo',
        currency: 'ARS',
        currentBalance: 2450000,
        responsiblePerson: 'Gerencia General',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'box-mp',
        name: 'Mercado Pago Cobros Digitales',
        type: 'digital',
        currency: 'ARS',
        currentBalance: 615000,
        responsiblePerson: 'Ventas Web',
        updatedAt: new Date().toISOString()
      }
    ];

    initialCashboxes.forEach(b => batch.set(doc(db, 'cashboxes', b.id), b));

    // Initial Checks in Portfolio
    const initialChecks: CheckItem[] = [
      {
        id: 'chk-1',
        checkNumber: '89104820',
        type: 'echeq',
        bankName: 'Banco Santander',
        issuerTaxId: '30-71829401-2',
        issuerName: 'Pinturerías Rex S.A.',
        amount: 850000,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // In 2 days!
        status: 'en_cartera',
        receivedFromType: 'cliente',
        customerName: 'Pinturerías Rex S.A.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'chk-2',
        checkNumber: '44910283',
        type: 'cheque_fisico',
        bankName: 'Banco Macro',
        issuerTaxId: '30-68912345-4',
        issuerName: 'Ferretería Industrial Norte S.A.',
        amount: 620000,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // In 5 days!
        status: 'en_cartera',
        receivedFromType: 'cliente',
        customerName: 'Ferretería Industrial Norte S.A.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'chk-3',
        checkNumber: '77291038',
        type: 'echeq',
        bankName: 'Banco BBVA',
        issuerTaxId: '20-28945612-8',
        issuerName: 'Pinturas del Centro S.R.L.',
        amount: 1150000,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'en_cartera',
        receivedFromType: 'cliente',
        customerName: 'Pinturas del Centro S.R.L.',
        createdAt: new Date().toISOString()
      }
    ];

    initialChecks.forEach(c => batch.set(doc(db, 'checks', c.id), c));

    // Initial Employees
    const initialEmployees: Employee[] = [
      {
        id: 'emp-1',
        cuil: '20-33491823-9',
        firstName: 'Matías',
        lastName: 'Ríos',
        fullName: 'Ríos, Matías',
        sector: 'dispersion_fabricacion',
        position: 'Maquinista de Dispersión Rápida',
        hireDate: '2021-03-15',
        phone: '+54 11 5829-3321',
        email: 'mrios@colorearpinturas.com.ar',
        address: 'Calle 14 Nº 842',
        city: 'Pilar',
        contractType: 'mensualizado',
        baseSalary: 920000,
        bankName: 'Banco Provincia',
        cbuOrAlias: '0140028103502918294812',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'emp-2',
        cuil: '27-36892145-4',
        firstName: 'Valeria',
        lastName: 'Gómez',
        fullName: 'Gómez, Valeria',
        sector: 'control_calidad_laboratorio',
        position: 'Técnica Química / Control Calidad',
        hireDate: '2022-06-01',
        phone: '+54 11 6492-8172',
        email: 'vgomez@colorearpinturas.com.ar',
        address: 'Av. Tratado del Pilar 450',
        city: 'Pilar',
        contractType: 'mensualizado',
        baseSalary: 1050000,
        bankName: 'Banco Galicia',
        cbuOrAlias: '0720045688000039281729',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'emp-3',
        cuil: '20-29481723-5',
        firstName: 'Esteban',
        lastName: 'Fernández',
        fullName: 'Fernández, Esteban',
        sector: 'logistica_chofer',
        position: 'Chofer Reparto Fábrica / Logística',
        hireDate: '2020-09-10',
        phone: '+54 11 4910-8273',
        email: 'efernandez@colorearpinturas.com.ar',
        address: 'Ruta 8 Km 52',
        city: 'Del Viso',
        contractType: 'mensualizado',
        baseSalary: 880000,
        bankName: 'Banco Nación',
        cbuOrAlias: '0110034291000084920194',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'emp-4',
        cuil: '20-38491029-7',
        firstName: 'Lucas',
        lastName: 'Romero',
        fullName: 'Romero, Lucas',
        sector: 'envasado_fraccionamiento',
        position: 'Operario Envasado y Paletizado Baldes',
        hireDate: '2023-01-15',
        phone: '+54 11 7382-9102',
        email: 'lromero@colorearpinturas.com.ar',
        address: 'Barrio San Alejo 214',
        city: 'Pilar',
        contractType: 'mensualizado',
        baseSalary: 790000,
        bankName: 'Banco Provincia',
        cbuOrAlias: '0140028103502919482710',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];

    initialEmployees.forEach(e => batch.set(doc(db, 'employees', e.id), e));

    await batch.commit();
    console.log("Seeded initial cashboxes, checks, and employees.");
  } catch (err) {
    console.warn("Could not seed initial finance/staff:", err);
  }
}

export async function seedSellersIfEmpty() {
  try {
    const sellersSnap = await getDocs(collection(db, 'sellers'));
    if (!sellersSnap.empty) {
      return;
    }

    const batch = writeBatch(db);

    const initialSellers: Seller[] = [
      {
        id: 'sel-1',
        name: 'Gonzalo Peralta',
        code: 'VEN-01',
        phone: '+54 11 5491-8822',
        email: 'gperalta@colorearpinturas.com.ar',
        zone: 'GBA Norte (San Martín, Caseros, Tigre)',
        dniOrTaxId: '20-33891234-7',
        salesCommissionPct: 3.5,
        collectionCommissionPct: 1.5,
        active: true,
        allowedModules: ['desktop', 'sellers', 'sales', 'customers', 'prices'],
        notes: 'Vendedor senior de calle. Atención a pinturerías y corralones zona norte.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sel-2',
        name: 'Mariana Silveira',
        code: 'VEN-02',
        phone: '+54 11 6392-1144',
        email: 'msilveira@colorearpinturas.com.ar',
        zone: 'CABA Centro & Zona Sur',
        dniOrTaxId: '27-35912443-8',
        salesCommissionPct: 4.0,
        collectionCommissionPct: 2.0,
        active: true,
        allowedModules: ['desktop', 'sellers', 'sales', 'customers', 'prices'],
        notes: 'Preventista de obra y grandes cuentas en CABA y corredor sur.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sel-3',
        name: 'Darío Benítez',
        code: 'VEN-03',
        phone: '+54 341 590-2381',
        email: 'dbenitez@colorearpinturas.com.ar',
        zone: 'Rosario & Litoral',
        dniOrTaxId: '20-31294812-4',
        salesCommissionPct: 3.0,
        collectionCommissionPct: 1.0,
        active: true,
        allowedModules: ['desktop', 'sellers', 'sales', 'customers', 'prices'],
        notes: 'Distribución y nuevos clientes en provincia de Santa Fe.',
        createdAt: new Date().toISOString()
      }
    ];

    initialSellers.forEach(s => batch.set(doc(db, 'sellers', s.id), s));

    // Sample Route Sheets for Street Rep
    const initialRouteSheets: RouteSheet[] = [
      {
        id: 'hdr-1',
        code: 'HDR-2026-001',
        sellerId: 'sel-1',
        sellerName: 'Gonzalo Peralta',
        date: new Date().toISOString().split('T')[0],
        zone: 'GBA Norte',
        title: 'Circuito Preventa San Martín & Caseros',
        status: 'en_progreso',
        totalStops: 4,
        visitedStops: 2,
        totalSalesGenerated: 1155500,
        totalCollectionsGenerated: 450000,
        notes: 'Prioridad de visita a clientes con saldo vencido y toma de pedidos látex 20L.',
        createdAt: new Date().toISOString(),
        stops: [
          {
            id: 'stp-1',
            orderIndex: 1,
            customerId: 'cust-1',
            customerName: 'Pinturerías del Centro S.R.L.',
            customerAddress: 'Av. Corrientes 4520, CABA',
            customerPhone: '+54 11 4321-7890',
            customerCity: 'CABA',
            currentBalance: 785000,
            estimatedTime: '09:30',
            status: 'visitado_con_venta',
            checkInTime: '09:45',
            notes: 'Se tomó pedido comercial de 15 baldes Látex Interior 20L y 10 baldes Impermeabilizante.',
            salesAmount: 1155500,
            latitude: -34.603722,
            longitude: -58.431580,
            accuracyMeters: 8.5,
            geotaggedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
            geotagStatus: 'verificado_gps',
            deviceInfo: 'Preventista Móvil Android / Chrome'
          },
          {
            id: 'stp-2',
            orderIndex: 2,
            customerId: 'cust-3',
            customerName: 'Distribuidora Rex Pinturas',
            customerAddress: 'Av. San Martín 2100, Caseros',
            customerPhone: '+54 11 4750-9988',
            customerCity: 'Caseros',
            currentBalance: 450000,
            estimatedTime: '11:15',
            status: 'visitado_cobranza',
            checkInTime: '11:25',
            notes: 'Se cobró cheque a 15 días por saldo de factura anterior. Recibo entregado.',
            collectedAmount: 450000,
            receiptNumber: 'REC-0001-00012489',
            latitude: -34.604110,
            longitude: -58.563820,
            accuracyMeters: 11.2,
            geotaggedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
            geotagStatus: 'verificado_gps',
            deviceInfo: 'Preventista Móvil Android / Chrome'
          },
          {
            id: 'stp-3',
            orderIndex: 3,
            customerId: 'cust-2',
            customerName: 'Ferretería Industrial Norte S.A.',
            customerAddress: 'Bv. Oroño 2850, Rosario',
            customerPhone: '+54 341 489-1122',
            customerCity: 'Rosario',
            currentBalance: 433200,
            estimatedTime: '14:30',
            status: 'pendiente',
            notes: 'Presentar nueva lista de precios de Agosto y ofrecer esmaltes 3 en 1.'
          },
          {
            id: 'stp-4',
            orderIndex: 4,
            customerId: 'cust-4',
            customerName: 'Corralón & Pinturas El Puente',
            customerAddress: 'Ruta 8 Km 49.5, Pilar',
            customerPhone: '+54 230 442-8811',
            customerCity: 'Pilar',
            currentBalance: 0,
            estimatedTime: '16:00',
            status: 'pendiente',
            notes: 'Reunión con dueño para reactivar cuenta y ofrecer línea obra 20L.'
          }
        ]
      }
    ];

    initialRouteSheets.forEach(h => batch.set(doc(db, 'route_sheets', h.id), h));

    await batch.commit();
    console.log("Seeded initial street sellers and route sheets.");
  } catch (err) {
    console.warn("Could not seed initial sellers/route sheets:", err);
  }
}

// Seed Initial Loyalty, Internal Installments, and Cash Register Sessions if empty
export async function seedLoyaltyAndInstallmentsIfEmpty() {
  try {
    const rewardsSnap = await getDocs(collection(db, 'loyalty_rewards'));
    if (!rewardsSnap.empty) {
      return;
    }

    const batch = writeBatch(db);

    // Initial Loyalty Rewards Catalog
    const initialRewards: LoyaltyReward[] = [
      {
        id: 'rew-1',
        title: 'Pistola de Pintar Eléctrica HVLP 600W',
        description: 'Pistola pulverizadora para látex y esmaltes, boquilla regulable 1.8mm/2.6mm',
        category: 'herramientas',
        pointsCost: 450,
        referencePriceArs: 85000,
        imageUrl: '',
        stock: 8,
        active: true,
        termsAndConditions: 'Canjeable en mostrador o entrega en próximo despacho mayorista.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'rew-2',
        title: 'Kit Profesional Pintor: 3 Rodillos Antigota + Bandeja + Espátulas',
        description: 'Kit de aplicación para obras, rodillos pelo medio 22cm y espátulas de acero inoxidable',
        category: 'herramientas',
        pointsCost: 180,
        referencePriceArs: 32000,
        imageUrl: '',
        stock: 25,
        active: true,
        termsAndConditions: 'Válido para clientes activos sin mora en cuenta.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'rew-3',
        title: 'Chaleco de Trabajo Térmico Colorear Pinturas',
        description: 'Chaleco acolchado institucional con logo bordado, múltiples bolsillos de obra',
        category: 'merchandising',
        pointsCost: 220,
        referencePriceArs: 42000,
        imageUrl: '',
        stock: 15,
        active: true,
        termsAndConditions: 'Talles M, L, XL sujetos a disponibilidad.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'rew-4',
        title: 'Voucher Bonificación 10% en Línea Impermeabilizantes',
        description: 'Cupón de descuento directo sobre la próxima orden de compra de Membrana en Pasta',
        category: 'descuentos',
        pointsCost: 300,
        referencePriceArs: 55000,
        imageUrl: '',
        stock: 50,
        active: true,
        termsAndConditions: 'No acumulable con otras promociones ni financiamientos.',
        createdAt: new Date().toISOString()
      }
    ];
    initialRewards.forEach(r => batch.set(doc(db, 'loyalty_rewards', r.id), r));

    // Initial Loyalty Raffle
    const initialRaffle: LoyaltyRaffle = {
      id: 'raf-1',
      title: 'Gran Sorteo Octubre 2026: Mezcladora Cowles Portátil de Taller',
      prizeDescription: 'Mezclador eléctrico de pinturas y texturados 1400W con 2 varillas helicoidales',
      drawDate: '2026-10-31',
      pointsPerEntry: 25,
      status: 'activo',
      totalEntries: 18
    };
    batch.set(doc(db, 'loyalty_raffles', initialRaffle.id), initialRaffle);

    // Initial Sample Internal Installment Plan
    // REGLA EXACTA: La 1ra cuota vence el día de creación del plan y NO se marca pagada automáticamente.
    const todayStr = new Date().toISOString().split('T')[0];
    const initialPlan: InternalInstallmentPlan = {
      id: 'plan-1',
      planNumber: 'CUO-2026-0001',
      customerId: 'cust-1',
      customerName: 'Pinturerías del Centro SRL',
      customerTaxId: '30-71122334-4',
      customerPhone: '+54 11 4321-5544',
      customerAddress: 'Av. Corrientes 1420, CABA',
      products: [
        {
          productId: 'prod-col-lat-int-20l',
          productName: 'Látex Interior Lavable Antihongo - Balde 20L',
          code: 'LAT-INT-20L',
          quantity: 20,
          unitPrice: 58500, // Precio pactado en el plan
          subtotal: 1170000
        },
        {
          productId: 'prod-col-imp-techo-20l',
          productName: 'Impermeabilizante Techos & Terrazas - Balde 20L',
          code: 'IMP-TECH-20L',
          quantity: 10,
          unitPrice: 79200,
          subtotal: 792000
        }
      ],
      totalProductsAmount: 1962000,
      downPayment: 500000,
      downPaymentPaid: true,
      downPaymentReceipt: 'REC-ANT-2026-004',
      financedAmount: 1462000,
      installmentsCount: 3,
      frequency: 'mensual',
      feeAmount: 487333.33,
      startDate: todayStr,
      status: 'vigente',
      fees: [
        {
          feeNumber: 1,
          dueDate: todayStr, // REGLA: Primera cuota vence el mismo día
          amount: 487333.33,
          status: 'pendiente', // REGLA: NO se marca pagada sola
          notes: 'Cuota inicial de apertura de financiamiento'
        },
        {
          feeNumber: 2,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          amount: 487333.33,
          status: 'pendiente',
          notes: 'Segundo vencimiento mensual'
        },
        {
          feeNumber: 3,
          dueDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
          amount: 487333.34,
          status: 'pendiente',
          notes: 'Cuota de cancelación final'
        }
      ],
      guarantorName: 'Marcelo Rossi',
      guarantorDni: '24.891.022',
      guarantorPhone: '+54 11 5522-8811',
      notes: 'Financiación de fábrica con aval comercial y pagaré firmado.',
      createdBy: 'Administración',
      createdAt: new Date().toISOString()
    };
    batch.set(doc(db, 'internal_installments', initialPlan.id), initialPlan);

    // Initial Cash Register Session (Arqueo de mostrador)
    const initialSession: CashRegisterSession = {
      id: 'reg-session-1',
      sessionNumber: 'REG-2026-0024',
      registerName: 'Caja Mostrador Fábrica #1',
      openedBy: 'Gonzalo Pérez (Ventas)',
      openedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'abierta',
      initialCash: 150000,
      expectedCash: 345000, // Estrictamente ventas con cobro en efectivo
      expectedElectronic: 890000,
      expectedChecks: 450000
    };
    batch.set(doc(db, 'cash_register_sessions', initialSession.id), initialSession);

    // Initial ARCA Electronic Vouchers
    const initialVoucher: ArcaElectronicVoucher = {
      id: 'arc-v-1',
      voucherNumber: '0004-00001892',
      voucherType: 'FACTURA_A',
      pointOfSale: 4,
      date: todayStr,
      customerId: 'cust-1',
      customerName: 'Pinturerías del Centro SRL',
      customerTaxId: '30-71122334-4',
      taxCategory: 'responsable_inscripto',
      netAmount: 955000,
      iva21: 200550,
      total: 1155550,
      cae: '74429103849182',
      caeVto: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      afipQrUrl: 'https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsImZlY2hhIjoiMjAyNi0xMC0yNiIsImN1aXQiOjMwNzExMjIzMzQ0LCJwdG9WdGEiOjQsInRpcG9DbXAiOjEsIm5ybyJDbXAiOjE4OTIsImltcG9ydGUiOjExNTU1NTAsIm1vbmVkYSI6IlBFRyIsImN0eiI6MSwidGlwb0RvY1JlYyI6ODAsIm5yb0RvY1JlYyI6MzA3MTEyMjMzNDQsInRpcG9Db2RpZ29BdXRvcml6YWNpb24iOiJBIiwiY29kaWdvQXV0b3JpemFjaW9uIjo3NDQyOTEwMzg0OTE4Mn0=',
      status: 'autorizado',
      environment: 'produccion',
      associatedOrderId: 'ped-col-001',
      createdAt: new Date().toISOString()
    };
    batch.set(doc(db, 'arca_vouchers', initialVoucher.id), initialVoucher);

    await batch.commit();
    console.log("Seeded initial loyalty, installments, cash sessions, and ARCA vouchers.");
  } catch (err) {
    console.warn("Could not seed loyalty/installments:", err);
  }
}

export async function seedQuotesAndRemitosIfEmpty() {
  try {
    const quotesSnap = await getDocs(collection(db, 'quotes'));
    if (!quotesSnap.empty) return;

    const batch = writeBatch(db);
    const today = new Date().toISOString().split('T')[0];
    const in15Days = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    const initialQuotes: Quote[] = [
      {
        id: 'quote-sample-1',
        quoteNumber: 'PRES-2026-0001',
        date: today,
        validUntil: in15Days,
        customerId: 'cust-1',
        customerName: 'Pinturerías del Centro S.R.L.',
        customerTaxId: '30-71122334-4',
        customerPhone: '+54 11 4321-7890',
        customerEmail: 'compras@pintureriasdelcentro.com.ar',
        customerAddress: 'Av. Corrientes 4520, CABA',
        priceList: 'mayorista',
        paymentCondition: 'Transferencia Bancaria a 15 días',
        items: [
          {
            productId: 'col-latex-int-20l',
            productName: 'Látex Interior Lavable Premium Mate (20L)',
            code: 'L-INT-20L',
            presentation: 'Balde 20L',
            unit: 'Balde 20L',
            quantity: 6,
            unitPrice: 52000,
            discount: 5,
            subtotal: 296400
          },
          {
            productId: 'col-esm-snt-04l',
            productName: 'Esmalte Sintético Triple Acción Brillante (4L)',
            code: 'ESM-SNT-4L',
            presentation: 'Lata 4L',
            unit: 'Lata 4L',
            quantity: 4,
            unitPrice: 28500,
            discount: 0,
            subtotal: 114000
          }
        ],
        subtotal: 410400,
        discountPercentage: 0,
        taxAmount: 86184,
        total: 496584,
        status: 'aprobado',
        notes: 'Precios fijados por 15 días corridos. Entrega en sucursal Balvanera con transporte Expreso.',
        createdBy: 'Ventas Mostrador',
        createdAt: new Date().toISOString()
      },
      {
        id: 'quote-sample-2',
        quoteNumber: 'PRES-2026-0002',
        date: today,
        validUntil: in15Days,
        customerId: 'cust-2',
        customerName: 'Ferretería Industrial Norte S.A.',
        customerTaxId: '30-68994411-9',
        customerPhone: '+54 341 489-1122',
        customerEmail: 'administracion@ferreterianorte.com.ar',
        customerAddress: 'Bv. Oroño 2850, Rosario',
        priceList: 'distribuidor',
        paymentCondition: 'Cheque de pago diferido a 30 días',
        items: [
          {
            productId: 'col-mem-pas-20l',
            productName: 'Membrana en Pasta Fibrada Poliuretánica Techos (20L)',
            code: 'MEM-PAS-20L',
            presentation: 'Balde 20L',
            unit: 'Balde 20L',
            quantity: 12,
            unitPrice: 64000,
            discount: 8,
            subtotal: 706560
          }
        ],
        subtotal: 706560,
        discountPercentage: 0,
        taxAmount: 148377.6,
        total: 854937.6,
        status: 'enviado',
        notes: 'Cotización especial por volumen de obra techos.',
        createdBy: 'Gonzalo Peralta',
        createdAt: new Date().toISOString()
      }
    ];

    initialQuotes.forEach(q => batch.set(doc(db, 'quotes', q.id), q));

    // Sample Standalone Delivery Orders (Remitos)
    const initialRemitos: DeliveryOrder[] = [
      {
        id: 'rem-sample-1',
        deliveryNumber: 'REM-0001-00001920',
        customerId: 'cust-1',
        customerName: 'Pinturerías del Centro S.R.L.',
        customerTaxId: '30-71122334-4',
        customerAddress: 'Av. Corrientes 4520, CABA',
        customerPhone: '+54 11 4321-7890',
        date: today,
        transportName: 'Expreso Pilar Logística',
        driverName: 'Carlos Maidana',
        driverDniOrPlate: 'AF 492 LK - DNI 28.910.421',
        receiverName: 'Juan Carlos Ruiz (Encargado Depósito)',
        receiverDni: '24.119.820',
        items: [
          {
            productId: 'col-latex-int-20l',
            productName: 'Látex Interior Lavable Premium Mate (20L)',
            code: 'L-INT-20L',
            presentation: 'Balde 20L',
            unit: 'Balde 20L',
            quantity: 10,
            unitPrice: 52000,
            subtotal: 520000,
            batchNumber: 'LOT-2026-042',
            partidaNumber: 'PAR-2610-042'
          },
          {
            productId: 'col-esm-snt-04l',
            productName: 'Esmalte Sintético Triple Acción Brillante (4L)',
            code: 'ESM-SNT-4L',
            presentation: 'Lata 4L',
            unit: 'Lata 4L',
            quantity: 5,
            unitPrice: 28500,
            subtotal: 142500,
            batchNumber: 'LOT-2026-039',
            partidaNumber: 'PAR-2610-039'
          }
        ],
        totalAmount: 662500,
        notes: 'Entrega en horario de 08:00 a 14:00 con rampa hidráulica.',
        createdAt: new Date().toISOString()
      }
    ];

    initialRemitos.forEach(r => batch.set(doc(db, 'delivery_orders', r.id), r));

    await batch.commit();
    console.log("Seeded initial quotes and remitos.");
  } catch (err) {
    console.warn("Could not seed quotes and remitos:", err);
  }
}



