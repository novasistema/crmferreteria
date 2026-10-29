import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Gift, 
  Award, 
  Users, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  QrCode, 
  RefreshCw, 
  Ticket, 
  ShieldAlert, 
  History, 
  Star, 
  Info,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  Check
} from 'lucide-react';
import { 
  Customer, 
  LoyaltyReward, 
  LoyaltyRedemption, 
  LoyaltyTransaction, 
  LoyaltyRaffle,
  CompanyConfig 
} from '../types';

interface LoyaltyModuleProps {
  customers: Customer[];
  rewards: LoyaltyReward[];
  redemptions: LoyaltyRedemption[];
  transactions: LoyaltyTransaction[];
  raffles: LoyaltyRaffle[];
  config: CompanyConfig | null;
  onSaveReward: (reward: LoyaltyReward) => Promise<void>;
  onAdjustPoints: (customerId: string, points: number, concept: string) => Promise<void>;
  onRedeemReward: (customerId: string, rewardId: string) => Promise<string | null>; // Returns redemption code
  onValidateCoupon: (couponCode: string) => Promise<boolean>;
  onEnterRaffle: (customerId: string, raffleId: string) => Promise<void>;
  onResetLoyaltyProgram: () => Promise<void>;
}

export const LoyaltyModule: React.FC<LoyaltyModuleProps> = ({
  customers,
  rewards,
  redemptions,
  transactions,
  raffles,
  config,
  onSaveReward,
  onAdjustPoints,
  onRedeemReward,
  onValidateCoupon,
  onEnterRaffle,
  onResetLoyaltyProgram
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'customers' | 'coupons' | 'raffles' | 'history'>('rewards');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showNewRewardModal, setShowNewRewardModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState<Customer | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState<{ customer: Customer; reward: LoyaltyReward } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Validation Code input
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<{ success: boolean; msg: string } | null>(null);

  // New Reward Form
  const [rewardForm, setRewardForm] = useState<Partial<LoyaltyReward>>({
    title: '',
    description: '',
    category: 'herramientas',
    pointsCost: 100,
    referencePriceArs: 15000,
    stock: 10,
    active: true,
    termsAndConditions: 'Canje presencial en fábrica o agregado a pedido mayorista.'
  });

  // Adjust Form
  const [adjustPointsValue, setAdjustPointsValue] = useState<number>(50);
  const [adjustType, setAdjustType] = useState<'sumar' | 'restar'>('sumar');
  const [adjustConcept, setAdjustConcept] = useState<string>('Bonificación por recomendación de cliente');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customers classified by eligibility
  // REGLA MAESTRA EXACTA: hasCurrentAccount === true -> SIEMPRE EXCLUIDO de fidelización
  const eligibleCustomers = useMemo(() => {
    return customers.filter(c => !c.hasCurrentAccount && c.loyaltyEligible !== false);
  }, [customers]);

  const excludedCustomers = useMemo(() => {
    return customers.filter(c => c.hasCurrentAccount || c.loyaltyEligible === false);
  }, [customers]);

  const totalPointsCirculating = useMemo(() => {
    return eligibleCustomers.reduce((acc, c) => acc + (c.loyaltyPoints || 0), 0);
  }, [eligibleCustomers]);

  const totalRedemptionsCount = redemptions.length;

  // Handle Reward Save
  const handleSaveRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.title || !rewardForm.pointsCost) return;
    setIsSubmitting(true);
    try {
      const newReward: LoyaltyReward = {
        id: `rew-${Date.now()}`,
        title: rewardForm.title || '',
        description: rewardForm.description || '',
        category: rewardForm.category as any || 'herramientas',
        pointsCost: Number(rewardForm.pointsCost) || 100,
        referencePriceArs: Number(rewardForm.referencePriceArs) || 0,
        imageUrl: rewardForm.imageUrl || '',
        stock: Number(rewardForm.stock) || 1,
        active: Boolean(rewardForm.active),
        termsAndConditions: rewardForm.termsAndConditions,
        createdAt: new Date().toISOString()
      };
      await onSaveReward(newReward);
      setShowNewRewardModal(false);
      setRewardForm({
        title: '',
        description: '',
        category: 'herramientas',
        pointsCost: 100,
        referencePriceArs: 15000,
        stock: 10,
        active: true
      });
    } catch (err) {
      console.error(err);
      alert("Error al guardar el premio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Adjust Points
  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustModal) return;

    // Strict validation
    if (showAdjustModal.hasCurrentAccount) {
      alert("Operación denegada: Este cliente posee Cuenta Corriente activa y queda permanentemente excluido de la acumulación de puntos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const delta = adjustType === 'sumar' ? Math.abs(adjustPointsValue) : -Math.abs(adjustPointsValue);
      await onAdjustPoints(showAdjustModal.id, delta, adjustConcept);
      setShowAdjustModal(null);
    } catch (err) {
      console.error(err);
      alert("Error al ajustar puntos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Coupon Validation
  const handleValidateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationResult(null);
    if (!couponCodeInput.trim()) return;

    try {
      const success = await onValidateCoupon(couponCodeInput.trim().toUpperCase());
      if (success) {
        setValidationResult({
          success: true,
          msg: `¡Cupón ${couponCodeInput.toUpperCase()} VALIDADO Y ENTREGADO con éxito!`
        });
        setCouponCodeInput('');
      } else {
        setValidationResult({
          success: false,
          msg: `El código ${couponCodeInput.toUpperCase()} no existe, ya fue canjeado con anterioridad o está cancelado.`
        });
      }
    } catch (err) {
      setValidationResult({
        success: false,
        msg: 'Error al verificar el cupón en el servidor.'
      });
    }
  };

  // Handle Administrative Reset
  const handleResetExecute = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET PUNTOS') {
      alert("Escriba exactamente 'RESET PUNTOS' para confirmar el reinicio.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onResetLoyaltyProgram();
      setShowResetModal(false);
      setResetConfirmText('');
      alert("El programa de puntos ha sido reiniciado a cero con éxito.");
    } catch (err) {
      console.error(err);
      alert("Error al ejecutar el reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Programa de Fidelización, Premios & Puntos
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                pointsPerCurrency = 0.01 (1 pto / $100)
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Acumulación automática por ventas mostrador/contado, exclusión estricta de cuentas corrientes mayoristas y canje de cupones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewRewardModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Premio
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold transition-all cursor-pointer"
            title="Reset Administrativo de Puntos"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Puntos
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Puntos Circulantes</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {totalPointsCirculating.toLocaleString('es-AR')} pts
          </div>
          <div className="text-xs text-slate-500 mt-1">Suma en clientes activos</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Premios Canjeados</span>
            <Gift className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {totalRedemptionsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Cupones emitidos / entregados</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Clientes Participantes</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono">
            {eligibleCustomers.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Sin cuenta corriente mayorista</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Excluidos Automáticos</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {excludedCustomers.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Por operar en Cuenta Corriente</div>
        </div>
      </div>

      {/* Mandatory Rule Explanation Notice */}
      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 text-purple-200 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-purple-300">Reglas Maestras del Programa:</span>
          <p className="mt-0.5 text-slate-300">
            • <strong>Tasa oficial:</strong> 1 punto cada $100 facturados en ventas contado/mostrador (<code>pointsPerCurrency = 0.01</code>).
            • <strong>Medio No Pago:</strong> Las ventas con medio <code>no_pago</code> quedan expresamente excluidas y no acreditan puntos.
            • <strong>Exclusión obligatoria de Cuenta Corriente:</strong> Todo cliente con <code>hasCurrentAccount === true</code> queda <strong>automáticamente excluido</strong> del programa de fidelización y en su portal verá el estado "No participa".
          </p>
        </div>
      </div>

      {/* Cashier Coupon Quick Validation Box */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Validación de Cupón en Mostrador / Entrega:</div>
            <div className="text-xs text-slate-400">Ingrese el código de cupón alfanumérico presentado por el cliente para entregar el premio</div>
          </div>
        </div>

        <form onSubmit={handleValidateCouponSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="ej: CJ-918234"
            value={couponCodeInput}
            onChange={(e) => setCouponCodeInput(e.target.value)}
            className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Validar & Entregar
          </button>
        </form>
      </div>

      {validationResult && (
        <div className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${
          validationResult.success 
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
            : 'bg-rose-950/40 text-rose-300 border-rose-800'
        }`}>
          {validationResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{validationResult.msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'rewards'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          Catálogo de Recompensas ({rewards.length})
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'customers'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Clientes & Saldos de Puntos ({customers.length})
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'coupons'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Cupones Emitidos ({redemptions.length})
        </button>

        <button
          onClick={() => setActiveTab('raffles')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'raffles'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Sorteos Ponderados ({raffles.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Movimientos ({transactions.length})
        </button>
      </div>

      {/* TAB: REWARDS CATALOG */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(reward => (
            <div key={reward.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {reward.category}
                  </span>
                  <div className="flex items-center gap-1 text-purple-400 font-mono font-bold text-sm bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    {reward.pointsCost} pts
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mb-1">{reward.title}</h4>
                <p className="text-xs text-slate-400 mb-3">{reward.description}</p>
              </div>

              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Stock: </span>
                  <span className={`font-bold ${reward.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {reward.stock} disponibles
                  </span>
                </div>
                <div className="font-mono text-slate-400">
                  Ref: ${reward.referencePriceArs.toLocaleString('es-AR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: CUSTOMERS & POINTS LEDGER */}
      {activeTab === 'customers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente por razón social o CUIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Condición Cuenta</th>
                <th className="px-4 py-3">Participación</th>
                <th className="px-4 py-3 font-mono">Puntos Actuales</th>
                <th className="px-4 py-3 font-mono">Total Ganados</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers
                .filter(c => 
                  c.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(customer => {
                  const isExcluded = customer.hasCurrentAccount || customer.loyaltyEligible === false;

                  return (
                    <tr key={customer.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{customer.businessName || customer.tradeName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">CUIT: {customer.taxId}</div>
                      </td>

                      <td className="px-4 py-3">
                        {customer.hasCurrentAccount ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-semibold">
                            Cuenta Corriente Mayorista
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                            Contado / Mostrador
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isExcluded ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                            NO PARTICIPA (Excluido)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                            HABILITADO
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-sm">
                        {isExcluded ? (
                          <span className="text-slate-500">0 pts</span>
                        ) : (
                          <span className="text-purple-400">{(customer.loyaltyPoints || 0).toLocaleString('es-AR')} pts</span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-400">
                        {isExcluded ? '0 pts' : `${(customer.loyaltyTotalEarned || customer.loyaltyPoints || 0).toLocaleString('es-AR')} pts`}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {!isExcluded && (
                          <button
                            onClick={() => setShowAdjustModal(customer)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                          >
                            Ajustar Puntos
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Código Cupón</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Premio Canjeado</th>
                <th className="px-4 py-3 font-mono">Puntos Costo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Aún no se han emitido cupones de canje.
                  </td>
                </tr>
              ) : (
                redemptions.map(red => (
                  <tr key={red.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-sm">
                      {red.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{red.customerName}</td>
                    <td className="px-4 py-3">{red.rewardTitle}</td>
                    <td className="px-4 py-3 font-mono">{red.pointsCost} pts</td>
                    <td className="px-4 py-3 text-slate-400">{red.date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        red.status === 'entregado'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        {red.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: RAFFLES & SORTEOS */}
      {activeTab === 'raffles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {raffles.map(raffle => (
            <div key={raffle.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {raffle.status === 'activo' ? 'SORTEO EN CURSO' : 'FINALIZADO'}
                </span>
                <span className="text-xs text-slate-400 font-mono">Fecha Sorteo: {raffle.drawDate}</span>
              </div>

              <h4 className="text-base font-bold text-white">{raffle.title}</h4>
              <p className="text-xs text-slate-300">{raffle.prizeDescription}</p>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Costo por Entrada: </span>
                  <span className="font-bold text-purple-400 font-mono">{raffle.pointsPerEntry} pts</span>
                </div>
                <div>
                  <span className="text-slate-400">Total Participaciones: </span>
                  <span className="font-bold text-white font-mono">{raffle.totalEntries}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: TRANSACTION LEDGER */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo Movimiento</th>
                <th className="px-4 py-3">Descripción / Referencia</th>
                <th className="px-4 py-3 font-mono text-right">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No hay movimientos de puntos registrados.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono text-slate-400">{tx.date}</td>
                    <td className="px-4 py-2.5 font-medium text-white capitalize">{tx.type.replace('_', ' ')}</td>
                    <td className="px-4 py-2.5 text-slate-300">{tx.description}</td>
                    <td className={`px-4 py-2.5 font-mono font-bold text-right ${
                      tx.points > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Nuevo Premio */}
      {showNewRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-400" />
                Agregar Premio al Catálogo
              </h3>
              <button onClick={() => setShowNewRewardModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRewardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Título del Premio:
                </label>
                <input
                  type="text"
                  value={rewardForm.title}
                  onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
                  placeholder="ej: Pistola Pulverizadora 600W"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Descripción & Especificaciones:
                </label>
                <textarea
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Detalles técnicos, accesorios o términos del premio..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Costo en Puntos:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rewardForm.pointsCost}
                    onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-bold text-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Stock Disponible:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rewardForm.stock}
                    onChange={(e) => setRewardForm({ ...rewardForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewRewardModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Premio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ajuste Manual de Puntos */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Ajuste Manual de Puntos
                </h3>
                <p className="text-xs text-slate-400">{showAdjustModal.businessName || showAdjustModal.tradeName}</p>
              </div>
              <button onClick={() => setShowAdjustModal(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Operación:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('sumar')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      adjustType === 'sumar'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    + Sumar Puntos
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('restar')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      adjustType === 'restar'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    - Descontar Puntos
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Cantidad de Puntos:
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustPointsValue}
                  onChange={(e) => setAdjustPointsValue(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Concepto / Motivo:
                </label>
                <input
                  type="text"
                  value={adjustConcept}
                  onChange={(e) => setAdjustConcept(e.target.value)}
                  placeholder="ej: Bono de bienvenida, corrección o premio de concurso"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Aplicando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Administrative Reset Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Reset Administrativo de Fidelización</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Regla Maestra:</strong> Este procedimiento resetea a cero los saldos de puntos de todos los clientes (<code>points = 0</code>, <code>totalEarned = 0</code>, <code>totalRedeemed = 0</code>) y limpia el ledger de transacciones. 
              <br/><br/>
              <strong>Se conservan intactos:</strong> el catálogo de premios, los cupones ya canjeados y los sorteos históricos.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Para confirmar, escriba <span className="text-rose-400 font-bold font-mono">RESET PUNTOS</span>:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET PUNTOS"
                className="w-full px-3 py-2 bg-slate-950 border border-rose-800/80 rounded-xl text-sm text-white font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetExecute}
                disabled={isSubmitting || resetConfirmText.trim().toUpperCase() !== 'RESET PUNTOS'}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Reiniciando...' : 'Confirmar Reset Definitivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
