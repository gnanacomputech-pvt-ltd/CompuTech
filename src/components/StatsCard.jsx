import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Building2 } from 'lucide-react';
import { fetchImpactStats } from '../lib/publicContent';

const ICONS = { Users, GraduationCap, Building2 };
const COLORS = [
  { color: 'text-blue-600', bg: 'bg-blue-50' },
  { color: 'text-teal-600', bg: 'bg-teal-50' },
  { color: 'text-amber-600', bg: 'bg-amber-50' },
];

export const StatsCard = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchImpactStats().then((data) => { if (!cancelled) setStats(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((item, idx) => {
        const IconComp = ICONS[item.iconName] || Users;
        const { color, bg } = COLORS[idx % COLORS.length];
        return (
          <div
            key={item.id}
            className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center justify-center group"
          >
            <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <IconComp className="w-7 h-7" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#01083f] tracking-tight mb-1">
              {item.number}
            </div>
            <div className="text-sm font-bold text-gray-800 mb-1">{item.label}</div>
            <div className="text-xs text-gray-500">{item.sub}</div>
          </div>
        );
      })}
    </div>
  );
};
