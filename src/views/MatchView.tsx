import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { Organization, Opportunity, CameroonRegion } from '../types';
import { AppRole } from '../lib/auth';
import { useLanguage } from '../context/LanguageContext';
import { CAMEROON_REGIONS, formatLocation } from '../lib/regions';
import { placeTypeLabel } from '../lib/places';
import { Need, ParsedSituation, parseSituation, matchPlaces, matchOpportunities, needStatus } from '../lib/matching';
import { submitVenueRequest } from '../lib/firestoreService';
import { sendToFormspree } from '../lib/formspree';
import { OrgLogo } from '../components/OrgVisuals';
import { Search, MapPin, ArrowRight, CheckCircle2, Send } from 'lucide-react';

interface MatchViewProps {
  organizations: Organization[];
  opportunities: Opportunity[];
  user: User | null;
  role: AppRole | null;
  onSelectOrganization: (org: Organization) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  onBrowsePlaces: () => void;
}

const VENUE_NEEDS: Need[] = ['computers', 'internet', 'power', 'printing', 'quiet'];

const inputClass =
  'w-full bg-white border border-[#E2DDD5] text-sm rounded-sm px-3 py-2 text-[#1C211E] focus:outline-none focus:border-[#16402E]';
const labelClass = 'block text-xs font-bold text-[#1C211E] mb-1 uppercase tracking-wider';

