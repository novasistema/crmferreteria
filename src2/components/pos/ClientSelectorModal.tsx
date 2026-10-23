import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { Search, User, X, Check, CreditCard, Shield, MapPin, Phone } from 'lucide-react';

interface ClientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  selectedClientId: string;
  onSelectClient: (client: Client) => void;
}

export const ClientSelectorModal: React.FC<ClientSelectorModalProps> = ({
  isOpen,
  onClose,
  clients,
  selectedClientId,
  onSelectClient,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients.slice(0, 40);

    return clients
      .filter((c) => {
        const bName = (c as any).businessName || '';
        return (
          c.name.toLowerCase().includes(q) ||
          bName.toLowerCase().includes(q) ||
          c.taxId.includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
        );
      })
      .slice(0, 40);
  }, [clients, search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredClients.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredClients[selectedIndex]) {
        onSelectClient(filteredClients[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Seleccionar Cliente (F1)</h3>
              <p className="text-[11px] text-slate-400">
                {clients.length.toLocaleString('es-AR')} clientes registrados en la base de datos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por Nombre, Razón Social, CUIT, DNI, Teléfono o Localidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-950 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-700 focus:border-orange-500 focus:outline-none placeholder:text-slate-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* List */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 divide-y divide-slate-800/40"
        >
          {filteredClients.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No se encontraron clientes que coincidan con "{search}"
            </div>
          ) : (
            filteredClients.map((client, idx) => {
              const isSelected = client.id === selectedClientId;
              const isHighlighted = idx === selectedIndex;

              return (
                <div
                  key={client.id}
                  onClick={() => {
                    onSelectClient(client);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    isHighlighted
                      ? 'bg-blue-900/30 border border-blue-500/50 text-white'
                      : isSelected
                      ? 'bg-slate-800/80 border border-orange-500/40 text-slate-200'
                      : 'hover:bg-slate-800/50 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white group-hover:text-orange-300">
                        {client.name}
                      </span>
                      {(client as any).businessName && (client as any).businessName !== client.name && (
                        <span className="text-[10px] text-slate-400">({(client as any).businessName})</span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center">
                          <Check className="w-3 h-3 mr-0.5" /> Actual
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center">
                        <Shield className="w-3 h-3 text-blue-400 mr-1" />
                        {client.taxCondition}
                      </span>
                      {client.taxId && (
                        <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px] text-slate-300">
                          {client.taxId}
                        </span>
                      )}
                      {client.city && (
                        <span className="flex items-center text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-500 mr-1" />
                          {client.city}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500 mr-1" />
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {client.hasCurrentAccount ? (
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 block flex items-center justify-end">
                          <CreditCard className="w-3 h-3 mr-1" /> Cta. Cte.
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            client.currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          Saldo: ${client.currentBalance.toLocaleString('es-AR')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500">Sin Cta. Cte.</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Usa las flechas ↑ ↓ y Enter para elegir rápidamente</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Cerrar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
