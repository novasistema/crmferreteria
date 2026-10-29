import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Factory, 
  ShoppingCart, 
  Scale, 
  Layers, 
  FileSpreadsheet, 
  DollarSign,
  PieChart,
  Users
} from 'lucide-react';
import { ProductionOrder, SalesOrder, Product, RawMaterial, Customer, ModuleKey } from '../types';
import { DataDashboardWithBars } from './DataDashboardWithBars';

interface ReportsModuleProps {
  productionOrders: ProductionOrder[];
  salesOrders: SalesOrder[];
  products: Product[];
  rawMaterials: RawMaterial[];
  customers?: Customer[];
  onNavigateToCustomer?: (customer: Customer) => void;
  onNavigateModule?: (module: ModuleKey) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  productionOrders,
  salesOrders,
  products,
  rawMaterials,
  customers = [],
  onNavigateToCustomer,
  onNavigateModule
}) => {
  return (
    <div className="space-y-6">
      {/* Full Interactive Data Dashboard with Bars */}
      <DataDashboardWithBars
        productionOrders={productionOrders}
        salesOrders={salesOrders}
        customers={customers}
        products={products}
        rawMaterials={rawMaterials}
        onNavigateToCustomer={onNavigateToCustomer}
        onNavigateModule={onNavigateModule}
      />
    </div>
  );
};
