/**
 * Autenticación para MODO PRODUCCIÓN (ver appMode.ts).
 *
 * - Personal: cuentas de Firebase Auth (email + contraseña). Su perfil vive en
 *   app_users/{uid} (el id del documento ES el uid de Firebase Auth). Las contraseñas
 *   nunca se guardan en Firestore.
 * - Portal de clientes: cada cliente habilitado tiene una cuenta interna de Firebase Auth
 *   (email técnico generado) y un código de acceso de 6 dígitos que le entrega el negocio.
 *   portal_access/{uid} indica a qué cliente pertenece esa cuenta.
 */
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { auth, db, activeFirebaseConfig } from './firebase';
import { AppUser, CompanyConfig, Customer, UserRole } from '../types';

// App secundaria: permite crear cuentas para otros usuarios sin cerrar la sesión actual.
function getSecondaryAuth() {
  const existing = getApps().find(a => a.name === 'altas-usuarios');
  const secondaryApp = existing || initializeApp(activeFirebaseConfig, 'altas-usuarios');
  return getAuth(secondaryApp);
}

export const onlyDigits = (value: string) => (value || '').replace(/[^0-9]/g, '');

export function translateAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Email o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Esperá unos minutos y probá de nuevo.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese email.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sin conexión a internet. Revisá la red y probá de nuevo.';
    case 'auth/operation-not-allowed':
      return 'El acceso con email y contraseña no está habilitado en Firebase (Authentication → Sign-in method).';
    default:
      return 'No se pudo completar la operación. Intentá de nuevo.';
  }
}

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

export type ResolvedSession =
  | { kind: 'staff'; user: AppUser }
  | { kind: 'portal'; customerId: string }
  | { kind: 'denied'; reason: string };

/** Determina qué tipo de usuario es la cuenta que acaba de iniciar sesión. */
export async function resolveSession(firebaseUser: User): Promise<ResolvedSession> {
  const staffSnap = await getDoc(doc(db, 'app_users', firebaseUser.uid));
  if (staffSnap.exists()) {
    const data = { id: staffSnap.id, ...staffSnap.data() } as AppUser;
    if (!data.active) {
      return { kind: 'denied', reason: 'El usuario se encuentra inactivo. Comuníquese con Administración.' };
    }
    updateDoc(doc(db, 'app_users', firebaseUser.uid), { lastLogin: new Date().toISOString() }).catch(() => {});
    return { kind: 'staff', user: data };
  }

  const portalSnap = await getDoc(doc(db, 'portal_access', firebaseUser.uid));
  if (portalSnap.exists()) {
    return { kind: 'portal', customerId: portalSnap.data().customerId as string };
  }

  return { kind: 'denied', reason: 'Esta cuenta no tiene acceso habilitado al sistema.' };
}

export async function loginStaff(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function logoutAndReload(): Promise<void> {
  await signOut(auth).catch(() => {});
  window.location.reload();
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Configuración inicial (primer usuario del sistema)
// ---------------------------------------------------------------------------

export async function isSetupDone(): Promise<boolean> {
  const snap = await getDoc(doc(db, 'system', 'setup'));
  return snap.exists();
}

export interface PublicBranding {
  companyName?: string;
  tradeName?: string;
  logoUrl?: string;
  address?: string;
}

export async function getPublicBranding(): Promise<PublicBranding | null> {
  try {
    const snap = await getDoc(doc(db, 'public_info', 'branding'));
    return snap.exists() ? (snap.data() as PublicBranding) : null;
  } catch {
    return null;
  }
}

/** Datos de la empresa que se pueden ver sin iniciar sesión (logo y nombre en la pantalla de login). */
export async function savePublicBranding(cfg: CompanyConfig): Promise<void> {
  await setDoc(doc(db, 'public_info', 'branding'), {
    companyName: cfg.companyName || '',
    tradeName: cfg.tradeName || '',
    logoUrl: cfg.logoUrl || '',
    address: cfg.plantAddress || cfg.fiscalAddress || ''
  });
}

export async function runInitialSetup(params: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, params.email.trim().toLowerCase(), params.password);
  const uid = cred.user.uid;
  const now = new Date().toISOString();

  const owner: AppUser = {
    id: uid,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    role: 'creador',
    roleLabel: 'Creador del Sistema / Master Owner',
    avatarColor: '#4f46e5',
    active: true,
    createdAt: now
  };

  // Usuario dueño + marca de "sistema configurado" en la misma operación
  const batch = writeBatch(db);
  batch.set(doc(db, 'app_users', uid), owner);
  batch.set(doc(db, 'system', 'setup'), { completedAt: now, ownerUid: uid });
  await batch.commit();

  const companyName = params.companyName.trim();
  const config: CompanyConfig = {
    id: 'main_config',
    companyName,
    tradeName: companyName,
    logoUrl: '',
    cuit: '',
    arcaPointOfSale: 1,
    arcaEnvironment: 'homologacion',
    grossIncomeNumber: '',
    activityStartDate: '',
    fiscalAddress: '',
    plantAddress: '',
    phone: '',
    whatsappNumber: '',
    email: params.email.trim().toLowerCase(),
    notificationWhatsappTemplate: `Hola {cliente}, le informamos desde ${companyName} que su pedido {pedido} se encuentra {estado}. Muchas gracias.`,
    paymentReminderTemplate: `Estimado/a {cliente}, le recordamos desde ${companyName} que registra un saldo pendiente de \${monto}. Muchas gracias.`
  };
  await setDoc(doc(db, 'company_config', 'main_config'), config);
  await savePublicBranding(config);
}

// ---------------------------------------------------------------------------
// Alta y gestión de usuarios del personal
// ---------------------------------------------------------------------------

export async function createStaffUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  avatarColor: string;
  phone?: string;
  active: boolean;
}): Promise<AppUser> {
  const secondaryAuth = getSecondaryAuth();
  const email = params.email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, params.password);
  const uid = cred.user.uid;
  await signOut(secondaryAuth).catch(() => {});

  const user: AppUser = {
    id: uid,
    name: params.name.trim(),
    email,
    role: params.role,
    roleLabel: params.roleLabel,
    avatarColor: params.avatarColor,
    phone: params.phone || '',
    active: params.active,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'app_users', uid), user);
  return user;
}

