import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, ExpenseRecord, PaymentMethod } from '../../types';
import {
  FileSpreadsheet,
  Plus,
  Receipt,
  Calendar,
  Wallet,
  Building,
  CheckCircle2,
  DollarSign,
  Trash2,
  X,
  CreditCard,
  Layers,
  ArrowDownRight,
} from 'lucide-react';

export const CashExpensesTab: React.FC = () => {
  const { store, currentUser, showToast } = useApp();

  // Modals
  const [isRegisterExpenseModalOpen, setIsRegisterExpenseModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);

  // Expense form
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>(() => {
    return store.expenseCategories[0]?.id || 'cat-adm';
  });
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseSourceId, setExpenseSourceId] = useState<string>(() => {
    return store.cashRegisters[0]?.id || 'reg-mostrador';
  });
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('cash');
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [expenseInvoice, setExpenseInvoice] = useState<string>('');

  // New Category form
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatType, setNewCatType] = useState<'fixed' | 'variable'>('variable');

  const handleCreateCategory = () => {
    if (!newCatName.trim()) {
      showToast('Ingrese el nombre de la categoría', 'error');
      return;
    }
    const newCat: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim().toUpperCase(),
      type: newCatType,
      periodAmount: 0,
      paymentsCount: 0,
    };
    store.saveExpenseCategory(newCat);
    showToast(`Categoría "${newCat.name}" agregada con éxito`, 'success');
    setIsNewCategoryModalOpen(false);
    setNewCatName('');
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`¿Desea eliminar la categoría "${name}"?`)) {
      store.deleteExpenseCategory(id);
      showToast(`Categoría "${name}" eliminada`, 'info');
    }
  };

  const handleRegisterExpense = () => {
    if (expenseAmount <= 0) {
      showToast('Ingrese un monto válido para el gasto', 'error');
      return;
    }
    const cat = store.expenseCategories.find((c) => c.id === expenseCategoryId);
    if (!cat) {
      showToast('Seleccione una categoría', 'error');
      return;
    }

    const regOrBox =
      store.cashRegisters.find((r) => r.id === expenseSourceId) ||
      store.moneyBoxes.find((m) => m.id === expenseSourceId);

    const newRecord: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      categoryId: cat.id,
      categoryName: cat.name,
      amount: expenseAmount,
      paymentMethod: expensePaymentMethod,
      sourceBoxOrBankId: expenseSourceId,
      sourceName: regOrBox ? regOrBox.name : 'Caja Mostrador',
      description: expenseDescription.trim() || `Pago de ${cat.name}`,
      invoiceNumber: expenseInvoice.trim(),
      userId: currentUser.id,
      userName: currentUser.name,
    };

    store.registerExpense(newRecord);
    showToast(`Gasto de $${expenseAmount.toLocaleString('es-AR')} registrado en ${cat.name}`, 'success');
    setIsRegisterExpenseModalOpen(false);
    setExpenseAmount(0);
    setExpenseDescription('');
    setExpenseInvoice('');
  };

  const totalExpenses = store.expenseCategories.reduce((acc, c) => acc + (c.periodAmount || 0), 0);
  const totalPayments = store.expenseCategories.reduce((acc, c) => acc + (c.paymentsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Control de Gastos y Egresos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestione y clasifique los egresos fijos y variables del negocio con imputación a cajas y bancos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-new-expense-category"
            onClick={() => setIsNewCategoryModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </button>
          <button
            id="btn-register-expense"
            onClick={() => setIsRegisterExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
          >
            <ArrowDownRight className="w-4 h-4" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Categories Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Egresos del Mes</span>
            <span className="text-3xl font-black text-rose-600 mt-1 block">
              ${totalExpenses.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Comprobantes Pagados</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {totalPayments} <span className="text-base font-normal text-slate-500">pagos imputados</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {store.expenseCategories.map((cat) => {
          const isFixed = cat.type === 'fixed';
          const amount = cat.periodAmount || 0;
          const count = cat.paymentsCount || 0;

          return (
            <div
              key={cat.id}
              id={`card-exp-cat-${cat.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate" title={cat.name}>
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                        isFixed
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {isFixed ? 'Fijo' : 'Variable'}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="text-slate-300 hover:text-rose-500 p-0.5 transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-xl font-black text-slate-900 block">
                    ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    {count} {count === 1 ? 'pago' : 'pagos'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setExpenseCategoryId(cat.id);
                    setIsRegisterExpenseModalOpen(true);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cargar Pago
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Expense Modal */}
      {isRegisterExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <h3 className="font-bold text-rose-900 flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-rose-600" />
                Registrar Egreso / Gasto
              </h3>
              <button
                onClick={() => setIsRegisterExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-rose-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Categoría de Gasto</label>
                <select
                  value={expenseCategoryId}
                  onChange={(e) => setExpenseCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  {store.expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'fixed' ? 'Fijo' : 'Variable'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Monto a Pagar ($)</label>
                <input
                  type="number"
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-base font-black text-rose-700 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Imputar a Caja o Banco</label>
                <select
                  value={expenseSourceId}
                  onChange={(e) => setExpenseSourceId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <optgroup label="Cajas Registradoras">
                    {store.cashRegisters.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Saldo: ${r.currentBalance?.toLocaleString('es-AR') || 0})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cuentas Bancarias / Tesorería">
                    {store.moneyBoxes.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Saldo: ${m.currentBalance?.toLocaleString('es-AR') || 0})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Medio de Pago</label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="card">Tarjeta Débito/Crédito</option>
                    <option value="check">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nº Factura / Recibo</label>
                  <input
                    type="text"
                    value={expenseInvoice}
                    onChange={(e) => setExpenseInvoice(e.target.value)}
                    placeholder="Ej: A-0001-0029"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Detalle del gasto o proveedor"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsRegisterExpenseModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterExpense}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Nueva Categoría de Gasto
              </h3>
              <button
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej: PUBLICIDAD & REDES"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Gasto</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewCatType('fixed')}
                    className={`p-3 rounded-lg border text-xs font-bold transition-all text-center ${
                      newCatType === 'fixed'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Gasto Fijo
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Recurrente mensual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCatType('variable')}
                    className={`p-3 rounded-lg border text-xs font-bold transition-all text-center ${
                      newCatType === 'variable'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Gasto Variable
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Según consumo u ocasión</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCategory}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Crear Categoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
