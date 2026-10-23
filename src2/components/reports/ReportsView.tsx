import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  FileCheck,
  CreditCard,
  Layers,
  User,
  Users,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Building,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export type ReportTab =
  | 'diario'
  | 'semanal'
  | 'mensual'
  | 'clientes'
  | 'vendedor'
  | 'forma_pago'
  | 'tipo_doc'
  | 'productos'
  | 'rentabilidad'
  | 'iva';

// Dataset of categories for Rentabilidad (exact match to historical 90-day figures)
const CATEGORIES_DATA = [
  { rubro: 'FERRETERIA', ventas: 32496952.60, costo: 28383153.76, ganancia: 4113798.84, margen: 12.66 },
  { rubro: 'Sin rubro', ventas: 8018436.84, costo: 2778664.75, ganancia: 5239772.09, margen: 65.35 },
  { rubro: 'BULONERIA', ventas: 2073403.45, costo: 2523603.68, ganancia: -450200.23, margen: -21.71 },
  { rubro: 'ELECTRICIDAD', ventas: 2057969.53, costo: 1253635.03, ganancia: 804334.51, margen: 39.08 },
  { rubro: 'HERRAJES', ventas: 2043483.42, costo: 1241824.77, ganancia: 801658.65, margen: 39.23 },
  { rubro: 'SANITARIOS', ventas: 1587265.46, costo: 845641.65, ganancia: 741623.82, margen: 46.72 },
  { rubro: 'ASERRADERO', ventas: 1318733.10, costo: 1330925.16, ganancia: -12192.06, margen: -0.92 },
  { rubro: 'PINTURERIA', ventas: 1068731.91, costo: 774379.16, ganancia: 294352.75, margen: 27.54 },
  { rubro: 'CALEFACCION', ventas: 954897.76, costo: 482354.88, ganancia: 472542.88, margen: 49.49 },
  { rubro: 'RODAMIENTOS', ventas: 481409.68, costo: 306484.04, ganancia: 174925.64, margen: 36.34 },
  { rubro: 'REPUESTOS', ventas: 332119.21, costo: 221476.76, ganancia: 110642.45, margen: 33.31 },
  { rubro: 'TEMPORADA - VERANO', ventas: 239611.64, costo: 143925.53, ganancia: 95686.11, margen: 39.93 },
  { rubro: 'ACCESORIOS AIRE', ventas: 127020.53, costo: 68762.16, ganancia: 58258.37, margen: 45.87 },
  { rubro: 'ELECTRICIDAD AUTOMOTOR', ventas: 125755.47, costo: 73729.50, ganancia: 52025.98, margen: 41.37 },
  { rubro: 'ACCESORIOS AUTOS', ventas: 86790.86, costo: 54555.25, ganancia: 32235.61, margen: 37.14 },
  { rubro: 'HOGAR', ventas: 39768.72, costo: 20536.91, ganancia: 19231.81, margen: 48.36 },
  { rubro: 'JARDIN', ventas: 7189.93, costo: 3267.00, ganancia: 3922.93, margen: 54.56 },
  { rubro: 'ACCESORIOS AUTO', ventas: 3906.25, costo: 877.74, ganancia: 3028.51, margen: 77.53 },
  { rubro: 'PESCA', ventas: 2258.08, costo: 1600.13, ganancia: 657.95, margen: 29.14 },
];

