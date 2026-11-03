import React, { useState } from 'react';
import {
  BarChart2,
  ArrowUpRight,
  Award,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export const ReportsView: React.FC = () => {
  const { currency } = useCartStore();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'ytd'>('week');

  // Realistic mock data scaled according to selected time range
  const multiplier = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
  const grossSales = 7240 * multiplier;
  const netProfit = grossSales * 0.44;
  const totalOrders = 28 * multiplier;
  const avgBasket = grossSales / totalOrders;

  const HOURLY_SALES = [
    { hour: '8 AM', amount: 480, height: '25%' },
    { hour: '10 AM', amount: 890, height: '45%' },
    { hour: '12 PM', amount: 1850, height: '95%', isPeak: true },
    { hour: '2 PM', amount: 1100, height: '55%' },
    { hour: '4 PM', amount: 620, height: '30%' },
    { hour: '6 PM', amount: 1450, height: '75%' },
    { hour: '8 PM', amount: 1980, height: '100%', isPeak: true },
    { hour: '10 PM', amount: 560, height: '28%' },
  ];

  const TOP_PRODUCTS = [
    {
      name: 'Grilled Steak',
      category: 'Lunch & Dinner',
      qty: 48 * Math.max(1, Math.floor(multiplier / 2)),
      revenue: 3840 * Math.max(1, Math.floor(multiplier / 2)),
      share: '24%',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Spaghetti Carbonara',
      category: 'Lunch',
      qty: 62 * Math.max(1, Math.floor(multiplier / 2)),
      revenue: 2188 * Math.max(1, Math.floor(multiplier / 2)),
      share: '18%',
      image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Crispy Buffalo Wings',
      category: 'Appetizer',
      qty: 54 * Math.max(1, Math.floor(multiplier / 2)),
      revenue: 2052 * Math.max(1, Math.floor(multiplier / 2)),
      share: '16%',
      image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Classic Caesar Salad',
      category: 'Appetizer',
      qty: 38 * Math.max(1, Math.floor(multiplier / 2)),
      revenue: 1216 * Math.max(1, Math.floor(multiplier / 2)),
      share: '12%',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Fresh Iced Milk Tea',
      category: 'Beverages',
      qty: 85 * Math.max(1, Math.floor(multiplier / 2)),
      revenue: 2975 * Math.max(1, Math.floor(multiplier / 2)),
      share: '15%',
      image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=100&auto=format&fit=crop&q=80',
    },
  ];

  const PAYMENT_BREAKDOWN = [
    { method: 'Cash Payments', percent: 52, amount: grossSales * 0.52, icon: Banknote, color: 'bg-emerald-500' },
    { method: 'GCash E-Wallet', percent: 28, amount: grossSales * 0.28, icon: Smartphone, color: 'bg-blue-500' },
    { method: 'Maya Paylater', percent: 12, amount: grossSales * 0.12, icon: Smartphone, color: 'bg-indigo-500' },
    { method: 'Credit / Debit Card', percent: 8, amount: grossSales * 0.08, icon: CreditCard, color: 'bg-amber-500' },
  ];

  const handlePrintSummary = () => {
    const report = `
========================================
       RESTOE POS - SALES AUDIT
========================================
Date Generated: ${new Date().toLocaleString()}
Period:         ${timeRange.toUpperCase()}
----------------------------------------
GROSS SALES:        ${currency}${grossSales.toFixed(2)}
ESTIMATED PROFIT:   ${currency}${netProfit.toFixed(2)} (44%)
TOTAL ORDERS:       ${totalOrders}
AVERAGE BASKET:     ${currency}${avgBasket.toFixed(2)}
----------------------------------------
PAYMENT BREAKDOWN:
  Cash:             52% (${currency}${(grossSales * 0.52).toFixed(2)})
  GCash:            28% (${currency}${(grossSales * 0.28).toFixed(2)})
  Maya:             12% (${currency}${(grossSales * 0.12).toFixed(2)})
  Cards:             8% (${currency}${(grossSales * 0.08).toFixed(2)})
========================================
`;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
      win.document.write(`<pre style="font-family: monospace; font-size: 13px; padding: 20px;">${report}</pre>`);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-5 select-none bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600" />
            <span>Sales Reports & Revenue Insights</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Monitor real-time turnover, peak rush hours, top menu items, and payment modes
          </p>
        </div>

        {/* Action Buttons & Time Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Filter Pills */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'ytd', label: 'YTD' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTimeRange(id as any)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  timeRange === id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrintSummary}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +16.8%
            </span>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1 tracking-tight">
            {currency}{grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Based on completed invoices
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Profit</span>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              44% Margin
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {currency}{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Total sales minus inventory cost
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Orders</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              99.2% Fill Rate
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {totalOrders} Transactions
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Across Terminal 01 & 02
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Ticket</span>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Healthy
            </span>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-1 tracking-tight">
            {currency}{avgBasket.toFixed(2)}
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Average customer spend
          </div>
        </div>
      </div>

      {/* Main Insights Grid: Hourly Volume Bar Chart + Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 shrink-0">
        {/* Hourly Volume Bar Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Peak Hour Sales Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hourly sales volume highlighting lunch & dinner peaks</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg">
              Peak: 8:00 PM Dinner
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100 px-2">
            {HOURLY_SALES.map((slot) => (
              <div key={slot.hour} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {currency}{slot.amount}
                </span>
                <div
                  style={{ height: slot.height }}
                  className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 group-hover:brightness-110 ${
                    slot.isPeak
                      ? 'bg-blue-600 shadow-md shadow-blue-500/30'
                      : 'bg-slate-200 group-hover:bg-blue-300'
                  }`}
                />
                <span className="text-[11px] font-semibold text-slate-600 mt-1">{slot.hour}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Peak Hours (High Traffic)</span>
            </span>
            <span>All sales recorded locally in IndexedDB</span>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Payment Methods Share</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tendered revenue across payment gateways</p>
          </div>

          <div className="space-y-3.5 my-4">
            {PAYMENT_BREAKDOWN.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      {p.method}
                    </span>
                    <span className="text-slate-900">{p.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${p.percent}%` }}
                      className={`h-full rounded-full ${p.color}`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 text-right">
                    {currency}{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 font-medium">
            💡 Digital e-wallet payouts (GCash & Maya) represent 40% of all completed transactions.
          </div>
        </div>
      </div>

      {/* Top 5 Best-Selling Dishes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top 5 Best-Selling Menu Items</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Dishes generating the highest sales turnover</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Product Velocity
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Units Sold</th>
                <th className="py-2.5 px-3">Gross Turnover</th>
                <th className="py-2.5 px-3">Sales Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TOP_PRODUCTS.map((prod, index) => (
                <tr key={prod.name} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 font-black text-slate-400 text-xs">#{index + 1}</span>
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      <span className="font-bold text-slate-900">{prod.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{prod.category}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{prod.qty} units</td>
                  <td className="py-3 px-3 font-black text-slate-900">
                    {currency}{prod.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {prod.share}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
