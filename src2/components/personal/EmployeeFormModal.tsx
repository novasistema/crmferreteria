import React, { useState, useEffect } from 'react';
import { Employee, EmployeeWeeklySchedule } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, User, Briefcase, Clock, Landmark, DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
}) => {
  const { store, showToast } = useApp();

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    alias: string;
    dni: string;
    phone: string;
    email: string;
    position: string;
    hireDate: string;
    baseSalary: number | string;
    paymentFrequency: 'monthly' | 'biweekly' | 'weekly';
    commissionRatePercent: number | string;
    branchId: string;
    weeklySchedule: EmployeeWeeklySchedule;
    bankName: string;
    accountNumber: string;
    cbu: string;
  }>({
    firstName: '',
    lastName: '',
    alias: '',
    dni: '',
    phone: '',
    email: '',
    position: 'Ventas y Atención',
    hireDate: new Date().toISOString().slice(0, 10),
    baseSalary: 0,
    paymentFrequency: 'monthly',
    commissionRatePercent: 0,
    branchId: '',
    weeklySchedule: {
      monday: 'full',
      tuesday: 'full',
      wednesday: 'full',
      thursday: 'full',
      friday: 'full',
      saturday: 'half',
    },
    bankName: '',
    accountNumber: '',
    cbu: '',
  });

  useEffect(() => {
    if (employeeToEdit) {
      // Split full name into first and last name if possible
      const parts = employeeToEdit.name.split(' ');
      const fName = parts[0] || '';
      const lName = employeeToEdit.lastName || parts.slice(1).join(' ') || '';

      setFormData({
        firstName: fName,
        lastName: lName,
        alias: employeeToEdit.alias || '',
        dni: employeeToEdit.dni || '',
        phone: employeeToEdit.phone || '',
        email: employeeToEdit.email || '',
        position: employeeToEdit.position || '',
        hireDate: employeeToEdit.hireDate || new Date().toISOString().slice(0, 10),
        baseSalary: employeeToEdit.baseSalary || 0,
        paymentFrequency: employeeToEdit.paymentFrequency || 'monthly',
        commissionRatePercent: employeeToEdit.commissionRatePercent || 0,
        branchId: employeeToEdit.branchId || '',
        weeklySchedule: employeeToEdit.weeklySchedule || {
          monday: 'full',
          tuesday: 'full',
          wednesday: 'full',
          thursday: 'full',
          friday: 'full',
          saturday: 'half',
        },
        bankName: employeeToEdit.bankName || '',
        accountNumber: employeeToEdit.accountNumber || '',
        cbu: employeeToEdit.cbu || '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        alias: '',
        dni: '',
        phone: '',
        email: '',
        position: 'Ventas y Atención',
        hireDate: new Date().toISOString().slice(0, 10),
        baseSalary: 0,
        paymentFrequency: 'monthly',
        commissionRatePercent: 0,
        branchId: '',
        weeklySchedule: {
          monday: 'full',
          tuesday: 'full',
          wednesday: 'full',
          thursday: 'full',
          friday: 'full',
          saturday: 'half',
        },
        bankName: '',
        accountNumber: '',
        cbu: '',
      });
    }
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    const fullName = formData.lastName.trim()
      ? `${formData.firstName.trim()} ${formData.lastName.trim()}`
      : formData.firstName.trim();

    const employeeData: Employee = {
      id: employeeToEdit ? employeeToEdit.id : `emp-${Date.now()}`,
      code: employeeToEdit?.code || `EMP-${String(store.employees.length + 1).padStart(2, '0')}`,
      name: fullName,
      lastName: formData.lastName.trim(),
      alias: formData.alias.trim(),
      dni: formData.dni.trim(),
      cuil: formData.dni.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: employeeToEdit?.address || '',
      position: formData.position.trim() || 'Empleado',
      hireDate: formData.hireDate || new Date().toISOString().slice(0, 10),
      baseSalary: Number(formData.baseSalary) || 0,
      paymentFrequency: formData.paymentFrequency,
      commissionRatePercent: Number(formData.commissionRatePercent) || 0,
      branchId: formData.branchId || undefined,
      weeklySchedule: formData.weeklySchedule,
      bankName: formData.bankName.trim(),
      accountNumber: formData.accountNumber.trim(),
      cbu: formData.cbu.trim(),
      active: employeeToEdit ? employeeToEdit.active : true,
    };

    store.saveEmployee(employeeData);
    showToast(
      employeeToEdit
        ? `Empleado ${fullName} actualizado con éxito`
        : `Empleado ${fullName} registrado con éxito`,
      'success'
    );
    onClose();
  };

  const updateScheduleDay = (day: keyof EmployeeWeeklySchedule, value: 'full' | 'half' | 'off') => {
    setFormData((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              {employeeToEdit ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {employeeToEdit ? 'Modifica los datos del empleado' : 'Ingresa los datos del nuevo empleado'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Section: Datos Personales */}
          <div>
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Datos Personales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Ej: Juan"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ej: Pérez"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alias
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="Apodo o nombre corto"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  placeholder="Ej: 35.123.456"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: 358-4123456"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Datos Laborales */}
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Datos Laborales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ej: Ventas Mostrador"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sueldo Base
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Frecuencia de Pago
                </label>
                <select
                  value={formData.paymentFrequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentFrequency: e.target.value as 'monthly' | 'biweekly' | 'weekly',
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  % Bono por Ventas
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commissionRatePercent}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionRatePercent: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-8"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Porcentaje sobre ventas semanales
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sucursal
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Sin sucursal asignada</option>
                  {store.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Se usa para calcular el bono por ventas de la sucursal
                </span>
              </div>
            </div>
          </div>

          {/* Section: Horario Semanal */}
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Horario Semanal
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {(
                [
                  { key: 'monday', label: 'Lunes' },
                  { key: 'tuesday', label: 'Martes' },
                  { key: 'wednesday', label: 'Miércoles' },
                  { key: 'thursday', label: 'Jueves' },
                  { key: 'friday', label: 'Viernes' },
                  { key: 'saturday', label: 'Sábado' },
                ] as const
              ).map((day) => (
                <div key={day.key} className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                  <span className="block text-xs font-medium text-slate-300 mb-1.5">
                    {day.label}
                  </span>
                  <select
                    value={formData.weeklySchedule[day.key] || 'full'}
                    onChange={(e) =>
                      updateScheduleDay(day.key, e.target.value as 'full' | 'half' | 'off')
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="full">Día Completo</option>
                    <option value="half">Medio Día</option>
                    <option value="off">Franco / Libre</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Datos Bancarios */}
          <div>
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              Datos Bancarios
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Ej: Banco Santander / Macro"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Ej: CC-0129-9382"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CBU
                </label>
                <input
                  type="text"
                  value={formData.cbu}
                  onChange={(e) => setFormData({ ...formData, cbu: e.target.value })}
                  placeholder="22 dígitos o Alias CBU"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/30 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
