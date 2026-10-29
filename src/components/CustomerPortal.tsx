import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileText, 
  Truck, 
  History, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  Printer, 
  LogOut, 
  UserCheck,
  MessageSquare,
  Sparkles,
  Gift,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { Customer, SalesOrder, CompanyConfig, LoyaltyReward } from '../types';

interface CustomerPortalProps {
  customers: Customer[];
  salesOrders: SalesOrder[];
  rewards?: LoyaltyReward[];
  config: CompanyConfig | null;
  activeClientTaxId: string | null;
  onLoginClient: (taxId: string) => void;
  onLogoutClient: () => void;
  onRedeemReward?: (customerId: string, rewardId: string) => Promise<string | null>;
  /** Modo producción: el cliente ingresa con CUIT/DNI + código de acceso de 6 dígitos. */
  requireAccessCode?: boolean;
  /** Modo producción: valida CUIT + código. Devuelve un mensaje de error o null. */
  onLoginWithCode?: (taxId: string, code: string) => Promise<string | null>;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customers,
  salesOrders,
  rewards = [],
  config,
  activeClientTaxId,
  onLoginClient,
  onLogoutClient,
  onRedeemReward,
  requireAccessCode = false,
  onLoginWithCode
}) => {
  const [taxIdInput, setTaxIdInput] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'shipments' | 'invoices' | 'orders' | 'account' | 'loyalty'>('shipments');
  const [selectedOrderDoc, setSelectedOrderDoc] = useState<SalesOrder | null>(null);
  const [redeemedCouponCode, setRedeemedCouponCode] = useState<string | null>(null);

  // Authenticated customer
  const currentCustomer = customers.find(c => {
    if (!activeClientTaxId) return false;
    const cleanActive = activeClientTaxId.replace(/[^0-9]/g, '');
    const cleanCust = c.taxId.replace(/[^0-9]/g, '');
    return cleanCust === cleanActive || c.taxId === activeClientTaxId;
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanInput = taxIdInput.replace(/[^0-9]/g, '');
    if (!cleanInput) {
      setLoginError('Por favor ingrese su número de DNI o CUIT');
      return;
    }

    if (requireAccessCode) {
      if (!onLoginWithCode) return;
      setIsLoggingIn(true);
      const err = await onLoginWithCode(cleanInput, accessCodeInput);
      setIsLoggingIn(false);
      if (err) setLoginError(err);
      return;
    }

    const found = customers.find(c => {
      const cleanCust = c.taxId.replace(/[^0-9]/g, '');
      return cleanCust === cleanInput || c.taxId === taxIdInput.trim();
    });

    if (found) {
      onLoginClient(found.taxId);
    } else {
      setLoginError('No se encontró ningún cliente registrado con ese DNI o CUIT. Verifique los dígitos o contacte a administración.');
    }
  };

  // Orders for this customer
  const myOrders = currentCustomer 
    ? salesOrders.filter(o => {
        const cleanCust = currentCustomer.taxId.replace(/[^0-9]/g, '');
        const cleanOrder = o.customerTaxId.replace(/[^0-9]/g, '');
        return o.customerId === currentCustomer.id || cleanCust === cleanOrder;
      })
    : [];

  const activeShipments = myOrders.filter(o => o.status === 'preparando_remito' || o.status === 'facturado' || o.status === 'despachado');

  // If not logged in, show portal login screen
  if (!currentCustomer) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center animate-in fade-in">
        <div className="flex justify-center mb-4">
          <img 
            src={config?.logoUrl || "/assets/aistudio/colorear-500px_0158e3cb.webp"} 
            alt={config?.tradeName || "Colorear Pinturas"} 
            className="h-12 w-auto max-w-[200px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/aistudio/colorear-500px_0158e3cb.webp';
            }}
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Portal Seguro de Autogestión
        </div>

        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Acceso para Clientes & Pinturerías
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Consulte sus facturas electrónicas, siga sus envíos de mercadería en tiempo real y revise su cuenta corriente.
        </p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ingrese su DNI o CUIT (sin guiones)
            </label>
            <input
              type="text"
              placeholder="Ej: 30712345679 o 28945612"
              value={taxIdInput}
              onChange={e => setTaxIdInput(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#d31627]"
              required
            />
          </div>

          {requireAccessCode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Código de acceso
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                placeholder="6 números"
                value={accessCodeInput}
                onChange={e => setAccessCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-sm p-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 tracking-widest focus:outline-hidden focus:ring-2 focus:ring-[#d31627]"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Si no tenés código, pedíselo a la administración.</p>
            </div>
          )}

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#d31627] hover:bg-red-700 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" /> {isLoggingIn ? 'Ingresando…' : 'Ingresar al Portal'}
          </button>
        </form>

        {/* Quick demo accounts (solo modo demo) */}
        {!requireAccessCode && (
        <div className="mt-8 pt-6 border-t border-slate-100 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Accesos de demostración disponibles:
          </span>
          <div className="space-y-1.5">
            {customers.slice(0, 3).map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setTaxIdInput(c.taxId);
                  onLoginClient(c.taxId);
                }}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs flex items-center justify-between transition-colors border border-slate-200/60"
              >
                <span className="font-bold text-slate-800 truncate mr-2">{c.businessName}</span>
                <span className="font-mono text-slate-500 font-bold shrink-0">{c.taxId}</span>
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
    );
  }

  // Logged-in Customer View
  return (
    <div className="space-y-6">
      {/* Top Customer Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl border border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-slate-900">
                Cliente Verificado
              </span>
              <span className="text-xs font-mono text-slate-300">
                CUIT/DNI: {currentCustomer.taxId}
              </span>
            </div>
            <h1 className="text-2xl font-black mt-1">
              {currentCustomer.businessName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentCustomer.address}, {currentCustomer.city} • Lista Asignada: <strong>{currentCustomer.priceList.toUpperCase()}</strong>
            </p>
          </div>

          <button
            onClick={onLogoutClient}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir de mi Cuenta
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[11px] text-slate-400 block font-semibold">Estado de Cuenta Corriente</span>
            <div className={`text-xl font-black mt-1 ${currentCustomer.currentBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              $ {currentCustomer.currentBalance.toLocaleString('es-AR')}
            </div>
            <span className="text-[10px] text-slate-400">
              {currentCustomer.currentBalance > 0 ? 'Saldo pendiente de pago' : 'Al día / Sin deuda'}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[11px] text-slate-400 block font-semibold">Envíos de Mercadería Activos</span>
            <div className="text-xl font-black text-white mt-1">
              {activeShipments.length} en tránsito
            </div>
            <span className="text-[10px] text-slate-400">Con seguimiento en tiempo real</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <span className="text-[11px] text-slate-400 block font-semibold">Transporte Predeterminado</span>
            <div className="text-base font-bold text-white mt-1 truncate">
              {currentCustomer.transportName || 'Camión Fábrica'}
            </div>
            <span className="text-[10px] text-slate-400">Despacho desde planta Pilar</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'shipments'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            Envíos & Seguimiento en Tiempo Real ({activeShipments.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'invoices'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Mis Facturas & Comprobantes
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'orders'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Pedidos ({myOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'account'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Detalle Cuenta Corriente
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'loyalty'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Club de Puntos & Premios
          </button>
        </div>
      </div>

      {/* TAB CONTENT: SHIPMENTS */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No tienes envíos registrados en el sistema.
            </div>
          ) : (
            myOrders.map(order => {
              const stages = ['ingresado', 'preparando_remito', 'facturado', 'despachado', 'entregado'];
              const currentStageIdx = stages.indexOf(order.status);

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        Fecha: {new Date(order.date).toLocaleDateString('es-AR')}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="text-slate-500">Transporte: </span>
                      <strong className="text-slate-900">{order.transportName || 'Camión Fábrica'}</strong>
                    </div>
                  </div>

                  {/* Stepper tracking */}
                  <div className="py-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                      <span className={currentStageIdx >= 0 ? 'text-red-700' : ''}>1. Pedido Recibido</span>
                      <span className={currentStageIdx >= 1 ? 'text-red-700' : ''}>2. Remito en Planta</span>
                      <span className={currentStageIdx >= 2 ? 'text-red-700' : ''}>3. Facturado</span>
                      <span className={currentStageIdx >= 3 ? 'text-red-700' : ''}>4. En Viaje</span>
                      <span className={currentStageIdx >= 4 ? 'text-emerald-700' : ''}>5. Entregado</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-[#d31627] h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (currentStageIdx + 1) * 20)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tracking info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Código de Seguimiento</span>
                      <strong className="font-mono text-indigo-700 text-sm">{order.trackingCode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Remito Asociado</span>
                      <strong className="font-mono text-slate-800">{order.remitoNumber || 'En confección'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[10px] font-bold block">Total Comprobante</span>
                      <strong className="font-mono text-slate-900">$ {order.total.toLocaleString('es-AR')}</strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Comprobante</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">CAE ARCA</th>
                  <th className="p-3.5 text-right">Total</th>
                  <th className="p-3.5 text-center">Descargar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myOrders.filter(o => o.invoiceNumber).map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-slate-500">
                      {new Date(o.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {o.invoiceNumber}
                    </td>
                    <td className="p-3.5 uppercase font-mono font-bold text-blue-700">
                      {o.invoiceType || 'Factura'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {o.cae ? `${o.cae} (Vto: ${o.caeVto})` : 'Comprobante Interno'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-slate-900">
                      $ {o.total.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedOrderDoc(o)}
                        className="text-slate-600 hover:text-slate-900 p-1 font-bold text-xs flex items-center justify-center gap-1 mx-auto"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" /> Ver Factura
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {myOrders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {o.orderNumber}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {new Date(o.date).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                {o.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                    <span className="text-slate-800 font-medium">
                      {it.quantity}x {it.productName}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      $ {it.subtotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 text-right font-black text-sm text-slate-900">
                Total: $ {o.total.toLocaleString('es-AR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: ACCOUNT */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900">
            Resumen Financiero de Cuenta Corriente
          </h3>
          <p className="text-xs text-slate-500">
            Detalle de movimientos, saldo acumulado y datos para transferencias bancarias a Colorear Pinturas S.R.L.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Razón Social:</span>
              <strong className="text-slate-900">{config?.companyName || 'Colorear Pinturas S.R.L.'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">CUIT:</span>
              <strong className="font-mono text-slate-900">{config?.cuit || '30-71489234-8'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">CBU Banco Galicia:</span>
              <strong className="font-mono text-slate-900">0070045620000012345678</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Alias CBU:</span>
              <strong className="font-mono text-slate-900">COLOREAR.PINTURAS.PILAR</strong>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <a
              href={`https://wa.me/5491148907000?text=${encodeURIComponent(`Hola Colorear Pinturas, les escribo desde ${currentCustomer.businessName} (CUIT: ${currentCustomer.taxId}) para enviar comprobante de transferencia bancaria.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs"
            >
              <MessageSquare className="w-4 h-4" /> Enviar Comprobante por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LOYALTY & POINTS (REGLA DE SECCIÓN 10 DEL PROMPT MAESTRO) */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          {currentCustomer.hasCurrentAccount ? (
            /* Cliente con Cuenta Corriente: EXCLUSIÓN OBLIGATORIA */
            <div className="bg-white rounded-3xl border border-amber-200 p-8 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">
                  No Participa
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  Programa de Puntos No Aplicable a Esta Cuenta
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Estimado cliente, su cuenta opera con condiciones comerciales de <strong>Cuenta Corriente Mayorista</strong> (plazos de pago y bonificaciones de fábrica en remito). De acuerdo al reglamento comercial de Colorear Pinturas, los clientes con cuenta corriente quedan excluidos de la acumulación de puntos de mostrador.
                </p>
              </div>
            </div>
          ) : (
            /* Cliente Contado Habilitado */
            <div className="space-y-6">
              {/* Points Card */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider block">
                    Puntos Disponibles del Club Pintor
                  </span>
                  <div className="text-4xl font-black font-mono mt-1 text-white flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-amber-400" />
                    {(currentCustomer.loyaltyPoints || 0).toLocaleString('es-AR')} pts
                  </div>
                  <span className="text-xs text-purple-200 mt-1 block">
                    Nivel: <strong className="uppercase">{currentCustomer.loyaltyTier || 'Bronce'}</strong> (1 punto cada $100 en compras de mostrador)
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs space-y-1">
                  <div>• Compras de fábrica acumulan automáticamente.</div>
                  <div>• Canje inmediato por herramientas y ropa de trabajo.</div>
                </div>
              </div>

              {/* Success coupon modal */}
              {redeemedCouponCode && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                  <div className="text-emerald-800 font-bold text-base">¡Canje Realizado con Éxito!</div>
                  <p className="text-xs text-emerald-700">Presenta este código en mostrador o menciónalo a tu vendedor:</p>
                  <div className="text-2xl font-black font-mono text-emerald-900 tracking-wider bg-white p-3 rounded-xl border border-emerald-200 inline-block">
                    {redeemedCouponCode}
                  </div>
                </div>
              )}

              {/* Rewards List */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Premios Disponibles para Canjear:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map(reward => {
                    const canAfford = (currentCustomer.loyaltyPoints || 0) >= reward.pointsCost;
                    return (
                      <div key={reward.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {reward.category}
                            </span>
                            <span className="text-xs font-mono font-bold text-purple-700">
                              {reward.pointsCost} pts
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm">{reward.title}</h5>
                          <p className="text-xs text-slate-500 mt-1">{reward.description}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Stock: {reward.stock}</span>
                          <button
                            disabled={!canAfford || reward.stock <= 0}
                            onClick={async () => {
                              if (onRedeemReward) {
                                const code = await onRedeemReward(currentCustomer.id, reward.id);
                                if (code) setRedeemedCouponCode(code);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              canAfford && reward.stock > 0
                                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'Canjear Premio' : 'Puntos Insuficientes'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
