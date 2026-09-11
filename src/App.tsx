import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { AppLayout, type ActiveTab } from './components/layout/AppLayout';

// Modular Apps
import { POSApp } from './pos/POSApp';
import { StorefrontApp } from './ecommerce/StorefrontApp';

// Back-Office Views
import { RemoteOwnerDashboard } from './components/dashboard/RemoteOwnerDashboard';
import { BookInventoryView } from './components/books/BookInventoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { CustomersKhataView } from './components/customers/CustomersKhataView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { OnlineOrdersAdminView } from './components/orders/OnlineOrdersAdminView';
import { StoreSettingsView } from './components/settings/StoreSettingsView';

export type AppEnvironment = 'pos' | 'ecommerce' | 'admin';

export function App() {
  // Determine initial app mode based on URL parameter or hash
  const [appMode, setAppMode] = useState<AppEnvironment>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeParam = searchParams.get('mode');
    const hash = window.location.hash.toLowerCase();

    if (modeParam === 'pos' || hash.includes('pos')) return 'pos';
    if (modeParam === 'admin' || hash.includes('admin')) return 'admin';
    return 'pos'; // Default to the newly architected POS application
  });

  const [adminActiveTab, setAdminActiveTab] = useState<ActiveTab>('dashboard');

  // Sync state with URL hash when mode changes
  const handleSwitchMode = (mode: AppEnvironment) => {
    setAppMode(mode);
    window.location.hash = mode;
  };

  // Listen to hashchange
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('pos')) setAppMode('pos');
      else if (hash.includes('ecommerce') || hash.includes('store')) setAppMode('ecommerce');
      else if (hash.includes('admin')) setAppMode('admin');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          {/* APPLICATION RUNTIME MODES */}
          {appMode === 'pos' && (
            <POSApp
              onOpenStorefront={() => handleSwitchMode('ecommerce')}
              onOpenAdmin={() => handleSwitchMode('admin')}
              isStandalone={true}
            />
          )}

          {appMode === 'ecommerce' && (
            <StorefrontApp
              onOpenPOS={() => handleSwitchMode('pos')}
              onOpenAdmin={() => handleSwitchMode('admin')}
              isStandalone={true}
            />
          )}

          {appMode === 'admin' && (
            <AppLayout
              activeTab={adminActiveTab}
              setActiveTab={(tab) => {
                if (tab === 'pos') {
                  handleSwitchMode('pos');
                } else if (tab === 'storefront') {
                  handleSwitchMode('ecommerce');
                } else {
                  setAdminActiveTab(tab);
                }
              }}
            >
              {adminActiveTab === 'dashboard' && <RemoteOwnerDashboard />}
              {adminActiveTab === 'pos' && (
                <POSApp onOpenStorefront={() => handleSwitchMode('ecommerce')} />
              )}
              {adminActiveTab === 'books' && <BookInventoryView />}
              {adminActiveTab === 'purchases' && <PurchasesView />}
              {adminActiveTab === 'customers' && <CustomersKhataView />}
              {adminActiveTab === 'suppliers' && <SuppliersView />}
              {adminActiveTab === 'orders' && <OnlineOrdersAdminView />}
              {adminActiveTab === 'settings' && <StoreSettingsView />}
            </AppLayout>
          )}
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
