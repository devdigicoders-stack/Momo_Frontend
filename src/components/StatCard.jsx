import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'orange', description }) => {
  const colorMap = {
    orange: {
      bg: 'bg-[#FFF0E5]',
      text: 'text-[#F97316]',
      border: 'border-[#FFEDD5]',
      ring: 'ring-[#F97316]/20'
    },
    navy: {
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#172033]',
      border: 'border-[#E2E8F0]',
      ring: 'ring-[#172033]/20'
    },
    green: {
      bg: 'bg-[#DCFCE7]',
      text: 'text-[#16A34A]',
      border: 'border-[#BBF7D0]',
      ring: 'ring-[#16A34A]/20'
    },
    blue: {
      bg: 'bg-[#DBEAFE]',
      text: 'text-[#2563EB]',
      border: 'border-[#BFDBFE]',
      ring: 'ring-[#2563EB]/20'
    },
    red: {
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#DC2626]',
      border: 'border-[#FECACA]',
      ring: 'ring-[#DC2626]/20'
    },
    amber: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#F59E0B]',
      border: 'border-[#FDE68A]',
      ring: 'ring-[#F59E0B]/20'
    }
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:shadow-md hover:border-[#F97316]/40 transition-all group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
            {title}
          </p>
          <h3 className="text-2xl font-black text-[#172033] mt-1 tracking-tight">
            {value}
          </h3>
          {description && (
            <p className="text-xs font-medium text-[#6B7280] mt-1">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${scheme.bg} ${scheme.text} ring-1 ${scheme.ring} group-hover:scale-105 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
