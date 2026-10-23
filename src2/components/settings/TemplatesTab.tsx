import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageTemplate } from '../../types';
import {
  MessageSquare,
  Mail,
  Smartphone,
  Edit2,
  X,
  Save,
  Check,
  Sparkles,
  Send,
} from 'lucide-react';

export const TemplatesTab: React.FC = () => {
  const { store, showToast } = useApp();

  const defaultTemplates: MessageTemplate[] = [
    {
      id: 'cuenta-corriente',
      category: 'cuenta_corriente',
      categoryLabel: 'CUENTA CORRIENTE',
      name: 'Estado de Cuenta',
      variables: ['{empresa}', '{cliente}', '{fecha}', '{saldo}', '{detalle}'],
      whatsappText:
        'Hola *{cliente}*, te enviamos el estado de cuenta de *{empresa}* al día {fecha}.\n\nTu saldo actual es de: *{saldo}*.\n\n{detalle}\n\nAnte cualquier consulta quedamos a disposición.',
      emailSubject: 'Estado de Cuenta - {empresa}',
      emailText:
        'Estimado/a {cliente},\n\nLe enviamos adjunto el resumen de su cuenta corriente emitido el {fecha}.\n\nSaldo actual: {saldo}\n\n{detalle}\n\nMuchas gracias por confiar en {empresa}.',
    },
    {
      id: 'recibo-cobro',
      category: 'recibos',
      categoryLabel: 'RECIBOS',
      name: 'Recibo de Cobro',
      variables: ['{empresa}', '{numero}', '{fecha}', '{cliente}', '{formaPago}', '{total}', '{detalle}'],
      whatsappText:
        '¡Hola *{cliente}*! Hemos registrado tu pago en *{empresa}*.\n\n*Recibo N°:* {numero}\n*Fecha:* {fecha}\n*Forma de pago:* {formaPago}\n*Total recibido:* {total}\n\n¡Muchas gracias!',
      emailSubject: 'Comprobante de Recibo N° {numero} - {empresa}',
      emailText:
        'Estimado/a {cliente},\n\nConfirmamos la recepción de su pago por un total de {total} mediante {formaPago}.\n\nAdjuntamos el Recibo oficial N° {numero} con fecha {fecha}.\n\nSaludos cordiales,\n{empresa}',
    },
    {
      id: 'remito',
      category: 'remitos',
      categoryLabel: 'REMITOS',
      name: 'Remito',
      variables: ['{empresa}', '{numero}', '{fecha}', '{cliente}', '{detalle}'],
      whatsappText:
        'Hola *{cliente}*, te adjuntamos el remito de entrega *N° {numero}* emitido por *{empresa}* con fecha {fecha}.\n\n*Detalle de mercadería despachada:*\n{detalle}',
      emailSubject: 'Remito de Entrega N° {numero} - {empresa}',
      emailText:
        'Estimado/a {cliente},\n\nAdjuntamos el Remito N° {numero} correspondiente al despacho de mercadería del {fecha}.\n\nDetalle:\n{detalle}\n\nSaludos cordiales,\n{empresa}',
    },
    {
      id: 'factura-venta',
      category: 'ventas',
      categoryLabel: 'VENTAS',
      name: 'Factura / Comprobante de Venta',
      variables: ['{empresa}', '{numero}', '{fecha}', '{cliente}', '{total}'],
      whatsappText:
        'Hola *{cliente}*, te enviamos la factura *N° {numero}* de *{empresa}* por un total de *{total}* (Fecha: {fecha}).\n\n¡Gracias por tu compra!',
      emailSubject: 'Factura Electrónica N° {numero} - {empresa}',
      emailText:
        'Estimado/a {cliente},\n\nLe enviamos adjunta la Factura Electrónica N° {numero} emitida el {fecha} por un importe total de {total}.\n\nMuchas gracias por elegir a {empresa}.',
    },
  ];

  const [templates, setTemplates] = useState<MessageTemplate[]>(
    store.messageTemplates && store.messageTemplates.length > 0
      ? store.messageTemplates
      : defaultTemplates
  );

  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [modalForm, setModalForm] = useState<{
    whatsappText: string;
    emailSubject: string;
    emailText: string;
  }>({
    whatsappText: '',
    emailSubject: '',
    emailText: '',
  });

  const handleOpenEdit = (tpl: MessageTemplate) => {
    setEditingTemplate(tpl);
    setModalForm({
      whatsappText: tpl.whatsappText,
      emailSubject: tpl.emailSubject,
      emailText: tpl.emailText,
    });
  };

  const handleInsertVariable = (v: string, target: 'whatsapp' | 'emailSubject' | 'emailBody') => {
    if (target === 'whatsapp') {
      setModalForm((prev) => ({ ...prev, whatsappText: prev.whatsappText + ` ${v}` }));
    } else if (target === 'emailSubject') {
      setModalForm((prev) => ({ ...prev, emailSubject: prev.emailSubject + ` ${v}` }));
    } else {
      setModalForm((prev) => ({ ...prev, emailText: prev.emailText + ` ${v}` }));
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    const updated: MessageTemplate = {
      ...editingTemplate,
      whatsappText: modalForm.whatsappText,
      emailSubject: modalForm.emailSubject,
      emailText: modalForm.emailText,
    };

    const newTemplates = templates.map((t) => (t.id === updated.id ? updated : t));
    setTemplates(newTemplates);
    store.saveMessageTemplate(updated);
    setEditingTemplate(null);
    showToast(`Plantilla "${updated.name}" guardada correctamente`, 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Header exactly matching Image 6 */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Plantillas de Mensajería</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Personalizá los textos que se envían por WhatsApp y Email al enviar facturas, recibos, remitos, etc. Usá variables entre llaves como <code className="font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded text-[11px]">{'{empresa}'}</code>, <code className="font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded text-[11px]">{'{cliente}'}</code>, <code className="font-mono text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded text-[11px]">{'{total}'}</code> para insertar datos automáticamente.
          </p>
        </div>

        {/* Categories and Template Cards */}
        <div className="space-y-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="space-y-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                {tpl.categoryLabel}
              </span>

              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {tpl.name}
                  </h3>

                  {/* Variables pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tpl.variables.map((v) => (
                      <span
                        key={v}
                        className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono font-medium border border-slate-200 dark:border-slate-700"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(tpl)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">
                    Editar Plantilla: {editingTemplate.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Personalizá los mensajes de WhatsApp y correo electrónico
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModal} className="p-5 overflow-y-auto space-y-5 text-xs flex-1 custom-scrollbar">
              {/* Variables Chips to Click & Insert */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-[11px] text-slate-600 dark:text-slate-400 block">
                  Variables disponibles para esta plantilla (clic para insertar en WhatsApp):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {editingTemplate.variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v, 'whatsapp')}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 hover:bg-blue-50 border border-blue-200 dark:border-blue-800 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                      title="Insertar variable"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Text */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mensaje de WhatsApp</span>
                </label>
                <textarea
                  rows={5}
                  value={modalForm.whatsappText}
                  onChange={(e) => setModalForm({ ...modalForm, whatsappText: e.target.value })}
                  placeholder="Escribí el texto del mensaje..."
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-300 dark:border-slate-700 font-sans text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Email Subject & Body */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Correo Electrónico (Email)</span>
                </label>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Asunto del Email
                  </label>
                  <input
                    type="text"
                    value={modalForm.emailSubject}
                    onChange={(e) => setModalForm({ ...modalForm, emailSubject: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Cuerpo del Mensaje
                  </label>
                  <textarea
                    rows={4}
                    value={modalForm.emailText}
                    onChange={(e) => setModalForm({ ...modalForm, emailText: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-300 dark:border-slate-700 text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md shadow-blue-700/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Plantilla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
