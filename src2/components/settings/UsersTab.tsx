import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, RoleDefinition, SystemModuleInfo } from '../../types';
import {
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  Edit2,
  Building,
  DollarSign,
  Key,
  ShieldCheck,
  AlertCircle,
  Search,
  Trash2,
  Plus,
  LayoutGrid,
  Package,
  ShoppingCart,
  ReceiptText,
  FileText,
  Printer,
  ClipboardList,
  ShoppingBag,
  Heart,
  Ticket,
  Cake,
  Dices,
  RotateCcw,
  Tag,
  Globe,
  Store,
  Wrench,
  Truck,
  CreditCard,
  Boxes,
  AlertTriangle,
  Sliders,
  Layers,
  ArrowLeftRight,
  Download,
  PackagePlus,
  Tags,
  Landmark,
  Receipt,
  ArrowUpDown,
  Scale,
  Calculator,
  TrendingDown,
  TrendingUp,
  Brain,
  FileSpreadsheet,
  FileCheck,
  UserCheck,
  Wallet,
  Smartphone,
  Settings,
  Plug,
  Megaphone,
  Target,
  MessageSquare,
  Headphones,
  MessagesSquare,
  Sparkles,
  Check,
  Lock,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';

type TabView = 'users' | 'roles' | 'modules';

// Map icon names to Lucide icons
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart,
  ReceiptText,
  FileText,
  Printer,
  ClipboardList,
  ShoppingBag,
  RotateCcw,
  Tag,
  Ticket,
  Heart,
  Cake,
  Dices,
  Users,
  Scale,
  Calculator,
  Package,
  Boxes,
  AlertTriangle,
  Sliders,
  Layers,
  TrendingUp,
  Building,
  ArrowLeftRight,
  Truck,
  Download,
  PackagePlus,
  Tags,
  DollarSign,
  Building2: Building,
  CreditCard,
  Landmark,
  Receipt,
  ArrowUpDown,
  TrendingDown,
  Wallet,
  Smartphone,
  Brain,
  FileSpreadsheet,
  FileCheck,
  LayoutDashboard: LayoutGrid,
  Store,
  Image: Package,
  Globe,
  Wrench,
  UserCheck,
  Settings,
  Plug,
  Megaphone,
  Target,
  MessageSquare,
  Headphones,
  MessagesSquare,
  Sparkles,
};

