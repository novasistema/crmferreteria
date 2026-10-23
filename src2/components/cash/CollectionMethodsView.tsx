import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  Wallet,
  ArrowRightLeft,
  DollarSign,
  Receipt,
  Building,
  Smartphone,
  Check,
  Plus,
  Trash2,
  Settings,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export interface CollectionMethodConfig {
  id: string; // 'cash' | 'card' | 'transfer' | 'check' | 'credit_account' | 'echeq' | 'mercadopago_qr' | 'mercadopago_transfer'
  title: string;
  code: string;
  iconName: 'cash' | 'card' | 'transfer' | 'check' | 'credit_account' | 'echeq' | 'mercadopago_qr' | 'mercadopago_transfer';
  iconColor: string;
  iconBg: string;
  active: boolean;
  tags?: string[]; // e.g. ['Permite cuotas'], ['Requiere referencia']
  destinationCashRegister: string; // Caja Destino (ej: "Caja mostrador")
  destinationMoneyBox: string; // Caja de Dinero Destino (ej: "Administración" o "Sin caja de dinero destino")
  destinationBank: string; // Banco Destino (ej: "Sin banco destino", "Banco Galicia", "Mercado Pago (ferreteriabruzzone)")
  branchOptional: string; // Sucursal (opcional) (ej: "Todas las sucursales")
}

export interface CreditCardConfig {
  id: string;
  name: string; // Visa, Mastercard, Cabal, Naranja, American Express
  type: 'Crédito' | 'Débito';
  brand: string;
  active: boolean;
  surcharges: { installments: number; surchargePercent: number; enabled: boolean }[];
}

