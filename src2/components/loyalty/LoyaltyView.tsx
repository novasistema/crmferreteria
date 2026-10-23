import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LoyaltyReward,
  Client,
  LoyaltyBonusRule,
  LoyaltySurvey,
  LoyaltyBranch,
  LoyaltyRaffle,
  LoyaltyConfig,
} from '../../types';
import {
  Award,
  Gift,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Users,
  Star,
  TrendingUp,
  Sliders,
  Calendar,
  HelpCircle,
  Dices,
  Building2,
  Settings,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Tag,
  ShieldAlert,
  Edit3,
} from 'lucide-react';

type LoyaltyTab =
  | 'resumen'
  | 'clientes'
  | 'premios'
  | 'cargar_puntos'
  | 'bonificaciones'
  | 'encuestas'
  | 'sorteos'
  | 'sucursales'
  | 'configuracion';

export const LoyaltyView: React.FC = () => {
  const { store, currentUser, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<LoyaltyTab>('resumen');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Resumen - Validar Canje
  const [validateCode, setValidateCode] = useState('');
  const [validationResult, setValidationResult] = useState<{
    status: 'success' | 'error' | 'already_delivered';
    message: string;
    rewardTitle?: string;
    clientName?: string;
    pointsSpent?: number;
    date?: string;
  } | null>(null);

  // 3. Premios - Form State
  const [newReward, setNewReward] = useState({
    title: '',
    category: 'General',
    pointsCost: 500,
    stock: 10,
    imageUrl: '',
    referencePrice: '',
    description: '',
    terms: '',
  });

  // 4. Cargar Puntos - Form State
  const [chargeClientId, setChargeClientId] = useState('');
  const [chargePurchaseAmount, setChargePurchaseAmount] = useState('');
  const [chargeManualPoints, setChargeManualPoints] = useState('');
  const [chargeJustification, setChargeJustification] = useState('');

  // 5. Bonificaciones - Form State
  const [newBonusRule, setNewBonusRule] = useState({
    name: '',
    multiplier: 2,
    extraPoints: 0,
    minPurchaseAmount: 10000,
    daysOfWeek: '6', // 6=Sábado
  });

  // 6. Encuestas - Form State
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    points: 50,
    type: 'stars' as 'stars' | 'multiple_choice' | 'text',
    question: '',
    options: '',
  });

  // 7. Sorteos - Form State
  const [newRaffle, setNewRaffle] = useState({
    title: '',
    pointsPerEntry: 100,
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  // 8. Sucursales - Form State
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    city: 'ALEJANDRO ROCA, CORDOBA',
    phone: '03584354998',
    schedule: 'de 8 a 12:30 y de 15:30 a 19:30',
    isMain: false,
  });

  // 9. Configuración - State
  const [configState, setConfigState] = useState<LoyaltyConfig>(
    store.loyaltyConfig || {
      programActive: true,
      programName: 'Programa de Puntos',
      pointsPerPeso: 0.01,
      pointValuePesos: 1.0,
      welcomePoints: 100,
      whatsapp: '3585162098',
      email: 'bruzzoneferreteria@gmail.com',
      primaryColor: '#ff6721',
      instagram: '@ferreteria_bruzzone_alejandro',
      facebook: 'https://facebook.com/ferreteriabruzzone',
      website: 'ferreteriabruzzone.com.ar',
      address: 'Dr. Carlos Rocha 128',
      popupActive: true,
      popupTitle: 'Bienvenido!',
      popupButtonText: 'Ver premios',
      popupImageUrl: '',
      popupButtonLink: '',
      popupMessage: 'AHORA TUS COMPRAS TE REGALAN PUNTOS!',
    }
  );

  // Reset Modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Filtered Clients (all active clients)
  const allClients = store.clients.filter((c) => c.active);
  const eligibleClients = allClients.filter((c) => !c.hasCurrentAccount && c.loyaltyEligible);
  const totalCirculatingPoints = allClients.reduce((acc, c) => acc + (c.loyaltyPoints || 0), 0);
  const totalRedemptionsCount = store.loyaltyRedemptions.filter((r) => r.status === 'delivered').length;

  const validSales = store.sales.filter((s) => s.status === 'completed');
  const avgTicket =
    validSales.length > 0
      ? validSales.reduce((acc, s) => acc + s.total, 0) / validSales.length
      : 59683.55;

  const filteredClients = allClients.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.taxId && c.taxId.includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  // Action Handlers
  const handleValidateRedemption = () => {
    if (!validateCode.trim()) {
      showToast('Ingresá el código de canje para validar', 'warning');
      return;
    }
    const res = store.validateAndDeliverRedemption(validateCode.trim(), currentUser.id);
    if (res.success && res.redemption) {
      setValidationResult({
        status: 'success',
        message: res.message,
        rewardTitle: res.redemption.rewardTitle,
        clientName: res.redemption.clientName,
        pointsSpent: res.redemption.pointsSpent,
        date: res.redemption.date,
      });
      showToast(res.message, 'success');
      setValidateCode('');
    } else {
      setValidationResult({
        status: 'error',
        message: res.message,
      });
      showToast(res.message, 'error');
    }
  };

  const handleToggleClientEligibility = (client: Client) => {
    if (client.hasCurrentAccount) {
      showToast('Los clientes con Cuenta Corriente quedan siempre excluidos del programa de puntos.', 'warning');
      return;
    }
    const updated: Client = {
      ...client,
      loyaltyEligible: !client.loyaltyEligible,
    };
    store.saveClient(updated);
    showToast(
      `${client.name} ${updated.loyaltyEligible ? 'ahora participa' : 'ya no participa'} del programa de fidelización.`,
      'info'
    );
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReward.title.trim()) {
      showToast('Ingresá el nombre del premio', 'warning');
      return;
    }
    if (newReward.pointsCost <= 0) {
      showToast('El costo en puntos debe ser mayor a 0', 'warning');
      return;
    }

    const reward: LoyaltyReward = {
      id: `rew-${Date.now()}`,
      title: newReward.title.trim(),
      name: newReward.title.trim(),
      category: newReward.category || 'General',
      pointsCost: Number(newReward.pointsCost),
      pointsRequired: Number(newReward.pointsCost),
      stock: Number(newReward.stock) || 1,
      stockAvailable: Number(newReward.stock) || 1,
      imageUrl: newReward.imageUrl.trim() || undefined,
      referencePrice: newReward.referencePrice ? Number(newReward.referencePrice) : undefined,
      description: newReward.description.trim(),
      terms: newReward.terms.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };

    store.saveLoyaltyReward(reward);
    showToast(`Premio "${reward.title}" agregado al catálogo con éxito`, 'success');
    setNewReward({
      title: '',
      category: 'General',
      pointsCost: 500,
      stock: 10,
      imageUrl: '',
      referencePrice: '',
      description: '',
      terms: '',
    });
  };

  const handleDeleteReward = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el premio "${name}"?`)) {
      store.deleteLoyaltyReward(id);
      showToast(`Premio "${name}" eliminado`, 'info');
    }
  };

  const handleChargePointsByPurchase = () => {
    if (!chargeClientId) {
      showToast('Seleccioná un cliente', 'warning');
      return;
    }
    const amount = Number(chargePurchaseAmount);
    if (!amount || amount <= 0) {
      showToast('Ingresá un monto de compra válido', 'warning');
      return;
    }

    const client = store.clients.find((c) => c.id === chargeClientId);
    if (!client) return;

    if (client.hasCurrentAccount || !client.loyaltyEligible) {
      showToast('Este cliente está excluido del programa de fidelización', 'error');
      return;
    }

    // Calculation based on pointsPerPeso
    const rate = store.loyaltyConfig?.pointsPerPeso || 0.01;
    const pointsCalculated = Math.floor(amount * rate);

    if (pointsCalculated <= 0) {
      showToast(`El monto de $${amount.toLocaleString('es-AR')} genera 0 puntos según la tasa actual.`, 'warning');
      return;
    }

    store.addLoyaltyPoints(
      client.id,
      pointsCalculated,
      `Carga por compra en mostrador de $${amount.toLocaleString('es-AR')}`,
      'sale',
      undefined,
      currentUser.id
    );

    showToast(`Se acreditaron ${pointsCalculated} puntos a ${client.name}`, 'success');
    setChargePurchaseAmount('');
    setChargeClientId('');
  };

  const handleChargeManualPoints = () => {
    if (!chargeClientId) {
      showToast('Seleccioná un cliente', 'warning');
      return;
    }
    const points = Number(chargeManualPoints);
    if (!points || points === 0) {
      showToast('Ingresá una cantidad de puntos (+ o -)', 'warning');
      return;
    }
    if (!chargeJustification.trim()) {
      showToast('Ingresá la justificación del ajuste manual', 'warning');
      return;
    }

    const client = store.clients.find((c) => c.id === chargeClientId);
    if (!client) return;

    if (client.hasCurrentAccount || !client.loyaltyEligible) {
      showToast('Este cliente está excluido del programa de fidelización', 'error');
      return;
    }

    store.addLoyaltyPoints(
      client.id,
      points,
      `Ajuste manual: ${chargeJustification.trim()}`,
      'manual',
      undefined,
      currentUser.id
    );

    showToast(`Ajuste de ${points > 0 ? '+' : ''}${points} puntos aplicado a ${client.name}`, 'success');
    setChargeManualPoints('');
    setChargeJustification('');
    setChargeClientId('');
  };

  const handleAddBonusRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBonusRule.name.trim()) {
      showToast('Ingresá el nombre de la regla de bonificación', 'warning');
      return;
    }
    const rule: LoyaltyBonusRule = {
      id: `rule-${Date.now()}`,
      name: newBonusRule.name.trim(),
      multiplier: Number(newBonusRule.multiplier) || 1,
      extraPoints: Number(newBonusRule.extraPoints) || 0,
      minPurchaseAmount: Number(newBonusRule.minPurchaseAmount) || 0,
      daysOfWeek: newBonusRule.daysOfWeek.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };
    store.saveLoyaltyBonusRule(rule);
    showToast(`Regla de bonificación "${rule.name}" creada`, 'success');
    setNewBonusRule({
      name: '',
      multiplier: 2,
      extraPoints: 0,
      minPurchaseAmount: 10000,
      daysOfWeek: '6',
    });
  };

  const handleDeleteBonusRule = (id: string) => {
    store.deleteLoyaltyBonusRule(id);
    showToast('Regla de bonificación eliminada', 'info');
  };

  const handleAddSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurvey.title.trim() || !newSurvey.question.trim()) {
      showToast('Completá el título y la pregunta de la encuesta', 'warning');
      return;
    }
    const survey: LoyaltySurvey = {
      id: `surv-${Date.now()}`,
      title: newSurvey.title.trim(),
      points: Number(newSurvey.points) || 50,
      type: newSurvey.type,
      question: newSurvey.question.trim(),
      options: newSurvey.options
        ? newSurvey.options
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined,
      active: true,
      responsesCount: 0,
      createdAt: new Date().toISOString(),
    };
    store.saveLoyaltySurvey(survey);
    showToast(`Encuesta "${survey.title}" creada con premio de ${survey.points} pts`, 'success');
    setNewSurvey({
      title: '',
      points: 50,
      type: 'stars',
      question: '',
      options: '',
    });
  };

  const handleDeleteSurvey = (id: string) => {
    store.deleteLoyaltySurvey(id);
    showToast('Encuesta eliminada', 'info');
  };

  const handleAddRaffle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaffle.title.trim()) {
      showToast('Ingresá el título del sorteo', 'warning');
      return;
    }
    const raffle: LoyaltyRaffle = {
      id: `raf-${Date.now()}`,
      title: newRaffle.title.trim(),
      description: newRaffle.description.trim(),
      prizeDescription: newRaffle.title.trim(),
      pointsPerEntry: Number(newRaffle.pointsPerEntry) || 100,
      startDate: newRaffle.startDate || undefined,
      endDate: newRaffle.endDate || undefined,
      status: 'open',
      totalEntries: 0,
      participantsCount: 0,
      createdAt: new Date().toISOString(),
    };
    store.saveLoyaltyRaffle(raffle);
    showToast(`Sorteo "${raffle.title}" creado exitosamente`, 'success');
    setNewRaffle({
      title: '',
      pointsPerEntry: 100,
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
  };

  const handleDrawRaffle = (raffleId: string) => {
    const res = store.drawLoyaltyRaffle(raffleId);
    if (res) {
      showToast(`🎉 ¡Sorteo realizado! Ganador: ${res.winnerClientName}`, 'success');
    } else {
      showToast('No se pudo sortear. No hay clientes participantes elegibles.', 'warning');
    }
  };

  const handleDeleteRaffle = (id: string) => {
    store.deleteLoyaltyRaffle(id);
    showToast('Sorteo eliminado', 'info');
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim() || !newBranch.address.trim()) {
      showToast('Completá nombre y dirección de la sucursal', 'warning');
      return;
    }
    const branch: LoyaltyBranch = {
      id: `br-${Date.now()}`,
      name: newBranch.name.trim(),
      address: newBranch.address.trim(),
      city: newBranch.city.trim(),
      phone: newBranch.phone.trim(),
      schedule: newBranch.schedule.trim(),
      isMain: newBranch.isMain,
      active: true,
    };
    store.saveLoyaltyBranch(branch);
    showToast(`Sucursal "${branch.name}" guardada`, 'success');
    setNewBranch({
      name: '',
      address: '',
      city: 'ALEJANDRO ROCA, CORDOBA',
      phone: '03584354998',
      schedule: 'de 8 a 12:30 y de 15:30 a 19:30',
      isMain: false,
    });
  };

  const handleDeleteBranch = (id: string) => {
    store.deleteLoyaltyBranch(id);
    showToast('Sucursal eliminada', 'info');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveLoyaltyConfig(configState);
    showToast('Configuración del programa guardada exitosamente', 'success');
  };

  const handleResetPoints = () => {
    store.resetAllLoyaltyPoints();
    setIsResetConfirmOpen(false);
    showToast('Se han reiniciado los puntos de todos los clientes a cero', 'info');
  };

  return (
    <div id="loyalty-view-root" className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 text-slate-800">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Header */}
        <div id="loyalty-header-card" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-600 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Centro de fidelización</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Programa de Fidelización</h1>
            <p className="text-sm text-slate-500 mt-0.5">Puntos, premios y beneficios en un solo lugar.</p>
          </div>

          <div className="flex items-center space-x-3">
            <span
              id="loyalty-status-badge"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                configState.programActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${configState.programActive ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
              {configState.programActive ? '⚡ Programa activo' : 'Programa inactivo'}
            </span>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div id="loyalty-kpis-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Clientes activos */}
          <div id="kpi-active-clients" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clientes activos</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{eligibleClients.length}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Puntos en circulación */}
          <div id="kpi-circulating-points" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Puntos en circulación</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalCirculatingPoints.toLocaleString('es-AR')}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
          </div>

          {/* Card 3: Canjes realizados */}
          <div id="kpi-total-redemptions" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Canjes realizados</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalRedemptionsCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Ticket promedio */}
          <div id="kpi-avg-ticket" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ticket promedio</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                ${avgTicket.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 9 Tabs Bar */}
        <div id="loyalty-tabs-bar" className="bg-white rounded-xl p-1.5 border border-slate-200/80 shadow-xs flex flex-wrap gap-1">
          {[
            { key: 'resumen', label: 'Resumen' },
            { key: 'clientes', label: 'Clientes' },
            { key: 'premios', label: 'Premios' },
            { key: 'cargar_puntos', label: 'Cargar puntos' },
            { key: 'bonificaciones', label: 'Bonificaciones' },
            { key: 'encuestas', label: 'Encuestas' },
            { key: 'sorteos', label: 'Sorteos' },
            { key: 'sucursales', label: 'Sucursales' },
            { key: 'configuracion', label: 'Configuración' },
          ].map((tab) => (
            <button
              key={tab.key}
              id={`tab-btn-${tab.key}`}
              onClick={() => setActiveTab(tab.key as LoyaltyTab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: RESUMEN */}
        {activeTab === 'resumen' && (
          <div id="tab-content-resumen" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Niveles de fidelidad */}
            <div id="card-loyalty-tiers" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-1">
                <span className="text-amber-500">⚡</span>
                <h3>Niveles de fidelidad</h3>
              </div>
              <p className="text-xs text-slate-500 mb-5">El nivel se calcula sobre el saldo de puntos.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bronce */}
                <div id="tier-card-bronce" className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-sm">Bronce</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">1.00x</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Desde 0 puntos</p>
                  <p className="text-xs text-slate-400 mt-1">Acceso al programa</p>
                </div>

                {/* Plata */}
                <div id="tier-card-plata" className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-sm">Plata</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">1.20x</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Desde 1.000 puntos</p>
                  <p className="text-xs text-slate-400 mt-1">1,2x puntos</p>
                </div>

                {/* Oro */}
                <div id="tier-card-oro" className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-sm">Oro</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">1.50x</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Desde 3.000 puntos</p>
                  <p className="text-xs text-slate-400 mt-1">1,5x puntos</p>
                </div>

                {/* Platino */}
                <div id="tier-card-platino" className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-sm">Platino</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">2.00x</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Desde 6.000 puntos</p>
                  <p className="text-xs text-slate-400 mt-1">2x puntos</p>
                </div>
              </div>
            </div>

            {/* Right: Validar canje en mostrador */}
            <div id="card-validate-counter" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <h3>Validar canje en mostrador</h3>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Ingresá el código CANJE-XXXXX para marcar el premio como entregado.
                </p>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      id="input-validate-code"
                      type="text"
                      placeholder="CANJE-XXXXXXXX"
                      value={validateCode}
                      onChange={(e) => setValidateCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateRedemption()}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase tracking-wider focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      id="btn-validate-code"
                      onClick={handleValidateRedemption}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Validar</span>
                    </button>
                  </div>

                  {validationResult && (
                    <div
                      id="validation-feedback-box"
                      className={`p-4 rounded-xl text-xs border ${
                        validationResult.status === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <div className="font-bold flex items-center space-x-1.5">
                        {validationResult.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{validationResult.message}</span>
                      </div>
                      {validationResult.status === 'success' && (
                        <div className="mt-2 text-emerald-700 space-y-0.5">
                          <p>• Socio: <strong>{validationResult.clientName}</strong></p>
                          <p>• Premio: <strong>{validationResult.rewardTitle}</strong></p>
                          <p>• Puntos descontados: <strong>{validationResult.pointsSpent} pts</strong></p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Info footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Total de canjes emitidos: {store.loyaltyRedemptions.length}</span>
                <span>Entregados: {totalRedemptionsCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENTES */}
        {activeTab === 'clientes' && (
          <div id="tab-content-clientes" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Clientes del programa</h3>
                <p className="text-xs text-slate-500">
                  Elegí quién participa. La cuenta corriente siempre queda excluida, aunque se active manualmente.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-clients"
                  type="text"
                  placeholder="Buscar cliente, DNI o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table id="table-loyalty-clients" className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4 text-center">Participa</th>
                    <th className="py-3 px-4 text-right">Puntos</th>
                    <th className="py-3 px-4 text-right">Acumulados</th>
                    <th className="py-3 px-4 text-center">Nivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No se encontraron clientes para mostrar.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const isExcludedCC = client.hasCurrentAccount;
                      const isParticipating = !isExcludedCC && client.loyaltyEligible;

                      return (
                        <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{client.name}</div>
                            <div className="text-[11px] text-slate-400">
                              CUIT/DNI: {client.taxId || 'Consumidor Final'}
                              {isExcludedCC && (
                                <span className="ml-2 text-rose-500 font-semibold">(Cuenta Corriente)</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-600">{client.phone || '-'}</div>
                            <div className="text-[11px] text-slate-400">{client.city || client.address || '-'}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isParticipating}
                                disabled={isExcludedCC}
                                onChange={() => handleToggleClientEligibility(client)}
                                className="sr-only peer"
                              />
                              <div
                                className={`w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                                  isExcludedCC
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'peer-checked:bg-blue-600 cursor-pointer'
                                }`}
                              />
                            </label>
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                            {isParticipating ? (client.loyaltyPoints || 0).toLocaleString('es-AR') : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 font-semibold">
                            {isParticipating
                              ? (client.loyaltyLifetimePoints || client.loyaltyPoints || 0).toLocaleString('es-AR')
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isParticipating ? (
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  client.loyaltyTier === 'Platino'
                                    ? 'bg-purple-100 text-purple-700'
                                    : client.loyaltyTier === 'Oro'
                                    ? 'bg-amber-100 text-amber-700'
                                    : client.loyaltyTier === 'Plata'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}
                              >
                                {client.loyaltyTier || 'Bronce'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Excluido</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PREMIOS */}
        {activeTab === 'premios' && (
          <div id="tab-content-premios" className="space-y-6">
            {/* New Reward Form Card */}
            <div id="card-add-reward" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-1">
                  <span>🎁</span>
                  <h3>Catálogo de premios</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Cargá lo que un cliente puede canjear con sus puntos. Por ejemplo: "Descuento de $5.000", "Set de mechas" o "Mate".
                </p>
              </div>

              {/* Info Alert Box */}
              <div className="p-3.5 bg-blue-50 border border-blue-200/70 rounded-xl flex items-start space-x-2.5 text-xs text-blue-800">
                <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p>
                  <strong>¿Cómo funciona?</strong> El cliente ve este premio en su portal, usa sus puntos para canjearlo y recibe un código para presentarlo en el mostrador.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleAddReward} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Nombre */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del premio *</label>
                    <input
                      id="input-reward-title"
                      type="text"
                      placeholder="Ej: Descuento de $5.000"
                      value={newReward.title}
                      onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Es el nombre que verá el cliente.</span>
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                    <input
                      id="input-reward-category"
                      type="text"
                      placeholder="General"
                      value={newReward.category}
                      onChange={(e) => setNewReward({ ...newReward, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">"General" está bien si no necesitás agruparlo.</span>
                  </div>

                  {/* Costo en puntos */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Costo en puntos *</label>
                    <input
                      id="input-reward-points"
                      type="number"
                      placeholder="100"
                      value={newReward.pointsCost}
                      onChange={(e) => setNewReward({ ...newReward, pointsCost: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Puntos descontados al canjearlo.</span>
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stock disponible *</label>
                    <input
                      id="input-reward-stock"
                      type="number"
                      placeholder="1"
                      value={newReward.stock}
                      onChange={(e) => setNewReward({ ...newReward, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Unidades que podés entregar.</span>
                  </div>

                  {/* URL Imagen */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL de imagen (opcional)</label>
                    <input
                      id="input-reward-image"
                      type="url"
                      placeholder="https://..."
                      value={newReward.imageUrl}
                      onChange={(e) => setNewReward({ ...newReward, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Si la dejás vacía, se muestra icono genérico.</span>
                  </div>

                  {/* Precio original */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Precio original (opcional)</label>
                    <input
                      id="input-reward-price"
                      type="number"
                      placeholder="Ej: 5000"
                      value={newReward.referencePrice}
                      onChange={(e) => setNewReward({ ...newReward, referencePrice: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Valor de referencia; no se cobra.</span>
                  </div>
                </div>

                {/* Textareas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                    <textarea
                      id="input-reward-desc"
                      rows={2}
                      placeholder="Ej: Válido para compras superiores a $20.000."
                      value={newReward.description}
                      onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Condiciones de uso (opcional)</label>
                    <textarea
                      id="input-reward-terms"
                      rows={2}
                      placeholder="Ej: Un cupón por cliente. No acumulable con otras promociones."
                      value={newReward.terms}
                      onChange={(e) => setNewReward({ ...newReward, terms: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <button
                    id="btn-add-reward-submit"
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    + Agregar premio
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Rewards Cards Grid */}
            <div id="grid-rewards-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.loyaltyRewards.map((reward) => (
                <div
                  key={reward.id}
                  id={`reward-card-${reward.id}`}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {reward.imageUrl && (
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                        <img
                          src={reward.imageUrl}
                          alt={reward.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{reward.name || reward.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {reward.category} • {reward.stock} disponibles
                        </p>
                      </div>
                      <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap">
                        {reward.pointsCost} pts
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{reward.description}</p>
                    {reward.terms && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-1">Condición: {reward.terms}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      id={`btn-delete-reward-${reward.id}`}
                      onClick={() => handleDeleteReward(reward.id, reward.title)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CARGAR PUNTOS */}
        {activeTab === 'cargar_puntos' && (
          <div id="tab-content-cargar-puntos" className="space-y-6">
            <div id="card-charge-points" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div>
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-1">
                  <span>📋</span>
                  <h3>Cargador rápido de puntos</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Calculá puntos por compra o hacé un ajuste justificado. Los clientes excluidos no pueden recibir puntos.
                </p>
              </div>

              <div className="space-y-4 max-w-2xl">
                {/* Select Client */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seleccionar cliente *</label>
                  <select
                    id="select-charge-client"
                    value={chargeClientId}
                    onChange={(e) => setChargeClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Seleccionar cliente participante --</option>
                    {eligibleClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.loyaltyPoints || 0} pts - {c.loyaltyTier || 'Bronce'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2 Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Purchase Amount */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">Monto de compra ($)</label>
                    <input
                      id="input-charge-purchase-amount"
                      type="number"
                      placeholder="Ej: 25000"
                      value={chargePurchaseAmount}
                      onChange={(e) => setChargePurchaseAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none font-semibold"
                    />
                    <div className="text-[11px] text-slate-500">
                      Puntos estimados:{' '}
                      <strong className="text-blue-600">
                        {Math.floor(Number(chargePurchaseAmount || 0) * (store.loyaltyConfig?.pointsPerPeso || 0.01))} pts
                      </strong>
                    </div>
                    <button
                      id="btn-charge-by-purchase"
                      type="button"
                      onClick={handleChargePointsByPurchase}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      ⚡ Cargar por compra
                    </button>
                  </div>

                  {/* Manual Points Adjustment */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">Puntos manuales (+/-)</label>
                    <input
                      id="input-charge-manual-points"
                      type="number"
                      placeholder="Ej: 150 o -50"
                      value={chargeManualPoints}
                      onChange={(e) => setChargeManualPoints(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none font-semibold"
                    />
                    <input
                      id="input-charge-justification"
                      type="text"
                      placeholder="Justificación del ajuste manual..."
                      value={chargeJustification}
                      onChange={(e) => setChargeJustification(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      id="btn-charge-manual"
                      type="button"
                      onClick={handleChargeManualPoints}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      Aplicar ajuste manual
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Point Transactions Feed */}
            <div id="card-recent-transactions" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Historial reciente de movimientos de puntos</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Fecha</th>
                      <th className="py-2.5 px-4">Cliente</th>
                      <th className="py-2.5 px-4">Concepto / Motivo</th>
                      <th className="py-2.5 px-4 text-right">Puntos</th>
                      <th className="py-2.5 px-4 text-right">Saldo Posterior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {store.loyaltyTransactions.slice(0, 10).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{tx.clientName}</td>
                        <td className="py-2.5 px-4 text-slate-600">{tx.description}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-bold ${
                            tx.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                          {tx.balanceAfter.toLocaleString('es-AR')} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BONIFICACIONES */}
        {activeTab === 'bonificaciones' && (
          <div id="tab-content-bonificaciones" className="space-y-6">
            <div id="card-bonus-rules" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reglas de bonificación</h3>
                <p className="text-xs text-slate-500">Multiplicadores y puntos extra para días o montos especiales.</p>
              </div>

              <form onSubmit={handleAddBonusRule} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la regla *</label>
                    <input
                      id="input-bonus-name"
                      type="text"
                      placeholder="Ej: Super Sábado 2x"
                      value={newBonusRule.name}
                      onChange={(e) => setNewBonusRule({ ...newBonusRule, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Multiplicador</label>
                    <input
                      id="input-bonus-mult"
                      type="number"
                      step="0.1"
                      value={newBonusRule.multiplier}
                      onChange={(e) => setNewBonusRule({ ...newBonusRule, multiplier: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Puntos fijos extra</label>
                    <input
                      id="input-bonus-extra"
                      type="number"
                      value={newBonusRule.extraPoints}
                      onChange={(e) => setNewBonusRule({ ...newBonusRule, extraPoints: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Monto mín. ($)</label>
                    <input
                      id="input-bonus-min"
                      type="number"
                      value={newBonusRule.minPurchaseAmount}
                      onChange={(e) => setNewBonusRule({ ...newBonusRule, minPurchaseAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Días (0=domingo, separados por coma ej: 0,6)
                  </label>
                  <input
                    id="input-bonus-days"
                    type="text"
                    placeholder="6"
                    value={newBonusRule.daysOfWeek}
                    onChange={(e) => setNewBonusRule({ ...newBonusRule, daysOfWeek: e.target.value })}
                    className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <button
                    id="btn-add-bonus-rule"
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    + Crear regla
                  </button>
                </div>
              </form>
            </div>

            {/* List of Bonus Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {store.loyaltyBonusRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{rule.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Multiplicador: <strong>{rule.multiplier}x</strong> • Puntos extra: <strong>+{rule.extraPoints}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Monto mínimo: ${rule.minPurchaseAmount.toLocaleString('es-AR')} {rule.daysOfWeek ? `• Días: ${rule.daysOfWeek}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBonusRule(rule.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ENCUESTAS */}
        {activeTab === 'encuestas' && (
          <div id="tab-content-encuestas" className="space-y-6">
            <div id="card-surveys" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Encuestas con premio</h3>
                <p className="text-xs text-slate-500">Creá una pregunta y recompensá las respuestas.</p>
              </div>

              <form onSubmit={handleAddSurvey} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Título *</label>
                    <input
                      id="input-survey-title"
                      type="text"
                      placeholder="Ej: Atención"
                      value={newSurvey.title}
                      onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Puntos de recompensa</label>
                    <input
                      id="input-survey-points"
                      type="number"
                      value={newSurvey.points}
                      onChange={(e) => setNewSurvey({ ...newSurvey, points: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de respuesta</label>
                    <select
                      id="select-survey-type"
                      value={newSurvey.type}
                      onChange={(e) =>
                        setNewSurvey({
                          ...newSurvey,
                          type: e.target.value as 'stars' | 'multiple_choice' | 'text',
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none font-semibold"
                    >
                      <option value="stars">Estrellas (1 a 5)</option>
                      <option value="multiple_choice">Opción múltiple</option>
                      <option value="text">Texto libre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pregunta *</label>
                  <textarea
                    id="input-survey-question"
                    rows={2}
                    placeholder="Ej: ¿Cómo calificarías la rapidez y cordialidad de la atención en el mostrador?"
                    value={newSurvey.question}
                    onChange={(e) => setNewSurvey({ ...newSurvey, question: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {newSurvey.type === 'multiple_choice' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Opciones separadas por coma
                    </label>
                    <input
                      type="text"
                      placeholder="Excelente, Muy Buena, Regular, Mala"
                      value={newSurvey.options}
                      onChange={(e) => setNewSurvey({ ...newSurvey, options: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <button
                    id="btn-add-survey-submit"
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    + Crear encuesta
                  </button>
                </div>
              </form>
            </div>

            {/* Surveys List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.loyaltySurveys.map((survey) => (
                <div key={survey.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{survey.title}</h4>
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-xs font-extrabold">
                        {survey.points} puntos
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{survey.question}</p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Tipo: {survey.type === 'stars' ? 'Estrellas ⭐' : survey.type} • {survey.responsesCount} respuestas
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleDeleteSurvey(survey.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SORTEOS */}
        {activeTab === 'sorteos' && (
          <div id="tab-content-sorteos" className="space-y-6">
            <div id="card-raffles" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sorteos ponderados</h3>
                <p className="text-xs text-slate-500">Cada entrada cuesta puntos y aumenta la posibilidad de ganar.</p>
              </div>

              <form onSubmit={handleAddRaffle} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Título del sorteo *</label>
                    <input
                      id="input-raffle-title"
                      type="text"
                      placeholder="Ej: Sorteo Combo Taladro + Amoladora"
                      value={newRaffle.title}
                      onChange={(e) => setNewRaffle({ ...newRaffle, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Puntos por entrada</label>
                    <input
                      id="input-raffle-cost"
                      type="number"
                      value={newRaffle.pointsPerEntry}
                      onChange={(e) => setNewRaffle({ ...newRaffle, pointsPerEntry: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha fin</label>
                    <input
                      id="input-raffle-end-date"
                      type="date"
                      value={newRaffle.endDate}
                      onChange={(e) => setNewRaffle({ ...newRaffle, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del premio</label>
                  <textarea
                    id="input-raffle-desc"
                    rows={2}
                    placeholder="Detalles del kit de herramientas a sortear..."
                    value={newRaffle.description}
                    onChange={(e) => setNewRaffle({ ...newRaffle, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <button
                    id="btn-add-raffle-submit"
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    + Crear sorteo
                  </button>
                </div>
              </form>
            </div>

            {/* Raffles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {store.loyaltyRaffles.map((raffle) => (
                <div key={raffle.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-sm">{raffle.title}</h4>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                          raffle.status === 'open'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {raffle.status === 'open' ? 'Abierto' : 'Sorteado'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{raffle.description}</p>
                    <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                      <p>• Costo: <strong>{raffle.pointsPerEntry} pts</strong> por cupón</p>
                      <p>• Cupones emitidos: <strong>{raffle.totalEntries}</strong></p>
                      {raffle.winnerClientName && (
                        <p className="text-emerald-600 font-bold">
                          🏆 Ganador: {raffle.winnerClientName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {raffle.status === 'open' ? (
                      <button
                        onClick={() => handleDrawRaffle(raffle.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center space-x-1"
                      >
                        <Dices className="w-3.5 h-3.5" />
                        <span>Sortear ganador</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sorteo finalizado</span>
                    )}

                    <button
                      onClick={() => handleDeleteRaffle(raffle.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: SUCURSALES */}
        {activeTab === 'sucursales' && (
          <div id="tab-content-sucursales" className="space-y-6">
            <div id="card-branches" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-1">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3>Sucursales del portal</h3>
                </div>
                <p className="text-xs text-slate-500">Mostrá dirección, horarios y contacto a tus clientes.</p>
              </div>

              <form onSubmit={handleAddBranch} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
                    <input
                      id="input-branch-name"
                      type="text"
                      placeholder="Ej: Ferretería Bruzzone"
                      value={newBranch.name}
                      onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dirección *</label>
                    <input
                      id="input-branch-address"
                      type="text"
                      placeholder="Ej: Doctor Carlos L Rocha 128"
                      value={newBranch.address}
                      onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad</label>
                    <input
                      id="input-branch-city"
                      type="text"
                      placeholder="ALEJANDRO ROCA, CORDOBA"
                      value={newBranch.city}
                      onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                    <input
                      id="input-branch-phone"
                      type="text"
                      placeholder="03584354998"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Horarios de atención</label>
                    <input
                      id="input-branch-schedule"
                      type="text"
                      placeholder="de 8 a 12:30 y de 15:30 a 19:30"
                      value={newBranch.schedule}
                      onChange={(e) => setNewBranch({ ...newBranch, schedule: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-3 pt-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newBranch.isMain}
                        onChange={(e) => setNewBranch({ ...newBranch, isMain: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                    <span className="text-xs font-bold text-slate-700">Sucursal principal</span>
                  </div>
                </div>

                <div>
                  <button
                    id="btn-add-branch-submit"
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    + Agregar sucursal
                  </button>
                </div>
              </form>
            </div>

            {/* Branches List Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {store.loyaltyBranches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{branch.name}</h4>
                      {branch.isMain && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {branch.address}, {branch.city}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {branch.schedule} • {branch.phone}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: CONFIGURACIÓN */}
        {activeTab === 'configuracion' && (
          <div id="tab-content-configuracion" className="space-y-6">
            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* General Settings */}
              <div id="card-general-config" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div>
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-1">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <h3>Configuración general</h3>
                  </div>
                  <p className="text-xs text-slate-500">Personalizá el programa, la marca y el popup del portal.</p>
                </div>

                {/* Activar Programa Switch */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">Activar programa</p>
                    <p className="text-[11px] text-slate-500">Permite acumular y canjear puntos.</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      id="switch-program-active"
                      type="checkbox"
                      checked={configState.programActive}
                      onChange={(e) => setConfigState({ ...configState, programActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del programa</label>
                    <input
                      type="text"
                      value={configState.programName}
                      onChange={(e) => setConfigState({ ...configState, programName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Puntos por $1</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={configState.pointsPerPeso}
                      onChange={(e) => setConfigState({ ...configState, pointsPerPeso: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Valor de 1 punto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configState.pointValuePesos}
                      onChange={(e) => setConfigState({ ...configState, pointValuePesos: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Puntos de bienvenida</label>
                    <input
                      type="number"
                      value={configState.welcomePoints}
                      onChange={(e) => setConfigState({ ...configState, welcomePoints: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={configState.whatsapp}
                      onChange={(e) => setConfigState({ ...configState, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={configState.email}
                      onChange={(e) => setConfigState({ ...configState, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Color principal</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={configState.primaryColor}
                        onChange={(e) => setConfigState({ ...configState, primaryColor: e.target.value })}
                        className="w-9 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={configState.primaryColor}
                        onChange={(e) => setConfigState({ ...configState, primaryColor: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={configState.instagram}
                      onChange={(e) => setConfigState({ ...configState, instagram: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Facebook</label>
                    <input
                      type="text"
                      value={configState.facebook}
                      onChange={(e) => setConfigState({ ...configState, facebook: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Website</label>
                    <input
                      type="text"
                      value={configState.website}
                      onChange={(e) => setConfigState({ ...configState, website: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      value={configState.address}
                      onChange={(e) => setConfigState({ ...configState, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Popup Promocional Subcard */}
              <div id="card-popup-config" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Popup promocional</h4>
                    <p className="text-xs text-slate-500">Aparece automáticamente al ingresar al portal del cliente.</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      id="switch-popup-active"
                      type="checkbox"
                      checked={configState.popupActive}
                      onChange={(e) => setConfigState({ ...configState, popupActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Título</label>
                    <input
                      type="text"
                      placeholder="Bienvenido!"
                      value={configState.popupTitle}
                      onChange={(e) => setConfigState({ ...configState, popupTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Texto botón</label>
                    <input
                      type="text"
                      placeholder="Ver premios"
                      value={configState.popupButtonText}
                      onChange={(e) => setConfigState({ ...configState, popupButtonText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL de la imagen publicitaria</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={configState.popupImageUrl}
                      onChange={(e) => setConfigState({ ...configState, popupImageUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Enlace del botón (opcional)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={configState.popupButtonLink}
                      onChange={(e) => setConfigState({ ...configState, popupButtonLink: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje/Contenido</label>
                  <textarea
                    rows={2}
                    placeholder="AHORA TUS COMPRAS TE REGALAN PUNTOS!"
                    value={configState.popupMessage}
                    onChange={(e) => setConfigState({ ...configState, popupMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <button
                  id="btn-save-loyalty-config"
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Guardar configuración
                </button>
              </div>
            </form>

            {/* Danger Zone: Reset Points */}
            <div id="card-danger-reset" className="bg-rose-50/70 rounded-2xl p-6 border border-rose-200 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-rose-900 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Reiniciar puntos</span>
                </h4>
                <p className="text-xs text-rose-700 mt-1">
                  Deja en cero los saldos y acumulados de todos los clientes y elimina el historial de movimientos de puntos. No elimina premios, canjes, referidos, encuestas ni sorteos.
                </p>
              </div>
              <button
                id="btn-open-reset-confirm"
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Resetear todos los puntos</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Reset Points */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-extrabold text-slate-900">¿Confirmar reinicio total de puntos?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción pondrá en <strong>0</strong> los puntos de todos los clientes y limpiará el historial de transacciones. No se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPoints}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Sí, resetear puntos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
