import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { ClientFormModal } from './ClientFormModal';
import { ClientDetailLedgerModal } from './ClientDetailLedgerModal';
import { ClientReceiptModal } from './ClientReceiptModal';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  FileText,
  MessageCircle,
  CreditCard,
  History,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Building,
  Sparkles,
  ArrowRight,
  Cake,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const { store, setPreviewClientPortal, activeModule } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'negative' | 'debtors' | 'ctacte' | 'loyalty' | 'birthdays'>('all');

  // Sync with activeModule
  React.useEffect(() => {
    if (activeModule === 'birthdays') {
      setFilterType('birthdays');
    } else if (activeModule === 'clients_ctacte') {
      setFilterType('ctacte');
    }
  }, [activeModule]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [ledgerClientId, setLedgerClientId] = useState<string | null>(null);
  const [quickReceiptClient, setQuickReceiptClient] = useState<Client | null>(null);

  const currentMonth = new Date().getMonth() + 1; // 1-12

  const filteredClients = store.clients.filter((c) => {
    if (!c.active) return false;
    if (filterType === 'positive' && c.currentBalance <= 0) return false;
    if (filterType === 'negative' && c.currentBalance >= 0) return false;
    if (filterType === 'debtors' && c.currentBalance <= 0) return false;
    if (filterType === 'ctacte' && !c.hasCurrentAccount) return false;
    if (filterType === 'loyalty' && (!c.loyaltyEligible || c.hasCurrentAccount)) return false;
    if (filterType === 'birthdays') {
      // Check if client has birthday or fallback to sample match
      if (c.birthday) {
        const bMonth = parseInt(c.birthday.split('-')[1], 10);
        if (bMonth !== currentMonth) return false;
      }
    }

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.businessName && c.businessName.toLowerCase().includes(q)) ||
      c.taxId.includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const totalDebt = store.clients.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  const countCtaCte = store.clients.filter((c) => c.hasCurrentAccount).length;
  const countDebtors = store.clients.filter((c) => c.currentBalance > 0).length;
  const countPositive = store.clients.filter((c) => c.currentBalance > 0).length;
  const countNegative = store.clients.filter((c) => c.currentBalance < 0).length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Clientes & Cuentas Corrientes</h2>
            <p className="text-xs text-slate-400">
              Padrón de clientes con consulta ARCA, cuentas corrientes, facturas y recibos de cobro
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Deuda Total en Calle</span>
            <span className="text-sm font-black text-rose-400 font-mono">${totalDebt.toLocaleString('es-AR')}</span>
          </div>

          <button
            onClick={() => {
              setClientToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, razón social, CUIT/DNI, teléfono, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: `Todos (${store.clients.length})` },
            { id: 'positive', label: `Solo Positivos (+) (${countPositive})` },
            { id: 'negative', label: `Solo Negativos (-) (${countNegative})` },
            { id: 'debtors', label: `Con Saldo Deudor (${countDebtors})` },
            { id: 'ctacte', label: `Con Cta. Cte. (${countCtaCte})` },
            { id: 'loyalty', label: 'Club Fidelización' },
            { id: 'birthdays', label: '🎂 Cumpleaños del Mes' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterType === f.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client List Table */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700">
              <tr>
                <th className="p-3.5">Código & Razón Social</th>
                <th className="p-3.5">CUIT / DNI</th>
                <th className="p-3.5">Condición Fiscal</th>
                <th className="p-3.5">Lista Precios</th>
                <th className="p-3.5 text-right">Saldo en Cuenta</th>
                <th className="p-3.5 text-center">Cta. Cte.</th>
                <th className="p-3.5 text-center">Club Puntos</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No se encontraron clientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const hasDebt = client.currentBalance > 0;

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setLedgerClientId(client.id)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {client.name}
                          </span>
                          {client.businessName && client.businessName !== client.name && (
                            <span className="text-[10px] text-slate-400 italic">
                              ({client.businessName})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {client.code} {client.phone ? `• ${client.phone}` : ''} {client.city ? `• ${client.city}` : ''}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-300 font-medium">
                        {client.taxId}
                      </td>

                      <td className="p-3.5 text-slate-400">
                        {client.taxCondition}
                      </td>

                      <td className="p-3.5 text-slate-300">
                        {store.priceLists.find((pl) => pl.id === client.priceListId)?.name || 'Minorista'}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold">
                        <span className={hasDebt ? 'text-rose-400 text-sm' : 'text-emerald-400 font-medium'}>
                          ${client.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        {client.creditLimit > 0 && (
                          <span className="block text-[9px] text-slate-500">
                            Límite: ${client.creditLimit.toLocaleString('es-AR')}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            client.hasCurrentAccount
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {client.hasCurrentAccount ? 'Habilitada' : 'No'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        {client.hasCurrentAccount ? (
                          <span className="text-[10px] text-slate-500 italic">Excluido (Cta Cte)</span>
                        ) : client.loyaltyEligible ? (
                          <span className="inline-block font-bold text-amber-400 text-[11px]">
                            {client.loyaltyPoints} pts ({client.loyaltyTier})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">No participa</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div
                          className="flex items-center justify-center space-x-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Ver Estado de Cuenta / Movimientos */}
                          <button
                            onClick={() => setLedgerClientId(client.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                            title="Ver Cuenta Corriente, Movimientos, Facturas y Recibos"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Receipt button */}
                          <button
                            onClick={() => setQuickReceiptClient(client)}
                            className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 transition-colors"
                            title="Registrar Recibo de Cobranza"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setClientToEdit(client);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Editar Datos Fiscales"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp */}
                          {client.phone && (
                            <a
                              href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(
                                client.name
                              )},%20le%20escribimos%20de%20Ferretería%20Bruzzone...`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-featured Client Detail Ledger Modal (Movements, Receipts, Invoices, Print Statement) */}
      {ledgerClientId && (
        <ClientDetailLedgerModal
          isOpen={!!ledgerClientId}
          onClose={() => setLedgerClientId(null)}
          clientId={ledgerClientId}
        />
      )}

      {/* Client Form Modal with CUIT / ARCA lookup */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
      />

      {/* Quick Receipt Modal */}
      {quickReceiptClient && (
        <ClientReceiptModal
          isOpen={!!quickReceiptClient}
          onClose={() => setQuickReceiptClient(null)}
          client={quickReceiptClient}
        />
      )}
    </div>
  );
};
