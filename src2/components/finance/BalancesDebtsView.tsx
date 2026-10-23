import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, Supplier } from '../../types';
import {
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Search,
  Filter,
  Users,
  Truck,
  Receipt,
  FileSpreadsheet,
  Download,
  Eye,
  PlusCircle,
  Building,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ClientDetailLedgerModal } from '../clients/ClientDetailLedgerModal';
import { ClientReceiptModal } from '../clients/ClientReceiptModal';
import { AccountStatementPrintModal } from '../clients/AccountStatementPrintModal';

export const BalancesDebtsView: React.FC = () => {
  const { store, showToast, triggerRefresh } = useApp();

  // Balance sign filter state: 'all' | 'positive' | 'negative'
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'negative'>('all');
  // Account scope: 'all' | 'clients' | 'suppliers'
  const [accountScope, setAccountScope] = useState<'all' | 'clients' | 'suppliers'>('all');
  // Search query
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected client for ledger / receipt modals
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isStatementPrintModalOpen, setIsStatementPrintModalOpen] = useState(false);

  // Unified items list: Clients and Suppliers
  const unifiedAccounts = useMemo(() => {
    const list: Array<{
      id: string;
      code: string;
      name: string;
      taxId: string;
      type: 'client' | 'supplier';
      currentBalance: number; // positive = positive balance/credit, negative = debt
      creditLimit?: number;
      phone?: string;
      originalItem: Client | Supplier;
    }> = [];

    // Add clients
    store.clients.forEach((c) => {
      list.push({
        id: `cli-${c.id}`,
        code: c.code || `CLI-${c.id.slice(-4)}`,
        name: c.businessName || c.name,
        taxId: c.taxId || c.cuit || '-',
        type: 'client',
        currentBalance: c.currentBalance || 0,
        creditLimit: c.currentAccountConfig?.creditLimit,
        phone: c.phone || c.mobile,
        originalItem: c,
      });
    });

    // Add suppliers
    store.suppliers.forEach((s) => {
      list.push({
        id: `sup-${s.id}`,
        code: s.code || `PROV-${s.id.slice(-4)}`,
        name: s.businessName || s.name,
        taxId: s.taxId || '-',
        type: 'supplier',
        currentBalance: -(s.currentBalance || 0), // Supplier debt is an outflow/negative from business standpoint
        phone: s.phone,
        originalItem: s,
      });
    });

    return list;
  }, [store.clients, store.suppliers]);

  // Filtered accounts based on balance sign and scope
  const filteredAccounts = useMemo(() => {
    return unifiedAccounts.filter((acc) => {
      // Scope filter
      if (accountScope === 'clients' && acc.type !== 'client') return false;
      if (accountScope === 'suppliers' && acc.type !== 'supplier') return false;

      // Balance Sign Filter (+, -, all)
      if (balanceFilter === 'positive') {
        if (acc.currentBalance <= 0) return false;
      } else if (balanceFilter === 'negative') {
        if (acc.currentBalance >= 0) return false;
      }

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          acc.name.toLowerCase().includes(q) ||
          acc.code.toLowerCase().includes(q) ||
          acc.taxId.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [unifiedAccounts, accountScope, balanceFilter, searchTerm]);

  // Overall KPI sums
  const totalPositive = useMemo(() => {
    return unifiedAccounts
      .filter((a) => a.currentBalance > 0)
      .reduce((acc, a) => acc + a.currentBalance, 0);
  }, [unifiedAccounts]);

  const countPositive = useMemo(() => {
    return unifiedAccounts.filter((a) => a.currentBalance > 0).length;
  }, [unifiedAccounts]);

  const totalNegative = useMemo(() => {
    return unifiedAccounts
      .filter((a) => a.currentBalance < 0)
      .reduce((acc, a) => acc + Math.abs(a.currentBalance), 0);
  }, [unifiedAccounts]);

  const countNegative = useMemo(() => {
    return unifiedAccounts.filter((a) => a.currentBalance < 0).length;
  }, [unifiedAccounts]);

  const netBalance = totalPositive - totalNegative;

  // Format currency
  const formatMoney = (val: number) => {
    return `$${Math.abs(val).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Tipo', 'Código', 'Razón Social / Nombre', 'CUIT/DNI', 'Saldo'];
    const rows = filteredAccounts.map((a) => [
      a.type === 'client' ? 'Cliente' : 'Proveedor',
      a.code,
      `"${a.name.replace(/"/g, '""')}"`,
      a.taxId,
      a.currentBalance.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `saldos_y_deudas_${balanceFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte exportado exitosamente', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-amber-500" />
            Saldos y Deudas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control integral de cuentas corrientes de clientes y proveedores con filtro por signo
          </p>
        </div>

        <button
          id="btn-export-balances-csv"
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-400" />
          Exportar Informe
        </button>
      </div>

      {/* Main Filter Toolbar & Sign Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Top row: Sign Visualizer Switcher & Scope Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sign Visualizer Toggle (Todos / Solo + / Solo -) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Visualizar:
            </span>
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                id="btn-filter-all-balances"
                onClick={() => setBalanceFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  balanceFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ver Todo ({unifiedAccounts.length})
              </button>

              <button
                id="btn-filter-positive-balances"
                onClick={() => setBalanceFilter('positive')}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  balanceFilter === 'positive'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Solo Positivos (+) ({countPositive})
              </button>

              <button
                id="btn-filter-negative-balances"
                onClick={() => setBalanceFilter('negative')}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  balanceFilter === 'negative'
                    ? 'bg-rose-500 text-white font-black shadow-sm'
                    : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Solo Negativos / Deudas (-) ({countNegative})
              </button>
            </div>
          </div>

          {/* Scope Filter (Clientes / Proveedores / Todos) */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setAccountScope('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                accountScope === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setAccountScope('clients')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                accountScope === 'clients' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Clientes
            </button>
            <button
              onClick={() => setAccountScope('suppliers')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                accountScope === 'suppliers' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Proveedores
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, proveedor, CUIT o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Positivos (+) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">
              Total Positivo / A Cobrar ({countPositive})
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">
              +{formatMoney(totalPositive)}
            </span>
          </div>
        </div>

        {/* Negativos (-) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800/40 flex items-center justify-center text-rose-400 shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">
              Total Negativo / Deudas ({countNegative})
            </span>
            <span className="text-lg font-black text-rose-400 font-mono tracking-tight">
              -{formatMoney(totalNegative)}
            </span>
          </div>
        </div>

        {/* Saldo Neto Global */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Saldo Neto General</span>
            <span
              className={`text-lg font-black font-mono tracking-tight ${
                netBalance >= 0 ? 'text-blue-400' : 'text-rose-400'
              }`}
            >
              {netBalance >= 0 ? '+' : '-'}
              {formatMoney(netBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Accounts List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Código & Nombre</th>
                <th className="py-3.5 px-4">CUIT / DNI</th>
                <th className="py-3.5 px-4">Teléfono</th>
                <th className="py-3.5 px-4 text-right">Saldo Actual</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 font-medium">
                    No se encontraron cuentas con el filtro de saldo seleccionado.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isPositive = acc.currentBalance > 0;
                  const isNegative = acc.currentBalance < 0;
                  const isZero = acc.currentBalance === 0;

                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            acc.type === 'client'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          }`}
                        >
                          {acc.type === 'client' ? 'Cliente' : 'Proveedor'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-slate-400 block">{acc.code}</span>
                        <span className="font-bold text-white text-xs">{acc.name}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                        {acc.taxId}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {acc.phone || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-black font-mono text-sm px-2.5 py-1 rounded-lg ${
                            isPositive
                              ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30'
                              : isNegative
                              ? 'text-rose-400 bg-rose-950/40 border border-rose-800/30'
                              : 'text-slate-400'
                          }`}
                        >
                          {isPositive ? '+' : isNegative ? '-' : ''}
                          {formatMoney(acc.currentBalance)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {acc.type === 'client' ? (
                            <>
                              <button
                                title="Ver Estado de Cuenta / Historial"
                                onClick={() => {
                                  setSelectedClient(acc.originalItem as Client);
                                  setIsLedgerModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Cuenta
                              </button>

                              <button
                                title="Emitir Recibo de Cobro"
                                onClick={() => {
                                  setSelectedClient(acc.originalItem as Client);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                Cobrar
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Cuenta Proveedor</span>
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

      {/* Modals for Client Ledger, Receipt and Statement */}
      {selectedClient && isLedgerModalOpen && (
        <ClientDetailLedgerModal
          client={selectedClient}
          onClose={() => {
            setIsLedgerModalOpen(false);
            setSelectedClient(null);
          }}
          onOpenReceipt={() => {
            setIsLedgerModalOpen(false);
            setIsReceiptModalOpen(true);
          }}
          onOpenPrintStatement={() => {
            setIsLedgerModalOpen(false);
            setIsStatementPrintModalOpen(true);
          }}
        />
      )}

      {selectedClient && isReceiptModalOpen && (
        <ClientReceiptModal
          client={selectedClient}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedClient(null);
          }}
          onSuccess={() => {
            setIsReceiptModalOpen(false);
            setSelectedClient(null);
            showToast('Recibo de cobro registrado correctamente', 'success');
            triggerRefresh();
          }}
        />
      )}

      {selectedClient && isStatementPrintModalOpen && (
        <AccountStatementPrintModal
          client={selectedClient}
          onClose={() => {
            setIsStatementPrintModalOpen(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
};
