import React, { useState } from 'react';
import {
  Store,
  Printer,
  Receipt,
  DollarSign,
  Download,
  Upload,
  AlertOctagon,
  Check,
  Save,
  Bluetooth,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Scan,
  Volume2,
  CreditCard,
  Wallet,
  Banknote,
  Smartphone,
  Clock,
} from 'lucide-react';
import { useSettingsStore, type StoreSettings, type EnabledPaymentMethods } from '../store/useSettingsStore';
import { printerService } from '../core/hardware/printer';
import { playScanSuccessSound, playScanErrorSound, triggerHaptic } from '../core/hardware/scannerFeedback';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { db } from '../core/db';
import { seedDatabaseIfEmpty } from '../core/db/seed';
import { toast } from '../store/useToastStore';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [activeSection, setActiveSection] = useState<'store' | 'printer' | 'finance' | 'data' | 'scanner' | 'payments'>('store');
  const [pinInput, setPinInput] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState<'reset' | 'changePin' | null>(null);
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isScannerTestOpen, setIsScannerTestOpen] = useState(false);
  const [scannerTestCode, setScannerTestCode] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const handleChange = (field: keyof StoreSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleTogglePaymentMethod = (method: keyof EnabledPaymentMethods) => {
    const current = formData.enabledPaymentMethods || {
      cash: true,
      gcash: true,
      maya: true,
      card: false,
      paylater: false,
    };
    const updated = { ...current, [method]: !current[method] };
    const hasAtLeastOne = Object.values(updated).some((v) => v);
    if (!hasAtLeastOne) {
      toast.error('Action Restricted', 'At least one payment method must remain active.');
      return;
    }
    handleChange('enabledPaymentMethods', updated);
  };

  const handleSave = () => {
    updateSettings(formData);
    setIsSaved(true);
    toast.success('Settings Saved', 'Your store configuration has been updated successfully.');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestPrint = async () => {
    try {
      const sampleOrder: any = {
        id: 'ord-test-sample',
        orderNumber: 'TEST-0001',
        cashierName: 'Manager On Duty',
        shiftId: 'shift-test',
        subtotal: 350.0,
        discount: 0,
        tax: 42.0,
        total: 350.0,
        paymentMethod: 'CASH',
        amountTendered: 500.0,
        changeDue: 150.0,
        status: 'COMPLETED',
        createdAt: Date.now(),
        synced: false,
      };

      const sampleItems: any = [
        {
          id: 'item-1',
          orderId: 'ord-test-sample',
          productId: 'prod-001',
          productName: 'Grilled Chicken Meal',
          price: 250.0,
          quantity: 1,
          subtotal: 250.0,
        },
        {
          id: 'item-2',
          orderId: 'ord-test-sample',
          productId: 'prod-002',
          productName: 'Iced Milk Tea',
          price: 100.0,
          quantity: 1,
          subtotal: 100.0,
        },
      ];

      await printerService.printReceipt(sampleOrder, sampleItems);
      toast.info('Test Receipt Sent', 'Check your thermal printer or browser print dialog.');
    } catch (err) {
      console.error(err);
      toast.error('Print Error', 'Could not output test receipt.');
    }
  };

  const handleConnectBluetooth = async () => {
    const success = await printerService.connectBluetooth();
    if (success) {
      toast.success('Bluetooth Connected', 'Thermal printer paired successfully.');
    } else {
      toast.error('Bluetooth Failed', 'Could not connect to printer. Ensure Bluetooth is ON.');
    }
  };

  // Export JSON Database Backup
  const handleExportBackup = async () => {
    try {
      const [categories, products, orders, orderItems, shifts] = await Promise.all([
        db.categories.toArray(),
        db.products.toArray(),
        db.orders.toArray(),
        db.orderItems.toArray(),
        db.shifts.toArray(),
      ]);

      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        settings: formData,
        categories,
        products,
        orders,
        orderItems,
        shifts,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Restoe_POS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup Exported', 'Full JSON database backup downloaded successfully.');
    } catch (err) {
      console.error('Backup export failed:', err);
      toast.error('Export Failed', 'Could not export database backup.');
    }
  };

  // Import JSON Database Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (!json.products || !json.categories) {
          throw new Error('Invalid backup file structure');
        }

        await db.transaction('rw', db.categories, db.products, db.orders, db.orderItems, db.shifts, async () => {
          await db.categories.clear();
          await db.products.clear();
          await db.orders.clear();
          await db.orderItems.clear();
          await db.shifts.clear();

          if (json.categories.length) await db.categories.bulkAdd(json.categories);
          if (json.products.length) await db.products.bulkAdd(json.products);
          if (json.orders?.length) await db.orders.bulkAdd(json.orders);
          if (json.orderItems?.length) await db.orderItems.bulkAdd(json.orderItems);
          if (json.shifts?.length) await db.shifts.bulkAdd(json.shifts);
        });

        if (json.settings) {
          updateSettings(json.settings);
          setFormData(json.settings);
        }

        toast.success('Backup Restored', 'Database restored. Reloading data...');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        console.error('Import error:', err);
        toast.error('Import Failed', 'Invalid or corrupted backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Factory Reset with PIN Verification
  const handleVerifyPinAndExecute = async () => {
    if (pinInput !== settings.managerPin) {
      toast.error('Incorrect PIN', 'The Manager PIN you entered is invalid.');
      return;
    }

    if (pinAction === 'reset') {
      try {
        await db.transaction('rw', db.categories, db.products, db.orders, db.orderItems, db.shifts, async () => {
          await db.categories.clear();
          await db.products.clear();
          await db.orders.clear();
          await db.orderItems.clear();
          await db.shifts.clear();
        });
        resetSettings();
        await seedDatabaseIfEmpty();

        toast.success('Factory Reset Done', 'Database reset to default demo seed. Refreshing...');
        setIsPinModalOpen(false);
        setPinInput('');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        console.error('Reset error:', err);
        toast.error('Reset Failed', 'Failed to clear local database.');
      }
    } else if (pinAction === 'changePin') {
      if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        toast.error('Invalid New PIN', 'Manager PIN must be exactly 4 digits.');
        return;
      }
      updateSettings({ managerPin: newPin });
      setFormData((prev) => ({ ...prev, managerPin: newPin }));
      toast.success('PIN Updated', 'Manager PIN has been changed successfully.');
      setIsPinModalOpen(false);
      setPinInput('');
      setNewPin('');
    }
  };

  const receiptPreviewText = printerService.formatReceipt(
    {
      id: 'ord-preview',
      orderNumber: 'ORD-20261103-1001',
      cashierName: 'Courtney Henry',
      shiftId: 'shift-1',
      subtotal: 295.0,
      discount: 0,
      tax: 35.4,
      total: 295.0,
      paymentMethod: 'CASH',
      amountTendered: 500.0,
      changeDue: 205.0,
      status: 'COMPLETED',
      createdAt: Date.now(),
      synced: true,
    },
    [
      {
        id: 'item-1',
        orderId: 'ord-preview',
        productId: 'prod-1',
        productName: 'Grilled Steak',
        price: 80.0,
        quantity: 2,
        subtotal: 160.0,
      },
      {
        id: 'item-2',
        orderId: 'ord-preview',
        productId: 'prod-2',
        productName: 'Crispy Buffalo Wings',
        price: 38.0,
        quantity: 1,
        subtotal: 38.0,
      },
      {
        id: 'item-3',
        orderId: 'ord-preview',
        productId: 'prod-3',
        productName: 'Spaghetti Carbonara',
        price: 97.0,
        quantity: 1,
        subtotal: 97.0,
      },
    ]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-5 select-none bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            <span>Store & Hardware Settings</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Configure store branding, thermal receipt printer, tax rules, and offline data backups
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`self-start sm:self-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 ${
            isSaved
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Main Grid: Settings Tabs + Forms + Live Thermal Receipt Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Settings Panel (Tabs + Form Fields) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shrink-0 overflow-x-auto scrollbar-none">
            {[
              { id: 'store', label: 'Store Identity', icon: Store },
              { id: 'payments', label: 'Payment Methods', icon: CreditCard },
              { id: 'finance', label: 'Tax & Currency', icon: DollarSign },
              { id: 'printer', label: 'Thermal Printer', icon: Printer },
              { id: 'scanner', label: 'Barcode Scanner', icon: Scan },
              { id: 'data', label: 'Backup & Security', icon: ShieldCheck },
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveSection(id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Cards */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            {/* SECTION 1: STORE IDENTITY */}
            {activeSection === 'store' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Store Identity & Branding</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    These details appear on your printed receipts and cashier header.
                  </p>
                </div>

                {/* Active Brand Logo Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                    <img
                      src="/logo.png"
                      alt="Active Store Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                      Active POS Logo
                    </span>
                    <h4 className="font-bold text-xs text-slate-800 mt-0.5">
                      Fast POS Terminal & Cart Emblem
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Displayed on the navigation sidebar, browser tab, and POS terminal display.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Business / Store Name
                    </label>
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={(e) => handleChange('storeName', e.target.value)}
                      placeholder="e.g. Restoe Cafe & Bistro"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Branch / Outlet Name
                    </label>
                    <input
                      type="text"
                      value={formData.branchName}
                      onChange={(e) => handleChange('branchName', e.target.value)}
                      placeholder="e.g. Main Branch - BGC"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Store Address
                    </label>
                    <input
                      type="text"
                      value={formData.storeAddress}
                      onChange={(e) => handleChange('storeAddress', e.target.value)}
                      placeholder="e.g. 123 Bonifacio St, Metro Manila"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Contact / Mobile Number
                    </label>
                    <input
                      type="text"
                      value={formData.storePhone}
                      onChange={(e) => handleChange('storePhone', e.target.value)}
                      placeholder="+63 917 123 4567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Tax Identification Number (TIN / VAT)
                    </label>
                    <input
                      type="text"
                      value={formData.tin}
                      onChange={(e) => handleChange('tin', e.target.value)}
                      placeholder="123-456-789-000 VAT"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: THERMAL PRINTER */}
            {activeSection === 'printer' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">ESC/POS Thermal Printer Hardware</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure your paper width format, bluetooth pairing, and receipt messages.
                  </p>
                </div>

                {/* Paper Width Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Receipt Paper Width
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('paperWidth', '58mm')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        formData.paperWidth === '58mm'
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-slate-900">58mm (Default)</span>
                        {formData.paperWidth === '58mm' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        32 characters per line. Ideal for portable Bluetooth printers, Sunmi, and iMin handhelds.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChange('paperWidth', '80mm')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        formData.paperWidth === '80mm'
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-slate-900">80mm (Wide)</span>
                        {formData.paperWidth === '80mm' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        42 characters per line. Designed for heavy-duty desktop USB/LAN thermal printers.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Receipt Header & Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Receipt Header Line
                    </label>
                    <input
                      type="text"
                      value={formData.receiptHeader}
                      onChange={(e) => handleChange('receiptHeader', e.target.value)}
                      placeholder="OFFICIAL RECEIPT"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Receipt Footer Note
                    </label>
                    <textarea
                      rows={2}
                      value={formData.receiptFooter}
                      onChange={(e) => handleChange('receiptFooter', e.target.value)}
                      placeholder="THANK YOU FOR DINING WITH US!"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Toggles & Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleConnectBluetooth}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Bluetooth className="w-4 h-4 text-blue-600" />
                    <span>Pair Bluetooth Printer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestPrint}
                    className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Test Print Sample Receipt</span>
                  </button>
                </div>
              </div>
            )}

            {/* SECTION: BARCODE SCANNER DIAGNOSTICS */}
            {activeSection === 'scanner' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Barcode Scanner & Hardware Testing</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Test hardware USB/Bluetooth barcode guns, tablet camera recognition, and audio chimes.
                  </p>
                </div>

                {/* 1. Camera Barcode Scanner Launch Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Scan className="w-4 h-4 text-blue-600" />
                      Tablet Camera Barcode Scanner
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                      Opens device rear camera with high-contrast targeting reticle, flashlight toggle, and continuous batch scan mode.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScannerTestOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-95 shrink-0 flex items-center gap-1.5"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    Launch Camera Test
                  </button>
                </div>

                {/* 2. Hardware USB/Bluetooth Barcode Gun Test Field */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Hardware Barcode Gun Test Pad</h4>
                      <p className="text-[11px] text-slate-500">
                        Click into this field and pull the trigger on your USB or Bluetooth barcode scanner.
                      </p>
                    </div>
                    {scannedResult && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        Scan Captured
                      </span>
                    )}
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!scannerTestCode.trim()) return;
                      const code = scannerTestCode.trim();
                      setScannerTestCode('');
                      const found = await db.products.where('barcode').equals(code).first();
                      if (found) {
                        playScanSuccessSound();
                        triggerHaptic('success');
                        setScannedResult(`✓ Matched: "${found.name}" (₱${found.price.toFixed(2)}) — Stock: ${found.stock}`);
                      } else {
                        playScanErrorSound();
                        triggerHaptic('error');
                        setScannedResult(`✗ Barcode "${code}" is not in database.`);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={scannerTestCode}
                      onChange={(e) => setScannerTestCode(e.target.value)}
                      placeholder="Scan with physical gun or type code and press Enter..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!scannerTestCode.trim()}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition"
                    >
                      Test Lookup
                    </button>
                  </form>

                  {scannedResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-mono font-medium ${
                        scannedResult.startsWith('✓')
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {scannedResult}
                    </div>
                  )}
                </div>

                {/* 3. Audio & Haptic Diagnostic Buttons */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-slate-600" />
                    Web Audio Synthesis & Haptics (Offline Sound Engine)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sounds are generated client-side using oscillator harmonics without external sound file downloads.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        playScanSuccessSound();
                        triggerHaptic('success');
                        toast.success('Sound Verified', '880 Hz positive scan chime played.');
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      🔊 Test Success Beep (880Hz)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playScanErrorSound();
                        triggerHaptic('error');
                        toast.error('Sound Verified', '220 Hz warning alert buzz played.');
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      🔊 Test Alert Buzz (220Hz)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('success');
                        toast.info('Haptics Triggered', 'Device vibration requested.');
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      📳 Test Haptic Vibration
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: PAYMENT METHODS */}
            {activeSection === 'payments' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Accepted Payment Methods</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle which payment buttons are displayed on your cashier Invoice panel and Checkout modal.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Cash */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Cash Payment</h4>
                        <p className="text-[11px] text-slate-500">
                          Standard physical cash with quick bills numpad and exact change calculator.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('cash')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        formData.enabledPaymentMethods?.cash !== false ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                          formData.enabledPaymentMethods?.cash !== false ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* GCash */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">GCash / E-Wallet</h4>
                        <p className="text-[11px] text-slate-500">
                          Direct GCash QR code scan or mobile wallet reference payment.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('gcash')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        formData.enabledPaymentMethods?.gcash ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                          formData.enabledPaymentMethods?.gcash ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Maya */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Maya / Digital Wallet</h4>
                        <p className="text-[11px] text-slate-500">
                          Maya QR, digital bank transfer, or QR Ph mobile transactions.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('maya')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        formData.enabledPaymentMethods?.maya ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                          formData.enabledPaymentMethods?.maya ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Credit Card */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Credit / Debit Card</h4>
                        <p className="text-[11px] text-slate-500">
                          External card swipe / dip payment terminal (Visa, Mastercard, BancNet).
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('card')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        formData.enabledPaymentMethods?.card ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                          formData.enabledPaymentMethods?.card ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Paylater */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">Paylater / Store Credit</h4>
                        <p className="text-[11px] text-slate-500">
                          Suki customer tab / credit ("Palista") or deferred billing.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod('paylater')}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        formData.enabledPaymentMethods?.paylater ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                          formData.enabledPaymentMethods?.paylater ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: CURRENCY & TAX */}
            {activeSection === 'finance' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Currency & Financial Calculation Rules</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure the active currency symbol and local value-added tax rates.
                  </p>
                </div>

                {/* VAT On/Off Toggle Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <span>Enable Value-Added Tax (VAT) / Sales Tax</span>
                      {formData.enableTax ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold">
                          VAT REGISTERED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                          NON-VAT STORE
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formData.enableTax
                        ? '12% VAT is included in prices and displayed on cashier invoice and receipt.'
                        : 'Non-VAT mode: Hides "Tax (12% VAT Incl)" from the invoice panel and prints clean Non-VAT receipts.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleChange('enableTax', !formData.enableTax)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      formData.enableTax ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                        formData.enableTax ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Currency Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Primary Currency
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { code: 'PHP', symbol: '₱', label: 'Philippine Peso', flag: '🇵🇭' },
                      { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸' },
                      { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
                    ].map(({ code, symbol, label, flag }) => {
                      const isSelected = formData.currencyCode === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            handleChange('currency', symbol);
                            handleChange('currencyCode', code);
                          }}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{flag}</span>
                            <span className="text-lg font-black text-slate-900">{symbol}</span>
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">{code}</span>
                            <span className="text-[10px] text-slate-400">{label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tax Rate Setting (Only if VAT is enabled) */}
                {formData.enableTax && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        VAT / Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.taxRate}
                        onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                        placeholder="12"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Standard Philippine VAT is 12%. Enter 0 for non-VAT sole proprietors.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Tax Computation Mode
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => handleChange('isTaxInclusive', true)}
                          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold border transition ${
                            formData.isTaxInclusive
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          VAT Inclusive
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('isTaxInclusive', false)}
                          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold border transition ${
                            !formData.isTaxInclusive
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          VAT Exclusive
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: DATA & SECURITY */}
            {activeSection === 'data' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Database Backup & Security Protection</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Safeguard offline sales records and manage the 4-digit Manager PIN.
                  </p>
                </div>

                {/* Backup & Restore Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-1">
                        <Download className="w-4 h-4 text-blue-600" />
                        <span>Export Database (JSON)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-normal">
                        Downloads an offline JSON snapshot of all products, inventory counts, shifts, and completed receipts.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg transition active:scale-95"
                    >
                      Download Backup File
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-1">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Import Database (JSON)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-normal">
                        Restore your POS catalog and history from a previously saved JSON snapshot.
                      </p>
                    </div>
                    <label className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg transition text-center cursor-pointer block active:scale-95">
                      Select Backup File
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Manager PIN Management */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manager 4-Digit Security PIN</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Protects manager-only actions (Shift Z-readings, refunds, database wipe). Default is{' '}
                      <strong className="text-slate-700">1234</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPinAction('changePin');
                      setPinInput('');
                      setNewPin('');
                      setIsPinModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition whitespace-nowrap active:scale-95"
                  >
                    Change PIN
                  </button>
                </div>

                {/* Factory Reset Danger Zone */}
                <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                      <AlertOctagon className="w-4 h-4" />
                      <span>Factory Reset & Wipe Database</span>
                    </div>
                    <p className="text-[11px] text-rose-600/80 mt-0.5">
                      Wipes all local sales transactions, resets inventory, and repopulates initial demo data. Requires Manager PIN.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPinAction('reset');
                      setPinInput('');
                      setIsPinModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition whitespace-nowrap active:scale-95 shadow-xs"
                  >
                    Factory Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Thermal Receipt Preview */}
        <div className="xl:col-span-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Live Thermal Slip Preview</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
              {formData.paperWidth} Format
            </span>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 shadow-inner flex-1 flex flex-col justify-center items-center">
            {/* Thermal Receipt Paper Roll Simulation */}
            <div
              className={`bg-white text-slate-900 shadow-2xl p-5 rounded-md font-mono text-xs whitespace-pre leading-relaxed select-text overflow-x-auto transition-all duration-200 ${
                formData.paperWidth === '80mm' ? 'w-full max-w-sm text-[12px]' : 'w-full max-w-[290px] text-[11px]'
              }`}
              style={{
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {receiptPreviewText}
            </div>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Real-time ESC/POS formatting preview reflects your store name, address, and currency.
            </p>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {pinAction === 'reset' ? 'Confirm Factory Reset' : 'Change Manager PIN'}
                </h3>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500">
                {pinAction === 'reset'
                  ? 'Enter the 4-digit Manager PIN (default: 1234) to confirm wiping the database.'
                  : 'Enter current 4-digit Manager PIN followed by your new PIN.'}
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Current Manager PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pinAction === 'changePin' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    New 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPinAndExecute}
                className={`flex-1 py-2 rounded-lg text-white text-xs font-bold transition ${
                  pinAction === 'reset' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {pinAction === 'reset' ? 'Confirm Reset' : 'Save New PIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Diagnostic Modal */}
      <BarcodeScannerModal
        isOpen={isScannerTestOpen}
        onClose={() => setIsScannerTestOpen(false)}
        onScan={async (code) => {
          const found = await db.products.where('barcode').equals(code).first();
          if (found) {
            setScannedResult(`✓ Camera Matched: "${found.name}" (₱${found.price.toFixed(2)}) — Stock: ${found.stock}`);
            toast.success('Camera Scan Verified', `Detected "${found.name}"`);
          } else {
            setScannedResult(`✗ Camera Scanned: "${code}" (Not in database)`);
            toast.error('Unknown Code', `Barcode "${code}" not found.`);
          }
        }}
        title="Test Camera Scanner"
        subtitle="Aim at a product barcode to test camera decoding"
        defaultContinuous={true}
      />
    </div>
  );
};
