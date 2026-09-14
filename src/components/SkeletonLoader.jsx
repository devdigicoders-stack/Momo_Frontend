import React from 'react';

export const SkeletonRow = ({ columns = 6 }) => {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-slate-200 rounded w-28"></div>
            <div className="h-2.5 bg-slate-100 rounded w-16"></div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="h-3.5 bg-slate-200 rounded w-36"></div>
      </td>
      <td className="py-4 px-4">
        <div className="h-3.5 bg-slate-200 rounded w-24"></div>
      </td>
      <td className="py-4 px-4">
        <div className="h-5 bg-slate-200 rounded-full w-20"></div>
      </td>
      <td className="py-4 px-4">
        <div className="h-5 bg-slate-200 rounded-full w-16"></div>
      </td>
      <td className="py-4 px-4 hidden md:table-cell">
        <div className="h-3.5 bg-slate-200 rounded w-20"></div>
      </td>
      <td className="py-4 px-4 sm:px-6 text-right">
        <div className="flex items-center justify-end space-x-2">
          <div className="w-7 h-7 bg-slate-200 rounded-lg"></div>
          <div className="w-7 h-7 bg-slate-200 rounded-lg"></div>
        </div>
      </td>
    </tr>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <tbody className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </tbody>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-3 bg-slate-200 rounded w-20"></div>
        <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="h-7 bg-slate-200 rounded w-24"></div>
      <div className="h-2.5 bg-slate-100 rounded w-32"></div>
    </div>
  );
};

export default SkeletonTable;
