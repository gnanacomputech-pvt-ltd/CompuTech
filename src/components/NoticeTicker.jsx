import React from 'react';
import { BellRing } from 'lucide-react';

export const NoticeTicker = () => {
  return (
    <div className="bg-[#121316] text-[#ffcc00] border-b border-[#D4A72C]/20 py-2 px-4 overflow-hidden relative text-xs sm:text-sm font-medium flex items-center z-40">
      <div className="flex-shrink-0 flex items-center gap-1.5 bg-[#121316] pr-3 z-10 font-bold text-white border-r border-gray-800">
        <BellRing className="w-4 h-4 text-[#ffcc00] animate-pulse" />
        <span className="hidden sm:inline text-[#ffcc00]">LATEST UPDATE:</span>
      </div>
      <div className="overflow-hidden whitespace-nowrap w-full">
        <span className="site-scroll-text">
          🚀 Admissions & Project Batches Open for 2026! Hands-on BCA/MCA Academic Projects, Full Stack MERN/Python Internships & Campus Technical Workshops — Register at Gnana Computech Solutions, Sunkadakatte, Bangalore!
        </span>
      </div>
    </div>
  );
};
