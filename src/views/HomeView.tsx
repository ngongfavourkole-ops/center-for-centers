import React, { useState } from 'react';
import { Opportunity, Organization, NavFilters } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CAMEROON_REGIONS } from '../lib/regions';
import { PLACE_TYPES, placeTypeLabel } from '../lib/places';
import { placeTypeIcon } from '../components/OrgVisuals';

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="bg-white border-2 border-dashed border-[#E2DDD5] p-6 text-center rounded-sm">
    <p className="font-heading font-bold text-base text-[#1C211E]">{title}</p>
    <p className="text-xs text-[#555E57] mt-1 max-w-sm mx-auto">{description}</p>
  </div>
);
import { OpportunityCard } from '../components/OpportunityCard';
import { OrganizationCard } from '../components/OrganizationCard';
import { ContourMotifBackground } from '../components/Logo';
import { Search, ArrowRight, Compass, Sparkles, Building2, BookOpen } from 'lucide-react';

interface HomeViewProps {
  opportunities: Opportunity[];
  organizations: Organization[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onSelectOrganization: (org: Organization) => void;
  onNavigateTab: (tab: 'opportunities' | 'organizations', filters?: NavFilters) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  opportunities,
  organizations,
  onSelectOpportunity,
  onSelectOrganization,
  onNavigateTab,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRegion, setSearchRegion] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const activeOpportunities = opportunities.filter(opp => !opp.deadline || opp.deadline >= todayStr);

