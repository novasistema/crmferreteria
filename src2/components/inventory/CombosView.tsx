import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCombo, ComboItem } from '../../types';
import {
  Layers,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Package,
  Ticket,
  Tag,
  Calendar,
  Percent,
  Sparkles,
  Search,
  Clock,
  DollarSign,
  TrendingDown,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
} from 'lucide-react';

export interface PromotionRule {
  id: string;
  name: string;
  type: 'rubro_percent' | 'brand_percent' | 'two_for_one' | 'three_for_two' | 'happy_hour';
  targetCategory?: string;
  targetBrand?: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday... 6=Saturday
  active: boolean;
  minPurchaseAmount?: number;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  active: boolean;
}

const INITIAL_PROMOTIONS: PromotionRule[] = [
  {
    id: 'promo-1',
    name: 'Super Jueves de Pinturas y Revestimientos',
    type: 'rubro_percent',
    targetCategory: 'Pinturería',
    discountPercentage: 15,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    daysOfWeek: [4], // Jueves
    active: true,
    minPurchaseAmount: 15000,
  },
  {
    id: 'promo-2',
    name: 'Semana Stanley & DeWalt (10% OFF Contado)',
    type: 'brand_percent',
    targetBrand: 'Stanley',
    discountPercentage: 10,
    startDate: '2026-08-01',
    endDate: '2026-09-15',
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    active: true,
  },
  {
    id: 'promo-3',
    name: '2x1 Discos de Corte y Abrasivos Norton',
    type: 'two_for_one',
    targetCategory: 'Abrasivos',
    discountPercentage: 50,
    startDate: '2026-08-15',
    endDate: '2026-09-30',
    daysOfWeek: [5, 6], // Viernes y Sábado
    active: true,
  },
];

const INITIAL_COUPONS: DiscountCoupon[] = [
  {
    id: 'cup-1',
    code: 'OBRAPRO10',
    description: '10% de descuento en compras mayores a $100.000',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 100000,
    maxUses: 50,
    currentUses: 18,
    expiresAt: '2026-12-31',
    active: true,
  },
  {
    id: 'cup-2',
    code: 'BIENVENIDO5000',
    description: '$5.000 de regalo en primera compra en mostrador',
    discountType: 'fixed_amount',
    discountValue: 5000,
    minOrderAmount: 30000,
    maxUses: 100,
    currentUses: 42,
    expiresAt: '2026-10-31',
    active: true,
  },
  {
    id: 'cup-3',
    code: 'HERRAMIENTAS15',
    description: '15% OFF en máquinas eléctricas para profesionales',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 80000,
    maxUses: 30,
    currentUses: 9,
    expiresAt: '2026-09-30',
    active: true,
  },
];

