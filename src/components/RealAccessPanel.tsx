import React from 'react';
import { Organization } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { facilityLabel } from '../lib/places';
import { Zap, Wifi, Clock, CalendarCheck, Users, Banknote, ShieldAlert } from 'lucide-react';

interface RealAccessPanelProps {
  organization: Organization;
  className?: string;
}

export const RealAccessPanel: React.FC<RealAccessPanelProps> = ({ organization, className = '' }) => {
  const { t } = useLanguage();
  const getPowerColor = (status: string) => {
    switch (status) {
      case 'Backup power available':
        return 'bg-[#16402E] text-white';
      case 'Grid power only':
        return 'bg-[#FFF4DE] text-[#8C5800] border border-[#F3D594]';
      case 'Unreliable power':
        return 'bg-[#FCE8E6] text-[#A51D24] border border-[#F5C2C7]';
      default:
        return 'bg-[#EAE4D7] text-[#555E57]';
    }
  };

  const getInternetColor = (status: string) => {
    switch (status) {
      case 'Stable':
        return 'bg-[#16402E] text-white';
      case 'Limited':
        return 'bg-[#FFF4DE] text-[#8C5800] border border-[#F3D594]';
      case 'None':
        return 'bg-[#FCE8E6] text-[#A51D24] border border-[#F5C2C7]';
      default:
        return 'bg-[#EAE4D7] text-[#555E57]';
    }
  };

  return (
    <div className={`border-2 border-[#16402E] bg-white rounded-sm overflow-hidden ${className}`}>
      <div className="bg-[#16402E] text-[#F8F5EE] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D95D39]" />
          <h3 className="font-heading font-bold text-base sm:text-lg tracking-tight">
            Can I realistically use this?
          </h3>
        </div>
        <span className="text-[11px] font-semibold tracking-wide bg-[#0F2D20] px-2 py-0.5 rounded-sm text-[#E2DDD5]">
          Verified access specs
        </span>
      </div>

      <div className="divide-y divide-[#E2DDD5] text-sm">
        <div className="p-4 bg-[#FBF9F5] flex flex-col sm:flex-row sm:items-start gap-2">
          <div className="w-44 shrink-0 font-bold text-[#1C211E] flex items-center gap-1.5">
            <Users size={16} className="text-[#D95D39] shrink-0" />
            <span>Who may use it:</span>
          </div>
          <div className="text-[#2C332E] leading-relaxed flex-1">
            {organization.studentAccess || t.unknown}
          </div>
        </div>

        <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
          <div className="w-44 shrink-0 font-bold text-[#1C211E] flex items-center gap-1.5">
            <Banknote size={16} className="text-[#16402E] shrink-0" />
            <span>Fees & Costs:</span>
          </div>
          <div className="text-[#2C332E] leading-relaxed flex-1 font-medium">
            {organization.fees || t.unknown}
          </div>
        </div>

        <div className="p-4 bg-[#FBF9F5] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="font-bold text-[#1C211E] flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Zap size={15} className="text-[#D95D39]" />
              <span>Power Reliability</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-sm ${getPowerColor(organization.powerReliability)}`}>
                {t.powerNames[organization.powerReliability || 'Unknown'] || organization.powerReliability}
              </span>
              {organization.powerReliability === 'Backup power available' && (
                <span className="text-[12px] text-[#445048]">Generator or Solar inverter on site</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="font-bold text-[#1C211E] flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Wifi size={15} className="text-[#16402E]" />
              <span>Internet Reliability</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-sm ${getInternetColor(organization.internetReliability)}`}>
                {t.internetNames[organization.internetReliability || 'Unknown'] || organization.internetReliability}
              </span>
              {organization.internetReliability === 'Stable' && (
                <span className="text-[12px] text-[#445048]">Fiber or high-speed broadband</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
          <div className="w-44 shrink-0 font-bold text-[#1C211E]">Facilities available:</div>
          <div className="flex-1 flex flex-wrap gap-1.5">
            {organization.facilities && organization.facilities.length > 0 ? (
              organization.facilities.map((fac, idx) => (
                <span
                  key={idx}
                  className="bg-[#EFE9DC] text-[#1C211E] text-xs font-medium px-2 py-0.5 rounded-sm border border-[#DDD6C8]"
                >
                  {facilityLabel(fac, t)}
                </span>
              ))
            ) : (
              <span className="text-[#555E57] text-xs">{t.unknown}</span>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#FBF9F5] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-[#16402E] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#1C211E] text-xs uppercase tracking-wider">Opening Hours</div>
              <div className="text-[#2C332E] mt-0.5 font-medium">{organization.openingHours || t.unknown}</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CalendarCheck size={16} className="text-[#D95D39] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#1C211E] text-xs uppercase tracking-wider">Booking Condition</div>
              <div className="mt-0.5">
                {organization.bookingRequired === true ? (
                  <span className="text-xs font-bold text-[#A51D24] bg-[#FCE8E6] border border-[#F5C2C7] px-2 py-0.5 rounded-sm">
                    {t.bookingRequiredOption}
                  </span>
                ) : organization.bookingRequired === false ? (
                  <span className="text-xs font-bold text-[#16402E] bg-[#E8EFEA] border border-[#BACCC0] px-2 py-0.5 rounded-sm">
                    {t.bookingNotRequiredOption}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#555E57] bg-[#EAE4D7] px-2 py-0.5 rounded-sm">
                    {t.unknown}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-[#EAE4D7] flex items-center justify-between text-xs text-[#445048]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-[#16402E]" />
            <span>Information verified by Center for Centers team</span>
          </div>
          <span className="font-semibold text-[#1C211E]">
            Last confirmed: {organization.lastConfirmed || t.unknown}
          </span>
        </div>
      </div>
    </div>
  );
};
