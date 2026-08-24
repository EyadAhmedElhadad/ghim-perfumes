'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CloseIcon } from './icons';

const KEY = 'ghim-announcement-dismissed';

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="relative z-50 w-full overflow-hidden gold-gradient py-1">
      <div className="marquee-track inline-flex w-max whitespace-nowrap">
        <span className="shrink-0 px-4 font-label-caps text-label-caps tracking-widest uppercase">
          2 Perfumes = 15% Off + Free Shipping
        </span>
        <span
          className="shrink-0 px-4 font-label-caps text-label-caps tracking-widest uppercase"
          aria-hidden="true"
        >
          2 Perfumes = 15% Off + Free Shipping
        </span>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-on-secondary/70 transition-colors hover:text-on-secondary"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}