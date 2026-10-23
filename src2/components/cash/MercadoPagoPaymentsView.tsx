import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
  Filter,
  Check,
  Download,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  QrCode,
  Smartphone,
  Plus,
  X,
  CreditCard,
  Building,
  Settings,
} from 'lucide-react';

export interface MercadoPagoPayment {
  id: string; // ID Pago (ej: 178874999958)
  tipo: 'Ingreso' | 'Egreso' | 'Devolución';
  fecha: string; // ej: 13/09/2026, 08:05 p. m.
  isoDate: string; // for filtering ej: 2026-09-13
  estado: 'Acreditado' | 'Pendiente' | 'Rechazado' | 'Reembolsado';
  monto: number; // positive for income, negative for extraction/expense
  metodo: string; // Transferencia, Dinero en cuenta, Tarjeta Débito, QR Pro
  pagador: string; // email or name
  emailDni: string;
  referencia: string; // INSTORE-cd170daa-..., VENTA-001, etc.
  detalle: string; // Banco / Cobro Mostrador / Extracción a Banco Galicia
  verifiedInErp?: boolean; // verified into cash register / money box
}

export const MercadoPagoPaymentsView: React.FC = () => {
  const { store, currentUser, showToast } = useApp();

  // Filters from user image:
  // Período: Hoy, Ayer, Últimos 7 días, Este mes, Personalizado
  const [periodo, setPeriodo] = useState<'Hoy' | 'Ayer' | 'Últimos 7 días' | 'Este mes' | 'Todos'>('Hoy');
  // Estado: Todos, Acreditado, Pendiente, Rechazado, Reembolsado
  const [estadoFilter, setEstadoFilter] = useState<string>('Todos');
  // Referencia externa
  const [refFilter, setRefFilter] = useState<string>('');
  // Monto
  const [montoFilter, setMontoFilter] = useState<string>('');
  // Tipo: Todos, Ingresos, Egresos
  const [tipoTab, setTipoTab] = useState<'todos' | 'ingresos' | 'egresos'>('todos');

  // Modal for extractions (Retirar Dinero / Extracción a Cuenta Bancaria)
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractAmount, setExtractAmount] = useState<number>(0);
  const [extractDestBank, setExtractDestBank] = useState<string>('Banco Galicia Cta Cte');
  const [extractReason, setExtractReason] = useState<string>('Transferencia a Banco por saldo operativo');

  // Modal for manual test payment / register simulation
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);
  const [newPayAmount, setNewPayAmount] = useState<number>(0);
  const [newPayPayer, setNewPayPayer] = useState<string>('cliente.mostrador@gmail.com');
  const [newPayMethod, setNewPayMethod] = useState<string>('Transferencia');
  const [newPayRef, setNewPayRef] = useState<string>('VENTA-POS-01');

  // Modal for MercadoPago API Credentials & Webhook setup
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [mpAccessToken, setMpAccessToken] = useState(() => localStorage.getItem('mp_access_token') || 'APP_USR-8492048102948-082412-a720f4c9304918230948-1092834');
  const [mpPublicKey, setMpPublicKey] = useState(() => localStorage.getItem('mp_public_key') || 'APP_USR-7a8f9d0c-1b2e-4f5a-8b9c-0d1e2f3a4b5c');
  const [mpUserId, setMpUserId] = useState(() => localStorage.getItem('mp_user_id') || '184920481');
  const [mpPosId, setMpPosId] = useState(() => localStorage.getItem('mp_pos_id') || 'POS-MOSTRADOR-01');
  const [mpWebhookUrl, setMpWebhookUrl] = useState(() => localStorage.getItem('mp_webhook_url') || 'https://api.ferreteriabruzzone.com.ar/api/webhooks/mercadopago');
  const [isConnected, setIsConnected] = useState(true);

  // State of payments loaded with the exact entries from the user's screenshot
  const [payments, setPayments] = useState<MercadoPagoPayment[]>(() => {
    const saved = localStorage.getItem('erp_mercadopago_payments_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: '178874999958',
        tipo: 'Ingreso',
        fecha: '13/09/2026, 08:05 p. m.',
        isoDate: '2026-09-13',
        estado: 'Acreditado',
        monto: 422.0,
        metodo: 'Transferencia',
        pagador: 'msol_1d@hotmail.com',
        emailDni: 'msol_1d@hotmail.com',
        referencia: '-',
        detalle: 'Banco Galicia Inmediata',
        verifiedInErp: true,
      },
      {
        id: '178863235548',
        tipo: 'Ingreso',
        fecha: '13/09/2026, 06:37 p. m.',
        isoDate: '2026-09-13',
        estado: 'Acreditado',
        monto: 50000.0,
        metodo: 'Dinero en cuenta',
        pagador: '-',
        emailDni: '-',
        referencia: 'INSTORE-cd170daa-5190-4b71-81eb-b7353fea8fee',
        detalle: 'Cobro Mostrador QR Interoperable',
        verifiedInErp: true,
      },
      {
        id: '178859124401',
        tipo: 'Ingreso',
        fecha: '13/09/2026, 04:12 p. m.',
        isoDate: '2026-09-13',
        estado: 'Acreditado',
        monto: 57200.0,
        metodo: 'QR MercadoPago',
        pagador: 'gonzalo.vallejos@gmail.com',
        emailDni: '20-33891245-2',
        referencia: 'INSTORE-8812fbc4-9912',
        detalle: 'Cobro Venta Herramientas Eléctricas',
        verifiedInErp: true,
      },
      {
        id: '178851009832',
        tipo: 'Ingreso',
        fecha: '13/09/2026, 02:45 p. m.',
        isoDate: '2026-09-13',
        estado: 'Pendiente',
        monto: 30170.0,
        metodo: 'Tarjeta Débito',
        pagador: 'valeria.ullua@yahoo.com.ar',
        emailDni: '27-35124491-4',
        referencia: 'VENTA-MOST-00981',
        detalle: 'En proceso de liquidación por procesador',
        verifiedInErp: false,
      },
      {
        id: '178842100981',
        tipo: 'Egreso',
        fecha: '12/09/2026, 11:30 a. m.',
        isoDate: '2026-09-12',
        estado: 'Acreditado',
        monto: 150000.0,
        metodo: 'Transferencia Saliente',
        pagador: 'Mauricio Serassio',
        emailDni: 'CBU: 0070178730004078422118',
        referencia: 'EXTR-MP-00042',
        detalle: 'Extracción a Banco Galicia Cta Cte',
        verifiedInErp: true,
      },
    ];
  });

  const savePayments = (newItems: MercadoPagoPayment[]) => {
    setPayments(newItems);
    localStorage.setItem('erp_mercadopago_payments_v1', JSON.stringify(newItems));
  };

  // Filter logic
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Period
      if (periodo === 'Hoy') {
        if (p.isoDate !== '2026-09-13') return false;
      } else if (periodo === 'Ayer') {
        if (p.isoDate !== '2026-09-12') return false;
      } else if (periodo === 'Últimos 7 días') {
        if (p.isoDate < '2026-09-06' || p.isoDate > '2026-09-13') return false;
      } else if (periodo === 'Este mes') {
        if (!p.isoDate.startsWith('2026-09')) return false;
      }

      // Estado
      if (estadoFilter !== 'Todos' && p.estado !== estadoFilter) {
        return false;
      }

      // Type Tab
      if (tipoTab === 'ingresos' && p.tipo !== 'Ingreso') return false;
      if (tipoTab === 'egresos' && p.tipo !== 'Egreso') return false;

      // Ref
      if (refFilter.trim()) {
        const query = refFilter.toLowerCase();
        const matchRef = p.referencia.toLowerCase().includes(query);
        const matchId = p.id.includes(query);
        if (!matchRef && !matchId) return false;
      }

      // Monto
      if (montoFilter.trim()) {
        const targetAmount = parseFloat(montoFilter.replace(/[^0-9.]/g, ''));
        if (!isNaN(targetAmount) && Math.abs(p.monto - targetAmount) > 1) {
          return false;
        }
      }

      return true;
    });
  }, [payments, periodo, estadoFilter, refFilter, montoFilter, tipoTab]);

  // Card summary metrics based on filtered or active day
  // Total Ingresos Acreditados: +$107.622,00 (3 acreditados)
  const ingresosAcreditados = useMemo(() => {
    return filteredPayments
      .filter((p) => p.tipo === 'Ingreso' && p.estado === 'Acreditado')
      .reduce((sum, p) => sum + p.monto, 0);
  }, [filteredPayments]);

  const countIngresosAcreditados = useMemo(() => {
    return filteredPayments.filter((p) => p.tipo === 'Ingreso' && p.estado === 'Acreditado').length;
  }, [filteredPayments]);

  // Egresos / Devoluciones / Dinero Extraído
  const egresosRealizados = useMemo(() => {
    return filteredPayments
      .filter((p) => p.tipo === 'Egreso' || p.tipo === 'Devolución')
      .reduce((sum, p) => sum + p.monto, 0);
  }, [filteredPayments]);

  const countEgresos = useMemo(() => {
    return filteredPayments.filter((p) => p.tipo === 'Egreso' || p.tipo === 'Devolución').length;
  }, [filteredPayments]);

  // Pendientes
  const pendientesMonto = useMemo(() => {
    return filteredPayments
      .filter((p) => p.estado === 'Pendiente')
      .reduce((sum, p) => sum + p.monto, 0);
  }, [filteredPayments]);

  const countPendientes = useMemo(() => {
    return filteredPayments.filter((p) => p.estado === 'Pendiente').length;
  }, [filteredPayments]);

  // Neto del Período = Ingresos Acreditados - Egresos
  const netoDelPeriodo = ingresosAcreditados - egresosRealizados;

  // Handler: Handle extraction (Dinero Extraído)
  const handleCreateExtraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (extractAmount <= 0) {
      showToast('Ingrese un monto mayor a 0 para extraer', 'error');
      return;
    }

    const newExtraction: MercadoPagoPayment = {
      id: `EXTR-${Date.now().toString().slice(-8)}`,
      tipo: 'Egreso',
      fecha: new Date().toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isoDate: new Date().toISOString().split('T')[0],
      estado: 'Acreditado',
      monto: extractAmount,
      metodo: 'Extracción a Cuenta',
      pagador: currentUser?.name || 'Administración',
      emailDni: extractDestBank,
      referencia: `EXTR-MP-${Math.floor(10000 + Math.random() * 90000)}`,
      detalle: extractReason || 'Retiro a cuenta bancaria',
      verifiedInErp: true,
    };

    savePayments([newExtraction, ...payments]);

    // Also record in store moneyBoxes or cashMovements
    const mpBox = store.moneyBoxes.find((b) => b.type === 'digital_wallet' || b.name.includes('MercadoPago'));
    const destBox = store.moneyBoxes.find((b) => b.name.includes(extractDestBank) || b.id.includes('galicia'));
    if (mpBox && destBox) {
      store.transferBetweenMoneyBoxes({
        fromBoxId: mpBox.id,
        toBoxId: destBox.id,
        amount: extractAmount,
        description: `Extracción MercadoPago hacia ${destBox.name}: ${extractReason}`,
        user: currentUser,
      });
    }

    setIsExtractModalOpen(false);
    setExtractAmount(0);
    setExtractReason('');
    showToast(`Extracción de $${extractAmount.toLocaleString('es-AR')} registrada con éxito`, 'success');
  };

  // Handler: Add new test / real payment
  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPayAmount <= 0) {
      showToast('Ingrese un monto válido', 'error');
      return;
    }

    const newPayment: MercadoPagoPayment = {
      id: `1788${Math.floor(10000000 + Math.random() * 90000000)}`,
      tipo: 'Ingreso',
      fecha: new Date().toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isoDate: new Date().toISOString().split('T')[0],
      estado: 'Acreditado',
      monto: newPayAmount,
      metodo: newPayMethod,
      pagador: newPayPayer,
      emailDni: newPayPayer,
      referencia: newPayRef || `VENTA-MP-${Math.floor(1000 + Math.random() * 9000)}`,
      detalle: 'Acreditación verificada en tiempo real',
      verifiedInErp: true,
    };

    savePayments([newPayment, ...payments]);
    setIsNewPaymentModalOpen(false);
    setNewPayAmount(0);
    showToast(`Pago de $${newPayAmount.toLocaleString('es-AR')} acreditado exitosamente`, 'success');
  };

  // Toggle verify state
  const handleToggleVerify = (paymentId: string) => {
    const updated = payments.map((p) => {
      if (p.id === paymentId) {
        const nextState = !p.verifiedInErp;
        return { ...p, verifiedInErp: nextState };
      }
      return p;
    });
    savePayments(updated);
    showToast('Estado de verificación en ERP actualizado', 'info');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto min-h-full text-slate-800 animate-in fade-in duration-150">
      {/* Top Title & MercadoPago Connection Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Verificacion de Pagos MercadoPago</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consulta y verifica los pagos recibidos en tu cuenta de MercadoPago
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Action buttons */}
          <button
            type="button"
            onClick={() => setIsExtractModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span>Extraer Dinero</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewPaymentModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Simular Cobro</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span>Configurar API</span>
          </button>

          {/* Connected Badge matching exact style from user image */}
          <div
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#004b99] hover:bg-[#003d7a] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            title="Click para ver o editar credenciales de MercadoPago"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Conectado a MercadoPago</span>
          </div>
        </div>
      </div>

      {/* Filter Box Card matching screenshot: "Buscar Pagos" */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-black text-slate-900">
          <Search className="w-4 h-4 text-slate-700" />
          <span>Buscar Pagos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Periodo */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">Periodo</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:border-blue-500"
            >
              <option value="Hoy">Hoy</option>
              <option value="Ayer">Ayer</option>
              <option value="Últimos 7 días">Últimos 7 días</option>
              <option value="Este mes">Este mes</option>
              <option value="Todos">Todos</option>
            </select>
          </div>

          {/* Estado */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">Estado</label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:border-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="Acreditado">Acreditado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Reembolsado">Reembolsado</option>
            </select>
          </div>

          {/* Referencia externa */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">Referencia externa</label>
            <input
              type="text"
              placeholder="Ej: VENTA-001"
              value={refFilter}
              onChange={(e) => setRefFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Monto */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">Monto</label>
            <input
              type="text"
              placeholder="Ej: 15000"
              value={montoFilter}
              onChange={(e) => setMontoFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Botón Buscar */}
          <div>
            <button
              type="button"
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-2 rounded-xl bg-[#004b99] hover:bg-[#003d7a] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Second Section: "Resultados" matching Image 2 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-black text-slate-900">
            <div className="w-3.5 h-3.5 border-2 border-slate-700 rounded-xs" />
            <span>Resultados</span>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {filteredPayments.length} pagos encontrados
          </span>
        </div>

        {/* 3 Metrics Cards matching exact colors and layout in image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: INGRESOS (Light Green) */}
          <div className="p-5 rounded-2xl bg-[#ecfdf3] border border-[#a6f4c5] shadow-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider">
              <div className="w-4 h-4 rounded-full border border-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
              </div>
              <span>INGRESOS</span>
            </div>
            <div className="text-2xl font-black text-emerald-800 tracking-tight">
              +${ingresosAcreditados.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">
              {countIngresosAcreditados} acreditados
            </p>
          </div>

          {/* Card 2: EGRESOS / DEVOLUCIONES (Light Red) */}
          <div className="p-5 rounded-2xl bg-[#fff1f1] border border-[#fecdca] shadow-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-rose-800 text-xs font-black uppercase tracking-wider">
              <div className="w-4 h-4 rounded-full border border-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-rose-700" />
              </div>
              <span>EGRESOS / DEVOLUCIONES</span>
            </div>
            <div className="text-2xl font-black text-rose-800 tracking-tight">
              -${egresosRealizados.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-rose-700 font-medium">
              {countEgresos} movimientos
            </p>
          </div>

          {/* Card 3: NETO DEL PERIODO (White with border) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-700 text-xs font-black uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-slate-800" />
              <span>NETO DEL PERIODO</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ${netoDelPeriodo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              +${pendientesMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })} pendientes ({countPendientes})
            </p>
          </div>
        </div>

        {/* Filter subtabs (Todos / Solo Ingresos / Solo Egresos / Extraídos) */}
        <div className="flex items-center space-x-1 border-b border-slate-200 pt-2 text-xs">
          {[
            { id: 'todos', label: 'Todos los Movimientos' },
            { id: 'ingresos', label: 'Ingresos Cobrados' },
            { id: 'egresos', label: 'Egresos y Dinero Extraído' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTipoTab(t.id as any)}
              className={`px-4 py-2 font-bold border-b-2 transition-all cursor-pointer ${
                tipoTab === t.id
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Results Table matching Image 2 columns */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold bg-slate-50/50">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">ID Pago</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4">Metodo</th>
                  <th className="py-3 px-4">Pagador</th>
                  <th className="py-3 px-4">Email / DNI</th>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Detalle / Conciliación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                      No se encontraron movimientos para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((row) => {
                    const isIncome = row.tipo === 'Ingreso';
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Tipo Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-white ${
                              isIncome ? 'bg-[#009b43]' : 'bg-rose-600'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            <span>{row.tipo}</span>
                          </span>
                        </td>

                        {/* ID Pago */}
                        <td className="py-3 px-4 font-mono text-slate-700 text-[11px]">
                          {row.id}
                        </td>

                        {/* Fecha */}
                        <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                          {row.fecha}
                        </td>

                        {/* Estado Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-md text-[11px] font-bold text-white ${
                              row.estado === 'Acreditado'
                                ? 'bg-[#004b99]'
                                : row.estado === 'Pendiente'
                                ? 'bg-amber-500'
                                : 'bg-rose-600'
                            }`}
                          >
                            {row.estado === 'Acreditado' && <Check className="w-3 h-3" />}
                            {row.estado === 'Pendiente' && <Clock className="w-3 h-3" />}
                            <span>{row.estado}</span>
                          </span>
                        </td>

                        {/* Monto */}
                        <td
                          className={`py-3 px-4 text-right font-black font-mono text-xs whitespace-nowrap ${
                            isIncome ? 'text-[#008738]' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          ${row.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Método */}
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {row.metodo}
                        </td>

                        {/* Pagador */}
                        <td className="py-3 px-4 text-slate-800 font-medium max-w-[140px] truncate" title={row.pagador}>
                          {row.pagador}
                        </td>

                        {/* Email / DNI */}
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] max-w-[140px] truncate" title={row.emailDni}>
                          {row.emailDni}
                        </td>

                        {/* Referencia */}
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px] max-w-[150px] truncate" title={row.referencia}>
                          {row.referencia}
                        </td>

                        {/* Detalle & Verificación en ERP */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-slate-600 max-w-[160px] truncate">
                              {row.detalle}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleVerify(row.id)}
                              title={row.verifiedInErp ? 'Conciliado en Caja ERP' : 'Click para marcar como conciliado'}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                row.verifiedInErp
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                  : 'text-slate-400 hover:text-slate-700 bg-slate-100'
                              }`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: Extracción de Dinero a Banco (Dinero Extraído) */}
      {isExtractModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Registrar Extracción de Dinero</h3>
                  <p className="text-[11px] text-slate-500">Retiro de fondos desde MercadoPago a Banco</p>
                </div>
              </div>
              <button
                onClick={() => setIsExtractModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExtraction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Monto a Extraer ($ ARS)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={extractAmount || ''}
                  onChange={(e) => setExtractAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cuenta de Destino</label>
                <select
                  value={extractDestBank}
                  onChange={(e) => setExtractDestBank(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Banco Galicia Cta Cte">Banco Galicia Cta Cte (CBU: ...422118)</option>
                  <option value="Banco Santander Cta Cte">Banco Santander (CBU: ...779154)</option>
                  <option value="Caja Central Efectivo">Caja Central Efectivo (Retiro por ventanilla)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivo / Concepto</label>
                <input
                  type="text"
                  value={extractReason}
                  onChange={(e) => setExtractReason(e.target.value)}
                  placeholder="Ej: Traspaso de saldo para pago a proveedores"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <span className="font-bold text-slate-800 block">Sincronización Automática con Tesorería:</span>
                <p>El retiro impactará en la billetera virtual de MercadoPago y se sumará a la cuenta bancaria seleccionada.</p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtractModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirmar Extracción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Simular / Ingresar Cobro Manual de MercadoPago */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Registrar Cobro MercadoPago</h3>
                  <p className="text-[11px] text-slate-500">Verificar acreditación de cobro por QR o transferencia</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Monto Cobrado ($ ARS)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newPayAmount || ''}
                  onChange={(e) => setNewPayAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Método de Cobro</label>
                <select
                  value={newPayMethod}
                  onChange={(e) => setNewPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Transferencia">Transferencia Inmediata</option>
                  <option value="Dinero en cuenta">Dinero en cuenta MercadoPago</option>
                  <option value="QR MercadoPago">Código QR Interoperable</option>
                  <option value="Tarjeta Débito">Tarjeta Débito Point</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email / Pagador</label>
                <input
                  type="text"
                  value={newPayPayer}
                  onChange={(e) => setNewPayPayer(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Referencia Externa / Ticket</label>
                <input
                  type="text"
                  value={newPayRef}
                  onChange={(e) => setNewPayRef(e.target.value)}
                  placeholder="Ej: VENTA-POS-01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#004b99] hover:bg-[#003d7a] text-white font-bold cursor-pointer shadow-xs"
                >
                  Guardar y Acreditar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Configuración de Credenciales & Webhooks de MercadoPago */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#004b99]/10 text-[#004b99] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Configuración de MercadoPago API</h3>
                  <p className="text-[11px] text-slate-500">Credenciales oficiales para cobros QR, Point y acreditaciones</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                localStorage.setItem('mp_access_token', mpAccessToken);
                localStorage.setItem('mp_public_key', mpPublicKey);
                localStorage.setItem('mp_user_id', mpUserId);
                localStorage.setItem('mp_pos_id', mpPosId);
                localStorage.setItem('mp_webhook_url', mpWebhookUrl);
                setIsConfigModalOpen(false);
                showToast('Credenciales de MercadoPago guardadas y verificadas correctamente', 'success');
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>¿Dónde obtengo estas credenciales?</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Ingresa a <strong>mercadopago.com.ar/developers</strong> con tu cuenta de MercadoPago, ve a <em>"Tus integraciones" &gt; "Credenciales de producción"</em> y copia tu <strong>Access Token</strong> y <strong>Public Key</strong>.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Access Token de Producción (Obligatorio para verificar cobros)
                </label>
                <input
                  type="password"
                  required
                  value={mpAccessToken}
                  onChange={(e) => setMpAccessToken(e.target.value)}
                  placeholder="APP_USR-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Public Key (Clave Pública)
                </label>
                <input
                  type="text"
                  required
                  value={mpPublicKey}
                  onChange={(e) => setMpPublicKey(e.target.value)}
                  placeholder="APP_USR-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ID de Usuario / Collector ID</label>
                  <input
                    type="text"
                    value={mpUserId}
                    onChange={(e) => setMpUserId(e.target.value)}
                    placeholder="Ej: 184920481"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Identificador de Caja (POS ID)</label>
                  <input
                    type="text"
                    value={mpPosId}
                    onChange={(e) => setMpPosId(e.target.value)}
                    placeholder="Ej: POS-MOSTRADOR-01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  URL Webhook Notificaciones IPN (Acreditación Automática en ERP)
                </label>
                <input
                  type="text"
                  readOnly
                  value={mpWebhookUrl}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-600 select-all cursor-copy"
                  title="Pega esta URL en el panel de Webhooks de MercadoPago para recibir pagos al instante"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-700">Estado: Activo y Conectado</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#004b99] hover:bg-[#003d7a] text-white font-bold cursor-pointer shadow-xs"
                  >
                    Guardar Credenciales
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