/** Guarda cambios del perfil (nombre, rol, teléfono, activo). Nunca guarda contraseñas. */
export async function updateStaffProfile(user: AppUser): Promise<void> {
  const { password: _omit, ...clean } = user;
  await setDoc(doc(db, 'app_users', user.id), clean);
}

// ---------------------------------------------------------------------------
// Portal de clientes
// ---------------------------------------------------------------------------

export function generateAccessCode(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

/**
 * Crea (o regenera) el acceso al portal para un cliente y devuelve el código de 6 dígitos.
 * Si ya tenía acceso, el código anterior deja de funcionar.
 */
export async function createPortalAccess(customer: Customer): Promise<string> {
  const taxDigits = onlyDigits(customer.taxId);
  if (taxDigits.length < 7) {
    throw new Error('El cliente no tiene un CUIT/DNI válido cargado.');
  }

  await revokePortalAccess(customer);

  const code = generateAccessCode();
  const email = `${taxDigits}.${Date.now().toString(36)}@portal-clientes.app`;
  const secondaryAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, code);
  const uid = cred.user.uid;
  await signOut(secondaryAuth).catch(() => {});

  const now = new Date().toISOString();
  const batch = writeBatch(db);
  batch.set(doc(db, 'portal_access', uid), {
    customerId: customer.id,
    taxId: customer.taxId,
    customerName: customer.businessName || customer.tradeName || '',
    createdAt: now
  });
  batch.set(doc(db, 'portal_lookup', taxDigits), { email, uid, updatedAt: now });
  await batch.commit();
  return code;
}

export async function revokePortalAccess(customer: Customer): Promise<void> {
  const taxDigits = onlyDigits(customer.taxId);
  if (!taxDigits) return;
  const lookupRef = doc(db, 'portal_lookup', taxDigits);
  const lookup = await getDoc(lookupRef);
  if (lookup.exists()) {
    const oldUid = lookup.data().uid as string | undefined;
    if (oldUid) await deleteDoc(doc(db, 'portal_access', oldUid)).catch(() => {});
    await deleteDoc(lookupRef);
  }
}

export async function loginPortal(taxId: string, code: string): Promise<string | null> {
  const taxDigits = onlyDigits(taxId);
  if (!taxDigits) return 'Por favor ingrese su número de DNI o CUIT.';
  if (!/^\d{6}$/.test(code.trim())) return 'El código de acceso tiene 6 números.';

  const lookup = await getDoc(doc(db, 'portal_lookup', taxDigits));
  if (!lookup.exists()) {
    return 'Ese CUIT/DNI no tiene acceso habilitado al portal. Solicítelo a la administración.';
  }
  try {
    await signInWithEmailAndPassword(auth, lookup.data().email as string, code.trim());
    return null;
  } catch (err) {
    const msg = translateAuthError(err);
    return msg === 'Email o contraseña incorrectos.' ? 'Código de acceso incorrecto.' : msg;
  }
}
