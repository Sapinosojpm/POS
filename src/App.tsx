import { useEffect, useState, useRef, useCallback } from 'react';
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
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AddProductModal } from './components/AddProductModal';
import { HeldOrdersModal } from './components/HeldOrdersModal';
import { playScanSuccessSound, playScanErrorSound, triggerHaptic } from './core/hardware/scannerFeedback';
import { toast } from './store/useToastStore';
import { useCartStore } from './store/useCartStore';

export function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState<string | undefined>(undefined);

  const addItem = useCartStore((state) => state.addItem);
  const setIsOnline = useCartStore((state) => state.setIsOnline);
  const currency = useCartStore((state) => state.currency);

  // Live queries directly from Dexie (IndexedDB)
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];

  // Unified Barcode Resolution Engine (used by both Camera & Hardware Gun)
  const handleBarcodeScanned = useCallback(
    async (scannedCode: string) => {
      if (!scannedCode || !scannedCode.trim()) return;
      const cleanCode = scannedCode.trim();

      try {
        // Query Dexie by barcode first, fallback to SKU
        let found = await db.products.where('barcode').equals(cleanCode).first();
        if (!found) {
          found = await db.products.where('sku').equals(cleanCode).first();
        }

        if (found) {
          addItem(found);
          playScanSuccessSound();
          triggerHaptic('success');
          toast.success(
            'Added to Cart',
            `${found.name} • ${currency}${found.price.toFixed(2)}`
          );
        } else {
          playScanErrorSound();
          triggerHaptic('error');
          toast.error(
            'Barcode Not Found',
            `Code "${cleanCode}" is not registered in the catalog.`,
            {
              label: '+ Add New Product',
              onClick: () => {
                setPendingBarcode(cleanCode);
                setIsAddProductOpen(true);
              },
            },
            5000
          );
        }
      } catch (err) {
        console.error('Barcode lookup error:', err);
      }
    },
    [addItem, currency]
  );

  // Barcode scanner hardware listener with smart rapid-burst input interception
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const keyTimingsRef = useRef<number[]>([]);

  useEffect(() => {
    seedDatabaseIfEmpty();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Reset buffer if delay between keystrokes exceeds 180ms (typical human typing speed)
      if (timeDiff > 180) {
        barcodeBufferRef.current = '';
        keyTimingsRef.current = [];
      }

      // Check for Barcode Gun Terminator (Enter or Tab)
      if (e.key === 'Enter' || e.key === 'Tab') {
        const buffer = barcodeBufferRef.current.trim();
        const timings = keyTimingsRef.current;
        const avgTiming = timings.length > 0 ? timings.reduce((a, b) => a + b, 0) / timings.length : 999;

        // If at least 3 characters and (not inside text input OR rapid scanner gun burst < 95ms)
        if (buffer.length >= 3 && (!isInputFocused || avgTiming < 95)) {
          e.preventDefault();
          e.stopPropagation();

          // If focused on search or text input, clean up the scanned characters from the field
          if (isInputFocused && target instanceof HTMLInputElement) {
            target.blur();
            if (target.value.endsWith(buffer)) {
              const cleaned = target.value.slice(0, -buffer.length);
              target.value = cleaned;
              setSearchQuery(cleaned);
            }
          }

          barcodeBufferRef.current = '';
          keyTimingsRef.current = [];
          handleBarcodeScanned(buffer);
          return;
        }

        barcodeBufferRef.current = '';
        keyTimingsRef.current = [];
        return;
      }

      // Collect single printable characters
      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        if (timeDiff <= 180) {
          keyTimingsRef.current.push(timeDiff);
        }
      }
    };

    // Capture phase listener to intercept scanner input before inputs consume it
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleBarcodeScanned, setIsOnline]);

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
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenHeldOrders={() => setIsHeldOrdersOpen(true)}
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

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Point Camera at Barcode"
        subtitle="Rings up items directly to the cart with instant audio confirmation"
        defaultContinuous={true}
      />

      {/* Add Product Modal (Triggered by unregistered barcode action) */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setPendingBarcode(undefined);
        }}
        categories={categories}
        initialBarcode={pendingBarcode}
      />

      {/* Held / Parked Orders Drawer Modal (Triggered from Top Header) */}
      <HeldOrdersModal
        isOpen={isHeldOrdersOpen}
        onClose={() => setIsHeldOrdersOpen(false)}
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
