import React from 'react';
import { Link } from 'react-router-dom';

export const Logo = ({ variant = 'default', size = 'normal' }) => {
  const isDark = variant === 'dark';

  return (
    <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
      {/* SVG Icon Insignia */}
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#222326] to-[#17181A] p-0.5 border border-[#D4A72C]/40 shadow-md group-hover:border-[#D4A72C] transition-all duration-300 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hexagon outline */}
          <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" stroke="#D4A72C" strokeWidth="6" strokeLinejoin="round" fill="none" />
          {/* Stylized 'G' Tech Circuit */}
          <path d="M65 35 C65 35 40 30 35 45 C30 60 45 70 65 65 L65 50 L50 50" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Node Dot */}
          <circle cx="65" cy="35" r="4.5" fill="#D4A72C" />
          <circle cx="50" cy="50" r="3.5" fill="#D4A72C" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`font-extrabold tracking-tight ${size === 'large' ? 'text-2xl' : 'text-lg'} ${isDark ? 'text-white' : 'text-[#222326]'}`}>
            GNANA
          </span>
          <span className={`font-extrabold tracking-tight ${size === 'large' ? 'text-2xl' : 'text-lg'} text-[#D4A72C]`}>
            COMPUTECH
          </span>
        </div>
        <span className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          SOLUTIONS PVT. LTD.
        </span>
      </div>
    </Link>
  );
};
