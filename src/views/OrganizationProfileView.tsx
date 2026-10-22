import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Organization, Opportunity } from '../types';
import { RealAccessPanel } from '../components/RealAccessPanel';
import { LiveStatusPanel } from '../components/LiveStatusPanel';
import { OpportunityCard } from '../components/OpportunityCard';
import { LocationBadge, TeamManagedBadge } from '../components/Badges';
import { SocialLinks } from '../components/SocialLinks';
import { ClaimPlaceModal } from '../components/ClaimPlaceModal';
import { fetchMyClaims } from '../lib/firestoreService';
import { placeTypeLabel, isTeamManaged } from '../lib/places';
import { ShareButton } from '../components/ShareButton';
import { ReportModal } from '../components/ReportModal';
import { OrgLogo, OrgPicture } from '../components/OrgVisuals';
import { useLanguage } from '../context/LanguageContext';
import { formatLocation } from '../lib/regions';
import { ArrowLeft, MapPin, Phone, Mail, AlertTriangle, Building2, Sparkles, BadgeCheck, Info } from 'lucide-react';

interface OrganizationProfileViewProps {
  organization: Organization;
  opportunities: Opportunity[];
  onBack: () => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  user: User | null;
  onSignIn: () => void;
}

export const OrganizationProfileView: React.FC<OrganizationProfileViewProps> = ({
  organization,
  opportunities,
  onBack,
  onSelectOpportunity,
  user,
  onSignIn,
}) => {
  const { t } = useLanguage();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimPending, setClaimPending] = useState(false);
  const teamManaged = isTeamManaged(organization);

  // Show "waiting for review" instead of the claim button if this user already claimed it
  useEffect(() => {
    if (!user || !teamManaged) {
      setClaimPending(false);
      return;
    }
    let cancelled = false;
    fetchMyClaims(user.uid)
      .then(claims => {
        if (!cancelled) {
          setClaimPending(claims.some(c => c.orgId === organization.id && c.status === 'pending'));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, organization.id, teamManaged]);

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
          <span>{t.backToPlaces}</span>
        </button>

        <div className="flex items-center gap-2">
          <ShareButton
            title={organization.name}
            text={t.shareTextPlace.replace('{name}', organization.name).replace('{location}', formatLocation(organization, t))}
          />
          <button
            onClick={() => setShowReportModal(true)}
            className="text-xs text-[#555E57] hover:text-[#A51D24] font-medium flex items-center gap-1 border border-[#E2DDD5] px-2.5 py-2 rounded-sm bg-white"
            title={t.reportIncorrect}
          >
            <AlertTriangle size={13} className="text-[#A51D24]" />
            <span className="hidden sm:inline">{t.reportIssue}</span>
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
              {placeTypeLabel(organization.type, t)}
            </span>
            <LocationBadge item={organization} />
            {teamManaged && <TeamManagedBadge />}
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
          </div>

          <SocialLinks organization={organization} />
        </div>
      </div>

      {teamManaged && (
        <section className="bg-[#FBECE7] border-2 border-[#D95D39]/40 rounded-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-2">
            <Info size={18} aria-hidden="true" className="text-[#8F3A20] shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <p className="font-bold text-sm text-[#1C211E]">{t.teamManaged}</p>
              <p className="text-xs text-[#445048]">{t.teamManagedDesc}</p>
              {organization.sourceNote && (
                <p className="text-xs text-[#445048] break-words">
                  <span className="font-bold">{t.sourceLabel}: </span>
                  {organization.sourceNote}
                </p>
              )}
            </div>
          </div>
          {claimPending ? (
            <p className="text-xs font-semibold text-[#16402E] bg-white border border-[#BACCC0] rounded-sm px-3 py-2">
              {t.claimPending}
            </p>
          ) : (
            <button
              onClick={() => setShowClaimModal(true)}
              className="px-4 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] inline-flex items-center gap-1.5"
            >
              <BadgeCheck size={14} aria-hidden="true" />
              <span>{t.claimThisPlace}</span>
            </button>
          )}
        </section>
      )}

      <section className="space-y-4">
        <LiveStatusPanel orgId={organization.id} user={user} onSignIn={onSignIn} />
        <RealAccessPanel organization={organization} />
      </section>

      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b-2 border-[#16402E] pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#D95D39]" />
            <h2 className="font-heading font-extrabold text-xl text-[#1C211E]">
              {t.opportunitiesFrom.replace('{name}', organization.name)}
            </h2>
          </div>
          <span className="text-xs font-bold text-[#16402E] bg-[#EFE9DC] px-2 py-0.5 rounded-sm">
            {t.activeCount.replace('{count}', String(orgOpportunities.length))}
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
            <p className="font-bold text-sm text-[#1C211E]">{t.noActiveCalls}</p>
            <p className="text-xs text-[#555E57] mt-1">
              {t.noActiveCallsDesc}
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

      {teamManaged && (
        <ClaimPlaceModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          organization={organization}
          user={user}
          onSignIn={onSignIn}
          onClaimSent={() => setClaimPending(true)}
        />
      )}
    </div>
  );
};
