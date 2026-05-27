'use client';

import { useState } from 'react';
import { SharePlatform } from '@/types/sharing';

interface ShareButtonsProps {
  shareUrl: string;
  amount: string;
  currency: string;
  onShare?: (platform: SharePlatform) => void;
}

interface PrivacySettings {
  includeAmount: boolean;
  includeCurrency: boolean;
}

interface ShareAnalytics {
  platform: SharePlatform;
  timestamp: number;
}

const ANALYTICS_KEY = 'stellar_share_analytics';

function trackShare(platform: SharePlatform): void {
  try {
    const existing: ShareAnalytics[] = JSON.parse(
      localStorage.getItem(ANALYTICS_KEY) ?? '[]'
    );
    existing.push({ platform, timestamp: Date.now() });
    // Keep last 100 entries
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(existing.slice(-100)));
  } catch {
    // ignore storage errors
  }
}

export function getShareAnalytics(): Record<SharePlatform, number> {
  try {
    const entries: ShareAnalytics[] = JSON.parse(
      localStorage.getItem(ANALYTICS_KEY) ?? '[]'
    );
    return entries.reduce(
      (acc, { platform }) => ({ ...acc, [platform]: (acc[platform] ?? 0) + 1 }),
      {} as Record<SharePlatform, number>
    );
  } catch {
    return {} as Record<SharePlatform, number>;
  }
}

export function ShareButtons({ shareUrl, amount, currency, onShare }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    includeAmount: true,
    includeCurrency: true,
  });

  const buildShareText = () => {
    const parts: string[] = ['I just completed a transaction'];
    if (privacy.includeAmount) parts.push(`of ${amount}`);
    if (privacy.includeCurrency) parts.push(privacy.includeAmount ? currency : `(${currency})`);
    parts.push('using Stellar-Spend! 🚀');
    return parts.join(' ');
  };

  const shareText = buildShareText();

  const platforms = [
    {
      id: 'twitter' as SharePlatform,
      label: 'Twitter/X',
      color: 'bg-black hover:bg-zinc-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      id: 'facebook' as SharePlatform,
      label: 'Facebook',
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      id: 'linkedin' as SharePlatform,
      label: 'LinkedIn',
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      id: 'email' as SharePlatform,
      label: 'Email',
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=Check out my Stellar-Spend transaction&body=${encodeURIComponent(
        `${shareText}\n\nView details: ${shareUrl}`
      )}`,
    },
  ];

  const handleShare = (platform: SharePlatform, url: string) => {
    trackShare(platform);
    onShare?.(platform);
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleCopy = () => {
    trackShare('copy');
    onShare?.('copy');
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Share this transaction</p>
        <button
          onClick={() => setShowPrivacy((v) => !v)}
          className="text-xs text-[#c9a962] hover:underline"
          aria-expanded={showPrivacy}
        >
          {showPrivacy ? 'Hide' : 'Privacy'} settings
        </button>
      </div>

      {/* Privacy controls */}
      {showPrivacy && (
        <div className="p-3 border border-[#333333] bg-[#111111] space-y-2 text-xs">
          <p className="text-[#777777] uppercase tracking-widest text-[10px]">Privacy Controls</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.includeAmount}
              onChange={(e) => setPrivacy((p) => ({ ...p, includeAmount: e.target.checked }))}
              className="accent-[#c9a962]"
            />
            <span className="text-[#aaaaaa]">Include transaction amount</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.includeCurrency}
              onChange={(e) => setPrivacy((p) => ({ ...p, includeCurrency: e.target.checked }))}
              className="accent-[#c9a962]"
            />
            <span className="text-[#aaaaaa]">Include currency</span>
          </label>
          <p className="text-[#555555] italic">Preview: {shareText}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => handleShare(platform.id, platform.url)}
            className={`${platform.color} text-white px-3 py-2 rounded-lg text-sm font-medium transition`}
            title={`Share on ${platform.label}`}
          >
            {platform.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-3 py-2 border border-[#333333] rounded-lg text-sm bg-[#111111] text-[#aaaaaa]"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-[#c9a962] text-[#0a0a0a] rounded-lg text-sm font-medium hover:bg-[#d4b574] transition"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
