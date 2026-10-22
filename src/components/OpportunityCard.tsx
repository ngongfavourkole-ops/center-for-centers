import React, { useState } from 'react';
import { Opportunity } from '../types';
import { FreeBadge, PaidBadge, ClosingSoonBadge, SampleDataBadge, CategoryBadge, TownBadge } from './Badges';
import { Calendar, Building2, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect: (opp: Opportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const isFree = opportunity.cost === 0;

  const now = new Date();
  const deadlineDate = new Date(opportunity.deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isClosingSoon = daysLeft >= 0 && daysLeft <= 14;

  const formattedDeadline = deadlineDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const cardImage = opportunity.flyerUrl || opportunity.imageUrl;

  return (
    <div
      onClick={() => onSelect(opportunity)}
      className="bg-white border-2 border-[#16402E]/20 hover:border-[#16402E] rounded-sm overflow-hidden cursor-pointer transition-colors flex flex-col justify-between group"
    >
      <div>
        {cardImage && !imageError && (
          <div className="relative aspect-[16/9] w-full bg-[#16402E]/10 overflow-hidden border-b border-[#E2DDD5]">
            <img
              src={cardImage}
              alt={opportunity.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
            {opportunity.flyerUrl && (
              <span className="absolute top-2 right-2 bg-[#16402E] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-xs border border-white/20">
                <ImageIcon size={11} />
                <span>Flyer Attached</span>
              </span>
            )}
          </div>
        )}

        <div className="p-4 pb-2">
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {isFree ? <FreeBadge /> : <PaidBadge cost={opportunity.cost} />}
            <CategoryBadge category={opportunity.category} />
            <TownBadge town={opportunity.town} />
            {isClosingSoon && <ClosingSoonBadge daysLeft={daysLeft} />}
            {opportunity.isSample && <SampleDataBadge />}
          </div>

          <h3 className="font-heading font-bold text-base sm:text-lg text-[#1C211E] group-hover:text-[#16402E] leading-snug line-clamp-2">
            {opportunity.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-[#555E57] mt-1.5 mb-2.5 font-medium">
            <Building2 size={14} className="text-[#16402E] shrink-0" />
            <span className="truncate">{opportunity.orgName || 'Local organization'}</span>
          </div>

          <p className="text-xs text-[#445048] line-clamp-2 leading-relaxed mb-3">
            {opportunity.description}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {opportunity.interests?.slice(0, 3).map((interest, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-[#F8F5EE] text-[#555E57] px-1.5 py-0.5 rounded-sm border border-[#E2DDD5]"
              >
                {interest}
              </span>
            ))}
            {opportunity.educationLevels?.slice(0, 2).map((lvl, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-[#EFE9DC] text-[#1C211E] px-1.5 py-0.5 rounded-sm"
              >
                {lvl}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 border-t border-[#E2DDD5] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#555E57]">
          <Calendar size={13} className="text-[#D95D39]" />
          <span className="font-medium">Deadline: {formattedDeadline}</span>
        </div>
        <span className="inline-flex items-center gap-1 font-bold text-[#16402E] group-hover:text-[#D95D39] text-xs">
          View details
          <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
};
