'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const STARS = [1, 2, 3, 4, 5] as const;

type Context = {
  orderId: string;
  customerName: string;
  reviewed: boolean;
};

export default function RatePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [ctx, setCtx] = useState<Context | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/feedback/rate?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load this review link.');
        setCtx(data as Context);
        if ((data as Context).reviewed) setDone(true);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not load this review link.');
      }
    })();
  }, [token]);

  async function submit() {
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating,
          comment,
          customerName: ctx?.customerName ?? '',
          tags: [],
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setDone(true);
    } catch {
      setLoadError('Something went wrong submitting your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0e17] px-4 py-12 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-amber-400/30 bg-[#0a0e17]/95 p-7 shadow-2xl backdrop-blur-xl">
        <p className="text-center text-4xl">🌙</p>
        <h1 className="mt-3 text-center font-serif text-3xl text-amber-300">
          How was your experience?
        </h1>

        {loadError ? (
          <p className="mt-6 text-center text-sm text-slate-400">{loadError}</p>
        ) : !ctx ? (
          <p className="mt-6 text-center text-sm text-slate-400">Loading…</p>
        ) : done ? (
          <div className="py-6 text-center">
            <p className="text-4xl">💛</p>
            <h2 className="mt-3 font-headline-md text-xl text-amber-300">
              Thank you for your feedback!
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              We truly appreciate you helping us craft better fragrances.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-slate-400">
              {ctx.customerName
                ? `Hi ${ctx.customerName}, tell us about your GHIM order.`
                : 'Tell us about your GHIM order.'}
            </p>

            <div
              className="mt-6 flex items-center justify-center gap-2"
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
                    className="text-4xl leading-none transition-transform duration-150 hover:scale-110 focus:outline-none"
                  >
                    <span className={active ? 'text-amber-400' : 'text-slate-700'}>
                      ★
                    </span>
                  </button>
                );
              })}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more (optional)…"
              rows={4}
              className="mt-6 w-full resize-none rounded-lg border border-slate-800 bg-[#161d2a] p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/50"
            />

            <button
              type="button"
              onClick={() => void submit()}
              disabled={rating < 1 || submitting}
              className="mt-5 w-full rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
