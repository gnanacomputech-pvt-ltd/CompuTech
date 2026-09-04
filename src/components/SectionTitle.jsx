import React from 'react';

export const SectionTitle = ({
  badge,
  title,
  subtitle,
  align = 'center', // left, center
  theme = 'light' // light, dark
}) => {
  const isDark = theme === 'dark';
  const isCenter = align === 'center';

  return (
    <div className={`mb-12 ${isCenter ? 'text-center max-w-3xl mx-auto' : 'max-w-2xl'}`}>
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D4A72C]/10 border border-[#D4A72C]/30 text-[#B88918] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A72C]"></span>
          {badge}
        </span>
      )}
      
      <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight ${
        isDark ? 'text-white' : 'text-[#222326]'
      }`}>
        {title}
      </h2>

      {subtitle && (
        <p className={`mt-3 text-base sm:text-lg leading-relaxed ${
          isDark ? 'text-gray-300' : 'text-[#6B6B6B]'
        }`}>
          {subtitle}
        </p>
      )}

      <div className={`mt-4 h-1 w-16 bg-[#D4A72C] rounded-full ${isCenter ? 'mx-auto' : ''}`} />
    </div>
  );
};
