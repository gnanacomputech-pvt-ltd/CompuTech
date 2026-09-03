import React from 'react';
import { Target, Cpu, UserCheck, Award, BookOpen, Clock } from 'lucide-react';

export const StatsCard = () => {
  const stats = [
    {
      icon: Target,
      title: 'Industry-Focused',
      desc: 'Curriculum structured directly according to Bangalore IT company requirements.',
      highlight: '100% Practical'
    },
    {
      icon: Cpu,
      title: 'Project-Based',
      desc: 'Students build real-world software modules rather than passive theory.',
      highlight: 'Live Coding'
    },
    {
      icon: UserCheck,
      title: 'Student-Centric',
      desc: 'Small batch sizes, individual code walkthroughs, and 1-on-1 viva preparation.',
      highlight: 'Personal Guidance'
    },
    {
      icon: Award,
      title: 'Career-Oriented',
      desc: 'Resume optimization, mock interviews, and direct placement assistance.',
      highlight: 'Verified Certificate'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-6 rounded-2xl border border-[#E8E1D2] hover:border-[#D4A72C] shadow-sm hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-[#FAFAF7] border border-[#E8E1D2] group-hover:bg-[#D4A72C] group-hover:border-[#D4A72C] text-[#D4A72C] group-hover:text-[#17181A] flex items-center justify-center transition-all mb-4">
            <stat.icon className="w-6 h-6" />
          </div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#B88918]">{stat.highlight}</span>
          <h3 className="text-lg font-bold text-[#222326] mt-1 mb-2">{stat.title}</h3>
          <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">{stat.desc}</p>
        </div>
      ))}
    </div>
  );
};
