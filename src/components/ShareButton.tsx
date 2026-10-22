import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url = window.location.href,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${text}\n\nDiscovered via Center for Centers (C4C Buea):`,
          url,
        });
        return;
      } catch {
        // Fallback
      }
    }

    const shareMessage = encodeURIComponent(`${title}\n${text}\n${url}`);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${shareMessage}`;
    
    const opened = window.open(whatsappUrl, '_blank');
    if (!opened) {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${title} - ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold border border-[#16402E] text-[#16402E] bg-white hover:bg-[#F8F5EE] rounded-sm transition-colors ${className}`}
      title="Share to WhatsApp or nearby friends"
    >
      {copied ? <Check size={15} className="text-[#16402E]" /> : <Share2 size={15} />}
      <span>{copied ? 'Link copied' : 'Share'}</span>
    </button>
  );
};
