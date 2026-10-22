import React, { useState } from 'react';
import { Opportunity } from '../types';
import { Maximize2, X, Download, ExternalLink, Image as ImageIcon, Sparkles } from 'lucide-react';

interface EventFlyerProps {
  opportunity: Opportunity;
  className?: string;
}

export const EventFlyerSection: React.FC<EventFlyerProps> = ({ opportunity, className = '' }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const flyerSrc = opportunity.flyerUrl || (!opportunity.imageUrl ? null : null);
  const photoSrc = opportunity.imageUrl;

  if (!opportunity.flyerUrl && !opportunity.imageUrl) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {opportunity.flyerUrl && !imgError && (
        <div className="bg-[#FBF9F5] border-2 border-[#16402E] rounded-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 border-b border-[#E2DDD5] pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#16402E] text-white rounded-xs">
                <Sparkles size={14} className="text-[#D95D39]" />
              </span>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#1C211E]">
                  Official Event Poster & Flyer
                </h3>
                <p className="text-[11px] text-[#555E57]">
                  Click to enlarge, inspect schedule, speakers, and venue details
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLightboxOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#16402E] text-[#16402E] hover:bg-[#16402E] hover:text-white text-xs font-bold rounded-sm transition-colors cursor-pointer"
            >
              <Maximize2 size={13} />
              <span className="hidden sm:inline">Enlarge Poster</span>
            </button>
          </div>

          <div
            onClick={() => setIsLightboxOpen(true)}
            className="relative cursor-pointer group bg-[#16402E]/5 border border-[#16402E]/20 rounded-sm overflow-hidden flex items-center justify-center max-h-[480px]"
          >
            <img
              src={opportunity.flyerUrl}
              alt={`${opportunity.title} official flyer poster`}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[480px] object-contain transition-transform duration-200 group-hover:scale-[1.01]"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-[#16402E]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="px-4 py-2 bg-[#16402E] text-white text-xs font-bold rounded-sm flex items-center gap-2 shadow-sm border border-white/20">
                <Maximize2 size={15} />
                <span>Click to view full flyer</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Event Photo / Activity Banner if provided */}
      {photoSrc && photoSrc !== opportunity.flyerUrl && (
        <div className="bg-[#FBF9F5] border border-[#E2DDD5] rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#16402E] uppercase tracking-wider">
            <ImageIcon size={14} />
            <span>Event & Workshop Photo</span>
          </div>
          <div className="rounded-sm overflow-hidden border border-[#E2DDD5] aspect-video sm:aspect-[21/9] bg-[#16402E]">
            <img
              src={photoSrc}
              alt={`${opportunity.title} event picture`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && opportunity.flyerUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1C211E]/90 backdrop-blur-xs flex flex-col p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="flex items-center justify-between text-white max-w-5xl w-full mx-auto mb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4 className="font-heading font-bold text-sm sm:text-base truncate max-w-md sm:max-w-xl">
                {opportunity.title} — Official Flyer
              </h4>
              <p className="text-[11px] text-[#E2DDD5]">
                {opportunity.orgName || 'Center for Centers'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={opportunity.flyerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#0F2D20] hover:bg-[#16402E] text-white text-xs font-bold rounded-sm border border-[#225C43] flex items-center gap-1.5 transition-colors"
                title="Open original image in new tab"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Open original</span>
              </a>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 bg-[#D95D39] hover:bg-[#B84725] text-white rounded-sm transition-colors"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center overflow-auto max-w-5xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={opportunity.flyerUrl}
              alt={`${opportunity.title} flyer full view`}
              referrerPolicy="no-referrer"
              className="max-h-[85vh] max-w-full object-contain rounded-sm border-2 border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
