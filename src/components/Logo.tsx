import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  // Hide the full name on very small screens (header), keeping the mark and "C4C"
  compact?: boolean;
  className?: string;
}

export const ContourIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <circle cx="18" cy="18" r="16" stroke="#16402E" strokeWidth="1.5" strokeOpacity="0.4" />
    <circle cx="18" cy="18" r="11" stroke="#D95D39" strokeWidth="1.75" />
    <circle cx="18" cy="18" r="6" stroke="#16402E" strokeWidth="1.5" />
    <circle cx="18" cy="18" r="2.5" fill="#D95D39" />
  </svg>
);

export const ContourMotifBackground: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 400 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none opacity-20 ${className}`}
  >
    <circle cx="200" cy="100" r="160" stroke="#16402E" strokeWidth="1.2" strokeDasharray="4 4" />
    <circle cx="200" cy="100" r="120" stroke="#16402E" strokeWidth="1.2" />
    <circle cx="200" cy="100" r="85" stroke="#D95D39" strokeWidth="1.5" />
    <circle cx="200" cy="100" r="55" stroke="#16402E" strokeWidth="1.2" />
    <circle cx="200" cy="100" r="30" stroke="#16402E" strokeWidth="1.2" />
    <circle cx="200" cy="100" r="8" fill="#D95D39" />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false, compact = false, className = '' }) => {
  const iconSizes = { sm: 22, md: 28, lg: 38 };
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="bg-[#F8F5EE] border border-[#16402E]/20 p-1 rounded-sm shadow-none">
        <ContourIcon size={iconSizes[size]} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-heading font-extrabold text-[#16402E] tracking-tight text-lg sm:text-xl whitespace-nowrap ${compact ? 'hidden min-[480px]:inline' : ''}`}>
            Center for Centers
          </span>
          <span className="bg-[#16402E] text-[#F8F5EE] text-[10px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider">
            C4C
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-[#555E57] mt-0.5 font-medium tracking-normal">
            Practical access to centers & youth opportunities in Cameroon
          </span>
        )}
      </div>
    </div>
  );
};
