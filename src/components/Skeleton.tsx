import React from 'react';

/**
 * 1. Category Card Skeleton (Matches 72px 2-row horizontal swipe carousel)
 */
export const CategorySkeleton: React.FC = () => (
  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between h-[72px] min-w-[165px] animate-pulse">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-slate-200 animate-shimmer shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="w-20 h-3 rounded bg-slate-200 animate-shimmer" />
      </div>
    </div>
    <div className="w-16 h-2 rounded bg-slate-200 animate-shimmer" />
  </div>
);

/**
 * 2. Product Touch Card Skeleton (Matches 3-column menu grid)
 */
export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between h-[155px] animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-lg bg-slate-200 animate-shimmer shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="w-3/4 h-3.5 rounded bg-slate-200 animate-shimmer" />
        <div className="w-full h-2.5 rounded bg-slate-200 animate-shimmer" />
        <div className="w-1/2 h-2.5 rounded bg-slate-200 animate-shimmer" />
      </div>
    </div>
    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
      <div className="w-14 h-5 rounded bg-slate-200 animate-shimmer" />
      <div className="w-7 h-7 rounded-lg bg-slate-200 animate-shimmer" />
    </div>
  </div>
);

/**
 * 3. KPI / Metric Card Skeleton (For Inventory & Reports)
 */
export const MetricCardSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-[120px] animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-24 h-3 rounded bg-slate-200 animate-shimmer" />
      <div className="w-10 h-10 rounded-xl bg-slate-200 animate-shimmer" />
    </div>
    <div className="space-y-1 mt-2">
      <div className="w-28 h-6 rounded bg-slate-200 animate-shimmer" />
      <div className="w-16 h-2.5 rounded bg-slate-200 animate-shimmer" />
    </div>
  </div>
);

/**
 * 4. Table Row Skeleton (For Orders, Inventory, and Sales)
 */
export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-slate-100">
    <td className="py-3 px-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-200 animate-shimmer shrink-0" />
        <div className="space-y-1.5">
          <div className="w-28 h-3 rounded bg-slate-200 animate-shimmer" />
          <div className="w-16 h-2 rounded bg-slate-200 animate-shimmer" />
        </div>
      </div>
    </td>
    <td className="py-3 px-3"><div className="w-16 h-3 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-3"><div className="w-14 h-3 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-3"><div className="w-14 h-3 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-3"><div className="w-16 h-4 rounded-full bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-4 text-right"><div className="w-12 h-6 rounded-md bg-slate-200 animate-shimmer ml-auto" /></td>
  </tr>
);

/**
 * 5. Bar Chart Skeleton (For Reports Acquisition Chart)
 */
export const ChartBarSkeleton: React.FC = () => (
  <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100 px-1 animate-pulse">
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
        <div className="w-full max-w-[20px] bg-slate-100 rounded-full h-full flex items-end p-0.5">
          <div
            style={{ height: `${30 + (i % 5) * 15}%` }}
            className="w-full bg-slate-200 animate-shimmer rounded-full"
          />
        </div>
        <div className="w-6 h-2.5 rounded bg-slate-200 animate-shimmer mt-1" />
      </div>
    ))}
  </div>
);

/**
 * 6. Spline Wave Chart Skeleton
 */
export const ChartSplineSkeleton: React.FC = () => (
  <div className="h-56 w-full flex flex-col justify-between pt-4 animate-pulse">
    <div className="w-full h-40 rounded-xl bg-slate-100/80 animate-shimmer flex items-center justify-center text-slate-300">
      <div className="w-3/4 h-2 bg-slate-200 rounded-full" />
    </div>
    <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="w-8 h-2.5 rounded bg-slate-200 animate-shimmer" />
      ))}
    </div>
  </div>
);

/**
 * 7. Donut Chart Skeleton
 */
export const DonutChartSkeleton: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-4 animate-pulse space-y-4">
    <div className="w-36 h-36 rounded-full border-[14px] border-slate-200 animate-shimmer flex items-center justify-center">
      <div className="w-12 h-4 rounded bg-slate-200" />
    </div>
    <div className="w-full space-y-2 pt-2">
      <div className="w-full h-3 rounded bg-slate-200 animate-shimmer" />
      <div className="w-full h-3 rounded bg-slate-200 animate-shimmer" />
      <div className="w-3/4 h-3 rounded bg-slate-200 animate-shimmer" />
    </div>
  </div>
);

/**
 * 8. Shift Staff Roster Card Skeleton
 */
export const ShiftCardSkeleton: React.FC = () => (
  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-200 animate-shimmer shrink-0" />
      <div className="space-y-1.5 flex-1">
        <div className="w-24 h-3 rounded bg-slate-200 animate-shimmer" />
        <div className="w-14 h-2.5 rounded bg-slate-200 animate-shimmer" />
      </div>
    </div>
    <div className="pt-2 border-t border-slate-200/60 flex justify-between">
      <div className="w-28 h-2.5 rounded bg-slate-200 animate-shimmer" />
      <div className="w-12 h-2.5 rounded bg-slate-200 animate-shimmer" />
    </div>
  </div>
);

/**
 * 9. Cart Invoice Item Skeleton
 */
export const InvoiceItemSkeleton: React.FC = () => (
  <div className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-100 bg-slate-50/60 animate-pulse">
    <div className="w-10 h-10 rounded-lg bg-slate-200 animate-shimmer shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="w-24 h-3 rounded bg-slate-200 animate-shimmer" />
      <div className="w-16 h-2 rounded bg-slate-200 animate-shimmer" />
    </div>
    <div className="w-12 h-4 rounded bg-slate-200 animate-shimmer" />
  </div>
);
