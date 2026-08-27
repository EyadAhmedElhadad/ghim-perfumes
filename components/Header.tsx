'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useEffect, useRef, useState } from 'react';
import { useCart, selectCount } from '@/store/cart';
import {
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from './icons';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Shop All', href: '/products' },
  { label: 'For Her', href: '/products?cat=her' },
  { label: 'For Him', href: '/products?cat=him' },
  { label: 'About', href: '#why' },
];

// Shared, accessible link styling. Underline slides in on hover/focus/active
// and is disabled under prefers-reduced-motion via the `motion-reduce:` variant.
const LINK_BASE =
  'group relative font-body-md tracking-wide text-on-surface-variant transition-colors duration-200 ' +
  'hover:text-secondary ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1322] ' +
  'after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-secondary ' +
  'after:transition-transform after:duration-200 after:ease-out motion-reduce:after:transition-none ' +
  'hover:after:scale-x-100 focus-visible:after:scale-x-100';

function isActive(pathname: string, href: string): boolean {
  const path = href.split('?')[0];
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(path + '/');
}

function Header() {
  const pathname = usePathname();
  const count = useCart(selectCount);
  const openCart = useCart((s) => s.open);

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevOpen = useRef(false);

  const openSearch = () => {
    setSearchOpen(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(`/products?search=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Focus management + focus trap + Escape handling while the menu is open.
  useEffect(() => {
    if (!menuOpen) {
      // Return focus to the toggle when the menu closes (but not on first mount).
      if (prevOpen.current && toggleRef.current) toggleRef.current.focus();
      prevOpen.current = false;
      return;
    }
    prevOpen.current = true;

    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (e.key === 'Tab' && focusables.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <header
      className={`sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? 'py-1.5' : 'py-3'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-margin-mobile transition-all duration-300 md:px-margin-desktop">
        {/* Left zone — brand */}
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            aria-label="Ghim — home"
            className={`font-display-lg italic tracking-wide gold-text transition-all duration-300 ${
              scrolled ? 'text-2xl' : 'text-3xl'
            }`}
          >
            Ghim
          </Link>
        </div>

        {/* Center zone — primary navigation (tablet + desktop) */}
        <nav
          aria-label="Main navigation"
          className="hidden flex-1 justify-center gap-5 md:flex lg:gap-9"
        >
          {NAV.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`${LINK_BASE} ${active ? 'gold-text after:scale-x-100' : ''}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Right zone — actions */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {searchOpen ? (
            <form
              role="search"
              onSubmit={submitSearch}
              className="hidden items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 sm:flex"
            >
              <SearchIcon className="h-4 w-4 text-on-surface-variant" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false);
                }}
                placeholder="Search fragrances"
                aria-label="Search products"
                className="w-40 bg-transparent font-body-md text-sm text-on-background outline-none placeholder:text-on-surface-variant"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  className="text-on-surface-variant transition hover:text-secondary"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </form>
          ) : (
            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={openSearch}
              className="hidden scale-95 text-secondary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1322] sm:inline-flex"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          )}

          <Link
            href="/admin"
            aria-label="Account"
            className="hidden scale-95 text-secondary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1322] sm:inline-flex"
          >
            <UserIcon className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={count > 0 ? `Cart, ${count} items` : 'Cart'}
            className="relative scale-95 text-secondary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1322]"
          >
            <BagIcon className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-on-secondary">
                {count}
              </span>
            )}
          </button>

          {/* Hamburger — mobile only */}
          <button
            ref={toggleRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
            className="scale-95 text-secondary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1322] md:hidden"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>

    {/* Mobile slide-in menu — rendered as a sibling of <header> so it escapes
        the header's stacking context and overlays above all page content. */}
      <div
        className={`fixed inset-0 z-[9999] md:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          inert={!menuOpen}
          className={`absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col border-l border-outline-variant/40 bg-[#0a0e17] shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-5">
            <span className="font-display-lg text-2xl italic gold-text">Ghim</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="text-on-surface transition hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e17]"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav aria-label="Main navigation" className="flex flex-col gap-1.5 px-4 py-6">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-6 py-3.5 font-body-md text-lg font-medium text-on-surface transition-colors hover:bg-surface-container-high hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                    active ? 'text-secondary' : ''
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center gap-6 border-t border-outline-variant/20 px-6 py-5">
            <button
              type="button"
              aria-label="Search"
              onClick={() => {
                setMenuOpen(false);
                openSearch();
              }}
              className="text-secondary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            <Link
              href="/admin"
              aria-label="Account"
              onClick={() => setMenuOpen(false)}
              className="text-secondary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(Header);
