import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  FileText, 
  DollarSign, 
  BadgeAlert,
  Send,
  X,
  RefreshCw,
  Landmark
} from 'lucide-react';
import { CheckItem, CheckType, CheckStatus, Customer, Supplier, Cashbox } from '../types';

interface ChecksModuleProps {
  checks: CheckItem[];
  customers: Customer[];
  suppliers: Supplier[];
  cashboxes?: Cashbox[];
  onSaveCheck: (check: CheckItem) => Promise<void>;
  onUpdateCheckStatus: (checkId: string, status: CheckStatus, notes?: string, destinationId?: string) => Promise<void>;
}

export const ChecksModule: React.FC<ChecksModuleProps> = ({
  checks,
  customers,
  suppliers,
  cashboxes = [],
  onSaveCheck,
  onUpdateCheckStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_cartera' | 'due_soon' | 'depositado' | 'cobrado' | 'entregado_proveedor'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cheque_fisico' | 'echeq'>('all');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [actionCheck, setActionCheck] = useState<CheckItem | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'deliver_supplier' | 'mark_collected' | 'reject' | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCashboxId, setSelectedCashboxId] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // New Check form state
  const [formCheck, setFormCheck] = useState<Partial<CheckItem>>({
    checkNumber: '',
    type: 'echeq',
    bankName: 'Banco Galicia',
    issuerTaxId: '',
    issuerName: '',
    amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'en_cartera',
    receivedFromType: 'cliente',
    notes: ''
  });

  // Today for date calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Checks due calculations
  const checksWithDueInfo = useMemo(() => {
    return checks.map(c => {
      const dueDateObj = new Date(c.dueDate);
      dueDateObj.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let dueCategory: 'expired' | 'due_today' | 'due_7_days' | 'due_later' = 'due_later';
      if (diffDays < 0) dueCategory = 'expired';
      else if (diffDays === 0) dueCategory = 'due_today';
      else if (diffDays <= 7) dueCategory = 'due_7_days';

      return {
        ...c,
        diffDays,
        dueCategory
      };
    });
  }, [checks, today]);

  // Alert: checks due in 7 days or expired that are still 'en_cartera'
  const urgentChecks = useMemo(() => {
    return checksWithDueInfo.filter(c => 
      c.status === 'en_cartera' && (c.diffDays <= 7)
    ).sort((a, b) => a.diffDays - b.diffDays);
  }, [checksWithDueInfo]);

  // Filtered List
  const filteredChecks = useMemo(() => {
    return checksWithDueInfo.filter(c => {
      // Search
      const matchesSearch = 
        c.checkNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.issuerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.customerName && c.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Type filter
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'due_soon') return c.status === 'en_cartera' && c.diffDays <= 7;
      return c.status === statusFilter;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [checksWithDueInfo, searchQuery, statusFilter, typeFilter]);

  // Portfolio Totals
  const totalInPortfolio = checksWithDueInfo
    .filter(c => c.status === 'en_cartera')
    .reduce((acc, c) => acc + c.amount, 0);

  const totalDueSoon = urgentChecks.reduce((acc, c) => acc + c.amount, 0);

  const totalCollected = checksWithDueInfo
    .filter(c => c.status === 'cobrado' || c.status === 'depositado')
    .reduce((acc, c) => acc + c.amount, 0);

  // Submit new check
  const handleSubmitNewCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCheck.checkNumber || !formCheck.amount || formCheck.amount <= 0) return;

    const newCheck: CheckItem = {
      id: `chk-${Date.now()}`,
      checkNumber: formCheck.checkNumber.trim(),
      type: formCheck.type || 'echeq',
      bankName: formCheck.bankName || 'Banco Galicia',
      issuerTaxId: formCheck.issuerTaxId || '',
      issuerName: formCheck.issuerName || 'Cliente',
      amount: Number(formCheck.amount),
      issueDate: formCheck.issueDate || new Date().toISOString().split('T')[0],
      dueDate: formCheck.dueDate || new Date().toISOString().split('T')[0],
      status: 'en_cartera',
      receivedFromType: formCheck.receivedFromType || 'cliente',
      customerId: formCheck.customerId,
      customerName: formCheck.customerId ? customers.find(cu => cu.id === formCheck.customerId)?.businessName : formCheck.issuerName,
      notes: formCheck.notes || '',
      createdAt: new Date().toISOString()
    };

    await onSaveCheck(newCheck);
    setShowCheckModal(false);
  };

  // Execute Action (Deposit, Deliver, Collect, Reject)
  const handleExecuteAction = async () => {
    if (!actionCheck || !actionType) return;

    if (actionType === 'deposit') {
      await onUpdateCheckStatus(actionCheck.id, 'depositado', actionNotes, selectedCashboxId);
    } else if (actionType === 'deliver_supplier') {
      const sup = suppliers.find(s => s.id === selectedSupplierId);
      await onUpdateCheckStatus(actionCheck.id, 'entregado_proveedor', `Entregado a ${sup?.businessName || 'Proveedor'}. ${actionNotes}`, selectedSupplierId);
    } else if (actionType === 'mark_collected') {
      await onUpdateCheckStatus(actionCheck.id, 'cobrado', actionNotes, selectedCashboxId);
    } else if (actionType === 'reject') {
      await onUpdateCheckStatus(actionCheck.id, 'rechazado', actionNotes);
    }

    setActionCheck(null);
    setActionType(null);
    setActionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Cartelera de Cheques & E-Cheqs
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  Cartera & Vencimientos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de valores físicos y electrónicos, seguimiento de fechas de pago, depósitos y endosos a proveedores.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFormCheck({
                checkNumber: '',
                type: 'echeq',
                bankName: 'Banco Galicia',
                issuerTaxId: '',
                issuerName: '',
                amount: 0,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'en_cartera',
                receivedFromType: 'cliente',
                notes: ''
              });
              setShowCheckModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Ingresar Cheque / E-Cheq
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 to-white">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total en Cartera Disponible
            </span>
            <div className="text-2xl font-black text-indigo-950 font-mono mt-1">
              $ {totalInPortfolio.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-indigo-700 font-semibold mt-0.5 block">
              {checks.filter(c => c.status === 'en_cartera').length} valores en custodia
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${urgentChecks.length > 0 ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Por Vencer / Vencidos (Próx. 7 días)
              </span>
              {urgentChecks.length > 0 && <BadgeAlert className="w-4 h-4 text-amber-600 animate-bounce" />}
            </div>
            <div className="text-2xl font-black text-amber-900 font-mono mt-1">
              $ {totalDueSoon.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-amber-800 font-bold mt-0.5 block">
              {urgentChecks.length} cheques con vencimiento próximo
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Valores Depositados / Cobrados
            </span>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              $ {totalCollected.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              Fondos ya acreditados en cuentas
            </span>
          </div>
        </div>

        {/* URGENT EXPIRATION REMINDER BANNER */}
        {urgentChecks.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-black">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>RECORDATORIO DE VENCIMIENTOS DE CHEQUES:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {urgentChecks.slice(0, 6).map(c => (
                <div key={c.id} className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{c.bankName} #{c.checkNumber}</div>
                    <div className="text-[11px] text-slate-500">{c.issuerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-slate-900">$ {c.amount.toLocaleString('es-AR')}</div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      c.diffDays < 0 
                        ? 'bg-red-100 text-red-800' 
                        : c.diffDays === 0 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.diffDays < 0 ? `Vencido hace ${Math.abs(c.diffDays)}d` : c.diffDays === 0 ? '¡VENCE HOY!' : `Vence en ${c.diffDays} días`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar & Filter Bar */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Nº, banco, emisor o cliente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('echeq')}
                className={`px-3 py-1 rounded-lg transition-all ${typeFilter === 'echeq' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                E-Cheqs
              </button>
              <button
                onClick={() => setTypeFilter('cheque_fisico')}
                className={`px-3 py-1 rounded-lg transition-all ${typeFilter === 'cheque_fisico' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'}`}
              >
                Físicos
              </button>
            </div>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs p-1.5 rounded-xl border border-slate-300 font-semibold bg-white text-slate-700"
            >
              <option value="all">Todos los estados</option>
              <option value="en_cartera">En Cartera (Disponibles)</option>
              <option value="due_soon">⚠️ Vencimiento Próximo</option>
              <option value="depositado">Depositados en Banco</option>
              <option value="cobrado">Cobrados / Acreditados</option>
              <option value="entregado_proveedor">Entregados a Proveedores</option>
            </select>
          </div>
        </div>
      </div>

      {/* CHECKS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {filteredChecks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              No se encontraron cheques registrados con los filtros seleccionados.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tipo & Nº Cheque</th>
                  <th className="p-3.5">Banco</th>
                  <th className="p-3.5">Emisor / Origen</th>
                  <th className="p-3.5 text-right">Importe ($)</th>
                  <th className="p-3.5">Fecha Cobro / Vto</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChecks.map(c => {
                  const isEcheq = c.type === 'echeq';
                  const isUrgent = c.status === 'en_cartera' && c.diffDays <= 7;
                  const isExpired = c.status === 'en_cartera' && c.diffDays < 0;

                  return (
                    <tr key={c.id} className={`hover:bg-indigo-50/20 transition-colors ${isUrgent ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-3.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isEcheq ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'}`}>
                            {isEcheq ? 'E-CHEQ' : 'FÍSICO'}
                          </span>
                          <strong className="text-slate-900">{c.checkNumber}</strong>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800">
                        {c.bankName}
                      </td>

                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{c.issuerName}</div>
                        {c.customerName && c.customerName !== c.issuerName && (
                          <div className="text-[11px] text-slate-500">Recibido de: {c.customerName}</div>
                        )}
                        {c.issuerTaxId && (
                          <div className="font-mono text-[10px] text-slate-400">CUIT: {c.issuerTaxId}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                        $ {c.amount.toLocaleString('es-AR')}
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-800">
                          {new Date(c.dueDate).toLocaleDateString('es-AR')}
                        </div>
                        {c.status === 'en_cartera' && (
                          <span className={`text-[10px] font-extrabold inline-block mt-0.5 ${
                            isExpired 
                              ? 'text-red-600' 
                              : c.diffDays <= 7 
                              ? 'text-amber-600' 
                              : 'text-slate-500'
                          }`}>
                            {c.diffDays < 0 
                              ? `⚠️ Vencido (-${Math.abs(c.diffDays)}d)` 
                              : c.diffDays === 0 
                              ? '🚨 Vence hoy' 
                              : `En ${c.diffDays} días`}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          c.status === 'en_cartera' 
                            ? 'bg-blue-100 text-blue-800'
                            : c.status === 'depositado'
                            ? 'bg-amber-100 text-amber-800'
                            : c.status === 'cobrado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'entregado_proveedor'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        {c.status === 'en_cartera' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setActionCheck(c);
                                setActionType('deposit');
                              }}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-lg text-xs"
                              title="Depositar en cuenta bancaria"
                            >
                              Depositar
                            </button>
                            <button
                              onClick={() => {
                                setActionCheck(c);
                                setActionType('deliver_supplier');
                              }}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-lg text-xs"
                              title="Endosar y entregar a proveedor de insumos"
                            >
                              Endosar
                            </button>
                            <button
                              onClick={() => {
                                setActionCheck(c);
                                setActionType('mark_collected');
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg text-xs"
                              title="Cobrado en efectivo o acreditado"
                            >
                              Cobrado
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: INGRESAR NUEVO CHEQUE */}
      {showCheckModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Ingresar Cheque / E-Cheq a Cartera
              </h3>
              <button onClick={() => setShowCheckModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewCheck} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tipo de Cheque
                  </label>
                  <select
                    value={formCheck.type}
                    onChange={e => setFormCheck({ ...formCheck, type: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="echeq">E-Cheq (Digital)</option>
                    <option value="cheque_fisico">Cheque Físico Papel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nº de Cheque (ID)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 99482103"
                    value={formCheck.checkNumber}
                    onChange={e => setFormCheck({ ...formCheck, checkNumber: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Banco Emisor
                  </label>
                  <input
                    type="text"
                    placeholder="Banco Galicia, Santander, Macro..."
                    value={formCheck.bankName}
                    onChange={e => setFormCheck({ ...formCheck, bankName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Importe ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={formCheck.amount || ''}
                    onChange={e => setFormCheck({ ...formCheck, amount: Number(e.target.value) })}
                    className="w-full text-sm p-2 rounded-xl border border-indigo-400 font-mono font-black text-indigo-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={formCheck.issueDate}
                    onChange={e => setFormCheck({ ...formCheck, issueDate: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Fecha de Cobro / Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formCheck.dueDate}
                    onChange={e => setFormCheck({ ...formCheck, dueDate: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Cliente / Origen
                  </label>
                  <select
                    value={formCheck.customerId || ''}
                    onChange={e => {
                      const cust = customers.find(c => c.id === e.target.value);
                      setFormCheck({
                        ...formCheck,
                        customerId: e.target.value,
                        issuerName: cust ? cust.businessName : formCheck.issuerName,
                        issuerTaxId: cust ? cust.taxId : formCheck.issuerTaxId
                      });
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="">Ingreso manual / Otro emisor</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.businessName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Razón Social del Emisor
                  </label>
                  <input
                    type="text"
                    value={formCheck.issuerName}
                    onChange={e => setFormCheck({ ...formCheck, issuerName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    placeholder="Pinturas del Litoral S.A."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Notas / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="Referencia de factura o pedido..."
                  value={formCheck.notes}
                  onChange={e => setFormCheck({ ...formCheck, notes: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Guardar Cheque en Cartera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACTIONS (DEPOSIT, DELIVER TO SUPPLIER, COLLECT) */}
      {actionCheck && actionType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-2">
              {actionType === 'deposit' && 'Depositar Cheque en Cuenta Bancaria'}
              {actionType === 'deliver_supplier' && 'Endosar y Entregar a Proveedor'}
              {actionType === 'mark_collected' && 'Marcar como Cobrado / Acreditado'}
              {actionType === 'reject' && 'Marcar Cheque Rechazado'}
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4 space-y-1">
              <div><strong>{actionCheck.bankName}</strong> Nº {actionCheck.checkNumber}</div>
              <div>Importe: <strong className="text-slate-900 font-mono font-bold">$ {actionCheck.amount.toLocaleString('es-AR')}</strong></div>
              <div>Vencimiento: {new Date(actionCheck.dueDate).toLocaleDateString('es-AR')}</div>
            </div>

            <div className="space-y-3 text-xs">
              {actionType === 'deposit' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cuenta / Caja Bancaria de Destino:</label>
                  <select
                    value={selectedCashboxId}
                    onChange={e => setSelectedCashboxId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {cashboxes.map(cb => (
                      <option key={cb.id} value={cb.id}>{cb.name} (Saldo: ${cb.currentBalance.toLocaleString('es-AR')})</option>
                    ))}
                  </select>
                </div>
              )}

              {actionType === 'deliver_supplier' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proveedor Receptor del Endoso:</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.businessName} ({s.category})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones / Nº de Comprobante:</label>
                <input
                  type="text"
                  placeholder="Detalle de la operación..."
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => {
                  setActionCheck(null);
                  setActionType(null);
                }}
                className="text-xs font-semibold px-4 py-2 text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                Confirmar Operación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
