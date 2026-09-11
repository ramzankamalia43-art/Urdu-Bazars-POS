import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  User,
  Tag,
  Percent,
  Calculator,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Receipt,
  FileText
} from 'lucide-react';
import type { Customer, Book, POSCartItem, ParkedCart, ShopSettings } from '../../../shared/types';

interface POSCartProps {
  items: POSCartItem[];
  customer: Customer | null;
  settings?: ShopSettings;
  billDiscount: number;
  billDiscountPercent: number;
  taxRate: number;
  taxEnabled: boolean;
  parkedCarts: ParkedCart[];
  onUpdateQuantity: (bookId: string, delta: number) => void;
  onSetItemDiscount: (bookId: string, discountPkr: number) => void;
  onRemoveItem: (bookId: string) => void;
  onClearCart: () => void;
  onOpenCustomerModal: () => void;
  onSetBillDiscount: (amount: number, isPercent: boolean) => void;
  onToggleTax: () => void;
  onParkCart: () => void;
  onResumeParkedCart: (cartId: string) => void;
  onOpenCheckout: () => void;
}

export const POSCart: React.FC<POSCartProps> = ({
  items,
  customer,
  settings,
  billDiscount,
  billDiscountPercent,
  taxRate,
  taxEnabled,
  parkedCarts,
  onUpdateQuantity,
  onSetItemDiscount,
  onRemoveItem,
  onClearCart,
  onOpenCustomerModal,
  onSetBillDiscount,
  onToggleTax,
  onParkCart,
  onResumeParkedCart,
  onOpenCheckout
}) => {
  const currency = settings?.currency || 'Rs.';

  const [discountInputMode, setDiscountInputMode] = useState<'pkr' | 'percent'>('pkr');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [activeItemDiscountModal, setActiveItemDiscountModal] = useState<string | null>(null);
  const [itemDiscountInput, setItemDiscountInput] = useState<string>('');

  // Calculations
  const rawSubtotal = items.reduce((acc, item) => acc + item.book.salePrice * item.quantity, 0);
  const itemDiscountsTotal = items.reduce((acc, item) => acc + (item.discount || 0) * item.quantity, 0);
  const subtotalAfterItemDiscounts = Math.max(0, rawSubtotal - itemDiscountsTotal);

  // Bill discount calculation
  let calculatedBillDiscount = billDiscount;
  if (billDiscountPercent > 0) {
    calculatedBillDiscount = Math.round((subtotalAfterItemDiscounts * billDiscountPercent) / 100);
  }
  const subtotalAfterAllDiscounts = Math.max(0, subtotalAfterItemDiscounts - calculatedBillDiscount);

  // Tax calculation
  const calculatedTax = taxEnabled ? Math.round((subtotalAfterAllDiscounts * taxRate) / 100) : 0;
  const grandTotal = subtotalAfterAllDiscounts + calculatedTax;

  const totalItemsCount = items.reduce((acc, it) => acc + it.quantity, 0);

  const handleApplyBillDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountValue) || 0;
    if (discountInputMode === 'percent') {
      onSetBillDiscount(Math.min(100, Math.max(0, val)), true);
    } else {
      onSetBillDiscount(Math.min(subtotalAfterItemDiscounts, Math.max(0, val)), false);
    }
  };

  const handleSaveItemDiscount = (bookId: string) => {
    const val = parseFloat(itemDiscountInput) || 0;
    onSetItemDiscount(bookId, Math.max(0, val));
    setActiveItemDiscountModal(null);
    setItemDiscountInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-sm select-none">
      {/* Top Customer & Parked Tickets Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
        {/* Customer Select Button */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenCustomerModal}
            className={`flex-1 flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              customer
                ? 'border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <User className={`w-4 h-4 shrink-0 ${customer ? 'text-purple-700' : 'text-slate-400'}`} />
              <span className="truncate">{customer ? customer.name : 'Walk-in Customer'}</span>
            </div>
            {customer && customer.remainingBalance > 0 && (
              <span className="bg-rose-100 text-rose-800 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0">
                Owes: {currency} {customer.remainingBalance.toLocaleString()}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-normal ml-1">Change</span>
          </button>

          {/* Park Ticket Button */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={onParkCart}
              title="Park / Hold current ticket to serve next customer"
              className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <PauseCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Hold Ticket</span>
            </button>
          )}
        </div>

        {/* Parked Tickets Switcher Pill Bar */}
        {parkedCarts.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-[11px]">
            <span className="text-slate-400 font-medium shrink-0">Held ({parkedCarts.length}):</span>
            {parkedCarts.map((pc, idx) => (
              <button
                key={pc.id}
                onClick={() => onResumeParkedCart(pc.id)}
                className="bg-amber-100/80 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300 shrink-0 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <PlayCircle className="w-3 h-3 text-amber-700" />
                <span>Ticket #{idx + 1} ({pc.items.length} items)</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Items List Container */}
      <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-600">Cart is Empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                Scan barcode or search books on the catalog to begin billing.
              </p>
            </div>
          </div>
        ) : (
          items.map((item) => {
            const isAtMaxStock = item.quantity >= item.book.availableStock;
            const lineSubtotal = (item.book.salePrice - (item.discount || 0)) * item.quantity;

            return (
              <div key={item.book.id} className="py-2.5 space-y-1.5 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                      {item.book.title}
                    </h4>
                    {item.book.urduTitle && (
                      <p className="font-urdu text-[11px] text-slate-500 truncate leading-none mt-0.5">
                        {item.book.urduTitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>Rate: {currency} {item.book.salePrice}</span>
                      <span>•</span>
                      <span className={item.book.availableStock <= 3 ? 'text-amber-600 font-bold' : ''}>
                        Avail: {item.book.availableStock}
                      </span>
                      {item.discount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-semibold">
                            Disc: -{currency} {item.discount}/item
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-slate-900 block">
                      {currency} {lineSubtotal.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.book.id)}
                      className="text-slate-300 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5 ml-auto" />
                    </button>
                  </div>
                </div>

                {/* Quantity Controls & Line Discount Button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.book.id, -1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-xs text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.book.id, 1)}
                      disabled={isAtMaxStock}
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                        isAtMaxStock
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-[#082B4C] hover:bg-[#051C33] text-white'
                      }`}
                      title={isAtMaxStock ? 'Maximum available stock reached' : 'Add 1 more'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Inline Item Discount Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItemDiscountModal(item.book.id);
                      setItemDiscountInput(item.discount ? item.discount.toString() : '');
                    }}
                    className="text-[11px] text-slate-500 hover:text-[#082B4C] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>{item.discount > 0 ? `Disc: ${currency} ${item.discount}` : 'Item Disc'}</span>
                  </button>
                </div>

                {/* Inline modal for Item Discount */}
                {activeItemDiscountModal === item.book.id && (
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-2 mt-1 animate-in fade-in">
                    <span className="text-[11px] font-semibold text-amber-900">Line Discount (PKR):</span>
                    <input
                      type="number"
                      min="0"
                      max={item.book.salePrice}
                      value={itemDiscountInput}
                      onChange={(e) => setItemDiscountInput(e.target.value)}
                      placeholder="0"
                      className="w-20 text-xs border border-amber-300 rounded px-1.5 py-0.5 bg-white font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveItemDiscount(item.book.id)}
                      className="px-2 py-0.5 bg-[#082B4C] text-white text-[11px] font-bold rounded cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItemDiscountModal(null)}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cart Footer: Discounts, Taxes & Checkout Controls */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        {/* Bill Discount & Tax Form */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Bill Discount Pill */}
          <form onSubmit={handleApplyBillDiscount} className="flex items-center gap-1 flex-1">
            <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white text-[11px]">
              <button
                type="button"
                onClick={() => setDiscountInputMode('pkr')}
                className={`px-1.5 py-1 font-bold ${discountInputMode === 'pkr' ? 'bg-[#082B4C] text-white' : 'text-slate-600'}`}
              >
                {currency}
              </button>
              <button
                type="button"
                onClick={() => setDiscountInputMode('percent')}
                className={`px-1.5 py-1 font-bold ${discountInputMode === 'percent' ? 'bg-[#082B4C] text-white' : 'text-slate-600'}`}
              >
                %
              </button>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Bill Disc"
                className="w-16 px-1.5 py-1 text-xs outline-hidden font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold rounded-md transition-colors cursor-pointer"
            >
              Set
            </button>
          </form>

          {/* Tax Toggle */}
          <button
            type="button"
            onClick={onToggleTax}
            className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              taxEnabled
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Tax ({taxRate}%)</span>
            <span className={`w-2 h-2 rounded-full ${taxEnabled ? 'bg-sky-600' : 'bg-slate-300'}`}></span>
          </button>
        </div>

        {/* Calculation Totals Breakdown */}
        <div className="space-y-1 text-xs border-t border-slate-200 pt-2 text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}):</span>
            <span className="font-semibold text-slate-800">{currency} {rawSubtotal.toLocaleString()}</span>
          </div>

          {(itemDiscountsTotal > 0 || calculatedBillDiscount > 0) && (
            <div className="flex justify-between text-amber-600 font-semibold">
              <span>Total Discounts:</span>
              <span>-{currency} {(itemDiscountsTotal + calculatedBillDiscount).toLocaleString()}</span>
            </div>
          )}

          {taxEnabled && (
            <div className="flex justify-between text-sky-800">
              <span>Sales Tax ({taxRate}%):</span>
              <span>+{currency} {calculatedTax.toLocaleString()}</span>
            </div>
          )}

          {/* Large Grand Total Display */}
          <div className="flex items-baseline justify-between pt-2 border-t border-slate-300">
            <span className="text-sm font-bold text-slate-900">GRAND TOTAL:</span>
            <div className="text-right">
              <span className="text-2xl font-black text-[#082B4C]">
                {currency} {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Button & Clear Cart */}
        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={onClearCart}
            disabled={items.length === 0}
            className="px-3 py-3 border border-slate-300 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40 transition-colors cursor-pointer"
            title="Clear Cart"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenCheckout}
            disabled={items.length === 0}
            className="flex-1 bg-[#082B4C] hover:bg-[#051C33] disabled:opacity-40 text-white py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-between shadow-md transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-1.5">
              <span>CHECKOUT (F2)</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-black">
              <span>{currency} {grandTotal.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
