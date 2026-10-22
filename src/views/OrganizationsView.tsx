import React, { useState, useMemo } from 'react';
import { Organization, Opportunity, NavFilters } from '../types';
import { OrganizationCard } from '../components/OrganizationCard';
import { Search, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CAMEROON_REGIONS, resolveRegion, normalizeText } from '../lib/regions';
import { matchesQuery } from '../lib/search';
import { PLACE_TYPES, placeTypeLabel } from '../lib/places';
import { translations } from '../lib/translations';

interface OrganizationsViewProps {
  organizations: Organization[];
  opportunities: Opportunity[];
  onSelectOrganization: (org: Organization) => void;
  initialFilters?: NavFilters;
  onSearchOpportunities?: (query: string) => void;
}

export const OrganizationsView: React.FC<OrganizationsViewProps> = ({
  organizations,
  opportunities,
  onSelectOrganization,
  initialFilters,
  onSearchOpportunities,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(initialFilters?.query || '');
  const [selectedType, setSelectedType] = useState(initialFilters?.placeType || 'All');
  const [selectedRegion, setSelectedRegion] = useState(initialFilters?.region || 'All');
  const [townFilter, setTownFilter] = useState('');


  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const region = resolveRegion(org);

      if (searchQuery.trim()) {
        // Region names in both languages so "Sud-Ouest" and "Southwest" both match
        const regionWords = region && region !== 'Online' ? [region, translations.fr.regionNames[region]] : [];
        const matches = matchesQuery(searchQuery, [
          org.name,
          org.description,
          org.address,
          org.town,
          org.type,
          translations.fr.placeTypeNames[org.type],
          org.fees,
          org.studentAccess,
          ...(org.facilities || []),
          ...regionWords,
        ]);
        if (!matches) return false;
      }

      if (selectedType !== 'All' && org.type !== selectedType) {
        return false;
      }

      if (selectedRegion !== 'All' && region !== selectedRegion) {
        return false;
      }

      if (townFilter.trim() && !normalizeText(org.town).includes(normalizeText(townFilter))) {
        return false;
      }

      return true;
    });
  }, [organizations, searchQuery, selectedType, selectedRegion, townFilter]);

  const hasActiveFilters = searchQuery !== '' || selectedType !== 'All' || selectedRegion !== 'All' || townFilter !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedRegion('All');
    setTownFilter('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="border-b-2 border-[#16402E] pb-3">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1C211E]">
          Centers & Educational Hubs
        </h1>
        <p className="text-xs sm:text-sm text-[#445048] mt-1">
          {t.placesSubtitle}
        </p>
      </div>

      <div className="bg-white border border-[#E2DDD5] p-4 rounded-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555E57]" />
            <input
              type="search"
              enterKeyHint="search"
              aria-label={t.searchButton}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by center name, address, or equipment..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8F5EE] text-[#1C211E] text-sm rounded-sm border border-[#E2DDD5] focus:outline-none focus:border-[#16402E]"
            />
          </div>

          <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2 sm:flex">
            <div className="sm:w-44">
              <select
                aria-label={t.placeTypeLabel}
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                <option value="All">{t.allTypes}</option>
                {PLACE_TYPES.map(type => (
                  <option key={type} value={type}>{placeTypeLabel(type, t)}</option>
                ))}
              </select>
            </div>

            <div className="sm:w-40">
              <select
                aria-label={t.regionField}
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                <option value="All">{t.allRegions}</option>
                {CAMEROON_REGIONS.map(r => (
                  <option key={r} value={r}>{t.regionNames[r]}</option>
                ))}
              </select>
            </div>

            <div className="sm:w-36">
              <input
                type="text"
                aria-label={t.townField}
                value={townFilter}
                onChange={e => setTownFilter(e.target.value)}
                placeholder={t.townFilterPlaceholder}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#E2DDD5] flex items-center justify-between text-xs">
            <span className="text-[#555E57]">
              Showing {filteredOrganizations.length} of {organizations.length} centers
            </span>
            <button
              onClick={resetFilters}
              className="font-bold text-[#D95D39] hover:underline flex items-center gap-1"
            >
              <RotateCcw size={12} />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 text-xs text-[#555E57] font-medium">
          {filteredOrganizations.length} organizations verified
        </div>

        {filteredOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrganizations.map(org => {
              const oppCount = opportunities.filter(o => o.orgId === org.id || o.orgId === org.ownerUid).length;
              return (
                <OrganizationCard
                  key={org.id}
                  organization={org}
                  onSelect={onSelectOrganization}
                  opportunityCount={oppCount}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-[#E2DDD5] p-8 text-center rounded-sm">
            <p className="font-heading font-bold text-base text-[#1C211E] mb-1">
              {organizations.length === 0 ? t.noPlacesYet : "No organizations found matching these filters"}
            </p>
            <p className="text-xs text-[#555E57] mb-4">
              {organizations.length === 0 ? t.noPlacesYetDesc : "Try clearing the search query or selecting a different town."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-[#16402E] text-white text-xs font-bold rounded-sm border border-[#0F2D20]"
                >
                  Clear filters
                </button>
              )}
              {searchQuery.trim() && onSearchOpportunities && (
                <button
                  onClick={() => onSearchOpportunities(searchQuery.trim())}
                  className="px-4 py-2 bg-white text-[#16402E] text-xs font-bold rounded-sm border border-[#16402E] break-words max-w-full"
                >
                  {t.searchOpportunitiesInstead.replace('{query}', searchQuery.trim())}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
