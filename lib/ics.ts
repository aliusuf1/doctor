import { site } from "@/lib/site";

function fmt(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export interface IcsEvent {
  uid: string;
  start: string; // ISO
  end: string; // ISO
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  organizerName?: string;
  status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  sequence?: number;
}

/** A single VEVENT wrapped in a VCALENDAR — for add-to-calendar downloads. */
export function buildIcs(ev: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//booking//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(ev.start)}`,
    `DTEND:${fmt(ev.end)}`,
    `SEQUENCE:${ev.sequence ?? 0}`,
    `STATUS:${ev.status ?? "CONFIRMED"}`,
    `SUMMARY:${esc(ev.summary)}`,
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : "",
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    ev.url ? `URL:${ev.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

/** A full calendar feed of many events — for iCal subscription. */
export function buildIcsFeed(name: string, events: IcsEvent[]): string {
  const head = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//schedule//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`,
    "X-PUBLISHED-TTL:PT1H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];
  const body = events.flatMap((ev) => [
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(ev.start)}`,
    `DTEND:${fmt(ev.end)}`,
    `SEQUENCE:${ev.sequence ?? 0}`,
    `STATUS:${ev.status ?? "CONFIRMED"}`,
    `SUMMARY:${esc(ev.summary)}`,
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : "",
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    ev.url ? `URL:${ev.url}` : "",
    "END:VEVENT",
  ]);
  return [...head, ...body, "END:VCALENDAR"].join("\r\n");
}
