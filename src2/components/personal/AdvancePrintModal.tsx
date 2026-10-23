import React from 'react';
import { EmployeeAdvance } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Printer, ArrowDownCircle } from 'lucide-react';

interface AdvancePrintModalProps {
  advance: EmployeeAdvance | null;
  onClose: () => void;
}

export const AdvancePrintModal: React.FC<AdvancePrintModalProps> = ({ advance, onClose }) => {
  const { store } = useApp();

  if (!advance) return null;

  const emp = store.employees.find((e) => e.id === advance.employeeId);
  const company = store.settings;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(advance.date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg text-slate-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Comprobante de Adelanto</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher */}
        <div className="p-8 bg-white text-slate-900 font-sans print:p-0">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {company.name || 'BRUZZONE AUTOMOTORES Y SERVICIOS'}
              </h2>
              <p className="text-xs text-slate-600 font-medium">CUIT: {company.cuit || '30-12345678-9'}</p>
              <p className="text-xs text-slate-600">{company.address || 'Bv. Duffy 29, Alejandro Roca'}</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-amber-500 text-slate-950 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded mb-1">
                Vales / Adelanto
              </div>
              <p className="text-xs font-mono font-bold text-slate-800">{advance.receiptNumber}</p>
              <p className="text-xs text-slate-600">Fecha: {formattedDate}</p>
            </div>
          </div>

          <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <p className="text-slate-700 leading-relaxed">
              Recibí de <strong className="text-slate-900">{company.name || 'la Empresa'}</strong> la
              cantidad de:{' '}
              <strong className="text-base text-slate-900 block mt-1">
                ${advance.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </strong>
            </p>
            <p className="text-slate-700 pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-900">En concepto de:</span> Adelanto de
              haberes correspondiente a sueldos{' '}
              {advance.reason && advance.reason !== '-' ? `(${advance.reason})` : ''}.
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-slate-900">Empleado:</span> {advance.employeeName} (
              {emp?.position || 'Personal'}) - DNI: {emp?.dni || '-'}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-slate-900">Forma de Entrega:</span>{' '}
              {advance.paymentMethod === 'transfer' ? 'Transferencia Bancaria' : 'Efectivo en Caja'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-10 border-t border-dashed border-slate-300 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5 h-8"></div>
              <p className="font-bold text-slate-900">Entregó</p>
              <p className="text-[10px] text-slate-500">Administración / Tesorería</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5 h-8"></div>
              <p className="font-bold text-slate-900">Recibí Conforme</p>
              <p className="text-[10px] text-slate-500">{advance.employeeName}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
