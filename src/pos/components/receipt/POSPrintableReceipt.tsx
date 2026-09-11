import React from 'react';
import { Printer, X, CheckCircle, ArrowLeft } from 'lucide-react';
import type { Sale, ShopSettings } from '../../../shared/types';
import { UrduBazarsLogo } from '../../../shared/components/UrduBazarsLogo';

interface POSPrintableReceiptProps {
  sale: Sale;
  settings?: ShopSettings;
  onClose?: () => void;
  onNewSale?: () => void;
  autoPrint?: boolean;
}

export const POSPrintableReceipt: React.FC<POSPrintableReceiptProps> = ({
  sale,
  settings,
  onClose,
  onNewSale
}) => {
  const currency = settings?.currency || 'Rs.';

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = new Date(sale.date).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden during window.print()) */}
        <div className="bg-[#082B4C] text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm leading-tight">Sale Completed Successfully</h3>
              <p className="text-[11px] text-slate-300">Invoice #{sale.invoiceNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#F47700] hover:bg-[#D46600] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (Ctrl+P)</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-300 hover:text-white p-1 rounded-md transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action button bar for cashier */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs no-print">
          <span className="text-slate-600">Standard 80mm / 58mm POS Receipt</span>
          {onNewSale && (
            <button
              onClick={onNewSale}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>+ New Sale (F4)</span>
            </button>
          )}
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 bg-white overflow-y-auto max-h-[75vh]">
          <div id="printable-receipt" className="font-mono text-slate-800 text-xs leading-relaxed max-w-[320px] mx-auto">
            {/* Header: UrduBazars Logo & Branding */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <div className="flex justify-center mb-1.5">
                <UrduBazarsLogo size="sm" variant="horizontal" />
              </div>
              <p className="font-urdu text-sm font-semibold text-slate-700 leading-tight">
                {settings?.shopUrduName || 'اردو بازارز'} — {settings?.tagline || 'کتاب سے دنیا تک'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {settings?.address || 'Shop # 14-18, Urdu Bazar, Anarkali, Lahore'}
              </p>
              <p className="text-[10px] text-slate-500">
                Phone: {settings?.phone || '+92 300 1234567'} | WhatsApp: {settings?.whatsappNumber || '+92 300 1234567'}
              </p>
              {settings?.email && (
                <p className="text-[10px] text-slate-500">{settings.email}</p>
              )}
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">INVOICE #:</span>
                <span className="font-bold text-slate-900">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DATE & TIME:</span>
                <span>{formattedDate} {formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CASHIER:</span>
                <span className="font-medium">{sale.cashierName || 'Counter Cashier'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CUSTOMER:</span>
                <span className="font-medium truncate max-w-[170px]">{sale.customerName || 'Walk-in Customer'}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">PHONE:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
              {sale.paymentDetails?.referenceId && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">PAYMENT REF:</span>
                  <span className="font-mono text-emerald-700 font-semibold">{sale.paymentDetails.referenceId}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <div className="grid grid-cols-12 font-bold text-[10px] text-slate-600 pb-1 border-b border-slate-200">
                <span className="col-span-6">ITEM</span>
                <span className="col-span-2 text-center">QTY</span>
                <span className="col-span-2 text-right">RATE</span>
                <span className="col-span-2 text-right">TOTAL</span>
              </div>

              <div className="divide-y divide-slate-100 py-1">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="py-1.5 text-[11px]">
                    <div className="font-medium text-slate-900 leading-snug">
                      {item.title}
                    </div>
                    {item.urduTitle && (
                      <div className="font-urdu text-[10px] text-slate-500">
                        {item.urduTitle}
                      </div>
                    )}
                    <div className="grid grid-cols-12 text-slate-500 text-[10px] mt-0.5">
                      <span className="col-span-6 text-slate-400 text-[9px] font-mono">
                        {item.barcode || item.isbn || ''}
                      </span>
                      <span className="col-span-2 text-center font-medium text-slate-800">
                        {item.quantity}
                      </span>
                      <span className="col-span-2 text-right">
                        {item.salePrice}
                      </span>
                      <span className="col-span-2 text-right font-semibold text-slate-900">
                        {currency} {item.subtotal.toLocaleString()}
                      </span>
                    </div>
                    {item.discount > 0 && (
                      <div className="text-[10px] text-amber-600 text-right">
                        Discount: -{currency} {item.discount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span>{currency} {sale.subtotal.toLocaleString()}</span>
              </div>

              {(sale.itemDiscount > 0 || sale.billDiscount > 0) && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Total Discount:</span>
                  <span>-{currency} {((sale.itemDiscount || 0) + (sale.billDiscount || 0)).toLocaleString()}</span>
                </div>
              )}

              {sale.tax !== undefined && sale.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Sales Tax ({sale.taxRate || 0}%):</span>
                  <span>+{currency} {sale.tax.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-300">
                <span>GRAND TOTAL:</span>
                <span className="text-base">{currency} {sale.grandTotal.toLocaleString()}</span>
              </div>

              <div className="pt-1 text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {sale.paymentMethod} {sale.paymentDetails?.qrProvider ? `(${sale.paymentDetails.qrProvider})` : ''}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Tendered:</span>
                  <span className="font-semibold">{currency} {sale.paidAmount.toLocaleString()}</span>
                </div>

                {sale.paymentMethod === 'Cash' && sale.paidAmount > sale.grandTotal && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Change Returned:</span>
                    <span>{currency} {(sale.paidAmount - sale.grandTotal).toLocaleString()}</span>
                  </div>
                )}

                {sale.remainingAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance / Udhaar:</span>
                    <span>{currency} {sale.remainingAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Barcode & Footer */}
            <div className="pt-3 text-center space-y-1.5">
              {/* Pseudo-barcode display */}
              <div className="flex flex-col items-center justify-center">
                <div className="font-mono text-lg tracking-[0.25em] font-black scale-y-125 select-none text-slate-900">
                  ||| | |||| | || ||| || |||
                </div>
                <span className="text-[9px] text-slate-500 font-mono tracking-wider mt-0.5">
                  *{sale.invoiceNo}*
                </span>
              </div>

              <p className="font-urdu text-xs font-semibold text-slate-800 leading-snug pt-1">
                کتاب سے دنیا تک — تشریف آوری کا شکریہ
              </p>
              <p className="text-[9px] text-slate-500 whitespace-pre-line leading-tight">
                {settings?.receiptFooter || 'Books once sold can be exchanged within 3 days with receipt.\nNo cash refund.'}
              </p>
              <p className="text-[8px] text-slate-400">
                Powered by UrduBazars Retail POS Engine
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3 no-print">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to POS</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#082B4C] hover:bg-[#051C33] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Receipt</span>
            </button>
            {onNewSale && (
              <button
                onClick={onNewSale}
                className="px-5 py-2 bg-[#F47700] hover:bg-[#D46600] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <span>New Sale (F4)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
