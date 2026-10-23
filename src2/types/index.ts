export type UserRole =
  | 'admin'
  | 'cajero'
  | 'vendedor'
  | 'deposito'
  | 'contador'
  | 'administrador'
  | 'almacen'
  | 'sin_rol'
  | string;

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  color?: string;
  allowedModules: string[];
  permissions?: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
  };
}

export interface SystemModuleInfo {
  id: string;
  code: string;
  name: string;
  category: 'Ventas & POS' | 'Inventario & Stock' | 'Compras & Proveedores' | 'Tesorería & Cajas' | 'Finanzas & Fiscal' | 'Distribuidora & E-Com' | 'Personal & RRHH' | 'Configuración & IA';
  description: string;
  iconName: string;
  isEnabled: boolean;
  allowedRoles: string[];
  actions: ('ver' | 'crear' | 'editar' | 'eliminar' | 'exportar')[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  branchId: string;
  assignedCashRegisterId?: string;
  active: boolean;
}

export interface CompanySettings {
  name: string;
  tradeName: string; // "Nova Systems - Ferretería y Distribuidora"
  businessName?: string;
  cuit: string;
  grossIncomeTax?: string; // IIBB
  grossIncomeNumber?: string;
  taxCategory?: 'Responsable Inscripto' | 'Monotributista' | 'Monotributo' | 'Exento' | 'Consumidor Final';
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  fiscalPointOfSale?: number;
  afipPosNumber?: number;
  activityStartDate?: string;
  ticketFooter?: string;
  logoUrl?: string;
  menuLayout?: 'horizontal' | 'vertical';
  emailLegend?: string;
  whatsappLegend?: string;
  allowNegativeStock?: boolean;
  defaultMarginPercent?: number;
  afipEnvironment?: 'production' | 'testing';
  afipCertLoaded?: boolean;
  afipKeyLoaded?: boolean;
  pointsPerCurrency?: number; // default 0.01 -> 1 punto por cada $100
  loyaltyPointsPerPeso?: number;
  currencySymbol?: string;
  customShortcuts?: string[];
  landingMode?: 'ecommerce' | 'institutional';
  enabledModules?: Record<string, boolean>;
}

export interface ShippingCarrier {
  id: string;
  name: string;
  cuit?: string;
  phone?: string;
  email?: string;
  address?: string;
  baseCost: number;
  estimatedDays?: string;
  pickupSchedule?: string;
  notes?: string;
  active: boolean;
}

export interface CurrencyConfig {
  officialDollar: number;
  blueDollar: number;
  salesRateType: 'official' | 'blue' | 'custom';
  lastUpdated: string;
}

export interface MessageTemplate {
  id: string;
  category: 'account_statement' | 'receipts' | 'remitos' | 'sales' | 'cuenta_corriente' | 'recibos' | 'ventas' | string;
  categoryLabel: string;
  name: string;
  variables: string[];
  whatsappText: string;
  emailSubject: string;
  emailText: string;
}

export interface DocumentPrintConfig {
  id: 'presupuesto' | 'factura' | 'ticket' | 'remito';
  name: string;
  paperSize: 'A4' | '14x10cm' | 'Ticket 80mm' | 'Ticket 58mm' | '80mm' | '58mm' | 'Oficio' | 'Carta' | 'Letter';
  orientation: 'portrait' | 'landscape';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  showLogo: boolean;
  showCompanyData: boolean;
  showClientData: boolean;
  showPrices: boolean;
  showUnitPrice: boolean;
  showLineSubtotal: boolean;
  showDiscounts: boolean;
  showTaxes: boolean;
  showTotal: boolean;
  showPaymentMethod: boolean;
  showNotes: boolean;
  showBarcode: boolean;
  showQRCode: boolean;
  showSignatureSpace: boolean;
  fontSizeGeneral: number;
  fontSizeTitle: number;
  headerText?: string;
  footerText?: string;
  copiesCount: number;
  blockOrder?: string[];
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  province?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  managerName?: string;
  fiscalPointOfSale?: number;
  type?: 'branch_store' | 'warehouse' | 'headquarters';
  assignedCashRegisterId?: string;
  assignedMoneyBoxId?: string;
  isMain: boolean;
  active: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface SupplierProductMapping {
  supplierId: string;
  supplierName?: string;
  supplierCode: string;
  supplierDescription?: string;
  lastCost: number;
  lastPurchaseDate?: string;
  purchaseUnit?: string;
}

export interface PriceList {
  id: string;
  name: string;
  code: string;
  marginPercentage: number; // e.g. 0% for Minorista, -15% for Mayorista, -10% for Gremio
  isDefault: boolean;
  baseCalculation?: 'cost' | 'sale';
  description?: string;
  active?: boolean;
}

export interface Product {
  id: string;
  code: string; // SKU or internal code
  barcode: string;
  name: string;
  description?: string;
  code1?: string;
  code2?: string;
  code3?: string;
  code4?: string;
  primaryUnit?: string; // Unidad primaria (Stock)
  salesUnit?: string; // Unidad de venta
  categoryId: string;
  categoryName?: string;
  rubro?: string;
  brandId: string;
  brandName?: string;
  brand?: string;
  supplierCode?: string; // Cód. Proveedor
  supplierId?: string;
  supplierName?: string;
  supplierSkus?: SupplierProductMapping[]; // Códigos y costos por proveedor
  purchaseCurrency?: 'ARS' | 'USD';
  salesCurrency?: 'ARS' | 'USD';
  exchangeRate?: number;
  unit: 'u' | 'mt' | 'kg' | 'lt' | 'pack' | 'bolsa' | 'rollo' | 'caja';
  
