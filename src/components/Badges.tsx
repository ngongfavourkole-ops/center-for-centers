import React from 'react';
import { ApprovalStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatLocation } from '../lib/regions';

export const FreeBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-sm bg-[#16402E] text-[#F8F5EE] border border-[#16402E] ${className}`}>
    Free
  </span>
);

export const PaidBadge: React.FC<{ cost: number; className?: string }> = ({ cost, className = '' }) => (
  <span className={`inline-flex items-center text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-sm bg-[#EFE9DC] text-[#1C211E] border border-[#E2DDD5] ${className}`}>
    {cost.toLocaleString()} XAF
  </span>
);

export const ClosingSoonBadge: React.FC<{ daysLeft: number; className?: string }> = ({ daysLeft, className = '' }) => (
  <span className={`inline-flex items-center text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-sm bg-[#D95D39] text-[#FFFFFF] border border-[#B84725] ${className}`}>
    {daysLeft <= 0 ? 'Closes today' : `Closes in ${daysLeft}d`}
  </span>
);

export const SampleDataBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm bg-[#EFE9DC] text-[#6E4215] border border-[#D5C2A5] ${className}`} title="Demonstration record">
    Sample data
  </span>
);

export const StatusBadge: React.FC<{ status: ApprovalStatus; className?: string }> = ({ status, className = '' }) => {
  switch (status) {
    case 'approved':
      return (
        <span className={`inline-flex items-center text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-sm bg-[#16402E] text-white border border-[#16402E] ${className}`}>
          Approved
        </span>
      );
    case 'pending':
      return (
        <span className={`inline-flex items-center text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-sm bg-[#FFF4DE] text-[#8C5800] border border-[#F3D594] ${className}`}>
          Pending review
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-sm bg-[#FCE8E6] text-[#A51D24] border border-[#F5C2C7] ${className}`}>
          Needs revision
        </span>
      );
    default:
      return null;
  }
};

export const CategoryBadge: React.FC<{ category: string; className?: string }> = ({ category, className = '' }) => (
  <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-sm bg-[#EAE4D7] text-[#1C211E] border border-[#DDD6C8] ${className}`}>
    {category}
  </span>
);

export const LocationBadge: React.FC<{ item: { region?: string; town?: string }; className?: string }> = ({
  item,
  className = '',
}) => {
  const { t } = useLanguage();
  const label = formatLocation(item, t);
  if (!label) return null;
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#F8F5EE] text-[#16402E] border border-[#16402E]/30 ${className}`}>
      {label}
    </span>
  );
};
