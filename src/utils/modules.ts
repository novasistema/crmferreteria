import { ModuleKey } from '../types';

// Módulos que se venden como agregado de la suscripción: están APAGADOS hasta que el creador los activa.
// El resto de los módulos están prendidos salvo que se desactiven explícitamente.
export const OPT_IN_MODULES: ModuleKey[] = ['ecommerce'];

export const isModuleOn = (toggles: Partial<Record<ModuleKey, boolean>> | undefined, key: ModuleKey): boolean =>
  OPT_IN_MODULES.includes(key) ? toggles?.[key] === true : toggles?.[key] !== false;
