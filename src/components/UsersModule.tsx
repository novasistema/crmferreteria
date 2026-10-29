import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Check,
  UserCheck,
  Building,
  Factory,
  ShoppingCart,
  Truck,
  CircleDollarSign,
  Compass
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

interface UsersModuleProps {
  users: AppUser[];
  currentUser: AppUser | null;
  onSaveUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export const UsersModule: React.FC<UsersModuleProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [form, setForm] = useState<Partial<AppUser>>({
    name: '',
    email: '',
    role: 'ventas',
    roleLabel: 'Ventas, Pedidos & ARCA',
    password: '',
    phone: '',
    active: true,
    avatarColor: '#0284c7'
  });

  const roleOptions: { role: UserRole; label: string; color: string; icon: any }[] = [
    { role: 'creador', label: 'Creador del Sistema / Master Owner', color: '#4f46e5', icon: ShieldCheck },
    { role: 'admin', label: 'Gerente General & Admin', color: '#d31627', icon: ShieldCheck },
    { role: 'produccion', label: 'Jefe de Planta & Fórmulas', color: '#ea580c', icon: Factory },
    { role: 'ventas', label: 'Ventas, Pedidos & ARCA', color: '#0284c7', icon: ShoppingCart },
    { role: 'vendedor_calle', label: 'Vendedor de Calle / Preventista', color: '#059669', icon: Compass },
    { role: 'logistica', label: 'Logística & Despachos', color: '#16a34a', icon: Truck },
    { role: 'finanzas', label: 'Cuentas Corrientes & Finanzas', color: '#7c3aed', icon: CircleDollarSign },
  ];

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = search === '' || 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.roleLabel.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    const roleMeta = roleOptions.find(r => r.role === form.role) || roleOptions[0];

    const userToSave: AppUser = {
      id: form.id || `user-${Date.now()}`,
      name: form.name,
      email: form.email.toLowerCase().trim(),
      role: form.role as UserRole,
      roleLabel: roleMeta.label,
      password: form.password || '1234',
      phone: form.phone || '',
      avatarColor: roleMeta.color,
      active: form.active ?? true,
      createdAt: form.createdAt || new Date().toISOString()
    };

    await onSaveUser(userToSave);
    setShowModal(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPassword) return;

    await onSaveUser({
      ...selectedUserForPassword,
      password: newPassword
    });

    setShowPasswordModal(false);
    setSelectedUserForPassword(null);
    setNewPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Gestión de Usuarios & Personal de Fábrica
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {users.length} Usuarios Activos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de accesos y credenciales por rol: Gerencia, Producción, Ventas, Logística y Finanzas.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setForm({
                name: '',
                email: '',
                role: 'ventas',
                roleLabel: 'Ventas, Pedidos & ARCA',
                password: '',
                phone: '',
                active: true,
                avatarColor: '#0284c7'
              });
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por nombre, email o cargo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 w-full focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">Roles:</span>
            {['all', 'admin', 'produccion', 'ventas', 'logistica', 'finanzas'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg capitalize transition-colors ${
                  roleFilter === r
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'all' ? 'Todos' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          return (
            <div 
              key={user.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                      style={{ backgroundColor: user.avatarColor || '#d31627' }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {user.name}
                      </h3>
                      <span className="text-xs text-slate-500 block truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    user.active 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Rol asignado:</span>
                    <strong className="text-slate-800">{user.roleLabel}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Contraseña:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
                      {user.password || 'admin'}
                    </span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Teléfono:</span>
                      <span className="text-slate-700 font-medium">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPassword(user);
                    setNewPassword(user.password || '');
                    setShowPasswordModal(true);
                  }}
                  className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Modificar Clave
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(user);
                      setShowModal(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Editar usuario"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {user.id !== 'user-admin' && (
                    <button
                      type="button"
                      onClick={() => onDeleteUser(user.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT USER */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {form.id ? 'Editar Usuario' : 'Nuevo Usuario de Fábrica'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Lic. Gustavo Morales"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email de Acceso</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="ejemplo@colorearpinturas.com.ar"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rol / Departamento</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {roleOptions.map(r => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña Inicial</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Dejar vacío o escribir contraseña..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+54 11 4890-7000"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeUser"
                  checked={form.active ?? true}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded text-[#d31627] focus:ring-red-500"
                />
                <label htmlFor="activeUser" className="text-xs font-bold text-slate-700">
                  Usuario Habilitado para Ingresar
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Modificar Contraseña
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Para el usuario: <strong>{selectedUserForPassword.name}</strong> ({selectedUserForPassword.email})
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Ingrese nueva contraseña..."
                  className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl"
                >
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
