import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  User,
  Phone,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TechnicalServiceOrder, TechnicalServiceStatus, ServiceTypeCategory, Client } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface NewServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: TechnicalServiceOrder) => void;
}

export const NewServiceOrderModal: React.FC<NewServiceOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const { store, triggerRefresh, showToast, activeWarehouseId } = useAppContext();

  const [selectedClientId, setSelectedClientId] = useState<string>('custom');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');

  const [itemDescription, setItemDescription] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceTypeCategory>('Reparación');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [accessories, setAccessories] = useState<string>('');
  const [reportedFault, setReportedFault] = useState<string>('');

  const [estimatedBudget, setEstimatedBudget] = useState<string>('0');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>('');
  const [initialStatus, setInitialStatus] = useState<TechnicalServiceStatus>('received');

  useEffect(() => {
    if (isOpen) {
      // Reset form with default values
      setSelectedClientId('custom');
      setClientName('');
      setClientPhone('');
      setItemDescription('');
      setServiceType('Reparación');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setAccessories('');
      setReportedFault('');
      setEstimatedBudget('0');
      
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      setEstimatedDeliveryDate(in3Days.toISOString().split('T')[0]);
      setInitialStatus('received');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClientSelect = (val: string) => {
    setSelectedClientId(val);
    if (val === 'custom') {
      setClientName('');
      setClientPhone('');
    } else {
      const cli = store.clients.find((c) => c.id === val);
      if (cli) {
        setClientName(cli.name);
        setClientPhone(cli.phone || cli.mobilePhone || cli.whatsapp || '');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedClientName = clientName.trim();
    const trimmedItemDesc = itemDescription.trim();
    const trimmedFault = reportedFault.trim();

    if (!trimmedClientName) {
      showToast('Por favor ingresá el nombre del cliente', 'error');
      return;
    }
    if (!trimmedItemDesc) {
      showToast('Por favor ingresá el tipo o descripción del artículo', 'error');
      return;
    }
    if (!trimmedFault) {
      showToast('Por favor indicá la falla reportada o el trabajo solicitado', 'error');
      return;
    }

    const orderNumber = store.getNextServiceOrderNumber();
    const withdrawCode = store.generateWithdrawCode();
    const nowIso = new Date().toISOString();

    const newOrder: TechnicalServiceOrder = {
      id: `srv-${Date.now()}`,
      orderNumber,
      withdrawCode,
      date: nowIso,
      clientId: selectedClientId === 'custom' ? `cli-custom-${Date.now()}` : selectedClientId,
      clientName: trimmedClientName,
      clientPhone: clientPhone.trim(),
      itemDescription: trimmedItemDesc,
      equipmentType: trimmedItemDesc,
      serviceType,
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      accessories: accessories.trim(),
      reportedFault: trimmedFault,
      diagnosis: '',
      workPerformed: '',
      estimatedBudget: parseFloat(estimatedBudget) || 0,
      finalCost: 0,
      totalEstimated: parseFloat(estimatedBudget) || 0,
      totalFinal: 0,
      estimatedDeliveryDate,
      status: initialStatus,
      branchId: activeWarehouseId,
      history: [
        {
          id: `h-${Date.now()}`,
          status: initialStatus,
          statusLabel:
            initialStatus === 'received'
              ? 'Recibido'
              : initialStatus === 'diagnosis'
              ? 'Diagnóstico'
              : initialStatus === 'in_progress'
              ? 'En Proceso'
              : 'Orden creada',
          description: 'Orden ingresada en mostrador',
          date: nowIso,
        },
      ],
    };

    store.saveServiceOrder(newOrder);
    triggerRefresh();
    showToast(`Orden ${orderNumber} creada con éxito (Cód. Retiro: ${withdrawCode})`, 'success');

    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }
    onClose();
  };

  return (
    <div
      id="modal-new-service-order"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                <Wrench className="w-5 h-5" />
              </span>
              Nuevo Ingreso a Servicio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registrá el artículo que ingresa para reparación, afilado o mantenimiento
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {/* Row 1: Cliente Dropdown & Telefono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cliente
              </label>
              <select
                id="service-client-select"
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value="custom">Cliente ocasional / sin registrar</option>
                <optgroup label="Clientes Registrados">
                  {store.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.taxId ? `(${c.taxId})` : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="service-client-phone"
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ej: 3585604583"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Nombre del cliente (Requerido) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del cliente <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="service-client-name"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Si no es cliente registrado"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Section: Artículo recibido */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
              <Package className="w-4 h-4 text-orange-500" />
              Artículo recibido
            </h4>

            {/* Row 3: Tipo/Descripción & Tipo de Servicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo / Descripción <span className="text-orange-500">*</span>
                </label>
                <input
                  id="service-item-desc"
                  type="text"
                  required
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Ej: Motosierra, Cadena, Taladro..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Servicio
                </label>
                <select
                  id="service-type-select"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceTypeCategory)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Reparación">Reparación</option>
                  <option value="Afilado">Afilado</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Garantía">Garantía</option>
                  <option value="Calibración">Calibración</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Row 4: Marca & Modelo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marca
                </label>
                <input
                  id="service-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Stihl, Bosch, etc."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Modelo
                </label>
                <input
                  id="service-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ej: MS 250, GSB 13 RE..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Row 5: N° de Serie & Accesorios entregados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  N° de Serie
                </label>
                <input
                  id="service-serial"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Número de serie o código de fábrica"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accesorios entregados
                </label>
                <input
                  id="service-accessories"
                  type="text"
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                  placeholder="Cargador, valija, etc."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Row 6: Falla reportada / Trabajo solicitado */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Falla reportada / Trabajo solicitado <span className="text-orange-500">*</span>
              </label>
              <textarea
                id="service-fault"
                required
                rows={3}
                value={reportedFault}
                onChange={(e) => setReportedFault(e.target.value)}
                placeholder="Descripción de lo que reporta el cliente o el trabajo a realizar"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>

          {/* Row 7: Presupuesto Estimado, Fecha Estimada Entrega, Estado Inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Presupuesto Estimado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">$</span>
                <input
                  id="service-est-budget"
                  type="number"
                  min="0"
                  step="any"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha Estimada Entrega
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="service-est-date"
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado Inicial
              </label>
              <select
                id="service-init-status"
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as TechnicalServiceStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value="received">Recibido</option>
                <option value="diagnosis">Diagnóstico</option>
                <option value="in_progress">En Proceso</option>
                <option value="budgeted">Presupuestado</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-create-service-order"
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-xl shadow-md hover:shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              Crear Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
