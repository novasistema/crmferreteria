import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Scale,
  DollarSign,
  TrendingUp,
  Target,
  ArrowUpDown,
  ShieldCheck,
  PiggyBank,
  Bell,
  PieChart as PieChartIcon,
  Users,
  Building,
  FileSpreadsheet,
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

type FinanceTab =
  | 'equilibrio'
  | 'flujos'
  | 'rentabilidad'
  | 'proyecciones'
  | 'comparativo'
  | 'colchon'
  | 'ahorros'
  | 'recordatorios'
  | 'analitica'
  | 'empleado'
  | 'sucursales'
  | 'estado_resultados'
  | 'asistente_ia';

interface SavingPlan {
  id: string;
  name: string;
  currency: 'ARS' | 'USD';
  type: 'General' | 'Inversión' | 'Cripto';
  goal: number;
  current: number;
}

interface FinancialReminder {
  id: string;
  title: string;
  category: 'Impuestos' | 'Servicios' | 'Proveedores' | 'Cheques' | 'Sueldos' | 'Otro';
  dueDate: string;
  amount: number;
  completed: boolean;
}

export const FinancialIntelligenceView: React.FC = () => {
  const { store, activeModule } = useApp();
  const [activeTab, setActiveTab] = useState<FinanceTab>('equilibrio');

  React.useEffect(() => {
    if (activeModule === 'internal_accountant') {
      setActiveTab('estado_resultados');
    } else if (activeModule === 'finance_banks') {
      setActiveTab('flujos');
    } else if (activeModule === 'financial_intelligence') {
      setActiveTab('equilibrio');
    }
  }, [activeModule]);
  const [selectedMonth, setSelectedMonth] = useState<string>('Agosto 2026');
  const [alertThreshold, setAlertThreshold] = useState<number>(15);
  const [showAlertConfig, setShowAlertConfig] = useState<boolean>(false);

  // Proyecciones State
  const [projectionBaseYear, setProjectionBaseYear] = useState<string>('2026');
  const [expectedGrowthPercent, setExpectedGrowthPercent] = useState<number>(10);

  // Comparativo State
  const [comparePeriod1, setComparePeriod1] = useState<string>('2026');
  const [comparePeriod2, setComparePeriod2] = useState<string>('2025');

  // Colchon State
  const [colchonGoalMonths, setColchonGoalMonths] = useState<number>(2);
  const [colchonFixedExpensesInput, setColchonFixedExpensesInput] = useState<number>(461000);
  const [colchonSavedAmountInput, setColchonSavedAmountInput] = useState<number>(922000);

  // Ahorros State
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([
    { id: '1', name: 'USD', currency: 'USD', type: 'General', goal: 10000, current: 4120 },
    { id: '2', name: 'NARANJA X', currency: 'ARS', type: 'General', goal: 59725, current: 59725 },
    { id: '3', name: 'BRUBANK', currency: 'ARS', type: 'Inversión', goal: 1796893, current: 850000 },
    { id: '4', name: 'BALANZ', currency: 'ARS', type: 'Inversión', goal: 320279, current: 150000 },
    { id: '5', name: 'BINANCE', currency: 'USD', type: 'Cripto', goal: 3734.49, current: 3900.07 },
    { id: '6', name: 'LEMON', currency: 'ARS', type: 'Cripto', goal: 598, current: 598 },
    { id: '7', name: 'IOL (InvertirOnline)', currency: 'ARS', type: 'Inversión', goal: 936557, current: 1923709 },
  ]);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCurrency, setNewPlanCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [newPlanGoal, setNewPlanGoal] = useState<number>(100000);
  const [depositModalPlan, setDepositModalPlan] = useState<SavingPlan | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);

  // Recordatorios State
  const [reminders, setReminders] = useState<FinancialReminder[]>([
    { id: '1', title: 'Vencimiento IVA AFIP / ARCA', category: 'Impuestos', dueDate: '2026-08-22', amount: 185000, completed: false },
    { id: '2', title: 'Factura Edenor / Luz Salón', category: 'Servicios', dueDate: '2026-08-25', amount: 45200, completed: false },
    { id: '3', title: 'Pago Proveedor Aceros Quilmes', category: 'Proveedores', dueDate: '2026-08-28', amount: 1250000, completed: false },
    { id: '4', title: 'Cargas Sociales 931', category: 'Sueldos', dueDate: '2026-09-09', amount: 207450, completed: false },
  ]);
  const [showNewReminderModal, setShowNewReminderModal] = useState(false);
  const [newRemTitle, setNewRemTitle] = useState('');
  const [newRemCat, setNewRemCat] = useState<'Impuestos' | 'Servicios' | 'Proveedores' | 'Cheques' | 'Sueldos' | 'Otro'>('Impuestos');
  const [newRemDate, setNewRemDate] = useState('');
  const [newRemAmount, setNewRemAmount] = useState<number>(0);

  // Simulador Empleado State
  const [simEmployeeNetSalary, setSimEmployeeNetSalary] = useState<number>(500000);
  const [simSocialChargesPercent, setSimSocialChargesPercent] = useState<number>(45);

  // Dynamic Metrics from Store
  const salesCompleted = useMemo(() => store.sales.filter((s) => s.status === 'completed'), [store.sales]);
  const totalRevenue = useMemo(() => salesCompleted.reduce((a, s) => a + s.total, 0) || 16951889, [salesCompleted]);
  const totalCostOfGoods = useMemo(() => salesCompleted.reduce((a, s) => a + s.totalCost, 0) || 12420649, [salesCompleted]);
  const grossProfit = totalRevenue - totalCostOfGoods;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 26.7;

  const totalFixedCosts = 461000; // Salaries + operational rent
  const totalOperExpenses = 18000;
  const supplierPayments = 2360919;
  const netIncome = grossProfit - totalFixedCosts - totalOperExpenses;
  const netMarginPercent = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 5.7;

  // Break-even calculations (Punto de Equilibrio)
  const marginRatio = grossMarginPercent / 100 || 0.27;
  const monthlyBreakEven = marginRatio > 0 ? Math.round(totalFixedCosts / marginRatio) : 1724654;
  const dailyBreakEven = Math.round(monthlyBreakEven / 30);
  const weeklyBreakEven = Math.round(monthlyBreakEven / 4);
  const annualBreakEven = monthlyBreakEven * 12;

  // Monthly breakdown mock/consolidated data for 12 months charts
  const monthlyData = [
    { mes: 'Sep 25', ingresos: 0, gastos: 0, utilidad: 0, cmv: 0, compras: 0, sueldos: 0, pe: 1724654 },
    { mes: 'Oct 25', ingresos: 0, gastos: 0, utilidad: 0, cmv: 0, compras: 0, sueldos: 0, pe: 1724654 },
    { mes: 'Nov 25', ingresos: 0, gastos: 0, utilidad: 0, cmv: 0, compras: 0, sueldos: 0, pe: 1724654 },
    { mes: 'Dic 25', ingresos: 0, gastos: 0, utilidad: 0, cmv: 0, compras: 0, sueldos: 0, pe: 1724654 },
    { mes: 'Ene 26', ingresos: 21076238, gastos: 0, utilidad: 21076238, cmv: 0, compras: 0, sueldos: 0, pe: 1724654, proyectado: 23183861 },
    { mes: 'Feb 26', ingresos: 47699596, gastos: 19479288, utilidad: 28220308, cmv: 15815362, compras: 2041721, sueldos: 1098000, pe: 1724654, proyectado: 52469555 },
    { mes: 'Mar 26', ingresos: 100549762, gastos: 68751424, utilidad: 31798338, cmv: 9283731, compras: 11799843, sueldos: 237500, pe: 1724654, proyectado: 110604738 },
    { mes: 'Abr 26', ingresos: 43498182, gastos: 44669213, utilidad: -1171031, cmv: 28013355, compras: 6068028, sueldos: 980000, pe: 1724654, proyectado: 47847999 },
    { mes: 'May 26', ingresos: 66255876, gastos: 66568648, utilidad: -312772, cmv: 53897701, compras: 12320087, sueldos: 235000, pe: 1724654, proyectado: 72881463 },
    { mes: 'Jun 26', ingresos: 28363699, gastos: 36835004, utilidad: -8471305, cmv: 20245868, compras: 10649772, sueldos: 830000, pe: 1724654, proyectado: 31200068 },
    { mes: 'Jul 26', ingresos: 27716802, gastos: 34027160, utilidad: -6310358, cmv: 11068978, compras: 12562388, sueldos: 180000, pe: 1724654, proyectado: 30488482 },
    { mes: 'Ago 26', ingresos: 20488891, gastos: 19455892, utilidad: 1032999, cmv: 7922939, compras: 8844025, sueldos: 461000, pe: 1724654, proyectado: 22537780 },
  ];

  // Category Profitability Data
  const categoryProfitData = [
    { name: 'Bulonería & Fijaciones', margen: 51, ventas: 3400000 },
    { name: 'Herramientas Eléctricas', margen: 37, ventas: 4800000 },
    { name: 'Herramientas Manuales', margen: 35, ventas: 2100000 },
    { name: 'Pinturería & Accesorios', margen: 31, ventas: 1950000 },
    { name: 'Plomería & Sanitarios', margen: 30, ventas: 1400000 },
    { name: 'Electricidad & Cables', margen: 28, ventas: 2600000 },
    { name: 'Construcción & Corralón', margen: 26, ventas: 4200000 },
  ];

  // Format currency
  const fmt = (num: number) => `$${Math.round(num).toLocaleString('es-AR')}`;
  const fmtUSD = (num: number) => `US$ ${num.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const tabs: { id: FinanceTab; label: string; icon: React.ElementType }[] = [
    { id: 'equilibrio', label: 'Equilibrio', icon: Scale },
    { id: 'flujos', label: 'Flujos', icon: DollarSign },
    { id: 'rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
    { id: 'proyecciones', label: 'Proyecciones', icon: Target },
    { id: 'comparativo', label: 'Comparativo', icon: ArrowUpDown },
    { id: 'colchon', label: 'Colchón', icon: ShieldCheck },
    { id: 'ahorros', label: 'Ahorros', icon: PiggyBank },
    { id: 'recordatorios', label: 'Recordatorios', icon: Bell },
    { id: 'analitica', label: 'Analítica', icon: PieChartIcon },
    { id: 'empleado', label: 'Simulador Empleado', icon: Users },
    { id: 'sucursales', label: 'Sucursales', icon: Building },
    { id: 'estado_resultados', label: 'Estado de Resultados', icon: FileSpreadsheet },
    { id: 'asistente_ia', label: 'Asistente IA', icon: Brain },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center space-x-2">
              <span>Centro de Inteligencia Financiera</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Contabilidad analítica, flujos de fondo, simulador y análisis de rentabilidad
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 flex items-center space-x-1 overflow-x-auto custom-scrollbar shrink-0 select-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                isActive
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar">
        {/* ========================================================= */}
        {/* TAB 1: EQUILIBRIO */}
        {/* ========================================================= */}
        {activeTab === 'equilibrio' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Margen Alert Banner */}
            <div className="border border-rose-500/40 bg-rose-950/20 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-rose-300">
                    Margen neto bajo este mes: {netMarginPercent.toFixed(1)}%
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Tu umbral de alerta es {alertThreshold}%. Revisá los costos y gastos del mes actual.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertConfig(!showAlertConfig)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors"
              >
                Configurar
              </button>
            </div>

            {showAlertConfig && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
                <span className="text-xs font-medium text-slate-300">Umbral de Alerta de Margen Neto (%):</span>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-20 bg-slate-950 text-white font-mono p-1.5 rounded border border-slate-700 text-xs font-bold"
                />
              </div>
            )}

            {/* Resumen por Mes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Resumen por Mes
                  </span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-950 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1 font-bold focus:outline-none"
                >
                  <option value="Agosto 2026">Agosto de 2026</option>
                  <option value="Julio 2026">Julio de 2026</option>
                  <option value="Junio 2026">Junio de 2026</option>
                </select>
              </div>

              {/* 3 Large KPI blocks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">INGRESOS</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">$15.021.433</div>
                  <span className="text-[10px] text-slate-500 font-semibold">+26% mmv</span>
                </div>
                <div className="bg-slate-950 border border-rose-500/30 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EGRESOS</span>
                  <div className="text-2xl font-black text-rose-400 font-mono mt-1">$2.883.077</div>
                  <span className="text-[10px] text-slate-500 font-semibold">18 mov</span>
                </div>
                <div className="bg-slate-950 border border-blue-500/30 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RESULTADO</span>
                  <div className="text-2xl font-black text-blue-400 font-mono mt-1">+$12.138.356</div>
                  <span className="text-[10px] text-blue-300 font-bold">Superávit</span>
                </div>
              </div>

              {/* Principales Egresos Progress Bars */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  PRINCIPALES EGRESOS
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Pago a Proveedor</span>
                    <span className="font-mono font-bold">$2.360.919</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '81%' }}></div>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 pt-1">
                    <span>Sueldos</span>
                    <span className="font-mono font-bold">$461.000</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '16%' }}></div>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 pt-1">
                    <span>Pago Compra Insumos</span>
                    <span className="font-mono font-bold">$61.158</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-500 h-full rounded-full" style={{ width: '3%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Break-even period cards: Diario, Semanal, Mensual, Anual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Diario', pe: dailyBreakEven, ventas: 125000, status: 'En curso' },
                { label: 'Semanal', pe: weeklyBreakEven, ventas: 890000, status: 'En curso' },
                { label: 'Mensual', pe: monthlyBreakEven, ventas: 3450000, status: 'Superado' },
                { label: 'Anual', pe: annualBreakEven, ventas: 355649045, status: 'Superado' },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{item.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Superado'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Ventas: <strong className="text-white font-mono">{fmt(item.ventas)}</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Punto Equilibrio</span>
                      <strong className="text-amber-400 font-mono">{fmt(item.pe)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Falta para PE</span>
                      <strong
                        className={`font-mono ${
                          item.ventas >= item.pe ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.ventas >= item.pe ? '$0 (Cumplido)' : fmt(item.pe - item.ventas)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rentabilidad Neta Real Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Rentabilidad Neta Real — {selectedMonth}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ingresos reales menos todos los costos: mercadería, sueldos y gastos operativos
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold font-mono">
                  {netMarginPercent.toFixed(1)}% neto
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-emerald-400">
                  <span>Ventas (Ingresos)</span>
                  <span>+$11.409.194</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Costo de mercadería (CMV)</span>
                  <span>-$7.922.939</span>
                </div>
                <div className="flex justify-between text-blue-400 font-bold border-t border-slate-800 pt-1.5">
                  <span>= Margen Bruto</span>
                  <span>+$3.486.256</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Sueldos y salarios</span>
                  <span>-$461.000</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Gastos operativos</span>
                  <span>-$18.000</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Pagos a proveedores</span>
                  <span>-$2.360.919</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-black text-sm border-t-2 border-emerald-500/40 pt-2">
                  <span>= Resultado Neto</span>
                  <span>+$646.336</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">VENTAS DEL MES</span>
                  <strong className="text-white font-mono text-sm">449</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">TICKET PROMEDIO</span>
                  <strong className="text-amber-400 font-mono text-sm">$25.591</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">GANANCIA X VENTA</span>
                  <strong className="text-emerald-400 font-mono text-sm">$1.449</strong>
                </div>
              </div>
            </div>

            {/* Evolución vs Punto de Equilibrio (12 meses) Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Evolución vs Punto de Equilibrio (12 meses)</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCostos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIngresos)" strokeWidth={2} />
                    <Area type="monotone" dataKey="gastos" name="Costos / Egresos" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCostos)" strokeWidth={2} />
                    <Line type="monotone" dataKey="pe" name="Punto de Equilibrio" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Margen Bruto Promedio</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">27%</div>
                  <span className="text-[10px] text-slate-500">Contribución marginal sobre ventas</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Costos Fijos Mensuales</span>
                  <div className="text-xl font-bold text-white font-mono mt-1">$461.000</div>
                  <span className="text-[10px] text-slate-500">Personal, alquiler, servicios</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Días para PE Mensual</span>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-1">11 días</div>
                  <span className="text-[10px] text-slate-500">Alcanzado a mediados de mes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: FLUJOS */}
        {/* ========================================================= */}
        {activeTab === 'flujos' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-1 bg-emerald-950/10">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Ingresos del Mes
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">$16.951.889</span>
              </div>
              <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 space-y-1 bg-rose-950/10">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                  Egresos del Mes
                </span>
                <span className="text-2xl font-black text-rose-400 font-mono">$12.881.649</span>
              </div>
              <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 space-y-1 bg-blue-950/10">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                  Flujo Neto
                </span>
                <span className="text-2xl font-black text-blue-400 font-mono">$4.070.240</span>
              </div>
              <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 space-y-1 bg-purple-950/10">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                  Cobranzas Pendientes (Cta Cte)
                </span>
                <span className="text-2xl font-black text-purple-400 font-mono">$2.034.227</span>
              </div>
            </div>

            {/* 2 Charts: Composición de Ingresos + Flujo de Caja Proyectado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Doughnut Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <PieChartIcon className="w-4 h-4 text-amber-400" />
                  <span>Composición de Ingresos</span>
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Efectivo', value: 38, color: '#f59e0b' },
                          { name: 'Transferencia / QR', value: 32, color: '#3b82f6' },
                          { name: 'Tarjetas Débito/Crédito', value: 18, color: '#10b981' },
                          { name: 'Cuenta Corriente', value: 8, color: '#8b5cf6' },
                          { name: 'MercadoPago', value: 4, color: '#ec4899' },
                        ]}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {[
                          { color: '#f59e0b' },
                          { color: '#3b82f6' },
                          { color: '#10b981' },
                          { color: '#8b5cf6' },
                          { color: '#ec4899' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart Proyectado */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Flujo de Caja Proyectado</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData.slice(4)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000000}M`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" name="Egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: RENTABILIDAD */}
        {/* ========================================================= */}
        {activeTab === 'rentabilidad' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ROI Mensual</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">31.6%</span>
                <span className="text-[10px] text-slate-500 block">Retorno sobre inversión</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Margen Neto</span>
                <span className="text-2xl font-black text-blue-400 font-mono">24.0%</span>
                <span className="text-[10px] text-slate-500 block">Utilidad / Ventas</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Promedio</span>
                <span className="text-2xl font-black text-amber-400 font-mono">$37.175</span>
                <span className="text-[10px] text-slate-500 block">Venta promedio por cliente</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ventas por Día</span>
                <span className="text-2xl font-black text-purple-400 font-mono">24.0</span>
                <span className="text-[10px] text-slate-500 block">Transacciones diarias promedio</span>
              </div>
            </div>

            {/* Horizontal Bar Chart: Rentabilidad por Categoría */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Rentabilidad por Categoría (Margen %)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={categoryProfitData}
                    margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} unit="%" />
                    <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={11} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Bar dataKey="margen" name="Margen %" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2 Tables: Top Rentables vs Bajo Margen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Top Productos Más Rentables</span>
                </span>
                <div className="space-y-2 text-xs">
                  {[
                    { name: 'Tornillo Autoperforante T1 8x1/2 (Pack 100u)', margen: '51%' },
                    { name: 'Pintura Látex Interior 20L Premium', margen: '48%' },
                    { name: 'Disco de Corte Fino 115mm x 1.0mm', margen: '45%' },
                    { name: 'Amoladora Angular 850W Profesional', margen: '37%' },
                    { name: 'Taladro Percutor 710W Mandril 13mm', margen: '35%' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-300 truncate max-w-[220px]">{i + 1}. {p.name}</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{p.margen} margen</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Productos con Margen Crítico (Bajo Margen)</span>
                </span>
                <div className="space-y-2 text-xs">
                  {[
                    { name: 'Bolsa de Cemento Portland 50kg', margen: '14%' },
                    { name: 'Hierro del 8 Aletado Conformado x 12m', margen: '16%' },
                    { name: 'Placa de Yeso Durlock 12.5mm', margen: '18%' },
                    { name: 'Cal Hidráulica Hidratada 25kg', margen: '19%' },
                    { name: 'Membrana Asfáltica con Aluminio 40kg', margen: '22%' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-300 truncate max-w-[220px]">{i + 1}. {p.name}</span>
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{p.margen} margen</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PROYECCIONES */}
        {/* ========================================================= */}
        {activeTab === 'proyecciones' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Config Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <label className="text-xs font-bold text-slate-400 block mb-1">Año Base</label>
                <select
                  value={projectionBaseYear}
                  onChange={(e) => setProjectionBaseYear(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono p-2 rounded-xl border border-slate-700 text-xs font-bold focus:outline-none"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <label className="text-xs font-bold text-slate-400 block mb-1">Crecimiento Esperado (%)</label>
                <input
                  type="number"
                  value={expectedGrowthPercent}
                  onChange={(e) => setExpectedGrowthPercent(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white font-mono p-2 rounded-xl border border-slate-700 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-1 bg-emerald-950/10">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Proyección 2027
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">$391.213.950</span>
                <span className="text-[10px] text-slate-400 block">Ingresos proyectados calculados</span>
              </div>
            </div>

            {/* Proyección Mensual de Ingresos Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Proyección Mensual de Ingresos (Basado en datos de 2026 con {expectedGrowthPercent}% de crecimiento)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.slice(4)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="ingresos" name="Real 2026" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="proyectado" name="Proyectado 2027" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom 2 blocks: Resumen + Tendencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Resumen de Proyección</h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Ingresos 2026:</span>
                    <span className="font-bold">$355.649.045</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Ingresos proyectados 2027:</span>
                    <span className="font-bold">$391.213.950</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>Gastos proyectados:</span>
                    <span className="font-bold">$40.124.160</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Compras proyectadas:</span>
                    <span className="font-bold">$196.768.233</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-2 text-sm">
                    <span>Balance Proyectado:</span>
                    <span>$154.321.556</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Tendencia de Crecimiento</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData.slice(4)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `$${val / 1000000}M`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="ingresos" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: COMPARATIVO */}
        {/* ========================================================= */}
        {activeTab === 'comparativo' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <label className="text-xs font-bold text-slate-400 block mb-1">Período 1</label>
                <select
                  value={comparePeriod1}
                  onChange={(e) => setComparePeriod1(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono p-2 rounded-xl border border-slate-700 text-xs font-bold focus:outline-none"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <label className="text-xs font-bold text-slate-400 block mb-1">Período 2</label>
                <select
                  value={comparePeriod2}
                  onChange={(e) => setComparePeriod2(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono p-2 rounded-xl border border-slate-700 text-xs font-bold focus:outline-none"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            {/* 3 Metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Ingresos</span>
                <div className="text-2xl font-black text-white font-mono">$355.649.045</div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">+100% vs 2025</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Gastos</span>
                <div className="text-2xl font-black text-white font-mono">$38.213.486</div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">+100% vs 2025</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Compras</span>
                <div className="text-2xl font-black text-white font-mono">$183.895.545</div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">+100% vs 2025</span>
              </div>
            </div>

            {/* Comparación de Ingresos Mensual Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Comparación de Ingresos Mensual</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="ingresos" name="2026" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detalle Mensual Comparativo Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Detalle Mensual Comparativo</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Mes</th>
                      <th className="p-3 text-right">Ingresos 2026</th>
                      <th className="p-3 text-right">Ingresos 2025</th>
                      <th className="p-3 text-right">Variación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {monthlyData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-sans font-medium text-slate-300">{row.mes}</td>
                        <td className="p-3 text-right text-emerald-400">{fmt(row.ingresos)}</td>
                        <td className="p-3 text-right text-slate-500">$0</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">{row.ingresos > 0 ? '+100.0%' : '+0.0%'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: COLCHÓN (FONDO DE RESERVA) */}
        {/* ========================================================= */}
        {activeTab === 'colchon' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
                <ShieldCheck className="w-7 h-7 text-amber-400 mx-auto" />
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Objetivo</span>
                <div className="text-2xl font-black text-white font-mono">
                  {fmt(colchonFixedExpensesInput * colchonGoalMonths)}
                </div>
                <span className="text-[10px] text-slate-500">{colchonGoalMonths} meses de gastos fijos</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
                <DollarSign className="w-7 h-7 text-emerald-400 mx-auto" />
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Colchón Actual</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {fmt(colchonSavedAmountInput)}
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (colchonSavedAmountInput / ((colchonFixedExpensesInput * colchonGoalMonths) || 1)) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">
                  {Math.round(
                    (colchonSavedAmountInput / ((colchonFixedExpensesInput * colchonGoalMonths) || 1)) * 100
                  )}
                  % del objetivo
                </span>
              </div>

              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-1 bg-emerald-950/10">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">Estado de Cobertura</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">Colchón Completo</div>
                <span className="text-[10px] text-slate-400">Negocio protegido ante eventualidades</span>
              </div>
            </div>

            {/* Configuración del Colchón */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Configuración del Colchón</h3>
              <p className="text-xs text-slate-400">Configura tus gastos fijos mensuales y el monto reservado actual</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Meses Objetivo</label>
                  <select
                    value={colchonGoalMonths}
                    onChange={(e) => setColchonGoalMonths(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white font-mono p-2.5 rounded-xl border border-slate-700 text-xs font-bold"
                  >
                    <option value={1}>1 mes</option>
                    <option value={2}>2 meses</option>
                    <option value={3}>3 meses</option>
                    <option value={6}>6 meses</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Gastos fijos mensuales ($)</label>
                  <input
                    type="number"
                    value={colchonFixedExpensesInput}
                    onChange={(e) => setColchonFixedExpensesInput(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white font-mono p-2.5 rounded-xl border border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Monto ahorrado actual ($)</label>
                  <input
                    type="number"
                    value={colchonSavedAmountInput}
                    onChange={(e) => setColchonSavedAmountInput(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white font-mono p-2.5 rounded-xl border border-slate-700 text-xs font-bold"
                  />
                </div>
              </div>

              <button
                onClick={() => alert('¡Configuración del colchón de reserva guardada con éxito!')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: AHORROS & BILLETERAS */}
        {/* ========================================================= */}
        {activeTab === 'ahorros' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Planes de Ahorro e Inversiones</h3>
                <p className="text-xs text-slate-400">Registra tus billeteras digitales, cuentas en dólares e instrumentos financieros</p>
              </div>
              <button
                onClick={() => setShowNewPlanModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Plan</span>
              </button>
            </div>

            {/* Grid of saving cards matching screenshot 7 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savingPlans.map((plan) => {
                const percent = Math.min(100, Math.round((plan.current / (plan.goal || 1)) * 100));
                const isCompleted = plan.current >= plan.goal;
                return (
                  <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-white">{plan.name}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                          {plan.currency}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium border border-slate-700">
                          {plan.type}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Meta:</span>
                        <span className="font-mono font-bold text-white">
                          {plan.currency === 'USD' ? fmtUSD(plan.goal) : fmt(plan.goal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Actual:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {plan.currency === 'USD' ? fmtUSD(plan.current) : fmt(plan.current)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-blue-600'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{percent}% completado</span>
                      <span>
                        {isCompleted
                          ? 'Completado'
                          : `Faltan ${plan.currency === 'USD' ? fmtUSD(plan.goal - plan.current) : fmt(plan.goal - plan.current)}`}
                      </span>
                    </div>

                    {/* Buttons */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setDepositModalPlan(plan);
                          setDepositAmount(0);
                        }}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aportar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar plan ${plan.name}?`)) {
                            setSavingPlans(savingPlans.filter((p) => p.id !== plan.id));
                          }
                        }}
                        className="p-1.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal: Aportar monto */}
            {depositModalPlan && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
                  <h3 className="text-sm font-bold text-white">Aportar a {depositModalPlan.name}</h3>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Monto a depositar ({depositModalPlan.currency}):</label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 text-white font-mono p-2.5 rounded-xl border border-slate-700 text-sm font-bold"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setDepositModalPlan(null)}
                      className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setSavingPlans(
                          savingPlans.map((p) =>
                            p.id === depositModalPlan.id ? { ...p, current: p.current + depositAmount } : p
                          )
                        );
                        setDepositModalPlan(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                    >
                      Confirmar Aporte
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Nuevo Plan */}
            {showNewPlanModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
                  <h3 className="text-sm font-bold text-white">Crear Nuevo Plan de Ahorro</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Nombre / Entidad:</label>
                      <input
                        type="text"
                        placeholder="Ej: MercadoPago, Balanz, Santander..."
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Moneda:</label>
                      <select
                        value={newPlanCurrency}
                        onChange={(e) => setNewPlanCurrency(e.target.value as any)}
                        className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-700 font-bold"
                      >
                        <option value="ARS">ARS ($)</option>
                        <option value="USD">USD (US$)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Meta Objetivo:</label>
                      <input
                        type="number"
                        value={newPlanGoal}
                        onChange={(e) => setNewPlanGoal(Number(e.target.value))}
                        className="w-full bg-slate-950 text-white font-mono p-2 rounded-xl border border-slate-700 font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowNewPlanModal(false)}
                      className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (!newPlanName) return;
                        setSavingPlans([
                          ...savingPlans,
                          {
                            id: Date.now().toString(),
                            name: newPlanName,
                            currency: newPlanCurrency,
                            type: 'General',
                            goal: newPlanGoal,
                            current: 0,
                          },
                        ]);
                        setNewPlanName('');
                        setShowNewPlanModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                    >
                      Crear Plan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: RECORDATORIOS */}
        {/* ========================================================= */}
        {activeTab === 'recordatorios' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Cards: Vencidos, Próximos 7 días, Completados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 text-center space-y-1 bg-rose-950/10">
                <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
                <div className="text-2xl font-black text-rose-400 font-mono">
                  {reminders.filter((r) => !r.completed && new Date(r.dueDate) < new Date()).length}
                </div>
                <span className="text-xs font-bold text-slate-300">Vencidos</span>
              </div>
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 text-center space-y-1 bg-amber-950/10">
                <Bell className="w-6 h-6 text-amber-400 mx-auto" />
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {reminders.filter((r) => !r.completed && new Date(r.dueDate) >= new Date()).length}
                </div>
                <span className="text-xs font-bold text-slate-300">Próximos 7 días</span>
              </div>
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1 bg-emerald-950/10">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {reminders.filter((r) => r.completed).length}
                </div>
                <span className="text-xs font-bold text-slate-300">Completados</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Vencimientos, Pagos Pendientes y Fechas Importantes
              </h3>
              <button
                onClick={() => setShowNewReminderModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Recordatorio</span>
              </button>
            </div>

            {/* Reminders List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800 space-y-2">
              {reminders.map((rem) => (
                <div key={rem.id} className="pt-2 pb-2 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        setReminders(
                          reminders.map((r) => (r.id === rem.id ? { ...r, completed: !r.completed } : r))
                        )
                      }
                      className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                        rem.completed
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {rem.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <span
                        className={`font-semibold ${
                          rem.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {rem.title}
                      </span>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                          {rem.category}
                        </span>
                        <span>Vence: {rem.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-white text-sm">{fmt(rem.amount)}</span>
                    <button
                      onClick={() => setReminders(reminders.filter((r) => r.id !== rem.id))}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Nuevo recordatorio */}
            {showNewReminderModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
                  <h3 className="text-sm font-bold text-white">Nuevo Recordatorio Financiero</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Título:</label>
                      <input
                        type="text"
                        placeholder="Ej: Pago F931, Luz, Cheque a vencer..."
                        value={newRemTitle}
                        onChange={(e) => setNewRemTitle(e.target.value)}
                        className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Categoría:</label>
                      <select
                        value={newRemCat}
                        onChange={(e) => setNewRemCat(e.target.value as any)}
                        className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-700 font-bold"
                      >
                        <option value="Impuestos">Impuestos</option>
                        <option value="Servicios">Servicios</option>
                        <option value="Proveedores">Proveedores</option>
                        <option value="Cheques">Cheques</option>
                        <option value="Sueldos">Sueldos</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Fecha de Vencimiento:</label>
                      <input
                        type="date"
                        value={newRemDate}
                        onChange={(e) => setNewRemDate(e.target.value)}
                        className="w-full bg-slate-950 text-white p-2 rounded-xl border border-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Monto Estimado ($):</label>
                      <input
                        type="number"
                        value={newRemAmount}
                        onChange={(e) => setNewRemAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 text-white font-mono p-2 rounded-xl border border-slate-700 font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowNewReminderModal(false)}
                      className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (!newRemTitle) return;
                        setReminders([
                          ...reminders,
                          {
                            id: Date.now().toString(),
                            title: newRemTitle,
                            category: newRemCat,
                            dueDate: newRemDate || new Date().toISOString().slice(0, 10),
                            amount: newRemAmount,
                            completed: false,
                          },
                        ]);
                        setNewRemTitle('');
                        setShowNewReminderModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                    >
                      Guardar Recordatorio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: ANALÍTICA */}
        {/* ========================================================= */}
        {activeTab === 'analitica' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribución de Costos Pie Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Distribución de Costos
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Mercadería (compras)', value: 95, color: '#f97316' },
                          { name: 'Sueldos', value: 5, color: '#38bdf8' },
                          { name: 'Administrativo', value: 0.5, color: '#10b981' },
                        ]}
                        outerRadius={85}
                        dataKey="value"
                      >
                        {[
                          { color: '#f97316' },
                          { color: '#38bdf8' },
                          { color: '#10b981' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Indicadores Clave */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Indicadores Clave</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Rotación de Stock</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">4.2x</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Días de Cobro (Plazo Medio)</span>
                    <span className="font-mono font-black text-blue-400 text-sm">18 días</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Días de Pago a Proveedores</span>
                    <span className="font-mono font-black text-purple-400 text-sm">32 días</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Ciclo de Capital de Trabajo</span>
                    <span className="font-mono font-black text-amber-400 text-sm">+14 días</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Evolución de Utilidad Mensual Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Evolución de Utilidad Mensual</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData.slice(4)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="utilidad" name="Utilidad Neta" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 10: SIMULADOR DE EMPLEADO */}
        {/* ========================================================= */}
        {activeTab === 'empleado' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Banner */}
            <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-4 text-xs font-bold text-amber-300">
              Completá el sueldo neto para ver el diagnóstico y punto de equilibrio del nuevo puesto
            </div>

            {/* Radiografía de la Empresa (3 Columns) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Radiografía de la Empresa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Ingresos y Margen */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
                  <div className="text-xs font-bold text-emerald-400 uppercase font-sans mb-1">
                    1. Ingresos y Margen
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="font-sans">Venta prom. 6 meses (c/IVA):</span>
                    <span className="font-bold">$42.498.163,17</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">Venta prom. 6 meses (s/IVA):</span>
                    <span>$35.122.448,90</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span className="font-sans">CMV (costo mercadería):</span>
                    <span>$31.138.404,15</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="font-sans">Margen de marcación:</span>
                    <span>36.5%</span>
                  </div>
                  <div className="flex justify-between text-blue-400 font-bold border-t border-slate-800 pt-1">
                    <span className="font-sans">Margen bruto real:</span>
                    <span>26.7%</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span className="font-sans">Ganancia bruta mensual:</span>
                    <span>$11.359.759,02</span>
                  </div>
                </div>

                {/* 2. Gastos Fijos (Estructura) */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
                  <div className="text-xs font-bold text-amber-400 uppercase font-sans mb-1">
                    2. Gastos Fijos (Estructura)
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="font-sans">Sueldos actuales (7 emp.):</span>
                    <span className="font-bold">$461.000,00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">Alquiler / Expensas:</span>
                    <span>$0</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">Servicios (luz, gas, net):</span>
                    <span>$0</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">Impuestos fijos:</span>
                    <span>$0</span>
                  </div>
                  <div className="flex justify-between text-rose-400 font-bold border-t border-slate-800 pt-1">
                    <span className="font-sans">TOTAL FIJOS:</span>
                    <span>$461.000,00</span>
                  </div>
                </div>

                {/* 3. Gastos Variables y Capital */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
                  <div className="text-xs font-bold text-purple-400 uppercase font-sans mb-1">
                    3. Gastos Variables y Capital
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="font-sans">Variables registrados:</span>
                    <span className="font-bold">$18.000,00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">Compras del mes:</span>
                    <span>$8.844.025,32</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">% Ventas a cta. cte.:</span>
                    <span>20%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="font-sans">Plazo proveedores:</span>
                    <span>Contado</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold border-t border-slate-800 pt-1">
                    <span className="font-sans">Capital inmovilizado:</span>
                    <span>$8.499.832,83</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis del Nuevo Puesto */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Análisis del Nuevo Puesto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Sueldo neto ("en mano") $:
                    </label>
                    <input
                      type="number"
                      value={simEmployeeNetSalary}
                      onChange={(e) => setSimEmployeeNetSalary(Number(e.target.value))}
                      className="w-full bg-slate-950 text-white font-mono text-sm font-bold p-3 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Cargas sociales sobre el neto (%):
                    </label>
                    <input
                      type="number"
                      value={simSocialChargesPercent}
                      onChange={(e) => setSimSocialChargesPercent(Number(e.target.value))}
                      className="w-full bg-slate-950 text-white font-mono text-sm font-bold p-3 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      ART, obra social, aportes patronales, aguinaldo/vacaciones provisionado. Típico: 40-50%.
                    </span>
                  </div>
                </div>

                {/* Live Diagnostic calculation */}
                {(() => {
                  const totalEmployeeCost = Math.round(
                    simEmployeeNetSalary * (1 + simSocialChargesPercent / 100)
                  );
                  const requiredSalesToBreakEven = Math.round(
                    totalEmployeeCost / (marginRatio || 0.27)
                  );
                  return (
                    <div className="bg-slate-950 border border-purple-500/40 rounded-xl p-4 space-y-3">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                        Punto de Equilibrio del Puesto
                      </span>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">Costo Real Empresa (c/Cargas):</span>
                          <span className="font-bold text-rose-400">{fmt(totalEmployeeCost)} / mes</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="font-sans">Margen Bruto de tu negocio:</span>
                          <span className="font-bold text-blue-400">26.7%</span>
                        </div>
                        <div className="flex justify-between text-amber-300 font-bold border-t border-slate-800 pt-2 text-sm">
                          <span className="font-sans">Ventas Adicionales necesarias:</span>
                          <span>{fmt(requiredSalesToBreakEven)} / mes</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <span className="font-bold text-emerald-400">Diagnóstico:</span>
                        <p>
                          Para que la incorporación sea autosustentable sin reducir tus ganancias actuales, el nuevo empleado o la sucursal deben generar al menos <strong>{fmt(requiredSalesToBreakEven)}</strong> mensuales en facturación adicional.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 11: SUCURSALES */}
        {/* ========================================================= */}
        {activeTab === 'sucursales' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Ingresos Totales</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">$18.428.917,59</div>
                <span className="text-[10px] text-slate-500">En 30 días · 3 sucursales</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Utilidad Consolidada</span>
                <div className="text-2xl font-black text-blue-400 font-mono">$765.978,92</div>
                <span className="text-[10px] text-slate-500">Después de gastos y compras</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Mejor Sucursal</span>
                <div className="text-xl font-bold text-amber-400 mt-1">Casa Central</div>
                <span className="text-[10px] text-slate-500 font-mono font-bold">$18.056.650,32 de utilidad</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Ventas Totales</span>
                <div className="text-2xl font-black text-purple-400 font-mono">668</div>
                <span className="text-[10px] text-slate-500">Transacciones en el período</span>
              </div>
            </div>

            {/* Individual Branch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: 'Casa Central (Depósito Principal)',
                  ingresos: '$18.074.650,32',
                  gastos: '$18.000,00',
                  utilidad: '$18.056.650,32',
                  compras: '$0,00',
                  ticket: '$602.488,34',
                  ventas: '622 transacciones',
                  part: '98.1%',
                  margen: '99.9%',
                },
                {
                  name: 'Sucursal Salón Express',
                  ingresos: '$354.267,27',
                  gastos: '$0,00',
                  utilidad: '$354.267,27',
                  compras: '$0,00',
                  ticket: '$11.808,91',
                  ventas: '46 transacciones',
                  part: '1.9%',
                  margen: '100.0%',
                },
                {
                  name: 'Depósito Secundario / Distribución',
                  ingresos: '$0,00',
                  gastos: '$17.644.938,67',
                  utilidad: '-$17.644.938,67',
                  compras: '$17.644.938,67',
                  ticket: '$0,00',
                  ventas: '0 transacciones',
                  part: '0.0%',
                  margen: '0.0%',
                },
              ].map((branch, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">{branch.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                      {branch.margen} margen
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="bg-slate-950 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-500 block font-sans">Ingresos</span>
                      <span className="text-emerald-400 font-bold">{branch.ingresos}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-500 block font-sans">Gastos</span>
                      <span className="text-rose-400 font-bold">{branch.gastos}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 pt-1 border-t border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Utilidad:</span>
                      <span className="font-mono font-bold text-white">{branch.utilidad}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Ventas:</span>
                      <span className="font-mono text-slate-300">{branch.ventas}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Participación en ingresos:</span>
                      <span className="font-bold text-amber-400">{branch.part}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: branch.part }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 12: ESTADO DE RESULTADOS (P&L) */}
        {/* ========================================================= */}
        {activeTab === 'estado_resultados' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Ventas del Mes</span>
                <div className="text-2xl font-black text-white font-mono">$11.409.194</div>
                <span className="text-[10px] text-rose-400">-32.8% vs mes ant.</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Margen Bruto</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">$3.486.256</div>
                <span className="text-[10px] text-emerald-400">30.6% sobre ventas</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Gastos Totales</span>
                <div className="text-2xl font-black text-rose-400 font-mono">$2.839.919</div>
                <span className="text-[10px] text-slate-400">-74.7% vs mes ant.</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Resultado Neto</span>
                <div className="text-2xl font-black text-blue-400 font-mono">$646.336</div>
                <span className="text-[10px] text-blue-400">5.7% margen neto</span>
              </div>
            </div>

            {/* Evolución Mensual 3 curves */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Evolución Mensual P&L</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000000}M`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="ingresos" name="Ventas" stroke="#38bdf8" strokeWidth={2} />
                    <Line type="monotone" dataKey="utilidad" name="Margen Bruto" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="gastos" name="Resultado Neto" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cuadro comparativo mensual Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Cuadro Comparativo Mensual
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Concepto</th>
                      {monthlyData.slice(4).map((m, i) => (
                        <th key={i} className="p-2.5 text-right">{m.mes}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    <tr>
                      <td className="p-2.5 font-sans font-bold text-slate-200">Ventas Brutas</td>
                      {monthlyData.slice(4).map((m, i) => (
                        <td key={i} className="p-2.5 text-right text-emerald-400 font-semibold">{fmt(m.ingresos)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-rose-400">(-) Costo Mercadería (CMV)</td>
                      {monthlyData.slice(4).map((m, i) => (
                        <td key={i} className="p-2.5 text-right text-rose-400">-{fmt(m.cmv || 0)}</td>
                      ))}
                    </tr>
                    <tr className="bg-slate-950/60 font-bold">
                      <td className="p-2.5 font-sans text-blue-400">= Margen Bruto</td>
                      {monthlyData.slice(4).map((m, i) => (
                        <td key={i} className="p-2.5 text-right text-blue-400">+{fmt(Math.max(0, m.ingresos - (m.cmv || 0)))}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-rose-400">(-) Sueldos y Salarios</td>
                      {monthlyData.slice(4).map((m, i) => (
                        <td key={i} className="p-2.5 text-right text-rose-400">-{fmt(m.sueldos || 0)}</td>
                      ))}
                    </tr>
                    <tr className="bg-slate-950 font-black border-t-2 border-slate-700">
                      <td className="p-2.5 font-sans text-emerald-400">= Resultado Neto</td>
                      {monthlyData.slice(4).map((m, i) => (
                        <td key={i} className={`p-2.5 text-right ${m.utilidad >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fmt(m.utilidad)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 13: ASISTENTE IA FINANCIERO */}
        {/* ========================================================= */}
        {activeTab === 'asistente_ia' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-blue-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Diagnóstico Financiero Inteligente (IA)</h3>
                  <p className="text-xs text-slate-400">Análisis continuo de tus números, flujo de caja y rentabilidad</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Optimización de Compras</span>
                  </span>
                  <p className="text-xs text-slate-300">
                    Las compras de mercadería representan el <strong>64.7%</strong> de tus egresos. Se sugiere negociar 30 días de plazo con los 3 principales proveedores para descomprimir el capital de trabajo.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Rotación en Rubro Bulonería</span>
                  </span>
                  <p className="text-xs text-slate-300">
                    La categoría <strong>Bulonería & Fijaciones</strong> tiene un margen del <strong>51%</strong> y alta velocidad de giro. Ampliar variedad aportará un 8% extra de utilidad neta.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-blue-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Fondo de Emergencia Solvente</span>
                  </span>
                  <p className="text-xs text-slate-300">
                    Tu colchón de reserva cubre <strong>2 meses</strong> de gastos fijos consolidados ($922.000). Mantenerlo indexado por inflación garantiza estabilidad ante bajas estacionales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