  // Costos y Precios
  costReferenceProductId?: string;
  costReferenceFactor?: number;
  costListNoVat?: number;
  packageQuantity?: number; // cant x bulto
  packagingUnits?: number; // cant envasado
  salesPackUnits?: number; // cant x venta
  costPrice: number; // Costo unitario compra
  discount1?: number; // Desc 1 (%)
  discount2?: number; // Desc 2 (%)
  discount3?: number; // Desc 3 (%)
  discount4?: number; // Desc 4 (%)
  marginPercent: number; // Margen de ganancia lista contado %
  marginWholesalePercent?: number; // % Ganancia Mayorista
  priceMinorista: number; // Precio lista 1 (Minorista / Contado c/IVA)
  priceMayorista: number; // Precio lista 2 (Mayorista c/IVA)
  priceGremio: number; // Precio lista 3 (Instaladores / Gremio)
  vatRate: 21 | 10.5 | 27 | 0; // Tasa de IVA %
  
  // Inventario
  stock: number; // Stock total
  stockMin: number; // Mínimo de alerta
  reorderPoint?: number; // Punto de pedido
  stockByWarehouse: Record<string, number>; // warehouseId -> stock
  shelfLocation?: string; // Ubicación en depósito/góndola
  
  // Fraccionado
  allowFractional?: boolean; // Habilitar Fraccionado
  fractionalUnit?: string;
  fractionalFactor?: number;
  fractionalPrice?: number;
  
  // E-Commerce & Marketing
  publishOnline?: boolean;
  publishWholesale?: boolean;
  isFeatured?: boolean;
  isOnOffer?: boolean;
  offerPrice?: number;
  isNewArrival?: boolean;
  wholesaleExclusive?: boolean;
  wholesaleCustomPrice?: number;
  wholesaleMarginPercent?: number;
  wholesalePriceTiers?: { minQty: number; discountPercent?: number; price?: number }[];
  
