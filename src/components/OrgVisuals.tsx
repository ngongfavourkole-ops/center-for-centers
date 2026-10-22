import React, { useState } from 'react';
import { Organization } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatLocation } from '../lib/regions';
import { placeTypeLabel } from '../lib/places';
import {
  Building2,
  GraduationCap,
  Monitor,
  Cpu,
  BookOpen,
  Wifi,
  BatteryCharging,
  Users,
  ShoppingBag,
  Lightbulb,
  HeartHandshake,
  Presentation,
  School,
  LucideIcon,
} from 'lucide-react';

const PLACE_TYPE_ICONS: Record<string, LucideIcon> = {
  'Learning center': GraduationCap,
  'Cyber cafe': Monitor,
  'Computer lab': Cpu,
  'Study space': BookOpen,
  'Internet access point': Wifi,
  'Charging point': BatteryCharging,
  Club: Users,
  'Affordable store': ShoppingBag,
  'Technology hub': Lightbulb,
  NGO: HeartHandshake,
  'Training provider': Presentation,
  'Educational institution': School,
};

export function placeTypeIcon(type: string): LucideIcon {
  return PLACE_TYPE_ICONS[type] || Building2;
}

interface OrgLogoProps {
  organization: Organization;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const OrgLogo: React.FC<OrgLogoProps> = ({ organization, size = 'md', className = '' }) => {
  const [logoFailed, setLogoFailed] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 16,
    md: 22,
    lg: 30,
    xl: 38,
  };

  if (organization.logoUrl?.trim() && !logoFailed) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-sm border-2 border-[#16402E] bg-white flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <img
          src={organization.logoUrl}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-contain p-1"
          onError={() => setLogoFailed(true)}
        />
      </div>
    );
  }

  // No logo: an icon for the kind of place
  const Icon = placeTypeIcon(organization.type);
  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 flex items-center justify-center rounded-sm border-2 border-[#16402E] bg-[#EFE9DC] ${sizeClasses[size]} ${className}`}
    >
      <Icon size={iconSizes[size]} className="text-[#16402E]" />
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
  const { t } = useLanguage();
  const [photoFailed, setPhotoFailed] = useState(false);

  const aspectClasses = {
    video: 'aspect-[16/9]',
    wide: 'aspect-[21/9]',
    square: 'aspect-square',
  };

  const hasPhoto = Boolean(organization.imageUrl?.trim()) && !photoFailed;
  const Icon = placeTypeIcon(organization.type);

  return (
    <div className={`relative overflow-hidden bg-[#16402E] rounded-sm border-2 border-[#16402E] ${aspectClasses[aspectRatio]} ${className}`}>
      {hasPhoto ? (
        <img
          src={organization.imageUrl}
          alt={organization.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        // Flat placeholder with the concentric ring motif and the place type icon
        <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="absolute h-[140%] opacity-25" fill="none">
            <circle cx="100" cy="100" r="92" stroke="#F8F5EE" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="68" stroke="#D95D39" strokeWidth="2" />
            <circle cx="100" cy="100" r="44" stroke="#F8F5EE" strokeWidth="1.5" />
          </svg>
          <div className="relative flex flex-col items-center gap-1 text-[#F8F5EE]">
            <Icon size={34} />
            <span className="text-[11px] font-semibold tracking-wide uppercase">{placeTypeLabel(organization.type, t)}</span>
          </div>
        </div>
      )}
      {showBadge && (
        <div className="absolute bottom-0 inset-x-0 bg-[#16402E] text-white px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
          <span className="font-bold truncate text-[11px]">{organization.name}</span>
          <span className="text-[10px] bg-[#0F2D20] text-[#E2DDD5] px-1.5 py-0.5 rounded-sm font-semibold shrink-0">
            {formatLocation(organization, t)}
          </span>
        </div>
      )}
    </div>
  );
};
