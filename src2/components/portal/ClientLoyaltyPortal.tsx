import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, LoyaltyReward } from '../../types';
import {
  Award,
  Gift,
  Sparkles,
  Heart,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Search,
  Tag,
  Dices,
  History,
  Info,
  LogOut,
  Globe,
  ExternalLink,
  ChevronRight,
  Flame,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface ClientLoyaltyPortalProps {
  client: Client;
  onLogout: () => void;
  onReturnToWeb: () => void;
}

export const ClientLoyaltyPortal: React.FC<ClientLoyaltyPortalProps> = ({
  client,
  onLogout,
  onReturnToWeb,
}) => {
  const { store, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'rewards' | 'raffle' | 'history' | 'rules'>('rewards');
  const [rewardCategory, setRewardCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected reward for redemption
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [redeemedVoucher, setRedeemedVoucher] = useState<{
    reward: LoyaltyReward;
    code: string;
    date: string;
    pointsSpent: number;
  } | null>(null);

  // Filter rewards
  const rewards = store.loyaltyRewards.filter((r) => r.active);
  const categories = ['all', ...Array.from(new Set(rewards.map((r) => r.category).filter(Boolean)))];

  const filteredRewards = rewards.filter((r) => {
    const cost = r.pointsRequired ?? r.pointsCost;
    const name = r.name ?? r.title;
    if (rewardCategory !== 'all' && r.category !== rewardCategory) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
  });

  // Loyalty calculations
  const points = client.loyaltyPoints;
  const currentTier = client.loyaltyTier || 'Bronce';

  const tierProgressMap: Record<string, { nextTier: string; minPoints: number; nextPoints: number }> = {
    Bronce: { nextTier: 'Plata', minPoints: 0, nextPoints: 1000 },
    Plata: { nextTier: 'Oro', minPoints: 1000, nextPoints: 3000 },
    Oro: { nextTier: 'Platino', minPoints: 3000, nextPoints: 6000 },
    Platino: { nextTier: 'VIP Diamante', minPoints: 6000, nextPoints: 10000 },
  };

  const currentTierInfo = tierProgressMap[currentTier] || tierProgressMap['Bronce'];
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((points - currentTierInfo.minPoints) / (currentTierInfo.nextPoints - currentTierInfo.minPoints)) * 100
      )
    )
  );

  const handleRedeem = (reward: LoyaltyReward) => {
    const res = store.redeemLoyaltyReward(client.id, reward.id);
    if (res.success && res.redemption) {
      setRedeemedVoucher({
        reward,
        code: res.redemption.code,
        date: res.redemption.date,
        pointsSpent: res.redemption.pointsSpent,
      });
      showToast(`¡Felicitaciones! Has canjeado ${reward.name || reward.title}. Presentá el código ${res.redemption.code} en mostrador.`, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleRaffleEntry = () => {
    if (client.loyaltyPoints < 50) {
      showToast('Necesitás al menos 50 puntos para adquirir un cupón del sorteo.', 'error');
      return;
    }

    client.loyaltyPoints -= 50;
    store.saveClient(client);
    showToast('¡Cupón adquirido! Ya estás participando en el Gran Sorteo Mensual.', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-950 text-slate-100 font-sans custom-scrollbar">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center text-white font-black shadow-md shadow-rose-500/20">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                CLUB FERRETERO BRUZZONE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase">
                Programa de Puntos
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Socio: <span className="font-bold text-white">{client.name}</span> • DNI/CUIT: <span className="font-mono text-slate-300">{client.taxId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onReturnToWeb}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Web de Inicio</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/30 flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Banner Card */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Points Available */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Puntos Acumulados Disponibles</span>
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline space-x-2">
                <span>{points.toLocaleString('es-AR')}</span>
                <span className="text-xl font-bold text-rose-400">pts</span>
              </div>
              <p className="text-xs text-slate-400">
                Equivalente a consumos registrados en ventas de contado y mostrador
              </p>
            </div>

            {/* Middle: Tier & Progress */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Nivel de Socio:</span>
                <span className="font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px]">
                  {currentTier}
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{points} pts</span>
                <span>Faltan {Math.max(0, currentTierInfo.nextPoints - points)} pts para nivel {currentTierInfo.nextTier}</span>
              </div>
            </div>

            {/* Right: Quick Value Prop */}
            <div className="space-y-2 text-xs text-slate-300 border-l border-slate-800/80 pl-4 hidden md:block">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Beneficios Activos</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li>• Canje directo de herramientas en cualquier sucursal</li>
                <li>• 1 punto por cada $1.000 en compras de contado</li>
                <li>• Cupones para el sorteo mensual de kits industriales</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal / Voucher Pop-up when a reward is redeemed */}
        {redeemedVoucher && (
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">¡Canje Realizado con Éxito!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Presentá este cupón digital en el mostrador de cualquier sucursal de Ferretería Bruzzone para retirar tu premio.
                </p>
              </div>

              {/* Digital Voucher Card */}
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    Cupón Digital Oficial
                  </span>
                  <h4 className="text-base font-black text-white">
                    {redeemedVoucher.reward.name ?? redeemedVoucher.reward.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Socio: <span className="font-bold text-slate-200">{client.name}</span> • DNI: <span className="font-mono text-slate-300">{client.taxId}</span>
                  </p>
                  <p className="text-xs font-mono font-bold text-emerald-400">
                    CÓDIGO: <span className="text-lg bg-slate-950 px-2 py-1 rounded border border-slate-700">{redeemedVoucher.code}</span>
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl text-slate-950 flex flex-col items-center shrink-0">
                  <QrCode className="w-24 h-24" />
                  <span className="text-[9px] font-mono font-bold mt-1">VALIDAR EN POS</span>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
                >
                  Imprimir Comprobante
                </button>
                <button
                  type="button"
                  onClick={() => setRedeemedVoucher(null)}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow"
                >
                  Aceptar y Seguir Viendo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'rewards'
                ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Catálogo de Premios ({rewards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raffle')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'raffle'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Gran Sorteo Mensual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Reglamento & Preguntas Frecuentes</span>
          </button>
        </div>

        {/* TAB 1: REWARDS CATALOG */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            {/* Search & Category Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar premios o herramientas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setRewardCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                      rewardCategory === cat
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' ? 'Todos los Rubros' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRewards.map((reward) => {
                const cost = reward.pointsRequired ?? reward.pointsCost;
                const rewardName = reward.name ?? reward.title;
                const canAfford = points >= cost;

                return (
                  <div
                    key={reward.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col transition-all group"
                  >
                    {/* Reward Image */}
                    <div className="h-44 bg-slate-950 relative overflow-hidden">
                      <img
                        src={
                          reward.imageUrl ||
                          'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={rewardName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-black text-rose-400 flex items-center space-x-1 shadow">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{cost.toLocaleString('es-AR')} pts</span>
                      </div>
                      {reward.category && (
                        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-bold text-slate-300 border border-slate-800">
                          {reward.category}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-black text-white line-clamp-1">{rewardName}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{reward.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          Stock: <span className="font-bold text-slate-200">{reward.stock} un.</span>
                        </span>

                        <button
                          type="button"
                          disabled={!canAfford || reward.stock <= 0}
                          onClick={() => handleRedeem(reward)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow ${
                            canAfford && reward.stock > 0
                              ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>{canAfford ? 'Canjear' : 'Puntos insuficientes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: GRAN SORTEO MENSUAL */}
        {activeTab === 'raffle' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Dices className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white">Gran Sorteo Mensual Ferretero</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Participá con tus puntos acumulados por increíbles combos industriales de herramientas DeWalt y Bosch
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80"
                  alt="Premio Sorteo"
                  referrerPolicy="no-referrer"
                  className="w-full sm:w-40 h-32 object-cover rounded-xl border border-slate-800"
                />
                <div className="space-y-1.5 flex-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Sorteo de Fin de Mes
                  </span>
                  <h4 className="text-base font-black text-white">
                    Kit Completo DeWalt 20V Max (Taladro Percutor + Amoladora + Maletín)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Valuado en más de $350.000. Se sortea por Lotería de Córdoba el último día hábil del mes.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-300">
                  <span className="text-slate-500">Costo por cupón:</span>{' '}
                  <span className="font-bold text-amber-400">50 puntos</span>
                </div>

                <button
                  type="button"
                  onClick={handleRaffleEntry}
                  disabled={points < 50}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
                    points >= 50
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Dices className="w-4 h-4" />
                  <span>Canjear 50 Pts por 1 Cupón</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RULES & FAQ */}
        {activeTab === 'rules' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">Reglamento del Club de Fidelización</h3>
              <p className="text-xs text-slate-400">Términos y condiciones del programa de beneficios</p>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400">1. ¿Cómo sumo puntos?</h4>
                <p className="text-slate-400">
                  Sumás 1 punto por cada $1.000 consumidos en compras abonadas en efectivo, débito, transferencia o tarjetas bancarias al contado.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400">2. ¿Quiénes participan?</h4>
                <p className="text-slate-400">
                  Participan todos los clientes finales y particulares. Por políticas comerciales de la empresa, los clientes que operan con Cuenta Corriente comercial tienen condiciones y plazos de crédito exclusivos en lugar de puntos de fidelización.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400">3. ¿Cómo retiro mi premio canjeado?</h4>
                <p className="text-slate-400">
                  Al confirmar el canje se genera un Cupón Digital con código QR y PIN. Podés acercarte a Casa Central (Dr. Carlos I. Rovira 106) o a la Sucursal Alejandro Roca y retirar tu artículo en el acto.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400">4. ¿Los puntos vencen?</h4>
                <p className="text-slate-400">
                  Tus puntos tienen una vigencia de 12 meses renovables con cada nueva compra registrada en nuestro sistema.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
