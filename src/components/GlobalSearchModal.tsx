import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Users, ShoppingCart, Tag, ArrowRight, CornerDownLeft, Sparkles, Building2 } from 'lucide-react';
import { Product, Customer, ModuleKey } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onSelectModule: (moduleKey: ModuleKey) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onSelectProduct?: (product: Product) => void;
}

interface QuickModuleItem {
  key: ModuleKey;
  title: string;
  category: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  onSelectModule,
  onSelectCustomer,
  onSelectProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Global ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickModules: QuickModuleItem[] = [
    { key: 'desktop', title: 'Escritorio (Accesos Directos)', category: 'Principal' },
    { key: 'sales', title: 'Ventas (POS Terminal)', category: 'Comercial' },
    { key: 'inventory', title: 'Inventario', category: 'Productos' },
    { key: 'combos', title: 'Combos / Packs', category: 'Productos' },
    { key: 'faltantes', title: 'Faltantes y Alertas de Stock', category: 'Productos' },
    { key: 'stock_adjustments', title: 'Ajuste de Stock', category: 'Productos' },
    { key: 'mass_modification', title: 'Modificación Masiva de Productos', category: 'Productos' },
    { key: 'warehouses', title: 'Depósitos y Sucursales', category: 'Productos' },
    { key: 'transfers', title: 'Transferencias Inter-Depósito', category: 'Productos' },
    { key: 'branch_orders', title: 'Pedidos de Sucursal', category: 'Productos' },
    { key: 'import_products', title: 'Importar Productos (Excel/CSV)', category: 'Productos' },
    { key: 'import_stock', title: 'Importar Stock (Excel/CSV)', category: 'Productos' },
    { key: 'brands_categories', title: 'Marcas y Rubros', category: 'Productos' },
    { key: 'price_tags', title: 'Etiquetas de Precio (Impresión)', category: 'Productos' },
    { key: 'prices', title: 'Listas de Precios', category: 'Productos' },
    { key: 'update_prices', title: 'Actualizar Precios (Por Proveedor)', category: 'Productos' },
    { key: 'customers', title: 'Clientes & Cuentas Corrientes', category: 'Comercial' },
    { key: 'purchases', title: 'Compras & Proveedores', category: 'Insumos' },
    { key: 'cashboxes', title: 'Cajas de Dinero & Cuentas', category: 'Tesorería' },
    { key: 'finances', title: 'Finanzas (Cobrar vs Pagar)', category: 'Finanzas' },
    { key: 'production', title: 'Producción & Fórmulas', category: 'Fábrica' },
    { key: 'color_recipes', title: 'Recetas de Color & Lotes', category: 'Fábrica' },
    { key: 'loyalty', title: 'Cupones & Fidelización', category: 'Marketing' }
  ];

  const filteredModules = quickModules.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 4);

  const filteredProducts = searchTerm.trim() ? products.filter(p =>
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.color && p.color.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 5) : [];

  const filteredCustomers = searchTerm.trim() ? customers.filter(c =>
    c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId.includes(searchTerm) ||
    (c.phone && c.phone.includes(searchTerm))
  ).slice(0, 4) : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search header bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar productos, clientes, comprobantes o módulos del sistema... (F10)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
              ESC para salir
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 p-2 text-xs">
          {/* Quick Modules */}
          <div>
            <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              Módulos y Accesos Directos
            </div>
            <div className="space-y-1">
              {filteredModules.map((mod) => (
                <div
                  key={mod.key}
                  onClick={() => {
                    onSelectModule(mod.key);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-950 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-orange-100 text-slate-600 group-hover:text-orange-600 flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 group-hover:text-orange-950 block">{mod.title}</span>
                      <span className="text-[10px] text-slate-400">{mod.category}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-orange-600 font-semibold opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    Abrir <CornerDownLeft className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Products Results */}
          {filteredProducts.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" /> Productos & Pinturas
              </div>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(p);
                      } else {
                        onSelectModule('inventory');
                      }
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                        {p.code}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 block">{p.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {p.category} · {p.presentation} · Stock: <strong className="text-slate-800">{p.stock} un.</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        ${(p.priceRetail || p.priceWholesale || 0).toLocaleString('es-AR')}
                      </div>
                      <span className="text-[10px] text-slate-400">Precio Lista</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Results */}
          {filteredCustomers.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> Clientes & Cuentas Corrientes
              </div>
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (onSelectCustomer) {
                        onSelectCustomer(c);
                      } else {
                        onSelectModule('customers');
                      }
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{c.businessName}</span>
                      <span className="text-[10px] text-slate-500">
                        CUIT: {c.taxId} {c.phone ? `· Tel: ${c.phone}` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        c.currentBalance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.currentBalance > 0 ? `Deuda: $${c.currentBalance.toLocaleString('es-AR')}` : 'Al día'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchTerm.trim() && filteredProducts.length === 0 && filteredCustomers.length === 0 && filteredModules.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No se encontraron coincidencias para "{searchTerm}".
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Presione <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold">F10</kbd> en cualquier momento para buscar</span>
          </div>
          <div className="flex items-center gap-1 text-orange-600 font-bold">
            Nova Systems ERP
          </div>
        </div>
      </div>
    </div>
  );
};
