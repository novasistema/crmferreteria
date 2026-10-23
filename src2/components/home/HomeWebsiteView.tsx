import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Search,
  ShoppingCart,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  CreditCard,
  Award,
  Sparkles,
  ChevronRight,
  HardHat,
  Building2,
  KeyRound,
  ArrowRight,
  Zap,
  Hammer,
  Layers,
  Droplets,
  Wrench,
} from 'lucide-react';

interface HomeWebsiteViewProps {
  onOpenAuthModal: (tab?: 'staff' | 'ctacte' | 'loyalty') => void;
}

export const HomeWebsiteView: React.FC<HomeWebsiteViewProps> = ({ onOpenAuthModal }) => {
  const { store, showToast } = useApp();
  const landingMode = store.settings.landingMode || 'ecommerce';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter products for public display
  const allProducts = store.products.filter((p) => p.active);
  const categories = [
    { id: 'all', name: 'Todos los Rubros', icon: Layers },
    { id: 'herramientas_electricas', name: 'Herramientas Eléctricas', icon: Zap },
    { id: 'herramientas_manuales', name: 'Herramientas Manuales', icon: Hammer },
    { id: 'construccion', name: 'Construcción & Áridos', icon: HardHat },
    { id: 'pinturas', name: 'Pinturas', icon: Droplets },
    { id: 'sanitarios', name: 'Sanitarios & Plomería', icon: Wrench },
  ];

  const filteredProducts = allProducts.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = p.code.toLowerCase().includes(q);
      const matchBrand = p.brandName?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBrand) return false;
    }

    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      const pCat = (p.categoryName || p.rubro || '').toLowerCase();
      if (!pCat.includes(catLower)) {
        if (selectedCategory === 'herramientas_electricas' && !p.name.toLowerCase().includes('amoladora') && !p.name.toLowerCase().includes('taladro') && !p.name.toLowerCase().includes('sierra')) return false;
      }
    }

    return true;
  });

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`${product.name} agregado al presupuesto`, 'success');
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.product.priceMinorista * item.quantity, 0);

  const handleSendWhatsAppQuote = () => {
    if (cartItems.length === 0) return;
    const itemsList = cartItems
      .map((item) => `• ${item.quantity}x ${item.product.name} - $${(item.product.priceMinorista * item.quantity).toLocaleString('es-AR')}`)
      .join('\n');
    const msg = `*CONSULTA DE PRESUPUESTO - WEB FERRETERÍA BRUZZONE*\n\nHola, quisiera consultar stock y cotización para los siguientes artículos:\n\n${itemsList}\n\n*Total Estimado:* $${cartTotal.toLocaleString('es-AR')}\n\n¿Tienen disponibilidad para entrega en Alejandro Roca o retiro en mostrador? ¡Gracias!`;
    window.open(`https://wa.me/5493584354998?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50 text-slate-800 font-sans custom-scrollbar select-none">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-sm flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="h-10 w-36 rounded-xl bg-white flex items-center justify-center p-1 shadow-md border border-slate-200 overflow-hidden shrink-0">
            <img 
              src={store.settings.logoUrl || '/assets/aistudio/image_1ec283c6.png'} 
              alt="Logo Empresa" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-600">
          <a href="#catalog-section" className="hover:text-blue-600 transition-colors">Inicio</a>
          <a href="#catalog-section" className="hover:text-blue-600 transition-colors">Productos</a>
          <a href="#services-section" className="hover:text-blue-600 transition-colors">Servicios</a>
          <a href="#contact-section" className="hover:text-blue-600 transition-colors">Contacto</a>
        </nav>

        {/* Right Navigation Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Cart / Quotation Button */}
          {landingMode === 'ecommerce' && (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Ver Cotizador / Carrito"
            >
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
          )}

          {/* Portal Clientes */}
          <button
            type="button"
            onClick={() => onOpenAuthModal('ctacte')}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all"
            title="Portal de Clientes Cuenta Corriente"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Portal de Clientes</span>
          </button>

          {/* INGRESAR BUTTON */}
          <button
            type="button"
            onClick={() => onOpenAuthModal('staff')}
            className="px-4 sm:px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Ingresar</span>
          </button>
        </div>
      </header>

      {/* Main Website Content */}
      <main className="flex-1 space-y-8 pb-16">
        {/* HERO SECTION (Deep royal blue background matching legacy reference #0b3d91) */}
        <section className="relative bg-[#0b3d91] text-white pt-16 pb-20 px-4 sm:px-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:24px_24px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto space-y-8 relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white text-xs font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Tu ferretería de confianza en Alejandro Roca y región</span>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                Todo para tu <span className="text-orange-500 underline decoration-orange-400/70 decoration-wavy">obra y hogar</span>
              </h1>
              <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed font-normal">
                Más de 20.000 productos en stock. Herramientas, materiales, bulonería, electricidad y mucho más. Atención personalizada para profesionales y particulares.
              </p>
            </div>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href="#catalog-section"
                className="px-7 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-xl shadow-orange-600/30 flex items-center space-x-2.5 transition-all transform hover:-translate-y-0.5"
              >
                <span>Ver Tienda Online</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => onOpenAuthModal('ctacte')}
                className="px-7 py-4 rounded-xl bg-[#082a6c] hover:bg-[#062054] text-white font-bold text-sm border border-blue-400/50 shadow-lg flex items-center space-x-2.5 transition-all"
              >
                <Building2 className="w-4 h-4 text-orange-400" />
                <span>Portal Mayorista</span>
              </button>
            </div>

            {/* 4 Metric Cards in Hero */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-5xl mx-auto">
              <div className="bg-[#09327d]/90 backdrop-blur-md border border-blue-400/30 rounded-2xl p-5 text-center shadow-xl">
                <span className="text-3xl sm:text-4xl font-black text-orange-400 block tracking-tight">20.000+</span>
                <span className="text-xs text-blue-100 font-medium uppercase tracking-wider mt-1 block">Productos</span>
              </div>
              <div className="bg-[#09327d]/90 backdrop-blur-md border border-blue-400/30 rounded-2xl p-5 text-center shadow-xl">
                <span className="text-3xl sm:text-4xl font-black text-orange-400 block tracking-tight">100+</span>
                <span className="text-xs text-blue-100 font-medium uppercase tracking-wider mt-1 block">Marcas</span>
              </div>
              <div className="bg-[#09327d]/90 backdrop-blur-md border border-blue-400/30 rounded-2xl p-5 text-center shadow-xl">
                <span className="text-3xl sm:text-4xl font-black text-orange-400 block tracking-tight">30+</span>
                <span className="text-xs text-blue-100 font-medium uppercase tracking-wider mt-1 block">Años de experiencia</span>
              </div>
              <div className="bg-[#09327d]/90 backdrop-blur-md border border-blue-400/30 rounded-2xl p-5 text-center shadow-xl">
                <span className="text-3xl sm:text-4xl font-black text-orange-400 block tracking-tight">Envíos</span>
                <span className="text-xs text-blue-100 font-medium uppercase tracking-wider mt-1 block">A toda la zona</span>
              </div>
            </div>
          </div>
        </section>

        {/* ORANGE PROMO BANNER */}
        <section className="bg-amber-500 text-slate-950 py-3 px-4 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-xs sm:text-sm font-black tracking-tight text-center">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>5% OFF en todos los productos — Descuento aplicado automáticamente en compras de contado</span>
          </div>
        </section>

        {/* CATEGORY FILTER PILLS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* FEATURED PRODUCTS SECTION */}
        <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Productos Destacados</h2>
              <p className="text-xs text-slate-500">
                Encontrá lo que necesitás al mejor precio con stock disponible para entrega inmediata.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artículo, código o marca..."
                className="w-full bg-white text-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.slice(0, 32).map((product) => {
              const inCart = cartItems.find((i) => i.product.id === product.id);
              const listPrice = Math.round(product.priceMinorista * 1.12);

              return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl flex flex-col justify-between transition-all group"
                >
                  {/* Image Container with Badges */}
                  <div className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center p-4 border-b border-slate-100">
                    {/* Top Left Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                      <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] shadow flex items-center space-x-1">
                        <span>⭐ Dest.</span>
                      </span>
                      {product.stock <= 3 && (
                        <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-black text-[10px] shadow uppercase tracking-wide">
                          Bajo Stock
                        </span>
                      )}
                    </div>

                    {/* Brand or Code top right */}
                    {product.brandName && (
                      <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-800 border border-slate-200 shadow-sm">
                        {product.brandName}
                      </div>
                    )}

                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                        <HardHat className="w-12 h-12 mb-1 opacity-40" />
                        <span className="text-[10px] font-mono">{product.code}</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-2 leading-snug">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        SKU: {product.code}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400 line-through">
                            ${listPrice.toLocaleString('es-AR')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-black uppercase">
                            Oferta
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-rose-600 tracking-tight">
                            ${product.priceMinorista.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper & Add Button (Shopify / Tiendanube Style) */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (inCart && inCart.quantity > 1) {
                                setCartItems(cartItems.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity - 1 } : i));
                              } else {
                                handleRemoveFromCart(product.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-200 shadow-sm transition-colors text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-slate-900 px-3">
                            {inCart ? inCart.quantity : 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-200 shadow-sm transition-colors text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center justify-center space-x-1.5 transition-all"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{inCart ? 'Actualizar' : 'Añadir'}</span>
                          </button>

                          <a
                            href={`https://wa.me/5493584354998?text=${encodeURIComponent(
                              `Hola, consulto por disponibilidad y precio de ${product.name} (SKU: ${product.code}) en Ferretería Bruzzone.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* WHY CHOOSE US SECTION */}
        <section id="services-section" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-slate-900">¿Por qué elegirnos?</h3>
            <p className="text-xs text-slate-500">Ofrecemos la mejor experiencia de compra con atención personalizada</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Hammer className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Herramientas &amp; Materiales</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Amplio stock de herramientas manuales y eléctricas de las mejores marcas del mercado.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Envíos a Toda la Zona</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Realizamos envíos diarios a Alejandro Roca y toda la región de influencia. Consultá por tu localidad.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Formas de Pago Flexibles</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Efectivo, tarjetas, transferencias bancarias, MercadoPago y cuentas corrientes comerciales.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Atención Mayorista</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Precios especiales y condiciones preferenciales para comercios, constructoras y profesionales.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Garantía Oficial</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Todos nuestros productos cuentan con garantía oficial de fábrica y soporte técnico autorizado.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Trayectoria &amp; Confianza</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Más de 30 años acompañando el crecimiento de nuestra comunidad con honestidad y asesoramiento.
              </p>
            </div>
          </div>
        </section>

        {/* B2B / PROFESSIONAL BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="bg-blue-600 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase">
                Portal Comercial B2B
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">¿Sos comerciante o profesional?</h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                Registrate en nuestro portal mayorista y accedé a precios exclusivos, cuenta corriente comercial y seguimiento detallado de tus pedidos y remitos.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => onOpenAuthModal('ctacte')}
                className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center space-x-2 transition-all"
              >
                <span>Portal Mayorista</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact-section" className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-black text-slate-900">Contacto</h3>
            <p className="text-xs text-slate-500">Estamos para ayudarte en lo que necesites</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Dirección</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Doctor Carlos I. Rocha 129 / 2886, ALEJANDRO ROCA, CÓRDOBA
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Teléfono &amp; WhatsApp</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                3585142098 / +54 9 358 435-4998
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Horario de Atención</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lunes a Viernes: 7:30 a 12:00 / 15:30 a 19:30<br />Sábados: 8:00 a 12:30
              </p>
            </div>
          </div>

          {/* Google Maps Location Embed */}
          <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-black text-slate-900">Ubicación en Google Maps — Doctor Carlos I. Rocha 129, Alejandro Roca, Córdoba</h4>
              </div>
              <a
                href="https://maps.google.com/?q=Doctor+Carlos+I.+Rocha+129,+Alejandro+Roca,+Cordoba"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center space-x-1 transition-all"
              >
                <span>Ampliar Mapa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <iframe
                title="Ubicación Ferretería Bruzzone"
                src="https://maps.google.com/maps?q=Doctor+Carlos+I.+Rocha+129,+Alejandro+Roca,+Cordoba+Argentina&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 font-medium pt-2">
            ✉️ bruzzoneferreteria@gmail.com
          </div>
        </section>
      </main>

      {/* Cart / Quotation Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-slate-900 text-base">Presupuesto de Materiales</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {cartItems.length === 0 ? (
                  <p className="text-center text-slate-400 py-10 text-xs">
                    El carrito de cotización está vacío. Agregá productos desde el catálogo.
                  </p>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 max-w-[200px]">
                        <p className="font-black text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-blue-600 font-bold">
                          ${item.product.priceMinorista.toLocaleString('es-AR')} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900">
                          ${(item.product.priceMinorista * item.quantity).toLocaleString('es-AR')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold text-xs p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-600">Total Estimado:</span>
                <span className="text-xl font-black text-blue-600">
                  ${cartTotal.toLocaleString('es-AR')}
                </span>
              </div>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={handleSendWhatsAppQuote}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Presupuesto por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Seguir Viendo Productos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Website Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 px-4 sm:px-8 text-xs space-y-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-24 rounded bg-white flex items-center justify-center p-0.5 overflow-hidden">
                <img 
                  src={store.settings.logoUrl || '/assets/aistudio/image_1ec283c6.png'} 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="font-black text-white text-sm">{store.settings.tradeName || 'Colorear Pinturas'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fábrica de Pinturas & Asesoramiento técnico. Calidad profesional al servicio de pinturerías, constructoras y hogares.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Enlaces Rápidos</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#catalog-section" className="hover:text-amber-400 transition-colors">Tienda Online</a></li>
              <li><button onClick={() => onOpenAuthModal('ctacte')} className="hover:text-amber-400 transition-colors">Portal Mayorista</button></li>
              <li><button onClick={() => onOpenAuthModal('ctacte')} className="hover:text-amber-400 transition-colors">Portal de Clientes</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Contacto</h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>Doctor Carlos I. Rocha 129, Alejandro Roca</li>
              <li>Tel: 3585142098</li>
              <li>Email: bruzzoneferreteria@gmail.com</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Acceso Administrativo</h4>
            <p className="text-[11px] text-slate-400">
              ¿Sos personal del sistema? Ingresá al ERP integral con control de stock, caja, ventas y compras.
            </p>
            <button
              type="button"
              onClick={() => onOpenAuthModal('staff')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 transition-all shadow"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ingresar al ERP</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <span>© 2026 Ferretería Bruzzone. Todos los derechos reservados.</span>
          <span className="mt-2 sm:mt-0">Diseño limpio y profesional inspirado en el sistema tradicional.</span>
        </div>
      </footer>
    </div>
  );
};
