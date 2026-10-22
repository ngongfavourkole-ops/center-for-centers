import React from 'react';
import { CameroonRegion, InternetReliability, OrgType, PowerReliability, SocialNetwork } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CAMEROON_REGIONS } from '../lib/regions';
import {
  PlaceDraft,
  PLACE_TYPES,
  FACILITIES,
  POWER_OPTIONS,
  INTERNET_OPTIONS,
  SOCIAL_NETWORKS,
  placeTypeLabel,
  facilityLabel,
} from '../lib/places';

interface PlaceFormFieldsProps {
  draft: PlaceDraft;
  onChange: (patch: Partial<PlaceDraft>) => void;
  // 'admin' adds the source note and lets every access detail stay unknown.
  mode: 'admin' | 'owner';
}

const inputClass =
  'w-full bg-[#F8F5EE] border border-[#E2DDD5] text-sm rounded-sm px-3 py-2 text-[#1C211E] focus:outline-none focus:border-[#16402E]';
const labelClass = 'block text-xs font-bold text-[#1C211E] mb-1 uppercase tracking-wider';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-[#16402E] text-white px-3 py-1.5 rounded-sm flex items-center gap-2">
    <div className="w-2 h-2 rounded-full bg-[#D95D39]" aria-hidden="true" />
    <h3 className="font-heading font-bold text-xs uppercase tracking-wider">{children}</h3>
  </div>
);

