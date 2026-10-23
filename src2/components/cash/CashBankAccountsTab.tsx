import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MoneyBox } from '../../types';
import {
  Building,
  Plus,
  ArrowRightLeft,
  Upload,
  Mail,
  RefreshCw,
  Wallet,
  CheckCircle2,
  DollarSign,
  X,
  CreditCard,
  Layers,
  Trash2,
  Lock,
} from 'lucide-react';

export const CashBankAccountsTab: React.FC = () => {
  const { store, currentUser, showToast } = useApp();

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<string>(() => store.moneyBoxes[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(() => store.moneyBoxes[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDesc, setTransferDesc] = useState<string>('');

  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'Caja de Ahorro' | 'Cuenta Corriente' | 'Billetera Virtual'>('Cuenta Corriente');
  const [newAccHolder, setNewAccHolder] = useState('Serassio Mauricio');
  const [newAccCbu, setNewAccCbu] = useState('');
  const [newAccAlias, setNewAccAlias] = useState('');
  const [newAccBalance, setNewAccBalance] = useState<number>(0);

  const handleTransfer = () => {
    if (transferAmount <= 0) {
      showToast('Ingrese un monto válido a transferir', 'error');
      return;
    }
    if (fromAccountId === toAccountId) {
      showToast('Seleccione cuentas de origen y destino distintas', 'error');
      return;
    }
    const success = store.transferBetweenMoneyBoxes({
      fromBoxId: fromAccountId,
      toBoxId: toAccountId,
      amount: transferAmount,
      description: transferDesc,
      user: currentUser,
    });
    if (success) {
      showToast(`Transferencia de $${transferAmount.toLocaleString('es-AR')} completada con éxito`, 'success');
      setIsTransferModalOpen(false);
      setTransferAmount(0);
      setTransferDesc('');
    } else {
      showToast('No se pudo efectuar la transferencia bancaria', 'error');
    }
  };

  const handleCreateAccount = () => {
    if (!newAccName.trim()) {
      showToast('Ingrese el nombre de la entidad o cuenta', 'error');
      return;
    }
    const newBox: MoneyBox = {
      id: `mb-${Date.now()}`,
      name: newAccName.trim(),
      type: newAccType === 'Billetera Virtual' ? 'digital_wallet' : 'bank_account',
      accountType: newAccType,
      currency: 'ARS',
      currentBalance: newAccBalance || 0,
      bankName: newAccName.trim(),
      cbuCvu: newAccCbu.trim(),
      alias: newAccAlias.trim(),
      accountHolder: newAccHolder.trim(),
      lastSyncDate: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      active: true,
    };
    store.saveMoneyBox(newBox);
    showToast(`Cuenta "${newBox.name}" registrada exitosamente`, 'success');
    setIsNewAccountModalOpen(false);
    setNewAccName('');
    setNewAccCbu('');
    setNewAccAlias('');
    setNewAccBalance(0);
  };

  const handleImportStatement = (acc: MoneyBox) => {
    showToast(`Extracto bancario importado para ${acc.name}. Movimientos sincronizados.`, 'success');
  };

  const handleFetchEmails = (acc: MoneyBox) => {
    showToast(`Búsqueda de comprobantes por email sincronizada para ${acc.name}.`, 'info');
  };

  const totalBankBalance = store.moneyBoxes.reduce((acc, m) => acc + (m.currentBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            Cuentas Bancarias y Billeteras Virtuales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de saldos, CBU/CVU, alias y sincronización bancaria de la empresa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-transfer-bank-accounts"
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            Transferir entre Cuentas
          </button>
          <button
            id="btn-new-bank-account"
            onClick={() => setIsNewAccountModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Global Balance Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Saldo Total Consolidado en Bancos y Billeteras
          </span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">
            ${totalBankBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {store.moneyBoxes.length} cuentas y billeteras activas
        </div>
      </div>

      {/* Accounts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {store.moneyBoxes.map((acc) => {
          const isNegative = acc.currentBalance < 0;

          return (
            <div
              key={acc.id}
              id={`card-bank-acc-${acc.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Header of card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{acc.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {acc.isMain && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Principal
                        </span>
                      )}
                      {!acc.active && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-slate-100 text-slate-500 border border-slate-200">
                          Inactiva
                        </span>
                      )}
                      {acc.accountType && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {acc.accountType}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">ARS</span>
                </div>

                {/* Balance */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Actual</span>
                  <span
                    className={`text-2xl font-black mt-0.5 block ${
                      isNegative ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    ${acc.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  {acc.lastSyncDate && (
                    <div className="text-[11px] text-slate-400">
                      Última sincronización: <strong className="text-slate-600">{acc.lastSyncDate}</strong>
                    </div>
                  )}
                  {acc.accountHolder && (
                    <div>
                      <span className="text-slate-400">Titular:</span>{' '}
                      <strong className="text-slate-800">{acc.accountHolder}</strong>
                    </div>
                  )}
                  {acc.cbuCvu && (
                    <div>
                      <span className="text-slate-400">CBU:</span>{' '}
                      <span className="font-mono text-slate-700 font-semibold">{acc.cbuCvu}</span>
                    </div>
                  )}
                  {acc.alias && (
                    <div>
                      <span className="text-slate-400">Alias:</span>{' '}
                      <span className="font-mono font-bold text-indigo-700">{acc.alias}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleImportStatement(acc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  Importar
                </button>
                <button
                  onClick={() => handleFetchEmails(acc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  Emails
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                Transferir entre Cuentas Bancarias
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cuenta Origen</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {store.moneyBoxes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Saldo: ${m.currentBalance.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cuenta Destino</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {store.moneyBoxes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Saldo: ${m.currentBalance.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Monto a Transferir ($)</label>
                <input
                  type="number"
                  value={transferAmount || ''}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-base font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Concepto / Motivo</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  placeholder="Ej: Fondeo de cuenta sueldos / Pago"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransfer}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Confirmar Transferencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Nueva Cuenta Bancaria / Billetera
              </h3>
              <button
                onClick={() => setIsNewAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre / Banco</label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="Ej: Banco BBVA / Ualá"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Cuenta</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                  <option value="Caja de Ahorro">Caja de Ahorro</option>
                  <option value="Billetera Virtual">Billetera Virtual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Titular</label>
                <input
                  type="text"
                  value={newAccHolder}
                  onChange={(e) => setNewAccHolder(e.target.value)}
                  placeholder="Nombre del Titular"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">CBU / CVU (22 dígitos)</label>
                <input
                  type="text"
                  value={newAccCbu}
                  onChange={(e) => setNewAccCbu(e.target.value)}
                  placeholder="0110107830010711125883"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Alias</label>
                <input
                  type="text"
                  value={newAccAlias}
                  onChange={(e) => setNewAccAlias(e.target.value)}
                  placeholder="bruzzone.bbva"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Saldo Inicial ($)</label>
                <input
                  type="number"
                  value={newAccBalance || ''}
                  onChange={(e) => setNewAccBalance(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewAccountModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAccount}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Guardar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
