import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Filter,
  Printer,
  RotateCcw,
  Eye,
  FileText,
  AlertTriangle,
  X,
  CheckCircle,
  Download
} from 'lucide-react';
import type { Sale, ShopSettings } from '../../../shared/types';
import { api } from '../../../shared/services/api';
import { POSPrintableReceipt } from '../receipt/POSPrintableReceipt';

interface POSTransactionsViewProps {
  settings?: ShopSettings;
  cashierName: string;
  onSaleStatusChanged?: () => void;
}

export const POSTransactionsView: React.FC<POSTransactionsViewProps> = ({
  settings,
  cashierName,
  onSaleStatusChanged
}) => {
  const currency = settings?.currency || 'Rs.';

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('today');

  // Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isRefunding, setIsRefunding] = useState<boolean>(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await api.getSales();
      setSales(data);
    } catch (err) {
      console.error('Failed to load sales transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleRefundSale = async (sale: Sale) => {
    if (!confirm(`Are you sure you want to refund/return Sale #${sale.invoiceNo}? This will restock ${sale.items.length} items to inventory.`)) {
      return;
    }

    setIsRefunding(true);
    setRefundError(null);

    try {
      await api.cancelSale(sale.id, cashierName);
      await fetchSales();
      if (onSaleStatusChanged) onSaleStatusChanged();
      setSelectedSale(null);
    } catch (err: any) {
      setRefundError(err?.message || 'Failed to refund sale');
    } finally {
      setIsRefunding(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchInvoice = s.invoiceNo.toLowerCase().includes(q);
      const matchCustomer = s.customerName.toLowerCase().includes(q) || (s.customerPhone && s.customerPhone.includes(q));
      const matchRef = s.paymentDetails?.referenceId?.toLowerCase().includes(q);
      if (!matchInvoice && !matchCustomer && !matchRef) return false;
    }

    // Method Filter
    if (methodFilter !== 'All' && s.paymentMethod !== methodFilter) return false;

    // Status Filter
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;

    // Date Filter
    if (dateFilter !== 'all') {
      const saleDate = new Date(s.date);
      const now = new Date();
      if (dateFilter === 'today') {
        if (saleDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'yesterday') {
        const yDate = new Date(now);
        yDate.setDate(yDate.getDate() - 1);
        if (saleDate.toDateString() !== yDate.toDateString()) return false;
      } else if (dateFilter === 'this_week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (saleDate < oneWeekAgo) return false;
      }
    }

    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 space-y-5 select-none">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Invoice #, Customer, Phone, or QR Ref..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#082B4C]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="today">Today's Sales</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">Last 7 Days</option>
              <option value="all">All Dates</option>
            </select>

            {/* Payment Method filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="QR">QR Code</option>
              <option value="Card">Card</option>
              <option value="Udhaar">Khata / Udhaar</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Refunded / Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => {
                const formattedDate = new Date(sale.date).toLocaleDateString('en-PK', {
                  day: '2-digit',
                  month: 'short'
                });
                const formattedTime = new Date(sale.date).toLocaleTimeString('en-PK', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#082B4C]">
                      {sale.invoiceNo}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formattedDate} <span className="text-[11px] text-slate-400">{formattedTime}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {sale.customerName || 'Walk-in Customer'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {currency} {sale.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                          sale.paymentMethod === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentMethod === 'QR'
                            ? 'bg-amber-100 text-amber-900'
                            : sale.paymentMethod === 'Card'
                            ? 'bg-sky-100 text-sky-900'
                            : 'bg-purple-100 text-purple-900'
                        }`}>
                          {sale.paymentMethod} {sale.paymentDetails?.qrProvider ? `(${sale.paymentDetails.qrProvider})` : ''}
                        </span>
                        {sale.paymentDetails?.referenceId && (
                          <span className="font-mono text-[10px] text-slate-400 mt-0.5">
                            {sale.paymentDetails.referenceId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {sale.cashierName || 'Cashier'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sale.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1.5 text-slate-500 hover:text-[#082B4C] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setReceiptSale(sale)}
                          className="p-1.5 text-slate-500 hover:text-[#082B4C] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {sale.status === 'Completed' && (
                          <button
                            onClick={() => handleRefundSale(sale)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Refund / Return Sale"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No transactions matching the selected filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
            <div className="bg-[#082B4C] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Invoice #{selectedSale.invoiceNo}</h3>
                <p className="text-xs text-amber-200/90 font-mono">
                  {new Date(selectedSale.date).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer:</span>
                  <span className="font-bold text-slate-800">{selectedSale.customerName}</span>
                  {selectedSale.customerPhone && (
                    <span className="text-slate-500 block font-mono text-[11px]">{selectedSale.customerPhone}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Method:</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedSale.paymentMethod}</span>
                  {selectedSale.paymentDetails?.referenceId && (
                    <span className="text-emerald-700 block font-mono text-[11px]">
                      Ref: {selectedSale.paymentDetails.referenceId}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Itemized Products</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Qty: {item.quantity} × {currency} {item.salePrice}
                          {item.discount > 0 ? ` (Disc: -${item.discount})` : ''}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {currency} {item.subtotal.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{currency} {selectedSale.subtotal.toLocaleString()}</span>
                </div>
                {selectedSale.itemDiscount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Line Discounts:</span>
                    <span>-{currency} {selectedSale.itemDiscount.toLocaleString()}</span>
                  </div>
                )}
                {selectedSale.billDiscount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Bill Discount:</span>
                    <span>-{currency} {selectedSale.billDiscount.toLocaleString()}</span>
                  </div>
                )}
                {selectedSale.tax !== undefined && selectedSale.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Sales Tax:</span>
                    <span>+{currency} {selectedSale.tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-[#082B4C] pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>{currency} {selectedSale.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="p-3 bg-amber-50 rounded-xl text-amber-900 border border-amber-200">
                  <span className="font-bold block">Notes:</span>
                  <span>{selectedSale.notes}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
              <button
                onClick={() => {
                  setReceiptSale(selectedSale);
                  setSelectedSale(null);
                }}
                className="px-4 py-2 bg-[#082B4C] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              {selectedSale.status === 'Completed' && (
                <button
                  onClick={() => handleRefundSale(selectedSale)}
                  disabled={isRefunding}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isRefunding ? 'Refunding...' : 'Refund & Restock'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptSale && (
        <POSPrintableReceipt
          sale={receiptSale}
          settings={settings}
          onClose={() => setReceiptSale(null)}
        />
      )}
    </div>
  );
};
