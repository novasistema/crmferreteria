import { BusinessProfileId, ModuleKey, SubscriptionPlanId } from '../types';

// Planes de suscripción del sistema. Cada plan incluye los módulos del anterior.
// Producción y recetas de color no dependen del plan sino del tipo de negocio (perfil).
const BASICO: ModuleKey[] = [
  'desktop',
  'reports',
  'sales',
  'prices',
  'inventory',
  'purchases',
  'supplier_orders',
  'purchase_invoices',
  'customers',
  'cashboxes',
  'arca_fiscal',
  'users',
  'settings'
];
const MEDIO: ModuleKey[] = [...BASICO, 'sellers', 'installments', 'loyalty', 'customer_portal', 'checks', 'mobile_mode', 'finances', 'accounting'];
const FULL: ModuleKey[] = [...MEDIO, 'financial_planning', 'profitability', 'tax_accountant', 'employees', 'logistics', 'ai_assistant'];

export interface PlanMeta {
  id: SubscriptionPlanId;
  label: string;
  price: number; // mensual sugerido, más IVA
  maxUsers: number | null; // null = sin límite
  modules: ModuleKey[];
  desc: string;
}

export const PLANS: PlanMeta[] = [
  { id: 'basico', label: 'Básico', price: 69000, maxUsers: 3, modules: BASICO, desc: 'Un local: ventas, stock, compras, cuentas corrientes, caja y ARCA' },
  { id: 'medio', label: 'Medio', price: 119000, maxUsers: 8, modules: MEDIO, desc: 'Suma móvil, portal de clientes, fidelización, cheques, cuotas y vendedores' },
  { id: 'full', label: 'Full', price: 179000, maxUsers: null, modules: FULL, desc: 'Todo: finanzas, contador interno, sueldos, logística y asistente IA' }
];

export const PROFILE_MODULES: Record<BusinessProfileId, ModuleKey[]> = {
  ferreteria: [],
  pintureria: ['color_recipes'],
  fabrica: ['color_recipes', 'production']
};

export const planById = (id?: SubscriptionPlanId) => PLANS.find(p => p.id === id);

// Módulos que quedan prendidos con un plan y un perfil
export const modulesFor = (plan: SubscriptionPlanId, profile: BusinessProfileId): Set<ModuleKey> =>
  new Set<ModuleKey>([...(planById(plan)?.modules || []), ...PROFILE_MODULES[profile]]);

// Usuarios que cuentan para el límite del plan: los activos, sin contar al creador
export const countBillableUsers = (users: { role: string; active: boolean; isDemo?: boolean }[]) =>
  users.filter(u => u.role !== 'creador' && !u.isDemo && u.active !== false).length;
