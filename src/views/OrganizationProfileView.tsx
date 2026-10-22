import React, { useState } from 'react';
import { Organization, Opportunity } from '../types';
import { RealAccessPanel } from '../components/RealAccessPanel';
import { OpportunityCard } from '../components/OpportunityCard';
import { SampleDataBadge, TownBadge } from '../components/Badges';
import { ShareButton } from '../components/ShareButton';
import { ReportModal } from '../components/ReportModal';
import { OrgLogo, OrgPicture } from '../components/OrgVisuals';
import { ArrowLeft, MapPin, Phone, Mail, Globe, AlertTriangle, Building2, Sparkles, Camera } from 'lucide-react';

interface OrganizationProfileViewProps {
  organization: Organization;
  opportunities: Opportunity[];
  onBack: () => void;
  onSelectOpportunity: (opp: Opportunity) => void;
}

export const OrganizationProfileView: React.FC<OrganizationProfileViewProps> = ({
  organization,
  opportunities,
  onBack,
  onSelectOpportunity,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  const orgOpportunities = opportunities.filter(
    opp => (opp.orgId === organization.id || opp.orgId === organization.ownerUid) && opp.status === 'approved'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16402E] hover:text-[#D95D39] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to directory</span>
        </button>

        <div className="flex items-center gap-2">
          <ShareButton
            title={organization.name}
            text={`Access details and facilities for ${organization.name} in ${organization.town}`}
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

      {/* Main Profile Card with Photo Banner & Identity Logo */}
      <div className="bg-white border-2 border-[#16402E] rounded-sm overflow-hidden space-y-0">
        {/* Facility Photo Hero Banner */}
        <div className="relative">
          <OrgPicture
            organization={organization}
            aspectRatio="wide"
            showBadge={false}
            className="w-full h-48 sm:h-64 border-b-2 border-[#16402E]"
          />
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-sm bg-[#16402E] text-white border border-[#16402E]">
              {organization.type}
            </span>
            <TownBadge town={organization.town} />
            {organization.isSample && <SampleDataBadge />}
          </div>
          <div className="absolute bottom-2 right-2 bg-[#16402E]/85 text-white text-[10px] px-2 py-0.5 rounded-sm font-semibold flex items-center gap-1">
            <Camera size={11} />
            <span>Verified Facility</span>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-4">
          {/* Logo and Name Header */}
          <div className="flex items-start gap-4">
            <OrgLogo organization={organization} size="lg" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#1C211E] tracking-tight">
                {organization.name}
              </h1>
              <div className="flex items-start gap-1.5 text-sm text-[#445048] mt-1">
                <MapPin size={16} className="text-[#D95D39] shrink-0 mt-0.5" />
                <span>{organization.address}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-[#2C332E] leading-relaxed whitespace-pre-line border-t border-[#E2DDD5] pt-3">
            {organization.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            {organization.contactPhone && (
              <a
                href={`tel:${organization.contactPhone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E2DDD5] px-3 py-1.5 rounded-sm font-semibold text-[#16402E] hover:border-[#16402E]"
              >
                <Phone size={13} className="text-[#16402E]" />
                <span>{organization.contactPhone}</span>
              </a>
            )}
            {organization.contactEmail && (
              <a
                href={`mailto:${organization.contactEmail}`}
                className="inline-flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E2DDD5] px-3 py-1.5 rounded-sm font-semibold text-[#16402E] hover:border-[#16402E]"
              >
                <Mail size={13} className="text-[#16402E]" />
                <span>{organization.contactEmail}</span>
              </a>
            )}
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E2DDD5] px-3 py-1.5 rounded-sm font-semibold text-[#16402E] hover:border-[#16402E]"
              >
                <Globe size={13} className="text-[#D95D39]" />
                <span>Visit Website</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <RealAccessPanel organization={organization} />
      </section>

      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b-2 border-[#16402E] pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#D95D39]" />
            <h2 className="font-heading font-extrabold text-xl text-[#1C211E]">
              Opportunities from {organization.name}
            </h2>
          </div>
          <span className="text-xs font-bold text-[#16402E] bg-[#EFE9DC] px-2 py-0.5 rounded-sm">
            {orgOpportunities.length} active
          </span>
        </div>

        {orgOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgOpportunities.map(opp => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onSelect={onSelectOpportunity}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E2DDD5] p-6 text-center rounded-sm">
            <Building2 size={24} className="text-[#777E79] mx-auto mb-2" />
            <p className="font-bold text-sm text-[#1C211E]">No active public calls right now</p>
            <p className="text-xs text-[#555E57] mt-1">
              Check back soon or contact the organization directly using the phone or email listed above.
            </p>
          </div>
        )}
      </section>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="organization"
        targetId={organization.id}
        targetTitle={organization.name}
      />
    </div>
  );
};
