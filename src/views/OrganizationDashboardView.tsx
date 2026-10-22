import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Organization, Opportunity, OpportunityRegion, OpportunityCategory, EducationLevel, UserRole } from '../types';
import { PlaceFormFields } from '../components/PlaceFormFields';
import { PlaceDraft, emptyPlaceDraft, placeDraftFromOrg, placeFieldsFromDraft } from '../lib/places';
import {
  fetchOrgByOwner,
  saveOrganizationProfile,
  fetchOpportunitiesByOrg,
  saveOpportunity,
  deleteOpportunity,
} from '../lib/firestoreService';
import { StatusBadge, FreeBadge, PaidBadge } from '../components/Badges';
import { sendToFormspree } from '../lib/formspree';
import { useLanguage } from '../context/LanguageContext';
import { OPPORTUNITY_REGIONS, resolveRegion, editableTown, formatLocation } from '../lib/regions';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  BarChart3,
  MousePointerClick,
  Eye,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface OrganizationDashboardProps {
  user: User;
  userRole?: UserRole;
  onNavigateHome: () => void;
  onNavigateStudent?: () => void;
}

export const OrganizationDashboardView: React.FC<OrganizationDashboardProps> = ({
  user,
  userRole,
  onNavigateHome,
  onNavigateStudent,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'opportunities' | 'analytics'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Honeypot fields for spam prevention
  const [profileGotcha, setProfileGotcha] = useState('');
  const [oppGotcha, setOppGotcha] = useState('');

  const [organization, setOrganization] = useState<Organization | null>(null);

  const [draft, setDraft] = useState<PlaceDraft>(() => emptyPlaceDraft(user.email || ''));

  const [myOpportunities, setMyOpportunities] = useState<Opportunity[]>([]);
  const [isEditingOpp, setIsEditingOpp] = useState(false);
  const [currentOppId, setCurrentOppId] = useState<string | null>(null);

  const [oppTitle, setOppTitle] = useState('');
  const [oppCategory, setOppCategory] = useState<OpportunityCategory>('Training');
  const [oppDescription, setOppDescription] = useState('');
  const [oppInterests, setOppInterests] = useState<string[]>(['Technology']);
  const [oppEducation, setOppEducation] = useState<EducationLevel[]>(['University']);
  const [oppRegion, setOppRegion] = useState<OpportunityRegion | ''>('');
  const [oppTown, setOppTown] = useState('');
  const [oppStartDate, setOppStartDate] = useState('');
  const [oppDeadline, setOppDeadline] = useState('');
  const [oppCost, setOppCost] = useState<number>(0);
  const [oppCostNote, setOppCostNote] = useState('');
  const [oppEligibility, setOppEligibility] = useState('');
  const [oppRegistrationLink, setOppRegistrationLink] = useState('');
  const [oppFlyerUrl, setOppFlyerUrl] = useState('');
  const [oppImageUrl, setOppImageUrl] = useState('');

  const availableInterests = [
    'Technology',
    'Engineering',
    'Business',
    'Health',
    'Arts',
    'Agriculture',
    'Education',
    'Leadership',
  ];

  const availableEducation: EducationLevel[] = [
    'Secondary school',
    'High school',
    'University',
    'Graduate or young professional',
    'Any',
  ];

  useEffect(() => {
    loadData();
  }, [user.uid]);

  const loadData = async () => {
    setLoading(true);
    try {
      const org = await fetchOrgByOwner(user.uid);
      if (org) {
        setOrganization(org);
        const loaded = placeDraftFromOrg(org);
        setDraft({ ...loaded, contactEmail: loaded.contactEmail || user.email || '' });
      }

      const opps = await fetchOpportunitiesByOrg(user.uid);
      setMyOpportunities(opps);
    } catch {
      setErrorMsg('Failed to load your organization records.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (item: string) => {
    if (oppInterests.includes(item)) {
      setOppInterests(oppInterests.filter(i => i !== item));
    } else {
      setOppInterests([...oppInterests, item]);
    }
  };

  const handleEducationToggle = (item: EducationLevel) => {
    if (oppEducation.includes(item)) {
      setOppEducation(oppEducation.filter(e => e !== item));
    } else {
      setOppEducation([...oppEducation, item]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (profileGotcha.trim()) {
      setSuccessMsg('Profile saved. Submitted to admin for review.');
      return;
    }

    if (!draft.name.trim()) {
      setErrorMsg(t.placeNameRequired);
      return;
    }
    if (!draft.region) {
      setErrorMsg(t.regionRequiredError);
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);
    try {
      const fields = placeFieldsFromDraft(draft);

      // 1. Save to Firestore first
      await saveOrganizationProfile(user.uid, fields, organization);

      // 2. Send non-blocking copy to Formspree
      sendToFormspree('organization_profile', {
        action: organization ? 'edit' : 'create',
        organizationId: organization?.id || user.uid,
        submitterEmail: user.email || fields.contactEmail,
        ...fields,
        ...fields.socialLinks,
        socialLinks: undefined,
        bookingRequired:
          fields.bookingRequired === null ? 'Unknown' : fields.bookingRequired ? 'Booking required' : 'Walk-ins welcome',
        _gotcha: profileGotcha,
      }).catch(err => console.warn('Formspree org profile error:', err));

      setSuccessMsg('Profile saved. Submitted to admin for review.');
      await loadData();
    } catch {
      setErrorMsg('Error saving organization profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenOppModal = (opp?: Opportunity) => {
    if (opp) {
      setCurrentOppId(opp.id);
      setOppTitle(opp.title);
      setOppCategory(opp.category);
      setOppDescription(opp.description);
      setOppInterests(opp.interests || []);
      setOppEducation(opp.educationLevels || []);
      setOppRegion(resolveRegion(opp) || '');
      setOppTown(editableTown(opp.town));
      setOppStartDate(opp.startDate || '');
      setOppDeadline(opp.deadline || '');
      setOppCost(opp.cost || 0);
      setOppCostNote(opp.costNote || '');
      setOppEligibility(opp.eligibility || '');
      setOppRegistrationLink(opp.registrationLink || '');
      setOppFlyerUrl(opp.flyerUrl || '');
      setOppImageUrl(opp.imageUrl || '');
    } else {
      setCurrentOppId(null);
      setOppTitle('');
      setOppCategory('Training');
      setOppDescription('');
      setOppInterests(['Technology']);
      setOppEducation(['University']);
      setOppRegion(draft.region);
      setOppTown(draft.town);
      setOppStartDate('');
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setOppDeadline(d.toISOString().split('T')[0]);
      setOppCost(0);
      setOppCostNote('');
      setOppEligibility('');
      setOppRegistrationLink('');
      setOppFlyerUrl('');
      setOppImageUrl('');
    }
    setIsEditingOpp(true);
  };

  const handleSaveOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (oppGotcha.trim()) {
      setIsEditingOpp(false);
      setSuccessMsg('Opportunity submitted. Sent to admin queue for review.');
      return;
    }

    if (!oppRegion) {
      setErrorMsg(t.regionRequiredError);
      return;
    }
    if (!oppTitle.trim() || !oppDeadline) {
      setErrorMsg('Title and deadline are required.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);
    try {
      // 1. Save to Firestore first
      const savedId = await saveOpportunity(user.uid, currentOppId, {
        orgName: draft.name || organization?.name || 'Local Organization',
        title: oppTitle.trim(),
        category: oppCategory,
        description: oppDescription.trim(),
        interests: oppInterests,
        educationLevels: oppEducation,
        region: oppRegion || undefined,
        town: oppTown.trim(),
        startDate: oppStartDate,
        deadline: oppDeadline,
        cost: Number(oppCost) || 0,
        costNote: oppCostNote.trim(),
        eligibility: oppEligibility.trim(),
        registrationLink: oppRegistrationLink.trim(),
        flyerUrl: oppFlyerUrl.trim() || undefined,
        imageUrl: oppImageUrl.trim() || undefined,
      });

      // 2. Send non-blocking copy to Formspree
      sendToFormspree('opportunity', {
        action: currentOppId ? 'edit' : 'create',
        opportunityId: savedId || currentOppId || 'new',
        orgId: user.uid,
        orgName: draft.name || organization?.name || 'Local Organization',
        submitterEmail: user.email || draft.contactEmail.trim(),
        title: oppTitle.trim(),
        category: oppCategory,
        description: oppDescription.trim(),
        interests: oppInterests,
        educationLevels: oppEducation,
        region: oppRegion,
        town: oppTown.trim(),
        startDate: oppStartDate,
        deadline: oppDeadline,
        cost: Number(oppCost) || 0,
        costFormatted: Number(oppCost) === 0 ? 'Free (0 XAF)' : `${Number(oppCost).toLocaleString()} XAF`,
        costNote: oppCostNote.trim(),
        eligibility: oppEligibility.trim(),
        registrationLink: oppRegistrationLink.trim(),
        flyerUrl: oppFlyerUrl.trim(),
        imageUrl: oppImageUrl.trim(),
        _gotcha: oppGotcha,
      }).catch(err => console.warn('Formspree opportunity error:', err));

      setIsEditingOpp(false);
      setSuccessMsg('Opportunity submitted. Sent to admin queue for review.');
      await loadData();
    } catch {
      setErrorMsg('Failed to save opportunity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOpportunity = async (oppId: string) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await deleteOpportunity(oppId);
      setSuccessMsg('Opportunity removed.');
      await loadData();
    } catch {
      setErrorMsg('Failed to delete opportunity.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white border-2 border-[#16402E] rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16402E] uppercase tracking-wider mb-1">
            <Building2 size={14} />
            <span>Organization Dashboard</span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1C211E]">
            {organization?.name || 'Create your organization profile'}
          </h1>
          <p className="text-xs text-[#555E57] mt-0.5">
            Signed in as <span className="font-semibold text-[#1C211E]">{user.email}</span>
          </p>
        </div>

        {organization && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#555E57] font-medium">Status:</span>
            <StatusBadge status={organization.status} />
          </div>
        )}
      </div>

      <div className="flex border-b-2 border-[#16402E] gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm transition-colors ${
            activeTab === 'profile'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          Center Profile
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm transition-colors flex items-center gap-1.5 ${
            activeTab === 'opportunities'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          <span>My Opportunities</span>
          <span className="bg-[#EFE9DC] text-[#1C211E] text-[10px] px-1.5 py-0.2 rounded-sm font-bold">
            {myOpportunities.length}
          </span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FCE8E6] text-[#A51D24] text-xs font-medium rounded-sm border border-[#F5C2C7] flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-[#E8EFEA] text-[#16402E] text-xs font-medium rounded-sm border border-[#BACCC0] flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#E2DDD5] p-10 text-center rounded-sm text-xs text-[#555E57]">
          Loading your organization dashboard...
        </div>
      ) : activeTab === 'profile' ? (
        <div className="bg-white border-2 border-[#16402E] rounded-sm p-5 sm:p-7 space-y-6">
          <div className="border-b border-[#E2DDD5] pb-3">
            <h2 className="font-heading font-extrabold text-lg text-[#1C211E]">
              Organization Details & Access Specifications
            </h2>
            <p className="text-xs text-[#555E57] mt-1">
              Provide accurate practical facts so students know when and how they can use your space. Any edits will return your profile to pending review.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Honeypot field - invisible to humans, catches bots */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="_gotcha_profile">Do not fill this</label>
              <input
                type="text"
                id="_gotcha_profile"
                name="_gotcha"
                value={profileGotcha}
                onChange={e => setProfileGotcha(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <PlaceFormFields
              draft={draft}
              onChange={patch => setDraft(prev => ({ ...prev, ...patch }))}
              mode="owner"
            />

            <div className="pt-4 border-t border-[#E2DDD5] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#16402E] hover:bg-[#0F2D20] text-white font-bold text-xs uppercase tracking-wider rounded-sm border border-[#0F2D20] transition-colors"
              >
                {saving ? 'Saving...' : 'Save Organization Profile'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border-2 border-[#16402E] p-4 rounded-sm flex items-center justify-between">
            <div>
              <h2 className="font-heading font-extrabold text-lg text-[#1C211E]">
                My Posted Opportunities
              </h2>
              <p className="text-xs text-[#555E57]">
                Create trainings, workshops, internships, and hackathons hosted by your center.
              </p>
            </div>

            <button
              onClick={() => handleOpenOppModal()}
              className="px-4 py-2 bg-[#D95D39] hover:bg-[#B84725] text-white text-xs font-bold rounded-sm border border-[#B84725] flex items-center gap-1.5 transition-colors"
            >
              <Plus size={15} />
              <span>Post Opportunity</span>
            </button>
          </div>

          {myOpportunities.length > 0 ? (
            <div className="space-y-3">
              {myOpportunities.map(opp => (
                <div
                  key={opp.id}
                  className="bg-white border border-[#E2DDD5] hover:border-[#16402E] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={opp.status} />
                      {opp.cost === 0 ? <FreeBadge /> : <PaidBadge cost={opp.cost} />}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-[#EFE9DC] text-[#1C211E]">
                        {opp.category}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-[#1C211E]">
                      {opp.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-[#555E57]">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-[#D95D39]" />
                        Deadline: {opp.deadline}
                      </span>
                      <span>{formatLocation(opp, t)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#E2DDD5]">
                    <button
                      onClick={() => handleOpenOppModal(opp)}
                      className="px-3 py-1.5 bg-[#F8F5EE] border border-[#E2DDD5] hover:border-[#16402E] text-xs font-bold text-[#1C211E] rounded-sm flex items-center gap-1"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteOpportunity(opp.id)}
                      className="px-3 py-1.5 bg-[#FCE8E6] border border-[#F5C2C7] hover:bg-[#F8D7DA] text-xs font-bold text-[#A51D24] rounded-sm flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-[#E2DDD5] p-8 text-center rounded-sm">
              <Clock size={28} className="text-[#777E79] mx-auto mb-2" />
              <p className="font-heading font-bold text-base text-[#1C211E]">No opportunities posted yet</p>
              <p className="text-xs text-[#555E57] mt-1 mb-4">
                Share your workshops, bootcamps, and hackathons with thousands of young learners.
              </p>
              <button
                onClick={() => handleOpenOppModal()}
                className="px-4 py-2 bg-[#D95D39] text-white text-xs font-bold rounded-sm border border-[#B84725]"
              >
                Create your first opportunity
              </button>
            </div>
          )}
        </div>
      )}

      {isEditingOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C211E]/70 overflow-y-auto">
          <div className="bg-white border-2 border-[#16402E] w-full max-w-2xl rounded-sm p-5 sm:p-6 my-8 space-y-4 shadow-none">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-2">
              <h3 className="font-heading font-extrabold text-lg text-[#1C211E]">
                {currentOppId ? 'Edit Opportunity' : 'Post New Opportunity'}
              </h3>
              <button
                onClick={() => setIsEditingOpp(false)}
                className="text-[#555E57] hover:text-[#1C211E] text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveOpportunity} className="space-y-4">
              {/* Honeypot field - invisible to humans, catches bots */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <label htmlFor="_gotcha_opp">Do not fill this</label>
                <input
                  type="text"
                  id="_gotcha_opp"
                  name="_gotcha"
                  value={oppGotcha}
                  onChange={e => setOppGotcha(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Opportunity Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={oppTitle}
                    onChange={e => setOppTitle(e.target.value)}
                    placeholder="e.g. Python Backend & REST API Bootcamp"
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] text-sm rounded-sm px-3 py-2 text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={oppCategory}
                    onChange={e => setOppCategory(e.target.value as OpportunityCategory)}
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  >
                    <option value="Training">Training</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Event">Event</option>
                    <option value="Internship">Internship</option>
                    <option value="Scholarship">Scholarship</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="opp-form-region" className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    {t.regionOrOnline}
                  </label>
                  <select
                    id="opp-form-region"
                    required
                    value={oppRegion}
                    onChange={e => setOppRegion(e.target.value as OpportunityRegion | '')}
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  >
                    <option value="">{t.chooseRegion}</option>
                    {OPPORTUNITY_REGIONS.map(r => (
                      <option key={r} value={r}>{r === 'Online' ? t.online : t.regionNames[r]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="opp-form-town" className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    {t.townField}
                  </label>
                  <input
                    id="opp-form-town"
                    type="text"
                    value={oppTown}
                    onChange={e => setOppTown(e.target.value)}
                    placeholder={t.townPlaceholder}
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={oppStartDate}
                    onChange={e => setOppStartDate(e.target.value)}
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={oppDeadline}
                    onChange={e => setOppDeadline(e.target.value)}
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Cost in XAF (0 = Free) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={oppCost}
                    onChange={e => setOppCost(Number(e.target.value))}
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Cost Clarification Note
                  </label>
                  <input
                    type="text"
                    value={oppCostNote}
                    onChange={e => setOppCostNote(e.target.value)}
                    placeholder="e.g. Free sponsored, or 2,000 for materials"
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Official Registration Link (URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={oppRegistrationLink}
                    onChange={e => setOppRegistrationLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                  />
                </div>

                {/* Event Flyer / Poster & Pictures */}
                <div className="sm:col-span-2 p-3.5 bg-[#FBF9F5] border-2 border-[#16402E]/20 rounded-sm space-y-3">
                  <div>
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#16402E]">
                      Event Flyer, Poster & Pictures
                    </h4>
                    <p className="text-[11px] text-[#555E57] mt-0.5">
                      Upload or link your official poster. Prospective students can view full flyer details, speaker lists, and schedules.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1C211E] text-xs mb-1">
                      Event Flyer / Poster Image URL
                    </label>
                    <input
                      type="text"
                      value={oppFlyerUrl}
                      onChange={e => setOppFlyerUrl(e.target.value)}
                      placeholder="Paste image URL of flyer/poster (JPG, PNG, WebP)"
                      className="w-full bg-white border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1C211E] text-xs mb-1">
                      Event Photo / Campus Picture URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={oppImageUrl}
                      onChange={e => setOppImageUrl(e.target.value)}
                      placeholder="Paste image URL of workshop, campus, or lab"
                      className="w-full bg-white border border-[#E2DDD5] rounded-sm px-3 py-2 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                    />
                  </div>

                  {/* Real-time live visual preview */}
                  {(oppFlyerUrl || oppImageUrl) && (
                    <div className="pt-2 border-t border-[#E2DDD5] grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {oppFlyerUrl && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#555E57] block mb-1">
                            Flyer / Poster Preview:
                          </span>
                          <div className="aspect-[3/4] max-h-48 w-auto rounded-sm border border-[#16402E] bg-white overflow-hidden flex items-center justify-center">
                            <img
                              src={oppFlyerUrl}
                              alt="Flyer preview"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {oppImageUrl && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#555E57] block mb-1">
                            Event Photo Preview:
                          </span>
                          <div className="aspect-video max-h-48 w-full rounded-sm border border-[#16402E] bg-white overflow-hidden">
                            <img
                              src={oppImageUrl}
                              alt="Photo preview"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Full Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={oppDescription}
                    onChange={e => setOppDescription(e.target.value)}
                    placeholder="Outline the schedule, tools used, certificates, and deliverables..."
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm p-2.5 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E] resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                    Eligibility & Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={oppEligibility}
                    onChange={e => setOppEligibility(e.target.value)}
                    placeholder="Who qualifies? e.g. Open to all students with basic computer knowledge..."
                    className="w-full bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm p-2.5 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E] resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1C211E] mb-1.5 uppercase tracking-wider">
                    Target Education Levels
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableEducation.map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleEducationToggle(lvl)}
                        className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                          oppEducation.includes(lvl)
                            ? 'bg-[#16402E] text-white border-[#16402E] font-bold'
                            : 'bg-[#F8F5EE] text-[#1C211E] border-[#E2DDD5]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1C211E] mb-1.5 uppercase tracking-wider">
                    Interest Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableInterests.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                          oppInterests.includes(interest)
                            ? 'bg-[#D95D39] text-white border-[#D95D39] font-bold'
                            : 'bg-[#F8F5EE] text-[#1C211E] border-[#E2DDD5]'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2DDD5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingOpp(false)}
                  className="px-4 py-2 border border-[#E2DDD5] text-xs font-bold text-[#555E57] rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#D95D39] hover:bg-[#B84725] text-white text-xs font-bold rounded-sm border border-[#B84725]"
                >
                  {saving ? 'Submitting...' : 'Submit for Admin Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
