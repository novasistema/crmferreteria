import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  ShieldCheck,
  Check,
  Lock,
  Unlock,
  UserCheck,
  Save,
  Key,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

export const UserRoleManager: React.FC = () => {
  const { store, showToast } = useApp();

  const usersList = [
    { id: 'usr-1', name: 'Mauri Serassio', role: 'Administrador / Creador', email: 'mauri24serassio@gmail.com' },
    { id: 'usr-2', name: 'Carlos Gomez', role: 'Vendedor / Mostrador', email: 'carlos@ferreteria.com' },
    { id: 'usr-3', name: 'Mariana Lopez', role: 'Cajera', email: 'mariana@ferreteria.com' },
    { id: 'usr-4', name: 'Esteban Ruiz', role: 'Encargado de Depósito', email: 'esteban@ferreteria.com' },
  ];

  const [selectedUserId, setSelectedUserId] = useState(usersList[0].id);

  // Stored permissions per user in settings or local state
  const [userPermissions, setUserPermissions] = useState<Record<string, Record<string, boolean>>>(
    store.settings.userRolePermissions || {
      'usr-1': { sales: true, distribuidora: true, purchases: true, products: true, accounting: true, admin: true, config: true },
      'usr-2': { sales: true, distribuidora: false, purchases: false, products: true, accounting: false, admin: false, config: false },
      'usr-3': { sales: true, distribuidora: false, purchases: false, products: false, accounting: false, admin: false, config: false },
      'usr-4': { sales: false, distribuidora: true, purchases: true, products: true, accounting: false, admin: false, config: false },
    }
  );

  const modulesToConfigure = [
    { key: 'sales', name: 'Ventas & POS', desc: 'Punto de venta, historial, cotizaciones, remitos' },
    { key: 'distribuidora', name: 'Distribuidora & Mayorista', desc: 'Pedidos mayoristas, envíos y catálogo visual' },
    { key: 'purchases', name: 'Compras & Proveedores', desc: 'Pedidos de compra y gestión de proveedores' },
    { key: 'products', name: 'Inventario & Productos', desc: 'Stock, listas de precios y modificación masiva' },
    { key: 'accounting', name: 'Contabilidad', desc: 'Módulo contable y submódulos' },
    { key: 'admin', name: 'Administración & Finanzas', desc: 'Caja diaria, bancos, deudas y reportes AFIP' },
    { key: 'config', name: 'Configuración & Creador', desc: 'Parámetros del sistema, respaldos y control de módulos' },
  ];

  const currentUserPerms = userPermissions[selectedUserId] || {};

  const handleTogglePerm = (moduleKey: string) => {
    const updatedUserPerms = {
      ...currentUserPerms,
      [moduleKey]: !currentUserPerms[moduleKey],
    };
    const updatedAll = {
      ...userPermissions,
      [selectedUserId]: updatedUserPerms,
    };
    setUserPermissions(updatedAll);
    store.saveSettings({
      ...store.settings,
      userRolePermissions: updatedAll,
    });
    showToast('Permisos granulares actualizados para el usuario', 'success');
  };

  const handleExportExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Usuario,Rol,Email,Modulo,Acceso\n';
    usersList.forEach((u) => {
      const perms = userPermissions[u.id] || {};
      Object.entries(perms).forEach(([mod, allowed]) => {
        csvContent += `"${u.name}","${u.role}","${u.email}","${mod}","${allowed ? 'Permitido' : 'Restringido'}"\n`;
      });
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_permisos_usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte de permisos exportado a Excel/CSV con éxito', 'success');
  };

  const selectedUser = usersList.find((u) => u.id === selectedUserId) || usersList[0];

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl border border-purple-400/40">
              <Key className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Control Granular de Permisos
                </span>
                <span className="text-xs text-purple-200">Seguridad por Empleado</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                UserRoleManager (Permisos por Usuario)
              </h1>
              <p className="text-purple-200 text-xs mt-0.5">
                Restringe qué módulos específicos puede ver y utilizar cada empleado dentro del sistema.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar Permisos (Excel/CSV)
          </button>
        </div>

        {/* Main Grid: Users list on left, Permissions matrix on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
              Seleccionar Empleado / Usuario
            </h3>
            <div className="space-y-2">
              {usersList.map((u) => {
                const isSelected = u.id === selectedUserId;
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{u.name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                        {u.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">{u.email}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" /> Permisos para: {selectedUser.name}
                </h3>
                <p className="text-xs text-slate-400">Rol actual: {selectedUser.role}</p>
              </div>
            </div>

            <div className="space-y-3">
              {modulesToConfigure.map((mod) => {
                const isAllowed = currentUserPerms[mod.key] !== false;
                return (
                  <div
                    key={mod.key}
                    onClick={() => handleTogglePerm(mod.key)}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      isAllowed
                        ? 'bg-slate-950 border-emerald-500/40 hover:border-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isAllowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {isAllowed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{mod.name}</h4>
                        <p className="text-[11px] text-slate-400">{mod.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg ${isAllowed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {isAllowed ? 'Acceso Permitido' : 'Restringido'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
