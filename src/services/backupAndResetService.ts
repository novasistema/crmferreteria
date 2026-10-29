import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
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
  AppUser,
  CheckItem,
  Cashbox,
  CashMovement,
  Employee,
  SalaryPayment
} from '../types';

export type BackupFrequency = '12_hours' | '24_hours' | '3_days' | '7_days' | 'manual';

export interface BackupMetadata {
  app: string;
  version: string;
  exportedAt: string;
  totalRecords: number;
  collectionCounts: Record<string, number>;
  companyName?: string;
  cuit?: string;
}

export interface BackupDataPayload {
  raw_materials: RawMaterial[];
  formulas: Formula[];
  products: Product[];
  production_orders: ProductionOrder[];
  sales_orders: SalesOrder[];
  customers: Customer[];
  transports: Transport[];
  suppliers: Supplier[];
  purchase_orders: PurchaseOrder[];
  financial_transactions: FinancialTransaction[];
  inventory_movements: InventoryMovement[];
  notifications: NotificationItem[];
  company_config: CompanyConfig[];
  app_users: AppUser[];
  checks: CheckItem[];
  cashboxes: Cashbox[];
  cash_movements: CashMovement[];
  employees: Employee[];
  salary_payments: SalaryPayment[];
}

export interface BackupPackage {
  meta: BackupMetadata;
  data: BackupDataPayload;
}

export interface BackupConfig {
  frequency: BackupFrequency;
  autoDownload: boolean;
  notifyOnDue: boolean;
  lastBackupDate: string | null;
  lastBackupTimestamp: number;
}

const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  frequency: '24_hours',
  autoDownload: true,
  notifyOnDue: true,
  lastBackupDate: null,
  lastBackupTimestamp: 0
};

// Frequency in milliseconds
export const FREQUENCY_MS_MAP: Record<BackupFrequency, number> = {
  '12_hours': 12 * 60 * 60 * 1000,
  '24_hours': 24 * 60 * 60 * 1000,
  '3_days': 3 * 24 * 60 * 60 * 1000,
  '7_days': 7 * 24 * 60 * 60 * 1000,
  'manual': Infinity
};

export const FREQUENCY_LABELS: Record<BackupFrequency, string> = {
  '12_hours': 'Cada 12 Horas (Fábrica activa)',
  '24_hours': 'Diario - Cada 24 Horas (Recomendado)',
  '3_days': 'Cada 3 Días',
  '7_days': 'Semanal - Cada 7 Días',
  'manual': 'Solo Manual (A pedido)'
};

