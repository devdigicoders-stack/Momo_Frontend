import React from 'react';

export const SkeletonRow = ({ columns = 6 }) => {
  return (
    <tr className="animate-pulse border-b border-[#E5E7EB]">
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

export const SkeletonTable = ({ rows = 5, columns = 6 }) => {
  return (
    <tbody className="divide-y divide-[#E5E7EB]">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonRow key={index} columns={columns} />
      ))}
    </tbody>
  );
};

export const SkeletonBlock = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 bg-slate-100/80 rounded-xl w-full flex items-center px-4 space-x-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
          <div className="h-3.5 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/6 hidden sm:block"></div>
          <div className="h-3 bg-slate-200 rounded w-1/5 ml-auto"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-3 bg-slate-200 rounded w-20"></div>
        <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
      </div>
      <div className="h-7 bg-slate-200 rounded w-24"></div>
      <div className="h-2.5 bg-slate-100 rounded w-32"></div>
    </div>
  );
};

export const SkeletonLoader = ({ rows = 5, columns = 6, asTable = false }) => {
  if (asTable) {
    return (
      <tbody className="divide-y divide-[#E5E7EB]">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonRow key={index} columns={columns} />
        ))}
      </tbody>
    );
  }
  return <SkeletonBlock rows={rows} />;
};

export default SkeletonLoader;

