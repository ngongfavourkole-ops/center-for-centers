import React from 'react';
import { Organization } from '../types';
import { SampleDataBadge, LocationBadge } from './Badges';
import { OrgLogo, OrgPicture } from './OrgVisuals';
import { MapPin, Zap, Wifi, ArrowRight, ShieldCheck } from 'lucide-react';

interface OrganizationCardProps {
  organization: Organization;
  onSelect: (org: Organization) => void;
  opportunityCount?: number;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  onSelect,
  opportunityCount,
}) => {
  return (
    <div
      onClick={() => onSelect(organization)}
      className="bg-white border-2 border-[#16402E]/20 hover:border-[#16402E] rounded-sm overflow-hidden cursor-pointer transition-colors flex flex-col justify-between group"
    >
      <div>
        {/* Facility Picture Banner */}
        <div className="relative">
          <OrgPicture organization={organization} aspectRatio="video" showBadge={false} />
          {/* Top badges floating over image */}
          <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-[#16402E] text-white border border-[#16402E]">
              {organization.type}
            </span>
            <LocationBadge item={organization} />
            {organization.isSample && <SampleDataBadge />}
          </div>
        </div>

        {/* Content body */}
        <div className="p-4">
          {/* Logo and Name row */}
          <div className="flex items-start gap-3 mb-2">
            <OrgLogo organization={organization} size="md" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-base sm:text-lg text-[#1C211E] group-hover:text-[#16402E] leading-snug">
                {organization.name}
              </h3>
              <div className="flex items-start gap-1 text-xs text-[#555E57] mt-0.5">
                <MapPin size={13} className="text-[#D95D39] shrink-0 mt-0.5" />
                <span className="line-clamp-1">{organization.address}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#445048] line-clamp-2 leading-relaxed mb-3">
            {organization.description}
          </p>

          {/* Practical specs mini-grid */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-3">
            <div className="flex items-center gap-1 bg-[#F8F5EE] border border-[#E2DDD5] px-2 py-1 rounded-sm text-[#1C211E]">
              <Zap size={12} className="text-[#D95D39] shrink-0" />
              <span className="truncate">{organization.powerReliability}</span>
            </div>
            <div className="flex items-center gap-1 bg-[#F8F5EE] border border-[#E2DDD5] px-2 py-1 rounded-sm text-[#1C211E]">
              <Wifi size={12} className="text-[#16402E] shrink-0" />
              <span className="truncate">{organization.internetReliability} internet</span>
            </div>
          </div>

          {/* Facilities tags */}
          <div className="flex flex-wrap gap-1 mb-1">
            {organization.facilities?.slice(0, 3).map((fac, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-[#EFE9DC] text-[#445048] px-1.5 py-0.5 rounded-sm"
              >
                {fac}
              </span>
            ))}
            {organization.facilities && organization.facilities.length > 3 && (
              <span className="text-[10px] text-[#555E57] font-medium px-1 py-0.5">
                +{organization.facilities.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-4 pb-3.5 pt-2.5 border-t border-[#E2DDD5] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-[#16402E] font-medium text-[11px]">
          <ShieldCheck size={13} className="text-[#16402E]" />
          <span>{opportunityCount !== undefined ? `${opportunityCount} active offers` : 'Verified specs'}</span>
        </div>
        <span className="inline-flex items-center gap-1 font-bold text-[#16402E] group-hover:text-[#D95D39]">
          View center
          <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
};
