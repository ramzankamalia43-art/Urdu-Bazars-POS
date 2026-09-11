import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Download,
  Printer,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  BookOpen,
  PieChart,
  Award
} from 'lucide-react';
import type { Sale, ShopSettings } from '../../../shared/types';
import { api } from '../../../shared/services/api';

interface POSReportsViewProps {
  settings?: ShopSettings;
}

export const POSReportsView: React.FC<POSReportsViewProps> = ({ settings }) => {
  const currency = settings?.currency || 'Rs.';

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'today' | 'this_week' | 'this_month' | 'all'>('today');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getSales();
        setSales(data);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredSales = sales.filter((s) => {
    if (s.status === 'Cancelled') return false;
    const saleDate = new Date(s.date);
    const now = new Date();

    if (timeframe === 'today') {
      return saleDate.toDateString() === now.toDateString();
    } else if (timeframe === 'this_week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= oneWeekAgo;
    } else if (timeframe === 'this_month') {
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalTransactions = filteredSales.length;
  const avgBasket = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
  const totalDiscounts = filteredSales.reduce(
    (sum, s) => sum + (s.itemDiscount || 0) + (s.billDiscount || 0),
    0
  );
  const totalTaxCollected = filteredSales.reduce((sum, s) => sum + (s.tax || 0), 0);

  // By Payment Method
  const methodStats: Record<string, { count: number; total: number }> = {};
  filteredSales.forEach((s) => {
    const m = s.paymentMethod;
    if (!methodStats[m]) methodStats[m] = { count: 0, total: 0 };
    methodStats[m].count += 1;
    methodStats[m].total += s.paidAmount;
  });

  // Top books
  const bookSales: Record<string, { title: string; count: number; revenue: number }> = {};
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!bookSales[item.bookId]) {
        bookSales[item.bookId] = { title: item.title, count: 0, revenue: 0 };
      }
      bookSales[item.bookId].count += item.quantity;
      bookSales[item.bookId].revenue += item.subtotal;
    });
  });

  const topBooks = Object.values(bookSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 7);

  // Cashier Performance
  const cashierStats: Record<string, { count: number; revenue: number }> = {};
  filteredSales.forEach((s) => {
    const c = s.cashierName || 'Cashier';
    if (!cashierStats[c]) cashierStats[c] = { count: 0, revenue: 0 };
    cashierStats[c].count += 1;
    cashierStats[c].revenue += s.grandTotal;
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 space-y-6 select-none">
      {/* Top Header & Timeframe Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#082B4C] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F47700]" />
            <span>POS Sales Performance & Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            End-of-day register tally, digital payments clearing, and cashier leaderboard.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'today' ? 'bg-[#082B4C] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('this_week')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'this_week' ? 'bg-[#082B4C] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeframe('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'this_month' ? 'bg-[#082B4C] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeframe === 'all' ? 'bg-[#082B4C] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handlePrintReport}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Print Summary Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Sales</span>
          <div className="text-2xl font-black text-[#082B4C] mt-2">
            {currency} {totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">{totalTransactions} orders completed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Transaction</span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {currency} {avgBasket.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Average basket per customer</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discounts Given</span>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {currency} {totalDiscounts.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Total promotional & counter discounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sales Tax</span>
          <div className="text-2xl font-black text-sky-800 mt-2">
            {currency} {totalTaxCollected.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Total collected tax</p>
        </div>
      </div>

      {/* TWO COLUMN PERFORMANCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <span>Revenue by Payment Method</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(methodStats).map(([meth, data]) => {
              const pct = totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0;
              return (
                <div key={meth} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      {meth === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                      {meth === 'QR' && <QrCode className="w-3.5 h-3.5 text-amber-600" />}
                      {meth === 'Card' && <CreditCard className="w-3.5 h-3.5 text-sky-600" />}
                      {meth === 'Udhaar' && <BookOpen className="w-3.5 h-3.5 text-purple-600" />}
                      {meth} ({data.count} sales)
                    </span>
                    <span className="text-slate-900 font-bold">
                      {currency} {data.total.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        meth === 'Cash'
                          ? 'bg-emerald-500'
                          : meth === 'QR'
                          ? 'bg-amber-500'
                          : meth === 'Card'
                          ? 'bg-sky-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {Object.keys(methodStats).length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No payment data for this period.
              </div>
            )}
          </div>
        </div>

        {/* Cashier Leaderboard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#F47700]" />
            <span>Cashier Performance Leaderboard</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {Object.entries(cashierStats).map(([cashier, data], idx) => (
              <div key={cashier} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{cashier}</h4>
                    <span className="text-[11px] text-slate-400">{data.count} receipts processed</span>
                  </div>
                </div>
                <span className="font-extrabold text-[#082B4C]">
                  {currency} {data.revenue.toLocaleString()}
                </span>
              </div>
            ))}

            {Object.keys(cashierStats).length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No cashier data for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products Ranking */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#082B4C]" />
          <span>Top Revenue Generating Books</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Book Title</th>
                <th className="py-2.5 px-4">Units Sold</th>
                <th className="py-2.5 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topBooks.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{b.title}</td>
                  <td className="py-2.5 px-4 text-slate-600 font-semibold">{b.count} units</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {currency} {b.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
              {topBooks.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    No sales data found for the selected timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
