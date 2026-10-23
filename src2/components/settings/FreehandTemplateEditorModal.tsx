import React, { useState } from 'react';
import { DocumentPrintConfig } from '../../types';
import { X, Check, Sliders, Eye, EyeOff, Lock, Unlock, GripVertical, Maximize2 } from 'lucide-react';

interface FreehandTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DocumentPrintConfig;
  onSave: (updatedConfig: DocumentPrintConfig) => void;
}

interface CanvasElement {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  locked: boolean;
}

const DEFAULT_ELEMENTS: CanvasElement[] = [
  { id: 'logo', label: 'Logo de la empresa', color: 'bg-blue-600 text-white', x: 20, y: 20, w: 130, h: 55, visible: true, locked: false },
  { id: 'company_data', label: 'Datos de la empresa', color: 'bg-indigo-600 text-white', x: 160, y: 20, w: 200, h: 75, visible: true, locked: false },
  { id: 'ticket_info', label: 'COMPROBANTE / Nro / Fecha', color: 'bg-purple-600 text-white', x: 370, y: 20, w: 190, h: 75, visible: true, locked: false },
  { id: 'client_data', label: 'Datos del cliente', color: 'bg-emerald-600 text-white', x: 20, y: 105, w: 540, h: 55, visible: true, locked: false },
  { id: 'transport', label: 'Transporte / Dirección', color: 'bg-amber-500 text-white', x: 20, y: 170, w: 540, h: 45, visible: true, locked: false },
  { id: 'items', label: 'Tabla de Items (Precios)', color: 'bg-blue-700 text-white', x: 20, y: 225, w: 540, h: 180, visible: true, locked: false },
  { id: 'observations', label: 'Notas / Observaciones', color: 'bg-pink-600 text-white', x: 20, y: 415, w: 260, h: 50, visible: true, locked: false },
  { id: 'totals', label: 'Totales / IVA / Descuentos', color: 'bg-teal-600 text-white', x: 290, y: 415, w: 270, h: 50, visible: true, locked: false },
  { id: 'signatures', label: 'Espacio para firma', color: 'bg-orange-600 text-white', x: 20, y: 475, w: 540, h: 55, visible: true, locked: false },
  { id: 'footer', label: 'Código QR / Pie de página', color: 'bg-slate-600 text-white', x: 20, y: 540, w: 540, h: 35, visible: true, locked: false },
];

export const FreehandTemplateEditorModal: React.FC<FreehandTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  if (!isOpen) return null;

  const [elements, setElements] = useState<CanvasElement[]>(
    config.canvasElements && config.canvasElements.length > 0
      ? config.canvasElements
      : DEFAULT_ELEMENTS
  );

  const [selectedId, setSelectedId] = useState<string>('items');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const selectedElement = elements.find((el) => el.id === selectedId);

  const handleMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    if (el.locked || !el.visible) return;
    setDraggingId(el.id);
    setSelectedId(el.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId) {
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(canvasRect.width - 60, e.clientX - canvasRect.left - dragOffset.x));
      const y = Math.max(0, Math.min(canvasRect.height - 30, e.clientY - canvasRect.top - dragOffset.y));

      setElements((prev) =>
        prev.map((el) => (el.id === draggingId ? { ...el, x: Math.round(x), y: Math.round(y) } : el))
      );
    } else if (resizingId) {
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const el = elements.find((item) => item.id === resizingId);
      if (!el) return;
      const w = Math.max(80, e.clientX - canvasRect.left - el.x);
      const h = Math.max(30, e.clientY - canvasRect.top - el.y);

      setElements((prev) =>
        prev.map((item) => (item.id === resizingId ? { ...item, w: Math.round(w), h: Math.round(h) } : item))
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  const toggleVisibility = (id: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el))
    );
  };

  const toggleLock = (id: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el))
    );
  };

  const updateSelectedSize = (w: number, h: number) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, w: Math.max(60, w), h: Math.max(25, h) } : el))
    );
  };

  const handleSave = () => {
    onSave({
      ...config,
      canvasElements: elements,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Diseñador Visual de Comprobantes ({config.name})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mueve los bloques con el mouse, redimensiona y activa los interruptores de visibilidad requeridos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left: Interactive Canvas Sheet (lg:col-span-8) */}
          <div
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="lg:col-span-8 bg-slate-100 dark:bg-slate-900 p-6 flex items-start justify-center relative overflow-auto select-none pt-8"
          >
            <div className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-300 dark:border-slate-700 w-[580px] h-[640px] relative overflow-hidden shrink-0">
              {/* Paper Grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:20px_20px] opacity-60" />

              {elements.map((el) => {
                if (!el.visible) return null;
                const isSelected = selectedId === el.id;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el)}
                    onClick={() => setSelectedId(el.id)}
                    style={{
                      transform: `translate(${el.x}px, ${el.y}px)`,
                      width: `${el.w}px`,
                      height: `${el.h}px`,
                    }}
                    className={`absolute rounded-lg p-2 shadow-md transition-shadow cursor-move flex flex-col justify-between text-[11px] font-bold border-2 ${el.color} ${
                      isSelected ? 'ring-4 ring-blue-400/60 border-white z-25' : 'border-transparent z-10 hover:opacity-95'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        <GripVertical className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span className="truncate">{el.label}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {el.locked && <Lock className="w-3 h-3 opacity-80" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] opacity-90 font-normal">
                      <span>X:{el.x} Y:{el.y}</span>
                      <span>{el.w}x{el.h}px</span>
                    </div>

                    {/* Resize handle */}
                    {isSelected && !el.locked && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizingId(el.id);
                        }}
                        className="absolute right-0 bottom-0 w-4 h-4 bg-white/80 dark:bg-slate-800 rounded-tl cursor-se-resize flex items-center justify-center text-slate-800 dark:text-white"
                        title="Arrastrar para redimensionar"
                      >
                        <Maximize2 className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Elements Panel & Toggles (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 flex flex-col h-full overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 shrink-0">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Elementos a Mostrar ({config.name})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Activa/desactiva interruptores y ajusta tamaños de bloques
              </p>
            </div>

            {/* Selected Element Size controls */}
            {selectedElement && (
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-3 text-xs shrink-0">
                <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">
                  Tamaño de: {selectedElement.label}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Ancho (px):</span>
                    <input
                      type="number"
                      value={selectedElement.w}
                      onChange={(e) => updateSelectedSize(Number(e.target.value), selectedElement.h)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Alto (px):</span>
                    <input
                      type="number"
                      value={selectedElement.h}
                      onChange={(e) => updateSelectedSize(selectedElement.w, Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* List of Toggles */}
            <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${el.color.split(' ')[0]}`} />
                      <span className="text-xs font-bold truncate">{el.label}</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      {/* iOS Style Switch */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(el.id);
                        }}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          el.visible ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={el.visible ? 'Visible' : 'Oculto'}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            el.visible ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(el.id);
                        }}
                        className={`p-1 rounded-lg border transition-colors ${
                          el.locked
                            ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'
                        }`}
                        title={el.locked ? 'Bloqueado' : 'Desbloqueado'}
                      >
                        {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Diseño Visual</span>
          </button>
        </div>
      </div>
    </div>
  );
};
