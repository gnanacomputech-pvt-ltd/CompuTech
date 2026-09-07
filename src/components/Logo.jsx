import React from 'react';
import { Link } from 'react-router-dom';
import siteLogo from '../../resources/logo/site-logo.png';

export const Logo = ({ variant = 'default', size = 'normal', stacked = false }) => {
  const isDark = variant === 'dark';

  return (
    <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
      {/* Image Logo */}
      <img src={siteLogo} alt="GNANA COMPUTECH Logo"
           className={`${size === 'large' ? 'w-24 h-24' : 'w-12 h-12'} object-contain flex-shrink-0`} />

      {/* Brand Text */}
      <div className="flex flex-col leading-tight">
        {stacked ? (
          <>
            <span className={`font-extrabold tracking-tight ${size === 'large' ? 'text-xl' : 'text-sm'} ${isDark ? 'text-white' : 'text-[#222326]'}`}>
              GNANA
            </span>
            <span className={`font-extrabold tracking-tight ${size === 'large' ? 'text-xl' : 'text-sm'} text-[#D4A72C]`}>
              COMPUTECH
            </span>
            <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-wider mt-0.5 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              SOLUTIONS PRIVATE LIMITED
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <span className={`font-extrabold tracking-tight ${size === 'large' ? 'text-2xl' : 'text-lg'} ${isDark ? 'text-white' : 'text-[#222326]'}`}>
                GNANA
              </span>
              <span className={`font-extrabold tracking-tight ${size === 'large' ? 'text-2xl' : 'text-lg'} text-[#D4A72C]`}>
                COMPUTECH
              </span>
            </div>
            <span className={`text-[8.5px] sm:text-[9.5px] uppercase font-bold tracking-wider whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              SOLUTIONS PRIVATE LIMITED
            </span>
          </>
        )}
      </div>
    </Link>
  );
};
