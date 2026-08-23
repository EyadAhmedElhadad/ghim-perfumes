import Link from 'next/link';
import PaymentIcons from './PaymentIcons';
import { InstagramIcon, TiktokIcon, WhatsappIcon } from './icons';

const EXPLORE = [
  { label: 'Shop All', href: '/products' },
  { label: 'For Her', href: '/products?cat=her' },
  { label: 'For Him', href: '/products?cat=him' },
  { label: 'About Us', href: '/#why' },
  { label: 'Admin Dashboard', href: '/admin' },
];

const SUPPORT = ['Shipping Policy', 'Refund & Return Policy', 'Contact'];

const SOCIALS = [InstagramIcon, TiktokIcon, WhatsappIcon];

export default function Footer() {
  return (
    <footer className="relative mt-auto w-full overflow-hidden border-t border-outline-variant/20 bg-surface-container-lowest">
      <div className="pointer-events-none absolute -bottom-24 -right-24 opacity-5">
        <span className="text-[300px] text-secondary">🌙</span>
      </div>

      <div className="grid grid-cols-1 gap-10 px-margin-mobile py-12 md:grid-cols-4 md:gap-gutter md:px-margin-desktop">
        <div className="flex flex-col gap-6">
          <h2 className="font-display-lg text-3xl italic tracking-wide gold-text">
            GHIM
          </h2>
          <p className="max-w-xs pr-4 font-body-md text-sm text-on-surface-variant">
            Minimalist elegance rooted in Middle Eastern heritage. Feel the
            clouds.
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
            <a
              key={s}
              href="#"
              className="font-body-md text-on-surface-variant transition-colors hover:text-secondary"
            >
              {s}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-6">
            <h4 className="mb-2 font-label-caps text-label-caps uppercase tracking-widest gold-text">
              Stay Connected
            </h4>
          <a
            href="mailto:hello@ghimperfumes.com"
            className="font-body-md text-on-surface-variant transition-colors hover:text-secondary"
          >
            hello@ghimperfumes.com
          </a>
          <div className="flex items-center gap-4">
            {SOCIALS.map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
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
          © {new Date().getFullYear()} GHIM Perfumes. All rights reserved.
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