import React from 'react';
import { Users, GraduationCap, Building2 } from 'lucide-react';

export const StatsCard = () => {
  const metrics = [
    {
      number: '10,000+',
      label: 'Trained Students',
      sub: 'Across BCA, MCA & Engineering colleges',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      number: '5,000+',
      label: 'Projects & Faculties Trained',
      sub: 'IEEE, MERN, Python & Live Deployments',
      icon: GraduationCap,
      color: 'text-teal-600',
      bg: 'bg-teal-50'
    },
    {
      number: '25+',
      label: 'MoUs — Partner Colleges',
      sub: 'Institutions across Bangalore & Karnataka',
      icon: Building2,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((item, idx) => {
        const IconComp = item.icon;
        return (
          <div 
            key={idx} 
            className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center justify-center group"
          >
            <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
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
