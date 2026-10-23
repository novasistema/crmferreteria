import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  ShoppingBag,
  FileText,
  DollarSign,
  User,
  Building2,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Truck,
  Receipt,
  Sparkles,
  CreditCard,
  Building,
} from 'lucide-react';

export const WholesalePortalView: React.FC = () => {
  const { store, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'ctacte'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [selectedWholesaleClient, setSelectedWholesaleClient] = useState(
    store.clients.find((c) => c.hasCurrentAccount) || store.clients[0] || { name: 'Corralon Mayorista S.A.', currentBalance: 1450000 }
  );

  const products = (store.products || []).filter((p) => p.active !== false);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 10 }]; // Default wholesale box/pack qty
    });
    showToast(`+ 1 pack/unidad mayorista de ${product.name}`, 'success');
  };

  const handleUpdateQty = (idx: number, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((_, i) => i !== idx));
      return;
    }
    const updated = [...cart];
    updated[idx].quantity = qty;
    setCart(updated);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.costPrice || 1000) * 1.35 * item.quantity, 0);

  const handleCheckoutWholesaleOrder = () => {
    if (cart.length === 0) {
      showToast('El carrito mayorista está vacío', 'warning');
      return;
    }
    showToast(`¡Pedido Mayorista enviado a Distribuidora Bruzzone con éxito! Total: $${cartTotal.toLocaleString('es-AR')}`, 'success');
    setCart([]);
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-28 animate-in fade-in duration-200">
        
        {/* Distinct Wholesale Header with Separated Logo & Data (Distribuidora Bruzzone) */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl border border-purple-400/40">
              DB
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Portal Exclusivo Mayorista
                </span>
                <span className="text-xs text-purple-200">CUIT: 30-71928471-2</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Distribuidora Bruzzone
              </h1>
              <p className="text-purple-200 text-xs mt-0.5">
                Venta mayorista en volumen, listas de precios diferenciadas y cuenta corriente.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-purple-500/30 text-right space-y-1">
            <span className="text-xs text-slate-400 block">Cliente Mayorista Activo:</span>
            <span className="font-bold text-sm text-white block">{selectedWholesaleClient.name}</span>
            <span className="text-xs font-mono text-purple-300">
              Saldo Cta. Cte: ${(selectedWholesaleClient.currentBalance || 1450000).toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'catalog', label: 'Catálogo & Pedidos Mayoristas', icon: ShoppingBag },
            { id: 'orders', label: 'Mis Pedidos Mayoristas', icon: FileText },
            { id: 'ctacte', label: 'Cuenta Corriente Mayorista', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CATALOG & ORDERS */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar productos mayoristas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <span className="text-xs text-slate-400">Precios Mayoristas con +35% ya aplicado</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map((p) => {
                  const wholesalePrice = (p.costPrice || 1000) * 1.35;
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-3 shadow-sm hover:border-purple-500/50 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800">
                            {p.code}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">Stock Mayorista OK</span>
                        </div>
                        <h4 className="font-bold text-white text-sm line-clamp-2">{p.name}</h4>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Precio Mayorista</span>
                          <span className="font-mono font-black text-purple-400 text-base">
                            ${wholesalePrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wholesale Cart & Checkout */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4 h-fit">
              <div>
                <h3 className="text-base font-bold text-white mb-3 flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-purple-400" /> Carrito Mayorista</span>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)} unidades
                  </span>
                </h3>

                <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {cart.map((item, idx) => {
                    const price = (item.product.costPrice || 1000) * 1.35;
                    return (
                      <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <h5 className="font-bold text-white truncate">{item.product.name}</h5>
                          <span className="font-mono text-purple-400">${price.toLocaleString('es-AR')} x unit</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQty(idx, Number(e.target.value) || 0)}
                            className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold text-white"
                          />
                          <button
                            onClick={() => handleUpdateQty(idx, 0)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {cart.length === 0 && (
                    <div className="py-12 text-center text-slate-500 text-xs italic">
                      El carrito mayorista está vacío. Selecciona artículos del catálogo.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Pedido Mayorista:</span>
                  <span className="font-mono font-black text-purple-400 text-lg">
                    ${cartTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <button
                  onClick={handleCheckoutWholesaleOrder}
                  disabled={cart.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <Truck className="w-4 h-4" /> Confirmar Pedido Mayorista
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Historial de Pedidos Mayoristas (Distribuidora Bruzzone)
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-purple-400">PED-9081</span>
                  <h4 className="font-bold text-white mt-0.5">Corralon y Ferretería El Sol</h4>
                  <span className="text-[11px] text-slate-400">06/10/2026 • 14 artículos</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400 block">$345.000</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Despachado</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CTA CTE MAYORISTA */}
        {activeTab === 'ctacte' && (
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Cuenta Corriente Mayorista (Distribuidora Bruzzone)</h3>
                <p className="text-xs text-slate-400">Estado de cuenta y saldos pendientes del cliente</p>
              </div>
              <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-right">
                <span className="text-xs text-slate-400 block">Saldo Deudor Actual:</span>
                <span className="font-mono font-black text-rose-400 text-lg">$1.450.000,00</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Últimos Movimientos Mayoristas</h4>
              <div className="space-y-2">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-slate-400">01/10/2026 • Factura A-0001-0004520</span>
                    <p className="font-bold text-white mt-0.5">Compra Mayorista en Volumen</p>
                  </div>
                  <span className="font-mono font-bold text-rose-400">+$1.200.000</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-slate-400">25/09/2026 • Recibo de Cobranza REC-00124</span>
                    <p className="font-bold text-white mt-0.5">Transferencia Bancaria Acreditada</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">-$800.000</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
