import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  BookOpen,
  AlertTriangle,
  ArrowUpRight,
  Printer,
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  ShoppingBag,
  Zap,
  Calendar
} from 'lucide-react';
import type { POSDashboardMetrics, Sale, ShopSettings } from '../../../shared/types';
import { api } from '../../../shared/services/api';
import { POSPrintableReceipt } from '../receipt/POSPrintableReceipt';

interface POSDashboardProps {
  settings?: ShopSettings;
  onOpenTerminal: () => void;
  onOpenTransactions: () => void;
  onOpenCustomers: () => void;
}

export const POSDashboard: React.FC<POSDashboardProps> = ({
  settings,
  onOpenTerminal,
  onOpenTransactions,
  onOpenCustomers
}) => {
  const currency = settings?.currency || 'Rs.';

  const [metrics, setMetrics] = useState<POSDashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPOSStats();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load POS dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 space-y-6 select-none">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#082B4C] tracking-tight">
              UrduBazars Retail Operations
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Terminal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales tracking, digital QR clearing, and synchronized bookstore inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchMetrics}
            title="Refresh metrics"
            className="p-2.5 text-slate-600 hover:text-[#082B4C] hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenTerminal}
            className="px-5 py-2.5 bg-[#082B4C] hover:bg-[#051C33] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Launch POS Terminal (F4)</span>
          </button>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchMetrics} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {currency} {metrics?.todaySales ? metrics.todaySales.toLocaleString() : '0'}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{metrics?.todayTransactions || 0} transactions completed</span>
              <span className="font-semibold text-slate-700">
                Avg: {currency} {metrics?.averageBasketValue ? metrics.averageBasketValue.toLocaleString() : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Cash vs Digital Split */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Digital / QR Sales</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#082B4C]">
              {currency} {metrics?.qrSalesTotal ? metrics.qrSalesTotal.toLocaleString() : '0'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex justify-between">
              <span>Cash: {currency} {metrics?.cashSalesTotal ? metrics.cashSalesTotal.toLocaleString() : '0'}</span>
              <span>Card: {currency} {metrics?.cardSalesTotal ? metrics.cardSalesTotal.toLocaleString() : '0'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Balances & Khata */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending / Khata</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-950">
              {currency} {metrics?.pendingPaymentsAmount ? metrics.pendingPaymentsAmount.toLocaleString() : '0'}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex justify-between">
              <span>{metrics?.pendingPaymentsCount || 0} unpaid tickets</span>
              <button
                onClick={onOpenCustomers}
                className="text-purple-700 font-semibold hover:underline"
              >
                View Ledgers →
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock Alert</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              (metrics?.lowStockCount || 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${
              (metrics?.lowStockCount || 0) > 0 ? 'text-rose-600' : 'text-slate-800'
            }`}>
              {metrics?.lowStockCount || 0} Items
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span>Threshold: ≤ {settings?.defaultLowStockThreshold || 5} units</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN SECTION: RECENT SALES & LOW STOCK TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT TRANSACTIONS (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-slate-800">Recent POS Transactions</h3>
            </div>
            <button
              onClick={onOpenTransactions}
              className="text-xs font-semibold text-[#082B4C] hover:underline"
            >
              All Transactions →
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Items</th>
                  <th className="py-2.5 px-4">Total</th>
                  <th className="py-2.5 px-4">Payment</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recentTransactions && metrics.recentTransactions.length > 0 ? (
                  metrics.recentTransactions.slice(0, 7).map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#082B4C]">
                        {sale.invoiceNo}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {sale.customerName || 'Walk-in'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {currency} {sale.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.paymentMethod === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentMethod === 'QR'
                            ? 'bg-amber-100 text-amber-900'
                            : sale.paymentMethod === 'Card'
                            ? 'bg-sky-100 text-sky-900'
                            : 'bg-purple-100 text-purple-900'
                        }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setReceiptSale(sale)}
                          className="p-1 text-slate-400 hover:text-[#082B4C] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Reprint Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No transactions recorded yet today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOW STOCK & TOP SELLERS COLUMN */}
        <div className="space-y-6">
          {/* Low Stock Items Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-800">Critical Stock Alerts</h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {metrics?.lowStockCount || 0} Low
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {metrics?.lowStockItems && metrics.lowStockItems.length > 0 ? (
                metrics.lowStockItems.slice(0, 5).map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{b.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {b.barcode || b.isbn || b.class}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                        b.availableStock <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.availableStock} Left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  All active books have healthy stock levels.
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Products Today */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800">Top Sellers Today</h3>
              <span className="text-[10px] text-slate-400">By quantity</span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 text-xs">
              {metrics?.topSellingToday && metrics.topSellingToday.length > 0 ? (
                metrics.topSellingToday.map((item, idx) => (
                  <div key={item.bookId} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-800 truncate">{item.title}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900">{item.quantity} sold</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No sales recorded yet today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal if clicked */}
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