  const closingSoon = activeOpportunities
    .filter(opp => {
      if (!opp.deadline) return false;
      const d = new Date(opp.deadline);
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 14;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const freeOpportunities = activeOpportunities
    .filter(opp => opp.cost === 0)
    .slice(0, 4);

  const featuredOrgs = organizations.slice(0, 4);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateTab('opportunities', {
      query: searchQuery.trim() || undefined,
      region: searchRegion || undefined,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="relative overflow-hidden bg-[#16402E] text-[#F8F5EE] border-b-4 border-[#D95D39] px-4 py-8 sm:py-12">
        <ContourMotifBackground className="absolute -right-20 -bottom-20 w-96 h-96" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#0F2D20] border border-[#215A42] text-[11px] font-bold text-[#EFE9DC] uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#D95D39]" />
            {t.acrossCameroon}
          </div>

          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-3">
            One center that connects you to every other center.
          </h1>

          <p className="text-sm sm:text-base text-[#E2DDD5] max-w-2xl leading-relaxed mb-6">
            {t.heroDescription}
          </p>

          <form onSubmit={handleSearchSubmit} role="search" className="flex flex-col sm:flex-row gap-2 max-w-3xl">
            <div className="relative flex-1 min-w-0">
              <Search size={18} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555E57]" />
              <input
                type="search"
                enterKeyHint="search"
                aria-label={t.searchButton}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.homeSearchPlaceholder}
                className="w-full pl-10 pr-4 py-3 bg-white text-[#1C211E] text-sm rounded-sm placeholder:text-[#777E79] border-2 border-white focus:outline-none focus:border-[#D95D39]"
              />
            </div>
            <select
              value={searchRegion}
              onChange={e => setSearchRegion(e.target.value)}
              aria-label={t.regionField}
              className="sm:w-44 px-3 py-3 bg-white text-[#1C211E] text-sm rounded-sm border-2 border-white focus:outline-none focus:border-[#D95D39]"
            >
              <option value="">{t.allRegions}</option>
              {CAMEROON_REGIONS.map(r => (
                <option key={r} value={r}>{t.regionNames[r]}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-[#D95D39] hover:bg-[#B84725] text-white font-bold text-sm rounded-sm transition-colors flex items-center justify-center gap-2 border border-[#B84725]"
            >
              <span>{t.searchButton}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#C4C0B6] font-medium text-[11px] mr-1">Quick filters:</span>
            <button
              onClick={() => onNavigateTab('opportunities', { cost: 'free' })}
              className="px-2.5 py-1 bg-[#0F2D20] hover:bg-[#215A42] text-white rounded-sm border border-[#2B543D] text-[11px] font-semibold transition-colors"
            >
              Free only
            </button>
            <button
              onClick={() => onNavigateTab('opportunities', { category: 'Training' })}
              className="px-2.5 py-1 bg-[#0F2D20] hover:bg-[#215A42] text-white rounded-sm border border-[#2B543D] text-[11px] font-semibold transition-colors"
            >
              Trainings
            </button>
            <button
              onClick={() => onNavigateTab('opportunities', { category: 'Scholarship' })}
              className="px-2.5 py-1 bg-[#0F2D20] hover:bg-[#215A42] text-white rounded-sm border border-[#2B543D] text-[11px] font-semibold transition-colors"
            >
              Scholarships
            </button>
            <button
              onClick={() => onNavigateTab('opportunities', { category: 'Hackathon' })}
              className="px-2.5 py-1 bg-[#0F2D20] hover:bg-[#215A42] text-white rounded-sm border border-[#2B543D] text-[11px] font-semibold transition-colors"
            >
              Hackathons
            </button>
            <button
              onClick={() => onNavigateTab('opportunities', { region: 'Online' })}
              className="px-2.5 py-1 bg-[#0F2D20] hover:bg-[#215A42] text-white rounded-sm border border-[#2B543D] text-[11px] font-semibold transition-colors"
            >
              {t.online}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <section>
          <div className="flex items-end justify-between mb-4 border-b-2 border-[#16402E] pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D95D39] uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Urgent Deadlines</span>
              </div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1C211E]">
                Closing soon
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('opportunities')}
              className="text-xs font-bold text-[#16402E] hover:text-[#D95D39] flex items-center gap-1 pb-1"
            >
              <span>View all ({activeOpportunities.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {closingSoon.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {closingSoon.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onSelect={onSelectOpportunity}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2DDD5] p-6 text-center rounded-sm">
              <p className="text-sm text-[#555E57]">No opportunities closing this week.</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between mb-4 border-b-2 border-[#16402E] pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#16402E] uppercase tracking-wider">
                <BookOpen size={14} />
                <span>Zero Cost Barrier</span>
              </div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1C211E]">
                Free opportunities
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('opportunities', { cost: 'free' })}
              className="text-xs font-bold text-[#16402E] hover:text-[#D95D39] flex items-center gap-1 pb-1"
            >
              <span>View all free</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {freeOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {freeOpportunities.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onSelect={onSelectOpportunity}
                />
              ))}
            </div>
          ) : (
            <EmptyState title={t.noOpportunitiesYet} description={t.noOpportunitiesYetDesc} />
          )}
        </section>

        <section className="bg-[#EFE9DC] border-2 border-[#16402E] p-6 sm:p-8 rounded-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#16402E] uppercase tracking-wider">
                <Building2 size={16} />
                <span>Directory of Spaces</span>
              </div>
              <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1C211E]">
                Learning centers, technology hubs and NGO workspaces
              </h3>
              <p className="text-xs sm:text-sm text-[#445048] leading-relaxed">
                Need reliable electricity during load shedding or quiet study space? We document which hubs have backup solar or generator power, stable fiber, and open desk policies.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('organizations')}
              className="px-5 py-3 bg-[#16402E] hover:bg-[#0F2D20] text-white font-bold text-sm rounded-sm transition-colors flex items-center justify-center gap-2 shrink-0 border border-[#0F2D20]"
            >
              <Compass size={16} />
              <span>Browse all {organizations.length} centers</span>
            </button>
          </div>

          <nav aria-label={t.browseByType} className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#16402E] mb-2">{t.browseByType}</p>
            <ul className="flex flex-wrap gap-1.5">
              {PLACE_TYPES.filter(type => type !== 'Other').map(type => {
                const Icon = placeTypeIcon(type);
                return (
                  <li key={type}>
                    <button
                      onClick={() => onNavigateTab('organizations', { placeType: type })}
                      className="px-2.5 py-1.5 bg-white hover:bg-[#16402E] hover:text-white text-[#16402E] rounded-sm border border-[#16402E]/30 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      <Icon size={13} aria-hidden="true" />
                      <span>{placeTypeLabel(type, t)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {featuredOrgs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {featuredOrgs.map(org => (
                <OrganizationCard
                  key={org.id}
                  organization={org}
                  onSelect={onSelectOrganization}
                  opportunityCount={opportunities.filter(o => o.orgId === org.id || o.orgId === org.ownerUid).length}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState title={t.noPlacesYet} description={t.noPlacesYetDesc} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
