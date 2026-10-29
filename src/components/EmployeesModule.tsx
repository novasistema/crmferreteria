import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  DollarSign, 
  Receipt, 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  Building2, 
  Download, 
  Printer, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  X,
  CreditCard,
  Send,
  Layers,
  Banknote
} from 'lucide-react';
import { Employee, SalaryPayment, EmployeeSector, SalaryPaymentType, Cashbox, CompanyConfig } from '../types';
import { generateSalaryDuplicateReceiptPDF, buildWhatsAppSalaryMessage } from '../utils/salaryReceiptPdfUtils';

interface EmployeesModuleProps {
  employees: Employee[];
  salaryPayments: SalaryPayment[];
  cashboxes: Cashbox[];
  config: CompanyConfig | null;
  onSaveEmployee: (employee: Employee) => Promise<void>;
  onRecordSalaryPayment: (payment: SalaryPayment) => Promise<void>;
}

export const SECTOR_LABELS: Record<EmployeeSector, string> = {
  dispersion_fabricacion: 'Dispersión & Fabricación de Pintura',
  control_calidad_laboratorio: 'Control de Calidad & Laboratorio',
  envasado_fraccionamiento: 'Envasado, Paletizado & Baldes',
  logistica_chofer: 'Logística, Chofer & Despacho',
  mantenimiento_taller: 'Mantenimiento & Mecánica de Planta',
  administracion_finanzas: 'Administración, Facturación & Finanzas',
  ventas_mostrador: 'Ventas de Fábrica & Atención'
};

