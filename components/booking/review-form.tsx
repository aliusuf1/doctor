"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";

export function ReviewForm({
  appointmentId,
  token,
  doctorName,
}: {
  appointmentId: string;
  token: string;
  doctorName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (state === "done") {
    return (
      <div className="card p-5 text-sm text-ok">
        Thank you — your feedback helps other patients choose care.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    setState("saving");
    setError(null);
    try {
      const res = await fetch(
        `/api/bookings/${appointmentId}/review?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not save");
    }
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <h2 className="font-serif text-lg">How was your consultation?</h2>
      <p className="prose-body mt-1 text-sm">
        Share a short, honest review of your visit with {doctorName}.
      </p>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              size={26}
              className={
                (hover || rating) >= n ? "fill-tan text-tan" : "text-line-strong"
              }
            />
          </button>
        ))}
      </div>

      <textarea
        className="field mt-3"
        rows={3}
        placeholder="What went well? Anything that could be better? (optional)"
        value={comment}
        maxLength={800}
        onChange={(e) => setComment(e.target.value)}
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={state === "saving"}
        className="btn btn-primary mt-3"
      >
        {state === "saving" && <Loader2 size={16} className="animate-spin" />}
        Submit review
      </button>
    </form>
  );
}
