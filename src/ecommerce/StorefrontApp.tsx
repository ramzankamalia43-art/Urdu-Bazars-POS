import React from 'react';
import { StorefrontHome } from '../components/storefront/StorefrontHome';
import { useStore } from '../context/StoreContext';
import { UrduBazarsLogo } from '../shared/components/UrduBazarsLogo';

interface StorefrontAppProps {
  onOpenPOS?: () => void;
  onOpenAdmin?: () => void;
  isStandalone?: boolean;
}

/**
 * UrduBazars.com Independent E-Commerce Online Storefront Application
 * Fully decoupled from POS, handles customer browsing, online orders,
 * delivery calculations, and order tracking with real-time synchronized inventory.
 */
export const StorefrontApp: React.FC<StorefrontAppProps> = ({ onOpenPOS, onOpenAdmin, isStandalone = false }) => {
  const { settings } = useStore();

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-slate-800 selection:bg-[#F47700] selection:text-white">
      {/* Top Banner for Independent Storefront Mode */}
      <div className="bg-[#082B4C] text-white text-xs py-2 px-4 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#F47700] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              UrduBazars Online
            </span>
            <span className="hidden sm:inline text-amber-200/90 font-urdu">
              کتاب سے دنیا تک — پاکستان کا سب سے بڑا آن لائن کتب بازار
            </span>
            <span className="sm:hidden text-slate-200">
              Pakistan's Premier Online Bookstore
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-300">
              Helpline / WhatsApp: <strong className="text-white">{settings?.phone || '+92 300 1234567'}</strong>
            </span>
            {onOpenPOS && (
              <button
                onClick={onOpenPOS}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded border border-amber-400/30 text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Open Retail Point of Sale System"
              >
                <span>Counter POS Terminal</span>
                <span className="text-xs">→</span>
              </button>
            )}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-0.5 rounded border border-white/20 text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Open Back-Office & Inventory"
              >
                <span>Back-Office</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main E-Commerce Storefront Content */}
      <main className="flex-1">
        <StorefrontHome />
      </main>
    </div>
  );
};

export default StorefrontApp;
