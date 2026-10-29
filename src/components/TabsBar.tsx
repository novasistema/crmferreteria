import React from 'react';
import { X, Plus, LayoutDashboard, ShoppingCart, Package, Users, Tag, Building2, CircleDollarSign, BarChart3, Settings, Truck } from 'lucide-react';
import { ModuleKey } from '../types';

export interface TabItem {
  id: ModuleKey;
  label: string;
  closable?: boolean;
}

interface TabsBarProps {
  openTabs: TabItem[];
  activeTab: ModuleKey;
  onSelectTab: (id: ModuleKey) => void;
  onCloseTab: (id: ModuleKey) => void;
  onNewTabClick?: () => void;
}

export const TabsBar: React.FC<TabsBarProps> = ({
  openTabs,
  activeTab,
  onSelectTab,
  onCloseTab,
  onNewTabClick
}) => {
  const getTabIcon = (id: ModuleKey) => {
    switch (id) {
      case 'desktop':
        return <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />;
      case 'sales':
        return <ShoppingCart className="w-3.5 h-3.5 shrink-0" />;
      case 'inventory':
      case 'production':
        return <Package className="w-3.5 h-3.5 shrink-0" />;
      case 'customers':
      case 'sellers':
        return <Users className="w-3.5 h-3.5 shrink-0" />;
      case 'prices':
        return <Tag className="w-3.5 h-3.5 shrink-0" />;
      case 'finances':
      case 'cashboxes':
      case 'checks':
        return <CircleDollarSign className="w-3.5 h-3.5 shrink-0" />;
      case 'reports':
        return <BarChart3 className="w-3.5 h-3.5 shrink-0" />;
      case 'logistics':
        return <Truck className="w-3.5 h-3.5 shrink-0" />;
      case 'settings':
        return <Settings className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <Building2 className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <div className="bg-slate-200 border-b border-slate-300 px-3 pt-1.5 flex items-center gap-1 overflow-x-auto text-xs select-none no-scrollbar shadow-inner">
      <div className="flex items-center gap-1 min-w-max">
        {openTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg transition-all cursor-pointer border-t-2 ${
                isActive
                  ? 'bg-white text-slate-900 font-bold border-orange-600 shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium border-transparent'
              }`}
              title={tab.label}
            >
              <span className={isActive ? 'text-orange-600' : 'text-slate-500 group-hover:text-slate-800'}>
                {getTabIcon(tab.id)}
              </span>
              <span className="truncate max-w-[140px] sm:max-w-[180px]">{tab.label}</span>
              
              {tab.closable !== false && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-red-600 transition-colors ml-1"
                  title="Cerrar pestaña"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {onNewTabClick && (
          <button
            type="button"
            onClick={onNewTabClick}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-300/60 rounded-md transition-colors ml-1"
            title="Abrir nueva ventana de módulo (F10)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
