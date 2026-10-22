import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { LiveStatus, fetchLiveStatus, reportLiveStatus } from '../lib/firestoreService';
import { Zap, Wifi, Radio } from 'lucide-react';

const FRESH_MS = 24 * 60 * 60 * 1000;

// "Right now": the latest power and internet report from people at the place.
export const LiveStatusPanel: React.FC<{ orgId: string; user: User | null; onSignIn: () => void }> = ({ orgId, user, onSignIn }) => {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchLiveStatus(orgId)
      .then(s => !cancelled && setStatus(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const timeAgo = (date: Date) => {
    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    const minutes = Math.round((date.getTime() - Date.now()) / 60000);
    return Math.abs(minutes) < 60 ? rtf.format(minutes, 'minute') : rtf.format(Math.round(minutes / 60), 'hour');
  };

  const report = async (kind: 'power' | 'internet', value: boolean) => {
    if (!user) return;
    setSaving(true);
    setMessage('');
    try {
      await reportLiveStatus(orgId, user.uid, kind, value);
      setStatus(prev => ({ ...(prev || {}), [kind]: value, [`${kind}At`]: new Date() }));
      setMessage(t.thanksForReport);
    } catch {
      setMessage(t.liveReportError);
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    { kind: 'power' as const, Icon: Zap, label: t.powerLabel, on: t.powerOn, off: t.powerOff, value: status?.power, at: status?.powerAt },
    { kind: 'internet' as const, Icon: Wifi, label: t.internetLabel, on: t.internetOn, off: t.internetOff, value: status?.internet, at: status?.internetAt },
  ];

  const buttonClass = 'px-3 py-1.5 text-xs font-bold rounded-sm border transition-colors disabled:opacity-60';

  return (
    <section className="bg-white border-2 border-[#16402E] rounded-sm p-4 space-y-3" aria-labelledby={`live-${orgId}`}>
      <div>
        <h2 id={`live-${orgId}`} className="font-heading font-bold text-base text-[#1C211E] flex items-center gap-2">
          <Radio size={16} className="text-[#D95D39]" aria-hidden="true" />
          {t.rightNow}
        </h2>
        <p className="text-xs text-[#555E57] mt-0.5">{t.rightNowDesc}</p>
      </div>

      <ul className="space-y-3">
        {rows.map(({ kind, Icon, label, on, off, value, at }) => {
          const fresh = at && Date.now() - at.getTime() < FRESH_MS;
          return (
            <li key={kind} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#E2DDD5] pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-start gap-2 min-w-0">
                <Icon size={16} className="text-[#16402E] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1C211E]">{label}</p>
                  {fresh && value !== undefined ? (
                    <p className="text-sm">
                      <span className={`font-bold ${value ? 'text-[#16402E]' : 'text-[#A51D24]'}`}>{value ? on : off}</span>
                      <span className="text-xs text-[#555E57]"> • {t.reportedAgo.replace('{time}', timeAgo(at!))}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-[#555E57]">{t.noReportToday}</p>
                  )}
                </div>
              </div>
              {user && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => report(kind, true)}
                    disabled={saving}
                    className={`${buttonClass} bg-[#E8EFEA] text-[#16402E] border-[#BACCC0] hover:bg-[#16402E] hover:text-white`}
                  >
                    {on}
                  </button>
                  <button
                    onClick={() => report(kind, false)}
                    disabled={saving}
                    className={`${buttonClass} bg-[#FCE8E6] text-[#A51D24] border-[#F5C2C7] hover:bg-[#A51D24] hover:text-white`}
                  >
                    {off}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!user && (
        <button onClick={onSignIn} className={`${buttonClass} bg-white text-[#16402E] border-[#16402E] hover:bg-[#F8F5EE]`}>
          {t.signInToReport}
        </button>
      )}
      {message && (
        <p role="status" className="text-xs font-semibold text-[#16402E]">
          {message}
        </p>
      )}
    </section>
  );
};
