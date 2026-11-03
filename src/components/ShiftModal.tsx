import React, { useEffect, useState } from 'react';
import { X, DollarSign, Printer, Calendar, Clock } from 'lucide-react';
import { db } from '../core/db';
import { useCartStore } from '../store/useCartStore';
import type { Shift, Order } from '../types';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose }) => {
  const { currency } = useCartStore();
  const [shift, setShift] = useState<Shift | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadShiftData();
    }
  }, [isOpen]);

  const loadShiftData = async () => {
    const currentShift = await db.shifts.where('status').equals('OPEN').first();
    if (currentShift) {
      const shiftOrders = await db.orders.toArray();
      setShift(currentShift);
      setOrders(shiftOrders);
    }
  };

  if (!isOpen) return null;

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCashSales = orders
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + o.total, 0);
  const totalNonCashSales = orders
    .filter((o) => o.paymentMethod !== 'CASH')
    .reduce((sum, o) => sum + o.total, 0);

  const startingFloat = shift?.startingFloat || 200;
  const expectedCashInDrawer = startingFloat + totalCashSales;

  const handlePrintZReport = () => {
    const divider = '================================';
    const report = `
            DAILY Z-READING AUDIT
                 RESTOE POS
${divider}
Date: ${new Date().toLocaleString()}
Cashier: ${shift?.cashierName || 'Courtney Henry'}
Shift: 1st Shift (OPEN)
${divider}
STARTING CASH FLOAT:       ${currency}${startingFloat.toFixed(2)}
TOTAL TRANSACTIONS:        ${orders.length}
--------------------------------
CASH COLLECTED:            ${currency}${totalCashSales.toFixed(2)}
CARD & E-WALLET:           ${currency}${totalNonCashSales.toFixed(2)}
--------------------------------
GROSS TOTAL SALES:         ${currency}${totalSales.toFixed(2)}
================================
EXPECTED CASH IN DRAWER:   ${currency}${expectedCashInDrawer.toFixed(2)}
================================

Cashier Signature: __________________
Supervisor Signature: _______________
\n\n\n`;

    const printWin = window.open('', '_blank', 'width=350,height=600');
    if (printWin) {
      printWin.document.write(`
        <html>
          <head><title>Z-Reading Report</title></head>
          <body style="font-family: monospace; font-size: 13px; white-space: pre;">${report}</body>
        </html>
      `);
      printWin.document.close();
      printWin.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Shift & Daily Z-Reading</h3>
              <p className="text-xs text-slate-400 font-medium">Courtney Henry — 1st Shift</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Starting Float
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">{currency}{startingFloat.toFixed(2)}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Total Sales
              </span>
              <p className="text-xl font-bold text-blue-600 mt-1">{currency}{totalSales.toFixed(2)}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Total Orders Ringed Up</span>
              <span className="font-bold text-slate-800">{orders.length} orders</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Cash Sales Collected</span>
              <span className="font-bold text-slate-800">{currency}{totalCashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Card / Paylater Sales</span>
              <span className="font-bold text-slate-800">{currency}{totalNonCashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2.5 border-t border-slate-200">
              <span className="text-slate-900">Expected Cash in Drawer</span>
              <span className="text-blue-600 font-bold">{currency}{expectedCashInDrawer.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePrintZReport}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 active:scale-95 transition text-sm"
          >
            <Printer className="w-4 h-4 stroke-[2]" />
            <span>Print Z-Reading Audit Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