  imageUrl?: string;
  isCombo?: boolean;
  active: boolean;
}

export interface ComboItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ProductCombo {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  discountPercentage: number;
  items: ComboItem[];
  imageUrl?: string;
  active: boolean;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'sale' | 'purchase' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: 'sale' | 'purchase' | 'manual_adjustment' | 'transfer' | 'repair_service' | 'purchase_order';
  referenceId?: string;
  reason: string;
  userId: string;
  userName: string;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  businessName?: string; // Razón Social
  taxId: string; // DNI o CUIT
  taxCondition: 'Consumidor Final' | 'Responsable Inscripto' | 'Monotributo' | 'Exento';
  email: string;
  emails?: string[]; // Lista de emails adicionales
  phone: string;
  whatsapp?: string;
  birthday?: string; // Fecha de cumpleaños
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  priceListId: string;
  hasCurrentAccount: boolean; // Cuenta Corriente activada
  creditLimit: number; // Límite de crédito asignado
  currentBalance: number; // Saldo deudor (>0 debe dinero, <0 a favor)
  loyaltyEligible: boolean; // Si participa en fidelización (debe ser false si hasCurrentAccount es true)
  loyaltyPoints: number;
  loyaltyLifetimePoints?: number;
  loyaltyTier: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  businessName?: string;
  cuit: string;
  taxId?: string;
  taxCondition: 'Responsable Inscripto' | 'Monotributo' | 'Exento';
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  province?: string;
  category?: string;
  paymentTermsDays?: number;
  defaultDiscountPercent?: number; // Descuento por defecto a aplicar a sus productos
  currentBalance: number; // Saldo que le debemos
  cbu?: string;
  bankName?: string;
  alias?: string;
  notes?: string;
  active: boolean;
  categories?: string[];
}

export interface SupplierPriceTemplate {
  id: string;
  supplierId: string;
  name: string;
  codeCol: string; // e.g. 'A', 'B', 'C'
  descCol: string; // e.g. 'A', 'B', 'C'
  priceCol: string; // e.g. 'A', 'B', 'C', 'I'
  hasHeader: boolean;
  startRow: number; // e.g. 1 or 27
  sheetName?: string;
}

export interface QuoteItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
  unit?: string;
  brandName?: string;
  originalPrice?: number;
  costPrice?: number;
}

export interface Quote {
  id: string;
  code: string;
  date: string;
  expiryDate: string;
  clientId: string;
  clientName: string;
  clientTaxId: string;
  clientAddress?: string;
  clientPhone?: string;
  warehouseId?: string;
  priceListId?: string;
  items: QuoteItem[];
  subtotal: number;
  discountPercent?: number;
  discountTotal: number;
  total: number;
  status: 'pending' | 'converted_to_sale' | 'expired' | 'rejected';
  convertedSaleId?: string;
  notes?: string;
  userId: string;
  userName: string;
}

export interface RemitoItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  subtotal: number;
}

export interface Remito {
  id: string;
  code: string; // ej: REM-0001-00004910
  date: string;
  clientId: string;
  clientName: string;
  clientTaxId: string;
  clientTaxCondition?: string;
  clientAddress?: string;
  warehouseId: string;
  warehouseName?: string;
  items: RemitoItem[];
  subtotal: number;
  total: number;
  status: 'pending_invoice' | 'invoiced' | 'cancelled';
  invoicedSaleId?: string;
  invoicedSaleCode?: string;
  shippingCarrierId?: string;
  shippingCarrierName?: string;
  deliveryAddress?: string;
  notes?: string;
  userId: string;
  userName: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productCode: string; // SKU o Código Interno
  supplierProductCode?: string; // Código de proveedor (ej: LAB01201)
  productName: string;
  originalSupplierId?: string;
  originalSupplierName?: string; // Proveedor original configurado en el producto
  quantity: number;
  unitCost: number;
  vatRate: number;
  subtotal: number;
  notes?: string;
}

export interface PendingPurchaseItem {
  id: string;
  productId: string;
  sku: string; // SKU o Código de producto
  supplierProductCode?: string; // Cód. proveedor
  productName: string;
  originalSupplierId?: string;
  originalSupplierName: string;
  targetSupplierId: string;
  targetSupplierName: string;
  quantity: number;
  unitCost: number;
  vatRate?: number;
}

export interface PurchaseOrder {
  id: string;
  code: string; // ej: PO-MT1Z4O5C--7TQ
  supplierId: string;
  supplierName: string;
  supplierTaxId?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  date: string;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'received' | 'cancelled';
  notes?: string;
  paymentCondition?: 'cash' | 'credit';
  invoiceNumber?: string;
  warehouseId?: string;
  userId?: string;
  userName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMethod = 
  | 'cash' 
  | 'debit_card' 
  | 'credit_card' 
  | 'card'
  | 'bank_transfer' 
  | 'transfer'
  | 'mercadopago_qr' 
  | 'check' 
  | 'current_account' // 'no_pago' en caja
  | 'internal_installment';

export interface SalePayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  cardInstallments?: number;
  installmentInterestRate?: number;
  cardBrand?: string;
  referenceNumber?: string;
  destinationBoxId?: string; // mb-{id} o reg-{id}
}

export interface SaleItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
  subtotal: number;
  isCombo?: boolean;
}

export type DocumentType = 
  | 'ticket' 
  | 'factura_a' 
  | 'factura_b' 
  | 'factura_c' 
  | 'nota_credito_a' 
  | 'nota_credito_b' 
  | 'remito' 
  | 'presupuesto';

export interface ElectronicInvoice {
  cae?: string;
  caeExpiresAt?: string;
  invoiceNumber: string; // ej: 0001-00014522
  invoiceType: DocumentType;
  pointOfSale: number;
  qrData?: string;
  fiscalStatus: 'authorized' | 'pending' | 'rejected' | 'not_fiscal';
  fiscalErrors?: string[];
  authorizedAt?: string;
}

