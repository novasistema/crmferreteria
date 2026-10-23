import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Warehouse } from '../../types';
import {
  User as UserIcon,
  Store,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface UserBranchLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserBranchLoginModal: React.FC<UserBranchLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { store, currentUser, setCurrentUser, activeWarehouseId, setActiveWarehouseId, showToast } = useApp();

  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const selectedUser = store.users.find((u) => u.id === selectedUserId) || currentUser;

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    selectedUser.branchId || activeWarehouseId || '1'
  );

  if (!isOpen) return null;

  const handleUserSelect = (u: User) => {
    setSelectedUserId(u.id);
    if (u.branchId) {
      setSelectedBranchId(u.branchId);
    }
  };

  const handleConfirmLogin = () => {
    const userToLogin = store.users.find((u) => u.id === selectedUserId);
    if (!userToLogin) return;

    setCurrentUser(userToLogin);
    setActiveWarehouseId(selectedBranchId);

    const wh = store.warehouses.find((w) => w.id === selectedBranchId);
    showToast(
      `Sesión iniciada como ${userToLogin.name} en ${wh ? wh.name : 'Casa Central'}`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">Cambio de Operador & Sucursal</h3>
              <p className="text-[11px] text-slate-300">
                Seleccione el usuario y la sede asignada para registrar ventas y cierres de caja
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* User Selection List */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              1. Seleccionar Operador / Usuario
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {store.users.map((u) => {
                const isSelected = u.id === selectedUserId;
                const assignedWh = store.warehouses.find((w) => w.id === u.branchId);

                return (
                  <div
                    key={u.id}
                    onClick={() => handleUserSelect(u)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{u.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {u.role.toUpperCase()} {assignedWh ? `• Sede: ${assignedWh.name}` : '• Todas las Sedes'}
                        </span>
                      </div>
                    </div>

                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branch Selection */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span>2. Sucursal / Sede de Trabajo para esta Sesión</span>
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-800 text-xs font-bold text-white rounded-lg px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {store.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isMain ? '(Casa Central)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Las ventas y el stock descontado se asociarán automáticamente a esta sede.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmLogin}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg flex items-center space-x-1.5"
          >
            <span>Ingresar con este Usuario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
