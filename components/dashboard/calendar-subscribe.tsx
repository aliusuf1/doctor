"use client";

import { useState } from "react";
import { Check, Copy, CalendarPlus } from "lucide-react";

export function CalendarSubscribe({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <CalendarPlus size={15} /> Subscribe in your calendar app
      </h2>
      <p className="mt-1 text-xs text-ink-faint">
        Add this URL as a subscribed calendar in Google Calendar, Apple Calendar
        or Outlook. It stays in sync — new bookings appear automatically.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="field py-1.5 text-xs"
        />
        <button
          onClick={copy}
          className="btn btn-outline shrink-0 px-3 py-1.5 text-xs"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Keep this link private — anyone with it can see your appointment list.
      </p>
    </div>
  );
}