// Shared fields for creating or editing a place. The parent owns the <form> and the save logic.
export const PlaceFormFields: React.FC<PlaceFormFieldsProps> = ({ draft, onChange, mode }) => {
  const { t } = useLanguage();
  const isAdmin = mode === 'admin';
  const id = (name: string) => `place-${mode}-${name}`;

  const toggleFacility = (facility: string) => {
    onChange({
      facilities: draft.facilities.includes(facility)
        ? draft.facilities.filter(f => f !== facility)
        : [...draft.facilities, facility],
    });
  };

  const setSocial = (network: SocialNetwork, value: string) => {
    onChange({ socialLinks: { ...draft.socialLinks, [network]: value } });
  };

  const bookingValue = draft.bookingRequired === null ? 'unknown' : draft.bookingRequired ? 'yes' : 'no';

  return (
    <div className="space-y-6">
      <p className="text-xs text-[#555E57] bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-3 py-2">{t.unknownHint}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor={id('name')} className={labelClass}>{t.placeNameLabel}</label>
          <input
            id={id('name')}
            type="text"
            required
            value={draft.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder={t.placeNamePlaceholder}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={id('type')} className={labelClass}>{t.placeTypeRequired}</label>
          <select
            id={id('type')}
            value={draft.type}
            onChange={e => onChange({ type: e.target.value as OrgType })}
            className={inputClass}
          >
            {PLACE_TYPES.map(type => (
              <option key={type} value={type}>{placeTypeLabel(type, t)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={id('region')} className={labelClass}>{t.regionRequired}</label>
          <select
            id={id('region')}
            required
            value={draft.region}
            onChange={e => onChange({ region: e.target.value as CameroonRegion | '' })}
            className={inputClass}
          >
            <option value="">{t.chooseRegion}</option>
            {CAMEROON_REGIONS.map(r => (
              <option key={r} value={r}>{t.regionNames[r]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={id('town')} className={labelClass}>{t.townField}</label>
          <input
            id={id('town')}
            type="text"
            value={draft.town}
            onChange={e => onChange({ town: e.target.value })}
            placeholder={t.townPlaceholder}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={id('address')} className={labelClass}>{t.addressLabel}</label>
          <input
            id={id('address')}
            type="text"
            value={draft.address}
            onChange={e => onChange({ address: e.target.value })}
            placeholder={t.addressPlaceholder}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={id('phone')} className={labelClass}>{t.phoneLabel}</label>
          <input
            id={id('phone')}
            type="tel"
            value={draft.contactPhone}
            onChange={e => onChange({ contactPhone: e.target.value })}
            placeholder="+237 6XX XXX XXX"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={id('email')} className={labelClass}>{t.emailLabel}</label>
          <input
            id={id('email')}
            type="email"
            value={draft.contactEmail}
            onChange={e => onChange({ contactEmail: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={id('description')} className={labelClass}>{t.descriptionLabel}</label>
          <textarea
            id={id('description')}
            rows={3}
            value={draft.description}
            onChange={e => onChange({ description: e.target.value })}
            placeholder={t.descriptionPlaceholder}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label htmlFor={id('logo')} className={labelClass}>{t.logoUrlLabel}</label>
          <input
            id={id('logo')}
            type="url"
            value={draft.logoUrl}
            onChange={e => onChange({ logoUrl: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor={id('photo')} className={labelClass}>{t.imageUrlLabel}</label>
          <input
            id={id('photo')}
            type="url"
            value={draft.imageUrl}
            onChange={e => onChange({ imageUrl: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>{t.socialLinksTitle}</SectionTitle>
        <p className="text-xs text-[#555E57]">{t.socialLinksHint}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={id('website')} className={labelClass}>{t.socialNames.website}</label>
            <input
              id={id('website')}
              type="text"
              inputMode="url"
              value={draft.website}
              onChange={e => onChange({ website: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          {SOCIAL_NETWORKS.map(network => (
            <div key={network}>
              <label htmlFor={id(network)} className={labelClass}>{t.socialNames[network]}</label>
              <input
                id={id(network)}
                type={network === 'whatsapp' ? 'tel' : 'text'}
                value={draft.socialLinks[network] || ''}
                onChange={e => setSocial(network, e.target.value)}
                placeholder={network === 'whatsapp' ? '+237 6XX XXX XXX' : '@...'}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle>{t.accessTitle}</SectionTitle>

        <div>
          <label htmlFor={id('access')} className={labelClass}>{t.whoCanUseLabel}</label>
          <input
            id={id('access')}
            type="text"
            value={draft.studentAccess}
            onChange={e => onChange({ studentAccess: e.target.value })}
            placeholder={t.whoCanUsePlaceholder}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={id('fees')} className={labelClass}>{t.feesLabel}</label>
            <input
              id={id('fees')}
              type="text"
              value={draft.fees}
              onChange={e => onChange({ fees: e.target.value })}
              placeholder={t.feesPlaceholder}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={id('hours')} className={labelClass}>{t.openingHoursLabel}</label>
            <input
              id={id('hours')}
              type="text"
              value={draft.openingHours}
              onChange={e => onChange({ openingHours: e.target.value })}
              placeholder={t.openingHoursPlaceholder}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={id('power')} className={labelClass}>{t.powerLabel}</label>
            <select
              id={id('power')}
              value={draft.powerReliability}
              onChange={e => onChange({ powerReliability: e.target.value as PowerReliability })}
              className={inputClass}
            >
              {POWER_OPTIONS.map(option => (
                <option key={option} value={option}>{t.powerNames[option]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={id('internet')} className={labelClass}>{t.internetLabel}</label>
            <select
              id={id('internet')}
              value={draft.internetReliability}
              onChange={e => onChange({ internetReliability: e.target.value as InternetReliability })}
              className={inputClass}
            >
              {INTERNET_OPTIONS.map(option => (
                <option key={option} value={option}>{t.internetNames[option]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={id('booking')} className={labelClass}>{t.bookingLabel}</label>
            <select
              id={id('booking')}
              value={bookingValue}
              onChange={e =>
                onChange({ bookingRequired: e.target.value === 'unknown' ? null : e.target.value === 'yes' })
              }
              className={inputClass}
            >
              <option value="unknown">{t.unknown}</option>
              <option value="no">{t.bookingNotRequiredOption}</option>
              <option value="yes">{t.bookingRequiredOption}</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend className={`${labelClass} mb-2`}>{t.facilitiesLabel}</legend>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-2">
            {FACILITIES.map(facility => {
              const checked = draft.facilities.includes(facility);
              return (
                <label
                  key={facility}
                  className={`flex items-center gap-2 p-2 border rounded-sm text-xs cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#D95D39] ${
                    checked ? 'bg-[#16402E] text-white border-[#16402E] font-bold' : 'bg-[#F8F5EE] text-[#1C211E] border-[#E2DDD5]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFacility(facility)}
                    className="sr-only"
                  />
                  <span>{facilityLabel(facility, t)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {isAdmin && (
        <div>
          <label htmlFor={id('source')} className={labelClass}>{t.sourceNoteLabel}</label>
          <textarea
            id={id('source')}
            required
            rows={2}
            value={draft.sourceNote}
            onChange={e => onChange({ sourceNote: e.target.value })}
            placeholder={t.sourceNotePlaceholder}
            className={`${inputClass} resize-none`}
          />
          <p className="text-[11px] text-[#555E57] mt-1">{t.sourceNoteHint}</p>
        </div>
      )}
    </div>
  );
};
