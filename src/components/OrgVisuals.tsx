import React from 'react';
import { Organization } from '../types';
import { Building2 } from 'lucide-react';

interface OrgLogoProps {
  organization: Organization;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const OrgLogo: React.FC<OrgLogoProps> = ({ organization, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 34,
    xl: 44,
  };

  // If organization provides an external logo URL or image
  if (organization.logoUrl && organization.logoUrl.trim().length > 0) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-sm border-2 border-[#16402E] bg-white flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <img
          src={organization.logoUrl}
          alt={`${organization.name} logo`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Hide broken image and fallback to SVG emblem
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Authentic custom emblem based on organization identity
  const name = organization.name.toLowerCase();

  let emblemContent = (
    <Building2 size={iconSizes[size]} className="text-[#16402E]" />
  );
  let bgClass = 'bg-[#EFE9DC] border-[#16402E]';

  if (name.includes('silicon mountain')) {
    bgClass = 'bg-[#16402E] border-[#0F2D20] text-white';
    emblemContent = (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 40 40" fill="none">
        {/* Mountain peak */}
        <polygon points="20,6 34,32 6,32" fill="#D95D39" opacity="0.9" />
        <polygon points="20,12 30,32 10,32" fill="#16402E" />
        {/* Tech network nodes */}
        <circle cx="20" cy="18" r="2.5" fill="#F8F5EE" />
        <circle cx="15" cy="27" r="2" fill="#D95D39" />
        <circle cx="25" cy="27" r="2" fill="#D95D39" />
        <line x1="20" y1="18" x2="15" y2="27" stroke="#F8F5EE" strokeWidth="1.5" />
        <line x1="20" y1="18" x2="25" y2="27" stroke="#F8F5EE" strokeWidth="1.5" />
      </svg>
    );
  } else if (name.includes('eco-action') || name.includes('eco')) {
    bgClass = 'bg-[#16402E] border-[#225C43] text-white';
    emblemContent = (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 40 40" fill="none">
        {/* Earth & Seedling leaf */}
        <circle cx="20" cy="20" r="16" stroke="#225C43" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M20 30 C 20 22, 14 16, 8 16 C 8 24, 14 30, 20 30 Z" fill="#225C43" />
        <path d="M20 30 C 20 20, 28 12, 32 10 C 32 20, 26 30, 20 30 Z" fill="#D95D39" />
        <line x1="20" y1="30" x2="20" y2="12" stroke="#F8F5EE" strokeWidth="2" />
      </svg>
    );
  } else if (name.includes('maritime') || name.includes('limbe')) {
    bgClass = 'bg-[#1C211E] border-[#16402E] text-white';
    emblemContent = (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 40 40" fill="none">
        {/* Coastal waves and solar rays */}
        <circle cx="20" cy="14" r="5" fill="#D95D39" />
        <line x1="20" y1="5" x2="20" y2="8" stroke="#D95D39" strokeWidth="2" />
        <line x1="12" y1="8" x2="14" y2="10" stroke="#D95D39" strokeWidth="2" />
        <line x1="28" y1="8" x2="26" y2="10" stroke="#D95D39" strokeWidth="2" />
        <path d="M8 26 C 14 24, 18 28, 24 26 C 30 24, 34 28, 36 26" stroke="#F8F5EE" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M6 31 C 12 29, 16 33, 22 31 C 28 29, 32 33, 36 31" stroke="#225C43" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  } else if (name.includes('digital') || name.includes('coding')) {
    bgClass = 'bg-[#16402E] border-[#16402E] text-white';
    emblemContent = (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 40 40" fill="none">
        {/* Terminal code prompt with rings */}
        <rect x="6" y="8" width="28" height="24" rx="2" stroke="#F8F5EE" strokeWidth="2" />
        <path d="M11 16 L 15 20 L 11 24" stroke="#D95D39" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="24" x2="26" y2="24" stroke="#F8F5EE" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  } else if (name.includes('agribusiness') || name.includes('tiko')) {
    bgClass = 'bg-[#EFE9DC] border-[#D95D39] text-[#1C211E]';
    emblemContent = (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 40 40" fill="none">
        {/* Gear and sprout */}
        <circle cx="20" cy="20" r="14" stroke="#16402E" strokeWidth="2" />
        <circle cx="20" cy="20" r="6" fill="#D95D39" />
        <path d="M20 14 C 20 8, 26 6, 28 6 C 28 12, 24 14, 20 14 Z" fill="#16402E" />
      </svg>
    );
  } else if (name.includes('women')) {
    bgClass = 'bg-[#FBECE7] border-[#D95D39] text-[#D95D39]';
    emblemContent = (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="16" r="8" stroke="#D95D39" strokeWidth="2.5" />
        <line x1="20" y1="24" x2="20" y2="34" stroke="#D95D39" strokeWidth="2.5" />
        <line x1="15" y1="29" x2="25" y2="29" stroke="#D95D39" strokeWidth="2.5" />
        <circle cx="20" cy="16" r="3.5" fill="#16402E" />
      </svg>
    );
  } else if (name.includes('makerspace') || name.includes('kumba')) {
    bgClass = 'bg-[#1C211E] border-[#D95D39] text-white';
    emblemContent = (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 40 40" fill="none">
        {/* 3D Printer & Wrench */}
        <rect x="10" y="8" width="20" height="18" rx="1" stroke="#F8F5EE" strokeWidth="1.75" />
        <line x1="10" y1="16" x2="30" y2="16" stroke="#D95D39" strokeWidth="1.5" />
        <polygon points="18,16 22,16 20,22" fill="#D95D39" />
        <line x1="8" y1="31" x2="32" y2="31" stroke="#F8F5EE" strokeWidth="2" />
        <circle cx="20" cy="28" r="2.5" fill="#D95D39" />
      </svg>
    );
  } else if (name.includes('science') || name.includes('lab')) {
    bgClass = 'bg-[#0F2D20] border-[#16402E] text-white';
    emblemContent = (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 40 40" fill="none">
        {/* Atom orbital with central nucleus */}
        <ellipse cx="20" cy="20" rx="15" ry="6" stroke="#F8F5EE" strokeWidth="1.5" transform="rotate(30 20 20)" />
        <ellipse cx="20" cy="20" rx="15" ry="6" stroke="#D95D39" strokeWidth="1.5" transform="rotate(-30 20 20)" />
        <circle cx="20" cy="20" r="3.5" fill="#D95D39" />
      </svg>
    );
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-sm border-2 font-heading font-extrabold shadow-none select-none ${sizeClasses[size]} ${bgClass} ${className}`}
      title={organization.name}
    >
      {emblemContent}
    </div>
  );
};

interface OrgPictureProps {
  organization: Organization;
  className?: string;
  aspectRatio?: 'video' | 'wide' | 'square';
  showBadge?: boolean;
}

export const OrgPicture: React.FC<OrgPictureProps> = ({
  organization,
  className = '',
  aspectRatio = 'video',
  showBadge = true,
}) => {
  const aspectClasses = {
    video: 'aspect-[16/9]',
    wide: 'aspect-[21/9]',
    square: 'aspect-square',
  };

  const name = organization.name.toLowerCase();

  // Map to generated authentic Cameroon photos if not explicitly set
  let photoSrc = organization.imageUrl;
  if (!photoSrc) {
    if (name.includes('silicon mountain') || name.includes('women in tech')) {
      photoSrc = '/src/assets/images/buea_tech_hub_1792614513941.jpg';
    } else if (name.includes('eco-action') || name.includes('agribusiness') || name.includes('tiko')) {
      photoSrc = '/src/assets/images/eco_youth_lab_1792614515236.jpg';
    } else if (name.includes('maritime') || name.includes('limbe')) {
      photoSrc = '/src/assets/images/limbe_maritime_lab_1792614516846.jpg';
    } else if (name.includes('digital') || name.includes('science')) {
      photoSrc = '/src/assets/images/buea_digital_lab_1792614516637.jpg';
    } else if (name.includes('makerspace') || name.includes('kumba')) {
      photoSrc = '/src/assets/images/makerspace_workshop_1792614516575.jpg';
    } else {
      photoSrc = '/src/assets/images/buea_tech_hub_1792614513941.jpg';
    }
  }

  return (
    <div className={`relative overflow-hidden bg-[#16402E] rounded-sm border-2 border-[#16402E] group ${aspectClasses[aspectRatio]} ${className}`}>
      <img
        src={photoSrc}
        alt={`Campus and workspace of ${organization.name}`}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* Subtle solid overlay at bottom for title legibility */}
      {showBadge && (
        <div className="absolute bottom-0 inset-x-0 bg-[#16402E]/90 text-white px-3 py-1.5 flex items-center justify-between text-xs">
          <span className="font-bold truncate text-[11px]">{organization.name}</span>
          <span className="text-[10px] bg-[#0F2D20] text-[#E2DDD5] px-1.5 py-0.5 rounded-sm font-semibold shrink-0">
            {organization.town}
          </span>
        </div>
      )}
    </div>
  );
};
