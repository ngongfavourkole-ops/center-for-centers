import React, { useState } from 'react';
import { submitUserReport } from '../lib/firestoreService';
import { sendToFormspree } from '../lib/formspree';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'organization' | 'opportunity';
  targetId: string;
  targetTitle: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('Outdated contact or hours');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [gotcha, setGotcha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot spam check
    if (gotcha.trim()) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1000);
      return;
    }

    if (!details.trim()) {
      setErrorMsg('Please describe what needs updating.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      // 1. Save to Firestore first
      await submitUserReport({
        targetType,
        targetId,
        targetTitle,
        reason,
        details: details.trim(),
        reporterEmail: reporterEmail.trim() || undefined,
      });

      // 2. Send non-blocking copy to Formspree
      sendToFormspree('incorrect_info_report', {
        targetType,
        targetId,
        targetTitle,
        reason,
        details: details.trim(),
        reporterEmail: reporterEmail.trim() || 'Anonymous student',
        _gotcha: gotcha,
      }).catch(err => console.warn('Formspree report error:', err));

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        setReporterEmail('');
        setGotcha('');
        onClose();
      }, 2000);
    } catch {
      setErrorMsg('Could not submit report. Please check connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C211E]/70">
      <div className="bg-white border-2 border-[#16402E] w-full max-w-md rounded-sm p-5 relative shadow-none">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#555E57] hover:text-[#1C211E] p-1"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-sm bg-[#FFF4DE] text-[#8C5800] border border-[#F3D594] flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-[#1C211E]">Report incorrect info</h3>
            <p className="text-xs text-[#555E57] truncate max-w-xs">{targetTitle}</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-6 text-center">
            <CheckCircle size={36} className="text-[#16402E] mx-auto mb-2" />
            <p className="font-bold text-[#16402E]">Thank you for verifying.</p>
            <p className="text-xs text-[#555E57] mt-1">{t.reportTeamReview}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Honeypot field - invisible to humans, catches bots */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="_gotcha_report">Do not fill this</label>
              <input
                type="text"
                id="_gotcha_report"
                name="_gotcha"
                value={gotcha}
                onChange={e => setGotcha(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                What is incorrect?
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] text-sm rounded-sm px-3 py-2 text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              >
                <option value="Outdated contact or hours">Outdated contact phone or opening hours</option>
                <option value="Fees or access conditions changed">Fees or student access conditions changed</option>
                <option value="Power or internet reliability changed">Power or internet reliability changed</option>
                <option value="Opportunity expired or canceled">Opportunity is expired or canceled</option>
                <option value="Closed or moved location">Center has relocated or ceased operations</option>
                <option value="Other incorrect information">Other incorrect information</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                Correct details or notes
              </label>
              <textarea
                required
                rows={3}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Tell us what needs updating so students get accurate facts..."
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] text-sm rounded-sm p-2.5 text-[#1C211E] focus:outline-none focus:border-[#16402E] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C211E] mb-1 uppercase tracking-wider">
                Your email (optional)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={e => setReporterEmail(e.target.value)}
                placeholder="Optional, in case we need clarification"
                className="w-full bg-[#F8F5EE] border border-[#E2DDD5] text-sm rounded-sm px-3 py-2 text-[#1C211E] focus:outline-none focus:border-[#16402E]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-[#A51D24] font-medium bg-[#FCE8E6] p-2 rounded-sm border border-[#F5C2C7]">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold border border-[#E2DDD5] rounded-sm text-[#555E57] hover:bg-[#F8F5EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-[#D95D39] hover:bg-[#B84725] text-white rounded-sm border border-[#B84725] transition-colors"
              >
                {submitting ? 'Submitting...' : 'Send report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
