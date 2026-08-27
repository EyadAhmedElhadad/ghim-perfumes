'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WhatsappIcon } from './icons';
import { WHATSAPP_NUMBER } from '@/lib/contact';

const DEFAULT_MESSAGE =
  'Hello GHIM Perfumes, I have a question about your fragrances.';

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
      className="group fixed bottom-5 right-5 z-[55] flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-4 text-white shadow-lg shadow-black/30 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <WhatsappIcon className="h-6 w-6" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100">
        Chat with us
      </span>
    </Link>
  );
}
