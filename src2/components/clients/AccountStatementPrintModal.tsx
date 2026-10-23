import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientAccountMovement } from '../../types';
import { Printer, X, Download, FileText } from 'lucide-react';

interface AccountStatementPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  movements: ClientAccountMovement[];
}

export const AccountStatementPrintModal: React.FC<AccountStatementPrintModalProps> = ({
  isOpen,
  onClose,
  client,
  movements,
}) => {
  const { store } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalDebe = movements
    .filter((m) => m.type === 'sale_debt' || m.type === 'adjustment_debit')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalHaber = movements
    .filter((m) => m.type === 'payment_credit' || m.type === 'return_credit' || m.type === 'adjustment_credit')
    .reduce((acc, m) => acc + m.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col animate-in fade-in">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Vista Previa - Estado de Cuenta Corriente</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto bg-white text-slate-900 rounded-xl p-8 shadow-inner custom-scrollbar space-y-6 print:p-0 print:shadow-none"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">FERRETERÍA BRUZZONE</h1>
              <p className="text-xs text-slate-600">Bv. Duffy 29 • Alejandro Roca, Córdoba</p>
              <p className="text-xs text-slate-600">Tel: (0358) 498-0503 • CUIT: 20-30800287-0</p>
              <p className="text-xs text-slate-600">IVA Responsable Inscripto</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded uppercase tracking-wider mb-1">
                Estado de Cuenta
              </div>
              <p className="text-xs font-mono text-slate-500">Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          {/* Client Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p><strong className="text-slate-700">Cliente / Razón Social:</strong> <span className="font-bold text-slate-950 text-sm">{client.name}</span></p>
              <p className="mt-1"><strong className="text-slate-700">CUIT / DNI:</strong> <span className="font-mono">{client.taxId}</span></p>
              <p className="mt-1"><strong className="text-slate-700">Condición Fiscal:</strong> {client.taxCondition}</p>
            </div>
            <div>
              <p><strong className="text-slate-700">Domicilio:</strong> {client.address || 'Alejandro Roca'}, {client.city || 'Córdoba'}</p>
              <p className="mt-1"><strong className="text-slate-700">Teléfono:</strong> {client.phone || '-'}</p>
              <p className="mt-1"><strong className="text-slate-700">Límite de Crédito:</strong> ${client.creditLimit.toLocaleString('es-AR')}</p>
            </div>
          </div>

          {/* Totals Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Total Debe (Facturado)</span>
              <span className="text-lg font-black text-rose-600 font-mono">
                ${totalDebe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Haber (Cobrado)</span>
              <span className="text-lg font-black text-emerald-600 font-mono">
                ${totalHaber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3.5 bg-slate-900 text-white rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Actual</span>
              <span className={`text-lg font-black font-mono ${client.currentBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ${client.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Movements Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">Concepto</th>
                  <th className="p-2.5">Documento</th>
                  <th className="p-2.5 text-right">Debe</th>
                  <th className="p-2.5 text-right">Haber</th>
                  <th className="p-2.5 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No hay movimientos registrados en la cuenta corriente.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isDebe = m.type === 'sale_debt' || m.type === 'adjustment_debit';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-600">
                          {new Date(m.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="p-2.5 font-medium text-slate-900">
                          {m.concept}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {m.referenceId || m.receiptNumber || '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                          {isDebe ? `$${m.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {!isDebe ? `$${m.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-950">
                          ${m.balanceAfter.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Banking Details */}
          <div className="border-t border-slate-200 pt-4 flex justify-between text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Datos Bancarios para Transferencias:</p>
              <p>Banco Galicia • Alias: <strong>ferreteria.romero</strong></p>
              <p>Enviar comprobante por WhatsApp al: +54 9 358 435-4998</p>
            </div>
            <div className="text-right">
              <p>Ferretería Bruzzone • Alejandro Roca</p>
              <p className="text-[10px]">Página 1 de 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
