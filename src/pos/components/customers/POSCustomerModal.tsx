import React, { useState } from 'react';
import { Search, Plus, User, Phone, MapPin, X, Check, BookOpen, AlertCircle } from 'lucide-react';
import type { Customer } from '../../../shared/types';
import { api } from '../../../shared/services/api';

interface POSCustomerModalProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCustomerAdded: (customer: Customer) => void;
  onClose: () => void;
  currency?: string;
}

export const POSCustomerModal: React.FC<POSCustomerModalProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onCustomerAdded,
  onClose,
  currency = 'Rs.'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Name and Phone number are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        openingBalance: parseFloat(openingBalance) || 0,
        userName: 'POS Cashier'
      });

      onCustomerAdded(created);
      onSelectCustomer(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save new customer.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#082B4C] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">Select Customer for Sale</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle / Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer by name or phone #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-[#082B4C]"
              autoFocus={!showAddForm}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 bg-[#F47700] hover:bg-[#D46600] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'View List' : 'New Customer'}</span>
          </button>
        </div>

        {/* Form or Customer List */}
        <div className="p-4 overflow-y-auto flex-1">
          {showAddForm ? (
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Customer</h3>
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#082B4C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Mobile / WhatsApp # *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#082B4C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Address / School / Institute</label>
                <input
                  type="text"
                  placeholder="e.g. Model Town, Lahore"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#082B4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Opening Khata Balance ({currency})</label>
                <input
                  type="number"
                  placeholder="0 (leave 0 if new customer has no prior debt)"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#082B4C]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#082B4C] hover:bg-[#051C33] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Select Customer'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              {/* Option to clear customer (Walk-in Customer) */}
              <div
                onClick={() => {
                  onSelectCustomer(null);
                  onClose();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedCustomer === null
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Walk-in Customer (Default)</h4>
                    <p className="text-[11px] text-slate-500">Standard counter sale without Khata credit</p>
                  </div>
                </div>
                {selectedCustomer === null && <Check className="w-4 h-4 text-emerald-600" />}
              </div>

              {filtered.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#082B4C] bg-slate-50 text-[#082B4C] ring-1 ring-[#082B4C]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900">{c.name}</h4>
                          {c.remainingBalance > 0 && (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Owes: {currency} {c.remainingBalance.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {c.phone}
                          </span>
                          {c.address && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {c.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total Purchases</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {currency} {c.totalPurchases.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  No customer matching "{searchTerm}" found. Click "New Customer" to create one.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
