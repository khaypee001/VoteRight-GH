import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false, size = 'md', variant = 'light' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const isLight = variant === 'light'; // Light text for dark backgrounds (Royal Blue Header)

  return (
    <div className={`flex items-center gap-2.5 font-sans ${className}`}>
      {/* Circular Checkmark Emblem */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Background circle */}
          <circle cx="18" cy="18" r="16" className="fill-blue-700 stroke-blue-500" strokeWidth="1.5" />
          
          {/* Half Circle Arc */}
          <path
            d="M 28 11 A 13.5 13.5 0 1 0 10 30"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Overlapping Checkmark */}
          <path
            d="M 11 18.5 L 16.5 24 L 28 10"
            stroke="#FFFFFF"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <span className={`${textSizes[size]} font-black tracking-tight ${isLight ? 'text-white' : 'text-blue-950'} select-none`}>
          Vote<span className="text-amber-400">Right</span>
          <span className="bg-amber-400/20 text-amber-500 border border-amber-400/40 text-[10px] font-black px-1.5 py-0.5 rounded ml-1 tracking-wider uppercase inline-block -translate-y-0.5">
            GH
          </span>
        </span>
      )}
    </div>
  );
};
