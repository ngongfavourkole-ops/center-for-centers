import React, { useState } from 'react';
import { Opportunity, Organization } from '../types';
import { FreeBadge, PaidBadge, ClosingSoonBadge, CategoryBadge, LocationBadge } from '../components/Badges';
import { ShareButton } from '../components/ShareButton';
import { ReportModal } from '../components/ReportModal';
import { OrgLogo } from '../components/OrgVisuals';
import { EventFlyerSection } from '../components/EventVisuals';
import { useLanguage } from '../context/LanguageContext';
import { formatLocation } from '../lib/regions';
import { placeTypeLabel } from '../lib/places';
import { ArrowLeft, ExternalLink, Calendar, MapPin, Building2, AlertTriangle, UserCheck, CheckCircle2 } from 'lucide-react';

interface OpportunityDetailViewProps {
  opportunity: Opportunity;
  organization?: Organization | null;
  onBack: () => void;
  onSelectOrganization: (org: Organization) => void;
}

export const OpportunityDetailView: React.FC<OpportunityDetailViewProps> = ({
  opportunity,
  organization,
  onBack,
  onSelectOrganization,
}) => {
  const { t } = useLanguage();
  const [showReportModal, setShowReportModal] = useState(false);

  const isFree = opportunity.cost === 0;

  const now = new Date();
  const deadlineDate = new Date(opportunity.deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isClosingSoon = daysLeft >= 0 && daysLeft <= 14;

  const formattedDeadline = deadlineDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedStartDate = opportunity.startDate
    ? new Date(opportunity.startDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16402E] hover:text-[#D95D39] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to list</span>
        </button>

        <div className="flex items-center gap-2">
          <ShareButton
            title={opportunity.title}
            text={`Check out this ${opportunity.category} in ${formatLocation(opportunity, t)}: ${opportunity.title}`}
          />
          <button
            onClick={() => setShowReportModal(true)}
            className="text-xs text-[#555E57] hover:text-[#A51D24] font-medium flex items-center gap-1 border border-[#E2DDD5] px-2.5 py-2 rounded-sm bg-white"
            title="Report incorrect information"
          >
            <AlertTriangle size={13} className="text-[#A51D24]" />
            <span className="hidden sm:inline">Report issue</span>
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-[#16402E] rounded-sm p-5 sm:p-7 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {isFree ? <FreeBadge /> : <PaidBadge cost={opportunity.cost} />}
          <CategoryBadge category={opportunity.category} />
          <LocationBadge item={opportunity} />
          {isClosingSoon && <ClosingSoonBadge daysLeft={daysLeft} />}
        </div>

        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#1C211E] leading-tight">
            {opportunity.title}
          </h1>
          {opportunity.orgName && (
            <div className="mt-2 text-sm text-[#555E57] flex items-center gap-1.5 font-medium">
              <span>Organized by:</span>
              <span className="text-[#16402E] font-bold">{opportunity.orgName}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FBF9F5] border border-[#E2DDD5] rounded-sm text-xs">
          <div>
            <div className="font-bold text-[#555E57] uppercase tracking-wider text-[11px] flex items-center gap-1 mb-1">
              <Calendar size={13} className="text-[#D95D39]" />
              <span>Application Deadline</span>
            </div>
            <div className="font-bold text-[#1C211E] text-sm">
              {formattedDeadline}
            </div>
            {isClosingSoon && (
              <span className="text-[11px] text-[#D95D39] font-semibold">
                Only {daysLeft} days remaining
              </span>
            )}
          </div>

          <div>
            <div className="font-bold text-[#555E57] uppercase tracking-wider text-[11px] flex items-center gap-1 mb-1">
              <Calendar size={13} className="text-[#16402E]" />
              <span>Start Date</span>
            </div>
            <div className="font-bold text-[#1C211E] text-sm">
              {formattedStartDate || 'Flexible / Upon acceptance'}
            </div>
          </div>

          <div>
            <div className="font-bold text-[#555E57] uppercase tracking-wider text-[11px] flex items-center gap-1 mb-1">
              <MapPin size={13} className="text-[#16402E]" />
              <span>Location</span>
            </div>
            <div className="font-bold text-[#1C211E] text-sm">
              {formatLocation(opportunity, t)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#EFE9DC] border-2 border-[#16402E] rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-[#16402E]">
              Participation Fee
            </div>
            <div className="font-heading font-extrabold text-xl text-[#1C211E]">
              {isFree ? '100% Free of charge' : `${opportunity.cost.toLocaleString()} XAF`}
            </div>
            {opportunity.costNote && (
              <p className="text-xs text-[#445048] mt-0.5 max-w-md">{opportunity.costNote}</p>
            )}
          </div>

          {opportunity.registrationLink ? (
            <a
              href={opportunity.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-[#D95D39] hover:bg-[#B84725] text-white font-bold text-sm rounded-sm transition-colors flex items-center justify-center gap-2 border border-[#B84725] shrink-0"
            >
              <span>Register Now</span>
              <ExternalLink size={16} />
            </a>
          ) : (
            <div className="text-xs text-[#555E57] font-medium bg-white px-3 py-2 border border-[#E2DDD5] rounded-sm">
              Contact organization directly for registration
            </div>
          )}
        </div>

        {/* Event Flyer / Schedule Poster & Pictures */}
        <EventFlyerSection opportunity={opportunity} />

        <div className="space-y-3 pt-2">
          <h2 className="font-heading font-bold text-lg text-[#1C211E] border-b border-[#E2DDD5] pb-1">
            Program Description
          </h2>
          <p className="text-sm text-[#2C332E] leading-relaxed whitespace-pre-line">
            {opportunity.description}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <h2 className="font-heading font-bold text-lg text-[#1C211E] border-b border-[#E2DDD5] pb-1 flex items-center gap-1.5">
            <UserCheck size={18} className="text-[#16402E]" />
            <span>Eligibility & Requirements</span>
          </h2>
          <div className="bg-[#F8F5EE] border border-[#E2DDD5] p-4 rounded-sm text-sm text-[#2C332E] leading-relaxed">
            {opportunity.eligibility || 'Open to all interested applicants.'}
          </div>

          {opportunity.educationLevels && opportunity.educationLevels.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold text-[#1C211E] block mb-1 uppercase tracking-wider">
                Target Education Levels:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.educationLevels.map((lvl, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-[#EFE9DC] text-[#1C211E] font-medium px-2.5 py-1 rounded-sm border border-[#DDD6C8] flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} className="text-[#16402E]" />
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
          )}

          {opportunity.interests && opportunity.interests.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold text-[#1C211E] block mb-1 uppercase tracking-wider">
                Focus Areas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-[#F8F5EE] text-[#445048] font-medium px-2 py-0.5 rounded-sm border border-[#E2DDD5]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {organization && (
          <div className="pt-4 border-t-2 border-[#16402E]">
            <span className="text-xs font-bold text-[#555E57] uppercase tracking-wider block mb-2">
              Host Organization
            </span>
            <div
              onClick={() => onSelectOrganization(organization)}
              className="bg-[#FBF9F5] border-2 border-[#16402E]/30 hover:border-[#16402E] p-4 rounded-sm cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <OrgLogo organization={organization} size="md" className="shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-[#16402E] bg-[#E8EFEA] px-2 py-0.5 rounded-sm">
                      {placeTypeLabel(organization.type, t)}
                    </span>
                    <span className="text-xs text-[#555E57]">{formatLocation(organization, t)}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#1C211E] group-hover:text-[#16402E]">
                    {organization.name}
                  </h3>
                  <p className="text-xs text-[#555E57] mt-1 line-clamp-1">{organization.address}</p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16402E] group-hover:text-[#D95D39] shrink-0"
              >
                <Building2 size={15} />
                <span>View Full Access Specs</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="opportunity"
        targetId={opportunity.id}
        targetTitle={opportunity.title}
      />
    </div>
  );
};
