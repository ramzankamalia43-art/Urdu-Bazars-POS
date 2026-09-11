import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Zap,
  History,
  BarChart3,
  Maximize2,
  Minimize2,
  Building2,
  Users,
  Store,
  HelpCircle,
  KeyRound,
  ShieldAlert,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { UrduBazarsLogo } from '../shared/components/UrduBazarsLogo';
import { POSTerminal } from './components/terminal/POSTerminal';
import { POSDashboard } from './components/dashboard/POSDashboard';
import { POSTransactionsView } from './components/transactions/POSTransactionsView';
import { POSReportsView } from './components/reports/POSReportsView';
import type { Book, Customer, ShopSettings, Sale, UserRole } from '../shared/types';
import { api } from '../shared/services/api';

interface POSAppProps {
  onOpenStorefront?: () => void;
  onOpenAdmin?: () => void;
  isStandalone?: boolean;
}

export const POSApp: React.FC<POSAppProps> = ({ onOpenStorefront, onOpenAdmin, isStandalone = false }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'dashboard' | 'transactions' | 'reports'>('terminal');

  // Core Data
  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<ShopSettings | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  // Cashier & Session
  const [cashierName, setCashierName] = useState<string>('Ahmad Raza');
  const [cashierRole, setCashierRole] = useState<UserRole>('CASHIER');
  const [showCashierModal, setShowCashierModal] = useState<boolean>(false);
  const [tempPin, setTempPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedBooks, fetchedCustomers, fetchedSettings] = await Promise.all([
        api.getBooks(),
        api.getCustomers(),
        api.getSettings()
      ]);
      setBooks(fetchedBooks);
      setCustomers(fetchedCustomers);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error bootstrapping POS application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleSwitchCashier = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    // Conceptually support cashier PIN authentication
    if (tempPin === '1234' || tempPin === '0000') {
      setCashierName('Muhammad Usman');
      setCashierRole('MANAGER');
      setShowCashierModal(false);
      setTempPin('');
    } else if (tempPin === '9999') {
      setCashierName('Shop Owner / Admin');
      setCashierRole('ADMIN');
      setShowCashierModal(false);
      setTempPin('');
    } else if (tempPin === '1111') {
      setCashierName('Ahmad Raza');
      setCashierRole('CASHIER');
      setShowCashierModal(false);
      setTempPin('');
    } else {
      setPinError('Invalid PIN code. Try 1111 (Cashier), 1234 (Manager), or 9999 (Admin).');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#082B4C] text-slate-800 font-sans overflow-hidden">
      {/* Top POS System Header */}
      <header className="bg-[#082B4C] text-white px-4 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0 select-none">
        {/* Brand & Terminal Identifier */}
        <div className="flex items-center gap-4">
          <UrduBazarsLogo size="sm" variant="horizontal" lightText />
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/15">
            <span className="text-[10px] font-bold bg-[#F47700] text-white uppercase tracking-wider px-2 py-0.5 rounded-full">
              POS Terminal 01
            </span>
            <span className="text-xs text-amber-200/80 font-medium hidden md:inline font-urdu">
              ریٹیل بلنگ سسٹم
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-white text-[#082B4C] shadow-sm'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Terminal (F3)</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-[#082B4C] shadow-sm'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-white text-[#082B4C] shadow-sm'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white text-[#082B4C] shadow-sm'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>
        </nav>

        {/* Right Tools & Cashier Info */}
        <div className="flex items-center gap-3 text-xs">
          {/* Cashier Badge */}
          <button
            onClick={() => setShowCashierModal(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/15 transition-colors cursor-pointer text-left"
            title="Click to Switch Cashier / Enter PIN"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <span className="font-bold block leading-tight text-white">{cashierName}</span>
              <span className="text-[10px] text-amber-300/80 block leading-none">{cashierRole}</span>
            </div>
          </button>

          {/* Shortcuts Guide Button */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Keyboard Shortcuts Cheatsheet"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Toggle Fullscreen Mode (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Switch to Online Storefront */}
          {onOpenStorefront && (
            <button
              onClick={onOpenStorefront}
              className="bg-[#F47700] hover:bg-[#D46600] text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Open UrduBazars Online E-Commerce Storefront"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Online Store</span>
            </button>
          )}

          {/* Switch to Back-Office */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Open UrduBazars Back-Office & Inventory Management"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Back-Office</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-400 space-y-3">
            <div className="w-8 h-8 border-4 border-[#082B4C] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-xs text-slate-600">Loading UrduBazars POS Engine...</p>
          </div>
        ) : (
          <>
            {activeTab === 'terminal' && (
              <POSTerminal
                books={books}
                customers={customers}
                settings={settings}
                cashierName={cashierName}
                onRefreshBooks={async () => {
                  const updated = await api.getBooks();
                  setBooks(updated);
                }}
                onSaleCompleted={() => {
                  // reload customers to update khata balances
                  api.getCustomers().then(setCustomers);
                }}
              />
            )}

            {activeTab === 'dashboard' && (
              <POSDashboard
                settings={settings}
                onOpenTerminal={() => setActiveTab('terminal')}
                onOpenTransactions={() => setActiveTab('transactions')}
                onOpenCustomers={() => setActiveTab('terminal')}
              />
            )}

            {activeTab === 'transactions' && (
              <POSTransactionsView
                settings={settings}
                cashierName={cashierName}
                onSaleStatusChanged={loadData}
              />
            )}

            {activeTab === 'reports' && (
              <POSReportsView settings={settings} />
            )}
          </>
        )}
      </main>

      {/* Cashier PIN Switch Modal */}
      {showCashierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#082B4C] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Switch Cashier / Shift Login</h3>
              </div>
              <button
                onClick={() => setShowCashierModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSwitchCashier} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Enter your 4-digit Cashier / Manager PIN to switch active register session:
              </p>

              {pinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  {pinError}
                </div>
              )}

              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="Enter PIN..."
                value={tempPin}
                onChange={(e) => setTempPin(e.target.value)}
                className="w-full text-center text-2xl tracking-[0.4em] font-mono font-bold py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#082B4C]"
              />

              <div className="text-[11px] text-slate-400 text-center">
                Demo PINs: <strong>1111</strong> (Cashier), <strong>1234</strong> (Manager), <strong>9999</strong> (Admin)
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashierModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#082B4C] text-white text-xs font-bold rounded-lg"
                >
                  Confirm Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#082B4C] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">POS Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 divide-y divide-slate-100 text-xs space-y-2">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 font-medium">Focus Product Search</span>
                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono font-bold">F1</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 font-medium">Proceed to Checkout & Pay</span>
                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono font-bold">F2</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 font-medium">Switch to POS Terminal</span>
                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono font-bold">F3</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 font-medium">New Sale Ticket / Clear Cart</span>
                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono font-bold">F4</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 font-medium">Select Cash Payment in Checkout</span>
                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono font-bold">F6</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 font-medium">Select Card Payment in Checkout</span>
                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono font-bold">F7</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 font-medium">Open QR Code Payment Scanner</span>
                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono font-bold">F8</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-700 font-medium">Barcode Hardware Scanner</span>
                <span className="text-emerald-700 font-semibold">Automatic via USB/Bluetooth</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 bg-[#082B4C] text-white text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSApp;
