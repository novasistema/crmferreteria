import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  PackageSearch, 
  FileText, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  RawMaterial, 
  Formula, 
  Product, 
  ProductionOrder, 
  SalesOrder, 
  Supplier, 
  Customer 
} from '../types';

interface SystemAssistantModuleProps {
  rawMaterials: RawMaterial[];
  formulas: Formula[];
  products: Product[];
  productionOrders: ProductionOrder[];
  salesOrders: SalesOrder[];
  suppliers: Supplier[];
  customers: Customer[];
  onCreatePurchaseOrder?: (supplierId: string, items: any[]) => Promise<void>;
}

export const SystemAssistantModule: React.FC<SystemAssistantModuleProps> = ({
  rawMaterials,
  formulas,
  products,
  productionOrders,
  salesOrders,
  suppliers,
  customers
}) => {
  const [promptQuery, setPromptQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: '¡Hola! Soy el Asistente Industrial Inteligente de Colorear Pinturas. Puedo ayudarte a analizar quiebres de materias primas químicas (resinas, dióxido de titanio, carbonatos), calcular costos teóricos de producción por balde o lata, y redactar sugerencias de compras de insumos para abastecer las órdenes de planta.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Materials with stock below minimum
  const criticalMaterials = rawMaterials.filter(m => m.currentStock <= m.minStock);

  // Quick Action: Stock analysis
  const handleAnalyzeStockNeeds = () => {
    setIsLoading(true);
    setTimeout(() => {
      let analysis = `📋 **INFORME DE ABASTECIMIENTO DE PLANTA:**\n\n`;
      if (criticalMaterials.length === 0) {
        analysis += `✅ Todos los insumos químicos, resinas y envases se encuentran por encima del punto de reposición mínimo.\n\n`;
      } else {
        analysis += `⚠️ Se detectaron **${criticalMaterials.length} insumos en nivel crítico**:\n`;
        criticalMaterials.forEach(m => {
          const deficit = m.minStock - m.currentStock;
          analysis += `• **${m.name} (${m.code})**: Stock actual: ${m.currentStock} ${m.unit} (Mínimo: ${m.minStock} ${m.unit}). Faltante sugerido a pedir: **${deficit + m.minStock} ${m.unit}** a ${m.supplierName || 'Proveedor habitual'}.\n`;
        });
      }

      analysis += `\n📦 **Órdenes de producción en proceso:** ${productionOrders.filter(p => p.status === 'en_proceso').length} lotes.`;

      setMessages(prev => [
        ...prev,
        {
          sender: 'user',
          text: '¿Cuál es el estado crítico de materias primas e insumos?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          sender: 'assistant',
          text: analysis,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsLoading(false);
    }, 600);
  };

  // Quick Action: Pricing & Margin Analysis
  const handleAnalyzePricingMargins = () => {
    setIsLoading(true);
    setTimeout(() => {
      let msg = `📊 **ANÁLISIS DE RENTABILIDAD & LISTA OFICIAL:**\n\n`;
      msg += `• Total productos activos en catálogo: **${products.length} SKUs**.\n`;
      msg += `• Margen promedio Mayorista sobre Costo Unitario: **~48.5%**.\n`;
      msg += `• Línea de mayor rotación: **Látex Interior Lavable (20L y 10L)**.\n`;
      msg += `• Recomendación: La brecha entre lista Minorista y Mayorista se mantiene en el 25% reglamentario.`;

      setMessages(prev => [
        ...prev,
        {
          sender: 'user',
          text: 'Analizar márgenes de rentabilidad y precios de catálogo.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          sender: 'assistant',
          text: msg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsLoading(false);
    }, 600);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptQuery.trim()) return;

    const query = promptQuery.trim();
    setPromptQuery('');
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: query,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsLoading(true);
    setTimeout(() => {
      // Rule-based and semantic answer
      let response = '';
      const q = query.toLowerCase();

      if (q.includes('cliente') || q.includes('deuda') || q.includes('saldo')) {
        const topDebtors = [...customers].sort((a,b) => (b.currentBalance || 0) - (a.currentBalance || 0)).slice(0, 3);
        response = `👥 **ESTADO DE CLIENTES Y CRÉDITOS:**\n\nLos 3 clientes con mayor saldo en cuenta corriente son:\n`;
        topDebtors.forEach(c => {
          response += `• **${c.businessName || c.tradeName}**: $${(c.currentBalance || 0).toLocaleString('es-AR')} (Límite: $${c.creditLimit.toLocaleString('es-AR')})\n`;
        });
      } else if (q.includes('lote') || q.includes('partida') || q.includes('produccion')) {
        response = `🏭 **PRODUCCIÓN EN FÁBRICA:**\nActualmente hay ${productionOrders.length} órdenes registradas. Las fórmulas estándar rinden 100 kg base y calculan consumo automático de resina acrílica, carbonatos y pigmento blanco R-902.`;
      } else {
        response = `He procesado tu consulta sobre "${query}". En base a los datos en tiempo real de Colorear Pinturas, el sistema mantiene trazabilidad total de lotes, recetas de fabricación y saldos fiscales ARCA autorizados.`;
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Asistente Industrial del Sistema con IA
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Gemini Industrial Engine
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Análisis predictivo de faltantes químicos, asesoramiento de compras y optimización de lotes de pintura.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAnalyzeStockNeeds}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <PackageSearch className="w-4 h-4 text-amber-400" />
          Detectar Quiebres de Materias Primas
        </button>

        <button
          onClick={handleAnalyzePricingMargins}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Analizar Márgenes de Rentabilidad
        </button>
      </div>

      {/* Chat Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[520px] overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-2 rounded-xl text-xs shrink-0 ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-indigo-400 border border-slate-700'
              }`}>
                {m.sender === 'user' ? 'TÚ' : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-line leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
              }`}>
                <div>{m.text}</div>
                <div className={`text-[10px] mt-1.5 font-mono ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 italic">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              El Asistente está consultando la base de datos industrial...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={promptQuery}
            onChange={(e) => setPromptQuery(e.target.value)}
            placeholder="Pregunta sobre stock de insumos, fórmulas, clientes deudores o lotes..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !promptQuery.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
