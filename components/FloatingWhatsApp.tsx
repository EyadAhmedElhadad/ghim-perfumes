'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WhatsappIcon } from './icons';
import { WHATSAPP_NUMBER } from '@/lib/contact';

const DEFAULT_MESSAGE =
  'Hello GHIM.FRAGRANCES, I have a question about your fragrances.';

export default function FloatingWhatsApp() {
  const pathname = usePathname();

  // Hide inside the admin back-office.
  if (pathname?.startsWith('/admin')) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    DEFAULT_MESSAGE,
  )}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-[55] flex items-center gap-2 rounded-full border border-amber-400/30 bg-[#1a1f2c]/70 p-3 text-amber-400 shadow-[0_0_20px_rgba(234,179,8,0.15)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-amber-400/60 hover:shadow-[0_0_28px_rgba(234,179,8,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <WhatsappIcon className="h-6 w-6" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-amber-100 opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100">
        Chat with us
      </span>
    </Link>
  );
}
