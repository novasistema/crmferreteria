import React, { useState, useEffect } from 'react';
import { X, Building, Check, Phone, Mail, MapPin, CreditCard, User, Tag } from 'lucide-react';
import { Supplier } from '../../types';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  supplierToEdit?: Supplier | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supplierToEdit,
}) => {
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [cuit, setCuit] = useState<string>('');
  const [taxCondition, setTaxCondition] = useState<'Responsable Inscripto' | 'Monotributo' | 'Exento'>('Responsable Inscripto');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [province, setProvince] = useState<string>('Buenos Aires');
  const [category, setCategory] = useState<string>('Ferretería General');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState<number>(0);
  const [cbu, setCbu] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (supplierToEdit) {
      setCode(supplierToEdit.code || '');
      setName(supplierToEdit.name || '');
      setBusinessName(supplierToEdit.businessName || '');
      setCuit(supplierToEdit.cuit || '');
      setTaxCondition(supplierToEdit.taxCondition || 'Responsable Inscripto');
      setContactPerson(supplierToEdit.contactPerson || '');
      setEmail(supplierToEdit.email || '');
      setPhone(supplierToEdit.phone || '');
      setAddress(supplierToEdit.address || '');
      setCity(supplierToEdit.city || '');
      setProvince(supplierToEdit.province || 'Buenos Aires');
      setCategory(supplierToEdit.category || 'Ferretería General');
      setPaymentTermsDays(supplierToEdit.paymentTermsDays || 30);
      setDefaultDiscountPercent(supplierToEdit.defaultDiscountPercent || 0);
      setCbu(supplierToEdit.cbu || '');
      setBankName(supplierToEdit.bankName || '');
      setAlias(supplierToEdit.alias || '');
      setNotes(supplierToEdit.notes || '');
    } else {
      setCode(`PROV-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setBusinessName('');
      setCuit('');
      setTaxCondition('Responsable Inscripto');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCity('');
      setProvince('Buenos Aires');
      setCategory('Ferretería General');
      setPaymentTermsDays(30);
      setDefaultDiscountPercent(0);
      setCbu('');
      setBankName('');
      setAlias('');
      setNotes('');
    }
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cuit.trim()) {
      alert('Por favor ingrese el Nombre y CUIT del proveedor.');
      return;
    }

    const supplier: Supplier = {
      id: supplierToEdit ? supplierToEdit.id : `prov-${Date.now()}`,
      code: code || `PROV-${Date.now().toString().slice(-4)}`,
      name: name.trim().toUpperCase(),
      businessName: (businessName || name).trim().toUpperCase(),
      cuit: cuit.trim(),
      taxId: cuit.trim(),
      taxCondition,
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      category: category.trim(),
      paymentTermsDays: Number(paymentTermsDays) || 30,
      defaultDiscountPercent: Number(defaultDiscountPercent) || 0,
      currentBalance: supplierToEdit ? supplierToEdit.currentBalance : 0,
      cbu: cbu.trim(),
      bankName: bankName.trim(),
      alias: alias.trim(),
      notes: notes.trim(),
      active: true,
    };

    onSave(supplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {supplierToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <p className="text-xs text-slate-400">
                Información fiscal, comercial y bancaria del proveedor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre Comercial */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nombre de Fantasía *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: ACCESORIOS PATRICIO"
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Razón Social */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Razón Social (Legal)
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="ej: ACCESORIOS PATRICIO S.R.L."
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CUIT */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                CUIT *
              </label>
              <input
                type="text"
                required
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                placeholder="30-71899234-5"
                className="w-full h-9 px-3 font-mono bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Condición IVA */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Condición IVA
              </label>
              <select
                value={taxCondition}
                onChange={(e) => setTaxCondition(e.target.value as any)}
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
              </select>
            </div>

            {/* Código Interno */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Código Proveedor
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PROV-001"
                className="w-full h-9 px-3 font-mono bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Contacto & Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="ej: Claudio Venrol"
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="011-4789-0123"
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email de Pedidos
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pedidos@proveedor.com"
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ruta 8 Km 45"
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Plazo de Pago (Días)
              </label>
              <input
                type="number"
                min={0}
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                placeholder="30"
                className="w-full h-9 px-3 font-mono bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                % Descuento Padrón
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={defaultDiscountPercent}
                onChange={(e) => setDefaultDiscountPercent(Number(e.target.value))}
                placeholder="15.00"
                className="w-full h-9 px-3 font-mono bg-amber-950/40 border border-amber-500/50 rounded-xl text-amber-300 font-bold focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* Datos Bancarios */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-blue-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard className="w-4 h-4" />
              Datos Bancarios para Transferencias
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Banco</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Banco Galicia"
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Alias CBU</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="PATRICIO.PAGOS"
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">CBU (22 dígitos)</label>
                <input
                  type="text"
                  maxLength={22}
                  value={cbu}
                  onChange={(e) => setCbu(e.target.value)}
                  placeholder="0070001230000001234567"
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{supplierToEdit ? 'Guardar Cambios' : 'Crear Proveedor'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
