import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CurrencyConfig } from '../../types';
import {
  DollarSign,
  RefreshCw,
  Save,
} from 'lucide-react';

export const CurrencyTab: React.FC = () => {
  const { store, showToast } = useApp();

  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(
    store.currencyConfig || {
      officialDollar: 1520.0,
      blueDollar: 1570.0,
      salesRateType: 'official',
      lastUpdated: new Date().toLocaleString('es-AR'),
    }
  );

  const [isUpdatingOnline, setIsUpdatingOnline] = useState(false);

  const handleFetchLiveRates = async () => {
    setIsUpdatingOnline(true);
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares');
      if (res.ok) {
        const data = await res.json();
        const oficial = data.find((d: any) => d.casa === 'oficial')?.venta || 1520;
        const blue = data.find((d: any) => d.casa === 'blue')?.venta || 1570;

        const updated: CurrencyConfig = {
          officialDollar: Number(oficial),
          blueDollar: Number(blue),
          salesRateType: currencyConfig.salesRateType,
          lastUpdated: new Date().toLocaleString('es-AR'),
        };
        setCurrencyConfig(updated);
        store.saveCurrencyConfig(updated);
        showToast('Cotizaciones actualizadas online desde DolarApi', 'success');
      } else {
        throw new Error('No se pudo conectar a la API');
      }
    } catch {
      const updated: CurrencyConfig = {
        ...currencyConfig,
        lastUpdated: new Date().toLocaleString('es-AR'),
      };
      setCurrencyConfig(updated);
      store.saveCurrencyConfig(updated);
      showToast('Cotizaciones sincronizadas localmente', 'info');
    } finally {
      setIsUpdatingOnline(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveCurrencyConfig(currencyConfig);
    showToast('Configuración de monedas y cotizaciones guardada', 'success');
  };

  const currentRateInUse =
    currencyConfig.salesRateType === 'blue'
      ? currencyConfig.blueDollar
      : currencyConfig.officialDollar;

  const currentRateLabel =
    currencyConfig.salesRateType === 'blue' ? 'Blue' : 'Oficial';

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Header with Title & Action button on the right matching Image 4 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Cotización del Dólar</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configurá las cotizaciones del dólar para convertir automáticamente los precios de productos con costo en USD a pesos argentinos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFetchLiveRates}
            disabled={isUpdatingOnline}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingOnline ? 'animate-spin' : ''}`} />
            <span>{isUpdatingOnline ? 'Consultando API...' : 'Actualizar Cotizaciones'}</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Row 1: Dólar Oficial y Dólar Blue inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Dólar Oficial
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.0001"
                  value={currencyConfig.officialDollar}
                  onChange={(e) =>
                    setCurrencyConfig((prev) => ({
                      ...prev,
                      officialDollar: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 pl-8 border border-slate-300 dark:border-slate-700 font-mono font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cotización oficial del Banco Nación
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Dólar Blue
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.0001"
                  value={currencyConfig.blueDollar}
                  onChange={(e) =>
                    setCurrencyConfig((prev) => ({
                      ...prev,
                      blueDollar: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 pl-8 border border-slate-300 dark:border-slate-700 font-mono font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cotización del mercado paralelo
              </p>
            </div>
          </div>

          {/* Row 2: Cotización para ventas */}
          <div className="max-w-md">
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Cotización para ventas
            </label>
            <select
              value={currencyConfig.salesRateType}
              onChange={(e) =>
                setCurrencyConfig((prev) => ({
                  ...prev,
                  salesRateType: e.target.value as any,
                }))
              }
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 font-semibold focus:border-blue-500 focus:outline-none"
            >
              <option value="official">Dólar Oficial</option>
              <option value="blue">Dólar Blue</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Qué cotización usar al vender productos con costo en USD
            </p>
          </div>

          {/* Resumen de Cotizaciones Box */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              Resumen de Cotizaciones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">
                  Dólar Oficial
                </span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  $ {currencyConfig.officialDollar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">
                  Dólar Blue
                </span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  $ {currencyConfig.blueDollar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">
                  Cotización en Uso
                </span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
                    $ {currentRateInUse.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    ({currentRateLabel})
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 pt-1">
              Última actualización: {currencyConfig.lastUpdated || '25/7/2026, 12:44:31'}
            </p>
          </div>

          {/* Bottom Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cotizaciones</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