export const MatchView: React.FC<MatchViewProps> = ({
  organizations,
  opportunities,
  user,
  role,
  onSelectOrganization,
  onSelectOpportunity,
  onBrowsePlaces,
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'situation' | 'venue'>('situation');

  // Situation search
  const [text, setText] = useState('');
  const [situation, setSituation] = useState<ParsedSituation | null>(null);

  // Venue finder
  const [venueNeeds, setVenueNeeds] = useState<Need[]>(['computers', 'internet', 'power']);
  const [venueRegion, setVenueRegion] = useState<CameroonRegion | ''>('');
  const [venueDate, setVenueDate] = useState('');
  const [venueBudget, setVenueBudget] = useState('');
  const [venueSearched, setVenueSearched] = useState(false);

  const placeMatches = useMemo(
    () => (situation ? matchPlaces(situation, organizations) : []),
    [situation, organizations]
  );
  const oppMatches = useMemo(
    () => (situation ? matchOpportunities(situation, opportunities) : []),
    [situation, opportunities]
  );

  const venueSituation: ParsedSituation = { needs: venueNeeds, region: venueRegion || undefined, words: [] };
  const budgetNumber = venueBudget.trim() ? Number(venueBudget) : undefined;
  const venueMatches = useMemo(
    () => (venueSearched ? matchPlaces(venueSituation, organizations, budgetNumber) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [venueSearched, venueNeeds, venueRegion, venueBudget, organizations]
  );

  const toggleVenueNeed = (need: Need) =>
    setVenueNeeds(prev => (prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]));

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm transition-colors ${
      active ? 'bg-[#16402E] text-white border-[#16402E]' : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="border-b-2 border-[#16402E] pb-3">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#1C211E]">{t.matchTitle}</h1>
        <p className="text-xs sm:text-sm text-[#445048] mt-1">{t.matchSubtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b-2 border-[#16402E]" role="tablist">
        <button role="tab" aria-selected={mode === 'situation'} onClick={() => setMode('situation')} className={tabClass(mode === 'situation')}>
          {t.situationTab}
        </button>
        <button role="tab" aria-selected={mode === 'venue'} onClick={() => setMode('venue')} className={tabClass(mode === 'venue')}>
          {t.venueTab}
        </button>
      </div>

      {mode === 'situation' ? (
        <div className="space-y-6">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (text.trim()) setSituation(parseSituation(text));
            }}
            className="bg-white border-2 border-[#16402E] rounded-sm p-4 space-y-3"
          >
            <label htmlFor="situation-text" className={labelClass}>{t.situationLabel}</label>
            <textarea
              id="situation-text"
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t.situationPlaceholder}
              className={`${inputClass} bg-[#F8F5EE] resize-none`}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#D95D39] hover:bg-[#B84725] text-white font-bold text-sm rounded-sm border border-[#B84725] inline-flex items-center justify-center gap-2"
            >
              <Search size={16} aria-hidden="true" />
              <span>{t.findMatches}</span>
            </button>
          </form>

          {situation && (
            <div className="space-y-6" aria-live="polite">
              <Understood situation={situation} />

              <section className="space-y-3">
                <h2 className="font-heading font-extrabold text-lg text-[#1C211E]">{t.placesThatFit}</h2>
                {placeMatches.length > 0 ? (
                  <ul className="space-y-2">
                    {placeMatches.map(m => (
                      <li key={m.item.id}>
                        <PlaceRow org={m.item} reasons={m.reasons} onSelect={onSelectOrganization} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <NoMatches onBrowsePlaces={onBrowsePlaces} />
                )}
              </section>

              {oppMatches.length > 0 && (
                <section className="space-y-3">
                  <h2 className="font-heading font-extrabold text-lg text-[#1C211E]">{t.opportunitiesThatFit}</h2>
                  <ul className="space-y-2">
                    {oppMatches.map(m => (
                      <li key={m.item.id}>
                        <button
                          onClick={() => onSelectOpportunity(m.item)}
                          className="w-full text-left bg-white border border-[#E2DDD5] hover:border-[#16402E] rounded-sm p-3 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[#1C211E] break-words">{m.item.title}</p>
                            <p className="text-xs text-[#555E57] break-words">
                              {m.item.orgName} • {formatLocation(m.item, t)} • {m.item.cost === 0 ? t.needNames.free : `${m.item.cost.toLocaleString()} XAF`}
                            </p>
                            <Reasons reasons={m.reasons} />
                          </div>
                          <ArrowRight size={16} className="text-[#16402E] shrink-0 mt-1" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={e => {
              e.preventDefault();
              setVenueSearched(true);
            }}
            className="bg-white border-2 border-[#16402E] rounded-sm p-4 space-y-4"
          >
            <p className="text-sm text-[#445048]">{t.venueIntro}</p>
            <fieldset>
              <legend className={`${labelClass} mb-2`}>{t.venueNeedsLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {VENUE_NEEDS.map(need => {
                  const checked = venueNeeds.includes(need);
                  return (
                    <label
                      key={need}
                      className={`px-3 py-1.5 border rounded-sm text-xs cursor-pointer focus-within:ring-2 focus-within:ring-[#D95D39] ${
                        checked ? 'bg-[#16402E] text-white border-[#16402E] font-bold' : 'bg-[#F8F5EE] text-[#1C211E] border-[#E2DDD5]'
                      }`}
                    >
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleVenueNeed(need)} />
                      {t.needNames[need]}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="venue-region" className={labelClass}>{t.regionField}</label>
                <select id="venue-region" value={venueRegion} onChange={e => setVenueRegion(e.target.value as CameroonRegion | '')} className={inputClass}>
                  <option value="">{t.allRegions}</option>
                  {CAMEROON_REGIONS.map(r => (
                    <option key={r} value={r}>{t.regionNames[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="venue-date" className={labelClass}>{t.venueDateLabel}</label>
                <input id="venue-date" type="date" value={venueDate} onChange={e => setVenueDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="venue-budget" className={labelClass}>{t.budgetLabel}</label>
                <input
                  id="venue-budget"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={venueBudget}
                  onChange={e => setVenueBudget(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#D95D39] hover:bg-[#B84725] text-white font-bold text-sm rounded-sm border border-[#B84725] inline-flex items-center justify-center gap-2"
            >
              <Search size={16} aria-hidden="true" />
              <span>{t.findVenues}</span>
            </button>
          </form>

          {venueSearched && (
            <section className="space-y-3" aria-live="polite">
              <h2 className="font-heading font-extrabold text-lg text-[#1C211E]">{t.placesThatFit}</h2>
              {venueMatches.length > 0 ? (
                <ul className="space-y-3">
                  {venueMatches.map(m => (
                    <li key={m.item.id}>
                      <VenueCard
                        org={m.item}
                        needs={venueNeeds}
                        reasons={m.reasons}
                        user={user}
                        role={role}
                        region={venueRegion}
                        date={venueDate}
                        budget={budgetNumber}
                        onSelect={onSelectOrganization}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <NoMatches onBrowsePlaces={onBrowsePlaces} />
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

const Understood: React.FC<{ situation: ParsedSituation }> = ({ situation }) => {
  const { t } = useLanguage();
  const chips = [
    ...situation.needs.map(n => t.needNames[n]),
    situation.town ? situation.town.charAt(0).toUpperCase() + situation.town.slice(1) : '',
    situation.region ? t.regionNames[situation.region] : '',
    situation.budget ? `${situation.budget.toLocaleString()} XAF` : '',
  ].filter(Boolean);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-bold text-[#16402E]">{t.understood}:</span>
      {chips.map(chip => (
        <span key={chip} className="px-2 py-0.5 bg-[#EFE9DC] border border-[#DDD6C8] rounded-sm text-[#1C211E]">{chip}</span>
      ))}
    </div>
  );
};

const Reasons: React.FC<{ reasons: string[] }> = ({ reasons }) => {
  const { t } = useLanguage();
  if (reasons.length === 0) return null;
  return (
    <p className="text-[11px] text-[#16402E] mt-1">
      <span className="font-bold">{t.whyLabel}: </span>
      {reasons.map(r => t.matchReasons[r] || r).join(' • ')}
    </p>
  );
};

const NoMatches: React.FC<{ onBrowsePlaces: () => void }> = ({ onBrowsePlaces }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-white border-2 border-dashed border-[#E2DDD5] p-6 text-center rounded-sm">
      <p className="font-heading font-bold text-base text-[#1C211E]">{t.noMatchesTitle}</p>
      <p className="text-xs text-[#555E57] mt-1">{t.noMatchesDesc}</p>
      <button onClick={onBrowsePlaces} className="mt-3 px-4 py-2 bg-[#16402E] text-white text-xs font-bold rounded-sm border border-[#0F2D20]">
        {t.browsePlaces}
      </button>
    </div>
  );
};

const PlaceRow: React.FC<{ org: Organization; reasons: string[]; onSelect: (org: Organization) => void }> = ({ org, reasons, onSelect }) => {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => onSelect(org)}
      className="w-full text-left bg-white border border-[#E2DDD5] hover:border-[#16402E] rounded-sm p-3 flex items-start gap-3"
    >
      <OrgLogo organization={org} size="md" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm text-[#1C211E] break-words">{org.name}</p>
        <p className="text-xs text-[#555E57] flex items-center gap-1 break-words">
          <MapPin size={12} className="text-[#D95D39] shrink-0" aria-hidden="true" />
          {placeTypeLabel(org.type, t)} • {formatLocation(org, t)}
        </p>
        {org.fees && <p className="text-xs text-[#445048] break-words">{org.fees}</p>}
        <Reasons reasons={reasons} />
      </div>
      <ArrowRight size={16} className="text-[#16402E] shrink-0 mt-1" aria-hidden="true" />
    </button>
  );
};

interface VenueCardProps {
  org: Organization;
  needs: Need[];
  reasons: string[];
  user: User | null;
  role: AppRole | null;
  region: string;
  date: string;
  budget?: number;
  onSelect: (org: Organization) => void;
}

const VenueCard: React.FC<VenueCardProps> = ({ org, needs, reasons, user, role, region, date, budget, onSelect }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState(user?.email || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const canRequest = role === 'organization' || role === 'admin';

  const statusLabel = (need: Need) => {
    const status = needStatus(org, need);
    return status === 'yes' ? t.needYes : status === 'partly' ? t.needPartly : status === 'no' ? t.needNo : t.unknown;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canRequest) return;
    if (!message.trim() || !contact.trim()) {
      setError(t.requestFieldsRequired);
      return;
    }
    setError('');
    setSending(true);
    const request = {
      placeId: org.id,
      placeName: org.name,
      requesterUid: user.uid,
      requesterEmail: user.email || '',
      contact: contact.trim(),
      message: message.trim(),
      needs,
      region,
      date,
      budget: budget ?? null,
    };
    try {
      // 1. Save to Firestore first
      await submitVenueRequest(request);
      // 2. Send non-blocking copy to Formspree
      sendToFormspree('venue_request', { ...request, needs: needs.join(', ') }, `Center for Centers: Venue request for ${org.name}`).catch(err =>
        console.warn('Formspree venue request error:', err)
      );
      setSent(true);
    } catch {
      setError(t.requestError);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2DDD5] rounded-sm p-3 space-y-3">
      <PlaceRow org={org} reasons={reasons} onSelect={onSelect} />
      {needs.length > 0 && (
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
          {needs.map(need => (
            <div key={need} className="bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-2 py-1">
              <dt className="text-[#555E57]">{t.needNames[need]}</dt>
              <dd className="font-bold text-[#1C211E]">{statusLabel(need)}</dd>
            </div>
          ))}
        </dl>
      )}

      {sent ? (
        <p className="text-xs font-semibold text-[#16402E] flex items-center gap-1.5">
          <CheckCircle2 size={14} aria-hidden="true" />
          {t.requestSent}
        </p>
      ) : !canRequest ? (
        <p className="text-xs text-[#555E57]">{t.requestSignIn}</p>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] inline-flex items-center gap-1.5"
        >
          <Send size={13} aria-hidden="true" />
          {t.requestVenue}
        </button>
      ) : (
        <form onSubmit={handleSend} className="space-y-2 border-t border-[#E2DDD5] pt-3">
          <p className="text-xs font-bold text-[#1C211E]">{t.requestVenueTitle.replace('{name}', org.name)}</p>
          <div>
            <label htmlFor={`req-msg-${org.id}`} className={labelClass}>{t.requestMessageLabel}</label>
            <textarea
              id={`req-msg-${org.id}`}
              rows={2}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t.requestMessagePlaceholder}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor={`req-contact-${org.id}`} className={labelClass}>{t.requestContactLabel}</label>
            <input id={`req-contact-${org.id}`} type="text" value={contact} onChange={e => setContact(e.target.value)} className={inputClass} />
          </div>
          {error && <p role="alert" className="text-xs text-[#A51D24]">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] disabled:opacity-60"
            >
              {sending ? t.saving : t.sendRequest}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-xs font-bold border border-[#E2DDD5] rounded-sm text-[#555E57]">
              {t.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
