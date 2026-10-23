import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Smartphone, 
  Scan, 
  Search, 
  ShoppingCart, 
  Boxes, 
  DollarSign, 
  FileText, 
  Users, 
  ArrowLeft, 
  Check, 
  Settings, 
  Camera, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Receipt,
  X,
  RefreshCw
} from 'lucide-react';
import { AppModule } from '../../context/AppContext';

interface MobileModuleConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  enabled: boolean;
}

export const MobileAppModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { store, showToast, activeWarehouseId } = useApp();

  const [activeTab, setActiveTab] = useState<'config' | 'simulator'>('simulator');
  const [selectedMobileModules, setSelectedMobileModules] = useState<string[]>(
    store.settings.mobileModules || ['pos', 'inventory', 'clients_ctacte', 'cash_register']
  );

  // Simulator state
  const [simulatedModule, setSimulatedModule] = useState<string>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Save selected modules
  const handleSaveConfig = () => {
    store.saveSettings({
      ...store.settings,
      mobileModules: selectedMobileModules,
    });
    showToast('Configuración móvil guardada correctamente', 'success');
  };

  const toggleModule = (id: string) => {
    if (selectedMobileModules.includes(id)) {
      if (selectedMobileModules.length <= 1) {
        showToast('Debe mantener al menos un módulo activo para el celular', 'error');
        return;
      }
      setSelectedMobileModules(selectedMobileModules.filter(m => m !== id));
    } else {
      setSelectedMobileModules([...selectedMobileModules, id]);
    }
  };

  const allAvailableModules: MobileModuleConfig[] = [
    { id: 'pos', name: 'Punto de Venta (POS)', icon: ShoppingCart, description: 'Venta rápida y cobros en mostrador', enabled: true },
    { id: 'inventory', name: 'Consulta de Stock & Precios', icon: Boxes, description: 'Búsqueda por código de barras y stock por sucursal', enabled: true },
    { id: 'admin_tasks', name: 'Tareas del Personal', icon: FileText, description: 'Control, asignación y estado de tareas', enabled: true },
    { id: 'clients_ctacte', name: 'Clientes & Cuenta Corriente', icon: Users, description: 'Saldos, pagos y datos de contacto', enabled: true },
    { id: 'cash_register', name: 'Caja & Movimientos', icon: DollarSign, description: 'Apertura, cierre y arqueo rápido', enabled: true },
    { id: 'sales_history', name: 'Historial de Ventas', icon: Receipt, description: 'Últimos comprobantes emitidos', enabled: true },
  ];

  if (!isOpen) return null;

  const currentWarehouse = store.warehouses.find(w => w.id === activeWarehouseId) || store.warehouses[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                <span>Módulo Celular & Link Directo</span>
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full">
                  ferreteritabruzzone.com.ar
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Acceso directo al dominio oficial móvil y simulador de escáner de cámara.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="https://ferreteritabruzzone.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Abrir ferreteritabruzzone.com.ar</span>
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://ferreteritabruzzone.com.ar');
                showToast('Link directo copiado al portapapeles', 'success');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700 cursor-pointer"
              title="Copiar Link"
            >
              Copiar Link
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800 p-1 rounded-xl flex space-x-1 border border-slate-700">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'simulator' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                📱 Simulador Móvil
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'config' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚙️ Configurar Módulos
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-950 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left panel: Config or Quick Info */}
          <div className="w-full md:w-5/12 p-6 border-r border-slate-800 overflow-y-auto">
            {activeTab === 'config' ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Módulos Visibles en Celular</h3>
                  <p className="text-xs text-slate-400">
                    Marca las herramientas que deseas habilitar para los vendedores o repartidores al ingresar desde smartphones.
                  </p>
                </div>

                <div className="space-y-3">
                  {allAvailableModules.map((mod) => {
                    const Icon = mod.icon;
                    const isChecked = selectedMobileModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isChecked ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className={`block text-xs font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                              {mod.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{mod.description}</span>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                          isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-800'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleSaveConfig}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Guardar Configuración Móvil
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <h3 className="text-sm font-extrabold text-white mb-2 flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Lector de Código por Cámara Nativo</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    El sistema utiliza la API de cámara del celular con decodificación de códigos de barras (EAN-13, QR, Code128) para agregar productos al instante sin pistola láser.
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-300 text-xs font-semibold">
                    💡 Sucursal activa en vista móvil: <span className="underline">{currentWarehouse?.name}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Enlaces de Acceso Directo</h4>
                  <p className="text-xs text-slate-400">
                    Puedes escanear este código QR o abrir el enlace desde cualquier navegador móvil:
                  </p>
                  <div className="bg-white p-4 rounded-xl w-36 h-36 mx-auto flex items-center justify-center border shadow-inner">
                    <div className="text-center">
                      <span className="font-mono font-black text-slate-900 text-[10px] block">QR PWA MÓVIL</span>
                      <span className="text-[8px] text-slate-500">app.novasystems.ar</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Realistic Smartphone Mockup Simulator */}
          <div className="w-full md:w-7/12 p-6 flex items-center justify-center bg-slate-900/50 overflow-y-auto">
            <div className="w-[340px] h-[640px] bg-slate-950 border-[8px] border-slate-800 rounded-[40px] shadow-2xl flex flex-col overflow-hidden relative">
              
              {/* Phone Notch & Status Bar */}
              <div className="h-7 bg-slate-900 px-6 flex items-center justify-between text-[10px] text-slate-400 shrink-0 border-b border-slate-800">
                <span>09:18</span>
                <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto" />
                <span className="font-bold text-amber-400">5G 🔋</span>
              </div>

              {/* Mobile App Header */}
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">
                    N
                  </div>
                  <span className="font-extrabold text-xs text-white">Nova Mobile</span>
                </div>
                <button
                  onClick={() => setIsScannerActive(!isScannerActive)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                    isScannerActive ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  <Scan className="w-3 h-3" />
                  <span>{isScannerActive ? 'Cerrar Cámara' : 'Escanear'}</span>
                </button>
              </div>

              {/* Mobile App Content Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950 text-xs">
                
                {/* Scanner Viewfinder if active */}
                {isScannerActive ? (
                  <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden animate-pulse">
                    <div className="absolute inset-0 bg-amber-500/5 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-24 border-2 border-dashed border-amber-400 rounded-xl" />
                    </div>
                    <Camera className="w-10 h-10 text-amber-400 mx-auto" />
                    <div>
                      <span className="font-bold text-white block">Apunte con la cámara al código de barras</span>
                      <span className="text-[10px] text-slate-400">El producto se agregará automáticamente</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsScannerActive(false);
                        showToast('¡Código detectado: 7791290078214 - Disco de Corte!', 'success');
                      }}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-[10px] cursor-pointer"
                    >
                      Simular Lectura Exitosa
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search & Quick Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar producto o escanear..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Quick Module selector pills */}
                    <div className="flex space-x-1 overflow-x-auto pb-1 no-scrollbar">
                      {selectedMobileModules.map((id) => {
                        const mod = allAvailableModules.find(m => m.id === id);
                        if (!mod) return null;
                        const isSimActive = simulatedModule === id;
                        return (
                          <button
                            key={id}
                            onClick={() => setSimulatedModule(id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[10px] whitespace-nowrap transition-all cursor-pointer ${
                              isSimActive
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-slate-900 border border-slate-800 text-slate-300'
                            }`}
                          >
                            {mod.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Simulated Content based on active mobile tab */}
                    {simulatedModule === 'pos' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 px-1">
                          <span>Catálogo Rápido</span>
                          <span className="text-amber-400">{store.products.length} ítems</span>
                        </div>
                        <div className="space-y-2">
                          {store.products.slice(0, 4).map((p) => (
                            <div key={p.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-white block truncate text-[11px]">{p.name}</span>
                                <span className="text-[10px] text-emerald-400 font-mono">${p.priceMinorista.toLocaleString('es-AR')}</span>
                              </div>
                              <button
                                onClick={() => showToast(`Agregado: ${p.name}`, 'success')}
                                className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {simulatedModule === 'inventory' && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 px-1">Consulta de Stock por Cámara</div>
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2 text-center">
                          <Boxes className="w-8 h-8 text-blue-400 mx-auto" />
                          <span className="text-[11px] text-white font-bold block">Enfoque rápido de inventario</span>
                          <p className="text-[10px] text-slate-400">Escanee el código de barras en góndola para ver stock actual en {currentWarehouse?.name}.</p>
                        </div>
                      </div>
                    )}

                    {simulatedModule === 'clients_ctacte' && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 px-1">Clientes Destacados</div>
                        {store.clients.slice(0, 3).map(c => (
                          <div key={c.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex justify-between items-center">
                            <div>
                              <span className="font-bold text-white block text-[11px]">{c.name}</span>
                              <span className="text-[10px] text-slate-400">{c.phone || 'Sin teléfono'}</span>
                            </div>
                            <span className="font-mono text-emerald-400 text-[10px]">Saldo $0</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {simulatedModule === 'cash_register' && (
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-[11px]">Caja Activa</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Abierta</span>
                        </div>
                        <div className="text-lg font-black text-amber-400 font-mono">$145.850,00</div>
                        <p className="text-[10px] text-slate-400">Total efectivo en caja de {currentWarehouse?.name}</p>
                      </div>
                    )}

                    {simulatedModule === 'admin_tasks' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 px-1">
                          <span>Tareas del Equipo</span>
                          <span className="text-amber-400">{store.tasks.length} total</span>
                        </div>
                        <div className="space-y-1.5">
                          {store.tasks.slice(0, 5).map((t) => (
                            <div
                              key={t.id}
                              onClick={() => store.toggleTaskStatus(t.id)}
                              className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700"
                            >
                              <div className="min-w-0 pr-2">
                                <span className={`text-[11px] font-bold block truncate ${t.status === 'Completada' ? 'line-through text-slate-500' : 'text-white'}`}>
                                  {t.title}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{t.assignedToName || 'General'}</span>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                t.status === 'Completada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>

              {/* Mobile App Bottom Nav Bar */}
              <div className="h-12 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-around shrink-0 text-slate-400">
                <button onClick={() => setSimulatedModule('pos')} className={`flex flex-col items-center ${simulatedModule === 'pos' ? 'text-amber-400' : ''}`}>
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-[9px]">POS</span>
                </button>
                <button onClick={() => setSimulatedModule('inventory')} className={`flex flex-col items-center ${simulatedModule === 'inventory' ? 'text-amber-400' : ''}`}>
                  <Boxes className="w-4 h-4" />
                  <span className="text-[9px]">Stock</span>
                </button>
                <button onClick={() => setIsScannerActive(true)} className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center -mt-4 shadow-lg cursor-pointer">
                  <Scan className="w-5 h-5" />
                </button>
                <button onClick={() => setSimulatedModule('clients_ctacte')} className={`flex flex-col items-center ${simulatedModule === 'clients_ctacte' ? 'text-amber-400' : ''}`}>
                  <Users className="w-4 h-4" />
                  <span className="text-[9px]">Clientes</span>
                </button>
                <button onClick={() => setSimulatedModule('cash_register')} className={`flex flex-col items-center ${simulatedModule === 'cash_register' ? 'text-amber-400' : ''}`}>
                  <DollarSign className="w-4 h-4" />
                  <span className="text-[9px]">Caja</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
