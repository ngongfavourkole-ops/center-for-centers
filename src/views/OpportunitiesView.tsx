import React, { useState, useMemo } from 'react';
import { Opportunity } from '../types';
import { OpportunityCard } from '../components/OpportunityCard';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface OpportunitiesViewProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  initialFilters?: {
    category?: string;
    town?: string;
    cost?: 'free' | 'paid';
  };
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  opportunities,
  onSelectOpportunity,
  initialFilters,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters?.category || 'All');
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  const [selectedEducation, setSelectedEducation] = useState<string>('All');
  const [selectedTown, setSelectedTown] = useState<string>(initialFilters?.town || 'All');
  const [costFilter, setCostFilter] = useState<'all' | 'free' | 'paid'>(initialFilters?.cost || 'all');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const categories = ['All', 'Training', 'Workshop', 'Event', 'Internship', 'Scholarship', 'Hackathon', 'Other'];
  const interestsList = ['All', 'Technology', 'Engineering', 'Business', 'Health', 'Arts', 'Agriculture', 'Education', 'Leadership'];
  const educationList = ['All', 'Secondary school', 'High school', 'University', 'Graduate or young professional', 'Any'];
  const townsList = ['All', 'Buea', 'Limbe', 'Tiko', 'Kumba', 'Online', 'Other'];

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (opp.deadline && opp.deadline < todayStr) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(query);
        const matchesDesc = opp.description.toLowerCase().includes(query);
        const matchesOrg = opp.orgName?.toLowerCase().includes(query);
        const matchesTown = opp.town.toLowerCase().includes(query);
        const matchesInterests = opp.interests?.some(i => i.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesOrg && !matchesTown && !matchesInterests) {
          return false;
        }
      }

      if (selectedCategory !== 'All' && opp.category !== selectedCategory) {
        return false;
      }

      if (selectedInterest !== 'All' && !opp.interests?.includes(selectedInterest)) {
        return false;
      }

      if (selectedEducation !== 'All') {
        const matchesEd = opp.educationLevels?.includes(selectedEducation as any) || opp.educationLevels?.includes('Any');
        if (!matchesEd) return false;
      }

      if (selectedTown !== 'All' && opp.town !== selectedTown) {
        return false;
      }

      if (costFilter === 'free' && opp.cost !== 0) {
        return false;
      }
      if (costFilter === 'paid' && opp.cost === 0) {
        return false;
      }

      return true;
    });
  }, [opportunities, searchQuery, selectedCategory, selectedInterest, selectedEducation, selectedTown, costFilter, todayStr]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedInterest !== 'All' ||
    selectedEducation !== 'All' ||
    selectedTown !== 'All' ||
    costFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedInterest('All');
    setSelectedEducation('All');
    setSelectedTown('All');
    setCostFilter('all');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="border-b-2 border-[#16402E] pb-3">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1C211E]">
          Verified Opportunities
        </h1>
        <p className="text-xs sm:text-sm text-[#445048] mt-1">
          Showing active trainings, workshops, scholarships, and hackathons with verified deadlines.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555E57]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, skills, or organization name..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-[#1C211E] text-sm rounded-sm border border-[#E2DDD5] focus:outline-none focus:border-[#16402E]"
            />
          </div>

          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="sm:hidden px-4 py-2.5 bg-white border border-[#E2DDD5] text-[#1C211E] rounded-sm text-xs font-bold flex items-center justify-center gap-2"
          >
            <SlidersHorizontal size={15} />
            <span>Filters {hasActiveFilters && '(Active)'}</span>
          </button>
        </div>

        <div className={`${showFiltersMobile ? 'block' : 'hidden'} sm:block bg-white border border-[#E2DDD5] p-4 rounded-sm space-y-3`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider text-[11px]">Category</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-2.5 py-1.5 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider text-[11px]">Interest</label>
              <select
                value={selectedInterest}
                onChange={e => setSelectedInterest(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-2.5 py-1.5 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                {interestsList.map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider text-[11px]">Education level</label>
              <select
                value={selectedEducation}
                onChange={e => setSelectedEducation(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-2.5 py-1.5 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                {educationList.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider text-[11px]">Town / Location</label>
              <select
                value={selectedTown}
                onChange={e => setSelectedTown(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-2.5 py-1.5 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                {townsList.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider text-[11px]">Cost</label>
              <select
                value={costFilter}
                onChange={e => setCostFilter(e.target.value as any)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-2.5 py-1.5 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                <option value="all">All (Free & Paid)</option>
                <option value="free">Free only (0 XAF)</option>
                <option value="paid">Paid only</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-2 border-t border-[#E2DDD5] flex items-center justify-between">
              <span className="text-[11px] text-[#555E57]">
                Filtered {filteredOpportunities.length} of {opportunities.length} total active opportunities
              </span>
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-[#D95D39] hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Reset filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-[#555E57]">
          <span>{filteredOpportunities.length} active opportunities found</span>
          <span className="font-medium text-[#16402E]">Expired opportunities hidden automatically</span>
        </div>

        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpportunities.map(opp => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onSelect={onSelectOpportunity}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-[#E2DDD5] p-8 text-center rounded-sm">
            <p className="font-heading font-bold text-base text-[#1C211E] mb-1">
              No matching opportunities found
            </p>
            <p className="text-xs text-[#555E57] max-w-sm mx-auto mb-4">
              Try adjusting your filters, selecting a different town, or resetting the search query.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#16402E] text-white text-xs font-bold rounded-sm border border-[#0F2D20]"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
