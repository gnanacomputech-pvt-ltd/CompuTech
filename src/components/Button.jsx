import React from 'react';
import { Link } from 'react-router-dom';

export const Button = ({
  children,
  to,
  onClick,
  variant = 'primary', // primary, secondary, charcoal, ghost, outline
  size = 'md', // sm, md, lg
  className = '',
  type = 'button',
  disabled = false,
  icon: Icon,
  iconPosition = 'right'
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4A72C] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5'
  };

  const variants = {
    primary: 'bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] shadow-md shadow-[#D4A72C]/20 hover:shadow-lg hover:shadow-[#D4A72C]/30 active:scale-[0.98]',
    secondary: 'bg-[#222326] hover:bg-[#17181A] text-white shadow-md active:scale-[0.98]',
    charcoal: 'bg-[#17181A] hover:bg-[#222326] text-[#D4A72C] border border-[#D4A72C]/30 shadow-md active:scale-[0.98]',
    outline: 'bg-transparent border-2 border-[#D4A72C] text-[#252525] hover:bg-[#D4A72C] hover:text-[#17181A] active:scale-[0.98]',
    ghost: 'bg-transparent text-[#252525] hover:bg-[#E8E1D2]/50 hover:text-[#B88918]'
  };

  const combinedClass = `${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`;

  const content = (
    <>
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClass} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={combinedClass} disabled={disabled}>
      {content}
    </button>
  );
};
