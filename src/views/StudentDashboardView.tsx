import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, EducationLevel } from '../types';
import { CAMEROON_REGIONS, isCameroonRegion, guessRegionFromTown, editableTown } from '../lib/regions';
import { updateUserProfile } from '../lib/firestoreService';
import { sendToFormspree } from '../lib/formspree';
import { useLanguage } from '../context/LanguageContext';
import {
  Bookmark,
  Heart,
  CalendarCheck2,
  Clock,
  UserCheck,
  Building2,
  Sparkles,
  Save,
  CheckCircle2,
  GraduationCap,
  MapPin,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface StudentDashboardViewProps {
  user: User;
  userProfile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
  onNavigateTab: (tab: 'opportunities' | 'organizations') => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  user,
  userProfile,
  onProfileUpdated,
  onNavigateTab,
}) => {
  const { t, language, setLanguage } = useLanguage();

  // Profile Settings form state
  // Older profiles stored a town (e.g. "Buea") in region; map it to its region
  const initialRegion = (p: UserProfile | null) =>
    isCameroonRegion(p?.region) ? p!.region! : guessRegionFromTown(p?.region) || '';
  const initialTown = (p: UserProfile | null) =>
    p?.town || (isCameroonRegion(p?.region) ? '' : editableTown(p?.region));
  const [region, setRegion] = useState<string>(initialRegion(userProfile));
  const [town, setTown] = useState<string>(initialTown(userProfile));
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(
    (userProfile?.educationLevel as EducationLevel) || 'University'
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    userProfile?.interests || ['Technology', 'Business']
  );
  const [preferredLang, setPreferredLang] = useState<'en' | 'fr'>(
    userProfile?.preferredLanguage || language
  );

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [gotcha, setGotcha] = useState('');

  useEffect(() => {
    if (userProfile) {
      setRegion(initialRegion(userProfile));
      setTown(initialTown(userProfile));
      if (userProfile.educationLevel) setEducationLevel(userProfile.educationLevel as EducationLevel);
      if (userProfile.interests) setSelectedInterests(userProfile.interests);
      if (userProfile.preferredLanguage) setPreferredLang(userProfile.preferredLanguage);
    }
  }, [userProfile]);


  const availableEducation: EducationLevel[] = [
    'Secondary school',
    'High school',
    'University',
    'Graduate or young professional',
    'Any',
  ];

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

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gotcha) return; // Spam honeypot trigger

    setSavingSettings(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const updatedData: Partial<UserProfile> = {
        region,
        town: town.trim(),
        educationLevel,
        interests: selectedInterests,
        preferredLanguage: preferredLang,
      };

      await updateUserProfile(user.uid, updatedData);

      // Apply language selection if changed
      if (preferredLang !== language) {
        setLanguage(preferredLang);
      }

      if (userProfile) {
        onProfileUpdated({
          ...userProfile,
          ...updatedData,
        });
      }

      // Non-blocking Formspree backup copy
      sendToFormspree(
        'student_profile_settings',
        {
          uid: user.uid,
          displayName: user.displayName || 'Student',
          email: user.email,
          region,
          town: town.trim(),
          educationLevel,
          interests: selectedInterests,
          preferredLanguage: preferredLang,
          _gotcha: gotcha,
        },
        `Center for Centers: Student profile updated (${user.displayName || user.email})`
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update student settings:', err);
      setSaveError('Could not save settings. Please check your network connection.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Dashboard Header */}
      <div className="bg-[#16402E] text-[#F8F5EE] p-6 sm:p-8 rounded-sm border-2 border-[#16402E] relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-[#0F2D20] text-[11px] font-bold text-[#EFE9DC] uppercase tracking-wider mb-2 border border-[#215A42]">
              <GraduationCap size={13} className="text-[#D95D39]" />
              <span>{t.student}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight">
              {t.studentDashboardTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#C4C0B6] mt-1 max-w-xl">
              {t.studentDashboardSubtitle}
            </p>
          </div>

          <div className="bg-[#0F2D20] px-4 py-3 rounded-sm border border-[#215A42] text-xs">
            <div className="text-[10px] text-[#A3B899] font-bold uppercase tracking-wider">
              {user.displayName || 'Student User'}
            </div>
            <div className="text-[#E2DDD5] text-xs font-mono mt-0.5 truncate max-w-[200px]">
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Grid for Saved Places and Places I Follow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Saved places and opportunities */}
        <section className="bg-white border-2 border-[#16402E] rounded-sm p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-3 mb-4">
              <div className="p-1.5 bg-[#F4F8F5] text-[#16402E] rounded-sm">
                <Bookmark size={18} />
              </div>
              <h2 className="font-heading font-bold text-base text-[#1C211E]">
                {t.savedPlacesOpps}
              </h2>
            </div>

            {/* Empty State */}
            <div className="py-8 text-center space-y-3 bg-[#FAF8F5] border border-dashed border-[#D5C2A5] rounded-sm p-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#EFE9DC] text-[#6E4215] flex items-center justify-center">
                <Bookmark size={22} />
              </div>
              <h3 className="font-heading font-bold text-sm text-[#1C211E]">
                {t.savedEmptyTitle}
              </h3>
              <p className="text-xs text-[#555E57] max-w-xs mx-auto leading-relaxed">
                {t.savedEmptyDesc}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2DDD5] flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('organizations')}
              className="px-3 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] flex items-center gap-1.5 transition-colors"
            >
              <Building2 size={14} />
              <span>{t.browsePlaces}</span>
            </button>
            <button
              onClick={() => onNavigateTab('opportunities')}
              className="px-3 py-2 bg-[#FAF8F5] hover:bg-[#EFE9DC] text-[#16402E] text-xs font-bold rounded-sm border border-[#16402E]/30 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={14} />
              <span>{t.browseOpportunities}</span>
            </button>
          </div>
        </section>

        {/* Section 2: Places I follow */}
        <section className="bg-white border-2 border-[#16402E] rounded-sm p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-3 mb-4">
              <div className="p-1.5 bg-[#FBECE7] text-[#D95D39] rounded-sm">
                <Heart size={18} />
              </div>
              <h2 className="font-heading font-bold text-base text-[#1C211E]">
                {t.placesIFollow}
              </h2>
            </div>

            {/* Empty State */}
            <div className="py-8 text-center space-y-3 bg-[#FAF8F5] border border-dashed border-[#D5C2A5] rounded-sm p-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FBECE7] text-[#D95D39] flex items-center justify-center">
                <Heart size={22} />
              </div>
              <h3 className="font-heading font-bold text-sm text-[#1C211E]">
                {t.followingEmptyTitle}
              </h3>
              <p className="text-xs text-[#555E57] max-w-xs mx-auto leading-relaxed">
                {t.followingEmptyDesc}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2DDD5]">
            <button
              onClick={() => onNavigateTab('organizations')}
              className="w-full sm:w-auto px-3.5 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Building2 size={14} />
              <span>{t.browsePlaces}</span>
            </button>
          </div>
        </section>
      </div>

      {/* Grid for Registered Events & Upcoming Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 3: Registered events */}
        <section className="bg-white border-2 border-[#16402E] rounded-sm p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-3 mb-4">
              <div className="p-1.5 bg-[#F4F8F5] text-[#16402E] rounded-sm">
                <CalendarCheck2 size={18} />
              </div>
              <h2 className="font-heading font-bold text-base text-[#1C211E]">
                {t.registeredEvents}
              </h2>
            </div>

            {/* Empty State */}
            <div className="py-8 text-center space-y-3 bg-[#FAF8F5] border border-dashed border-[#D5C2A5] rounded-sm p-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#EFE9DC] text-[#16402E] flex items-center justify-center">
                <CalendarCheck2 size={22} />
              </div>
              <h3 className="font-heading font-bold text-sm text-[#1C211E]">
                {t.eventsEmptyTitle}
              </h3>
              <p className="text-xs text-[#555E57] max-w-xs mx-auto leading-relaxed">
                {t.eventsEmptyDesc}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2DDD5]">
            <button
              onClick={() => onNavigateTab('opportunities')}
              className="w-full sm:w-auto px-3.5 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles size={14} />
              <span>{t.browseOpportunities}</span>
            </button>
          </div>
        </section>

        {/* Section 4: Upcoming reminders */}
        <section className="bg-white border-2 border-[#16402E] rounded-sm p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-3 mb-4">
              <div className="p-1.5 bg-[#FFF4DE] text-[#8C5800] rounded-sm">
                <Clock size={18} />
              </div>
              <h2 className="font-heading font-bold text-base text-[#1C211E]">
                {t.upcomingReminders}
              </h2>
            </div>

            {/* Empty State */}
            <div className="py-8 text-center space-y-3 bg-[#FAF8F5] border border-dashed border-[#D5C2A5] rounded-sm p-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF4DE] text-[#8C5800] flex items-center justify-center">
                <Clock size={22} />
              </div>
              <h3 className="font-heading font-bold text-sm text-[#1C211E]">
                {t.remindersEmptyTitle}
              </h3>
              <p className="text-xs text-[#555E57] max-w-xs mx-auto leading-relaxed">
                {t.remindersEmptyDesc}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E2DDD5]">
            <button
              onClick={() => onNavigateTab('opportunities')}
              className="w-full sm:w-auto px-3.5 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles size={14} />
              <span>{t.browseOpportunities}</span>
            </button>
          </div>
        </section>
      </div>

      {/* Section 5: Profile settings */}
      <section className="bg-white border-2 border-[#16402E] rounded-sm p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-4 mb-6">
          <div className="p-2 bg-[#F4F8F5] text-[#16402E] rounded-sm">
            <UserCheck size={20} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-[#1C211E]">
              {t.profileSettings}
            </h2>
            <p className="text-xs text-[#555E57] mt-0.5">
              {t.profileSettingsDesc}
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 bg-[#F4F8F5] border border-[#A3B899] text-[#16402E] text-xs rounded-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#16402E] shrink-0" />
            <span className="font-bold">{t.profileSavedSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-[#FCE8E6] border border-[#F5C2C7] text-[#A51D24] text-xs rounded-sm">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Spam honeypot field */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="_gotcha_settings">Do not fill this</label>
            <input
              type="text"
              id="_gotcha_settings"
              name="_gotcha"
              tabIndex={-1}
              value={gotcha}
              onChange={(e) => setGotcha(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Region */}
            <div className="space-y-1.5">
              <label htmlFor="student-region" className="block text-xs font-bold text-[#1C211E] uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={14} className="text-[#16402E]" />
                <span>{t.regionField}</span>
              </label>
              <select
                id="student-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6C8] rounded-sm focus:outline-none focus:border-[#16402E]"
              >
                <option value="">{t.chooseRegion}</option>
                {CAMEROON_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {t.regionNames[r]}
                  </option>
                ))}
              </select>
            </div>

            {/* Town */}
            <div className="space-y-1.5">
              <label htmlFor="student-town" className="block text-xs font-bold text-[#1C211E] uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={14} className="text-[#16402E]" />
                <span>{t.townField}</span>
              </label>
              <input
                id="student-town"
                type="text"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder={t.townPlaceholder}
                className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6C8] rounded-sm focus:outline-none focus:border-[#16402E]"
              />
            </div>

            {/* Education level */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1C211E] uppercase tracking-wide flex items-center gap-1.5">
                <GraduationCap size={14} className="text-[#16402E]" />
                <span>{t.educationLabel}</span>
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#DDD6C8] rounded-sm focus:outline-none focus:border-[#16402E]"
              >
                {availableEducation.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1C211E] uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen size={14} className="text-[#16402E]" />
              <span>{t.interestsLabel}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-colors ${
                      isSelected
                        ? 'bg-[#16402E] text-white border-[#16402E]'
                        : 'bg-[#FAF8F5] text-[#555E57] border-[#DDD6C8] hover:border-[#16402E]/40'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Language */}
          <div className="space-y-1.5 max-w-xs">
            <label className="block text-xs font-bold text-[#1C211E] uppercase tracking-wide">
              {t.preferredLanguageLabel}
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="prefLang"
                  value="en"
                  checked={preferredLang === 'en'}
                  onChange={() => setPreferredLang('en')}
                  className="accent-[#16402E]"
                />
                <span>English</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="prefLang"
                  value="fr"
                  checked={preferredLang === 'fr'}
                  onChange={() => setPreferredLang('fr')}
                  className="accent-[#16402E]"
                />
                <span>Français</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              <span>{savingSettings ? t.savingProfile : t.saveProfileBtn}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
