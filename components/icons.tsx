import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-3.5 3.6-6 8-6s8 2.5 8 6" />
  </svg>
);

export const BagIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 8h12l1 13H5z" />
    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export const ChevronDownIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronLeftIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M12 2.5 15 9l6.5.6-4.9 4.3 1.4 6.6L12 17.3 6 20.5l1.4-6.6L2.5 9.6 9 9z" />
  </svg>
);

export const SparkleIcon = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M12 2c.6 4.8 3.2 7.4 8 8-4.8.6-7.4 3.2-8 8-.6-4.8-3.2-7.4-8-8 4.8-.6 7.4-3.2 8-8z" />
  </svg>
);

export const TruckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2 6h12v11H2zM14 9h4l3 3v5h-7z" />
    <circle cx="6" cy="19" r="1.8" />
    <circle cx="18" cy="19" r="1.8" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const GiftIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 10h18v11H3zM3 6h18v4H3z" />
    <path d="M12 6v15M12 6s-1-4-4-4-2 4 2 4M12 6s1-4 4-4 2 4-2 4" />
  </svg>
);

export const InstagramIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const WhatsappIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.6 6.6 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.5c.1-.1.2-.3.3-.5s0-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.5 4 5.2 5.2 0 0 0 3.2 1 2.9 2.9 0 0 0 2-.9 1.6 1.6 0 0 0 .4-.9c0-.3 0-.6-.1-.8z" />
  </svg>
);

export const TiktokIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M16.6 3c.4 2.1 1.8 3.7 4 4v3.1c-1.5 0-2.9-.5-4-1.3v6.4a5.8 5.8 0 1 1-5.8-5.8c.3 0 .7 0 1 .1v3.1a2.7 2.7 0 1 0 1.8 2.6V3z" />
  </svg>
);

export const VisaIcon = (p: P) => (
  <svg viewBox="0 0 48 32" {...p}>
    <rect width="48" height="32" rx="5" fill="#1a1f71" />
    <text x="24" y="22" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontStyle="italic" fontFamily="Arial, sans-serif">
      VISA
    </text>
  </svg>
);

export const MastercardIcon = (p: P) => (
  <svg viewBox="0 0 48 32" {...p}>
    <rect width="48" height="32" rx="5" fill="#fff" />
    <circle cx="20" cy="16" r="9" fill="#eb001b" />
    <circle cx="29" cy="16" r="9" fill="#f79e1b" opacity="0.85" />
  </svg>
);

export const AmexIcon = (p: P) => (
  <svg viewBox="0 0 48 32" {...p}>
    <rect width="48" height="32" rx="5" fill="#2e77bc" />
    <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif">
      AMEX
    </text>
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const TagIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const BottleIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10 2h4v3l1 2v2H9l1-2z" />
    <path d="M9 9h6v11a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1z" />
    <path d="M10 14h4" />
  </svg>
);

export const ApplePayIcon = (p: P) => (
  <svg viewBox="0 0 48 32" {...p}>
    <rect width="48" height="32" rx="5" fill="#000" />
    <path
      fill="#fff"
      transform="scale(0.09) translate(12 14)"
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
    />
  </svg>
);