import { AmexIcon, ApplePayIcon, MastercardIcon, VisaIcon } from './icons';

const cards = [VisaIcon, MastercardIcon, AmexIcon, ApplePayIcon];

export default function PaymentIcons({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {cards.map((Icon, i) => (
        <Icon key={i} className="h-5 w-auto rounded-[4px] ring-1 ring-black/10" />
      ))}
    </div>
  );
}