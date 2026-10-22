import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Organization } from '../types';
import { submitClaim } from '../lib/firestoreService';
import { sendToFormspree } from '../lib/formspree';
import { useLanguage } from '../context/LanguageContext';
import { BadgeCheck, CheckCircle, LogIn, X } from 'lucide-react';

interface ClaimPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  user: User | null;
  onSignIn: () => void;
  onClaimSent: () => void;
}

export const ClaimPlaceModal: React.FC<ClaimPlaceModalProps> = ({
  isOpen,
  onClose,
  organization,
  user,
  onSignIn,
  onClaimSent,
}) => {
  const { t } = useLanguage();
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [gotcha, setGotcha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Honeypot spam check
    if (gotcha.trim()) {
      setSubmitted(true);
      return;
    }

    if (!relationship.trim() || !phone.trim() || !details.trim()) {
      setErrorMsg(t.claimFieldsRequired);
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      // 1. Save to Firestore first
      await submitClaim({
        orgId: organization.id,
        orgName: organization.name,
        claimantUid: user.uid,
        claimantEmail: user.email || '',
        claimantName: user.displayName || '',
        relationship: relationship.trim(),
        phone: phone.trim(),
        verificationDetails: details.trim(),
      });

      // 2. Send non-blocking copy to Formspree
      sendToFormspree(
        'place_claim',
        {
          orgId: organization.id,
          orgName: organization.name,
          claimantEmail: user.email || '',
          claimantName: user.displayName || '',
          relationship: relationship.trim(),
          phone: phone.trim(),
          verificationDetails: details.trim(),
          _gotcha: gotcha,
        },
        `Center for Centers: Claim for ${organization.name}`
      ).catch(err => console.warn('Formspree claim error:', err));

      setSubmitted(true);
      onClaimSent();
    } catch {
      setErrorMsg(t.claimError);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-[#F8F5EE] border border-[#E2DDD5] text-sm rounded-sm px-3 py-2 text-[#1C211E] focus:outline-none focus:border-[#16402E]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C211E]/70" role="dialog" aria-modal="true" aria-labelledby="claim-title">
      <div className="bg-white border-2 border-[#16402E] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-sm p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#555E57] hover:text-[#1C211E] p-1"
          aria-label={t.close}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-3 pr-8">
          <div className="w-8 h-8 shrink-0 rounded-sm bg-[#E8EFEA] text-[#16402E] border border-[#BACCC0] flex items-center justify-center">
            <BadgeCheck size={18} />
          </div>
          <div className="min-w-0">
            <h3 id="claim-title" className="font-heading font-bold text-lg text-[#1C211E]">{t.claimThisPlace}</h3>
            <p className="text-xs text-[#555E57] truncate">{organization.name}</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-6 text-center">
            <CheckCircle size={36} className="text-[#16402E] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#16402E]">{t.claimSent}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-xs font-bold bg-[#16402E] text-white rounded-sm border border-[#0F2D20]"
            >
              {t.close}
            </button>
          </div>
        ) : !user ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-[#2C332E]">{t.claimIntro.replace('{name}', organization.name)}</p>
            <p className="text-sm font-semibold text-[#1C211E]">{t.claimSignInFirst}</p>
            <button
              onClick={onSignIn}
              className="w-full px-4 py-2.5 bg-[#16402E] hover:bg-[#0F2D20] text-white text-sm font-bold rounded-sm border border-[#0F2D20] flex items-center justify-center gap-2"
            >
              <LogIn size={16} aria-hidden="true" />
              <span>{t.signIn}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <p className="text-sm text-[#2C332E]">{t.claimIntro.replace('{name}', organization.name)}</p>

            {/* Honeypot field - invisible to humans, catches bots */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="_gotcha_claim">Do not fill this</label>
              <input
                type="text"
                id="_gotcha_claim"
                name="_gotcha"
                value={gotcha}
                onChange={e => setGotcha(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="claim-role" className="block text-xs font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                {t.claimRoleLabel}
              </label>
              <input
                id="claim-role"
                type="text"
                required
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                placeholder={t.claimRolePlaceholder}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="claim-phone" className="block text-xs font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                {t.claimPhoneLabel}
              </label>
              <input
                id="claim-phone"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="claim-details" className="block text-xs font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                {t.claimDetailsLabel}
              </label>
              <textarea
                id="claim-details"
                required
                rows={3}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder={t.claimDetailsPlaceholder}
                className={`${inputClass} resize-none`}
              />
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs text-[#A51D24] font-medium bg-[#FCE8E6] p-2 rounded-sm border border-[#F5C2C7]">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold border border-[#E2DDD5] rounded-sm text-[#555E57] hover:bg-[#F8F5EE]"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-[#16402E] hover:bg-[#0F2D20] text-white rounded-sm border border-[#0F2D20] transition-colors disabled:opacity-60"
              >
                {submitting ? t.saving : t.submitClaim}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