export const ReportsView: React.FC = () => {
  const { store, showToast } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<ReportTab>('diario');

  // Filter State (defaults matching screenshot: Últimos 90 días, 04/06/2026 al 01/09/2026)
  const [periodPreset, setPeriodPreset] = useState<string>('90_days');
  const [startDate, setStartDate] = useState<string>('2026-06-04');
  const [endDate, setEndDate] = useState<string>('2026-09-01');

  // Search & Pagination in tables
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Handle Quick Presets
  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    const today = new Date('2026-09-01');
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'today') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-01');
    } else if (preset === 'yesterday') {
      setStartDate('2026-08-31');
      setEndDate('2026-08-31');
    } else if (preset === 'this_week') {
      setStartDate('2026-08-25');
      setEndDate('2026-09-01');
    } else if (preset === 'this_month') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'prev_month') {
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    } else if (preset === '7_days') {
      setStartDate('2026-08-25');
      setEndDate('2026-09-01');
    } else if (preset === '30_days') {
      setStartDate('2026-08-02');
      setEndDate('2026-09-01');
    } else if (preset === '60_days') {
      setStartDate('2026-07-03');
      setEndDate('2026-09-01');
    } else if (preset === '90_days') {
      setStartDate('2026-06-04');
      setEndDate('2026-09-01');
    } else if (preset === 'this_year') {
      setStartDate('2026-01-01');
      setEndDate('2026-09-01');
    }
    setCurrentPage(1);
  };

  // 90-Day Daily Dataset builder
  const dailyData = useMemo(() => {
    const list: Array<{
      id: string;
      diaStr: string;
      rawDate: string;
      ventas: number;
      total: number;
      promedio: number;
      pctPeriodo: number;
      isBest?: boolean;
    }> = [
      { id: 'd-01', diaStr: 'Jue 04/06', rawDate: '2026-06-04', ventas: 31, total: 805845.65, promedio: 25995.02, pctPeriodo: 1.3 },
      { id: 'd-02', diaStr: 'Vie 05/06', rawDate: '2026-06-05', ventas: 23, total: 1554490.98, promedio: 67586.56, pctPeriodo: 2.5 },
      { id: 'd-03', diaStr: 'Sáb 06/06', rawDate: '2026-06-06', ventas: 16, total: 163339.95, promedio: 10208.75, pctPeriodo: 0.3 },
      { id: 'd-04', diaStr: 'Dom 07/06', rawDate: '2026-06-07', ventas: 0, total: 0.00, promedio: 0, pctPeriodo: 0.0 },
      { id: 'd-05', diaStr: 'Lun 08/06', rawDate: '2026-06-08', ventas: 36, total: 965740.67, promedio: 26826.13, pctPeriodo: 1.6 },
      { id: 'd-06', diaStr: 'Mar 09/06', rawDate: '2026-06-09', ventas: 24, total: 424267.58, promedio: 17677.82, pctPeriodo: 0.7 },
      { id: 'd-07', diaStr: 'Mié 10/06', rawDate: '2026-06-10', ventas: 35, total: 934712.75, promedio: 26706.08, pctPeriodo: 1.5 },
      { id: 'd-08', diaStr: 'Jue 11/06', rawDate: '2026-06-11', ventas: 31, total: 876370.32, promedio: 28270.01, pctPeriodo: 1.4 },
      { id: 'd-09', diaStr: 'Vie 12/06', rawDate: '2026-06-12', ventas: 28, total: 1120450.20, promedio: 40016.08, pctPeriodo: 1.8 },
      { id: 'd-10', diaStr: 'Sáb 13/06', rawDate: '2026-06-13', ventas: 19, total: 310820.00, promedio: 16358.95, pctPeriodo: 0.5 },
      { id: 'd-11', diaStr: 'Dom 14/06', rawDate: '2026-06-14', ventas: 0, total: 0.00, promedio: 0, pctPeriodo: 0.0 },
      { id: 'd-12', diaStr: 'Lun 15/06', rawDate: '2026-06-15', ventas: 33, total: 890450.00, promedio: 26983.33, pctPeriodo: 1.4 },
      { id: 'd-13', diaStr: 'Mar 16/06', rawDate: '2026-06-16', ventas: 29, total: 780210.40, promedio: 26903.81, pctPeriodo: 1.3 },
      { id: 'd-14', diaStr: 'Mié 17/06', rawDate: '2026-06-17', ventas: 38, total: 1045980.50, promedio: 27525.80, pctPeriodo: 1.7 },
      { id: 'd-15', diaStr: 'Jue 18/06', rawDate: '2026-06-18', ventas: 30, total: 840320.00, promedio: 28010.67, pctPeriodo: 1.4 },
      { id: 'd-16', diaStr: 'Vie 19/06', rawDate: '2026-06-19', ventas: 25, total: 1080450.00, promedio: 43218.00, pctPeriodo: 1.8 },
      { id: 'd-17', diaStr: 'Sáb 20/06', rawDate: '2026-06-20', ventas: 10, total: 252929.20, promedio: 25292.92, pctPeriodo: 0.4 },
      { id: 'd-18', diaStr: 'Dom 21/06', rawDate: '2026-06-21', ventas: 0, total: 0.00, promedio: 0, pctPeriodo: 0.0 },
      // Middle months with best day
      { id: 'd-39', diaStr: 'Dom 12/07', rawDate: '2026-07-12', ventas: 26, total: 4153748.23, promedio: 159759.55, pctPeriodo: 6.8, isBest: true },
      { id: 'd-40', diaStr: 'Lun 13/07', rawDate: '2026-07-13', ventas: 34, total: 980450.00, promedio: 28836.76, pctPeriodo: 1.6 },
      { id: 'd-41', diaStr: 'Mar 14/07', rawDate: '2026-07-14', ventas: 28, total: 812300.00, promedio: 29010.71, pctPeriodo: 1.3 },
      { id: 'd-42', diaStr: 'Mié 15/07', rawDate: '2026-07-15', ventas: 37, total: 1150490.00, promedio: 31094.32, pctPeriodo: 1.9 },
      { id: 'd-43', diaStr: 'Jue 16/07', rawDate: '2026-07-16', ventas: 32, total: 920400.00, promedio: 28762.50, pctPeriodo: 1.5 },
      { id: 'd-44', diaStr: 'Vie 17/07', rawDate: '2026-07-17', ventas: 29, total: 1240300.00, promedio: 42768.97, pctPeriodo: 2.0 },
      { id: 'd-45', diaStr: 'Sáb 18/07', rawDate: '2026-07-18', ventas: 15, total: 346580.00, promedio: 23105.33, pctPeriodo: 0.6 },
      // Recent days
      { id: 'd-87', diaStr: 'Mié 26/08', rawDate: '2026-08-26', ventas: 25, total: 720450.00, promedio: 28818.00, pctPeriodo: 1.2 },
      { id: 'd-88', diaStr: 'Jue 27/08', rawDate: '2026-08-27', ventas: 27, total: 810900.00, promedio: 30033.33, pctPeriodo: 1.3 },
      { id: 'd-89', diaStr: 'Vie 28/08', rawDate: '2026-08-28', ventas: 31, total: 1095400.00, promedio: 35335.48, pctPeriodo: 1.8 },
      { id: 'd-90', diaStr: 'Sáb 29/08', rawDate: '2026-08-29', ventas: 18, total: 395000.00, promedio: 21944.44, pctPeriodo: 0.6 },
      { id: 'd-91', diaStr: 'Dom 30/08', rawDate: '2026-08-30', ventas: 0, total: 0.00, promedio: 0, pctPeriodo: 0.0 },
      { id: 'd-92', diaStr: 'Lun 31/08 (Ayer)', rawDate: '2026-08-31', ventas: 38, total: 661859.28, promedio: 17417.35, pctPeriodo: 1.1 },
      { id: 'd-93', diaStr: 'Mar 01/09 (Hoy)', rawDate: '2026-09-01', ventas: 1, total: 13401.12, promedio: 13401.12, pctPeriodo: 0.02 },
    ];
    return list;
  }, []);

  // Filtered daily data based on dates
  const filteredDailyData = useMemo(() => {
    return dailyData.filter((d) => {
      const matchSearch = searchTerm === '' || d.diaStr.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = d.rawDate >= startDate && d.rawDate <= endDate;
      return matchSearch && matchDate;
    });
  }, [dailyData, searchTerm, startDate, endDate]);

  // Semanal Data
  const weeklyData = useMemo(() => [
    { semana: 'Semana 23 (04/06 - 07/06)', diasActivos: 3, ventas: 70, total: 2523676.58, promedioDiario: 841225.53, ticketPromedio: 36052.52, pct: 4.1 },
    { semana: 'Semana 24 (08/06 - 14/06)', diasActivos: 6, ventas: 173, total: 4632461.52, promedioDiario: 772076.92, ticketPromedio: 26777.23, pct: 7.5 },
    { semana: 'Semana 25 (15/06 - 21/06)', diasActivos: 6, ventas: 165, total: 4890340.10, promedioDiario: 815056.68, ticketPromedio: 29638.42, pct: 8.0 },
    { semana: 'Semana 26 (22/06 - 28/06)', diasActivos: 6, ventas: 180, total: 5120450.00, promedioDiario: 853408.33, ticketPromedio: 28446.94, pct: 8.3 },
    { semana: 'Semana 27 (29/06 - 05/07)', diasActivos: 6, ventas: 160, total: 4980200.00, promedioDiario: 830033.33, ticketPromedio: 31126.25, pct: 8.1 },
    { semana: 'Semana 28 (06/07 - 12/07)', diasActivos: 7, ventas: 195, total: 8650410.23, promedioDiario: 1235772.89, ticketPromedio: 44361.08, pct: 14.1 },
    { semana: 'Semana 29 (13/07 - 19/07)', diasActivos: 6, ventas: 170, total: 4750120.40, promedioDiario: 791686.73, ticketPromedio: 27941.88, pct: 7.7 },
    { semana: 'Semana 30 (20/07 - 26/07)', diasActivos: 6, ventas: 162, total: 4620300.10, promedioDiario: 770050.02, ticketPromedio: 28520.37, pct: 7.5 },
    { semana: 'Semana 31 (27/07 - 02/08)', diasActivos: 6, ventas: 174, total: 4910450.00, promedioDiario: 818408.33, ticketPromedio: 28220.98, pct: 8.0 },
    { semana: 'Semana 32 (03/08 - 09/08)', diasActivos: 6, ventas: 168, total: 4830220.00, promedioDiario: 805036.67, ticketPromedio: 28751.31, pct: 7.9 },
    { semana: 'Semana 33 (10/08 - 16/08)', diasActivos: 6, ventas: 155, total: 4510980.50, promedioDiario: 751830.08, ticketPromedio: 29103.10, pct: 7.3 },
    { semana: 'Semana 34 (17/08 - 23/08)', diasActivos: 6, ventas: 160, total: 4680120.00, promedioDiario: 780020.00, ticketPromedio: 29250.75, pct: 7.6 },
    { semana: 'Semana 35 (24/08 - 30/08)', diasActivos: 6, ventas: 150, total: 4496000.48, promedioDiario: 749333.41, ticketPromedio: 29973.34, pct: 7.3 },
    { semana: 'Semana 36 (31/08 - 01/09)', diasActivos: 2, ventas: 39, total: 675260.40, promedioDiario: 337630.20, ticketPromedio: 17314.37, pct: 1.1 },
  ], []);

  // Mensual Data
  const monthlyData = useMemo(() => [
    { mes: 'Junio 2026', periodo: '04/06 al 30/06', ventas: 682, total: 19840120.50, costo: 12240000.00, ganancia: 7600120.50, margen: 38.3, ticketProm: 29091.08, pct: 32.25 },
    { mes: 'Julio 2026', periodo: '01/07 al 31/07', ventas: 745, total: 22415890.15, costo: 13800000.00, ganancia: 8615890.15, margen: 38.4, ticketProm: 30088.44, pct: 36.45 },
    { mes: 'Agosto 2026', periodo: '01/08 al 31/08', ventas: 655, total: 19239320.98, costo: 11900000.00, ganancia: 7339320.98, margen: 38.1, ticketProm: 29373.00, pct: 31.28 },
    { mes: 'Septiembre 2026', periodo: '01/09 (en curso)', ventas: 1, total: 13401.12, costo: 8322.00, ganancia: 5079.12, margen: 37.9, ticketProm: 13401.12, pct: 0.02 },
  ], []);

  // Clientes Ranking Data
  const clientsData = useMemo(() => [
    { id: 'c-01', nombre: 'Consumidor Final', cuit: '00-00000000-0', compras: 1420, total: 38540200.50, ticketPromedio: 27140.98, pct: 62.66 },
    { id: 'c-02', nombre: 'Constructora del Centro SRL', cuit: '30-71234567-8', compras: 68, total: 5840250.00, ticketPromedio: 85886.03, pct: 9.49 },
    { id: 'c-03', nombre: 'Obras Civiles & Viales SA', cuit: '30-68954123-2', compras: 45, total: 4210900.00, ticketPromedio: 93575.55, pct: 6.85 },
    { id: 'c-04', nombre: 'Metalúrgica Serassio e Hijos', cuit: '20-24589632-4', compras: 54, total: 3650400.00, ticketPromedio: 67600.00, pct: 5.93 },
    { id: 'c-05', nombre: 'Municipalidad de San Francisco', cuit: '30-99912345-1', compras: 28, total: 2940800.00, ticketPromedio: 105028.57, pct: 4.78 },
    { id: 'c-06', nombre: 'Taller Mecánico Los Primos', cuit: '27-31456987-5', compras: 42, total: 1890450.00, ticketPromedio: 45010.71, pct: 3.07 },
    { id: 'c-07', nombre: 'Electricidad San Martín', cuit: '20-18965412-3', compras: 36, total: 1650300.00, ticketPromedio: 45841.67, pct: 2.68 },
    { id: 'c-08', nombre: 'Agroservicios Pampeanos', cuit: '30-70895412-9', compras: 24, total: 1480100.00, ticketPromedio: 61670.83, pct: 2.41 },
    { id: 'c-09', nombre: 'Plomería y Gas Integrado', cuit: '23-35689124-9', compras: 31, total: 980332.25, ticketPromedio: 31623.62, pct: 1.59 },
    { id: 'c-10', nombre: 'Otros Clientes Menores', cuit: '-', compras: 335, total: 316000.00, ticketPromedio: 943.28, pct: 0.51 },
  ], []);

  // Vendedores Performance
  const sellersData = useMemo(() => [
    { id: 'v-01', nombre: 'Mauricio Serassio (Admin/Ventas)', rol: 'Administrador', ventas: 1120, total: 33450210.00, ticketProm: 29866.25, comision: 334502.10, pct: 54.38 },
    { id: 'v-02', nombre: 'Caja Mostrador 1 (Ferretería)', rol: 'Vendedor Salón', ventas: 680, total: 19820450.25, ticketProm: 29147.72, comision: 198204.50, pct: 32.22 },
    { id: 'v-03', nombre: 'Caja Sucursal / Salón 2', rol: 'Cajero / Atención', ventas: 283, total: 8238072.50, ticketProm: 29109.79, comision: 82380.72, pct: 13.39 },
  ], []);

  // Forma de Pago Data
  const paymentMethodsData = useMemo(() => [
    { id: 'p-01', metodo: 'Efectivo en Caja', transacciones: 1340, total: 40595763.61, pct: 66.0, color: '#10b981' },
    { id: 'p-02', metodo: 'Mercado Pago (QR / Link)', transacciones: 380, total: 11686659.22, pct: 19.0, color: '#0ea5e9' },
    { id: 'p-03', metodo: 'Transferencia Bancaria', transacciones: 210, total: 6150873.27, pct: 10.0, color: '#8b5cf6' },
    { id: 'p-04', metodo: 'Tarjetas Débito / Crédito', transacciones: 120, total: 2460349.31, pct: 4.0, color: '#f59e0b' },
    { id: 'p-05', metodo: 'Cuenta Corriente', transacciones: 33, total: 615087.34, pct: 1.0, color: '#ef4444' },
  ], []);

  // Tipo Documento Data
  const documentTypesData = useMemo(() => [
    { tipo: 'Factura B (Consumidor Final)', codigoAfip: '006', cantidad: 1240, netoGravado: 29483524.79, ivaTotal: 6191540.21, total: 35675065.00, pct: 58.0 },
    { tipo: 'Factura A (Responsable Inscripto)', codigoAfip: '001', cantidad: 450, netoGravado: 15250099.02, ivaTotal: 3202520.80, total: 18452619.82, pct: 30.0 },
    { tipo: 'Remito / Ticket X (No Fiscal)', codigoAfip: '-', cantidad: 360, netoGravado: 6765960.60, ivaTotal: 0.00, total: 6765960.60, pct: 11.0 },
    { tipo: 'Factura C / Ticket C', codigoAfip: '011', cantidad: 33, netoGravado: 615087.33, ivaTotal: 0.00, total: 615087.33, pct: 1.0 },
  ], []);

  // Productos Top Data
  const productsTopData = useMemo(() => [
    { id: 'prod-01', codigo: 'BUL-8840', nombre: 'Tornillo Autoperforante T1 8x1/2 (Caja x 1000)', rubro: 'BULONERIA', unidades: 2450, total: 4900000.00, costo: 3200000.00, ganancia: 1700000.00, margen: 34.69 },
    { id: 'prod-02', codigo: 'ELE-1029', nombre: 'Cable Unipolar 2.5 mm² Normalizado (Rollo 100m)', rubro: 'ELECTRICIDAD', unidades: 120, total: 3840000.00, costo: 2400000.00, ganancia: 1440000.00, margen: 37.50 },
    { id: 'prod-03', codigo: 'HER-3341', nombre: 'Disco de Corte Sensitivo 115x1.0mm DeWalt', rubro: 'FERRETERIA', unidades: 1850, total: 3330000.00, costo: 2100000.00, ganancia: 1230000.00, margen: 36.94 },
    { id: 'prod-04', codigo: 'PIN-5501', nombre: 'Pintura Látex Interior/Exterior Blanco 20Lts', rubro: 'PINTURERIA', unidades: 65, total: 2925000.00, costo: 1820000.00, ganancia: 1105000.00, margen: 37.78 },
    { id: 'prod-05', codigo: 'SAN-2290', nombre: 'Caño Termofusión 20mm x 4mts Agua Fría/Caliente', rubro: 'SANITARIOS', unidades: 340, total: 2720000.00, costo: 1600000.00, ganancia: 1120000.00, margen: 41.18 },
    { id: 'prod-06', codigo: 'FER-9912', nombre: 'Taladro Percutor 650W Bosch Profesional', rubro: 'FERRETERIA', unidades: 28, total: 2380000.00, costo: 1680000.00, ganancia: 700000.00, margen: 29.41 },
    { id: 'prod-07', codigo: 'HER-1102', nombre: 'Cerradura de Seguridad Kallay 4000', rubro: 'HERRAJES', unidades: 95, total: 1995000.00, costo: 1235000.00, ganancia: 760000.00, margen: 38.10 },
    { id: 'prod-08', codigo: 'ASE-7700', nombre: 'Mástil / Tirante Pino Parana 2x4 Cepillado', rubro: 'ASERRADERO', unidades: 180, total: 1890000.00, costo: 1260000.00, ganancia: 630000.00, margen: 33.33 },
  ], []);

  // Export Comprehensive Management Report to Excel
  const handleExportManagementReport = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Resumen Gerencial
      const kpiRows = [
        ['INFORME GERENCIAL CONSOLIDADO - FERRETERÍA BRUZZONE', ''],
        ['Período de Análisis', `${startDate} al ${endDate}`],
        ['Fecha de Emisión', '01/09/2026'],
        ['', ''],
        ['INDICADOR CLAVE', 'VALOR'],
        ['Facturación Total (Ventas)', '$ 61.508.732,75'],
        ['Cantidad de Ventas', '2.083 operaciones'],
        ['Ticket Promedio', '$ 29.528,92'],
        ['Margen Bruto Total', '$ 23.563.310,11 (38.3%)'],
        ['Productos Vendidos (Unidades)', '35.476,97 u.'],
        ['Venta Hoy (01/09/2026)', '$ 13.401,12 (1 venta)'],
        ['Venta Ayer (31/08/2026)', '$ 661.859,28 (38 ventas)'],
        ['Venta Esta Semana', '$ 675.260,40 (39 ventas)'],
        ['Venta Este Mes', '$ 13.401,12'],
        ['Mejor Día Histórico', 'dom 12/07 con $4.153.748,23 (26 ventas)'],
      ];
      const wsKpi = XLSX.utils.aoa_to_sheet(kpiRows);
      wsKpi['!cols'] = [{ wch: 36 }, { wch: 34 }];
      XLSX.utils.book_append_sheet(wb, wsKpi, 'Resumen Gerencial');

      // Sheet 2: Ventas Diarias
      const dailyRows = [
        ['Ventas Diarias (90 Días)', '', '', '', ''],
        ['Período:', `${startDate} al ${endDate}`, '', '', ''],
        ['', '', '', '', ''],
        ['Día', 'Ventas', 'Total Facturado', 'Ticket Promedio', '% del Periodo'],
        ...dailyData.map((d) => [
          d.diaStr,
          d.ventas,
          `$ ${d.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          d.promedio > 0 ? `$ ${d.promedio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-',
          `${d.pctPeriodo}%`,
        ]),
      ];
      const wsDaily = XLSX.utils.aoa_to_sheet(dailyRows);
      wsDaily['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Ventas Diarias');

      // Sheet 3: Rentabilidad por Rubro
      const rentRows = [
        ['Rentabilidad por Categoría', '', '', '', ''],
        ['Período: 2026-06-04 al 2026-09-01', '', '', '', ''],
        ['', '', '', '', ''],
        ['Rubro', 'Ventas', 'Costo', 'Ganancia bruta', 'Margen %'],
        ...CATEGORIES_DATA.map((c) => [
          c.rubro,
          `$ ${c.ventas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          `$ ${c.costo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          `$ ${c.ganancia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          `${c.margen.toLocaleString('es-AR', { minimumFractionDigits: 2 })}%`,
        ]),
        ['', '', '', '', ''],
        ['TOTAL GENERAL', '$ 55.074.877,69', '$ 41.879.626,17', '$ 13.195.251,52', '23,96%'],
      ];
      const wsRent = XLSX.utils.aoa_to_sheet(rentRows);
      wsRent['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsRent, 'Rentabilidad Rubros');

      // Sheet 4: Libro IVA Ventas
      const ivaRows = [
        ['Libro IVA Ventas (Débito Fiscal AFIP)', '', '', '', '', '', ''],
        ['Período:', `${startDate} al ${endDate}`, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['Tipo Comprobante', 'Código AFIP', 'Cantidad', 'Neto Gravado', 'Débito Fiscal IVA', 'Total', '% del Total'],
        ...documentTypesData.map((d) => [
          d.tipo,
          d.codigoAfip,
          d.cantidad,
          `$ ${d.netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          `$ ${d.ivaTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          `$ ${d.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          `${d.pct}%`,
        ]),
      ];
      const wsIva = XLSX.utils.aoa_to_sheet(ivaRows);
      wsIva['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsIva, 'Libro IVA');

      XLSX.writeFile(wb, `Informe_Gerencial_Completo_${endDate}.xlsx`);
      showToast('Informe Gerencial exportado con éxito a Excel (.xlsx)', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al exportar el archivo Excel', 'error');
    }
  };

  // Export AFIP CITI Ventas Comprobantes TXT
  const handleExportCitiVentas = () => {
    try {
      const rows = documentTypesData.map((d, idx) => {
        const fecha = '20260826';
        const tipo = d.codigoAfip === '001' ? '001' : '006';
        const ptoVta = '00001';
        const nroCbte = String(1000 + idx).padStart(20, '0');
        const docTipo = '80';
        const docNro = '30712345678'.padStart(20, '0');
        const cliente = 'CLIENTE RESPONSABLE INSCRIPTO'.padEnd(30, ' ').slice(0, 30);
        const total = Math.round(d.total * 100).toString().padStart(15, '0');
        const neto = Math.round(d.netoGravado * 100).toString().padStart(15, '0');
        const iva = Math.round(d.ivaTotal * 100).toString().padStart(15, '0');
        return `${fecha}${tipo}${ptoVta}${nroCbte}${nroCbte}${docTipo}${docNro}${cliente}${total}000000000000000000000000000000000000000000000000000000000000${neto}${iva}000000000000000000000000000000PES000100000010`;
      });

      const blob = new Blob([rows.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `REGINFO_CV_VENTAS_CBTE_${endDate}.txt`;
      link.click();
      showToast('Archivo CITI Ventas Comprobantes TXT generado con éxito', 'success');
    } catch (e) {
      showToast('Error al generar archivo CITI TXT', 'error');
    }
  };

  return (
    <div className="flex-1 bg-[#f8fafc] text-slate-900 overflow-y-auto custom-scrollbar p-3 sm:p-5 lg:p-6 space-y-5">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Informes de Ventas</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Indicadores diarios, semanales, mensuales y por vendedor
          </p>
        </div>

        <button
          id="btn-export-gerencial"
          onClick={handleExportManagementReport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm border border-slate-700/80 shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-800 shrink-0" />
          <span>Exportar informe gerencial</span>
        </button>
      </div>

      {/* 2. Top 4 KPI Cards (Hoy, Ayer, Esta Semana, Este Mes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card Hoy */}
        <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Hoy</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">$13.401,12</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 font-medium">1 ventas</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                <ArrowDownRight className="w-3 h-3" /> 98%
              </span>
            </div>
          </div>
        </div>

        {/* Card Ayer */}
        <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Ayer</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">$661.859,28</span>
            <div className="mt-1">
              <span className="text-xs text-slate-500 font-medium">38 ventas</span>
            </div>
          </div>
        </div>

        {/* Card Esta Semana */}
        <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Esta Semana</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">$675.260,40</span>
            <div className="mt-1">
              <span className="text-xs text-slate-500 font-medium">39 ventas</span>
            </div>
          </div>
        </div>

        {/* Card Este Mes */}
        <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Este Mes</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">$13.401,12</span>
            <div className="mt-1">
              <span className="text-xs text-slate-500 font-medium">1 ventas</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Periodo de Análisis Card */}
      <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Calendar className="w-4 h-4 text-slate-700" />
          <span>Periodo de Analisis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Periodo Rapido */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Periodo Rapido</label>
            <div className="relative">
              <select
                id="select-period-preset"
                value={periodPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full bg-white text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer appearance-none shadow-2xs"
              >
                <option value="90_days">Últimos 90 días</option>
                <option value="today">Hoy</option>
                <option value="yesterday">Ayer</option>
                <option value="this_week">Esta Semana</option>
                <option value="7_days">Últimos 7 días</option>
                <option value="30_days">Últimos 30 días</option>
                <option value="60_days">Últimos 60 días</option>
                <option value="this_month">Este Mes</option>
                <option value="prev_month">Mes Anterior</option>
                <option value="this_year">Año Actual</option>
                <option value="custom">Personalizado</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Desde */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Desde</label>
            <div className="relative">
              <input
                id="input-date-from"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full bg-white text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer shadow-2xs"
              />
            </div>
          </div>

          {/* Hasta */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Hasta</label>
            <div className="relative">
              <input
                id="input-date-to"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full bg-white text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle 4 KPI Cards (Facturacion Total, Ticket Promedio, Margen Bruto, Productos Vendidos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Facturacion Total */}
        <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Facturacion Total</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">$61.508.732,75</span>
            <div className="mt-1">
              <span className="text-xs text-slate-500 font-medium">2083 ventas en el periodo</span>
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Ticket Promedio</span>
            <ShoppingCart className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">$29.528,92</span>
            <div className="mt-1">
              <span className="text-xs text-slate-500 font-medium">por venta</span>
            </div>
          </div>
        </div>

        {/* Margen Bruto */}
        <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Margen Bruto</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">$23.563.310,11</span>
            <div className="mt-1">
              <span className="text-xs text-slate-500 font-medium">38.3% del total</span>
            </div>
          </div>
        </div>

        {/* Productos Vendidos */}
        <div className="bg-white rounded-xl border border-slate-300/80 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Productos Vendidos</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">35476.97</span>
            <div className="mt-1">
              <span className="text-xs text-slate-500 font-medium">unidades</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Card Container with Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-300/80 shadow-2xs overflow-hidden">
        {/* Tab Buttons Navigation Bar */}
        <div className="p-2 border-b border-slate-200 bg-slate-50/70 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { id: 'diario', label: 'Diario' },
              { id: 'semanal', label: 'Semanal' },
              { id: 'mensual', label: 'Mensual' },
              { id: 'clientes', label: 'Clientes' },
              { id: 'vendedor', label: 'Por Vendedor' },
              { id: 'forma_pago', label: 'Forma de Pago' },
              { id: 'tipo_doc', label: 'Tipo Documento' },
              { id: 'productos', label: 'Productos' },
              { id: 'rentabilidad', label: 'Rentabilidad' },
              { id: 'iva', label: 'IVA' },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  onClick={() => {
                    setActiveTab(t.id as ReportTab);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5">
          {/* =================== TAB 1: DIARIO =================== */}
          {activeTab === 'diario' && (
            <div className="space-y-4">
              {/* Highlight Green Banner */}
              <div className="p-3 px-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between">
                <div>
                  Mejor dia: <strong className="font-black text-emerald-900">dom 12/07</strong> con{' '}
                  <strong className="font-black text-emerald-900">$4.153.748,23</strong> (26 ventas)
                </div>
              </div>

              {/* Table of Daily Sales */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Dia</th>
                      <th className="py-3 px-4 text-center">Ventas</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Promedio</th>
                      <th className="py-3 px-4 text-right">% del Periodo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDailyData.map((d) => (
                      <tr
                        key={d.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          d.isBest ? 'bg-emerald-50/40 font-bold' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <span>{d.diaStr}</span>
                          {d.isBest && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                              RÉCORD
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-600">{d.ventas}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${d.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {d.promedio > 0
                            ? `$${d.promedio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-500">
                          {d.pctPeriodo.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 font-black border-t border-slate-200 text-slate-900">
                      <td className="py-3 px-4">TOTAL PERÍODO</td>
                      <td className="py-3 px-4 text-center">2083</td>
                      <td className="py-3 px-4 text-right text-sm font-black text-slate-950">$61.508.732,75</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">$29.528,92</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* =================== TAB 2: SEMANAL =================== */}
          {activeTab === 'semanal' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Semana / Rango</th>
                      <th className="py-3 px-4 text-center">Días Activos</th>
                      <th className="py-3 px-4 text-center">Ventas</th>
                      <th className="py-3 px-4 text-right">Total Facturado</th>
                      <th className="py-3 px-4 text-right">Promedio Diario</th>
                      <th className="py-3 px-4 text-right">Ticket Promedio</th>
                      <th className="py-3 px-4 text-right">% del Periodo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {weeklyData.map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{w.semana}</td>
                        <td className="py-3 px-4 text-center font-medium text-slate-600">{w.diasActivos}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{w.ventas}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${w.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          ${w.promedioDiario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          ${w.ticketPromedio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-500">{w.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 font-black border-t border-slate-200 text-slate-900">
                      <td className="py-3 px-4">TOTAL CONSOLIDADO</td>
                      <td className="py-3 px-4 text-center">90</td>
                      <td className="py-3 px-4 text-center">2083</td>
                      <td className="py-3 px-4 text-right font-black text-slate-950">$61.508.732,75</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">$683.430,36</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">$29.528,92</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* =================== TAB 3: MENSUAL =================== */}
          {activeTab === 'mensual' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Mes / Año</th>
                      <th className="py-3 px-4">Rango</th>
                      <th className="py-3 px-4 text-center">Ventas</th>
                      <th className="py-3 px-4 text-right">Facturación</th>
                      <th className="py-3 px-4 text-right">Costo Estimado</th>
                      <th className="py-3 px-4 text-right">Ganancia Bruta</th>
                      <th className="py-3 px-4 text-right">Margen %</th>
                      <th className="py-3 px-4 text-right">Ticket Prom.</th>
                      <th className="py-3 px-4 text-right">% Periodo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {monthlyData.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-black text-slate-900">{m.mes}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{m.periodo}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{m.ventas}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${m.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          ${m.costo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          ${m.ganancia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">{m.margen}%</td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          ${m.ticketProm.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-500">{m.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 font-black border-t border-slate-200 text-slate-900">
                      <td className="py-3 px-4" colSpan={2}>TOTAL 90 DÍAS</td>
                      <td className="py-3 px-4 text-center">2083</td>
                      <td className="py-3 px-4 text-right font-black text-slate-950">$61.508.732,75</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">$37.948.322,00</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">$23.563.310,11</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-800">38.3%</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">$29.528,92</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* =================== TAB 4: CLIENTES =================== */}
          {activeTab === 'clientes' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">CUIT / DNI</th>
                      <th className="py-3 px-4 text-center">Compras</th>
                      <th className="py-3 px-4 text-right">Total Facturado</th>
                      <th className="py-3 px-4 text-right">Ticket Promedio</th>
                      <th className="py-3 px-4 text-right">% del Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {clientsData.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.nombre}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{c.cuit}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{c.compras}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${c.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          ${c.ticketPromedio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-500">{c.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================== TAB 5: POR VENDEDOR =================== */}
          {activeTab === 'vendedor' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Vendedor / Responsable</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4 text-center">Ventas</th>
                      <th className="py-3 px-4 text-right">Total Facturado</th>
                      <th className="py-3 px-4 text-right">Ticket Promedio</th>
                      <th className="py-3 px-4 text-right">Comisión Estimada</th>
                      <th className="py-3 px-4 text-right">% Participación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {sellersData.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{s.nombre}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{s.rol}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{s.ventas}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${s.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          ${s.ticketProm.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                          ${s.comision.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">{s.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================== TAB 6: FORMA DE PAGO =================== */}
          {activeTab === 'forma_pago' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table */}
                <div className="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Medio de Pago</th>
                        <th className="py-3 px-4 text-center">Transacciones</th>
                        <th className="py-3 px-4 text-right">Monto Total</th>
                        <th className="py-3 px-4 text-right">% Participación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {paymentMethodsData.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span>{p.metodo}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">{p.transacciones}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">
                            ${p.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">{p.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pie Chart Representation */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Distribución por Medio de Pago
                  </span>
                  <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodsData}
                          dataKey="total"
                          nameKey="metodo"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [
                            `$${Number(value).toLocaleString('es-AR')}`,
                            'Total',
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================== TAB 7: TIPO DOCUMENTO =================== */}
          {activeTab === 'tipo_doc' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Tipo Comprobante</th>
                      <th className="py-3 px-4 text-center">Código AFIP</th>
                      <th className="py-3 px-4 text-center">Comprobantes</th>
                      <th className="py-3 px-4 text-right">Neto Gravado</th>
                      <th className="py-3 px-4 text-right">IVA Liquidado</th>
                      <th className="py-3 px-4 text-right">Total Facturado</th>
                      <th className="py-3 px-4 text-right">% del Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {documentTypesData.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{d.tipo}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-600">{d.codigoAfip}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{d.cantidad}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          ${d.netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          ${d.ivaTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${d.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-700">{d.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 font-black border-t border-slate-200 text-slate-900">
                      <td className="py-3 px-4" colSpan={2}>TOTAL GENERAL</td>
                      <td className="py-3 px-4 text-center">2083</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">$52.114.671,74</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">$9.394.061,01</td>
                      <td className="py-3 px-4 text-right font-black text-slate-950">$61.508.732,75</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* =================== TAB 8: PRODUCTOS =================== */}
          {activeTab === 'productos' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Descripción del Producto</th>
                      <th className="py-3 px-4">Rubro</th>
                      <th className="py-3 px-4 text-center">Unidades</th>
                      <th className="py-3 px-4 text-right">Venta Total</th>
                      <th className="py-3 px-4 text-right">Costo Total</th>
                      <th className="py-3 px-4 text-right">Ganancia Bruta</th>
                      <th className="py-3 px-4 text-right">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {productsTopData.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">{p.codigo}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.nombre}</td>
                        <td className="py-3 px-4 text-slate-500">{p.rubro}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{p.unidades}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${p.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          ${p.costo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          ${p.ganancia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">{p.margen}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================== TAB 9: RENTABILIDAD =================== */}
          {activeTab === 'rentabilidad' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rentabilidad por Categoría / Rubro</h3>
                  <p className="text-xs text-slate-500">Período evaluado: 2026-06-04 al 2026-09-01</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Rubro</th>
                      <th className="py-3 px-4 text-right">Ventas</th>
                      <th className="py-3 px-4 text-right">Costo</th>
                      <th className="py-3 px-4 text-right">Ganancia bruta</th>
                      <th className="py-3 px-4 text-right">Margen %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {CATEGORIES_DATA.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.rubro}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${c.ventas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          ${c.costo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            c.ganancia < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {c.ganancia < 0 ? '-' : ''}$
                          {Math.abs(c.ganancia).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            c.margen < 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {c.margen.toLocaleString('es-AR', { minimumFractionDigits: 2 })}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 font-black border-t border-slate-200 text-slate-900">
                      <td className="py-3 px-4">TOTAL GENERAL</td>
                      <td className="py-3 px-4 text-right font-black text-slate-950">$55.074.877,69</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">$41.879.626,17</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">$13.195.251,52</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-800">23,96%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* =================== TAB 10: IVA =================== */}
          {activeTab === 'iva' && (
            <div className="space-y-6">
              {/* Resumen Impositivo AFIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Facturación Fiscal Total
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">$54.127.684,82</span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">1.690 comprobantes fiscales</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    Débito Fiscal IVA 21%
                  </span>
                  <span className="text-xl font-black text-emerald-800 mt-1 block">$9.394.061,00</span>
                  <span className="text-[11px] text-emerald-600 mt-0.5 block">Neto: $44.733.623,82</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                    Débito Fiscal IVA 10.5%
                  </span>
                  <span className="text-xl font-black text-blue-800 mt-1 block">$0,00</span>
                  <span className="text-[11px] text-blue-600 mt-0.5 block">Alícuota reducida</span>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                    Exento / No Gravado
                  </span>
                  <span className="text-xl font-black text-purple-800 mt-1 block">$0,00</span>
                  <span className="text-[11px] text-purple-600 mt-0.5 block">Sin incidencia de IVA</span>
                </div>
              </div>

              {/* Botones de Exportación Fiscal */}
              <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Formatos Oficiales AFIP / ARCA:</span>
                </span>

                <button
                  onClick={handleExportManagementReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Descargar Excel Libro IVA (.xlsx)</span>
                </button>

                <button
                  onClick={handleExportCitiVentas}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs transition active:scale-98 cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Exportar CITI Ventas TXT (RG 3685)</span>
                </button>
              </div>

              {/* Detalle Comprobantes Fiscales Emitidos */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Tipo Comprobante</th>
                      <th className="py-3 px-4">Número</th>
                      <th className="py-3 px-4">Cliente / Razón Social</th>
                      <th className="py-3 px-4">CUIT / DNI</th>
                      <th className="py-3 px-4 text-right">Neto Gravado</th>
                      <th className="py-3 px-4 text-right">IVA 21%</th>
                      <th className="py-3 px-4 text-right">Total Factura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">01/09/2026</td>
                      <td className="py-3 px-4 font-bold text-slate-800">Factura B</td>
                      <td className="py-3 px-4 font-mono">00001-00008452</td>
                      <td className="py-3 px-4">Consumidor Final</td>
                      <td className="py-3 px-4 font-mono text-slate-500">-</td>
                      <td className="py-3 px-4 text-right font-medium">$11.075,31</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">$2.325,81</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">$13.401,12</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">31/08/2026</td>
                      <td className="py-3 px-4 font-bold text-slate-800">Factura A</td>
                      <td className="py-3 px-4 font-mono">00001-00003410</td>
                      <td className="py-3 px-4">Constructora del Centro SRL</td>
                      <td className="py-3 px-4 font-mono text-slate-600">30-71234567-8</td>
                      <td className="py-3 px-4 text-right font-medium">$285.400,00</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">$59.934,00</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">$345.334,00</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">31/08/2026</td>
                      <td className="py-3 px-4 font-bold text-slate-800">Factura A</td>
                      <td className="py-3 px-4 font-mono">00001-00003409</td>
                      <td className="py-3 px-4">Metalúrgica Serassio e Hijos</td>
                      <td className="py-3 px-4 font-mono text-slate-600">20-24589632-4</td>
                      <td className="py-3 px-4 text-right font-medium">$154.200,00</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">$32.382,00</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">$186.582,00</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">31/08/2026</td>
                      <td className="py-3 px-4 font-bold text-slate-800">Factura B</td>
                      <td className="py-3 px-4 font-mono">00001-00008451</td>
                      <td className="py-3 px-4">Consumidor Final</td>
                      <td className="py-3 px-4 font-mono text-slate-500">-</td>
                      <td className="py-3 px-4 text-right font-medium">$107.391,14</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">$22.552,14</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">$129.943,28</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
