import React, { useState } from 'react';
import { 
  Package, 
  Boxes, 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  X, 
  ShoppingCart, 
  Calculator, 
  Percent, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Product, ComboPack, ComboProductItem } from '../../types';

interface CombosModuleProps {
  products: Product[];
}

const INITIAL_COMBOS: ComboPack[] = [
  {
    id: 'c-1',
    code: 'COMB-BORD',
    name: 'BORDEADORA A BATERIA + BATERIA+CARGADOR',
    active: true,
    publishEcommerce: false,
    pricingMethod: 'cost',
    profitPercent: 40,
    ivaPercent: 21,
    finalPrice: 309460.38,
    items: [
      { productId: 'p1', code: 'BORD-BAT', name: 'Bordadora a Batería 20V', quantity: 1, unitCost: 145000, unitPrice: 220000 },
      { productId: 'p2', code: 'BAT-4AH', name: 'Batería Litio 4Ah', quantity: 1, unitCost: 42000, unitPrice: 65000 },
      { productId: 'p3', code: 'CARG-RAP', name: 'Cargador Rápido 20V', quantity: 1, unitCost: 28000, unitPrice: 42000 }
    ],
    createdAt: '2026-10-15'
  },
  {
    id: 'c-2',
    code: 'DISX5',
    name: 'DISCO CORTE KAWA X5',
    active: true,
    publishEcommerce: false,
    pricingMethod: 'price',
    profitPercent: 0,
    discountPercent: 15,
    ivaPercent: 21,
    finalPrice: 3870.43,
    items: [
      { productId: 'p4', code: 'DISC-KAW-115', name: 'Disco de Corte Kawa 115mm', quantity: 5, unitCost: 520, unitPrice: 910 }
    ],
    createdAt: '2026-10-18'
  },
  {
    id: 'c-3',
    code: '887277',
    name: 'CINTA 2X1',
    active: true,
    publishEcommerce: false,
    pricingMethod: 'cost',
    profitPercent: 0,
    ivaPercent: 21,
    finalPrice: 1006.55,
    items: [
      { productId: 'p5', code: 'CINT-EMB', name: 'Cinta Embalar 48x40', quantity: 2, unitCost: 415, unitPrice: 650 }
    ],
    createdAt: '2026-10-19'
  },
  {
    id: 'c-4',
    code: 'COM-ASAD',
    name: 'ASADOR',
    active: true,
    publishEcommerce: false,
    pricingMethod: 'cost',
    profitPercent: 174,
    ivaPercent: 21,
    finalPrice: 40116.34,
    items: [
      { productId: 'p6', code: 'PARR-PORT', name: 'Parrilla Portátil Plegable', quantity: 1, unitCost: 12000, unitPrice: 28000 },
      { productId: 'p7', code: 'SET-ASAD', name: 'Set Cubiertos Asador Inox', quantity: 1, unitCost: 4500, unitPrice: 11000 }
    ],
    createdAt: '2026-10-20'
  },
  {
    id: 'c-5',
    code: 'COM-PACKOUT',
    name: 'COMBO PACKOUT X4',
    active: true,
    publishEcommerce: true,
    pricingMethod: 'cost',
    profitPercent: 45,
    ivaPercent: 21,
    finalPrice: 174088.03,
    items: [
      { productId: 'p8', code: 'PACK-01', name: 'Caja Herramientas Rodante', quantity: 1, unitCost: 55000, unitPrice: 85000 },
      { productId: 'p9', code: 'PACK-02', name: 'Organizador Modular Mediano', quantity: 2, unitCost: 22000, unitPrice: 34000 },
      { productId: 'p10', code: 'PACK-03', name: 'Maletín Compacto Packout', quantity: 1, unitCost: 19000, unitPrice: 29000 }
    ],
    createdAt: '2026-10-22'
  },
  {
    id: 'c-6',
    code: 'COM-03',
    name: 'COMBO ELECTRICISTA',
    active: true,
    publishEcommerce: true,
    pricingMethod: 'cost',
    profitPercent: 40,
    ivaPercent: 21,
    finalPrice: 35549.39,
    items: [
      { productId: 'p11', code: 'PINZ-UNIV', name: 'Pinza Universal Aislada 1000V', quantity: 1, unitCost: 6500, unitPrice: 9800 },
      { productId: 'p12', code: 'DEST-JUEG', name: 'Juego Destornilladores Aislados', quantity: 1, unitCost: 8200, unitPrice: 12500 },
      { productId: 'p13', code: 'TEST-DIG', name: 'Buscapolo Digital Inductivo', quantity: 1, unitCost: 4100, unitPrice: 6200 }
    ],
    createdAt: '2026-10-24'
  }
];

