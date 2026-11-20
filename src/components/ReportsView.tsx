import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ShoppingBag,
  Users,
  ChevronDown,
  ArrowUpRight,
  Printer,
  Sparkles,
  Download,
} from 'lucide-react';
import { db } from '../core/db';
import { useCartStore } from '../store/useCartStore';
import { toast } from '../store/useToastStore';
import {
  MetricCardSkeleton,
  ChartBarSkeleton,
  ChartSplineSkeleton,
  DonutChartSkeleton,
  TableRowSkeleton,
} from './Skeleton';

interface ReportsViewProps {
  onNavigate?: (tab: string) => void;
}

type PeriodType = 'Today' | 'This Week' | 'This Month' | 'This Year' | 'All Time';

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigate }) => {
  const { currency } = useCartStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'product'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('This Week');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [tableStatusFilter, setTableStatusFilter] = useState<'ALL' | 'COMPLETED' | 'VOIDED'>('ALL');
  const [isComputing, setIsComputing] = useState(false);

  // Live query from Dexie IndexedDB
  const orders = useLiveQuery(() => db.orders.reverse().toArray(), []) || [];
  const orderItems = useLiveQuery(() => db.orderItems.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];

  const handlePeriodChange = (p: PeriodType) => {
    setSelectedPeriod(p);
    setIsPeriodMenuOpen(false);
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
    }, 180);
  };

  const handleTabChange = (tab: 'overview' | 'product') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
    }, 180);
  };

  // Date boundary calculation for selected period
  const { startTimestamp, endTimestamp } = useMemo(() => {
    const now = new Date();
    const end = now.getTime();
    let start = 0;

    if (selectedPeriod === 'Today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      start = startOfDay;
    } else if (selectedPeriod === 'This Week') {
      start = end - 7 * 24 * 60 * 60 * 1000;
    } else if (selectedPeriod === 'This Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (selectedPeriod === 'This Year') {
      start = new Date(now.getFullYear(), 0, 1).getTime();
    } else {
      start = 0; // All Time
    }

    return { startTimestamp: start, endTimestamp: end };
  }, [selectedPeriod]);

  // Orders in selected period
  const periodOrders = useMemo(() => {
    return orders.filter((o) => o.createdAt >= startTimestamp && o.createdAt <= endTimestamp);
  }, [orders, startTimestamp, endTimestamp]);

  const completedOrders = useMemo(() => {
    return periodOrders.filter((o) => o.status === 'COMPLETED');
  }, [periodOrders]);

  const voidedOrders = useMemo(() => {
    return periodOrders.filter((o) => o.status === 'VOIDED');
  }, [periodOrders]);

  // Core KPIs
  const grossSales = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [completedOrders]);

  const voidedTotal = useMemo(() => {
    return voidedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [voidedOrders]);

  const orderVolume = completedOrders.length;
  const avgTicketValue = orderVolume > 0 ? grossSales / orderVolume : 0;

  // Approximate unique customers / tickets
  const uniqueCustomersCount = useMemo(() => {
    const set = new Set<string>();
    completedOrders.forEach((o) => {
      if (o.tableLabel) set.add(o.tableLabel);
      else set.add(o.orderNumber);
    });
    return Math.max(set.size, orderVolume);
  }, [completedOrders, orderVolume]);

  // Catalog Stats
  const totalProductsCount = products.length;
  const inStockProductsCount = products.filter((p) => (p.stock || 0) > 0).length;
  const totalCompletedLifetime = orders.filter((o) => o.status === 'COMPLETED').length;

  // Channel & Payment Breakdown
  const paymentStats = useMemo(() => {
    const cashOrders = completedOrders.filter((o) => o.paymentMethod === 'CASH');
    const gcashOrders = completedOrders.filter((o) => o.paymentMethod === 'GCASH');
    const mayaOrders = completedOrders.filter((o) => o.paymentMethod === 'MAYA');
    const cardOrders = completedOrders.filter((o) => o.paymentMethod === 'CARD');

    const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const ewalletTotal = gcashOrders.concat(mayaOrders).reduce((sum, o) => sum + o.total, 0);
    const cardTotal = cardOrders.reduce((sum, o) => sum + o.total, 0);

    const totalCount = orderVolume || 1;
    const cashPct = Math.round((cashOrders.length / totalCount) * 100);
    const ewalletPct = Math.round(((gcashOrders.length + mayaOrders.length) / totalCount) * 100);
    const cardPct = Math.max(0, 100 - cashPct - ewalletPct);

    return {
      cash: { count: cashOrders.length, total: cashTotal, pct: cashPct },
      ewallet: { count: gcashOrders.length + mayaOrders.length, total: ewalletTotal, pct: ewalletPct },
      card: { count: cardOrders.length, total: cardTotal, pct: cardPct },
    };
  }, [completedOrders, orderVolume]);

  // Time-Series Buckets for Bar Chart ("Overall Sales Acquisition")
  const chartBuckets = useMemo(() => {
    if (selectedPeriod === 'Today') {
      const hours = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
      return hours.map((hour, idx) => {
        const startH = 8 + idx * 2;
        const bucketOrders = completedOrders.filter((o) => {
          const h = new Date(o.createdAt).getHours();
          return h >= startH && h < startH + 2;
        });
        const total = bucketOrders.reduce((sum, o) => sum + o.total, 0);
        return { label: hour, total, count: bucketOrders.length };
      });
    }

    if (selectedPeriod === 'This Week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const now = new Date();
      return days.map((day, idx) => {
        // Calculate offset day relative to this week
        const targetDay = new Date(now.getTime() - (6 - idx) * 24 * 60 * 60 * 1000);
        const dayStart = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate()).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        const bucketOrders = completedOrders.filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd);
        const total = bucketOrders.reduce((sum, o) => sum + o.total, 0);
        return { label: day, total, count: bucketOrders.length };
      });
    }

    // Default: 12 Months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    return months.map((month, idx) => {
      const monthStart = new Date(currentYear, idx, 1).getTime();
      const monthEnd = new Date(currentYear, idx + 1, 1).getTime();
      const bucketOrders = completedOrders.filter((o) => o.createdAt >= monthStart && o.createdAt < monthEnd);
      const total = bucketOrders.reduce((sum, o) => sum + o.total, 0);
      return { label: month, total, count: bucketOrders.length };
    });
  }, [selectedPeriod, completedOrders]);

  const maxBucketSales = useMemo(() => {
    const max = Math.max(...chartBuckets.map((b) => b.total), 1);
    return max;
  }, [chartBuckets]);

  // Peak bucket for the wave curve
  const peakBucket = useMemo(() => {
    let peak = chartBuckets[0] || { label: 'Peak', total: 0, count: 0 };
    chartBuckets.forEach((b) => {
      if (b.total > peak.total) peak = b;
    });
    return peak;
  }, [chartBuckets]);

  // SVG Spline Wave Curve Generation
  const waveSplinePath = useMemo(() => {
    if (chartBuckets.length < 2) {
      return {
        area: 'M 20 140 C 150 140, 300 140, 580 140 L 580 170 L 20 170 Z',
        line: 'M 20 140 C 150 140, 300 140, 580 140',
        peakX: 300,
        peakY: 140,
      };
    }

    const width = 560;
    const height = 130;
    const paddingLeft = 30;
    const paddingTop = 25;
    const stepX = width / (chartBuckets.length - 1);

    const points = chartBuckets.map((b, idx) => {
      const x = paddingLeft + idx * stepX;
      const normalized = maxBucketSales > 0 ? b.total / maxBucketSales : 0;
      const y = paddingTop + (1 - normalized) * height;
      return { x, y, total: b.total, label: b.label };
    });

    // Find peak point coordinates
    let highestPoint = points[0];
    points.forEach((p) => {
      if (p.total > highestPoint.total) highestPoint = p;
    });

    // Build smooth cubic bezier curve
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      linePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`;

    return {
      area: areaPath,
      line: linePath,
      peakX: highestPoint.x,
      peakY: highestPoint.y,
    };
  }, [chartBuckets, maxBucketSales]);

  // Top Selling Items (Product Tab)
  const topSellingProducts = useMemo(() => {
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number; productId: string }>();

    orderItems.forEach((it) => {
      const current = itemMap.get(it.productName) || {
        name: it.productName,
        quantity: 0,
        revenue: 0,
        productId: it.productId,
      };
      current.quantity += it.quantity;
      current.revenue += it.subtotal;
      itemMap.set(it.productName, current);
    });

    const sorted = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);

    // Join with catalog product details
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return sorted.map((item, idx) => {
      const prod = products.find((p) => p.name.toLowerCase() === item.name.toLowerCase() || p.id === item.productId);
      const catName = prod ? categoryMap.get(prod.categoryId) || 'General' : 'General';
      const cost = prod?.cost || 0;
      const price = prod?.price || (item.quantity > 0 ? item.revenue / item.quantity : 0);
      const margin = price > 0 && cost > 0 ? `${Math.round(((price - cost) / price) * 100)}%` : '65%';
      const image = prod?.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=80';

      return {
        rank: idx + 1,
        id: item.productId || `top-${idx}`,
        name: item.name,
        category: catName,
        image,
        soldQty: item.quantity,
        revenue: item.revenue,
        margin,
        stock: prod?.stock ?? 15,
      };
    });
  }, [orderItems, products, categories]);

  // Export CSV Report
  const handleExportCSV = () => {
    try {
      const headers = ['Rank', 'Item Name', 'Category', 'Units Sold', 'Gross Revenue (PHP)', 'Margin', 'Stock Remaining'];
      const rows = topSellingProducts.map((p) => [
        p.rank,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.soldQty,
        p.revenue.toFixed(2),
        `"${p.margin}"`,
        p.stock,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `POS_Sales_Report_${selectedPeriod.replace(/\s+/g, '_')}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Sales report exported to CSV successfully');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast.error('Failed to export CSV report');
    }
  };

  // Recent orders list for table
  const recentOrdersList = useMemo(() => {
    let list = periodOrders;
    if (tableStatusFilter !== 'ALL') {
      list = list.filter((o) => o.status === tableStatusFilter);
    }
    return list.slice(0, 6);
  }, [periodOrders, tableStatusFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 sm:px-7 py-6 select-none bg-slate-50/80 font-sans">
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
              {(['Today', 'This Week', 'This Month', 'This Year', 'All Time'] as const).map((p) => (
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

      {/* Row 1: KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-6 shrink-0">
        {isComputing ? (
          <>
            <div className="lg:col-span-4"><MetricCardSkeleton /></div>
            <div className="lg:col-span-4"><MetricCardSkeleton /></div>
            <div className="lg:col-span-4"><MetricCardSkeleton /></div>
          </>
        ) : (
          <>
            {/* Card 1: Gross Sales / Revenue Card */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center ring-1 ring-purple-100/60 shadow-2xs">
                  <ShoppingBag className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex items-center gap-1.5">
                  {voidedOrders.length > 0 && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      {voidedOrders.length} Voided
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    {selectedPeriod}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 tracking-wide block">Gross Sales</span>
                  <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {currency}{grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">Orders</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1 justify-end mt-0.5">
                    <span>{orderVolume}</span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      +20.00%
                    </span>
                  </p>
                </div>
              </div>

              {voidedTotal > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Cancelled / Voided:</span>
                  <span className="font-bold text-rose-600">-{currency}{voidedTotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Card 2: Customers & Ticket Average Card */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-100/60 shadow-2xs">
                  <Users className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  {selectedPeriod}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 tracking-wide block">Total Tickets / Customers</span>
                  <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
                    <span>{uniqueCustomersCount.toLocaleString()}</span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">Avg Ticket</span>
                  <p className="text-sm font-black text-blue-600 mt-0.5">
                    {currency}{avgTicketValue.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Healthy Basket Metric</span>
                <span className="text-slate-600 font-semibold">{orderVolume} Transactions</span>
              </div>
            </div>

            {/* Card 3: Deep Royal Blue Banner Card (Catalog Performance) */}
            <div className="lg:col-span-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white p-5 rounded-2xl shadow-md shadow-blue-500/25 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5 text-blue-100 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Catalog Performance</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-200 flex items-center gap-1">
                  Live Dexie DB
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-2 border-t border-white/15 z-10">
                <div>
                  <span className="text-[11px] text-blue-100 block truncate">All Products</span>
                  <p className="text-lg font-black text-white mt-0.5">{totalProductsCount}</p>
                  <span className="text-[10px] text-blue-200 font-semibold">In System</span>
                </div>

                <div className="border-l border-white/15 pl-2.5">
                  <span className="text-[11px] text-blue-100 block truncate">In Stock</span>
                  <p className="text-lg font-black text-white mt-0.5">{inStockProductsCount}</p>
                  <span className="text-[10px] text-emerald-300 font-semibold">Available</span>
                </div>

                <div className="border-l border-white/15 pl-2.5">
                  <span className="text-[11px] text-blue-100 block truncate">Completed</span>
                  <p className="text-lg font-black text-white mt-0.5">{totalCompletedLifetime}</p>
                  <span className="text-[10px] text-blue-200 font-semibold">Total Orders</span>
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
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><ChartBarSkeleton /></div>
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs"><ChartSplineSkeleton /></div>
          </>
        ) : (
          <>
            {/* Left Chart: "Overall Sales Acquisition / Revenue Bars" */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                    Overall Sales Acquisition
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedPeriod === 'Today' ? 'Hourly revenue distribution' : 'Periodic revenue volume trends'}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                  {selectedPeriod}
                </span>
              </div>

              {/* Vertical Bar Chart with Light Track Backgrounds */}
              <div className="h-52 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 px-1">
                {chartBuckets.map((item) => {
                  const fillPct = maxBucketSales > 0 ? Math.max(6, Math.round((item.total / maxBucketSales) * 100)) : 6;
                  return (
                    <div
                      key={item.label}
                      className="flex-1 flex flex-col items-center gap-2 group h-full justify-end cursor-pointer"
                      title={`${item.label}: ${currency}${item.total.toFixed(2)} (${item.count} orders)`}
                    >
                      {/* Bar Track */}
                      <div className="w-full max-w-[20px] bg-slate-100 rounded-full h-full flex items-end overflow-hidden p-0.5 relative">
                        {/* Active Fill Bar */}
                        <div
                          style={{ height: `${fillPct}%` }}
                          className="w-full bg-blue-600 rounded-full transition-all duration-300 group-hover:bg-blue-700 shadow-xs"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 mt-1 truncate max-w-[36px] text-center">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 text-xs">
                <span className="text-slate-400 font-medium">Updated in real-time</span>
                <button
                  type="button"
                  onClick={() => onNavigate?.('orders')}
                  className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-0.5 transition"
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Chart: "Overall Sales Activity" (Curved Blue Spline Wave Chart) */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                    Overall Sales Activity
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Peak revenue wave curve</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                  {selectedPeriod}
                </span>
              </div>

              {/* Curved Wave Spline Chart */}
              <div className="relative h-56 w-full pt-4">
                {/* Horizontal Grid guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-mono pr-2">
                  <div className="border-b border-dashed border-slate-100 pb-1 text-right">
                    {currency}{Math.round(maxBucketSales).toLocaleString()}
                  </div>
                  <div className="border-b border-dashed border-slate-100 pb-1 text-right">
                    {currency}{Math.round(maxBucketSales * 0.75).toLocaleString()}
                  </div>
                  <div className="border-b border-dashed border-slate-100 pb-1 text-right">
                    {currency}{Math.round(maxBucketSales * 0.5).toLocaleString()}
                  </div>
                  <div className="border-b border-dashed border-slate-100 pb-1 text-right">
                    {currency}{Math.round(maxBucketSales * 0.25).toLocaleString()}
                  </div>
                  <div className="border-b border-slate-100 pb-1 text-right">{currency}0</div>
                </div>

                {/* Smooth SVG Wave Spline */}
                <svg
                  className="w-full h-44 overflow-visible"
                  viewBox="0 0 600 180"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="waveGradientDynamic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill under curve */}
                  <path d={waveSplinePath.area} fill="url(#waveGradientDynamic)" />

                  {/* Glowing Curved Stroke Line */}
                  <path
                    d={waveSplinePath.line}
                    stroke="#2563EB"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="drop-shadow-md"
                  />

                  {/* Pinpoint Dot on Curve Peak */}
                  <circle cx={waveSplinePath.peakX} cy={waveSplinePath.peakY} r="6" fill="#2563EB" className="animate-pulse" />
                  <circle cx={waveSplinePath.peakX} cy={waveSplinePath.peakY} r="10" stroke="#2563EB" strokeWidth="2" fill="white" />
                  <line
                    x1={waveSplinePath.peakX}
                    y1={waveSplinePath.peakY}
                    x2={waveSplinePath.peakX}
                    y2="170"
                    stroke="#2563EB"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Floating Tooltip Callout Badge at Peak */}
                <div
                  style={{
                    left: `${Math.max(15, Math.min(85, (waveSplinePath.peakX / 600) * 100))}%`,
                    top: `${Math.max(5, Math.min(80, (waveSplinePath.peakY / 180) * 100 - 35))}%`,
                  }}
                  className="absolute -translate-x-1/2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xl text-center pointer-events-none z-20"
                >
                  <span className="text-xs font-black text-slate-900 block">
                    {currency}{peakBucket.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {peakBucket.label} • Peak
                  </span>
                </div>

                {/* Month/Bucket Axis Labels along bottom */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-2 pt-1 border-t border-slate-100">
                  {chartBuckets.map((b) => (
                    <span key={b.label} className="truncate text-center">
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-right">
                <span className="text-xs text-slate-400 font-medium">
                  Average ticket volume: <strong className="text-slate-800">{currency}{avgTicketValue.toFixed(2)}</strong>
                </span>
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
                100% Real
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
                  {/* Base Circle */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="14" />

                  {/* Cash Slice */}
                  {paymentStats.cash.pct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#2563EB"
                      strokeWidth="14"
                      strokeDasharray={`${(paymentStats.cash.pct / 100) * 238} 238`}
                      strokeDashoffset="0"
                      className="transition-all duration-500"
                    />
                  )}

                  {/* E-Wallet Slice */}
                  {paymentStats.ewallet.pct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#F97316"
                      strokeWidth="14"
                      strokeDasharray={`${(paymentStats.ewallet.pct / 100) * 238} 238`}
                      strokeDashoffset={`-${(paymentStats.cash.pct / 100) * 238}`}
                      className="transition-all duration-500"
                    />
                  )}

                  {/* Cards Slice */}
                  {paymentStats.card.pct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="14"
                      strokeDasharray={`${(paymentStats.card.pct / 100) * 238} 238`}
                      strokeDashoffset={`-${((paymentStats.cash.pct + paymentStats.ewallet.pct) / 100) * 238}`}
                      className="transition-all duration-500"
                    />
                  )}
                </svg>

                {/* Inner Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 leading-none">{orderVolume}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">Orders</span>
                </div>
              </div>

              {/* Legend Items */}
              <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Cash Payments</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{paymentStats.cash.pct}%</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {currency}{paymentStats.cash.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span>GCash & Maya E-Wallets</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{paymentStats.ewallet.pct}%</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {currency}{paymentStats.ewallet.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Credit & Debit Cards</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{paymentStats.card.pct}%</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {currency}{paymentStats.card.total.toFixed(2)}
                    </span>
                  </div>
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
                {activeTab === 'product' ? 'Top Selling Menu Items' : 'Recent Transactions'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'product'
                  ? 'Real catalog velocity and high-margin bestsellers'
                  : 'Latest checkout orders and dispatch methods'}
              </p>
            </div>

            {/* Actions: Filter or Export */}
            {activeTab === 'product' ? (
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    tableStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('COMPLETED')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    tableStatusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('VOIDED')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    tableStatusFilter === 'VOIDED' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Voided
                </button>
              </div>
            )}
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
                    <th className="py-2.5 px-3">Order & Customer</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Order Total</th>
                    <th className="py-2.5 px-3">Channel / Type</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isComputing ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)
                ) : activeTab === 'product' ? (
                  topSellingProducts.length > 0 ? (
                    topSellingProducts.slice(0, 5).map((prod) => (
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
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No product sales recorded in this period yet.
                      </td>
                    </tr>
                  )
                ) : (
                  recentOrdersList.length > 0 ? (
                    recentOrdersList.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        {/* Order & Customer */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-100">
                              {ord.cashierName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block font-mono text-[11px]">
                                {ord.orderNumber}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {ord.tableLabel || ord.cashierName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                          {new Date(ord.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(ord.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        {/* Order Total */}
                        <td className="py-3 px-3 font-black text-slate-900">
                          {currency}{ord.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Payment & Type */}
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {ord.paymentMethod}
                            {ord.orderType ? ` • ${ord.orderType}` : ''}
                          </span>
                        </td>

                        {/* Status Pill Badge */}
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              ord.status === 'COMPLETED'
                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                : 'text-rose-700 bg-rose-50 border border-rose-200'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No orders recorded in this period yet.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>
              {activeTab === 'product'
                ? `Showing top ${Math.min(5, topSellingProducts.length)} products`
                : `Showing ${recentOrdersList.length} of ${periodOrders.length} transactions`}
            </span>
            <button
              type="button"
              onClick={() => onNavigate?.('orders')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              {activeTab === 'product' ? 'View All Orders in History' : 'View Full Order History →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
