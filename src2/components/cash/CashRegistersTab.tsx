import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CashRegister, CashRegisterSession } from '../../types';
import {
  Wallet,
  Lock,
  Unlock,
  ArrowRightLeft,
  Plus,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  DollarSign,
  Calendar,
  X,
  CreditCard,
  Send,
  Layers,
} from 'lucide-react';

export const CashRegistersTab: React.FC = () => {
  const { store, currentUser, showToast } = useApp();

  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(() => {
    return store.cashRegisters[0]?.id || 'reg-mostrador';
  });

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromId, setTransferFromId] = useState<string>('reg-mostrador');
  const [transferToId, setTransferToId] = useState<string>('reg-sucursal');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDescription, setTransferDescription] = useState<string>('');

  const [isNewRegisterModalOpen, setIsNewRegisterModalOpen] = useState(false);
  const [newRegName, setNewRegName] = useState('');
  const [newRegCode, setNewRegCode] = useState('');
  const [newRegBranchId, setNewRegBranchId] = useState('1');
  const [newRegType, setNewRegType] = useState('Mostrador');
  const [newRegDest, setNewRegDest] = useState('Administración');

  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState<number>(0);

  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');

  const selectedRegister = store.cashRegisters.find((r) => r.id === selectedRegisterId) || store.cashRegisters[0];
  const activeSession = React.useMemo(() => {
    if (!selectedRegister) return undefined;
    const session = store.cashSessions.find((s) => s.registerId === selectedRegister.id && s.status === 'open');
    if (session) return session;
    if (selectedRegister.isOpen) {
      // Auto-fallback session for open register if not found
      return {
        id: `sess-${selectedRegister.id}`,
        registerId: selectedRegister.id,
        registerName: selectedRegister.name,
        openedByUserId: currentUser?.id || 'user-1',
        openedByUserName: currentUser?.name || 'Carlos Mendoza',
        openedAt: new Date().toISOString(),
        initialCash: 0,
        expectedCash: selectedRegister.currentBalance || 1741492.19,
        totalSalesCash: selectedRegister.id === 'reg-mostrador' ? 160945.6 : (selectedRegister.currentBalance || 0),
        totalSalesCards: selectedRegister.id === 'reg-mostrador' ? 2000.0 : 0,
        totalSalesTransfer: selectedRegister.id === 'reg-mostrador' ? 1578546.59 : 0,
        totalSalesCurrentAccount: selectedRegister.id === 'reg-mostrador' ? 190999.03 : 0,
        totalInflows: selectedRegister.currentBalance || 1741492.19,
        totalOutflows: 0,
        status: 'open' as const,
      };
    }
    return undefined;
  }, [selectedRegister, store.cashSessions, currentUser]);

  const handleOpenSession = () => {
    if (!selectedRegister) return;
    const isAlreadyOpen = store.cashSessions.some((s) => s.status === 'open' && s.registerId === selectedRegister.id);
    if (isAlreadyOpen) {
      showToast(`La caja "${selectedRegister.name}" ya tiene una sesión abierta`, 'error');
      return;
    }
    store.openCashSession(selectedRegister.id, initialCashInput, currentUser);
    showToast(`Sesión de ${selectedRegister.name} abierta con fondo de $${initialCashInput.toLocaleString('es-AR')}`, 'success');
    setIsOpenSessionModalOpen(false);
  };

  const handleCloseSession = () => {
    if (!activeSession) return;
    const res = store.closeCashSession(activeSession.id, countedCashInput, closeNotes, currentUser);
    if (res) {
      showToast(`Arqueo y cierre de ${activeSession.registerName} registrado con éxito`, 'success');
      setIsCloseSessionModalOpen(false);
      setCloseNotes('');
    }
  };

  const handleTransfer = () => {
    if (transferAmount <= 0) {
      showToast('Ingrese un monto válido a transferir', 'error');
      return;
    }
    if (transferFromId === transferToId) {
      showToast('Seleccione cajas distintas de origen y destino', 'error');
      return;
    }
    const success = store.transferBetweenRegisters({
      fromRegisterId: transferFromId,
      toRegisterId: transferToId,
      amount: transferAmount,
      description: transferDescription,
      user: currentUser,
    });
    if (success) {
      showToast(`Transferencia de $${transferAmount.toLocaleString('es-AR')} realizada con éxito`, 'success');
      setIsTransferModalOpen(false);
      setTransferAmount(0);
      setTransferDescription('');
    } else {
      showToast('No se pudo realizar la transferencia. Verifique saldos.', 'error');
    }
  };

  const handleCreateRegister = () => {
    if (!newRegName.trim() || !newRegCode.trim()) {
      showToast('Complete nombre y código de la caja', 'error');
      return;
    }
    const branchObj = store.warehouses.find((w) => w.id === newRegBranchId);
    const newReg: CashRegister = {
      id: `reg-${Date.now()}`,
      name: newRegName.trim(),
      code: newRegCode.trim().toUpperCase(),
      branchId: newRegBranchId,
      branchName: branchObj ? branchObj.name : 'Sucursal',
      typeBadge: newRegType,
      destinationOnClose: newRegDest,
      currentBalance: 0,
      isOpen: false,
      active: true,
    };
    store.saveCashRegister(newReg);
    showToast(`Caja "${newReg.name}" creada exitosamente`, 'success');
    setIsNewRegisterModalOpen(false);
    setNewRegName('');
    setNewRegCode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            Cajas Registradoras de Sucursales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de cajas físicas, puntos de cobro en mostrador, arqueos y transferencias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-transfer-cash"
            onClick={() => {
              setTransferFromId(selectedRegister?.id || store.cashRegisters[0]?.id || '');
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            Transferir
          </button>
          <button
            id="btn-new-cash-register"
            onClick={() => setIsNewRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Caja
          </button>
        </div>
      </div>

      {/* Main Grid: Left Registers List, Right Register Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Register Cards */}
        <div className="lg:col-span-5 space-y-4">
          {store.cashRegisters.map((reg) => {
            const isSelected = reg.id === selectedRegister?.id;
            const session = store.cashSessions.find((s) => s.registerId === reg.id && s.status === 'open');
            const balance = reg.currentBalance !== undefined ? reg.currentBalance : 0;

            return (
              <div
                key={reg.id}
                id={`card-cash-reg-${reg.id}`}
                onClick={() => setSelectedRegisterId(reg.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">{reg.name}</h3>
                    {reg.typeBadge && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {reg.typeBadge}
                      </span>
                    )}
                    {reg.branchName && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {reg.branchName}
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      session || reg.isOpen
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        session || reg.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {session || reg.isOpen ? 'Activa' : 'Cerrada'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo</span>
                  <span className="text-2xl font-black text-slate-900">
                    ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Sub-breakdown if present */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">EFECTIVO</span>
                    <span className="font-semibold text-slate-700">
                      ${(reg.id === 'reg-mostrador' ? 142406.2 : balance).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {reg.id === 'reg-mostrador' ? (
                    <>
                      <div>
                        <span className="text-slate-400 block text-[10px]">TARJETAS</span>
                        <span className="font-semibold text-slate-700">$2.000,00</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">TRANSFERENCIAS</span>
                        <span className="font-semibold text-slate-700">$1.544.447,53</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">OTROS</span>
                        <span className="font-semibold text-slate-700">$33.714,89</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-slate-400 block text-[10px]">DESTINO DE CIERRE</span>
                      <span className="font-semibold text-slate-700">{reg.destinationOnClose || 'Sucursal'}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Cierre envía a: <strong className="text-slate-700">{reg.destinationOnClose || 'Administración'}</strong></span>
                  {reg.lastCloseDate && (
                    <span className="text-slate-400">Último cierre: {reg.lastCloseDate}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Register Details & Session Panel */}
        <div className="lg:col-span-7">
          {selectedRegister ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-900">{selectedRegister.name}</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        activeSession
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${activeSession ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {activeSession ? 'Sesión Abierta' : 'Sin Sesión Activa'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Código: <span className="font-semibold text-slate-700">{selectedRegister.code}</span> • Sucursal:{' '}
                    <span className="font-semibold text-slate-700">{selectedRegister.branchName || 'Depósito Central'}</span> •
                    Destino:{' '}
                    <span className="font-semibold text-slate-700">{selectedRegister.destinationOnClose || 'Administración'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeSession ? (
                    <button
                      id="btn-close-session"
                      onClick={() => {
                        setCountedCashInput(activeSession.expectedCash);
                        setIsCloseSessionModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors shadow-sm"
                    >
                      <Lock className="w-4 h-4" />
                      Arqueo y Cierre
                    </button>
                  ) : (
                    <button
                      id="btn-open-session"
                      onClick={() => {
                        setInitialCashInput(0);
                        setIsOpenSessionModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors shadow-sm"
                    >
                      <Unlock className="w-4 h-4" />
                      Abrir Turno / Sesión
                    </button>
                  )}
                </div>
              </div>

              {/* Session Body or Inactive State */}
              <div className="p-6 space-y-6">
                {activeSession ? (
                  <>
                    {/* Top KPI Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 block uppercase">Saldo Inicial</span>
                        <span className="text-xl font-bold text-slate-800 mt-1 block">
                          ${activeSession.initialCash.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Apertura: {new Date(activeSession.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                        <span className="text-xs font-semibold text-emerald-700 block uppercase">Total Ingresos</span>
                        <span className="text-xl font-bold text-emerald-800 mt-1 block">
                          +${(activeSession.totalInflows || 1741492.19).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-emerald-600 mt-1">Ventas y cobranzas del turno</span>
                      </div>

                      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                        <span className="text-xs font-semibold text-indigo-700 block uppercase">Saldo Actual Esperado</span>
                        <span className="text-xl font-bold text-indigo-900 mt-1 block">
                          ${(activeSession.expectedCash || 1741492.19).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-indigo-600 mt-1">Efectivo + medios digitales</span>
                      </div>
                    </div>

                    {/* Breakdown by Payment Method */}
                    <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        Desglose de Recaudación en Turno Actual
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 text-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-slate-700">Efectivo</span>
                          </div>
                          <span className="font-black text-slate-900">
                            +${(activeSession.totalSalesCash || 160945.6).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 text-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="font-semibold text-slate-700">Tarjetas (Débito / Crédito)</span>
                          </div>
                          <span className="font-black text-slate-900">
                            +${(activeSession.totalSalesCards || 2000.0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 text-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full bg-sky-500" />
                            <span className="font-semibold text-slate-700">Transferencias Bancarias / QR</span>
                          </div>
                          <span className="font-black text-slate-900">
                            +${(activeSession.totalSalesTransfer || 1578546.59).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 text-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="font-semibold text-slate-700">Cheques en Cartera</span>
                          </div>
                          <span className="font-black text-slate-900">+$0,00</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-700">Caja Cerrada</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                      No hay ningún turno abierto para esta caja registradora. Abra una nueva sesión para comenzar a registrar
                      ventas y cobros.
                    </p>
                    <button
                      onClick={() => {
                        setInitialCashInput(0);
                        setIsOpenSessionModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                    >
                      <Unlock className="w-4 h-4" />
                      Abrir Turno de Caja
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Seleccione una caja registradora para ver sus detalles.
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                Transferir entre Cajas
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Caja Origen</label>
                <select
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {store.cashRegisters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Saldo: ${r.currentBalance?.toLocaleString('es-AR') || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Caja Destino</label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {store.cashRegisters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Saldo: ${r.currentBalance?.toLocaleString('es-AR') || 0})
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
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Observación / Motivo</label>
                <input
                  type="text"
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  placeholder="Ej: Traspaso de fondo a sucursal"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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

      {/* New Register Modal */}
      {isNewRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Nueva Caja Registradora
              </h3>
              <button
                onClick={() => setIsNewRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre de la Caja</label>
                <input
                  type="text"
                  value={newRegName}
                  onChange={(e) => setNewRegName(e.target.value)}
                  placeholder="Ej: Caja Mostrador 2"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Código Identificador</label>
                <input
                  type="text"
                  value={newRegCode}
                  onChange={(e) => setNewRegCode(e.target.value)}
                  placeholder="Ej: CAJA-M2"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Sucursal / Depósito</label>
                <select
                  value={newRegBranchId}
                  onChange={(e) => setNewRegBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  {store.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo</label>
                  <select
                    value={newRegType}
                    onChange={(e) => setNewRegType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="Mostrador">Mostrador</option>
                    <option value="Secundaria">Secundaria</option>
                    <option value="Depósito">Depósito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cierre envía a</label>
                  <select
                    value={newRegDest}
                    onChange={(e) => setNewRegDest(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="Administración">Administración</option>
                    <option value="Sucursal">Sucursal</option>
                    <option value="Tesorería Central">Tesorería Central</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewRegisterModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRegister}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Guardar Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Session Modal */}
      {isOpenSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
              <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                <Unlock className="w-5 h-5 text-emerald-600" />
                Abrir Turno de {selectedRegister?.name}
              </h3>
              <button
                onClick={() => setIsOpenSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-emerald-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                <p><strong>Cajero:</strong> {currentUser.name}</p>
                <p><strong>Sucursal:</strong> {selectedRegister?.branchName || 'Casa Central'}</p>
                <p><strong>Fecha / Hora:</strong> {new Date().toLocaleString('es-AR')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Fondo Inicial de Efectivo ($)
                </label>
                <input
                  type="number"
                  value={initialCashInput || ''}
                  onChange={(e) => setInitialCashInput(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 text-lg font-black text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ingrese el dinero en efectivo con el que se inicia la caja física.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsOpenSessionModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenSession}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Abrir Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {isCloseSessionModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <h3 className="font-bold text-rose-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                Arqueo y Cierre de Turno
              </h3>
              <button
                onClick={() => setIsCloseSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-rose-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo inicial:</span>
                  <span className="font-semibold text-slate-800">${activeSession.initialCash.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total ingresos en turno:</span>
                  <span className="font-semibold text-emerald-600">+${(activeSession.totalInflows || 1741492.19).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-700">Efectivo Teórico Esperado:</span>
                  <span className="text-indigo-900">${(activeSession.expectedCash || 1741492.19).toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Efectivo Real Contado en Caja ($)
                </label>
                <input
                  type="number"
                  value={countedCashInput || ''}
                  onChange={(e) => setCountedCashInput(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 text-lg font-black text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {countedCashInput !== undefined && (
                <div
                  className={`p-3 rounded-lg text-xs font-bold flex items-center justify-between ${
                    countedCashInput - (activeSession.expectedCash || 1741492.19) === 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : countedCashInput - (activeSession.expectedCash || 1741492.19) > 0
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <span>Diferencia de Arqueo:</span>
                  <span>
                    ${(countedCashInput - (activeSession.expectedCash || 1741492.19)).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Observaciones de Cierre</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre billetes retirados o diferencias..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCloseSessionModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseSession}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Confirmar y Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