export const EmployeesModule: React.FC<EmployeesModuleProps> = ({
  employees,
  salaryPayments,
  cashboxes,
  config,
  onSaveEmployee,
  onRecordSalaryPayment
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'payments_history'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isAdvanceMode, setIsAdvanceMode] = useState(false);
  const [recentGeneratedPayment, setRecentGeneratedPayment] = useState<{ payment: SalaryPayment; employee: Employee } | null>(null);

  // Employee Form
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({
    cuil: '',
    firstName: '',
    lastName: '',
    sector: 'dispersion_fabricacion',
    position: 'Operario de Molienda',
    hireDate: new Date().toISOString().split('T')[0],
    phone: '',
    email: '',
    address: '',
    city: 'Pilar',
    contractType: 'mensualizado',
    baseSalary: 850000,
    bankName: 'Banco Provincia',
    cbuOrAlias: '',
    active: true,
    notes: ''
  });

  // Salary Payment / Advance Form
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [paymentType, setPaymentType] = useState<SalaryPaymentType>('sueldo_mensual');
  const [paymentPeriod, setPaymentPeriod] = useState('Agosto 2026');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [selectedCashboxId, setSelectedCashboxId] = useState(cashboxes[0]?.id || '');
  const [baseAmount, setBaseAmount] = useState(0);
  const [overtimeAmount, setOvertimeAmount] = useState(0);
  const [presenteeismBonus, setPresenteeismBonus] = useState(0);
  const [advanceDeductions, setAdvanceDeductions] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Auto-fill values when employee is selected in payment modal
  const handleSelectEmployeeForPayment = (empId: string, isAdvance: boolean) => {
    setSelectedEmployeeId(empId);
    setIsAdvanceMode(isAdvance);
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const autoNumber = `REC-${isAdvance ? 'ADEL' : 'SUEL'}-2026-${String(Math.floor(Math.random() * 8999 + 1000)).padStart(4, '0')}`;
    setPaymentReceiptNumber(autoNumber);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentType(isAdvance ? 'adelanto' : 'sueldo_mensual');
    setPaymentPeriod(isAdvance ? 'Adelanto Agosto 2026' : 'Agosto 2026');

    if (isAdvance) {
      setBaseAmount(Math.round(emp.baseSalary * 0.3)); // 30% advance default
      setOvertimeAmount(0);
      setPresenteeismBonus(0);
      setAdvanceDeductions(0);
    } else {
      setBaseAmount(emp.baseSalary);
      setOvertimeAmount(0);
      setPresenteeismBonus(Math.round(emp.baseSalary * 0.08)); // 8% presenteeism
      
      // Calculate previous advances paid to this employee this month
      const prevAdvances = salaryPayments
        .filter(p => p.employeeId === emp.id && p.paymentType === 'adelanto' && p.period.includes('Agosto 2026'))
        .reduce((acc, p) => acc + p.netAmount, 0);
      setAdvanceDeductions(prevAdvances);
    }

    setShowPaymentModal(true);
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (sectorFilter !== 'all' && e.sector !== sectorFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = e.fullName.toLowerCase().includes(q) || e.firstName.toLowerCase().includes(q) || e.lastName.toLowerCase().includes(q);
        const matchesCuil = e.cuil.includes(q);
        const matchesPos = e.position.toLowerCase().includes(q);
        if (!matchesName && !matchesCuil && !matchesPos) return false;
      }
      return true;
    });
  }, [employees, sectorFilter, searchQuery]);

  // Payroll summary KPIs
  const totalMonthlyPayroll = employees.reduce((acc, e) => acc + (e.active ? e.baseSalary : 0), 0);
  const totalAdvancesPaidThisMonth = salaryPayments
    .filter(p => p.paymentType === 'adelanto')
    .reduce((acc, p) => acc + p.netAmount, 0);

  // Submit new employee
  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.cuil) return;

    const newEmp: Employee = {
      id: employeeForm.id || `emp-${Date.now()}`,
      cuil: employeeForm.cuil.trim(),
      firstName: employeeForm.firstName,
      lastName: employeeForm.lastName,
      fullName: `${employeeForm.lastName}, ${employeeForm.firstName}`,
      sector: employeeForm.sector || 'dispersion_fabricacion',
      position: employeeForm.position || 'Operario de Planta',
      hireDate: employeeForm.hireDate || new Date().toISOString().split('T')[0],
      phone: employeeForm.phone || '',
      email: employeeForm.email || '',
      address: employeeForm.address || '',
      city: employeeForm.city || 'Pilar',
      contractType: employeeForm.contractType || 'mensualizado',
      baseSalary: Number(employeeForm.baseSalary) || 0,
      bankName: employeeForm.bankName || '',
      cbuOrAlias: employeeForm.cbuOrAlias || '',
      active: employeeForm.active ?? true,
      notes: employeeForm.notes || '',
      createdAt: new Date().toISOString()
    };

    await onSaveEmployee(newEmp);
    setShowEmployeeModal(false);
  };

  // Submit payment / advance
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;

    const items = [];
    if (isAdvanceMode) {
      items.push({ concept: 'Adelanto / Anticipo de Sueldo', amount: baseAmount, type: 'haber' as const });
    } else {
      items.push({ concept: 'Sueldo Básico Acordado', amount: baseAmount, type: 'haber' as const });
      if (presenteeismBonus > 0) {
        items.push({ concept: 'Premio por Asistencia & Presentismo', amount: presenteeismBonus, type: 'haber' as const });
      }
      if (overtimeAmount > 0) {
        items.push({ concept: 'Horas Extras / Adicional de Producción', amount: overtimeAmount, type: 'haber' as const });
      }
      if (advanceDeductions > 0) {
        items.push({ concept: 'Descuento Anticipos y Adelantos del Período', amount: advanceDeductions, type: 'descuento' as const });
      }
    }

    const gross = isAdvanceMode ? baseAmount : (baseAmount + overtimeAmount + presenteeismBonus);
    const deductions = isAdvanceMode ? 0 : advanceDeductions;
    const net = Math.max(0, gross - deductions);

    const targetBox = cashboxes.find(c => c.id === selectedCashboxId);

    const payment: SalaryPayment = {
      id: `sal-${Date.now()}`,
      paymentNumber: paymentReceiptNumber || `REC-SUEL-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeCuil: emp.cuil,
      employeePosition: emp.position,
      paymentType,
      period: paymentPeriod,
      date: paymentDate,
      grossAmount: gross,
      deductionsAmount: deductions,
      netAmount: net,
      paymentMethod,
      cashboxId: targetBox?.id,
      cashboxName: targetBox?.name,
      items,
      notes: paymentNotes,
      createdAt: new Date().toISOString()
    };

    await onRecordSalaryPayment(payment);
    setShowPaymentModal(false);
    setRecentGeneratedPayment({ payment, employee: emp });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Módulo de Personal, Sueldos & Adelantos
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                  RRHH & Recibos Duplicados
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Legajos de empleados, asignación de importes de sueldo, pagos de anticipos y emisión automática de recibos en duplicado (Empleado / Empresa).
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEmployeeForm({
                cuil: '',
                firstName: '',
                lastName: '',
                sector: 'dispersion_fabricacion',
                position: 'Operario de Planta',
                hireDate: new Date().toISOString().split('T')[0],
                phone: '',
                email: '',
                address: '',
                city: 'Pilar',
                contractType: 'mensualizado',
                baseSalary: 850000,
                bankName: 'Banco Provincia',
                cbuOrAlias: '',
                active: true,
                notes: ''
              });
              setShowEmployeeModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Alta de Empleado
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Dotación Activa en Planta
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {employees.filter(e => e.active).length} <span className="text-sm font-sans text-slate-500">colaboradores</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Personal fabril y administrativo
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-rose-50/50 to-white">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Masa Salarial Básica Mensual
            </span>
            <div className="text-2xl font-black text-rose-950 font-mono mt-1">
              $ {totalMonthlyPayroll.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">
              Compromiso mensual bruto
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Adelantos Otorgados este Mes
            </span>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">
              $ {totalAdvancesPaidThisMonth.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-amber-800 font-semibold mt-0.5 block">
              Anticipos a deducir en la liquidación
            </span>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === 'employees' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              Legajos del Personal ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('payments_history')}
              className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === 'payments_history' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              Historial de Recibos & Adelantos ({salaryPayments.length})
            </button>
          </div>

          {activeTab === 'employees' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, CUIL o puesto..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 w-48 sm:w-64 bg-white"
                />
              </div>

              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 font-semibold bg-white text-slate-700"
              >
                <option value="all">Todos los sectores</option>
                {Object.entries(SECTOR_LABELS).map(([secKey, label]) => (
                  <option key={secKey} value={secKey}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: EMPLOYEES DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                No hay empleados registrados en el sistema.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Colaborador / Legajo</th>
                    <th className="p-3.5">CUIL / DNI</th>
                    <th className="p-3.5">Sector & Puesto</th>
                    <th className="p-3.5 text-right">Sueldo Básico Acordado</th>
                    <th className="p-3.5">Cobro / CBU</th>
                    <th className="p-3.5 text-center">Acciones de Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 text-sm">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Tel: {emp.phone || 'S/D'}</span>
                          <span>• Ingreso: {new Date(emp.hireDate).toLocaleDateString('es-AR')}</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-700">
                        {emp.cuil}
                      </td>

                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-800 block">{emp.position}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mt-0.5">
                          {SECTOR_LABELS[emp.sector] || emp.sector}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                        $ {emp.baseSalary.toLocaleString('es-AR')}
                      </td>

                      <td className="p-3.5 text-slate-600">
                        <div className="font-semibold text-slate-800">{emp.bankName || 'Pago Efectivo'}</div>
                        {emp.cbuOrAlias && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{emp.cbuOrAlias}</div>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón Adelanto */}
                          <button
                            onClick={() => handleSelectEmployeeForPayment(emp.id, true)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                            title="Registrar adelanto de sueldo con recibo duplicado"
                          >
                            <Banknote className="w-3.5 h-3.5" /> Pagar Adelanto
                          </button>

                          {/* Botón Liquidar Sueldo */}
                          <button
                            onClick={() => handleSelectEmployeeForPayment(emp.id, false)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 shadow-xs"
                            title="Liquidar sueldo con deducción de adelantos y recibo duplicado"
                          >
                            <Receipt className="w-3.5 h-3.5" /> Liquidar Sueldo
                          </button>

                          <button
                            onClick={() => {
                              setEmployeeForm(emp);
                              setShowEmployeeModal(true);
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
                            title="Editar legajo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SALARY PAYMENTS & ADVANCES HISTORY */}
      {activeTab === 'payments_history' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            {salaryPayments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No hay recibos de sueldo ni adelantos emitidos aún.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nº Recibo & Fecha</th>
                    <th className="p-3.5">Empleado</th>
                    <th className="p-3.5">Tipo & Período</th>
                    <th className="p-3.5 text-right">Bruto ($)</th>
                    <th className="p-3.5 text-right">Descuentos ($)</th>
                    <th className="p-3.5 text-right">Neto Abonado ($)</th>
                    <th className="p-3.5 text-center">Acciones Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {salaryPayments.map(pay => {
                    const emp = employees.find(e => e.id === pay.employeeId);
                    const isAdvance = pay.paymentType === 'adelanto';

                    return (
                      <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{pay.paymentNumber}</strong>
                          <span className="text-[11px] text-slate-500 font-sans">
                            {new Date(pay.date).toLocaleDateString('es-AR')}
                          </span>
                        </td>

                        <td className="p-3.5 font-sans">
                          <div className="font-extrabold text-slate-900">{pay.employeeName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{pay.employeeCuil}</div>
                        </td>

                        <td className="p-3.5 font-sans">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isAdvance ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isAdvance ? 'Adelanto / Vale' : 'Sueldo Oficial'}
                          </span>
                          <span className="text-[11px] text-slate-600 block mt-0.5 font-semibold">
                            {pay.period}
                          </span>
                        </td>

                        <td className="p-3.5 text-right text-slate-700">
                          $ {pay.grossAmount.toLocaleString('es-AR')}
                        </td>

                        <td className="p-3.5 text-right text-red-600 font-bold">
                          {pay.deductionsAmount > 0 ? `-$ ${pay.deductionsAmount.toLocaleString('es-AR')}` : '-'}
                        </td>

                        <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                          $ {pay.netAmount.toLocaleString('es-AR')}
                        </td>

                        <td className="p-3.5 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                if (emp) {
                                  generateSalaryDuplicateReceiptPDF(pay, emp, config);
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-xs"
                              title="Descargar Recibo Duplicado Oficial en PDF"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF Duplicado
                            </button>

                            {emp && emp.phone && (
                              <a
                                href={`https://wa.me/${emp.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buildWhatsAppSalaryMessage(pay, emp))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg"
                                title="Enviar confirmación de recibo por WhatsApp al empleado"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* POPUP: RECIÉN EMITIDO RECIBO DUPLICADO */}
      {recentGeneratedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in zoom-in-95">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              ¡Recibo Duplicado Generado con Éxito!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprobante <strong>{recentGeneratedPayment.payment.paymentNumber}</strong> emitido para{' '}
              <strong>{recentGeneratedPayment.employee.fullName}</strong>.
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Tipo de Pago:</span>
                <strong className="capitalize">{recentGeneratedPayment.payment.paymentType.replace('_', ' ')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Importe Neto:</span>
                <strong className="text-emerald-700 font-mono text-sm">
                  $ {recentGeneratedPayment.payment.netAmount.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Caja Imputada:</span>
                <span>{recentGeneratedPayment.payment.cashboxName || 'Efectivo'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => generateSalaryDuplicateReceiptPDF(recentGeneratedPayment.payment, recentGeneratedPayment.employee, config)}
                className="w-full bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Descargar Recibo Duplicado (Original / Duplicado)
              </button>

              {recentGeneratedPayment.employee.phone && (
                <a
                  href={`https://wa.me/${recentGeneratedPayment.employee.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(buildWhatsAppSalaryMessage(recentGeneratedPayment.payment, recentGeneratedPayment.employee))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" /> Enviar Aviso al Empleado por WhatsApp
                </a>
              )}

              <button
                onClick={() => setRecentGeneratedPayment(null)}
                className="w-full text-xs font-semibold py-2 text-slate-500 hover:text-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIQUIDAR SUELDO / ADELANTO */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2.5 rounded-xl ${isAdvanceMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {isAdvanceMode ? <Banknote className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isAdvanceMode ? 'Registrar y Pagar Adelanto de Sueldo' : 'Liquidar Sueldo con Recibo Duplicado'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Empleado: <strong>{employees.find(e => e.id === selectedEmployeeId)?.fullName}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nº Recibo Duplicado
                  </label>
                  <input
                    type="text"
                    value={paymentReceiptNumber}
                    onChange={e => setPaymentReceiptNumber(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Período Liquidado
                  </label>
                  <input
                    type="text"
                    value={paymentPeriod}
                    onChange={e => setPaymentPeriod(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                    placeholder="Agosto 2026"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Caja de Salida de Fondos
                  </label>
                  <select
                    value={selectedCashboxId}
                    onChange={e => setSelectedCashboxId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800"
                  >
                    {cashboxes.map(cb => (
                      <option key={cb.id} value={cb.id}>{cb.name} (Saldo: ${cb.currentBalance.toLocaleString('es-AR')})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amounts calculation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black text-slate-700 uppercase block tracking-wider">
                  Cálculo de Haberes & Descuentos ($)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      {isAdvanceMode ? 'Importe Adelanto ($)' : 'Sueldo Básico ($)'}
                    </label>
                    <input
                      type="number"
                      value={baseAmount}
                      onChange={e => setBaseAmount(Number(e.target.value))}
                      className="w-full text-sm p-2 rounded-lg border border-slate-300 font-mono font-bold"
                      required
                    />
                  </div>

                  {!isAdvanceMode && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Presentismo / Bono ($)
                      </label>
                      <input
                        type="number"
                        value={presenteeismBonus}
                        onChange={e => setPresenteeismBonus(Number(e.target.value))}
                        className="w-full text-sm p-2 rounded-lg border border-slate-300 font-mono font-bold text-emerald-700"
                      />
                    </div>
                  )}
                </div>

                {!isAdvanceMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Horas Extras / Adicionales ($)
                      </label>
                      <input
                        type="number"
                        value={overtimeAmount}
                        onChange={e => setOvertimeAmount(Number(e.target.value))}
                        className="w-full text-sm p-2 rounded-lg border border-slate-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-red-600 uppercase mb-1">
                        Descuento Adelantos Previos ($)
                      </label>
                      <input
                        type="number"
                        value={advanceDeductions}
                        onChange={e => setAdvanceDeductions(Number(e.target.value))}
                        className="w-full text-sm p-2 rounded-lg border border-red-300 font-mono font-bold text-red-600"
                      />
                    </div>
                  </div>
                )}

                {/* Net Total Display */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">NETO A ABONAR AL EMPLEADO:</span>
                  <span className="text-lg font-black font-mono text-emerald-700">
                    $ {Math.max(0, (isAdvanceMode ? baseAmount : (baseAmount + overtimeAmount + presenteeismBonus - advanceDeductions))).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" /> Emitir Recibo Duplicado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALTA / EDICIÓN EMPLEADO */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 mb-4">
              {employeeForm.id ? 'Editar Legajo de Empleado' : 'Alta de Nuevo Empleado / Colaborador'}
            </h3>

            <form onSubmit={handleSubmitEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Apellido(s)
                  </label>
                  <input
                    type="text"
                    value={employeeForm.lastName}
                    onChange={e => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    placeholder="González"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nombre(s)
                  </label>
                  <input
                    type="text"
                    value={employeeForm.firstName}
                    onChange={e => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    placeholder="Juan Carlos"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    CUIL / DNI
                  </label>
                  <input
                    type="text"
                    value={employeeForm.cuil}
                    onChange={e => setEmployeeForm({ ...employeeForm, cuil: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    placeholder="20-38491284-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Fecha de Ingreso a Planta
                  </label>
                  <input
                    type="date"
                    value={employeeForm.hireDate}
                    onChange={e => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Sector de Fábrica
                  </label>
                  <select
                    value={employeeForm.sector}
                    onChange={e => setEmployeeForm({ ...employeeForm, sector: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    {Object.entries(SECTOR_LABELS).map(([secKey, label]) => (
                      <option key={secKey} value={secKey}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Puesto / Tarea Específica
                  </label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    placeholder="Operario de Molienda y Dispersión"
                    required
                  />
                </div>
              </div>

              {/* SALARIO BÁSICO ACORDADO */}
              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
                <label className="block text-xs font-black text-rose-950 uppercase mb-1">
                  Importe de Sueldo Básico Acordado ($)
                </label>
                <p className="text-[11px] text-rose-800 mb-2">
                  Monto base pactado que se utilizará como referencia automática para el pago de haberes y cálculo de adelantos.
                </p>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={employeeForm.baseSalary}
                  onChange={e => setEmployeeForm({ ...employeeForm, baseSalary: Number(e.target.value) })}
                  className="w-full text-base p-2.5 rounded-xl border border-rose-300 font-mono font-black text-rose-950 bg-white"
                  placeholder="850000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={employeeForm.phone}
                    onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    placeholder="+54 9 11 5829-1234"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    placeholder="empleado@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Banco de Cobro
                  </label>
                  <input
                    type="text"
                    value={employeeForm.bankName}
                    onChange={e => setEmployeeForm({ ...employeeForm, bankName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    placeholder="Banco Provincia / Galicia"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    CBU / Alias Bancario
                  </label>
                  <input
                    type="text"
                    value={employeeForm.cbuOrAlias}
                    onChange={e => setEmployeeForm({ ...employeeForm, cbuOrAlias: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    placeholder="0140028103502918294812"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Guardar Ficha de Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
