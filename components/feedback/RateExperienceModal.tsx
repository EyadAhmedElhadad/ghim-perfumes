'use client';

import { useEffect, useState } from 'react';

type Props = { orderId: string };

const QUICK_TAGS = [
  'Easy checkout',
  'Great selection',
  'Fast loading',
  'Beautiful packaging',
  'Great prices',
  'Helpful support',
];

const STARS = [1, 2, 3, 4, 5] as const;

export default function RateExperienceModal({ orderId }: Props) {
  const storageKey = `feedback_dismissed_${orderId}`;
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Show after a short, natural delay — unless already answered for this order.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(storageKey)) return;
    const t = window.setTimeout(() => setOpen(true), 2500);
    return () => window.clearTimeout(t);
  }, [storageKey]);

  function markDone() {
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore storage errors (private mode, etc.) */
    }
  }

  function dismiss() {
    markDone();
    setOpen(false);
  }

  function toggleTag(tag: string) {
    setTags((curr) =>
      curr.includes(tag) ? curr.filter((t) => t !== tag) : [...curr, tag],
    );
  }

  async function submit() {
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          rating,
          comment,
          tags,
          createdAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
      markDone();
      window.setTimeout(() => setOpen(false), 1600);
    } catch {
      // Non-blocking: never trap the user. Close either way.
      markDone();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rate your experience"
        className="relative w-full max-w-md rounded-2xl border border-amber-400/30 bg-[#0a0e17]/95 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-amber-300"
        >
          ✕
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <p className="text-4xl">💛</p>
            <h2 className="mt-3 font-headline-md text-xl text-amber-300">
              Thank you for your feedback!
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              We appreciate you helping us improve.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-headline-md text-2xl text-amber-300">
              Rate your experience
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Tell us how we did with your order.
            </p>

            <div
              className="mt-5 flex items-center justify-center gap-2"
              onMouseLeave={() => setHover(0)}
            >
              {STARS.map((star) => {
                const active = (hover || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    className="text-3xl leading-none transition-transform duration-150 hover:scale-110 focus:outline-none"
                  >
                    <span className={active ? 'text-amber-400' : 'text-slate-700'}>
                      ★
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      selected
                        ? 'border-amber-400/60 bg-amber-400/10 text-amber-200'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more (optional)..."
              rows={3}
              className="mt-4 w-full resize-none rounded-lg border border-slate-800 bg-[#161d2a] p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/50"
            />

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="text-sm text-slate-500 transition-colors hover:text-slate-300"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={rating < 1 || submitting}
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? 'Submitting…' : 'Submit Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
