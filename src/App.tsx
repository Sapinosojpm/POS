import { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './core/db';
import { seedDatabaseIfEmpty } from './core/db/seed';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProductCatalog } from './components/ProductCatalog';
import { CartView } from './components/CartView';
import { InventoryView } from './components/InventoryView';
import { OrderHistoryView } from './components/OrderHistoryView';
import { ShiftScheduleView } from './components/ShiftScheduleView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { CheckoutModal } from './components/CheckoutModal';
import { NotificationStack } from './components/NotificationStack';
import { ToastContainer } from './components/ToastContainer';
import { useCartStore } from './store/useCartStore';

export function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const setIsOnline = useCartStore((state) => state.setIsOnline);

  // Live queries directly from Dexie (IndexedDB)
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];

  // Barcode scanner hardware listener
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    seedDatabaseIfEmpty();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current;
          barcodeBufferRef.current = '';

          db.products.where('barcode').equals(scannedCode).first().then((found) => {
            if (found) {
              addItem(found);
            }
          });
        }
        barcodeBufferRef.current = '';
        return;
      }

      if (timeDiff > 100) {
        barcodeBufferRef.current = '';
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addItem, setIsOnline]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* 1. Slim Left Icon Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Workspace Dynamic Screen */}
      {activeTab === 'pos' ? (
        <>
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            <Header
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
            />

            <ProductCatalog
              products={products}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              searchQuery={searchQuery}
            />
          </div>

          {/* Right Invoice Panel */}
          <CartView onOpenCheckout={() => setIsCheckoutOpen(true)} />
        </>
      ) : activeTab === 'inventory' ? (
        <InventoryView
          products={products}
          categories={categories}
        />
      ) : activeTab === 'orders' ? (
        <OrderHistoryView />
      ) : activeTab === 'calendar' ? (
        <ShiftScheduleView />
      ) : activeTab === 'analytics' ? (
        <ReportsView />
      ) : activeTab === 'settings' ? (
        <SettingsView />
      ) : (
        /* Fallback for other tabs */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800">Section Under Construction</h2>
          <p className="text-sm text-slate-400 mt-1">
            Tap the POS grid or Inventory icon in the left sidebar to navigate.
          </p>
          <button
            onClick={() => setActiveTab('pos')}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Back to Cashier Register
          </button>
        </div>
      )}

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderCompleted={() => {}}
      />

      {/* Premium Notification Stack */}
      <NotificationStack
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Floating Modern Toast System */}
      <ToastContainer />
    </div>
  );
}

export default App;
