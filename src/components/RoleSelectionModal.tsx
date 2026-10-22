import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserRole, UserProfile } from '../types';
import { createUserProfile } from '../lib/firestoreService';
import { sendToFormspree } from '../lib/formspree';
import { useLanguage } from '../context/LanguageContext';
import { GraduationCap, Building2, Check, ArrowRight, ShieldAlert } from 'lucide-react';

interface RoleSelectionModalProps {
  user: User;
  onRoleSelected: (profile: UserProfile) => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  user,
  onRoleSelected,
}) => {
  const { t, language } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [gotcha, setGotcha] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gotcha) return; // Honeypot spam protection

    setSaving(true);
    setError('');

    const newProfile: UserProfile = {
      uid: user.uid,
      role: selectedRole,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      preferredLanguage: language,
      createdAt: new Date().toISOString(),
    };

    try {
      await createUserProfile(newProfile);

      // Send backup copy to Formspree non-blockingly
      sendToFormspree(
        'user_account_registered',
        {
          uid: user.uid,
          role: selectedRole,
          displayName: newProfile.displayName,
          email: newProfile.email,
          language,
          _gotcha: gotcha,
        },
        `Center for Centers: New ${selectedRole} registered (${newProfile.displayName})`
      );

      onRoleSelected(newProfile);
    } catch (err) {
      console.error('Failed to create user role:', err);
      setError('Could not save your account selection. Please check your internet connection and try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border-2 border-[#16402E] max-w-lg w-full rounded-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#16402E] text-[#F8F5EE] px-6 py-5 border-b-2 border-[#D95D39]">
          <h2 className="text-xl font-heading font-black tracking-tight">
            {t.roleModalTitle}
          </h2>
          <p className="text-xs text-[#E2DDD5] mt-1 leading-relaxed">
            {t.roleModalSubtitle}
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Honeypot field (hidden from real users) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="_gotcha_role">Do not fill this</label>
            <input
              type="text"
              id="_gotcha_role"
              name="_gotcha"
              tabIndex={-1}
              value={gotcha}
              onChange={(e) => setGotcha(e.target.value)}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#FCE8E6] border border-[#F5C2C7] text-[#A51D24] text-xs rounded-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Student Card Option */}
            <div
              onClick={() => setSelectedRole('student')}
              className={`p-4 border-2 rounded-sm cursor-pointer transition-all flex items-start gap-4 ${
                selectedRole === 'student'
                  ? 'border-[#16402E] bg-[#F4F8F5] shadow-xs'
                  : 'border-[#E2DDD5] hover:border-[#16402E]/40 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${
                  selectedRole === 'student'
                    ? 'bg-[#16402E] text-white'
                    : 'bg-[#F8F5EE] text-[#555E57]'
                }`}
              >
                <GraduationCap size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[#1C211E]">
                    {t.studentOptionTitle}
                  </h3>
                  {selectedRole === 'student' && (
                    <span className="w-5 h-5 rounded-full bg-[#16402E] text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#555E57] mt-1 leading-relaxed">
                  {t.studentOptionDesc}
                </p>
              </div>
            </div>

            {/* Organization Card Option */}
            <div
              onClick={() => setSelectedRole('organization')}
              className={`p-4 border-2 rounded-sm cursor-pointer transition-all flex items-start gap-4 ${
                selectedRole === 'organization'
                  ? 'border-[#16402E] bg-[#F4F8F5] shadow-xs'
                  : 'border-[#E2DDD5] hover:border-[#16402E]/40 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${
                  selectedRole === 'organization'
                    ? 'bg-[#16402E] text-white'
                    : 'bg-[#F8F5EE] text-[#555E57]'
                }`}
              >
                <Building2 size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[#1C211E]">
                    {t.orgOptionTitle}
                  </h3>
                  {selectedRole === 'organization' && (
                    <span className="w-5 h-5 rounded-full bg-[#16402E] text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#555E57] mt-1 leading-relaxed">
                  {t.orgOptionDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#FFF4DE] border border-[#F3D594] rounded-sm text-[#8C5800] text-xs">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{t.roleWarning}</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#16402E] hover:bg-[#0F2D20] text-white font-heading font-bold text-sm rounded-sm border border-[#0F2D20] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span>{saving ? t.savingRole : t.confirmRoleButton}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