export interface Sale {
  id: string;
  code: string; // ej: VTA-2026-00891
  date: string;
  clientId: string;
  clientName: string;
  clientTaxId: string;
  clientTaxCondition: string;
  warehouseId: string;
  sellerId: string;
  sellerName: string;
  priceListId: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  payments: SalePayment[];
  paymentStatus: 'paid' | 'partial' | 'pending_account';
  documentType: DocumentType;
  fiscalData: ElectronicInvoice;
  cashRegisterSessionId?: string;
  loyaltyPointsEarned: number;
  notes?: string;
  status: 'completed' | 'cancelled' | 'refunded';
  cancelledAt?: string;
  cancelledReason?: string;
}

export interface PurchaseItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number; // Precio Unitario
  vatRate: number; // IVA %
  discount1?: number; // Dto.1 %
  discount2?: number; // Dto.2 %
  discount3?: number; // Dto.3 %
  subtotal: number;
  profitMargin?: number; // Margen de Ganancia %
  updateCost?: boolean;
}

export interface Purchase {
  id: string;
  code: string; // ej: FC-00001-00001234
  date: string; // Fecha Factura
  dueDate?: string; // Vencimiento
  supplierId: string;
  supplierName: string;
  supplierTaxId?: string; // CUIT
  supplierTaxCondition?: string;
  invoiceType: 'Factura A' | 'Factura B' | 'Factura C' | 'Factura M' | 'Remito' | 'Nota de Crédito' | 'Nota de Débito';
  pointOfSale: string; // "00001"
  invoiceNumber: string; // "00000001"
  fullInvoiceNumber: string; // "00001-00000001"
  warehouseId: string;
  warehouseName?: string;
  items: PurchaseItem[];
  // Cálculos e Impuestos
  subtotal: number; // Suma de netos de ítems
  vatAmount: number; // IVA liquidado fiscal
  internalTax?: number; // Impuesto Interno
  otherTaxes?: number; // Otros Impuestos
  perceptionIIBB?: number; // Percepción IIBB
  perceptionIVA?: number; // Percepción IVA
  generalDiscountPercent?: number; // Dto. %
  generalDiscountAmount?: number;
  extraDiscountPercent?: number; // Desc. Extra % (Descuenta del total a pagar pero NO afecta al IVA)
  extraDiscountAmount?: number;
  total: number; // Total a pagar
  paymentMethod: PaymentMethod | 'current_account';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount?: number;
  balanceDue?: number;
  autoUpdateStock: boolean;
  autoUpdateCosts: boolean;
  notes?: string;
  registeredByUserId: string;
  registeredByUserName?: string;
  createdAt?: string;
}

export interface SupplierAccountMovement {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  type: 'purchase_debt' | 'payment_credit' | 'debit_note' | 'credit_note' | 'adjustment_debit' | 'adjustment_credit';
  amount: number;
  balanceAfter: number;
  referenceType: 'purchase' | 'payment_order' | 'credit_note' | 'debit_note' | 'manual';
  referenceId?: string;
  concept: string;
  documentNumber?: string;
  userId: string;
  userName?: string;
}

export interface SupplierPaymentOrder {
  id: string;
  paymentOrderNumber: string; // ej: OP-0001-00001234
  date: string;
  supplierId: string;
  supplierName: string;
  supplierTaxId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  destinationBoxId?: string;
  paymentMethodsDetail?: {
    method: PaymentMethod;
    boxId: string;
    amount: number;
    referenceNumber?: string;
    checkId?: string;
  }[];
  retentions?: {
    type: 'Ganancias' | 'IIBB' | 'IVA' | 'SUSS' | string;
    certificateNumber: string;
    percentage?: number;
    amount: number;
  }[];
  appliedToPurchases: {
    purchaseId: string;
    invoiceNumber: string;
    amountApplied: number;
  }[];
  notes?: string;
  userId: string;
  userName?: string;
}

export interface CashRegister {
  id: string; // ej: "reg-1"
  name: string; // ej: "Caja Mostrador 1"
  code: string;
  branchId: string;
  branchName?: string;
  typeBadge?: string; // 'Mostrador', etc.
  destinationOnClose?: string; // 'Administración', 'Sucursal', etc.
  currentSessionId?: string;
  currentBalance?: number;
  lastCloseDate?: string;
  description?: string;
  isOpen: boolean;
  active: boolean;
}

