import { CompanyConfig } from '../types';

// Marca genérica del sistema: se usa hasta que cada cliente carga su nombre y su logo en Configuración.
export const DEFAULT_BRAND_NAME = 'TU EMPRESA';
export const DEFAULT_LOGO = '/assets/tu-empresa-logo.svg';
const LEGACY_LOGO = '/assets/aistudio/colorear-500px_0158e3cb.webp';

let current: Partial<CompanyConfig> | null = null;

// App llama a esto cada vez que cambia la configuración de la empresa
export const setBrandConfig = (config: Partial<CompanyConfig> | null | undefined) => {
  current = config || null;
};

export const brandName = (config: Partial<CompanyConfig> | null | undefined = current) =>
  (config?.tradeName || config?.companyName || DEFAULT_BRAND_NAME).trim();

export const legalName = (config: Partial<CompanyConfig> | null | undefined = current) =>
  (config?.companyName || config?.tradeName || DEFAULT_BRAND_NAME).trim();

export const brandLogo = (config: Partial<CompanyConfig> | null | undefined = current) =>
  config?.logoUrl && config.logoUrl !== LEGACY_LOGO ? config.logoUrl : DEFAULT_LOGO;

// Datos para transferencias que carga el comercio (Tienda Online → cobro por transferencia)
export const transferInfo = (config: Partial<CompanyConfig> | null | undefined = current) => ({
  bank: config?.ecommerce?.transferBank || '',
  cbu: config?.ecommerce?.transferCbu || '',
  alias: config?.ecommerce?.transferAlias || ''
});

// La configuración de demostración que traía la marca Colorear se pasa a la marca genérica
export const isLegacyDemoBrand = (config: Partial<CompanyConfig> | null | undefined) =>
  !!config && (/colorear/i.test(config.companyName || '') || /colorear/i.test(config.tradeName || '') || config.logoUrl === LEGACY_LOGO);