export const CombosView: React.FC = () => {
  const { store, showToast, activeModule } = useApp();

  const [activeTab, setActiveTab] = useState<'combos' | 'promotions' | 'coupons'>('combos');

  // Sync activeTab with activeModule navigation
  useEffect(() => {
    if (activeModule === 'coupons_offers') {
      setActiveTab('coupons');
    } else if (activeModule === 'promotions') {
      setActiveTab('promotions');
    } else if (activeModule === 'combos') {
      setActiveTab('combos');
    }
  }, [activeModule]);

  // Combos State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ProductCombo | null>(null);
  const [comboName, setComboName] = useState('');
  const [comboCode, setComboCode] = useState('');
  const [comboDescription, setComboDescription] = useState('');
  const [comboPrice, setComboPrice] = useState<number>(0);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [selectedAddProdId, setSelectedAddProdId] = useState('');

  // Promotions State
  const [promotions, setPromotions] = useState<PromotionRule[]>(INITIAL_PROMOTIONS);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionRule | null>(null);
  const [promoName, setPromoName] = useState('');
  const [promoType, setPromoType] = useState<PromotionRule['type']>('rubro_percent');
  const [promoCategory, setPromoCategory] = useState('Pinturería');
  const [promoBrand, setPromoBrand] = useState('Stanley');
  const [promoDiscount, setPromoDiscount] = useState<number>(10);
  const [promoStartDate, setPromoStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [promoEndDate, setPromoEndDate] = useState('2026-12-31');
  const [promoMinPurchase, setPromoMinPurchase] = useState<number>(0);
  const [promoDays, setPromoDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  // Coupons State
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(INITIAL_COUPONS);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [couponVal, setCouponVal] = useState<number>(10);
  const [couponMinOrder, setCouponMinOrder] = useState<number>(0);
  const [couponMaxUses, setCouponMaxUses] = useState<number>(50);
  const [couponExpiry, setCouponExpiry] = useState('2026-12-31');
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  // Combos Handlers
  const handleOpenNew = () => {
    setEditingCombo(null);
    setComboName('');
    setComboCode(`KIT-${Date.now().toString().slice(-4)}`);
    setComboDescription('');
    setComboPrice(0);
    setComboItems([]);
    setIsModalOpen(true);
  };

  const handleAddItemToCombo = () => {
    if (!selectedAddProdId) return;
    const prod = store.products.find((p) => p.id === selectedAddProdId);
    if (!prod) return;

    setComboItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitPrice: prod.priceMinorista,
      },
    ]);
    setSelectedAddProdId('');
  };

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (comboItems.length === 0) {
      showToast('Agregue al menos un producto al combo', 'error');
      return;
    }

    const regularSum = comboItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const discount = regularSum > 0 ? Math.round(((regularSum - comboPrice) / regularSum) * 100) : 0;

    const newCombo: ProductCombo = {
      id: editingCombo ? editingCombo.id : `combo-${Date.now()}`,
      code: comboCode.toUpperCase(),
      name: comboName,
      description: comboDescription,
      price: comboPrice,
      discountPercentage: Math.max(0, discount),
      items: comboItems,
      active: true,
    };

    const idx = store.combos.findIndex((c) => c.id === newCombo.id);
    if (idx >= 0) {
      store.combos[idx] = newCombo;
    } else {
      store.combos.unshift(newCombo);
    }
    showToast('Combo guardado con éxito', 'success');
    setIsModalOpen(false);
  };

  const handleDeleteCombo = (id: string) => {
    if (confirm('¿Está seguro de eliminar este combo?')) {
      const idx = store.combos.findIndex((c) => c.id === id);
      if (idx >= 0) {
        store.combos.splice(idx, 1);
        showToast('Combo eliminado', 'info');
      }
    }
  };

  // Promotions Handlers
  const handleOpenNewPromo = () => {
    setEditingPromo(null);
    setPromoName('');
    setPromoType('rubro_percent');
    setPromoCategory(store.categories[0]?.name || 'Herramientas');
    setPromoBrand(store.brands[0]?.name || 'Stanley');
    setPromoDiscount(15);
    setPromoStartDate(new Date().toISOString().slice(0, 10));
    setPromoEndDate('2026-12-31');
    setPromoMinPurchase(0);
    setPromoDays([1, 2, 3, 4, 5, 6]);
    setIsPromoModalOpen(true);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const newPromo: PromotionRule = {
      id: editingPromo ? editingPromo.id : `promo-${Date.now()}`,
      name: promoName,
      type: promoType,
      targetCategory: promoType === 'rubro_percent' || promoType === 'two_for_one' ? promoCategory : undefined,
      targetBrand: promoType === 'brand_percent' ? promoBrand : undefined,
      discountPercentage: promoType === 'two_for_one' ? 50 : promoType === 'three_for_two' ? 33.3 : promoDiscount,
      startDate: promoStartDate,
      endDate: promoEndDate,
      daysOfWeek: promoDays,
      minPurchaseAmount: promoMinPurchase,
      active: true,
    };

    if (editingPromo) {
      setPromotions((prev) => prev.map((p) => (p.id === editingPromo.id ? newPromo : p)));
      showToast('Promoción actualizada con éxito', 'success');
    } else {
      setPromotions((prev) => [newPromo, ...prev]);
      showToast('Regla de promoción creada con éxito', 'success');
    }
    setIsPromoModalOpen(false);
  };

  const togglePromoStatus = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
    showToast('Estado de promoción actualizado', 'info');
  };

  const handleDeletePromo = (id: string) => {
    if (confirm('¿Eliminar esta promoción?')) {
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      showToast('Promoción eliminada', 'info');
    }
  };

  // Coupons Handlers
  const handleOpenNewCoupon = () => {
    setEditingCoupon(null);
    setCouponCode(`PROMO-${Math.floor(1000 + Math.random() * 9000)}`);
    setCouponDesc('');
    setCouponType('percentage');
    setCouponVal(10);
    setCouponMinOrder(20000);
    setCouponMaxUses(50);
    setCouponExpiry('2026-12-31');
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const newCoupon: DiscountCoupon = {
      id: editingCoupon ? editingCoupon.id : `cup-${Date.now()}`,
      code: couponCode.trim().toUpperCase(),
      description: couponDesc,
      discountType: couponType,
      discountValue: couponVal,
      minOrderAmount: couponMinOrder,
      maxUses: couponMaxUses,
      currentUses: editingCoupon ? editingCoupon.currentUses : 0,
      expiresAt: couponExpiry,
      active: true,
    };

    if (editingCoupon) {
      setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? newCoupon : c)));
      showToast('Cupón actualizado correctamente', 'success');
    } else {
      setCoupons((prev) => [newCoupon, ...prev]);
      showToast('Cupón de descuento creado con éxito', 'success');
    }
    setIsCouponModalOpen(false);
  };

  const toggleCouponStatus = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
    showToast('Estado de cupón actualizado', 'info');
  };

  const handleDeleteCoupon = (id: string) => {
    if (confirm('¿Eliminar este cupón de descuento?')) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      showToast('Cupón eliminado', 'info');
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponCode(code);
    setTimeout(() => setCopiedCouponCode(null), 2000);
    showToast(`Código ${code} copiado al portapapeles`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Combos, Ofertas & Cupones</h2>
            <p className="text-xs text-slate-400">
              Gestión de packs de obra, promociones automáticas por rubro y cupones de descuento para mostrador y web
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('combos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'combos'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combos & Kits ({store.combos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'promotions'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Ofertas & Promos ({promotions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Cupones ({coupons.length})</span>
          </button>
        </div>

        {/* Top Action Button */}
        <div>
          {activeTab === 'combos' && (
            <button
              onClick={handleOpenNew}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Combo</span>
            </button>
          )}
          {activeTab === 'promotions' && (
            <button
              onClick={handleOpenNewPromo}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Promoción</span>
            </button>
          )}
          {activeTab === 'coupons' && (
            <button
              onClick={handleOpenNewCoupon}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Cupón</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* ================= TAB 1: COMBOS & KITS ================= */}
        {activeTab === 'combos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {store.combos.map((combo) => {
              const regularPrice = combo.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
              return (
                <div
                  key={combo.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {combo.code}
                      </span>
                      {combo.discountPercentage > 0 && (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {combo.discountPercentage}% OFF
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1">{combo.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{combo.description}</p>

                    {/* Items included */}
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Productos Incluidos:
                      </span>
                      {combo.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-300">
                          <span className="truncate pr-2">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="text-slate-400 shrink-0 font-mono">
                            ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 line-through block font-mono">
                        ${regularPrice.toLocaleString('es-AR')}
                      </span>
                      <span className="text-base font-black text-amber-400 font-mono">
                        ${combo.price.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingCombo(combo);
                          setComboName(combo.name);
                          setComboCode(combo.code);
                          setComboDescription(combo.description);
                          setComboPrice(combo.price);
                          setComboItems(combo.items);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Editar combo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCombo(combo.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Eliminar combo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= TAB 2: PROMOTIONS ================= */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map((promo) => {
                const daysLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                return (
                  <div
                    key={promo.id}
                    className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                      promo.active ? 'border-slate-800 hover:border-amber-500/40' : 'border-slate-800/50 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {promo.type === 'rubro_percent' && 'Descuento x Rubro'}
                          {promo.type === 'brand_percent' && 'Descuento x Marca'}
                          {promo.type === 'two_for_one' && 'Promo 2x1'}
                          {promo.type === 'three_for_two' && 'Promo 3x2'}
                          {promo.type === 'happy_hour' && 'Happy Hour'}
                        </span>
                        <button
                          onClick={() => togglePromoStatus(promo.id)}
                          className="text-xs font-semibold flex items-center space-x-1"
                        >
                          {promo.active ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                              <span className="text-[10px]">Activa</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <ToggleLeft className="w-5 h-5 text-slate-500" />
                              <span className="text-[10px]">Pausada</span>
                            </span>
                          )}
                        </button>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1.5">{promo.name}</h3>

                      <div className="space-y-1 text-xs text-slate-400">
                        {promo.targetCategory && (
                          <div className="flex items-center justify-between">
                            <span>Rubro aplicable:</span>
                            <span className="text-slate-200 font-semibold">{promo.targetCategory}</span>
                          </div>
                        )}
                        {promo.targetBrand && (
                          <div className="flex items-center justify-between">
                            <span>Marca aplicable:</span>
                            <span className="text-slate-200 font-semibold">{promo.targetBrand}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>Beneficio:</span>
                          <span className="text-emerald-400 font-bold font-mono text-sm">
                            {promo.discountPercentage}% OFF
                          </span>
                        </div>
                        {promo.minPurchaseAmount && promo.minPurchaseAmount > 0 ? (
                          <div className="flex items-center justify-between">
                            <span>Compra mínima:</span>
                            <span className="text-slate-300 font-mono font-semibold">
                              ${promo.minPurchaseAmount.toLocaleString('es-AR')}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Days of week active */}
                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 mr-1">Días:</span>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                          const isIncluded = promo.daysOfWeek.includes(day);
                          return (
                            <span
                              key={day}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isIncluded
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-950 text-slate-600'
                              }`}
                            >
                              {daysLabels[day]}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span className="text-[10px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Hasta {new Date(promo.endDate).toLocaleDateString('es-AR')}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingPromo(promo);
                            setPromoName(promo.name);
                            setPromoType(promo.type);
                            setPromoCategory(promo.targetCategory || 'Pinturería');
                            setPromoBrand(promo.targetBrand || 'Stanley');
                            setPromoDiscount(promo.discountPercentage);
                            setPromoStartDate(promo.startDate);
                            setPromoEndDate(promo.endDate);
                            setPromoMinPurchase(promo.minPurchaseAmount || 0);
                            setPromoDays(promo.daysOfWeek);
                            setIsPromoModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: COUPONS ================= */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => {
                const isExpired = new Date(coupon.expiresAt) < new Date();
                const usagePercent = Math.min(100, Math.round((coupon.currentUses / coupon.maxUses) * 100));

                return (
                  <div
                    key={coupon.id}
                    className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm ${
                      coupon.active && !isExpired
                        ? 'border-slate-800 hover:border-amber-500/40'
                        : 'border-slate-800/50 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Top Code Badge and Action */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black font-mono tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5">
                            <Ticket className="w-3.5 h-3.5" />
                            <span>{coupon.code}</span>
                          </span>
                          <button
                            onClick={() => handleCopyCoupon(coupon.code)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                            title="Copiar código"
                          >
                            {copiedCouponCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => toggleCouponStatus(coupon.id)}
                          className="text-xs font-semibold flex items-center space-x-1"
                        >
                          {coupon.active && !isExpired ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                              <span className="text-[10px]">Activo</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <ToggleLeft className="w-5 h-5 text-slate-500" />
                              <span className="text-[10px]">{isExpired ? 'Vencido' : 'Pausado'}</span>
                            </span>
                          )}
                        </button>
                      </div>

                      <p className="text-xs font-semibold text-slate-200 mt-2">{coupon.description}</p>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                        <div className="flex justify-between items-center">
                          <span>Descuento aplicado:</span>
                          <span className="text-amber-400 font-black font-mono">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% OFF`
                              : `$${coupon.discountValue.toLocaleString('es-AR')} OFF`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Mínimo de compra:</span>
                          <span className="text-slate-300 font-mono">
                            ${coupon.minOrderAmount.toLocaleString('es-AR')}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Vigencia hasta:</span>
                          <span className="text-slate-300 font-mono">
                            {new Date(coupon.expiresAt).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {/* Usage bar */}
                      <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Usos: {coupon.currentUses} / {coupon.maxUses}</span>
                          <span>{usagePercent}% consumido</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingCoupon(coupon);
                          setCouponCode(coupon.code);
                          setCouponDesc(coupon.description);
                          setCouponType(coupon.discountType);
                          setCouponVal(coupon.discountValue);
                          setCouponMinOrder(coupon.minOrderAmount);
                          setCouponMaxUses(coupon.maxUses);
                          setCouponExpiry(coupon.expiresAt);
                          setIsCouponModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: COMBO ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>{editingCombo ? 'Editar Combo' : 'Crear Combo / Pack'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCombo} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Código Promoción *</label>
                  <input
                    type="text"
                    required
                    value={comboCode}
                    onChange={(e) => setComboCode(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700 uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Precio Final del Combo ($) *</label>
                  <input
                    type="number"
                    required
                    value={comboPrice}
                    onChange={(e) => setComboPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-amber-400 font-bold rounded-lg p-2 border border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Nombre del Combo *</label>
                <input
                  type="text"
                  required
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  placeholder="Ej: Kit Herrero Pro Amoladora + 10 Discos..."
                  className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={comboDescription}
                  onChange={(e) => setComboDescription(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                />
              </div>

              {/* Add item to combo */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 uppercase text-[11px] block">
                  Artículos que integran el combo
                </span>
                <div className="flex space-x-2">
                  <select
                    value={selectedAddProdId}
                    onChange={(e) => setSelectedAddProdId(e.target.value)}
                    className="flex-1 bg-slate-900 text-white rounded-lg p-2 border border-slate-700"
                  >
                    <option value="">Seleccione producto para añadir...</option>
                    {store.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.priceMinorista.toLocaleString('es-AR')})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddItemToCombo}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>

                <div className="space-y-1 pt-2">
                  {comboItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800"
                    >
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-amber-400">${item.unitPrice.toLocaleString('es-AR')}</span>
                        <button
                          type="button"
                          onClick={() => setComboItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow cursor-pointer"
                >
                  Guardar Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PROMOTION ================= */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <span>{editingPromo ? 'Editar Promoción' : 'Nueva Oferta / Promoción'}</span>
              </h3>
              <button onClick={() => setIsPromoModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Nombre de la Promoción *</label>
                <input
                  type="text"
                  required
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="Ej: Jueves de Pinturas 15% OFF..."
                  className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tipo de Promoción</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as any)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  >
                    <option value="rubro_percent">% Descuento por Rubro</option>
                    <option value="brand_percent">% Descuento por Marca</option>
                    <option value="two_for_one">Promo 2x1</option>
                    <option value="three_for_two">Promo 3x2</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">% Descuento</label>
                  <input
                    type="number"
                    disabled={promoType === 'two_for_one' || promoType === 'three_for_two'}
                    value={promoType === 'two_for_one' ? 50 : promoType === 'three_for_two' ? 33 : promoDiscount}
                    onChange={(e) => setPromoDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-amber-400 font-bold rounded-lg p-2 border border-slate-700 disabled:opacity-50"
                  />
                </div>
              </div>

              {promoType === 'rubro_percent' || promoType === 'two_for_one' || promoType === 'three_for_two' ? (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Rubro / Categoría Aplicable</label>
                  <select
                    value={promoCategory}
                    onChange={(e) => setPromoCategory(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  >
                    {store.categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {promoType === 'brand_percent' ? (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Marca Aplicable</label>
                  <select
                    value={promoBrand}
                    onChange={(e) => setPromoBrand(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  >
                    {store.brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Vigencia Desde</label>
                  <input
                    type="date"
                    value={promoStartDate}
                    onChange={(e) => setPromoStartDate(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Vigencia Hasta</label>
                  <input
                    type="date"
                    value={promoEndDate}
                    onChange={(e) => setPromoEndDate(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Monto Mínimo de Compra ($)</label>
                <input
                  type="number"
                  value={promoMinPurchase}
                  onChange={(e) => setPromoMinPurchase(parseFloat(e.target.value) || 0)}
                  placeholder="0 para sin mínimo"
                  className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow cursor-pointer"
                >
                  Guardar Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: COUPON ================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <span>{editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón de Descuento'}</span>
              </h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Código del Cupón *</label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ej: OBRAPRO15"
                    className="w-full bg-slate-950 text-amber-300 font-mono font-bold rounded-lg p-2 border border-slate-700 uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tipo de Descuento</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  >
                    <option value="percentage">Porcentaje (% OFF)</option>
                    <option value="fixed_amount">Monto Fijo ($ Pesos)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Valor del Descuento ({couponType === 'percentage' ? '%' : '$'}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={couponVal}
                    onChange={(e) => setCouponVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-amber-400 font-bold rounded-lg p-2 border border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Mínimo de Compra ($)</label>
                  <input
                    type="number"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Descripción / Condiciones</label>
                <input
                  type="text"
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  placeholder="Ej: Descuento aplicable en mostrador para compras mayores a..."
                  className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Límite de Usos Totales</label>
                  <input
                    type="number"
                    value={couponMaxUses}
                    onChange={(e) => setCouponMaxUses(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Fecha de Expiración</label>
                  <input
                    type="date"
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                    className="w-full bg-slate-950 text-white rounded-lg p-2 border border-slate-700"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow cursor-pointer"
                >
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