export interface CashRegisterSession {
  id: string;
  registerId: string;
  registerName: string;
  openedByUserId: string;
  openedByUserName: string;
  openedAt: string;
  closedByUserId?: string;
  closedByUserName?: string;
  closedAt?: string;
  initialCash: number; // Fondo inicial
  expectedCash: number; // Calculado SOLO con movimientos 'cash'
  actualCash?: number; // Contado real ingresado por cajero
  cashDifference?: number; // actual - expected
  totalSalesCash: number;
  totalSalesCards: number;
  totalSalesTransfer: number;
  totalSalesCurrentAccount: number; // Ventas en cuenta corriente (no suman efectivo)
  totalInflows: number;
  totalOutflows: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface CashMovement {
  id: string;
  date: string;
  sessionId?: string;
  boxId: string; // "reg-X" o "mb-X"
  type: 'sale_inflow' | 'manual_inflow' | 'manual_outflow' | 'expense' | 'client_payment' | 'supplier_payment' | 'transfer';
  paymentMethod: PaymentMethod;
  amount: number;
  concept: string;
  referenceType?: 'sale' | 'purchase' | 'client_receipt' | 'supplier_receipt' | 'fixed_expense' | 'employee_advance' | 'employee_payment';
  referenceId?: string;
  userId: string;
  userName: string;
}

export interface MoneyBox {
  id: string; // ej: "mb-central"
  name: string; // "Caja Fuerte / Tesorería Principal"
  description?: string; // Subtítulo o detalle ej: "caja efectivo de sucursal"
  branchId?: string; // Sucursal a la que pertenece
  type: 'physical_box' | 'bank_account' | 'digital_wallet';
  accountType?: 'Caja de Ahorro' | 'Cuenta Corriente' | 'Billetera Virtual';
  currency: 'ARS' | 'USD';
  currentBalance: number;
  bankName?: string;
  accountNumber?: string;
  cbuCvu?: string;
  alias?: string;
  accountHolder?: string; // Titular
  lastSyncDate?: string;
  isMain?: boolean;
  active: boolean;
}

export interface StockTransferItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit?: string;
}

export interface StockTransfer {
  id: string;
  code: string; // TRF-0001-000001
  date: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  items: StockTransferItem[];
  totalQuantity: number;
  status: 'completed' | 'in_transit' | 'cancelled';
  notes?: string;
  userId: string;
  userName: string;
}

export interface ClientAccountMovement {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  type: 'sale_debt' | 'payment_credit' | 'return_credit' | 'adjustment_debit' | 'adjustment_credit';
  amount: number;
  balanceAfter: number;
  referenceType: 'sale' | 'receipt' | 'refund' | 'manual';
  referenceId?: string;
  concept: string;
  receiptNumber?: string;
  userId: string;
}

export interface ClientReceipt {
  id: string;
  receiptNumber: string; // ej: REC-0001-00004512
  date: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  destinationBoxId: string;
  paymentMethodsDetail?: {
    method: PaymentMethod;
    boxId: string;
    amount: number;
  }[];
  retainedTaxes?: number; // Retenciones aplicadas
  retainedTaxesDetail?: {
    type: string;
    certificateNumber: string;
    date: string;
    amount: number;
  }[];
  appliedToSales: { saleId: string; saleCode: string; amountApplied: number }[];
  notes?: string;
  userId: string;
}

export interface InstallmentRateOption {
  installments: number; // 2, 3, 4, 5, 6, 9, 12, 18, 24
  surchargePercent: number; // e.g. 5.0, 8.0, 20.0
  description: string; // e.g. "2 cuotas", "3 cuotas"
}

export interface InternalInstallmentsConfig {
  options: InstallmentRateOption[];
}

export interface InternalInstallmentPlan {
  id: string;
  code: string;
  clientId: string;
  clientName: string;
  clientTaxId: string;
  clientPhone?: string;
  date: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  totalCashPrice: number;
  downPayment: number; // Anticipo
  financedAmount: number;
  installmentsCount: number; // 2, 3, 4, 5, 6, 9, 12, 18, 24 cuotas
  interestRatePercent: number; // Recargo financiero %
  totalFinancedWithInterest: number;
  installmentAmount: number; // Monto por cuota
  schedule: {
    number: number;
    dueDate: string; // 1ra cuota vence el día de creación del plan
    amount: number;
    isPaid: boolean; // Primera cuota NO se marca pagada automáticamente
    paidAt?: string;
    paidAmount?: number;
    receiptNumber?: string;
    paymentMethod?: PaymentMethod;
  }[];
  status: 'active' | 'completed' | 'cancelled' | 'defaulted';
  notes?: string;
  userId: string;
}

