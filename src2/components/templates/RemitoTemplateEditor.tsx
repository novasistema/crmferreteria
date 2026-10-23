import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  GripVertical,
  FileText,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface LayoutElement {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
}

const DEFAULT_REMITO_ELEMENTS: LayoutElement[] = [
  { id: 'company_logo', label: 'Logo Empresa', x: 0, y: 0, width: 12, height: 8, visible: true, locked: false },
  { id: 'company_data', label: 'Datos Empresa', x: 12, y: 0, width: 38, height: 12, visible: true, locked: false },
  { id: 'remito_header', label: 'REMITO / Nro / Fecha', x: 50, y: 0, width: 50, height: 12, visible: true, locked: false },
  { id: 'client_info', label: 'Datos del Cliente', x: 0, y: 14, width: 100, height: 10, visible: true, locked: false },
  { id: 'transport_info', label: 'Transporte / Dirección', x: 0, y: 25, width: 100, height: 6, visible: true, locked: false },
  { id: 'items_table', label: 'Tabla de Items', x: 0, y: 32, width: 100, height: 45, visible: true, locked: false },
  { id: 'observations', label: 'Observaciones', x: 0, y: 78, width: 60, height: 8, visible: true, locked: false },
  { id: 'totals', label: 'Totales', x: 60, y: 78, width: 40, height: 8, visible: true, locked: false },
  { id: 'signatures', label: 'Firmas (Entrega/Recibe)', x: 0, y: 88, width: 100, height: 7, visible: true, locked: false },
  { id: 'footer', label: 'Pie de Página', x: 0, y: 95, width: 100, height: 4, visible: true, locked: false },
];

const ELEMENT_COLORS: Record<string, string> = {
  company_logo: '#2563eb',
  company_data: '#3b82f6',
  remito_header: '#8b5cf6',
  client_info: '#10b981',
  transport_info: '#f59e0b',
  items_table: '#6366f1',
  observations: '#ec4899',
  totals: '#14b8a6',
  signatures: '#f97316',
  footer: '#78716c',
};

