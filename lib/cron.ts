import { env } from "@/lib/env";

/** True when the request carries the configured cron secret. */
export function isAuthorizedCron(req: Request): boolean {
  if (!env.cronSecret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${env.cronSecret}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === env.cronSecret;
}
