import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Organization } from '../types';
import { PlaceFormFields } from './PlaceFormFields';
import { adminCreatePlace, adminUpdatePlace } from '../lib/firestoreService';
import { sendToFormspree } from '../lib/formspree';
import { useLanguage } from '../context/LanguageContext';
import { PlaceDraft, emptyPlaceDraft, placeDraftFromOrg, placeFieldsFromDraft } from '../lib/places';
import { AlertCircle } from 'lucide-react';

interface AdminPlaceEditorProps {
  user: User;
  existing: Organization | null; // null = add a new team-managed place
  onSaved: (message: string) => void;
  onCancel?: () => void;
}

// Admin form to add a team-managed place (published immediately) or edit any place.
export const AdminPlaceEditor: React.FC<AdminPlaceEditorProps> = ({ user, existing, onSaved, onCancel }) => {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<PlaceDraft>(() => (existing ? placeDraftFromOrg(existing) : emptyPlaceDraft()));
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gotcha, setGotcha] = useState('');

  // Owner-managed places don't need a source note; team-managed ones always do.
  const needsSource = !existing || existing.managedBy === 'team';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gotcha.trim()) return;

    if (!draft.name.trim()) {
      setErrorMsg(t.placeNameRequired);
      return;
    }
    if (!draft.region) {
      setErrorMsg(t.regionRequiredError);
      return;
    }
    if (needsSource && !draft.sourceNote.trim()) {
      setErrorMsg(t.sourceNoteRequired);
      return;
    }

    setErrorMsg('');
    setSaving(true);
    try {
      const fields = placeFieldsFromDraft(draft);
      const sourceNote = draft.sourceNote.trim();

      // 1. Save to Firestore first
      const placeId = existing
        ? (await adminUpdatePlace(existing.id, fields, sourceNote), existing.id)
        : await adminCreatePlace(user.uid, fields, sourceNote);

      // 2. Send non-blocking copy to Formspree
      sendToFormspree(
        'admin_place',
        {
          action: existing ? 'edit' : 'create',
          placeId,
          adminEmail: user.email || '',
          ...fields,
          ...fields.socialLinks,
          socialLinks: undefined,
          bookingRequired:
            fields.bookingRequired === null ? 'Unknown' : fields.bookingRequired ? 'Booking required' : 'Walk-ins welcome',
          sourceNote,
          _gotcha: gotcha,
        },
        `Center for Centers: Admin ${existing ? 'updated' : 'added'} place - ${fields.name}`
      ).catch(err => console.warn('Formspree admin place error:', err));

      if (!existing) setDraft(emptyPlaceDraft());
      onSaved(existing ? t.placeUpdated : t.placePublished);
    } catch {
      setErrorMsg(t.placeSaveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border-2 border-[#16402E] rounded-sm p-4 sm:p-6 space-y-5">
      <div className="border-b border-[#E2DDD5] pb-3">
        <h2 className="font-heading font-extrabold text-lg text-[#1C211E]">
          {existing ? `${t.adminEditPlaceTitle}: ${existing.name}` : t.adminAddPlaceTitle}
        </h2>
        {!existing && <p className="text-xs text-[#555E57] mt-1">{t.adminAddPlaceDesc}</p>}
      </div>

      {/* Honeypot field - invisible to humans, catches bots */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="_gotcha_admin_place">Do not fill this</label>
        <input
          type="text"
          id="_gotcha_admin_place"
          name="_gotcha"
          value={gotcha}
          onChange={e => setGotcha(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <PlaceFormFields
        draft={draft}
        onChange={patch => setDraft(prev => ({ ...prev, ...patch }))}
        mode={needsSource ? 'admin' : 'owner'}
      />

      {errorMsg && (
        <div role="alert" className="p-3 bg-[#FCE8E6] text-[#A51D24] text-xs font-medium rounded-sm border border-[#F5C2C7] flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="pt-4 border-t border-[#E2DDD5] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold border border-[#E2DDD5] rounded-sm text-[#555E57] hover:bg-[#F8F5EE]"
          >
            {t.cancel}
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#16402E] hover:bg-[#0F2D20] text-white font-bold text-xs uppercase tracking-wider rounded-sm border border-[#0F2D20] transition-colors disabled:opacity-60"
        >
          {saving ? t.saving : existing ? t.saveChanges : t.publishPlace}
        </button>
      </div>
    </form>
  );
};