export const CollectionMethodsView: React.FC = () => {
  const { store, showToast } = useApp();

  // Top Tabs: "Métodos de Cobro" & "Tarjetas" matching the user's screenshot
  const [activeMainTab, setActiveMainTab] = useState<'metodos' | 'tarjetas'>('metodos');

  // Load collection methods configuration with the exact 8 cards from user screenshot
  const [methods, setMethods] = useState<CollectionMethodConfig[]>(() => {
    const saved = localStorage.getItem('erp_collection_methods_config_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'cash',
        title: 'Efectivo',
        code: 'cash',
        iconName: 'cash',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
        active: true,
        destinationCashRegister: 'Caja mostrador',
        destinationMoneyBox: 'Administración',
        destinationBank: 'Sin banco destino',
        branchOptional: 'Todas las sucursales',
      },
      {
        id: 'card',
        title: 'Tarjeta',
        code: 'card',
        iconName: 'card',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
        active: true,
        tags: ['Permite cuotas'],
        destinationCashRegister: 'Caja mostrador',
        destinationMoneyBox: 'Sin caja de dinero destino',
        destinationBank: 'Banco Galicia',
        branchOptional: 'Todas las sucursales',
      },
      {
        id: 'transfer',
        title: 'Transferencia',
        code: 'transfer',
        iconName: 'transfer',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
        active: true,
        tags: ['Requiere referencia'],
        destinationCashRegister: 'Caja mostrador',
        destinationMoneyBox: 'Sin caja de dinero destino',
        destinationBank: 'Banco Galicia',
        branchOptional: 'Todas las sucursales',
      },
      {
        id: 'check',
        title: 'Cheque',
        code: 'check',
        iconName: 'check',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
        active: true,
        tags: ['Requiere referencia'],
        destinationCashRegister: 'Caja mostrador',
        destinationMoneyBox: 'Sin caja de dinero destino',
        destinationBank: 'Sin banco destino',
        branchOptional: 'Todas las sucursales',
      },
      {
        id: 'credit_account',
        title: 'Cuenta Corriente',
        code: 'credit_account',
        iconName: 'credit_account',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
        active: true,
        destinationCashRegister: 'Caja mostrador',
        destinationMoneyBox: 'Sin caja de dinero destino',
        destinationBank: 'Sin banco destino',
        branchOptional: 'Todas las sucursales',
      },
      {
        id: 'echeq',
        title: 'E-Cheq',
        code: 'echeq',
        iconName: 'echeq',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
        active: true,
        tags: ['Requiere referencia'],
        destinationCashRegister: 'Caja mostrador',
        destinationMoneyBox: 'Sin caja de dinero destino',
        destinationBank: 'Sin banco destino',
        branchOptional: 'Todas las sucursales',
      },
      {
        id: 'mercadopago_qr',
        title: 'MercadoPago QR',
        code: 'mercadopago_qr',
        iconName: 'mercadopago_qr',
        iconColor: 'text-slate-400',
        iconBg: 'bg-slate-100',
        active: false,
        tags: ['Requiere referencia'],
        destinationCashRegister: 'Caja mostrador',
        destinationMoneyBox: 'Sin caja de dinero destino',
        destinationBank: 'Mercado Pago (ferreteriabruzzone)',
        branchOptional: 'Todas las sucursales',
      },
      {
        id: 'mercadopago_transfer',
        title: 'MercadoPago Transferencia',
        code: 'mercadopago_transfer',
        iconName: 'mercadopago_transfer',
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
        active: true,
        tags: ['Requiere referencia'],
        destinationCashRegister: 'Caja mostrador',
        destinationMoneyBox: 'Sin caja de dinero destino',
        destinationBank: 'Mercado Pago (ferreteriabruzzone)',
        branchOptional: 'Todas las sucursales',
      },
    ];
  });

  // Credit cards & surcharges configuration tab
  const [cards, setCards] = useState<CreditCardConfig[]>(() => {
    const saved = localStorage.getItem('erp_credit_cards_config_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'visa',
        name: 'Visa Crédito',
        type: 'Crédito',
        brand: 'Visa',
        active: true,
        surcharges: [
          { installments: 1, surchargePercent: 0, enabled: true },
          { installments: 3, surchargePercent: 12, enabled: true },
          { installments: 6, surchargePercent: 24, enabled: true },
          { installments: 12, surchargePercent: 48, enabled: true },
        ],
      },
      {
        id: 'mastercard',
        name: 'Mastercard Crédito',
        type: 'Crédito',
        brand: 'Mastercard',
        active: true,
        surcharges: [
          { installments: 1, surchargePercent: 0, enabled: true },
          { installments: 3, surchargePercent: 12, enabled: true },
          { installments: 6, surchargePercent: 24, enabled: true },
          { installments: 12, surchargePercent: 48, enabled: true },
        ],
      },
      {
        id: 'naranja',
        name: 'Tarjeta Naranja (Plan Z)',
        type: 'Crédito',
        brand: 'Naranja',
        active: true,
        surcharges: [
          { installments: 1, surchargePercent: 0, enabled: true },
          { installments: 3, surchargePercent: 0, enabled: true }, // Plan Z 0%
          { installments: 6, surchargePercent: 18, enabled: true },
          { installments: 10, surchargePercent: 35, enabled: true },
        ],
      },
      {
        id: 'debito',
        name: 'Tarjetas de Débito (Visa Débito / Maestro)',
        type: 'Débito',
        brand: 'Débito',
        active: true,
        surcharges: [{ installments: 1, surchargePercent: 0, enabled: true }],
      },
    ];
  });

  const saveMethods = (updated: CollectionMethodConfig[]) => {
    setMethods(updated);
    localStorage.setItem('erp_collection_methods_config_v1', JSON.stringify(updated));
    showToast('Configuración de formas de cobro guardada', 'success');
  };

  const saveCards = (updated: CreditCardConfig[]) => {
    setCards(updated);
    localStorage.setItem('erp_credit_cards_config_v1', JSON.stringify(updated));
    showToast('Planes de cuotas y recargos guardados', 'success');
  };

  const handleToggleActive = (id: string) => {
    const updated = methods.map((m) => {
      if (m.id === id) {
        return { ...m, active: !m.active };
      }
      return m;
    });
    saveMethods(updated);
  };

  const handleChangeField = (
    id: string,
    field: 'destinationCashRegister' | 'destinationMoneyBox' | 'destinationBank' | 'branchOptional',
    value: string
  ) => {
    const updated = methods.map((m) => {
      if (m.id === id) {
        return { ...m, [field]: value };
      }
      return m;
    });
    saveMethods(updated);
  };

  // Icon rendering helper
  const renderMethodIcon = (iconName: string, active: boolean) => {
    const colorClass = active ? 'text-amber-700' : 'text-slate-400';
    const bgClass = active ? 'bg-amber-100/90' : 'bg-slate-100';

    switch (iconName) {
      case 'cash':
        return (
          <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
            <DollarSign className={`w-4 h-4 ${colorClass}`} />
          </div>
        );
      case 'card':
        return (
          <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
            <CreditCard className={`w-4 h-4 ${colorClass}`} />
          </div>
        );
      case 'transfer':
        return (
          <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
            <ArrowRightLeft className={`w-4 h-4 ${colorClass}`} />
          </div>
        );
      case 'check':
      case 'echeq':
        return (
          <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center shrink-0 font-bold text-xs ${colorClass}`}>
            $
          </div>
        );
      case 'credit_account':
        return (
          <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
            <Receipt className={`w-4 h-4 ${colorClass}`} />
          </div>
        );
      case 'mercadopago_qr':
      case 'mercadopago_transfer':
        return (
          <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
            <Smartphone className={`w-4 h-4 ${colorClass}`} />
          </div>
        );
      default:
        return (
          <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
            <Wallet className={`w-4 h-4 ${colorClass}`} />
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto min-h-full text-slate-800 animate-in fade-in duration-150">
      {/* Top Header matching exact screenshot title & subtitle */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Formas de Cobro
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configurá métodos de cobro, tarjetas, recargos y planes de cuotas
        </p>
      </div>

      {/* Tabs Bar matching screenshot: [Métodos de Cobro] [Tarjetas] */}
      <div className="flex items-center space-x-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveMainTab('metodos')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === 'metodos'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-blue-600" />
          <span>Métodos de Cobro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('tarjetas')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === 'tarjetas'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
          <span>Tarjetas</span>
        </button>
      </div>

      {/* Description line below tabs */}
      {activeMainTab === 'metodos' && (
        <p className="text-xs text-slate-500 font-medium">
          Activá o desactivá métodos de cobro y vinculá cada uno a una caja para registrar ingresos automáticamente
        </p>
      )}

      {/* TAB 1: MÉTODOS DE COBRO (3-column grid matching the user's uploaded screenshot) */}
      {activeMainTab === 'metodos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {methods.map((method) => {
            const isCardActive = method.active;

            return (
              <div
                key={method.id}
                className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs transition-all ${
                  isCardActive
                    ? 'border-slate-300/80'
                    : 'border-slate-200 bg-slate-50/40 opacity-70'
                }`}
              >
                {/* Card Top: Icon + Name/Code + Switch Toggle */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {renderMethodIcon(method.iconName, isCardActive)}
                    <div>
                      <h3 className={`text-sm font-black ${isCardActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        {method.title}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 block -mt-0.5">
                        {method.code}
                      </span>
                    </div>
                  </div>

                  {/* Switch Toggle matching iOS/Modern pill style */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(method.id)}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 shrink-0 ${
                      isCardActive ? 'bg-[#004b99]' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        isCardActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Optional Tag Pills like [Permite cuotas] or [Requiere referencia] */}
                {method.tags && method.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {method.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2.5 py-0.5 rounded-md border border-slate-900 text-slate-900 text-[10px] font-extrabold uppercase tracking-tight bg-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Form Selects matching exact screenshot:
                    1. Caja Destino
                    2. Caja de Dinero Destino
                    3. Banco Destino
                    4. Sucursal (opcional)
                */}
                <div className="space-y-3 pt-1 text-xs">
                  {/* 1. Caja Destino */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                      <span className="text-slate-400 text-[10px]">🗄️</span>
                      <span>Caja Destino</span>
                    </label>
                    <select
                      value={method.destinationCashRegister}
                      onChange={(e) => handleChangeField(method.id, 'destinationCashRegister', e.target.value)}
                      disabled={!isCardActive}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="Caja mostrador">Caja mostrador</option>
                      <option value="Caja secundaria">Caja secundaria</option>
                      <option value="Caja cobranzas">Caja cobranzas</option>
                    </select>
                  </div>

                  {/* 2. Caja de Dinero Destino */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                      <span className="text-slate-400 text-[10px]">📁</span>
                      <span>Caja de Dinero Destino</span>
                    </label>
                    <select
                      value={method.destinationMoneyBox}
                      onChange={(e) => handleChangeField(method.id, 'destinationMoneyBox', e.target.value)}
                      disabled={!isCardActive}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="Sin caja de dinero destino">Sin caja de dinero destino</option>
                      <option value="Administración">Administración</option>
                      <option value="Cuentas">Cuentas</option>
                      <option value="Sucursal">Sucursal</option>
                    </select>
                  </div>

                  {/* 3. Banco Destino */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                      <span className="text-slate-400 text-[10px]">🏦</span>
                      <span>Banco Destino</span>
                    </label>
                    <select
                      value={method.destinationBank}
                      onChange={(e) => handleChangeField(method.id, 'destinationBank', e.target.value)}
                      disabled={!isCardActive}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="Sin banco destino">Sin banco destino</option>
                      <option value="Banco Galicia">Banco Galicia</option>
                      <option value="Banco Santander">Banco Santander</option>
                      <option value="Mercado Pago (ferreteriabruzzone)">Mercado Pago (ferreteriabruzzone)</option>
                    </select>
                  </div>

                  {/* 4. Sucursal (opcional) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                      <span className="text-slate-400 text-[10px]">🏢</span>
                      <span>Sucursal (opcional)</span>
                    </label>
                    <select
                      value={method.branchOptional}
                      onChange={(e) => handleChangeField(method.id, 'branchOptional', e.target.value)}
                      disabled={!isCardActive}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="Todas las sucursales">Todas las sucursales</option>
                      <option value="Casa Central">Casa Central</option>
                      <option value="Depósito Anexo">Depósito Anexo</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TARJETAS & RECARGOS POR CUOTAS */}
      {activeMainTab === 'tarjetas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Planes de Financiación, Cuotas y Recargos
                </h2>
                <p className="text-xs text-slate-500">
                  Configura el porcentaje de recargo financiero que se aplica al cobrar con tarjetas de crédito en el Punto de Venta (POS)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {cards.map((card) => (
                <div key={card.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{card.name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Tipo: {card.type}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = cards.map((c) =>
                          c.id === card.id ? { ...c, active: !c.active } : c
                        );
                        saveCards(updated);
                      }}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                        card.active ? 'bg-[#004b99]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          card.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Surcharges list */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Recargos por Cuotas:
                    </span>
                    <div className="space-y-2">
                      {card.surcharges.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs"
                        >
                          <span className="font-bold text-slate-800">
                            {s.installments === 1 ? '1 Pago (Contado)' : `${s.installments} Cuotas`}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-400 font-semibold text-[11px]">Recargo:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={s.surchargePercent}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = cards.map((c) => {
                                  if (c.id === card.id) {
                                    const nextSurcharges = [...c.surcharges];
                                    nextSurcharges[idx].surchargePercent = val;
                                    return { ...c, surcharges: nextSurcharges };
                                  }
                                  return c;
                                });
                                setCards(updated);
                              }}
                              className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                            <span className="font-bold text-slate-600">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => saveCards(cards)}
                className="px-5 py-2.5 rounded-xl bg-[#004b99] hover:bg-[#003d7a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Guardar Cambios de Tarjetas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
