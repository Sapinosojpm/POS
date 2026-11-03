import React from 'react';

export const CategorySkeleton: React.FC = () => (
  <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col justify-between h-18 animate-pulse">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded bg-slate-200 animate-shimmer" />
      <div className="w-16 h-4 rounded bg-slate-200 animate-shimmer" />
    </div>
    <div className="w-20 h-2.5 rounded bg-slate-200 animate-shimmer" />
  </div>
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between animate-pulse">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-14 h-14 rounded-md bg-slate-200 animate-shimmer shrink-0" />
      <div className="flex-1 space-y-1.5 pt-1">
        <div className="w-3/4 h-3.5 rounded bg-slate-200 animate-shimmer" />
        <div className="w-full h-2.5 rounded bg-slate-200 animate-shimmer" />
        <div className="w-2/3 h-2.5 rounded bg-slate-200 animate-shimmer" />
      </div>
    </div>
    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
      <div className="w-12 h-5 rounded bg-slate-200 animate-shimmer" />
      <div className="w-16 h-6 rounded bg-slate-200 animate-shimmer" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-slate-100">
    <td className="py-3 px-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-slate-200 animate-shimmer shrink-0" />
        <div className="space-y-1">
          <div className="w-28 h-3.5 rounded bg-slate-200 animate-shimmer" />
          <div className="w-20 h-2 rounded bg-slate-200 animate-shimmer" />
        </div>
      </div>
    </td>
    <td className="py-3 px-3"><div className="w-16 h-3 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-3"><div className="w-12 h-3 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-3"><div className="w-12 h-3 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-3"><div className="w-16 h-4 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-3"><div className="w-14 h-5 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-3"><div className="w-24 h-5 rounded bg-slate-200 animate-shimmer" /></td>
    <td className="py-3 px-5 text-right"><div className="w-10 h-6 rounded bg-slate-200 animate-shimmer ml-auto" /></td>
  </tr>
);
