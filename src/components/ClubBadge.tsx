import React, { useState } from 'react';
import { resolveClub, getVerifiedBadgeUrl } from '../data/clubs';

interface ClubBadgeProps {
  name?: string;
  id?: string | number;
  badgeUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ClubBadge: React.FC<ClubBadgeProps> = ({
  name,
  id,
  badgeUrl,
  size = 'md',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  // Resolve club data
  const resolved = resolveClub(name || id);
  const effectiveUrl = badgeUrl || resolved?.badgeUrl || getVerifiedBadgeUrl(id || name);
  const clubName = resolved?.name || name || 'Club';
  const abbr = resolved?.abbr || (name ? name.substring(0, 3).toUpperCase() : 'PL');

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-10 h-10 text-sm font-bold',
    xl: 'w-14 h-14 text-base font-black'
  };

  const imageSizes = {
    xs: 'max-h-4 max-w-4',
    sm: 'max-h-5 max-w-5',
    md: 'max-h-7 max-w-7',
    lg: 'max-h-10 max-w-10',
    xl: 'max-h-14 max-w-14'
  };

  if (!hasError && effectiveUrl) {
    return (
      <img
        src={effectiveUrl}
        alt={`${clubName} crest`}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`${imageSizes[size]} object-contain shrink-0 filter drop-shadow-2xs ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  // Stylish fallback badge
  return (
    <div
      className={`${sizeClasses[size]} rounded-md bg-slate-100 border border-slate-200 text-[#38003c] font-black flex items-center justify-center shrink-0 tracking-tighter ${className}`}
      title={clubName}
    >
      {abbr}
    </div>
  );
};