export const UsersTab: React.FC = () => {
  const { store, showToast, currentUser, setActiveModule } = useApp();

  const [activeTab, setActiveTab] = useState<TabView>('users');

  // Search terms
  const [userSearch, setUserSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<string>('Todos');

  // User Modals State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    role: string;
    branchId: string;
    assignedCashRegisterId: string;
    active: boolean;
    password?: string;
  }>({
    name: '',
    email: '',
    role: 'Vendedor',
    branchId: store.warehouses[0]?.id || '1',
    assignedCashRegisterId: store.cashRegisters[0]?.id || 'reg-mostrador',
    active: true,
    password: '',
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Role Modals State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState<{
    name: string;
    description: string;
    color: string;
  }>({
    name: '',
    description: '',
    color: 'blue',
  });

  // Permissions Config Modal for a Role
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<RoleDefinition | null>(null);

  // Module Permissions Config Modal
  const [isModulePermsModalOpen, setIsModulePermsModalOpen] = useState(false);
  const [selectedModuleForPerms, setSelectedModuleForPerms] = useState<SystemModuleInfo | null>(null);

  // System Roles List
  const roles = store.roles || [];
  const systemModules = store.systemModules || [];

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return store.users.filter((u) => {
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role && u.role.toLowerCase().includes(q))
      );
    });
  }, [store.users, userSearch]);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      if (!roleSearch.trim()) return true;
      const q = roleSearch.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    });
  }, [roles, roleSearch]);

  // Categories list for modules
  const moduleCategories = useMemo(() => {
    const cats = Array.from(new Set(systemModules.map((m) => m.category)));
    return ['Todos', ...cats];
  }, [systemModules]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return systemModules.filter((m) => {
      const matchCategory =
        moduleCategoryFilter === 'Todos' || m.category === moduleCategoryFilter;
      if (!matchCategory) return false;
      if (!moduleSearch.trim()) return true;
      const q = moduleSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.allowedRoles.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [systemModules, moduleCategoryFilter, moduleSearch]);

  // --- USER HANDLERS ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      role: 'Vendedor',
      branchId: store.warehouses[0]?.id || '1',
      assignedCashRegisterId: store.cashRegisters[0]?.id || 'reg-mostrador',
      active: true,
      password: '',
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role || 'Sin rol',
      branchId: user.branchId || store.warehouses[0]?.id || '1',
      assignedCashRegisterId: user.assignedCashRegisterId || store.cashRegisters[0]?.id || 'reg-mostrador',
      active: user.active !== false,
      password: '',
    });
    setIsUserModalOpen(true);
  };

  const handleToggleUserStatus = (user: User) => {
    if (user.id === currentUser?.id) {
      showToast('No podés desactivar tu propio usuario en sesión', 'error');
      return;
    }
    const updated: User = {
      ...user,
      active: user.active === false,
    };
    store.saveUser(updated);
    showToast(
      `Usuario ${user.name} ${updated.active ? 'activado' : 'desactivado'} correctamente`,
      'success'
    );
  };

  const handleUserRoleChange = (user: User, newRole: string) => {
    const updated: User = {
      ...user,
      role: newRole as UserRole,
    };
    store.saveUser(updated);
    showToast(`Rol de "${user.name}" actualizado a "${newRole}"`, 'success');
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      showToast('No podés eliminar tu propio usuario en sesión', 'error');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el usuario "${user.name}"?`)) {
      store.deleteUser(user.id);
      showToast(`Usuario "${user.name}" eliminado`, 'success');
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      showToast('Complete nombre y correo electrónico', 'error');
      return;
    }

    const newUser: User = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      role: userForm.role as UserRole,
      branchId: userForm.branchId,
      assignedCashRegisterId: userForm.assignedCashRegisterId,
      active: userForm.active,
    };

    store.saveUser(newUser);
    showToast(
      editingUser
        ? `Usuario ${newUser.name} actualizado`
        : `Nuevo usuario ${newUser.name} creado con éxito`,
      'success'
    );
    setIsUserModalOpen(false);
  };

  const handleOpenPasswordModal = (user: User) => {
    setPasswordUser(user);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Ingresá una contraseña válida', 'error');
      return;
    }
    showToast(`Contraseña actualizada con éxito para ${passwordUser?.name}`, 'success');
    setIsPasswordModalOpen(false);
  };

  // --- ROLE HANDLERS ---
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      color: 'blue',
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      color: role.color || 'blue',
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      showToast('Ingresá un nombre para el rol', 'error');
      return;
    }

    const newRole: RoleDefinition = {
      id: editingRole ? editingRole.id : `role-${Date.now()}`,
      name: roleForm.name.trim(),
      description: roleForm.description.trim(),
      isSystem: editingRole ? editingRole.isSystem : false,
      color: roleForm.color,
      allowedModules: editingRole ? editingRole.allowedModules : ['pos', 'sales_history'],
      permissions: editingRole
        ? editingRole.permissions
        : { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
    };

    store.saveRole(newRole);
    showToast(
      editingRole ? `Rol "${newRole.name}" actualizado` : `Nuevo rol "${newRole.name}" creado`,
      'success'
    );
    setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (role: RoleDefinition) => {
    if (role.isSystem) {
      showToast('No se pueden eliminar roles protegidos del sistema', 'error');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) {
      store.deleteRole(role.id);
      showToast(`Rol "${role.name}" eliminado`, 'success');
    }
  };

  const handleOpenRolePermissions = (role: RoleDefinition) => {
    setSelectedRoleForPerms(role);
    setIsPermissionsModalOpen(true);
  };

  const handleToggleModuleInRole = (moduleId: string) => {
    if (!selectedRoleForPerms) return;
    const currentList = selectedRoleForPerms.allowedModules || [];
    let updatedModules: string[];
    if (currentList.includes('*')) {
      // expand * into all modules except this one
      updatedModules = systemModules.map((m) => m.id).filter((id) => id !== moduleId);
    } else if (currentList.includes(moduleId)) {
      updatedModules = currentList.filter((id) => id !== moduleId);
    } else {
      updatedModules = [...currentList, moduleId];
    }

    const updatedRole: RoleDefinition = {
      ...selectedRoleForPerms,
      allowedModules: updatedModules,
    };
    setSelectedRoleForPerms(updatedRole);
    store.saveRole(updatedRole);
  };

  const handleToggleAllModulesInRole = (enableAll: boolean) => {
    if (!selectedRoleForPerms) return;
    const updatedRole: RoleDefinition = {
      ...selectedRoleForPerms,
      allowedModules: enableAll ? ['*'] : [],
    };
    setSelectedRoleForPerms(updatedRole);
    store.saveRole(updatedRole);
    showToast(
      enableAll
        ? `Todos los módulos concedidos al rol ${selectedRoleForPerms.name}`
        : `Módulos deshabilitados para el rol ${selectedRoleForPerms.name}`,
      'success'
    );
  };

  // --- MODULE HANDLERS ---
  const handleToggleModuleGlobal = (mod: SystemModuleInfo) => {
    store.toggleModuleStatus(mod.id);
    showToast(
      `Módulo "${mod.name}" ${!mod.isEnabled ? 'habilitado' : 'deshabilitado'} en el sistema`,
      'success'
    );
  };

  const handleOpenModulePermissions = (mod: SystemModuleInfo) => {
    setSelectedModuleForPerms(mod);
    setIsModulePermsModalOpen(true);
  };

  const handleToggleRoleForModule = (roleName: string) => {
    if (!selectedModuleForPerms) return;
    const currentRoles = selectedModuleForPerms.allowedRoles || [];
    const updatedRoles = currentRoles.includes(roleName)
      ? currentRoles.filter((r) => r !== roleName)
      : [...currentRoles, roleName];

    const updatedMod: SystemModuleInfo = {
      ...selectedModuleForPerms,
      allowedRoles: updatedRoles,
    };
    setSelectedModuleForPerms(updatedMod);
    store.saveSystemModule(updatedMod);
  };

  const handleToggleActionForModule = (
    action: 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar'
  ) => {
    if (!selectedModuleForPerms) return;
    const currentActions = selectedModuleForPerms.actions || [];
    const updatedActions = currentActions.includes(action)
      ? currentActions.filter((a) => a !== action)
      : [...currentActions, action];

    const updatedMod: SystemModuleInfo = {
      ...selectedModuleForPerms,
      actions: updatedActions,
    };
    setSelectedModuleForPerms(updatedMod);
    store.saveSystemModule(updatedMod);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Usuarios y Roles
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Gestiona usuarios del sistema, roles y permisos de acceso
        </p>
      </div>

      {/* Top Main Navigation Tabs */}
      <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'roles'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'modules'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Módulos ({systemModules.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: USUARIOS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center space-x-2.5">
              <Users className="w-5 h-5 text-slate-800 dark:text-slate-200" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Lista de Usuarios
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar usuario o rol..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenCreateUser}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Usuario</span>
              </button>
            </div>
          </div>

          {/* Users List (Design matching screenshot) */}
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const isActive = user.active !== false;

              return (
                <div
                  key={user.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {user.name}
                      </div>
                      {user.email && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Role Select, Edit, Password, Trash & Active Toggle */}
                  <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-end md:self-auto">
                    {/* Role Dropdown */}
                    <div className="relative min-w-[150px]">
                      <select
                        value={user.role || 'Sin rol'}
                        onChange={(e) => handleUserRoleChange(user, e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none pr-8"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(user)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Editar datos del usuario"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Key/Password Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPasswordModal(user)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Cambiar contraseña de acceso"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Active / Inactive Pill Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(user)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full transition-transform ${
                          isActive ? 'bg-white shadow-xs' : 'bg-slate-400'
                        }`}
                      />
                      <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                No se encontraron usuarios con el criterio de búsqueda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: ROLES */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center space-x-2.5">
              <Shield className="w-5 h-5 text-slate-800 dark:text-slate-200" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Roles del Sistema
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar rol..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenCreateRole}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Rol</span>
              </button>
            </div>
          </div>

          {/* Roles List (Design matching screenshot) */}
          <div className="space-y-3">
            {filteredRoles.map((role) => {
              const userCount = store.users.filter(
                (u) => u.role?.toLowerCase() === role.name.toLowerCase()
              ).length;

              return (
                <div
                  key={role.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  {/* Left: Role Name, Badge, Subtitle */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {role.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          role.isSystem
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {role.isSystem ? 'Sistema' : 'Personalizado'}
                      </span>
                      {userCount > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({userCount} {userCount === 1 ? 'usuario' : 'usuarios'})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {role.description}
                    </div>
                  </div>

                  {/* Right: Permisos button, Edit, Delete */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenRolePermissions(role)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>Permisos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditRole(role)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar rol"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRole(role)}
                      disabled={role.isSystem}
                      className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors ${
                        role.isSystem
                          ? 'opacity-30 cursor-not-allowed text-slate-400'
                          : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 cursor-pointer'
                      }`}
                      title={role.isSystem ? 'Rol del sistema protegido' : 'Eliminar rol'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: MÓDULOS (Complete Catalog of All System Modules) */}
      {/* ========================================================================= */}
      {activeTab === 'modules' && (
        <div className="space-y-5">
          {/* Metrics summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Total Módulos
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <LayoutGrid className="w-5 h-5 text-blue-500" />
                <span>{systemModules.length}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Módulos Habilitados
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{systemModules.filter((m) => m.isEnabled).length}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Categorías
              </div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-indigo-500" />
                <span>{moduleCategories.length - 1}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Roles de Seguridad
              </div>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-500" />
                <span>{roles.length}</span>
              </div>
            </div>
          </div>

          {/* Main Modules Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Todos los Módulos del Sistema ({systemModules.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control de disponibilidad de módulos, asignación de roles y permisos de acceso.
                  </p>
                </div>
              </div>

              {/* Search input */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar módulo, código o rol..."
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
              {moduleCategories.map((cat) => {
                const isSelected = moduleCategoryFilter === cat;
                const count =
                  cat === 'Todos'
                    ? systemModules.length
                    : systemModules.filter((m) => m.category === cat).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setModuleCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modules Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredModules.map((mod) => {
                const IconComponent = ICON_MAP[mod.iconName] || LayoutGrid;

                return (
                  <div
                    key={mod.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3.5 ${
                      mod.isEnabled
                        ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-800/80 opacity-75'
                    }`}
                  >
                    {/* Top Row: Icon, Title, Code, Status Toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            mod.isEnabled
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                              {mod.name}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                              {mod.code}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {mod.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Toggle button */}
                      <button
                        type="button"
                        onClick={() => handleToggleModuleGlobal(mod)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          mod.isEnabled
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                        }`}
                        title="Haga clic para habilitar o deshabilitar módulo"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            mod.isEnabled ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{mod.isEnabled ? 'Habilitado' : 'Inactivo'}</span>
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {mod.description}
                    </p>

                    {/* Bottom Metadata & Roles */}
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                          Roles:
                        </span>
                        {mod.allowedRoles.slice(0, 3).map((r) => (
                          <span
                            key={r}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {r}
                          </span>
                        ))}
                        {mod.allowedRoles.length > 3 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            +{mod.allowedRoles.length - 3}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenModulePermissions(mod)}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer self-end sm:self-auto"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                        <span>Permisos</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredModules.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No se encontraron módulos coincidentes con los filtros seleccionados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Crear / Editar Usuario */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Marisol Cavagna"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Correo Electrónico (Login) *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="marisol@bruzzone.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Rol Asignado
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Sucursal / Depósito
                  </label>
                  <select
                    value={userForm.branchId}
                    onChange={(e) => setUserForm((p) => ({ ...p, branchId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                  >
                    {store.warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Caja Registradora Habitual
                </label>
                <select
                  value={userForm.assignedCashRegisterId}
                  onChange={(e) =>
                    setUserForm((p) => ({ ...p, assignedCashRegisterId: e.target.value }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                >
                  {store.cashRegisters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.location || 'Principal'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={userForm.active}
                  onChange={(e) => setUserForm((p) => ({ ...p, active: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="userActiveCheck"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Usuario Activo para Iniciar Sesión
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Agregar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Cambiar Contraseña */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Credenciales de Acceso</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-white">
                  {passwordUser?.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {passwordUser?.email}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Guardar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Crear / Editar Rol */}
      {/* ========================================================================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre del Rol *
                </label>
                <input
                  type="text"
                  required
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Supervisor de Salón"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descripción de Alcance
                </label>
                <textarea
                  rows={2}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Ej: Acceso a ventas, clientes y autorización de descuentos especiales"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Configurar Permisos de Módulos para un Rol */}
      {/* ========================================================================= */}
      {isPermissionsModalOpen && selectedRoleForPerms && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Permisos de Acceso: {selectedRoleForPerms.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Seleccioná qué módulos puede ver y utilizar este rol.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {selectedRoleForPerms.allowedModules?.includes('*')
                  ? 'Acceso Total a Todos los Módulos'
                  : `${selectedRoleForPerms.allowedModules?.length || 0} módulos asignados`}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleToggleAllModulesInRole(true)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-200 dark:border-blue-800 cursor-pointer"
                >
                  Conceder Todo (*)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllModulesInRole(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Quitar Todo
                </button>
              </div>
            </div>

            {/* Modules Checkboxes List */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {moduleCategories
                .filter((c) => c !== 'Todos')
                .map((category) => {
                  const modsInCat = systemModules.filter((m) => m.category === category);

                  return (
                    <div key={category} className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                        <span>{category}</span>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {modsInCat.map((mod) => {
                          const isAllowed =
                            selectedRoleForPerms.allowedModules?.includes('*') ||
                            selectedRoleForPerms.allowedModules?.includes(mod.id);

                          return (
                            <div
                              key={mod.id}
                              onClick={() => handleToggleModuleInRole(mod.id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between space-x-2.5 cursor-pointer select-none transition-all ${
                                isAllowed
                                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-100'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                    isAllowed
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                  }`}
                                >
                                  {isAllowed && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-xs font-semibold truncate">{mod.name}</span>
                              </div>

                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                {mod.code}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Listo y Guardado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Configurar Permisos y Acciones de un Módulo */}
      {/* ========================================================================= */}
      {isModulePermsModalOpen && selectedModuleForPerms && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Permisos: {selectedModuleForPerms.name}
                </h3>
                <span className="text-[10px] font-mono text-blue-500 font-bold">
                  {selectedModuleForPerms.code} • {selectedModuleForPerms.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModulePermsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Roles with access */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">
                Roles con Acceso al Módulo:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => {
                  const hasAccess = selectedModuleForPerms.allowedRoles?.includes(r.name);
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleToggleRoleForModule(r.name)}
                      className={`p-2 rounded-xl border flex items-center space-x-2 cursor-pointer select-none transition-all ${
                        hasAccess
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          hasAccess
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {hasAccess && <Check className="w-3 h-3" />}
                      </div>
                      <span className="font-semibold text-xs truncate">{r.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions allowed */}
            <div className="space-y-2 text-xs pt-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 block">
                Acciones Permitidas en este Módulo:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ver', 'crear', 'editar', 'eliminar', 'exportar'] as const).map((action) => {
                  const isActionActive = selectedModuleForPerms.actions?.includes(action);
                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => handleToggleActionForModule(action)}
                      className={`p-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActionActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {action}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModulePermsModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