export const RemitoTemplateEditor: React.FC = () => {
  const { store, showToast } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    try {
      const saved = localStorage.getItem('remito_custom_orientation');
      return (saved === 'landscape' || saved === 'portrait') ? saved : 'portrait';
    } catch {
      return 'portrait';
    }
  });

  const [elements, setElements] = useState<LayoutElement[]>(() => {
    try {
      const saved = localStorage.getItem('remito_custom_layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_REMITO_ELEMENTS.map((el) => ({ ...el }));
  });

  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const A4_WIDTH = orientation === 'portrait' ? 595 : 842;
  const A4_HEIGHT = orientation === 'portrait' ? 842 : 595;

  const toPixels = useCallback(
    (percent: number, axis: 'x' | 'y') => {
      return axis === 'x' ? (percent / 100) * A4_WIDTH * zoom : (percent / 100) * A4_HEIGHT * zoom;
    },
    [zoom]
  );

  const toPercent = useCallback(
    (pixels: number, axis: 'x' | 'y') => {
      return axis === 'x' ? (pixels / (A4_WIDTH * zoom)) * 100 : (pixels / (A4_HEIGHT * zoom)) * 100;
    },
    [zoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string, isResize = false) => {
      e.stopPropagation();
      e.preventDefault();
      const el = elements.find((item) => item.id === elementId);
      if (!el || el.locked) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      if (isResize) {
        setResizing(elementId);
        setDragOffset({
          x: e.clientX - rect.left - toPixels(el.x + el.width, 'x'),
          y: e.clientY - rect.top - toPixels(el.y + el.height, 'y'),
        });
      } else {
        setDragging(elementId);
        setDragOffset({
          x: e.clientX - rect.left - toPixels(el.x, 'x'),
          y: e.clientY - rect.top - toPixels(el.y, 'y'),
        });
      }
      setSelectedElement(elementId);
    },
    [elements, toPixels]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging && !resizing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setElements((prev) =>
        prev.map((el) => {
          if (dragging && el.id === dragging) {
            let newX = toPercent(mouseX - dragOffset.x, 'x');
            let newY = toPercent(mouseY - dragOffset.y, 'y');
            newX = Math.max(0, Math.min(100 - el.width, newX));
            newY = Math.max(0, Math.min(100 - el.height, newY));
            return { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 };
          }
          if (resizing && el.id === resizing) {
            let newW = toPercent(mouseX - dragOffset.x, 'x') - el.x;
            let newH = toPercent(mouseY - dragOffset.y, 'y') - el.y;
            newW = Math.max(5, Math.min(100 - el.x, newW));
            newH = Math.max(3, Math.min(100 - el.y, newH));
            return { ...el, width: Math.round(newW * 10) / 10, height: Math.round(newH * 10) / 10 };
          }
          return el;
        })
      );
      setHasChanges(true);
    },
    [dragging, resizing, dragOffset, toPercent]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const toggleVisibility = (id: string) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el)));
    setHasChanges(true);
  };

  const toggleLock = (id: string) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el)));
  };

  const resetLayout = () => {
    setElements(DEFAULT_REMITO_ELEMENTS.map((el) => ({ ...el })));
    setSelectedElement(null);
    setHasChanges(false);
    showToast('Plantilla restablecida a valores por defecto', 'info');
  };

  const handleSave = () => {
    localStorage.setItem('remito_custom_layout', JSON.stringify(elements));
    localStorage.setItem('remito_custom_orientation', orientation);
    setHasChanges(false);
    showToast('Diseño y orientación de Remito guardados con éxito', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans p-4 space-y-4">
      {/* Header Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <div>
            <h2 className="text-base font-black text-white">Diseñador Visual de Remitos (A4)</h2>
            <p className="text-xs text-slate-400">Arrastra y ajusta los bloques para personalizar el remito impreso</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Orientation Selector */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-700 p-1 space-x-1">
            <button
              onClick={() => {
                setOrientation('portrait');
                setHasChanges(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                orientation === 'portrait' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vertical (A4)
            </button>
            <button
              onClick={() => {
                setOrientation('landscape');
                setHasChanges(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                orientation === 'landscape' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Horizontal (A4)
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-700 px-2 py-1 space-x-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-300 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={resetLayout}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-lg shadow-orange-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Diseño</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Canvas Area */}
        <div
          className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 overflow-auto custom-scrollbar flex justify-center items-start"
          onMouseUp={handleMouseUp}
        >
          <div
            ref={canvasRef}
            className="relative bg-white border border-slate-400 shadow-2xl rounded-sm select-none"
            style={{
              width: A4_WIDTH * zoom,
              height: A4_HEIGHT * zoom,
              cursor: dragging ? 'grabbing' : 'default',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {elements.map((el) => {
              const color = ELEMENT_COLORS[el.id] || '#666';
              const isSelected = selectedElement === el.id;
              const isDraggingThis = dragging === el.id || resizing === el.id;

              return (
                <div
                  key={el.id}
                  className={`absolute border-2 rounded-sm transition-shadow ${
                    !el.visible ? 'opacity-25' : ''
                  } ${isSelected ? 'shadow-xl ring-2 ring-blue-500 z-30' : ''} ${
                    isDraggingThis ? 'shadow-2xl z-40' : 'z-10'
                  } ${el.locked ? 'cursor-not-allowed' : 'cursor-grab'}`}
                  style={{
                    left: toPixels(el.x, 'x'),
                    top: toPixels(el.y, 'y'),
                    width: toPixels(el.width, 'x'),
                    height: toPixels(el.height, 'y'),
                    borderColor: color,
                    backgroundColor: `${color}18`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(el.id);
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 flex items-center gap-1 px-1 text-white font-bold truncate"
                    style={{
                      backgroundColor: color,
                      height: Math.min(18, toPixels(el.height, 'y') * 0.4),
                      fontSize: Math.max(8, Math.min(11, toPixels(el.height, 'y') * 0.2)),
                      lineHeight: `${Math.min(18, toPixels(el.height, 'y') * 0.4)}px`,
                    }}
                  >
                    <GripVertical className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{el.label}</span>
                  </div>

                  {el.id === 'company_data' && (
                    <div className="absolute inset-0 flex items-center justify-center pt-4 px-2 text-center text-slate-700 text-[10px]">
                      <div>
                        <div className="font-bold">{store.settings.name}</div>
                        <div className="text-slate-500 font-mono">CUIT: {store.settings.cuit}</div>
                        <div className="text-slate-400">{store.settings.address}</div>
                      </div>
                    </div>
                  )}

                  {el.id === 'remito_header' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 px-2 text-center text-slate-700">
                      <div className="font-black text-sm text-slate-800">REMITO</div>
                      <div className="text-[10px] font-mono text-slate-500">N° 0005-00000124</div>
                      <div className="text-[9px] text-slate-400">Fecha: {new Date().toLocaleDateString('es-AR')}</div>
                    </div>
                  )}

                  {!el.locked && (
                    <div
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize"
                      style={{ backgroundColor: color, borderRadius: '0 0 2px 0' }}
                      onMouseDown={(e) => handleMouseDown(e, el.id, true)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Element List & Inspector */}
        <div className="w-72 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-y-auto custom-scrollbar space-y-3 shrink-0">
          <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Elementos del Remito</h3>
          <div className="space-y-1.5">
            {elements.map((el) => {
              const color = ELEMENT_COLORS[el.id] || '#666';
              const isSelected = selectedElement === el.id;
              return (
                <div
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-950/40'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold text-white truncate text-[11px]">{el.label}</span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(el.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title={el.visible ? 'Ocultar' : 'Mostrar'}
                    >
                      {el.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLock(el.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title={el.locked ? 'Desbloquear' : 'Bloquear'}
                    >
                      {el.locked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
