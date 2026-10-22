import React from 'react';
import { Organization } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { SOCIAL_NETWORKS, socialUrl, websiteUrl } from '../lib/places';
import { Globe, MessageCircle, ExternalLink } from 'lucide-react';

// Website and social profile links for a place. Renders nothing when none are set.
export const SocialLinks: React.FC<{ organization: Organization; className?: string }> = ({ organization, className = '' }) => {
  const { t } = useLanguage();

  const links: { key: string; href: string; label: string }[] = [];
  const site = websiteUrl(organization.website);
  if (site) links.push({ key: 'website', href: site, label: t.socialNames.website });
  for (const network of SOCIAL_NETWORKS) {
    const href = socialUrl(network, organization.socialLinks?.[network]);
    if (href) links.push({ key: network, href, label: t.socialNames[network] });
  }

  if (links.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-2 text-xs ${className}`} aria-label={t.socialLinksTitle}>
      {links.map(link => {
        const Icon = link.key === 'website' ? Globe : link.key === 'whatsapp' ? MessageCircle : ExternalLink;
        return (
          <li key={link.key}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E2DDD5] px-3 py-1.5 rounded-sm font-semibold text-[#16402E] hover:border-[#16402E]"
            >
              <Icon size={13} aria-hidden="true" className={link.key === 'website' ? 'text-[#D95D39]' : 'text-[#16402E]'} />
              <span>{link.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
};
