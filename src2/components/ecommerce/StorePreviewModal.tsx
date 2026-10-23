import React, { useState } from 'react';
import { Product, ProductCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShoppingBag,
  Search,
  ShoppingCart,
  Phone,
  MessageCircle,
  Tag,
  Star,
  Truck,
  ShieldCheck,
  CreditCard,
  Trash2,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface StorePreviewModalProps {
  onClose: () => void;
}

export const StorePreviewModal: React.FC<StorePreviewModalProps> = ({ onClose }) => {
  const { store } = useApp();
  const config = store.ecommerceConfig;
  const products = store.products.filter((p) => p.publishOnline !== false);
  const categories = store.categories;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Filter products
  const filtered = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const cartSubtotal = cart.reduce(
    (acc, item) => acc + (item.product.isOnOffer && item.product.offerPrice ? item.product.offerPrice : item.product.priceMinorista) * item.quantity,
    0
  );
  const discountAmount = (cartSubtotal * (config.generalDiscountPercent || 0)) / 100;
  const shipping = config.shippingEnabled && (config.freeShippingMinAmount === 0 || cartSubtotal < config.freeShippingMinAmount) ? config.fixedShippingCost : 0;
  const cartTotal = cartSubtotal - discountAmount + shipping;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const newOrderCode = `26-00000${store.ecommerceOrders.length + 1}`;
    store.addEcommerceOrder({
      id: `ord-${Date.now()}`,
      orderCode: newOrderCode,
      channel: 'Minorista',
      clientName: 'Cliente Tienda Online',
      clientEmail: 'cliente@web.com',
      clientPhone: '3585000000',
      shippingAddress: 'Alejandro Roca, Córdoba',
      deliveryMethod: 'shipping',
      total: cartTotal,
      status: 'Pendiente',
      paymentStatus: 'Pendiente',
      paymentMethod: 'MercadoPago / Online',
      date: new Date().toLocaleDateString('es-AR'),
      items: cart.map((item) => ({
        productId: item.product.id,
        productCode: item.product.code || '',
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.isOnOffer && item.product.offerPrice ? item.product.offerPrice : item.product.priceMinorista,
        subtotal: (item.product.isOnOffer && item.product.offerPrice ? item.product.offerPrice : item.product.priceMinorista) * item.quantity,
      })),
      notes: 'Pedido realizado desde la tienda online',
    });
    setOrderSuccess(true);
    setCart([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Preview Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              Vista Previa en Vivo: <span className="text-amber-400 font-mono">https://ferreteriabruzzone.com.ar/tienda</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Public Store Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 px-6 py-4 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xl shadow-inner">
              FB
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">{config.storeName || 'Bruzzone OnLine'}</h1>
              <p className="text-xs font-medium text-slate-900 line-clamp-1">{config.storeDescription}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {config.generalDiscountPercent > 0 && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-sm animate-bounce">
                ¡{config.generalDiscountPercent}% OFF en toda la web!
              </span>
            )}

            <button
              onClick={() => setShowCart(!showCart)}
              className="relative px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-transform active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sub-header search & filters */}
        <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todas ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Products Grid */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {orderSuccess && (
              <div className="mb-6 p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-emerald-200 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-100">¡Pedido Realizado con Éxito!</h4>
                    <p className="text-xs text-emerald-300">
                      Hemos registrado tu pedido en el sistema ERP. Puedes verlo en la pestaña "Pedidos".
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOrderSuccess(false)}
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Continuar Comprando
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((prod) => {
                const isOffer = prod.isOnOffer && prod.offerPrice;
                const finalPrice = isOffer ? prod.offerPrice! : prod.priceMinorista;
                return (
                  <div
                    key={prod.id}
                    className="bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all group hover:shadow-lg"
                  >
                    <div>
                      {/* Badges */}
                      <div className="flex items-center justify-between mb-2">
                        {prod.isFeatured && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" /> Destacado
                          </span>
                        )}
                        {isOffer && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold rounded-md flex items-center gap-1 ml-auto">
                            <Tag className="w-3 h-3" /> Oferta
                          </span>
                        )}
                      </div>

                      {/* Image placeholder / real image */}
                      <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-800/80">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <ShoppingBag className="w-10 h-10 text-slate-700 group-hover:text-amber-500/60 transition-colors" />
                        )}
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono">{prod.code}</span>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-2 mt-0.5 group-hover:text-amber-400 transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {prod.description || 'Artículo de ferretería con garantía oficial.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        {isOffer && (
                          <span className="text-[10px] text-slate-500 line-through block">
                            ${prod.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        <span className="text-sm font-black text-amber-400">
                          ${finalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(prod)}
                        className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm transition-transform active:scale-90"
                        title="Agregar al carrito"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Sidebar Modal Overlay */}
          {showCart && (
            <div className="w-80 sm:w-96 bg-slate-950 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-400" />
                    Mi Carrito ({cart.reduce((a, b) => a + b.quantity, 0)})
                  </h3>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                    El carrito está vacío. Agrega productos para comenzar.
                  </div>
                ) : (
                  <div className="py-4 space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                    {cart.map((item) => {
                      const unitPrice =
                        item.product.isOnOffer && item.product.offerPrice
                          ? item.product.offerPrice
                          : item.product.priceMinorista;
                      return (
                        <div
                          key={item.product.id}
                          className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">{item.product.name}</p>
                            <p className="text-[11px] text-amber-400 font-bold">
                              ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-slate-300 hover:text-white font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-slate-200 px-1">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-slate-300 hover:text-white font-bold"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span>${cartSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Descuento Web ({config.generalDiscountPercent}%):</span>
                        <span>-${discountAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Envío:</span>
                      <span>
                        {shipping > 0
                          ? `$${shipping.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          : '¡Gratis!'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
                      <span>Total:</span>
                      <span className="text-amber-400 text-base font-black">
                        ${cartTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                  >
                    <span>Finalizar Pedido Online</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-950 px-6 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Compra 100% Segura
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-400" /> Envíos y Retiro Local
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Cuotas y Transferencias
            </span>
          </div>
          {config.whatsappNumber && (
            <span className="flex items-center gap-1 text-slate-300">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp: {config.whatsappNumber}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