export const CombosModule: React.FC<CombosModuleProps> = ({ products }) => {
  const [combos, setCombos] = useState<ComboPack[]>(INITIAL_COMBOS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCombo, setViewingCombo] = useState<ComboPack | null>(null);

  // Form state
  const [comboName, setComboName] = useState('');
  const [comboSku, setComboSku] = useState('');
  const [comboDesc, setComboDesc] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isEcommerce, setIsEcommerce] = useState(false);
  const [pricingMethod, setPricingMethod] = useState<'cost' | 'price'>('cost');
  const [profitPercent, setProfitPercent] = useState<number>(30);
  const [ivaPercent, setIvaPercent] = useState<number>(21);
  const [selectedItems, setSelectedItems] = useState<ComboProductItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const filteredCombos = combos.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateFinalPrice = () => {
    if (selectedItems.length === 0) return 0;
    if (pricingMethod === 'cost') {
      const totalCost = selectedItems.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
      const withProfit = totalCost * (1 + (profitPercent || 0) / 100);
      const withIva = withProfit * (1 + (ivaPercent || 0) / 100);
      return Math.round(withIva * 100) / 100;
    } else {
      const totalPrice = selectedItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
      return Math.round(totalPrice * 100) / 100;
    }
  };

  const handleOpenNewModal = () => {
    setComboName('');
    setComboSku(`COMBO-${Math.floor(100 + Math.random() * 900)}`);
    setComboDesc('');
    setIsActive(true);
    setIsEcommerce(false);
    setPricingMethod('cost');
    setProfitPercent(30);
    setIvaPercent(21);
    setSelectedItems([]);
    setProductSearch('');
    setIsModalOpen(true);
  };

  const handleAddProductToCombo = (prod: Product) => {
    const existing = selectedItems.find(i => i.productId === prod.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: prod.id,
          code: prod.code,
          name: prod.name,
          quantity: 1,
          unitCost: prod.unitCost || 1000,
          unitPrice: prod.priceRetail || 1500
        }
      ]);
    }
    setProductSearch('');
  };

  const handleSaveCombo = () => {
    if (!comboName.trim()) return;
    const newCombo: ComboPack = {
      id: `c-${Date.now()}`,
      code: comboSku || `COMBO-${Date.now().toString().slice(-4)}`,
      name: comboName.trim(),
      description: comboDesc.trim(),
      active: isActive,
      publishEcommerce: isEcommerce,
      pricingMethod,
      profitPercent,
      ivaPercent,
      finalPrice: calculateFinalPrice(),
      items: selectedItems,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCombos([newCombo, ...combos]);
    setIsModalOpen(false);
  };

  const handleDeleteCombo = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este combo?')) {
      setCombos(combos.filter(c => c.id !== id));
    }
  };

  const searchResults = productSearch.trim().length >= 2
    ? products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(productSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <div className="space-y-4">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-slate-800" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Combos / Packs</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Crea paquetes de productos con precios especiales</p>
        </div>
        <button
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Combo</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Lista de Combos</h2>
          <p className="text-xs text-slate-500">Paquetes de productos con precios calculados desde costos o precios finales</p>
        </div>

        {/* Filter Input */}
        <div className="relative max-w-sm mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar combos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Combos Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Código ⇅</th>
                <th className="py-2.5 px-3">Nombre ⇅</th>
                <th className="py-2.5 px-3 text-center">Productos</th>
                <th className="py-2.5 px-3 text-center">Método</th>
                <th className="py-2.5 px-3 text-right">Precio Final ⇅</th>
                <th className="py-2.5 px-3 text-center">Estado ⇅</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCombos.map((combo) => (
                <tr key={combo.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{combo.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{combo.name}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-medium">
                      {combo.items?.length || 1} items
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {combo.pricingMethod === 'cost' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-700 text-white rounded text-[11px] font-semibold">
                        <Calculator className="w-3 h-3" />
                        Costo +{combo.profitPercent}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-slate-300 text-slate-700 rounded text-[11px] font-semibold">
                        <Percent className="w-3 h-3" />
                        %{combo.discountPercent ? `-${combo.discountPercent}% dto` : 'Directo'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-900 text-sm">
                    ${combo.finalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center space-x-1.5">
                    <span className="inline-block px-2.5 py-0.5 bg-blue-700 text-white rounded text-[11px] font-bold">
                      Activo
                    </span>
                    {combo.publishEcommerce && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-300 text-slate-700 rounded text-[10px] font-semibold">
                        <ShoppingCart className="w-3 h-3" />
                        E-commerce
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button 
                        onClick={() => setViewingCombo(combo)} 
                        title="Ver detalles" 
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => alert(`Editar combo ${combo.code}`)} 
                        title="Editar" 
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCombo(combo.id)} 
                        title="Eliminar" 
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-slate-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Combo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-900">Nuevo Combo</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Combo *</label>
                  <input
                    type="text"
                    placeholder="Ej: Kit Pintor Profesional"
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código (SKU)</label>
                  <input
                    type="text"
                    value={comboSku}
                    onChange={(e) => setComboSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isActive ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Activo</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEcommerce}
                      onChange={(e) => setIsEcommerce(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${isEcommerce ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isEcommerce ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 inline-flex items-center gap-1">
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-600" /> Publicar en E-commerce
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    placeholder="Descripción del combo..."
                    value={comboDesc}
                    onChange={(e) => setComboDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Pricing Method Card */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Método de Cálculo de Precio</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPricingMethod('cost')}
                      className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                        pricingMethod === 'cost' ? 'bg-white shadow-xs text-blue-800' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Desde Costos
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMethod('price')}
                      className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                        pricingMethod === 'price' ? 'bg-white shadow-xs text-blue-800' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Desde Precios
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {pricingMethod === 'cost' 
                      ? 'El precio se calcula sumando los costos de los productos + ganancia + IVA'
                      : 'El precio se calcula sumando los precios de venta al público de cada producto'}
                  </p>

                  {pricingMethod === 'cost' && (
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">% Ganancia</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={profitPercent}
                            onChange={(e) => setProfitPercent(Number(e.target.value))}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">% IVA</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={ivaPercent}
                            onChange={(e) => setIvaPercent(Number(e.target.value))}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Precio Final Calculado:</span>
                    <span className="text-base font-black text-blue-700">
                      ${calculateFinalPrice().toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Products Selector & List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">Productos del Combo</h4>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar productos para agregar..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductToCombo(p)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 mr-2">{p.code}</span>
                            <span className="font-semibold text-slate-800">{p.name}</span>
                          </div>
                          <span className="font-bold text-slate-900">${(p.priceRetail || 0).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl min-h-[260px] max-h-[300px] overflow-y-auto p-3 bg-white">
                  <div className="text-[11px] font-bold text-slate-500 mb-2">Artículos ({selectedItems.length})</div>
                  {selectedItems.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                      <Package className="w-8 h-8 mb-2 stroke-1" />
                      <span>Busca y agrega productos al combo</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">SKU: {item.code} | Costo: ${item.unitCost.toLocaleString('es-AR')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Cant:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setSelectedItems(selectedItems.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                              }}
                              className="w-12 text-center py-1 bg-white border border-slate-200 rounded font-bold text-xs"
                            />
                            <button
                              onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                onClick={handleSaveCombo}
                disabled={!comboName.trim() || selectedItems.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar Combo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewingCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{viewingCombo.name}</h3>
              <button onClick={() => setViewingCombo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Código SKU:</span><span className="font-mono font-bold">{viewingCombo.code}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Método de cálculo:</span><span className="font-semibold">{viewingCombo.pricingMethod === 'cost' ? `Costo +${viewingCombo.profitPercent}%` : 'Por precio de venta'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Precio Final:</span><span className="font-black text-blue-700 text-sm">${viewingCombo.finalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-700 mb-2">Productos incluidos:</p>
                <div className="space-y-1.5">
                  {viewingCombo.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 bg-slate-50 p-2 rounded">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-mono font-semibold">${item.unitCost.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setViewingCombo(null)} className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};
