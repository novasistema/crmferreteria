import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckWalletItem } from '../../types';
import {
  Receipt,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Building,
  Calendar,
  DollarSign,
  ArrowRightLeft,
  X,
  Send,
  Trash2,
  Check,
  Ban,
  Clock,
} from 'lucide-react';

export const CashChecksTab: React.FC = () => {
  const { store, currentUser, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'pending' | 'deposited' | 'endorsed' | 'rejected' | 'cashed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isNewCheckModalOpen, setIsNewCheckModalOpen] = useState(false);
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedCheckForAction, setSelectedCheckForAction] = useState<CheckWalletItem | null>(null);

  // New Check form
  const [newCheckNumber, setNewCheckNumber] = useState('');
  const [newCheckType, setNewCheckType] = useState<'physical' | 'echeq'>('physical');
  const [newBankName, setNewBankName] = useState('NACION');
  const [newIssuerName, setNewIssuerName] = useState('');
  const [newIssuerTaxId, setNewIssuerTaxId] = useState('');
  const [newIssuerCity, setNewIssuerCity] = useState('');
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newIssueDate, setNewIssueDate] = useState('2026-08-28');
  const [newPaymentDate, setNewPaymentDate] = useState('2026-09-28');
  const [newNotes, setNewNotes] = useState('');

  // Endorse form
  const [endorseRecipient, setEndorseRecipient] = useState('');
  const [endorseDate, setEndorseDate] = useState('2026-08-28');

  // Deposit form
  const [depositBankId, setDepositBankId] = useState(() => store.moneyBoxes[0]?.id || '');
  const [depositDate, setDepositDate] = useState('2026-08-28');

  const handleCreateCheck = () => {
    if (!newCheckNumber.trim() || !newIssuerName.trim() || newAmount <= 0) {
      showToast('Complete el número de cheque, emisor y monto', 'error');
      return;
    }
    const newCheck: CheckWalletItem = {
      id: `chk-${Date.now()}`,
      type: newCheckType,
      checkNumber: newCheckNumber.trim(),
      bankName: newBankName.trim().toUpperCase(),
      issuerName: newIssuerName.trim(),
      issuerTaxId: newIssuerTaxId.trim() || '20-00000000-0',
      issuerCity: newIssuerCity.trim(),
      amount: newAmount,
      issueDate: newIssueDate,
      paymentDate: newPaymentDate,
      origin: 'client_sale',
      status: 'pending',
      notes: newNotes.trim(),
    };
    store.saveCheck(newCheck);
    showToast(`Cheque #${newCheck.checkNumber} incorporado a cartera`, 'success');
    setIsNewCheckModalOpen(false);
    setNewCheckNumber('');
    setNewIssuerName('');
    setNewAmount(0);
  };

  const handleEndorseCheck = () => {
    if (!selectedCheckForAction || !endorseRecipient.trim()) {
      showToast('Indique el destinatario / proveedor del endoso', 'error');
      return;
    }
    store.updateCheckStatus(selectedCheckForAction.id, 'endorsed', {
      deliveredTo: endorseRecipient.trim(),
      deliveryDate: endorseDate,
    });
    showToast(`Cheque #${selectedCheckForAction.checkNumber} endosado a ${endorseRecipient}`, 'success');
    setIsEndorseModalOpen(false);
    setSelectedCheckForAction(null);
    setEndorseRecipient('');
  };

  const handleDepositCheck = () => {
    if (!selectedCheckForAction) return;
    const destBank = store.moneyBoxes.find((m) => m.id === depositBankId);
    store.updateCheckStatus(selectedCheckForAction.id, 'deposited', {
      deliveredTo: destBank ? destBank.name : 'Cuenta Bancaria',
      deliveryDate: depositDate,
    });

    if (destBank) {
      destBank.currentBalance = (destBank.currentBalance || 0) + selectedCheckForAction.amount;
      store.saveMoneyBox(destBank);
    }

    showToast(`Cheque #${selectedCheckForAction.checkNumber} depositado en ${destBank?.name || 'Banco'}`, 'success');
    setIsDepositModalOpen(false);
    setSelectedCheckForAction(null);
  };

  const handleMarkRejected = (check: CheckWalletItem) => {
    if (confirm(`¿Marcar cheque #${check.checkNumber} como RECHAZADO?`)) {
      store.updateCheckStatus(check.id, 'rejected', { notes: 'Rechazado por el banco' });
      showToast(`Cheque #${check.checkNumber} marcado como Rechazado`, 'error');
    }
  };

  const handleMarkCashed = (check: CheckWalletItem) => {
    store.updateCheckStatus(check.id, 'cashed', { notes: 'Cobrado por ventanilla' });
    showToast(`Cheque #${check.checkNumber} marcado como Cobrado`, 'success');
  };

  // Filtered list
  const filteredChecks = store.checks.filter((chk) => {
    if (activeSubTab === 'pending' && chk.status !== 'pending' && chk.status !== 'in_portfolio') return false;
    if (activeSubTab === 'deposited' && chk.status !== 'deposited') return false;
    if (activeSubTab === 'endorsed' && chk.status !== 'endorsed' && chk.status !== 'endorsed_to_supplier') return false;
    if (activeSubTab === 'rejected' && chk.status !== 'rejected') return false;
    if (activeSubTab === 'cashed' && chk.status !== 'cashed') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = chk.checkNumber.toLowerCase().includes(q);
      const matchIssuer = chk.issuerName.toLowerCase().includes(q);
      const matchBank = chk.bankName.toLowerCase().includes(q);
      const matchDest = chk.deliveredTo?.toLowerCase().includes(q);
      if (!matchNum && !matchIssuer && !matchBank && !matchDest) return false;
    }
    return true;
  });

  const pendingChecks = store.checks.filter((c) => c.status === 'pending' || c.status === 'in_portfolio');
  const depositedChecks = store.checks.filter((c) => c.status === 'deposited');
  const endorsedChecks = store.checks.filter((c) => c.status === 'endorsed' || c.status === 'endorsed_to_supplier');
  const rejectedChecks = store.checks.filter((c) => c.status === 'rejected');
  const cashedChecks = store.checks.filter((c) => c.status === 'cashed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Cartera de Cheques (Físicos y E-Cheqs)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración integral de cheques recibidos, vencimientos, depósitos, endosos a proveedores y rechazos.
          </p>
        </div>

        <button
          id="btn-new-check"
          onClick={() => setIsNewCheckModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cheque
        </button>
      </div>

      {/* Overdue Alerts Card */}
      {pendingChecks.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">Alertas de Vencimiento</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingChecks.map((chk) => (
              <div
                key={chk.id}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {chk.type === 'echeq' ? 'E-Cheq' : 'Físico'}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-rose-100 text-rose-800 border border-rose-200">
                          Vencido 9 días
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-900">#{chk.checkNumber}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{chk.issuerName}</h4>
                      <p className="text-xs text-slate-500">
                        CUIT: {chk.issuerTaxId} {chk.issuerCity && `• ${chk.issuerCity}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-400 block">BANCO {chk.bankName}</span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        ${chk.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Vencimiento: <strong className="text-slate-700">{chk.paymentDate}</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCheckForAction(chk);
                      setIsDepositModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                  >
                    Depositar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCheckForAction(chk);
                      setIsEndorseModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200"
                  >
                    Endosar
                  </button>
                  <button
                    onClick={() => handleMarkCashed(chk)}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                  >
                    Cobrado
                  </button>
                  <button
                    onClick={() => handleMarkRejected(chk)}
                    className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-800">Historial Completo de Cheques</h3>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nº, emisor, banco..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({store.checks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Pendientes ({pendingChecks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('deposited')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'deposited'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Depositados ({depositedChecks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('endorsed')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'endorsed'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            Endosados ({endorsedChecks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('rejected')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Rechazados ({rejectedChecks.length})
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-3">Nº Cheque</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Emisor / Librador</th>
                <th className="py-3 px-3">Banco</th>
                <th className="py-3 px-3 text-right">Monto ($)</th>
                <th className="py-3 px-3">Vencimiento</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Destino / Entregado a</th>
                <th className="py-3 px-3">Fecha Op.</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredChecks.map((chk) => {
                const isPending = chk.status === 'pending' || chk.status === 'in_portfolio';
                const isEndorsed = chk.status === 'endorsed' || chk.status === 'endorsed_to_supplier';
                const isDeposited = chk.status === 'deposited';
                const isRejected = chk.status === 'rejected';

                return (
                  <tr key={chk.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">#{chk.checkNumber}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {chk.type === 'echeq' ? 'E-Cheq' : 'Físico'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800 block">{chk.issuerName}</span>
                      <span className="text-[10px] text-slate-400">{chk.issuerTaxId}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold uppercase">{chk.bankName}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      ${chk.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{chk.paymentDate}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isDeposited
                            ? 'bg-emerald-100 text-emerald-800'
                            : isEndorsed
                            ? 'bg-indigo-100 text-indigo-800'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {isPending
                          ? 'Pendiente'
                          : isDeposited
                          ? 'Depositado'
                          : isEndorsed
                          ? 'Endosado'
                          : isRejected
                          ? 'Rechazado'
                          : 'Cobrado'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-indigo-900">{chk.deliveredTo || '—'}</td>
                    <td className="py-3 px-3 text-slate-500">{chk.deliveryDate || '—'}</td>
                    <td className="py-3 px-3 text-center">
                      {isPending ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedCheckForAction(chk);
                              setIsEndorseModalOpen(true);
                            }}
                            className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                            title="Endosar"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCheckForAction(chk);
                              setIsDepositModalOpen(true);
                            }}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                            title="Depositar"
                          >
                            <Building className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Procesado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Endorse Modal */}
      {isEndorseModalOpen && selectedCheckForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                Endosar Cheque #{selectedCheckForAction.checkNumber}
              </h3>
              <button
                onClick={() => setIsEndorseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-indigo-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <p><strong>Librador:</strong> {selectedCheckForAction.issuerName}</p>
                <p><strong>Monto:</strong> ${selectedCheckForAction.amount.toLocaleString('es-AR')}</p>
                <p><strong>Vencimiento:</strong> {selectedCheckForAction.paymentDate}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Proveedor / Destinatario del Endoso
                </label>
                <input
                  type="text"
                  value={endorseRecipient}
                  onChange={(e) => setEndorseRecipient(e.target.value)}
                  placeholder="Ej: BERMON / GOMA PAZ / LA CASA DE LA CERRADURA"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha de Endoso</label>
                <input
                  type="date"
                  value={endorseDate}
                  onChange={(e) => setEndorseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEndorseModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEndorseCheck}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Confirmar Endoso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && selectedCheckForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                Depositar Cheque #{selectedCheckForAction.checkNumber}
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-emerald-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <p><strong>Librador:</strong> {selectedCheckForAction.issuerName}</p>
                <p><strong>Monto:</strong> ${selectedCheckForAction.amount.toLocaleString('es-AR')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Cuenta Bancaria Destino
                </label>
                <select
                  value={depositBankId}
                  onChange={(e) => setDepositBankId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  {store.moneyBoxes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha de Depósito</label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDepositCheck}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Confirmar Depósito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Check Modal */}
      {isNewCheckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Ingresar Cheque a Cartera
              </h3>
              <button
                onClick={() => setIsNewCheckModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Nº Cheque</label>
                  <input
                    type="text"
                    value={newCheckNumber}
                    onChange={(e) => setNewCheckNumber(e.target.value)}
                    placeholder="104928"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Tipo</label>
                  <select
                    value={newCheckType}
                    onChange={(e) => setNewCheckType(e.target.value as 'physical' | 'echeq')}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="physical">Físico</option>
                    <option value="echeq">E-Cheq</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Banco Emisor</label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="NACION, SANTANDER, GALICIA, MACRO..."
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Emisor / Librador</label>
                <input
                  type="text"
                  value={newIssuerName}
                  onChange={(e) => setNewIssuerName(e.target.value)}
                  placeholder="Nombre o Razón Social"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">CUIT / DNI</label>
                  <input
                    type="text"
                    value={newIssuerTaxId}
                    onChange={(e) => setNewIssuerTaxId(e.target.value)}
                    placeholder="20-12345678-9"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Localidad</label>
                  <input
                    type="text"
                    value={newIssuerCity}
                    onChange={(e) => setNewIssuerCity(e.target.value)}
                    placeholder="Alejandro (Cba)"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Monto ($)</label>
                <input
                  type="number"
                  value={newAmount || ''}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 text-base font-black text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Emisión</label>
                  <input
                    type="date"
                    value={newIssueDate}
                    onChange={(e) => setNewIssueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Vencimiento</label>
                  <input
                    type="date"
                    value={newPaymentDate}
                    onChange={(e) => setNewPaymentDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewCheckModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCheck}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Guardar Cheque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
