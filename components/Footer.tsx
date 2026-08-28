'use client';

import Link from 'next/link';
import PaymentIcons from './PaymentIcons';
import { InstagramIcon, TiktokIcon, WhatsappIcon } from './icons';
import { usePublicContent } from './public-content';

const EXPLORE = [
  { label: 'Shop All', href: '/products' },
  { label: 'For Her', href: '/products?cat=her' },
  { label: 'For Him', href: '/products?cat=him' },
  { label: 'About Us', href: '/p/about' },
];

const SUPPORT = [
  { label: 'Shipping & Returns', href: '/p/shipping-returns' },
  { label: 'Privacy Policy', href: '/p/privacy' },
  { label: 'FAQ', href: '/p/faq' },
];

export default function Footer() {
  const { siteSettings: s } = usePublicContent();

  const brandName = s.brandName || 'GHIM.FRAGRANCES';
  const footerText =
    s.footerText ||
    'Minimalist elegance rooted in Middle Eastern heritage. Feel the clouds.';
  const copyright =
    s.copyrightText ||
    `© ${new Date().getFullYear()} GHIM.FRAGRANCES. All rights reserved.`;
  const instagram =
    s.instagramUrl || 'https://www.instagram.com/ghim.fragrances.eg/';
  const email = s.contactEmail || 'hello@ghimperfumes.com';

  const waDigits = (s.whatsappNumber || '').replace(/\D/g, '');
  const whatsappHref = waDigits ? `https://wa.me/${waDigits}` : '#';

  const SOCIALS = [
    {
      Icon: InstagramIcon,
      href: instagram,
      label: 'Instagram',
      external: true,
    },
    { Icon: TiktokIcon, href: '#', label: 'TikTok' },
    { Icon: WhatsappIcon, href: whatsappHref, label: 'WhatsApp', external: true },
  ];

  return (
    <footer className="relative mt-auto w-full overflow-hidden border-t border-outline-variant/20 bg-surface-container-lowest">
      <div className="pointer-events-none absolute -bottom-24 -right-24 opacity-5">
        <span className="text-[300px] text-secondary">🌙</span>
      </div>

      <div className="grid grid-cols-1 gap-10 px-margin-mobile py-12 md:grid-cols-4 md:gap-gutter md:px-margin-desktop">
        <div className="flex flex-col gap-6">
          <h2 className="font-display-lg text-3xl italic tracking-wide gold-text">
            {brandName.replace(/\.FRAGRANCES$/i, '') || 'GHIM'}
          </h2>
          <p className="max-w-xs pr-4 font-body-md text-sm text-on-surface-variant">
            {footerText}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="mb-2 font-label-caps text-label-caps uppercase tracking-widest gold-text">
            Explore
          </h4>
          {EXPLORE.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-body-md text-on-surface-variant transition-colors hover:text-secondary"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="mb-2 font-label-caps text-label-caps uppercase tracking-widest gold-text">
            Support
          </h4>
          {SUPPORT.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="font-body-md text-on-surface-variant transition-colors hover:text-secondary"
            >
              {s.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <h4 className="mb-2 font-label-caps text-label-caps uppercase tracking-widest gold-text">
            Stay Connected
          </h4>
          <a
            href={`mailto:${email}`}
            className="font-body-md text-on-surface-variant transition-colors hover:text-secondary"
          >
            {email}
          </a>
          <div className="flex items-center gap-4">
            {SOCIALS.map(({ Icon, href, label, external }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="text-on-surface-variant transition-colors hover:text-secondary"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <PaymentIcons className="mt-1" />
        </div>
      </div>

      <div className="col-span-1 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 px-margin-mobile py-8 md:flex-row md:px-margin-desktop">
        <p className="font-body-md text-sm text-on-surface-variant">
          {copyright}
        </p>
        <div className="flex items-center gap-2 text-secondary/30">
          <div className="h-[1px] w-12 bg-current" />
          <span className="text-xs">🌙</span>
          <div className="h-[1px] w-12 bg-current" />
        </div>
      </div>
    </footer>
  );
}
