import React from 'react';
import { Link } from 'react-router-dom';
import siteLogo from '../../resources/logo/site-logo.png';

export const Logo = ({ variant = 'default', size = 'normal' }) => {
  const isDark = variant === 'dark';

  return (
    <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
      {/* Image Logo */}
      <img src={siteLogo} alt="GNANA COMPUTECH Logo"
           className={`${size === 'large' ? 'w-24 h-24' : 'w-14 h-14'} object-contain flex-shrink-0`} />

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
