import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  HeartHandshake, 
  Lightbulb, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Building, 
  User, 
  Send,
  Lock,
  PieChart,
  Target,
  RefreshCw
} from 'lucide-react';

interface ExpertAgent {
  id: string;
  name: string;
  role: string;
  avatarIcon: React.ReactNode;
  tagline: string;
  description: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
}

export const C_SuiteAdvisorsView: React.FC = () => {
  const { store, showToast } = useApp();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('cfo');
  const [messages, setMessages] = useState<Record<string, Array<{ sender: 'user' | 'agent'; text: string; time: string }>>>({
    cfo: [
      {
        sender: 'agent',
        text: 'Hola. Soy tu Director Financiero Virtual (CFO). Estoy aquí para ayudarte a blindar la caja de tu empresa, separar definitivamente tus ingresos personales de los comerciales y proyectar el flujo de fondos. ¿Por dónde empezamos?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    coach: [
      {
        sender: 'agent',
        text: '¡Hola! Soy tu Coach de Transición Empresarial. Nuestro objetivo número uno es que pases de ser un "autoempleado esclavo del mostrador" a un Empresario con procesos delegados. ¿Qué cuello de botella operativo te está quitando el sueño hoy?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    governance: [
      {
        sender: 'agent',
        text: 'Hola. Como especialista en Gobierno Corporativo y Separación Patrimonial, te ayudaré a definir tu sueldo fijo ("Sueldo de Gerente"), política de dividendos y reglas claras para que la caja de la empresa jamás se mezcle con tus gastos personales.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    psychologist: [
      {
        sender: 'agent',
        text: 'Hola, qué gusto saludarte. Dirigir un negocio genera una carga mental muy alta, síndrome del impostor, culpa por delegar y fatiga de decisión. Este es un espacio seguro para hablar de la presión de sostener el negocio y recuperar tu bienestar.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const agents: ExpertAgent[] = [
    {
      id: 'cfo',
      name: 'Lic. Roberto Vance',
      role: 'CFO & Director Financiero',
      avatarIcon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      tagline: 'Rentabilidad, cashflow, márgenes y salud de tesorería.',
      description: 'Especialista en estructuración de costos, capital de trabajo, indexación de listas de precios y prevención de iliquidez.',
      welcomeMessage: 'Hola. Soy tu Director Financiero Virtual (CFO). Estoy aquí para ayudarte a blindar la caja de tu empresa, separar definitivamente tus ingresos personales de los comerciales y proyectar el flujo de fondos.',
      suggestedQuestions: [
        '¿Cómo calculo el punto de equilibrio exacto de mi comercio?',
        '¿Por qué vendo mucho pero la caja siempre está en rojo?',
        '¿Qué porcentaje de margen real necesito con la inflación actual?',
        '¿Cómo estructuro un fondo de reserva intocable?'
      ]
    },
    {
      id: 'coach',
      name: 'Mg. Sofía Hartmann',
      role: 'Coach de Transición & Procesos',
      avatarIcon: <Target className="w-5 h-5 text-amber-400" />,
      tagline: 'De Comerciante Autoempleado a Dueño de Empresa.',
      description: 'Experta en delegación de tareas operativas, diseño de manuales de procedimientos y automatización de compras y cobranzas.',
      welcomeMessage: '¡Hola! Soy tu Coach de Transición Empresarial. Nuestro objetivo número uno es que pases de ser un "autoempleado esclavo del mostrador" a un Empresario con procesos delegados.',
      suggestedQuestions: [
        'Siento que si me voy un día el negocio se funde, ¿por dónde empiezo a delegar?',
        '¿Cómo armo un organigrama simple si hoy hago todo yo?',
        '¿Cómo evito que los proveedores me vendan stock que no rota?',
        '¿Qué indicadores clave (KPIs) debo mirar todos los lunes en 15 minutos?'
      ]
    },
    {
      id: 'governance',
      name: 'Dr. Alejandro Madero',
      role: 'Especialista en Gobierno Patrimonial',
      avatarIcon: <ShieldCheck className="w-5 h-5 text-blue-400" />,
      tagline: 'Blindaje patrimonial y separación de bolsillos.',
      description: 'Asesor en protocolos familiares, retiros de socios, sueldos gerenciales y blindaje legal ante contingencias.',
      welcomeMessage: 'Hola. Como especialista en Gobierno Corporativo y Separación Patrimonial, te ayudaré a definir tu sueldo fijo ("Sueldo de Gerente"), política de dividendos y reglas claras.',
      suggestedQuestions: [
        '¿Cómo me pongo un sueldo fijo sin sentir culpa de sacar plata del negocio?',
        '¿Cómo evito usar la caja diaria para pagar el supermercado o la tarjeta personal?',
        '¿Qué diferencia hay entre retirar utilidades y gastar caja operativa?',
        '¿Cómo protejo el patrimonio de la empresa frente a riesgos externos?'
      ]
    },
    {
      id: 'psychologist',
      name: 'Dra. Mariana Gatica',
      role: 'Psicología Organizacional & Liderazgo',
      avatarIcon: <HeartHandshake className="w-5 h-5 text-rose-400" />,
      tagline: 'Bienestar del empresario, manejo del estrés y liderazgo.',
      description: 'Acompañamiento psicológico para reducir la fatiga mental, superar la culpa del descanso y liderar equipos sin desgaste.',
      welcomeMessage: 'Hola, qué gusto saludarte. Dirigir un negocio genera una carga mental muy alta, síndrome del impostor, culpa por delegar y fatiga de decisión.',
      suggestedQuestions: [
        'Siento una culpa constante cuando me tomo un fin de semana libre.',
        '¿Cómo manejo la ansiedad cuando hay que pagar sueldos y la venta está floja?',
        'Me cuesta poner límites firmes a empleados o clientes difíciles.',
        '¿Cómo recupero la pasión por mi negocio sin quemarme en el intento?'
      ]
    }
  ];

  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const currentMessages = messages[selectedAgentId] || [];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMsgs = {
      ...messages,
      [selectedAgentId]: [
        ...(messages[selectedAgentId] || []),
        { sender: 'user', text: text.trim(), time: userTime }
      ]
    };

    setMessages(updatedMsgs);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    // Simulate expert AI response tailored to their ERP data & context
    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (selectedAgentId === 'cfo') {
        if (lower.includes('sueldo') || lower.includes('separar') || lower.includes('plata') || lower.includes('bolsillo')) {
          reply = `Analicemos esto con rigor financiero, ${store.company?.name || 'colega'}: \n\n1. **Tu rol es dual:** Eres Gerente General (y debes cobrar un sueldo fijo de mercado por ese puesto) y eres Inversor (debes recibir dividendos por el riesgo capitalista).\n2. **La Regla de Oro:** Nunca tomes dinero de la caja diaria de ventas. Configura una transferencia automática mensual desde la cuenta recaudadora hacia tu cuenta personal como "Honorarios de Gerencia". Todo lo demás queda intocable en el fondo de capital de trabajo y reposición de stock.`;
        } else if (lower.includes('punto de equilibrio') || lower.includes('costo') || lower.includes('fijo')) {
          reply = `Para calcular tu punto de equilibrio exacto en este negocio, necesitamos sumar tus **Gastos Fijos Mensuales** (alquileres, sueldos, servicios, impuestos) y dividirlos por tu **Margen de Contribución Promedio ponderado** (ej: si vendes con un 35% de margen neto promedio, tus costos fijos se dividen entre 0.35). ¿Te gustaría que hagamos una simulación rápida con tus números actuales?`;
        } else {
          reply = `Entiendo perfectamente tu inquietud financiera. En negocios de distribución y comercialización como el tuyo, el capital de trabajo suele quedar atrapado en mercadería de baja rotación o cuentas corrientes atrasadas. Te sugiero revisar semanalmente tu ratio de liquidez corriente y asegurar que el margen de reposición cubra la devaluación esperada.`;
        }
      } else if (selectedAgentId === 'coach') {
        if (lower.includes('delegar') || lower.includes('esclavo') || lower.includes('fuera')) {
          reply = `El paso de Comerciante a Empresario exige **crear sistemas**. Si dependes de tu memoria para que el negocio funcione, tienes un empleo, no una empresa. \n\n**Plan de acción de 3 pasos:**\n1. Documenta por escrito (en un checklist o video de 3 minutos) cómo haces la reposición de mercadería y el cierre de caja.\n2. Asígnale la tarea a un colaborador clave con un nivel de supervisión semanal.\n3. Sal 1 tarde entera de la sucursal esta misma semana sin mirar el celular. Si el negocio sobrevive, has dado tu primer paso como empresario.`;
        } else {
          reply = `El principal freno para escalar es el ego operativo ("nadie lo hace como yo"). Debes aceptar que un proceso documentado al 80% ejecutado por un empleado vale 10 veces más que el 100 perfecto hecho por ti, porque te libera horas para pensar en expansión y compras estratégicas.`;
        }
      } else if (selectedAgentId === 'governance') {
        if (lower.includes('sueldo') || lower.includes('tarjeta') || lower.includes('supermercado')) {
          reply = `Este es el talón de Aquiles del 90% de las PyMEs. Mezclar las finanzas del hogar con las de la empresa destruye la rentabilidad sin que te des cuenta. \n\n**Solución inmediata:** \n- Asígnate un sueldo fijo depositado en tu caja de ahorros personal el día 1 de cada mes.\n- Bloquea cualquier extrayente de caja de la empresa para gastos de supermercado o combustible personal.\n- Si necesitas un extra para algo extraordinario, debe aprobarse como adelanto de utilidades, nunca como gasto hormiga diario.`;
        } else {
          reply = `Establecer un gobierno corporativo ordenado transmite tranquilidad no sólo a ti, sino a tus proveedores y bancos. La claridad patrimonial es el activo más valioso para dormir en paz.`;
        }
      } else {
        if (lower.includes('culpa') || lower.includes('ansiedad') || lower.includes('fin de semana') || lower.includes('estrés')) {
          reply = `Es completamente normal sentir esa culpa. Has invertido tu alma, tus ahorros y tus desvelos en este negocio. Pero recuerda: **un empresario cansado y estresado es el mayor riesgo para la supervivencia de la empresa.** \n\nDescansar no es un premio; es un mantenimiento preventivo indispensable de la máquina principal de tu empresa... que eres tú. Date el permiso de desconectar; el equipo y el sistema están preparados para sostener la operación.`;
        } else {
          reply = `Validar lo que sientes es el inicio de la sanación empresarial. No estás solo en esto; todos los grandes empresarios atravesaron exactamente esta misma meseta de transición. Concentrémonos en lo que sí puedes controlar hoy y delega el resto con confianza.`;
        }
      }

      const agentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => ({
        ...prev,
        [selectedAgentId]: [
          ...(prev[selectedAgentId] || []),
          { sender: 'agent', text: reply, time: agentTime }
        ]
      }));
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Directorio C-Suite & Consejo de Expertos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              De Comerciante Autoempleado a <span className="text-amber-400">Empresario Exitoso</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Un consejo asesor virtual de primer nivel integrado a tu sistema de gestión. Toma decisiones financieras blindadas, separa tu patrimonio personal del comercial, automatiza la delegación y recupera tu paz mental.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sueldo Gerencial</span>
              <span className="text-base font-black text-emerald-400">Definido & Seguro</span>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Independencia Operativa</span>
              <span className="text-base font-black text-indigo-400">En Transición</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Experts Selector & Chat Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Expert Selection Cards */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
            Selecciona a tu Asesor Experto
          </h2>

          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-slate-900 to-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  isSelected ? 'bg-indigo-500/20 border-indigo-500/40' : 'bg-slate-800 border-slate-700'
                }`}>
                  {agent.avatarIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white truncate">{agent.name}</h3>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-indigo-300 block">{agent.role}</span>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{agent.tagline}</p>
                </div>
              </div>
            );
          })}

          {/* Quick Financial Health Box */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 mt-4">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Diagnóstico Financiero Rápido</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Artículos en Stock:</span>
                <span className="font-bold text-white font-mono">{(store.products || []).length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Clientes Activos:</span>
                <span className="font-bold text-white font-mono">{(store.clients || []).length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Caja Actual:</span>
                <span className="font-bold text-emerald-400 font-mono">Activa en ERP</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Tus datos del sistema están sincronizados en tiempo real para respaldar las recomendaciones de los expertos.
            </p>
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden h-[620px]">
          {/* Chat Header */}
          <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                {currentAgent.avatarIcon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{currentAgent.name}</h3>
                <span className="text-xs text-indigo-400 font-medium">{currentAgent.role}</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Asesor Activo 24/7</span>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-900/50">
            {currentMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-sm whitespace-pre-line'
                }`}>
                  <p>{msg.text}</p>
                  <span className={`text-[9px] mt-1.5 block text-right font-mono ${
                    msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-bl-sm flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[10px] text-slate-400 ml-1">Analizando estrategia...</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Quick Questions */}
          <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Preguntas clave:</span>
            </span>
            {currentAgent.suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Consúltale a ${currentAgent.name} sobre finanzas, separación de dinero o delegación...`}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
            <button
              onClick={() => handleSendMessage()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Enviar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