export interface LoyaltyReward {
  id: string;
  code?: string;
  name?: string;
  title: string;
  description: string;
  category: string;
  pointsCost: number;
  pointsRequired?: number;
  stock: number;
  stockAvailable?: number;
  referencePrice?: number;
  imageUrl?: string;
  terms?: string;
  active: boolean;
  createdAt?: string;
}

export interface LoyaltyBonusRule {
  id: string;
  name: string;
  multiplier: number;
  extraPoints: number;
  minPurchaseAmount: number;
  daysOfWeek?: string; // "0,6" (0=Domingo)
  active: boolean;
  createdAt: string;
}

export interface LoyaltySurvey {
  id: string;
  title: string;
  points: number;
  type: 'stars' | 'multiple_choice' | 'text';
  question: string;
  options?: string[];
  active: boolean;
  responsesCount: number;
  createdAt: string;
}

export interface LoyaltyBranch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  schedule: string;
  isMain: boolean;
  active: boolean;
}

export interface LoyaltyConfig {
  programActive: boolean;
  programName: string;
  pointsPerPeso: number;
  pointValuePesos: number;
  welcomePoints: number;
  whatsapp: string;
  email: string;
  primaryColor: string;
  instagram: string;
  facebook: string;
  website: string;
  address: string;
  popupActive: boolean;
  popupTitle: string;
  popupButtonText: string;
  popupImageUrl: string;
  popupButtonLink: string;
  popupMessage: string;
}

export interface LoyaltyTransaction {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  type: 'earned_sale' | 'redeemed_reward' | 'manual_adjustment' | 'bonus' | 'referral' | 'raffle_entry';
  points: number;
  balanceAfter: number;
  referenceType?: 'sale' | 'reward_redemption' | 'manual' | 'raffle' | 'survey';
  referenceId?: string;
  description: string;
  userId?: string;
}

export interface LoyaltyRedemption {
  id: string;
  code: string; // Código alfanumérico único ej: "CANJE-88421" o "NV-PREM-88421"
  date: string;
  clientId: string;
  clientName: string;
  rewardId: string;
  rewardTitle: string;
  pointsSpent: number;
  status: 'issued' | 'delivered' | 'cancelled';
  deliveredAt?: string;
  deliveredByUserId?: string;
}

export interface LoyaltyRaffle {
  id: string;
  title: string;
  description: string;
  prizeDescription?: string;
  pointsPerEntry: number;
  startDate?: string;
  endDate?: string;
  drawDate?: string;
  status: 'open' | 'closed' | 'drawn';
  winnerClientId?: string;
  winnerClientName?: string;
  totalEntries: number;
  participantsCount?: number;
  imageUrl?: string;
  createdAt?: string;
}

export interface ServiceHistoryEntry {
  id: string;
  status: string;
  statusLabel: string;
  description: string;
  date: string;
  userId?: string;
}

export type TechnicalServiceStatus =
  | 'received'
  | 'diagnosis'
  | 'budgeted'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'in_diagnosis'
  | 'budget_ready'
  | 'approved'
  | 'in_repair'
  | 'ready_for_pickup';

export type ServiceTypeCategory = 'Reparación' | 'Afilado' | 'Mantenimiento' | 'Garantía' | 'Calibración' | 'Otro';

