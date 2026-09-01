import "server-only";
import { google } from "googleapis";
import { env, isConfigured } from "@/lib/env";

/**
 * Google Meet link generation via the Calendar API.
 *
 * Requires a Google Workspace service account with domain-wide delegation that
 * impersonates GOOGLE_IMPERSONATED_USER. When not configured every function
 * degrades to a no-op so bookings still succeed (the dashboard then prompts the
 * doctor to paste a link).
 */

function calendarClient() {
  if (!isConfigured.googleMeet) return null;
  let creds: { client_email: string; private_key: string };
  try {
    const json = Buffer.from(
      env.googleServiceAccountB64!,
      "base64",
    ).toString("utf8");
    creds = JSON.parse(json);
  } catch {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 is not valid base64 JSON");
    return null;
  }

  const jwt = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
    subject: env.googleImpersonatedUser,
  });
  return google.calendar({ version: "v3", auth: jwt });
}

export interface MeetEventInput {
  calendarId?: string;
  summary: string;
  description?: string;
  startIso: string;
  endIso: string;
  timezone: string;
  attendees: { email: string; displayName?: string }[];
}

export interface MeetEventResult {
  eventId: string | null;
  meetLink: string | null;
  configured: boolean;
}

export async function createMeetEvent(
  input: MeetEventInput,
): Promise<MeetEventResult> {
  const cal = calendarClient();
  if (!cal) return { eventId: null, meetLink: null, configured: false };

  try {
    const res = await cal.events.insert({
      calendarId: input.calendarId || env.googleCalendarId,
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startIso, timeZone: input.timezone },
        end: { dateTime: input.endIso, timeZone: input.timezone },
        attendees: input.attendees.map((a) => ({
          email: a.email,
          displayName: a.displayName,
        })),
        conferenceData: {
          createRequest: {
            requestId: `northline-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetLink =
      res.data.hangoutLink ??
      res.data.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video",
      )?.uri ??
      null;

    return {
      eventId: res.data.id ?? null,
      meetLink,
      configured: true,
    };
  } catch (e) {
    console.error("createMeetEvent failed:", (e as Error).message);
    return { eventId: null, meetLink: null, configured: true };
  }
}

export async function updateMeetEvent(
  eventId: string,
  patch: Partial<MeetEventInput>,
): Promise<void> {
  const cal = calendarClient();
  if (!cal) return;
  try {
    await cal.events.patch({
      calendarId: patch.calendarId || env.googleCalendarId,
      eventId,
      sendUpdates: "all",
      requestBody: {
        ...(patch.summary ? { summary: patch.summary } : {}),
        ...(patch.startIso && patch.timezone
          ? { start: { dateTime: patch.startIso, timeZone: patch.timezone } }
          : {}),
        ...(patch.endIso && patch.timezone
          ? { end: { dateTime: patch.endIso, timeZone: patch.timezone } }
          : {}),
        ...(patch.description ? { description: patch.description } : {}),
      },
    });
  } catch (e) {
    console.error("updateMeetEvent failed:", (e as Error).message);
  }
}

export async function deleteMeetEvent(
  eventId: string,
  calendarId?: string,
): Promise<void> {
  const cal = calendarClient();
  if (!cal) return;
  try {
    await cal.events.delete({
      calendarId: calendarId || env.googleCalendarId,
      eventId,
      sendUpdates: "all",
    });
  } catch (e) {
    console.error("deleteMeetEvent failed:", (e as Error).message);
  }
}
