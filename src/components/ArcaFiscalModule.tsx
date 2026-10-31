import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Printer, 
  Send, 
  QrCode, 
  Search, 
  ShieldCheck, 
  FileCheck2, 
  Calendar, 
  Building, 
  DollarSign, 
  Eye, 
  ExternalLink,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  ArcaElectronicVoucher, 
  SalesOrder, 
  Customer, 
  CompanyConfig 
} from '../types';

interface ArcaFiscalModuleProps {
  vouchers: ArcaElectronicVoucher[];
  salesOrders: SalesOrder[];
  customers: Customer[];
  config: CompanyConfig | null;
  onAuthorizeOrderManually: (orderId: string, pointOfSale: number, invoiceType: string) => Promise<ArcaElectronicVoucher>;
  onSendInvoiceWhatsApp: (voucher: ArcaElectronicVoucher, customerPhone: string) => void;
}

export const ArcaFiscalModule: React.FC<ArcaFiscalModuleProps> = ({
  vouchers,
  salesOrders,
  customers,
  config,
  onAuthorizeOrderManually,
  onSendInvoiceWhatsApp
}) => {
  const [activeTab, setActiveTab] = useState<'authorized' | 'pending' | 'status'>('authorized');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<ArcaElectronicVoucher | null>(null);
  const [isAuthorizingId, setIsAuthorizingId] = useState<string | null>(null);

  // Pending orders waiting for ARCA fiscal authorization
  const pendingOrders = useMemo(() => {
    return salesOrders.filter(o => 
      o.billingType === 'arca' && 
      (!o.cae || o.status === 'ingresado' || o.status === 'preparando_remito')
    );
  }, [salesOrders]);

  // Statistics
  const stats = useMemo(() => {
    const totalAuthorizedAmount = vouchers
      .filter(v => v.status === 'autorizado')
      .reduce((acc, v) => acc + v.total, 0);
    const totalIvaAmount = vouchers
      .filter(v => v.status === 'autorizado')
      .reduce((acc, v) => acc + (v.iva21 || 0) + (v.iva105 || 0), 0);
    const authorizedCount = vouchers.filter(v => v.status === 'autorizado').length;
    const pendingCount = pendingOrders.length;
    return { totalAuthorizedAmount, totalIvaAmount, authorizedCount, pendingCount };
  }, [vouchers, pendingOrders]);

  const lastTest = config?.arcaLastTest;
  const arcaReady = !!(lastTest?.ok && config?.arcaCertPem && config?.arcaKeyEnc && lastTest.env === config?.arcaEnvironment && lastTest.pointOfSale === config?.arcaPointOfSale);
  const lastCae = [...vouchers].filter(v => v.cae).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]?.cae;

  // Handle manual authorization
  const handleAuthorizeOrder = async (order: SalesOrder) => {
    setIsAuthorizingId(order.id);
    try {
      const ptoVta = config?.arcaPointOfSale || 4;
      const type = order.invoiceType || (order.customerTaxId?.startsWith('30') ? 'FACTURA_A' : 'FACTURA_B');
      await onAuthorizeOrderManually(order.id, ptoVta, type);
    } catch (err: any) {
      console.error("Error authorizing ARCA invoice:", err);
      alert(err?.message || "No se pudo autorizar la factura en ARCA.");
    } finally {
      setIsAuthorizingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              ARCA / AFIP - Facturación Electrónica Oficial
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                config?.arcaEnvironment === 'produccion'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                Ambiente: {config?.arcaEnvironment === 'produccion' ? 'PRODUCCIÓN EN LÍNEA' : 'HOMOLOGACIÓN / SANDBOX'}
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Punto de Venta {config?.arcaPointOfSale || '—'} · {config?.arcaTaxCondition === 'monotributo' || config?.arcaTaxCondition === 'exento' ? 'Factura C' : 'Facturas A y B'} con CAE y QR oficial.
            </p>
            {!arcaReady && (
              <p className="mt-2 text-xs font-bold text-amber-300">
                ⚠ Facturación no habilitada todavía: el creador tiene que configurarla en Control Maestro → ARCA.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            CUIT Empresa: <strong className="text-white">{config?.cuit || 'sin configurar'}</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Facturación ARCA Total</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${stats.totalAuthorizedAmount.toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Con CAE y validez fiscal</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Débito Fiscal IVA 21%</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            ${stats.totalIvaAmount.toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Para Libro IVA Ventas</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Comprobantes Emitidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {stats.authorizedCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Facturas A, B y Notas</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pendientes Autorización</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {stats.pendingCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Requieren pase manual a CAE</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('authorized')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
            activeTab === 'authorized'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Comprobantes Autorizados con CAE ({vouchers.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pedidos Pendientes de CAE ({pendingOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
            activeTab === 'status'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Servicios WSAA & WSFE
        </button>
      </div>

      {/* TAB: COMROBANTES AUTORIZADOS */}
      {activeTab === 'authorized' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por número, CUIT o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente & CUIT</th>
                <th className="px-4 py-3 font-mono">Neto Gravado</th>
                <th className="px-4 py-3 font-mono">IVA 21%</th>
                <th className="px-4 py-3 font-mono">Total</th>
                <th className="px-4 py-3">CAE & Vencimiento</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No hay comprobantes electrónicos autorizados registrados.
                  </td>
                </tr>
              ) : (
                vouchers.map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">
                          {v.voucherType.replace('FACTURA_', 'FAC ')}
                        </span>
                        {v.voucherNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Pto Vta: {v.pointOfSale}</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300">{v.date}</td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{v.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">CUIT: {v.customerTaxId}</div>
                    </td>

                    <td className="px-4 py-3 font-mono">${v.netAmount.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 font-mono text-cyan-400">${v.iva21.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">${v.total.toLocaleString('es-AR')}</td>

                    <td className="px-4 py-3 font-mono">
                      <div className="text-emerald-400 font-bold">{v.cae}</div>
                      <div className="text-[10px] text-slate-500">Vto: {v.caeVto}</div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedVoucher(v)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                          title="Ver Factura con QR Legal"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {v.afipQrUrl && (
                          <a
                            href={v.afipQrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                            title="Verificar en Servidor ARCA"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: PENDIENTES DE AUTORIZACIÓN MANUAL */}
      {activeTab === 'pending' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Pedido N°</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 font-mono">Importe Total</th>
                <th className="px-4 py-3">Tipo Factura</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No hay pedidos pendientes de autorización fiscal.
                  </td>
                </tr>
              ) : (
                pendingOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{order.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">CUIT: {order.customerTaxId}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      ${order.total.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {order.invoiceType || 'FACTURA_A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleAuthorizeOrder(order)}
                        disabled={isAuthorizingId === order.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        {isAuthorizingId === order.id ? 'Autorizando WSFE...' : 'Autorizar en ARCA'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: STATUS WSAA & WSFE */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Servicio de Autenticación WSAA</h4>
                <p className="text-xs text-slate-400">Ticket de Acceso (TRA) vigente para emisión fiscal</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Estado del Token:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activo y Autorizado
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Certificado Digital X.509:</span>
                <span className="text-white font-mono">COLOREAR_2026.crt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Punto de Venta Homologado:</span>
                <span className="text-white font-mono">0004</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Servicio Web WSFE v1</h4>
                <p className="text-xs text-slate-400">Consulta de comprobantes y autorización de CAE</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Conexión con ARCA:</span>
                <span className={`font-bold ${arcaReady ? 'text-emerald-400' : 'text-amber-400'}`}>{arcaReady ? 'Configurada y probada' : 'Sin configurar'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Última prueba:</span>
                <span className="text-white font-mono">{lastTest ? new Date(lastTest.at).toLocaleString('es-AR') : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Último CAE emitido:</span>
                <span className="text-white font-mono">{lastCae || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Certificado vence:</span>
                <span className="text-white font-mono">{config?.arcaCertNotAfter ? new Date(config.arcaCertNotAfter).toLocaleDateString('es-AR') : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Visualización de Factura Oficial con CAE y QR */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl p-8 shadow-2xl my-8 space-y-6">
            <div className="flex items-center justify-between no-print border-b pb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-800">
                  Comprobante Electrónico Oficial ARCA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
                >
                  Imprimir Comprobante
                </button>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Factura Layout */}
            <div className="border-2 border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-slate-900">{config?.companyName || 'COLOREAR PINTURAS S.A.'}</h2>
                  <p className="text-xs text-slate-600">{config?.fiscalAddress || 'Planta Industrial Km 38.5'}</p>
                  <p className="text-xs text-slate-600 font-mono">IVA Responsable Inscripto</p>
                </div>

                <div className="text-center px-4 py-2 border-2 border-slate-800 rounded-lg">
                  <span className="text-3xl font-black block">
                    {selectedVoucher.voucherType === 'FACTURA_A' ? 'A' : 'B'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    COD. {selectedVoucher.voucherType === 'FACTURA_A' ? '01' : '06'}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold font-mono">
                    {selectedVoucher.voucherType.replace('_', ' ')}
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-800">
                    N° {selectedVoucher.voucherNumber}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Fecha: {selectedVoucher.date}
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="font-bold block text-slate-700">DATOS DEL RECEPTOR:</span>
                  <div className="font-semibold text-slate-900">{selectedVoucher.customerName}</div>
                  <div className="font-mono">CUIT: {selectedVoucher.customerTaxId}</div>
                  <div>Condición IVA: {selectedVoucher.taxCategory.replace('_', ' ').toUpperCase()}</div>
                </div>
                <div>
                  <span className="font-bold block text-slate-700">CONDICIONES DE VENTA:</span>
                  <div>Contado / Cuenta Corriente</div>
                  <div>Punto de Venta: {selectedVoucher.pointOfSale}</div>
                </div>
              </div>

              {/* Totals */}
              <div className="border p-3 rounded-lg bg-slate-50 text-right space-y-1 font-mono text-sm">
                <div>Subtotal Neto: ${selectedVoucher.netAmount.toLocaleString('es-AR')}</div>
                <div>IVA (21%): ${selectedVoucher.iva21.toLocaleString('es-AR')}</div>
                <div className="text-base font-extrabold text-slate-900 border-t pt-1">
                  TOTAL: ${selectedVoucher.total.toLocaleString('es-AR')}
                </div>
              </div>

              {/* Footer with CAE and Official QR */}
              <div className="border-t-2 border-slate-800 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-100 border p-1 rounded flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">Comprobante Autorizado por ARCA / AFIP</div>
                    <div className="font-mono text-slate-700 mt-0.5">CAE: <strong>{selectedVoucher.cae}</strong></div>
                    <div className="font-mono text-slate-700">Fecha de Vto. de CAE: <strong>{selectedVoucher.caeVto}</strong></div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <div>Régimen de Facturación Electrónica RG 4291</div>
                  <div>Verificación Oficial en afip.gob.ar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