export interface TechnicalServiceOrder {
  id: string;
  orderNumber: string; // ej: SRV-2026-00045 o OT-2026-0045
  withdrawCode?: string; // ej: EELGXJ
  date: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  itemDescription?: string; // ej: CADENA MOTOSIERRA, ESTUFA, TALADRO
  equipmentType?: string;
  serviceType?: ServiceTypeCategory | string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  accessories?: string;
  reportedFault: string;
  diagnosis?: string;
  workPerformed?: string;
  spareParts?: {
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  laborCost?: number;
  estimatedBudget?: number;
  finalCost?: number;
  totalEstimated?: number;
  totalFinal?: number;
  estimatedDeliveryDate?: string;
  status: TechnicalServiceStatus;
  history?: ServiceHistoryEntry[];
  technicianNotes?: string;
  depositAmount?: number;
  receivedByUserId?: string;
  technicianUserId?: string;
  deliveredAt?: string;
  branchId?: string;
}

export interface WholesaleOrder {
  id: string;
  orderCode: string;
  date: string;
  clientId: string;
  clientName: string;
  clientTaxId: string;
  deliveryType: 'shipping' | 'store_pickup';
  shippingCarrier?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  items: {
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    packQuantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending_approval' | 'approved' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
  notes?: string;
}

export interface EcommerceConfig {
  storeActive: boolean;
  storeName: string;
  storeDescription: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappNumber?: string;
  currency: string;
  generalDiscountPercent: number;
  shippingEnabled: boolean;
  fixedShippingCost: number;
  freeShippingMinAmount: number;
  storePickupEnabled: boolean;
  selectedCategoryIds: string[];
  selectedMobileModules: string[];
  wholesaleActive: boolean;
  wholesaleName: string;
  wholesaleDescription: string;
  wholesaleLogoUrl?: string;
  wholesalePhone: string;
  wholesaleEmail: string;
  wholesaleWhatsapp: string;
  wholesaleMinOrderAmount: number;
  wholesaleMinItemCount: number;
  wholesaleShippingEnabled: boolean;
  wholesalePickupEnabled: boolean;
  wholesaleDefaultMargin: number;
  // WhatsApp Business Catalog Sync
  whatsappCatalogSyncEnabled?: boolean;
  whatsappBusinessPhoneId?: string;
  whatsappCatalogId?: string;
  whatsappAccessToken?: string;
  whatsappAutoSyncStock?: boolean;
  whatsappAutoSyncPrice?: boolean;
  whatsappLastSyncTime?: string;
}

export interface EcommerceOrderItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface EcommerceOrder {
  id: string;
  orderCode: string;
  channel: 'Minorista' | 'Mayorista' | 'MercadoLibre' | 'Mostrador';
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  shippingAddress?: string;
  deliveryMethod: 'shipping' | 'pickup';
  total: number;
  status: 'Enviado' | 'Pendiente' | 'Preparando' | 'Entregado' | 'Cancelado';
  paymentStatus: 'Pagado' | 'Pendiente' | 'Rechazado';
  paymentMethod: string;
  date: string;
  items: EcommerceOrderItem[];
  notes?: string;
}

export interface WholesaleScaleTier {
  minQty: number;
  discountPercent?: number;
  price?: number;
}

export interface EmployeeWeeklySchedule {
  monday: 'full' | 'half' | 'off';
  tuesday: 'full' | 'half' | 'off';
  wednesday: 'full' | 'half' | 'off';
  thursday: 'full' | 'half' | 'off';
  friday: 'full' | 'half' | 'off';
  saturday: 'full' | 'half' | 'off';
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  lastName?: string;
  alias?: string;
  dni: string;
  cuil?: string;
  email?: string;
  phone?: string;
  address?: string;
  position: string;
  baseSalary: number;
  paymentFrequency?: 'monthly' | 'biweekly' | 'weekly';
  commissionRatePercent: number;
  hireDate: string;
  branchId?: string;
  weeklySchedule?: EmployeeWeeklySchedule;
  bankName?: string;
  accountNumber?: string;
  cbu?: string;
  active: boolean;
  systemUserId?: string;
}

export interface EmployeeAbsence {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  type: 'justified' | 'unjustified' | 'sick' | 'other';
  deductsSalary: boolean;
  reason: string;
}

export interface EmployeeVacation {
  id: string;
  employeeId: string;
  employeeName: string;
  year: number;
  startDate: string;
  endDate: string;
  daysCount: number;
  notes?: string;
  status: 'scheduled' | 'taken' | 'cancelled';
}

export interface EmployeeSpecialDate {
  id: string;
  name: string;
  type: 'aguinaldo' | 'performance_bonus' | 'birthday' | 'holiday_bonus' | 'other';
  employeeId?: string; // 'all' or specific employeeId
  employeeName?: string;
  month: number; // 1-12
  day?: number;
  amount?: number;
  recurring: boolean;
  notes?: string;
}

export interface EmployeePayment {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  paymentType: 'salary' | 'biweekly' | 'sac' | 'bonus' | 'commission' | 'severance';
  periodMonth: string; // e.g. "2026-08"
  grossAmount: number;
  deductions: number;
  advancesDeducted: number;
  netAmount: number;
  paymentMethod: 'transfer' | 'cash' | 'check';
  bankAccountOrBoxId?: string;
  status: 'paid' | 'pending';
  receiptNumber: string;
  notes?: string;
}

export interface EmployeeAdvance {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentMethod?: 'cash' | 'transfer';
  boxId?: string;
  reason?: string;
  status: 'paid' | 'deducted';
  receiptNumber: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'fixed' | 'variable'; // Fijo o Variable
  periodAmount?: number;
  paymentsCount?: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  sourceBoxOrBankId: string;
  sourceName?: string;
  description: string;
  invoiceNumber?: string;
  userId: string;
  userName: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  category: 'Alquiler' | 'Luz / Servicios' | 'Impuestos' | 'Mantenimiento' | 'Sueldos' | 'Seguros' | 'Publicidad' | 'Otro' | string;
  amount: number;
  dueDay: number; // Día del mes
  frequency: 'monthly' | 'bimonthly' | 'annual';
  lastPaidMonth?: string; // "2026-08"
  active: boolean;
  paymentMethod?: string;
  isCalculatedFromPersonnel?: boolean;
  iconType?: 'dollar' | 'building' | 'users' | 'sun' | 'zap' | 'flame' | 'droplet' | 'calculator' | 'receipt' | 'other' | string;
  notes?: string;
}

export interface CheckWalletItem {
  id: string;
  type?: 'physical' | 'echeq';
  checkNumber: string;
  bankName: string;
  issuerName: string;
  issuerTaxId: string;
  issuerCity?: string;
  amount: number;
  issueDate: string;
  paymentDate: string; // Vencimiento
  origin: 'client_sale' | 'client_payment' | 'manual';
  clientId?: string;
  clientName?: string;
  status: 'pending' | 'in_portfolio' | 'deposited' | 'cashed' | 'endorsed' | 'endorsed_to_supplier' | 'rejected';
  deliveredTo?: string;
  deliveryDate?: string;
  destinationSupplierName?: string;
  notes?: string;
}

export interface SaleReturnItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  disposition: 'restock' | 'damaged' | 'discard';
  warehouseId?: string;
}

export interface SaleReturn {
  id: string;
  code: string; // ej: DEV-VTA-0001-00000001
  date: string;
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
  warehouseName?: string;
  userId: string;
  userName: string;
  status: 'completed' | 'cancelled';
  createdAt: string;
}

export interface SupplierReturnItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  warehouseId?: string;
}

