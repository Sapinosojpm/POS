import { useEffect, useState, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { db } from './core/db';
import { seedDatabaseIfEmpty } from './core/db/seed';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
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
import { SyncModal } from './components/SyncModal';
import { useSyncManager } from './core/sync/useSyncManager';
import { playScanSuccessSound, playScanErrorSound, triggerHaptic } from './core/hardware/scannerFeedback';
import { toast } from './store/useToastStore';
import { useCartStore } from './store/useCartStore';
import { useAuthStore } from './store/useAuthStore';
import { LoginView } from './components/LoginView';

export function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPortraitCartOpen, setIsPortraitCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState<string | undefined>(undefined);
  const [scanFlash, setScanFlash] = useState(false);
  const [isInvoiceCollapsed, setIsInvoiceCollapsed] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const scanFlashTimerRef = useRef<number | null>(null);

  // Initialize background PostgreSQL sync engine
  useSyncManager();

  const addItem = useCartStore((state) => state.addItem);
  const setIsOnline = useCartStore((state) => state.setIsOnline);
  const currency = useCartStore((state) => state.currency);
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.getTotal());
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
          setScanFlash(true);
          if (scanFlashTimerRef.current) window.clearTimeout(scanFlashTimerRef.current);
          scanFlashTimerRef.current = window.setTimeout(() => setScanFlash(false), 1800);
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

  const { isAuthenticated, currentUser } = useAuthStore();

  // Authentication Lock: Must enter PIN before reaching the POS
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800 pb-16 md:pb-0">
      {/* 1. Slim Left Icon Sidebar (Collapsible on tablets) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={() => setIsNavCollapsed(true)}
      />

      {/* 1b. Phone / narrow-portrait bottom tab bar (< 768px) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Workspace Dynamic Screen */}
      {activeTab === 'pos' ? (
        <>
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
            <Header
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenHeldOrders={() => setIsHeldOrdersOpen(true)}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
              onOpenCart={() => {
                if (window.innerWidth >= 1024 && isInvoiceCollapsed) {
                  setIsInvoiceCollapsed(false);
                } else {
                  setIsPortraitCartOpen(true);
                }
              }}
              onToggleNav={() => setIsNavCollapsed((prev) => !prev)}
              cartItemsCount={cartItemsCount}
              scanFlash={scanFlash}
              isCartCollapsed={isInvoiceCollapsed}
              isNavCollapsed={isNavCollapsed}
            />

            <ProductCatalog
              products={products}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              searchQuery={searchQuery}
            />

            {/* Portrait Tablet Floating Bottom Cart Dock (Visible on < lg screens when cart has items) */}
            {cartItemsCount > 0 && !isPortraitCartOpen && (
              <div className="lg:hidden fixed bottom-[76px] md:bottom-4 left-3 right-3 md:left-24 md:right-4 z-30 animate-in slide-in-from-bottom-4 duration-200">
                <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPortraitCartOpen(true)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer select-none"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm text-white">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-400">
                        {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'} in invoice
                      </div>
                      <div className="text-sm font-black text-white truncate">
                        {currency}{cartTotal.toFixed(2)}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPortraitCartOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0 transition"
                  >
                    <span>Review Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Invoice Panel (Permanent on Landscape / Desktop >= lg, Collapsible) */}
          {!isInvoiceCollapsed && (
            <div className="hidden lg:flex h-full shrink-0 animate-in slide-in-from-right duration-150">
              <CartView
                onOpenCheckout={() => setIsCheckoutOpen(true)}
                onToggleCollapse={() => setIsInvoiceCollapsed(true)}
              />
            </div>
          )}

          {/* Desktop Collapsed Floating Invoice Pill */}
          {isInvoiceCollapsed && (
            <button
              type="button"
              onClick={() => setIsInvoiceCollapsed(false)}
              className="hidden lg:flex fixed bottom-6 right-6 z-30 bg-slate-900/95 hover:bg-slate-900 text-white font-bold text-xs p-3.5 rounded-2xl shadow-2xl border border-slate-700 items-center gap-3 transition active:scale-95 animate-in slide-in-from-right-2 duration-150 cursor-pointer"
              title="Open Invoice sidebar"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-bold">
                  {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}
                </div>
                <div className="text-xs font-black text-white">
                  {currency}{cartTotal.toFixed(2)}
                </div>
              </div>
              <div className="pl-1 text-blue-400 text-[11px] font-bold flex items-center gap-1">
                <span>Open Invoice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          {/* Portrait Slide-Over Cart Drawer (Tablet Portrait / Mobile < lg) */}
          {isPortraitCartOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setIsPortraitCartOpen(false)}
              />
              <div className="relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                <CartView
                  onOpenCheckout={() => {
                    setIsPortraitCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  onClose={() => setIsPortraitCartOpen(false)}
                />
              </div>
            </div>
          )}
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
        <ReportsView onNavigate={setActiveTab} />
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

      {/* PostgreSQL Sync Gateway Audit & Config Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
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
