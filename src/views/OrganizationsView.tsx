import React, { useState, useMemo } from 'react';
import { Organization, Opportunity } from '../types';
import { OrganizationCard } from '../components/OrganizationCard';
import { Search, RotateCcw } from 'lucide-react';

interface OrganizationsViewProps {
  organizations: Organization[];
  opportunities: Opportunity[];
  onSelectOrganization: (org: Organization) => void;
}

export const OrganizationsView: React.FC<OrganizationsViewProps> = ({
  organizations,
  opportunities,
  onSelectOrganization,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedTown, setSelectedTown] = useState('All');

  const typesList = ['All', 'Learning center', 'Training provider', 'NGO', 'Technology hub', 'Educational institution', 'Other'];
  const townsList = ['All', 'Buea', 'Limbe', 'Tiko', 'Kumba', 'Other'];

  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = org.name.toLowerCase().includes(query);
        const matchesDesc = org.description.toLowerCase().includes(query);
        const matchesAddress = org.address.toLowerCase().includes(query);
        const matchesFacilities = org.facilities?.some(f => f.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesAddress && !matchesFacilities) {
          return false;
        }
      }

      if (selectedType !== 'All' && org.type !== selectedType) {
        return false;
      }

      if (selectedTown !== 'All' && org.town !== selectedTown) {
        return false;
      }

      return true;
    });
  }, [organizations, searchQuery, selectedType, selectedTown]);

  const hasActiveFilters = searchQuery !== '' || selectedType !== 'All' || selectedTown !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedTown('All');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="border-b-2 border-[#16402E] pb-3">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1C211E]">
          Centers & Educational Hubs
        </h1>
        <p className="text-xs sm:text-sm text-[#445048] mt-1">
          Explore youth-ready innovation hubs, labs, NGOs, and vocational centers across Buea, Limbe, Tiko, and Kumba.
        </p>
      </div>

      <div className="bg-white border border-[#E2DDD5] p-4 rounded-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555E57]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by center name, address, or equipment..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8F5EE] text-[#1C211E] text-sm rounded-sm border border-[#E2DDD5] focus:outline-none focus:border-[#16402E]"
            />
          </div>

          <div className="flex gap-2">
            <div className="w-40 sm:w-48">
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                {typesList.map(t => (
                  <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
                ))}
              </select>
            </div>

            <div className="w-32 sm:w-36">
              <select
                value={selectedTown}
                onChange={e => setSelectedTown(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                {townsList.map(t => (
                  <option key={t} value={t}>{t === 'All' ? 'All Towns' : t}</option>
                ))}
              </select>
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
              No organizations found matching these filters
            </p>
            <p className="text-xs text-[#555E57] mb-4">
              Try clearing the search query or selecting a different town.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#16402E] text-white text-xs font-bold rounded-sm border border-[#0F2D20]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