export function getStoredBackupConfig(): BackupConfig {
  try {
    const raw = localStorage.getItem('colorear_backup_config');
    if (raw) {
      return { ...DEFAULT_BACKUP_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Error reading backup config from localStorage", e);
  }
  return DEFAULT_BACKUP_CONFIG;
}

export function saveStoredBackupConfig(config: BackupConfig) {
  try {
    localStorage.setItem('colorear_backup_config', JSON.stringify(config));
  } catch (e) {
    console.error("Error saving backup config to localStorage", e);
  }
}

/**
 * Checks if an automated backup is currently due based on configured frequency
 */
export function isBackupDue(config: BackupConfig): boolean {
  if (config.frequency === 'manual') return false;
  const interval = FREQUENCY_MS_MAP[config.frequency] || 24 * 60 * 60 * 1000;
  if (!config.lastBackupTimestamp || config.lastBackupTimestamp === 0) return true;
  return Date.now() - config.lastBackupTimestamp >= interval;
}

/**
 * Gathers all data across all collections in Firestore and generates a complete JSON backup
 */
export async function createFullBackupSnapshot(companyConfig?: CompanyConfig | null): Promise<BackupPackage> {
  const collectionNames = [
    'raw_materials',
    'formulas',
    'products',
    'production_orders',
    'sales_orders',
    'customers',
    'transports',
    'suppliers',
    'purchase_orders',
    'financial_transactions',
    'inventory_movements',
    'notifications',
    'company_config',
    'app_users',
    'checks',
    'cashboxes',
    'cash_movements',
    'employees',
    'salary_payments'
  ] as const;

  const data: Partial<BackupDataPayload> = {};
  const collectionCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const colName of collectionNames) {
    try {
      const snap = await getDocs(collection(db, colName));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      (data as any)[colName] = items;
      collectionCounts[colName] = items.length;
      totalRecords += items.length;
    } catch (err) {
      console.warn(`Could not read collection ${colName} for backup:`, err);
      (data as any)[colName] = [];
      collectionCounts[colName] = 0;
    }
  }

  const meta: BackupMetadata = {
    app: 'Colorear Pinturas S.R.L. - Sistema de Gestión',
    version: 'Agosto 2026',
    exportedAt: new Date().toISOString(),
    totalRecords,
    collectionCounts,
    companyName: companyConfig?.companyName || 'Colorear Pinturas S.R.L.',
    cuit: companyConfig?.cuit || '30-71489234-8'
  };

  const backupPackage: BackupPackage = {
    meta,
    data: data as BackupDataPayload
  };

  return backupPackage;
}

/**
 * Triggers a file download of the JSON backup in the browser
 */
export function downloadBackupPackage(pkg: BackupPackage): string {
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = `backup_colorear_pinturas_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Update last backup timestamp
  const config = getStoredBackupConfig();
  config.lastBackupDate = now.toLocaleString('es-AR');
  config.lastBackupTimestamp = now.getTime();
  saveStoredBackupConfig(config);

  return fileName;
}

/**
 * Restores a backup package into Firestore using batch writes
 */
export async function restoreBackupPackage(pkg: BackupPackage): Promise<{ success: boolean; restoredCount: number }> {
  if (!pkg.data) {
    throw new Error('El archivo de backup no contiene la estructura requerida.');
  }

  const collections = Object.keys(pkg.data) as (keyof BackupDataPayload)[];
  let restoredCount = 0;

  for (const colName of collections) {
    const items = pkg.data[colName] || [];
    if (!Array.isArray(items) || items.length === 0) continue;

    // Process in batches of 250 to avoid Firestore batch size limits
    const chunkSize = 200;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach(item => {
        if (item && item.id) {
          const ref = doc(db, colName, item.id);
          batch.set(ref, item);
          restoredCount++;
        }
      });

      await batch.commit();
    }
  }

  return { success: true, restoredCount };
}

/**
 * Reset System to Factory (Puesta en Cero)
 * Mode:
 * - 'total': Wipes all operational and master collections to 0 (raw materials, products, orders, customers, finances, movements).
 * - 'operations_only': Keeps master catalogs (products and formulas) but wipes all orders, inventory movements, transactions, and resets customer debts to 0.
 */
export async function resetSystemToFactory(
  mode: 'total' | 'operations_only',
  onProgress?: (message: string) => void
): Promise<{ success: boolean; deletedCount: number }> {
  onProgress?.('Iniciando proceso de reset...');

  const operationalCollections = [
    'sales_orders',
    'production_orders',
    'purchase_orders',
    'financial_transactions',
    'inventory_movements',
    'notifications',
    'checks',
    'cash_movements',
    'salary_payments'
  ];

  const masterCollections = [
    'products',
    'raw_materials',
    'formulas',
    'suppliers',
    'transports',
    'cashboxes',
    'employees'
  ];

  let collectionsToWipe: string[] = [];

  if (mode === 'total') {
    collectionsToWipe = [...operationalCollections, ...masterCollections, 'customers'];
  } else {
    collectionsToWipe = [...operationalCollections];
  }

  let deletedCount = 0;

  for (const colName of collectionsToWipe) {
    onProgress?.(`Vaciando colección: ${colName}...`);
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const chunkSize = 200;
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += chunkSize) {
          const chunk = docs.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach(d => {
            batch.delete(d.ref);
            deletedCount++;
          });
          await batch.commit();
        }
      }
    } catch (err) {
      console.warn(`Error deleting collection ${colName}:`, err);
    }
  }

  // If operations_only, reset customer balances to $0 instead of deleting them
  if (mode === 'operations_only') {
    onProgress?.('Restableciendo saldos de clientes a $0.00...');
    try {
      const custSnap = await getDocs(collection(db, 'customers'));
      if (!custSnap.empty) {
        const batch = writeBatch(db);
        custSnap.docs.forEach(d => {
          batch.update(d.ref, { currentBalance: 0 });
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Error resetting customer balances:', err);
    }
  }

  // Clear local storage desktop customizations if total reset
  if (mode === 'total') {
    try {
      localStorage.removeItem('colorear_portal_client_tax_id');
      localStorage.removeItem('colorear_desktop_shortcuts');
    } catch (e) {
      // ignore
    }
  }

  onProgress?.('¡Sistema restablecido a fábrica con éxito!');
  return { success: true, deletedCount };
}
