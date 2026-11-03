import React, { useState } from 'react';
import {
  ShoppingBag,
  Users,
  ChevronDown,
  Filter,
  ArrowUpRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import {
  MetricCardSkeleton,
  ChartBarSkeleton,
  ChartSplineSkeleton,
  DonutChartSkeleton,
  TableRowSkeleton,
} from './Skeleton';

export const ReportsView: React.FC = () => {
  const { currency } = useCartStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'product'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'This Week' | 'Today' | 'This Month' | 'This Year'>('This Week');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  const handlePeriodChange = (p: 'Today' | 'This Week' | 'This Month' | 'This Year') => {
    setSelectedPeriod(p);
    setIsPeriodMenuOpen(false);
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
    }, 220);
  };

  const handleTabChange = (tab: 'overview' | 'product') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
    }, 220);
  };

  // Scaled metric values based on selected period
  const periodMultiplier = selectedPeriod === 'Today' ? 0.25 : selectedPeriod === 'This Week' ? 1 : selectedPeriod === 'This Month' ? 4.2 : 52;
  const grossSales = 48920 * periodMultiplier;
  const orderVolume = Math.round(450 * periodMultiplier);
  const customersCount = Math.round(1250 * periodMultiplier);
  const activeCustomers = Math.round(1180 * periodMultiplier);

  // Top Selling Products Mock Data
  const TOP_PRODUCTS = [
    {
      id: 'tp-1',
      rank: 1,
      name: 'Grilled Steak',
      category: 'Dinner',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=80',
      soldQty: Math.round(184 * periodMultiplier),
      revenue: 14720.0 * periodMultiplier,
      margin: '68%',
    },
    {
      id: 'tp-2',
      rank: 2,
      name: 'Spicy Fried Chicken',
      category: 'Lunch',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=120&auto=format&fit=crop&q=80',
      soldQty: Math.round(156 * periodMultiplier),
      revenue: 7129.2 * periodMultiplier,
      margin: '62%',
    },
    {
      id: 'tp-3',
      rank: 3,
      name: 'Spaghetti Carbonara',
      category: 'Lunch',
      image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=120&auto=format&fit=crop&q=80',
      soldQty: Math.round(132 * periodMultiplier),
      revenue: 4659.6 * periodMultiplier,
      margin: '71%',
    },
    {
      id: 'tp-4',
      rank: 4,
      name: 'Crispy Buffalo Wings',
      category: 'Appetizer',
      image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=120&auto=format&fit=crop&q=80',
      soldQty: Math.round(110 * periodMultiplier),
      revenue: 4180.0 * periodMultiplier,
      margin: '64%',
    },
    {
      id: 'tp-5',
      rank: 5,
      name: 'Iced Lemon Tea',
      category: 'Beverages',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=120&auto=format&fit=crop&q=80',
      soldQty: Math.round(240 * periodMultiplier),
      revenue: 8400.0 * periodMultiplier,
      margin: '82%',
    },
  ];

  // Recent Orders Mock Data matching design
  const RECENT_ORDERS = [
    {
      id: 'ord-101',
      customer: 'Jaydon Siphron',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      date: '12 Aug 2026',
      total: 23650.0,
      type: 'Home Delivery',
      status: 'Complete',
    },
    {
      id: 'ord-102',
      customer: 'Samuel Johnson',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      date: '13 Aug 2026',
      total: 25000.0,
      type: 'Pick up',
      status: 'In-Progress',
    },
    {
      id: 'ord-103',
      customer: 'Francis Doe',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      date: '14 Aug 2026',
      total: 12600.0,
      type: 'Pick up',
      status: 'Pending',
    },
    {
      id: 'ord-104',
      customer: 'Janet Adebayo',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      date: '15 Aug 2026',
      total: 16365.0,
      type: 'Home Delivery',
      status: 'Complete',
    },
  ];

  // Bar chart values
  const BAR_DATA = [
    { month: 'Jan', fill: 35 },
    { month: 'Feb', fill: 45 },
    { month: 'Mar', fill: 28 },
    { month: 'Apr', fill: 60 },
    { month: 'May', fill: 50 },
    { month: 'Jun', fill: 75 },
    { month: 'Jul', fill: 68 },
    { month: 'Aug', fill: 90 },
    { month: 'Sep', fill: 65 },
    { month: 'Oct', fill: 82 },
    { month: 'Nov', fill: 95 },
    { month: 'Dec', fill: 88 },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-7 py-6 select-none bg-slate-50/80 font-sans">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Real-time sales velocity, revenue activity, and order fulfillment
          </p>
        </div>

        {/* Center: Overview / Product Tab Capsule */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200/80 rounded-xl shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('product')}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'product'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Product
          </button>
        </div>

        {/* Right: Period Dropdown Selector & Print Button */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition shadow-2xs"
            title="Print Summary Report"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPeriodMenuOpen && (
            <div className="absolute right-0 top-11 z-30 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
              {(['Today', 'This Week', 'This Month', 'This Year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`w-full text-left px-3.5 py-2 hover:bg-blue-50 transition ${
                    selectedPeriod === p ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 1: KPI Summary Cards (Matching Reference Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-6 shrink-0">
        {isComputing ? (
          <>
            <div className="lg:col-span-4"><MetricCardSkeleton /></div>
            <div className="lg:col-span-4"><MetricCardSkeleton /></div>
            <div className="lg:col-span-4"><MetricCardSkeleton /></div>
          </>
        ) : (
          <>
            {/* Card 1: Sales / Revenue Card */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center ring-1 ring-purple-100/60">
                  <ShoppingBag className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  {selectedPeriod} <ChevronDown className="w-3 h-3" />
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 tracking-wide block">Sales</span>
                  <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {currency}{grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">Volume</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1 justify-end mt-0.5">
                    <span>{orderVolume}</span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      +20.00%
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Customers Card */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-100/60">
                  <Users className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  {selectedPeriod} <ChevronDown className="w-3 h-3" />
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 tracking-wide block">Customers</span>
                  <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
                    <span>{customersCount.toLocaleString()}</span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      +15.00%
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">Active</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1 justify-end mt-0.5">
                    <span>{activeCustomers.toLocaleString()}</span>
                    <span className="text-[11px] font-bold text-emerald-600">85%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Deep Royal Blue Banner Card (Matching Top-Right of Reference) */}
            <div className="lg:col-span-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white p-5 rounded-2xl shadow-md shadow-blue-500/25 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5 text-blue-100 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Catalog Performance</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-200 flex items-center gap-1">
                  {selectedPeriod} <ChevronDown className="w-3 h-3" />
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-2 border-t border-white/15 z-10">
                <div>
                  <span className="text-[11px] text-blue-100 block truncate">All Products</span>
                  <p className="text-lg font-black text-white mt-0.5">45</p>
                  <span className="text-[10px] text-blue-200 font-semibold">+0.00%</span>
                </div>

                <div className="border-l border-white/15 pl-2.5">
                  <span className="text-[11px] text-blue-100 block truncate">Active</span>
                  <p className="text-lg font-black text-white mt-0.5">32</p>
                  <span className="text-[10px] text-emerald-300 font-semibold">+24%</span>
                </div>

                <div className="border-l border-white/15 pl-2.5">
                  <span className="text-[11px] text-blue-100 block truncate">Complete</span>
                  <p className="text-lg font-black text-white mt-0.5">445</p>
                  <span className="text-[10px] text-blue-200 font-semibold">+18.5%</span>
                </div>
              </div>

              {/* Decorative soft backdrop circles */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute left-1/2 -top-10 w-28 h-28 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />
            </div>
          </>
        )}
      </div>

      {/* Row 2: Two Interactive Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 shrink-0">
        {isComputing ? (
          <>
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="w-36 h-4 bg-slate-200 rounded animate-shimmer" />
                  <div className="w-24 h-3 bg-slate-200 rounded animate-shimmer" />
                </div>
                <div className="w-20 h-6 bg-slate-200 rounded-lg animate-shimmer" />
              </div>
              <ChartBarSkeleton />
            </div>
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="space-y-1">
                  <div className="w-36 h-4 bg-slate-200 rounded animate-shimmer" />
                  <div className="w-24 h-3 bg-slate-200 rounded animate-shimmer" />
                </div>
                <div className="w-20 h-6 bg-slate-200 rounded-lg animate-shimmer" />
              </div>
              <ChartSplineSkeleton />
            </div>
          </>
        ) : (
          <>
            {/* Left Chart: "Overall User Acquisition / Sales Revenue Bars" */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                    Overall Sales Acquisition
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Monthly revenue volume trends</p>
                </div>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                  {selectedPeriod} <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              </div>

              {/* Vertical Bar Chart with Light Track Backgrounds */}
              <div className="h-52 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 px-1">
                {BAR_DATA.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Bar Track */}
                    <div className="w-full max-w-[20px] bg-slate-100 rounded-full h-full flex items-end overflow-hidden p-0.5">
                      {/* Active Fill Bar */}
                      <div
                        style={{ height: `${item.fill}%` }}
                        className="w-full bg-blue-600 rounded-full transition-all duration-300 group-hover:bg-blue-700 shadow-xs"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1">{item.month}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 text-xs">
                <span className="text-slate-400 font-medium">Updated every 5 minutes</span>
                <button className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-0.5">
                  <span>View Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Chart: "Overall User / Sales Activity" (Curved Blue Spline Wave Chart) */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                    Overall Sales Activity
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Peak revenue wave curve</p>
                </div>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                  {selectedPeriod} <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              </div>

              {/* Curved Wave Spline Chart (SVG with floating callout badge) */}
              <div className="relative h-56 w-full pt-4">
                {/* Horizontal Grid guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-mono pr-2">
                  <div className="border-b border-dashed border-slate-100 pb-1 text-right">40k</div>
                  <div className="border-b border-dashed border-slate-100 pb-1 text-right">30k</div>
                  <div className="border-b border-dashed border-slate-100 pb-1 text-right">20k</div>
                  <div className="border-b border-dashed border-slate-100 pb-1 text-right">10k</div>
                  <div className="border-b border-slate-100 pb-1 text-right">0</div>
                </div>

                {/* Smooth SVG Wave Spline */}
                <svg
                  className="w-full h-44 overflow-visible"
                  viewBox="0 0 600 180"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill under curve */}
                  <path
                    d="M 20 130 C 80 120, 140 145, 200 95 C 260 45, 300 70, 360 40 C 420 10, 480 80, 540 25 C 570 5, 590 20, 590 20 L 590 170 L 20 170 Z"
                    fill="url(#waveGradient)"
                  />

                  {/* Glowing Curved Stroke Line */}
                  <path
                    d="M 20 130 C 80 120, 140 145, 200 95 C 260 45, 300 70, 360 40 C 420 10, 480 80, 540 25 C 570 5, 590 20, 590 20"
                    stroke="#2563EB"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="drop-shadow-md"
                  />

                  {/* Pinpoint Dot on Curve Peak */}
                  <circle cx="360" cy="40" r="6" fill="#2563EB" className="animate-pulse" />
                  <circle cx="360" cy="40" r="10" stroke="#2563EB" strokeWidth="2" fill="white" />
                  <line x1="360" y1="40" x2="360" y2="170" stroke="#2563EB" strokeDasharray="3 3" strokeWidth="1.5" />
                </svg>

                {/* Floating Tooltip Callout Badge (Matching '$4,500 Jun 7' in reference image) */}
                <div className="absolute left-[54%] top-4 -translate-x-1/2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xl text-center pointer-events-none z-20">
                  <span className="text-xs font-black text-slate-900 block">{currency}4,500</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jun 7 • Peak</span>
                </div>

                {/* Month Axis Labels along bottom */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-2 pt-1 border-t border-slate-100">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>

              <div className="pt-2 text-right">
                <span className="text-xs text-slate-400 font-medium">Average ticket volume: <strong>{currency}310.50</strong></span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Row 3: Donut Chart Card (Left) + Custom Orders Table / Product Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 shrink-0">
        {/* Left: Donut Chart Card ("Channel & Payment Share") */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">Channel & Payment Share</h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                +20.00%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Tendered volume breakdown</p>
          </div>

          {isComputing ? (
            <DonutChartSkeleton />
          ) : (
            <>
              {/* Circular Donut Ring Graphic */}
              <div className="my-5 flex flex-col items-center justify-center relative">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  {/* Cash Slice (62% -> 195 circumference) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#2563EB"
                    strokeWidth="14"
                    strokeDasharray="148 238"
                    strokeDashoffset="0"
                    className="transition-all duration-500"
                  />
                  {/* E-Wallet Slice (25% -> 60 circumference) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#F97316"
                    strokeWidth="14"
                    strokeDasharray="60 238"
                    strokeDashoffset="-150"
                    className="transition-all duration-500"
                  />
                  {/* Cards Slice (13% -> 31 circumference) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="14"
                    strokeDasharray="31 238"
                    strokeDashoffset="-212"
                    className="transition-all duration-500"
                  />
                </svg>

                {/* Inner Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-slate-900 leading-none">{orderVolume}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">Orders</span>
                </div>
              </div>

              {/* Legend Items */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Cash Payments</span>
                  </span>
                  <span className="font-bold text-slate-900">62%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span>GCash & Maya E-Wallets</span>
                  </span>
                  <span className="font-bold text-slate-900">25%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Credit & Debit Cards</span>
                  </span>
                  <span className="font-bold text-slate-900">13%</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Custom Orders Table or Top Products Table */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                {activeTab === 'product' ? 'Top Selling Menu Items' : 'Custom Orders'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'product'
                  ? 'High-margin bestsellers and unit sales velocity'
                  : 'Latest transactions and dispatch methods'}
              </p>
            </div>

            {/* Filter Action Button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                {activeTab === 'product' ? (
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                    <th className="py-2.5 px-3">Item Rank</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Units Sold</th>
                    <th className="py-2.5 px-3">Gross Revenue</th>
                    <th className="py-2.5 px-3 text-right">Margin</th>
                  </tr>
                ) : (
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Order Total</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isComputing ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)
                ) : activeTab === 'product' ? (
                  TOP_PRODUCTS.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                            #{prod.rank}
                          </span>
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <span className="font-bold text-slate-900 truncate">{prod.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {prod.soldQty} units
                      </td>
                      <td className="py-3 px-3 font-black text-slate-900">
                        {currency}{prod.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50">
                          {prod.margin}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  RECENT_ORDERS.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={ord.avatar}
                            alt={ord.customer}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="font-bold text-slate-900">{ord.customer}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                        {ord.date}
                      </td>

                      {/* Order Total */}
                      <td className="py-3 px-3 font-black text-slate-900">
                        {currency}{ord.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {ord.type}
                      </td>

                      {/* Status Pill Badge */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            ord.status === 'Complete'
                              ? 'text-emerald-700 bg-emerald-50'
                              : ord.status === 'In-Progress'
                              ? 'text-blue-700 bg-blue-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>
              {activeTab === 'product' ? 'Showing top 5 dishes' : 'Showing 4 of 445 orders'}
            </span>
            <span className="text-blue-600 font-bold hover:underline cursor-pointer">
              {activeTab === 'product' ? 'Export CSV Report' : 'View All Orders'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
