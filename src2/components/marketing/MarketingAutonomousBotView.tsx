import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Megaphone,
  Sparkles,
  Bot,
  Globe,
  MessageSquare,
  Mail,
  TrendingUp,
  DollarSign,
  Package,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Mic,
  FileText,
  ShieldCheck,
  Zap,
  Users,
  Search,
  ArrowRight,
  Check,
  ShoppingBag,
} from 'lucide-react';

export const MarketingAutonomousBotView: React.FC = () => {
  const { store, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'social' | 'inbox' | 'suppliers' | 'admin'>('social');

  // Social & Competitor state
  const [isAnalyzingCompetitors, setIsAnalyzingCompetitors] = useState(false);
  const [competitorReport, setCompetitorReport] = useState<any | null>(null);

  // Omnichannel inbox state
  const [inboxMessages, setInboxMessages] = useState([
    { id: 'msg-1', channel: 'WhatsApp', sender: 'Carlos Benítez', message: 'Hola, ¿tienen stock de amoladoras Bosch y cuál es el precio contado?', time: 'Hace 12 min', status: 'Pendiente' },
    { id: 'msg-2', channel: 'Gmail', sender: 'Lucas Martinez (Constructora LM)', message: 'Solicito presupuesto formal por 50 bolsas de cemento y perfilería galvanizada.', time: 'Hace 45 min', status: 'Pendiente' },
    { id: 'msg-3', channel: 'WhatsApp', sender: 'Mariana Gomez', message: '¿Hacen envíos a domicilio en zona centro?', time: 'Hace 2 horas', status: 'Respondido' },
  ]);
  const [replyText, setReplyText] = useState('');
  const [selectedMsgId, setSelectedMsgId] = useState('msg-1');

  // Supplier prices state
  const [supplierPrices, setSupplierPrices] = useState([
    { id: 'sp-1', supplier: 'Bulonera del Sur S.A.', product: 'Tornillos Autoperforantes 8x2', oldPrice: 4500, newPrice: 5100, change: '+13.3%', date: 'Hoy, 09:30' },
    { id: 'sp-2', supplier: 'Ferretería Mayorista El Ancla', product: 'Discos de Corte 4.5"', oldPrice: 1200, newPrice: 1350, change: '+12.5%', date: 'Ayer, 16:45' },
    { id: 'sp-3', supplier: 'Pinturas Misioneras', product: 'Látex Exterior 20L', oldPrice: 48000, newPrice: 48000, change: 'Sin cambios', date: 'Hace 2 días' },
  ]);
  const [isSyncingPrices, setIsSyncingPrices] = useState(false);

  // Admin & Remitos state
  const [pendingRemitos, setPendingRemitos] = useState([
    { id: 'rem-101', client: 'Constructora Del Sur', date: '28/09/2026', items: 'Cemento x30, Arena x10', total: 450000 },
    { id: 'rem-102', client: 'Talleres Mecánicos Norte', date: '29/09/2026', items: 'Juego de Herramientas, Discos', total: 185000 },
  ]);
  const [isConvertingRemitos, setIsConvertingRemitos] = useState(false);

  // Voice / Text Agent Command state
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentResponse, setAgentResponse] = useState('Hola Mauri. Soy tu Agente Autónomo. Estoy monitoreando stock, precios de proveedores, redes sociales y correos. ¿Qué tarea deseas automatizar hoy?');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  const handleRunCompetitorSpy = () => {
    setIsAnalyzingCompetitors(true);
    setTimeout(() => {
      setIsAnalyzingCompetitors(false);
      setCompetitorReport({
        competitorsAnalyzed: 3,
        competitorNames: ['@FerreteriaLider', '@CorralonCentro', '@HerramientasExpress'],
        strengths: ['Alta frecuencia de reels mostrando herramientas en acción', 'Respuestas rápidas en historias de Instagram'],
        weaknesses: ['Precios desactualizados en publicaciones', 'No responden consultas técnicas complejas por WhatsApp'],
        recommendations: [
          'Publicar 2 reels semanales comparando calidad de bulonería',
          'Implementar respuestas automáticas con IA en WhatsApp para retener leads de inmediato',
          'Destacar envíos express en 24hs en tus anuncios de Meta Ads',
        ],
      });
      showToast('Análisis de competencia completado con éxito', 'success');
    }, 1200);
  };

  const handleAutoReply = (msgId: string) => {
    setInboxMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, status: 'Respondido (IA)' } : m))
    );
    showToast('Respuesta automática generada por IA enviada con éxito', 'success');
  };

  const handleSyncSupplierPrices = () => {
    setIsSyncingPrices(true);
    setTimeout(() => {
      setIsSyncingPrices(false);
      showToast('Precios de proveedores actualizados automáticamente en el ERP y listas de precios', 'success');
    }, 1000);
  };

  const handleConvertRemitosToInvoices = () => {
    setIsConvertingRemitos(true);
    setTimeout(() => {
      setIsConvertingRemitos(false);
      setPendingRemitos([]);
      showToast('¡Remitos convertidos a Facturas Electrónicas ARCA con éxito!', 'success');
    }, 1000);
  };

  const handleSendPaymentReminders = () => {
    showToast('Recordatorios de pago automáticos enviados por WhatsApp y Email a 4 clientes con saldo vencido', 'success');
  };

  const handleAskAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPrompt.trim()) return;
    setIsAgentThinking(true);
    const q = agentPrompt;
    setAgentPrompt('');
    setTimeout(() => {
      setIsAgentThinking(false);
      if (q.toLowerCase().includes('proveedor') || q.toLowerCase().includes('precio')) {
        setAgentResponse(`Analicé los últimos remitos de proveedores. "Bulonera del Sur" subió un 13.3%. Ya actualicé los precios en tu sistema de gestión.`);
      } else if (q.toLowerCase().includes('remito') || q.toLowerCase().includes('factura')) {
        setAgentResponse(`Hay ${pendingRemitos.length} remitos pendientes de facturar. ¿Deseas que genere las facturas A/B en AFIP ahora mismo?`);
      } else if (q.toLowerCase().includes('competencia')) {
        setAgentResponse(`Las cuentas de la competencia muestran mayor interacción en videos cortos de demostración. Te sugiero replicar ese formato.`);
      } else {
        setAgentResponse(`Entendido. He procesado tu solicitud "${q}" y optimizado tus campañas y flujos administrativos en segundo plano.`);
      }
    }, 800);
  };

  const handleSimulateVoice = () => {
    setIsListeningVoice(true);
    setTimeout(() => {
      setIsListeningVoice(false);
      setAgentPrompt('Analiza si hay pagos pendientes y envía recordatorios');
      showToast('Comando de voz reconocido con éxito', 'success');
    }, 1500);
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-28 animate-in fade-in duration-200">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-purple-500/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                <Bot className="w-4 h-4 text-purple-200 animate-pulse" /> Agente Autónomo & Bot de Marketing IA
              </span>
              <span className="bg-emerald-500/30 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30">
                Activo 24/7 en Segundo Plano
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tu Asistente Gerencial Inteligente
            </h1>
            <p className="text-purple-100 text-sm max-w-2xl">
              Automatiza tus campañas de redes sociales, analiza competidores, centraliza WhatsApp y Gmail, actualiza precios de proveedores y gestiona la administración (remitos a facturas y cobros) para ganar más tiempo libre.
            </p>
          </div>

          {/* Quick Voice / Text Agent Box */}
          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-purple-500/30 w-full lg:w-96 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Asistente de Voz / Texto</span>
              <button
                onClick={handleSimulateVoice}
                className={`p-1.5 rounded-xl transition-all ${isListeningVoice ? 'bg-red-500 text-white animate-bounce' : 'bg-purple-600/50 hover:bg-purple-600 text-white'}`}
                title="Hablar por voz con el agente"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 italic">
              "{agentResponse}"
            </p>
            <form onSubmit={handleAskAgent} className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe o habla con tu agente..."
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={isAgentThinking}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isAgentThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto custom-scrollbar pb-1">
          {[
            { id: 'social', label: 'Marketing & Redes y Competencia', icon: Megaphone },
            { id: 'inbox', label: 'Bandeja Unificada (Gmail & WhatsApp)', icon: MessageSquare },
            { id: 'suppliers', label: 'Precios Proveedores & Inventario', icon: DollarSign },
            { id: 'admin', label: 'Administración, Remitos y Cobros', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SOCIAL & COMPETITOR SPY */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Campaign Manager & Segmentation */}
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" /> Campañas en Redes Sociales & Segmentación de Audiencia
                  </h3>
                  <span className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full font-bold border border-purple-500/20">
                    Meta Ads / IG / TikTok
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Campaña Activa #1</span>
                    <h4 className="font-bold text-sm text-white">Promoción Ferretería & Herramientas Eléctricas</h4>
                    <p className="text-xs text-slate-400">Segmentación: Hombres/Mujeres 25-65 años, Intereses en construcción, carpintería y bricolaje (Radio 30km).</p>
                    <div className="flex justify-between items-center pt-2 text-xs">
                      <span className="text-emerald-400 font-bold">ROAS: 4.8x</span>
                      <span className="text-slate-400">Presupuesto: $15,000/día</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Campaña Activa #2</span>
                    <h4 className="font-bold text-sm text-white">Liquidación de Pinturas y Impermeabilizantes</h4>
                    <p className="text-xs text-slate-400">Segmentación: Propietarios de hogares, refacciones, zonas residenciales cercanas.</p>
                    <div className="flex justify-between items-center pt-2 text-xs">
                      <span className="text-emerald-400 font-bold">ROAS: 6.2x</span>
                      <span className="text-slate-400">Presupuesto: $12,000/día</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => showToast('Nueva campaña optimizada por IA generada con éxito', 'success')}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow"
                  >
                    <Sparkles className="w-4 h-4" /> Crear Nueva Campaña con IA
                  </button>
                </div>
              </div>

              {/* Competitor Spy & Analysis Card */}
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-400" /> Espionaje de Competencia
                    </h3>
                    <button
                      onClick={handleRunCompetitorSpy}
                      disabled={isAnalyzingCompetitors}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingCompetitors ? 'animate-spin' : ''}`} />
                      {isAnalyzingCompetitors ? 'Analizando...' : 'Escanear Redes'}
                    </button>
                  </div>

                  {competitorReport ? (
                    <div className="space-y-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-bold">Competidores analizados:</span>
                        <p className="text-white font-medium mt-0.5">{competitorReport.competitorNames.join(', ')}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-emerald-400 font-bold">Fortalezas detectadas en rivales:</span>
                        <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                          {competitorReport.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-purple-400 font-bold">Sugerencias de mejora para tu marca:</span>
                        <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                          {competitorReport.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500">
                      <Globe className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                      Haz clic en "Escanear Redes" para analizar el contenido y estrategias de tus competidores.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UNIFIED INBOX (GMAIL & WHATSAPP) */}
        {activeTab === 'inbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message List */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm space-y-3">
              <h3 className="font-bold text-white text-sm px-2 flex items-center justify-between">
                <span>Bandeja Centralizada (WhatsApp & Gmail)</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">3 nuevos</span>
              </h3>

              <div className="space-y-2">
                {inboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMsgId(msg.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedMsgId === msg.id
                        ? 'bg-purple-950/40 border-purple-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        {msg.channel === 'WhatsApp' ? <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Mail className="w-3.5 h-3.5 text-blue-400" />}
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{msg.message}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${msg.status === 'Pendiente' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {msg.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat / Email Responder */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" /> Respuesta Asistida por IA
                  </h3>
                  <span className="text-xs text-slate-400">Integración Oficial WhatsApp & Gmail API</span>
                </div>

                <div className="py-4 space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 font-bold">Mensaje del cliente:</span>
                    <p className="text-sm text-white">"Hola, ¿tienen stock de amoladoras Bosch y cuál es el precio contado?"</p>
                  </div>

                  <div className="bg-purple-950/30 p-4 rounded-xl border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Borrador Sugerido por IA:</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded">Contexto ERP: Stock disponible (4 un.)</span>
                    </div>
                    <p className="text-xs text-purple-100">
                      "¡Hola Carlos! Sí, tenemos stock disponible de amoladora Bosch GWS 700 (4 unidades en local). El precio contado efectivo/transferencia es de $85.400 con 10% de descuento incluido. ¿Te la reservamos para retirar hoy?"
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleAutoReply('msg-1')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                >
                  <Send className="w-4 h-4" /> Enviar Respuesta Automática por WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUPPLIER PRICES & INVENTORY */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" /> Monitoreo de Precios de Proveedores & Actualización ERP
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">El agente detecta listas de precios nuevas y actualiza tu inventario en tiempo real.</p>
                </div>
                <button
                  onClick={handleSyncSupplierPrices}
                  disabled={isSyncingPrices}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingPrices ? 'animate-spin' : ''}`} />
                  {isSyncingPrices ? 'Sincronizando Precios...' : 'Actualizar Precios en ERP'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4">Producto / Artículo</th>
                      <th className="py-3 px-4 text-right">Precio Anterior</th>
                      <th className="py-3 px-4 text-right">Nuevo Precio (Detectado)</th>
                      <th className="py-3 px-4 text-center">Variación</th>
                      <th className="py-3 px-4 text-center">Estado en Sistema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {supplierPrices.map((sp) => (
                      <tr key={sp.id} className="hover:bg-slate-950/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{sp.supplier}</td>
                        <td className="py-3 px-4 text-slate-300">{sp.product}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">${sp.oldPrice.toLocaleString('es-AR')}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">${sp.newPrice.toLocaleString('es-AR')}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${sp.change.includes('+') ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                            {sp.change}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Actualizado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADMIN, REMITOS TO INVOICES & PAYMENT REMINDERS */}
        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Convert Remitos to Invoices */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> Facturación Automática de Remitos (ARCA)
                  </h3>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded font-bold">
                    {pendingRemitos.length} pendientes
                  </span>
                </div>

                <div className="py-3 space-y-3">
                  <p className="text-xs text-slate-400">
                    El agente detecta remitos entregados y genera automáticamente las Facturas Electrónicas de Venta en el sistema de gestión sin intervención manual.
                  </p>

                  <div className="space-y-2">
                    {pendingRemitos.map((rem) => (
                      <div key={rem.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{rem.client}</span>
                          <span className="text-[11px] text-slate-400">{rem.items} • Fecha: {rem.date}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">${rem.total.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                    {pendingRemitos.length === 0 && (
                      <div className="py-8 text-center text-slate-500">
                        Todos los remitos ya han sido facturados.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handleConvertRemitosToInvoices}
                  disabled={isConvertingRemitos || pendingRemitos.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow"
                >
                  <RefreshCw className={`w-4 h-4 ${isConvertingRemitos ? 'animate-spin' : ''}`} />
                  {isConvertingRemitos ? 'Generando Facturas ARCA...' : 'Convertir Remitos a Facturas de Venta'}
                </button>
              </div>
            </div>

            {/* Automated Payment Reminders */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" /> Recordatorios de Pagos Pendientes
                  </h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded font-bold">
                    4 Clientes con saldo
                  </span>
                </div>

                <div className="py-3 space-y-3">
                  <p className="text-xs text-slate-400">
                    El agente envía notificaciones automáticas y personalizadas por WhatsApp y correo electrónico a los clientes con cuentas corrientes vencidas para acelerar tus cobros.
                  </p>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>Plantilla de Recordatorio (WhatsApp / Email):</span>
                      <span className="text-emerald-400">Activa</span>
                    </div>
                    <p className="text-slate-300 italic bg-slate-900 p-3 rounded-lg border border-slate-800">
                      "Hola [Cliente], le escribimos de [Empresa] para recordarle su saldo pendiente por $... Vencimiento: [Fecha]. Puede abonar por transferencia..."
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handleSendPaymentReminders}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                >
                  <Send className="w-4 h-4" /> Enviar Recordatorios Automáticos de Pago
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