export interface SupplierReturn {
  id: string;
  code: string; // ej: DEV-PRV-0001-00000001
  date: string;
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
  warehouseName?: string;
  userId: string;
  userName: string;
  status: 'completed' | 'cancelled';
  createdAt: string;
}

export type TaskPriority = 'Baja' | 'Normal' | 'Alta' | 'Urgente';
export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';

export interface TaskStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignedTo: string; // 'all' (General) or specific user id/name
  assignedToName?: string;
  steps?: TaskStep[];
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  completedAt?: string;
}

export type LoanDestination = 'stock' | 'reforma' | 'equipamiento' | 'capital_trabajo' | 'distribuidora' | 'other';
export type LoanFrequency = 'monthly' | 'biweekly' | 'weekly' | 'custom';
export type LoanInstallmentStatus = 'pending' | 'reserved' | 'paid' | 'overdue' | 'partial';

export interface LoanInstallment {
  number: number;
  dueDate: string;
  amount: number;
  status: LoanInstallmentStatus;
  reservedAmount: number;
  paidAmount: number;
  paidAt?: string;
  paymentMethod?: string;
  cashBoxId?: string;
  notes?: string;
}

export interface LoanContribution {
  id: string;
  date: string;
  amount: number;
  description: string;
  userId: string;
  userName: string;
}

export interface LoanPlan {
  id: string;
  code: string;
  name: string;
  creditor: string;
  date: string;
  receivedAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  frequency: LoanFrequency;
  firstDueDate: string;
  dueDay: number;
  interestRate: number;
  expenses: number;
  totalToReturn: number;
  destination: LoanDestination;
  notes?: string;
  stockPurchasesSpent: number;
  grossMarginPercent: number; // e.g. 35
  monthlyExpensesConsidered: number;
  sellingDaysMonth: number; // e.g. 24 or 30
  sellingDaysWeek: number; // e.g. 6
  schedule: LoanInstallment[];
  contributions: LoanContribution[];
  status: 'active' | 'completed' | 'cancelled';
  userId: string;
  userName: string;
  createdAt: string;
}


