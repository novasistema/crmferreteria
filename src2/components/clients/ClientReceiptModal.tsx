import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, PaymentMethod, Sale } from '../../types';
import {
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  FileText,
  Building,
  CheckCircle2,
  AlertCircle,
  Printer,
  ShieldCheck,
  X,
  CreditCard,
  Layers,
} from 'lucide-react';

interface PaymentRow {
  id: string;
  method: PaymentMethod;
  boxId: string;
  amount: number;
}

interface RetentionRow {
  id: string;
  type: string;
  certificateNumber: string;
  date: string;
  amount: number;
}

interface ClientReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSuccess?: () => void;
}

export const ClientReceiptModal: React.FC<ClientReceiptModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const { store, currentUser, showToast } = useApp();

  // Receipt Date (defaults to today formatted YYYY-MM-DD)
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Payment Methods Rows
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([
    {
      id: 'p-1',
      method: 'cash',
      boxId: store.cashRegisters.find((r) => r.isOpen)?.id || 'reg-1',
      amount: client.currentBalance > 0 ? client.currentBalance : 0,
    },
  ]);

  // Retentions Rows
  const [retentions, setRetentions] = useState<RetentionRow[]>([]);

  // Manual total override or auto sum
  const [manualAmount, setManualAmount] = useState<number>(
    client.currentBalance > 0 ? client.currentBalance : 0
  );
  const [useManualInput, setUseManualInput] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');

  // Selected pending sales to apply
  const [selectedSaleIds, setSelectedSaleIds] = useState<Record<string, number>>({});

  // Pending sales for this client
  const pendingSales = useMemo(() => {
    return store.sales.filter(
      (s) =>
        s.clientId === client.id &&
        (s.paymentStatus === 'pending_account' || s.paymentStatus === 'partial') &&
        s.status !== 'refunded'
    );
  }, [store.sales, client.id]);

  useEffect(() => {
    if (isOpen) {
      const defaultAmount = client.currentBalance > 0 ? client.currentBalance : 0;
      setPaymentRows([
        {
          id: `p-${Date.now()}`,
          method: 'cash',
          boxId: store.cashRegisters.find((r) => r.isOpen)?.id || 'reg-1',
          amount: defaultAmount,
        },
      ]);
      setManualAmount(defaultAmount);
      setRetentions([]);
      setNotes('');

      // Auto check pending sales if total matches
      const initialSales: Record<string, number> = {};
      pendingSales.forEach((s) => {
        initialSales[s.id] = s.total;
      });
      setSelectedSaleIds(initialSales);
    }
  }, [isOpen, client, store.cashRegisters, pendingSales]);

  // Calculate totals
  const totalPaymentMethods = useMemo(() => {
    return paymentRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  }, [paymentRows]);

  const totalRetentions = useMemo(() => {
    return retentions.reduce((acc, ret) => acc + (Number(ret.amount) || 0), 0);
  }, [retentions]);

  const totalReceipt = useMemo(() => {
    if (useManualInput) {
      return manualAmount;
    }
    return totalPaymentMethods + totalRetentions;
  }, [useManualInput, manualAmount, totalPaymentMethods, totalRetentions]);

  if (!isOpen) return null;

  // Handlers for payment rows
  const handleAddPaymentRow = () => {
    const defaultBox = store.cashRegisters.find((r) => r.isOpen)?.id || 'reg-1';
    setPaymentRows((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        method: 'cash',
        boxId: defaultBox,
        amount: 0,
      },
    ]);
  };

  const handleRemovePaymentRow = (id: string) => {
    if (paymentRows.length <= 1) return;
    setPaymentRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdatePaymentRow = (id: string, field: keyof PaymentRow, value: any) => {
    setPaymentRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Handlers for retentions
  const handleAddRetention = () => {
    setRetentions((prev) => [
      ...prev,
      {
        id: `ret-${Date.now()}`,
        type: 'Retención Impuesto a las Ganancias',
        certificateNumber: '',
        date: receiptDate,
        amount: 0,
      },
    ]);
  };

  const handleRemoveRetention = (id: string) => {
    setRetentions((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRetention = (id: string, field: keyof RetentionRow, value: any) => {
    setRetentions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleToggleSale = (sale: Sale) => {
    setSelectedSaleIds((prev) => {
      const next = { ...prev };
      if (next[sale.id] !== undefined) {
        delete next[sale.id];
      } else {
        next[sale.id] = sale.total;
      }
      return next;
    });
  };

  // Submit Receipt
  const handleSaveReceipt = (printAfter = false) => {
    if (totalReceipt <= 0) {
      showToast('Por favor ingrese un importe válido para el recibo.', 'error');
      return;
    }

    // Build applied sales payload
    const appliedToSales = Object.entries(selectedSaleIds).map(([sId, amt]) => {
      const s = pendingSales.find((sale) => sale.id === sId);
      return {
        saleId: sId,
        saleCode: s ? s.code : sId,
        amountApplied: amt,
      };
    });

    const paymentMethodsDetail = paymentRows.map((r) => ({
      method: r.method,
      boxId: r.boxId,
      amount: Number(r.amount) || 0,
    }));

    const retainedTaxesDetail = retentions.map((ret) => ({
      type: ret.type,
      certificateNumber: ret.certificateNumber,
      date: ret.date,
      amount: Number(ret.amount) || 0,
    }));

    const mainMethod = paymentRows[0]?.method || 'cash';
    const mainBoxId = paymentRows[0]?.boxId || 'reg-1';

    const newReceipt = store.registerClientReceipt({
      clientId: client.id,
      amount: totalReceipt,
      paymentMethod: mainMethod,
      destinationBoxId: mainBoxId,
      date: new Date(receiptDate).toISOString(),
      paymentMethodsDetail,
      retainedTaxes: totalRetentions,
      retainedTaxesDetail,
      appliedToSales,
      notes: notes.trim(),
      user: currentUser,
    });

    showToast(`Recibo ${newReceipt.receiptNumber} emitido exitosamente por $${totalReceipt.toLocaleString('es-AR')}`, 'success');

    if (printAfter) {
      // Trigger printable receipt popup
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Recibo Oficial ${newReceipt.receiptNumber}</title>
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #1e293b; }
                .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
                .title { font-size: 22px; font-weight: 900; color: #0f172a; }
                .rec-num { font-size: 16px; font-weight: bold; color: #d97706; }
                .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 15px; background: #f8fafc; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
                th { background: #0f172a; color: white; padding: 8px; text-align: left; }
                td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
                .total { font-size: 18px; font-weight: 900; text-align: right; margin-top: 15px; color: #0f172a; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 15px; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="title">FERRETERÍA BRUZZONE</div>
                  <div style="font-size:12px; color:#64748b;">Bv. Duffy 29 • Alejandro Roca, Córdoba • CUIT: 20-30800287-0</div>
                </div>
                <div style="text-align: right;">
                  <div class="rec-num">RECIBO DE COBRO</div>
                  <div style="font-size: 14px; font-weight: bold;">${newReceipt.receiptNumber}</div>
                  <div style="font-size: 12px; color:#64748b;">Fecha: ${new Date(newReceipt.date).toLocaleDateString('es-AR')}</div>
                </div>
              </div>

              <div class="box">
                <div class="grid">
                  <div><strong>Cliente:</strong> ${client.name}</div>
                  <div><strong>CUIT/DNI:</strong> ${client.taxId}</div>
                  <div><strong>Condición Fiscal:</strong> ${client.taxCondition}</div>
                  <div><strong>Domicilio:</strong> ${client.address || 'Alejandro Roca'}</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Concepto / Detalle de Cobranza</th>
                    <th>Forma de Pago / Caja</th>
                    <th style="text-align:right;">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentMethodsDetail.map(p => `
                    <tr>
                      <td>Cobranza Cuenta Corriente</td>
                      <td>${p.method.toUpperCase()} (${p.boxId})</td>
                      <td style="text-align:right;">$${p.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                  ${retainedTaxesDetail.map(r => `
                    <tr>
                      <td>Retención: ${r.type} (Cert. ${r.certificateNumber || '-'})</td>
                      <td>Retención Fiscal</td>
                      <td style="text-align:right;">$${r.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total">
                TOTAL RECIBIDO: $${totalReceipt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>

              ${notes ? `<div style="margin-top:15px; font-size:12px;"><strong>Observaciones:</strong> ${notes}</div>` : ''}

              <div class="footer">
                Documento de cobranza no válido como factura. Operador: ${currentUser.name}.
              </div>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header matching Image 4 */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💵</span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Nuevo Recibo de Cobro
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Puede vincular comprobantes pendientes o ingresar un importe manualmente.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Date input */}
            <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400 font-medium">Fecha:</span>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
          {/* Client summary badge */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold text-white">{client.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  CUIT/DNI: {client.taxId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Condición Fiscal: <span className="text-slate-300 font-semibold">{client.taxCondition}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo en Cuenta</span>
              <span className={`text-base font-black ${client.currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ${client.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Section 1: Comprobantes pendientes de cobro */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Comprobantes pendientes de cobro:
            </label>

            {pendingSales.length === 0 ? (
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                No hay comprobantes pendientes de cobro
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-700">
                    <tr>
                      <th className="p-2.5 w-8"></th>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Comprobante</th>
                      <th className="p-2.5 text-right">Total Facturado</th>
                      <th className="p-2.5 text-right">Saldo Pendiente</th>
                      <th className="p-2.5 text-right">Importe a Imputar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingSales.map((s) => {
                      const isSelected = selectedSaleIds[s.id] !== undefined;
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSale(s)}
                              className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-2.5 text-slate-300">
                            {new Date(s.date).toLocaleDateString('es-AR')}
                          </td>
                          <td className="p-2.5 font-bold text-white">
                            {s.documentType.toUpperCase()} {s.code}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">
                            ${s.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-400">
                            ${s.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              disabled={!isSelected}
                              value={selectedSaleIds[s.id] || 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSelectedSaleIds((prev) => ({ ...prev, [s.id]: val }));
                              }}
                              className="w-24 bg-slate-900 text-white font-mono text-right text-xs rounded p-1 border border-slate-700 disabled:opacity-40"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Formas de Cobro matching Image 4 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 block">
                Formas de Cobro
              </label>
              <button
                type="button"
                onClick={handleAddPaymentRow}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center space-x-1 border border-slate-700 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="space-y-2">
              {paymentRows.map((row) => (
                <div
                  key={row.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                >
                  {/* Forma de Cobro */}
                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Forma de Cobro
                    </label>
                    <select
                      value={row.method}
                      onChange={(e) =>
                        handleUpdatePaymentRow(row.id, 'method', e.target.value as PaymentMethod)
                      }
                      className="w-full bg-slate-900 text-white text-xs font-semibold rounded-lg p-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="bank_transfer">Transferencia Bancaria</option>
                      <option value="debit_card">Tarjeta Débito</option>
                      <option value="credit_card">Tarjeta Crédito</option>
                      <option value="check">Cheque Físico / E-Cheq</option>
                      <option value="mercado_pago">Mercado Pago / QR</option>
                    </select>
                  </div>

                  {/* Caja de Entrada */}
                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Caja de Entrada
                    </label>
                    <select
                      value={row.boxId}
                      onChange={(e) =>
                        handleUpdatePaymentRow(row.id, 'boxId', e.target.value)
                      }
                      className="w-full bg-slate-900 text-white text-xs font-semibold rounded-lg p-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
                    >
                      <optgroup label="Cajas de Mostrador">
                        {store.cashRegisters.map((reg) => (
                          <option key={reg.id} value={reg.id}>
                            {reg.name} {reg.isOpen ? '(Abierta)' : '(Cerrada)'}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Cajas Fuertes & Bancos">
                        {store.moneyBoxes.map((mb) => (
                          <option key={mb.id} value={mb.id}>
                            {mb.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Importe */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Importe ($)
                    </label>
                    <input
                      type="number"
                      value={row.amount || ''}
                      onChange={(e) =>
                        handleUpdatePaymentRow(row.id, 'amount', parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                      className="w-full bg-slate-900 text-emerald-400 font-black text-right text-xs rounded-lg p-2 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Delete button */}
                  <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemovePaymentRow(row.id)}
                      disabled={paymentRows.length <= 1}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 disabled:opacity-20 transition-colors"
                      title="Eliminar forma de cobro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* O ingrese importe manualmente */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                O ingrese importe manualmente:
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Importe total..."
                  value={useManualInput ? manualAmount : totalReceipt}
                  onChange={(e) => {
                    setUseManualInput(true);
                    setManualAmount(parseFloat(e.target.value) || 0);
                  }}
                  className="w-36 bg-slate-950 text-right font-black text-emerald-400 text-xs rounded-lg p-2 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Comprobante de Retención matching Image 4 */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm">📜</span>
                <label className="text-xs font-bold text-slate-300">
                  Comprobante de Retención
                </label>
              </div>
              <button
                type="button"
                onClick={handleAddRetention}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center space-x-1 border border-slate-700 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Retención</span>
              </button>
            </div>

            {retentions.length === 0 ? (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                No se cargaron retenciones
              </div>
            ) : (
              <div className="space-y-2">
                {retentions.map((ret) => (
                  <div
                    key={ret.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Tipo de Retención
                      </label>
                      <select
                        value={ret.type}
                        onChange={(e) => handleUpdateRetention(ret.id, 'type', e.target.value)}
                        className="w-full bg-slate-900 text-white text-xs rounded-lg p-2 border border-slate-700"
                      >
                        <option value="Retención Ganancias">Retención Ganancias</option>
                        <option value="Retención Ingresos Brutos (IIBB)">Retención IIBB</option>
                        <option value="Retención IVA">Retención IVA</option>
                        <option value="Retención SUSS">Retención SUSS</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Nro Certificado
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 0001-0004512"
                        value={ret.certificateNumber}
                        onChange={(e) =>
                          handleUpdateRetention(ret.id, 'certificateNumber', e.target.value)
                        }
                        className="w-full bg-slate-900 text-white text-xs rounded-lg p-2 border border-slate-700 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Importe Retenido ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={ret.amount || ''}
                        onChange={(e) =>
                          handleUpdateRetention(ret.id, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 text-amber-400 font-mono font-bold text-right text-xs rounded-lg p-2 border border-slate-700"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveRetention(ret.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Notas matching Image 4 */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-bold text-slate-300 block">
              Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del recibo..."
              className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-800 focus:border-amber-500 focus:outline-none placeholder:text-slate-600 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions & Total Summary */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 uppercase font-bold">Total Recibo:</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              ${totalReceipt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSaveReceipt(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Guardar e Imprimir</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveReceipt(false)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Emitir Recibo Oficial</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
