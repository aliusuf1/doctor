/**
 * Build a wa.me deep link. No API — opens WhatsApp with a pre-filled message.
 * `number` is E.164 digits without "+".
 */
export function waMeLink(number: string | undefined, text: string): string | null {
  if (!number) return null;
  const digits = number.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
