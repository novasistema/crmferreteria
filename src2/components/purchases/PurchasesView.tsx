import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { PurchaseReceiptsView } from './PurchaseReceiptsView';
import { SuppliersView } from '../suppliers/SuppliersView';
import { PurchasesAIManagementView } from './PurchasesAIManagementView';
import {
  ReceiptText,
  Building2,
  Sparkles,
  FileText,
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const { activeModule } = useApp();

  const getInitialTab = () => {
    if (activeModule === 'suppliers') return 'suppliers';
    if (activeModule === 'purchase_receipts') return 'purchase_receipts';
    if (activeModule === 'purchases_ai') return 'purchases_ai';
    return 'purchase_orders';
  };

  const [activeTab, setActiveTab] = useState<'purchase_orders' | 'purchase_receipts' | 'purchases_ai' | 'suppliers'>(getInitialTab);

  useEffect(() => {
    if (activeModule === 'suppliers') setActiveTab('suppliers');
    else if (activeModule === 'purchase_receipts') setActiveTab('purchase_receipts');
    else if (activeModule === 'purchases_ai') setActiveTab('purchases_ai');
    else if (activeModule === 'purchase_orders') setActiveTab('purchase_orders');
  }, [activeModule]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-white text-slate-900">
      
      {/* Subnav Module Tabs */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('purchase_orders')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'purchase_orders'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>Pedidos de Compra</span>
        </button>

        <button
          onClick={() => setActiveTab('purchase_receipts')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'purchase_receipts'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Comprobantes de Compra</span>
        </button>

        <button
          onClick={() => setActiveTab('purchases_ai')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'purchases_ai'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Compras & Facturación IA</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'suppliers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Proveedores & Cuentas Corrientes</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'purchase_orders' && <PurchaseOrdersView />}
        {activeTab === 'purchase_receipts' && <PurchaseReceiptsView />}
        {activeTab === 'purchases_ai' && <PurchasesAIManagementView />}
        {activeTab === 'suppliers' && <SuppliersView />}
      </div>

    </div>
  );
};
