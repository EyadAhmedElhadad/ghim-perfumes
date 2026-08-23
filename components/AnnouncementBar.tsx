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
    <div className="relative z-50 w-full gold-gradient py-1">
      <p className="font-label-caps text-label-caps tracking-widest uppercase">
        2 Perfumes = 15% Off + Free Shipping
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-secondary/70 transition-colors hover:text-on-secondary"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}