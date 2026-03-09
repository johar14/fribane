import { google } from 'googleapis';
import { UserDocument } from '../models/User';
import { IRoute } from '../types';

const COMMUTE_KEYWORDS = [
  'kør', 'hjem', 'arbejde', 'kontor', 'møde', 'office',
  'commute', 'drive', 'home', 'work'
];

// Tjek om brugeren er i sit kørevindue lige nu
export async function isUserInWindow(user: UserDocument, route: IRoute): Promise<boolean> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=søndag, 1=mandag...

  // Hvis kalender er tilsluttet, brug kalender-logik
  if (user.calendarConnected && user.googleRefreshToken) {
    return await isInCalendarWindow(user, now);
  }

  // Ellers brug manuel tidsplan
  if (route.manualSchedule) {
    return isInManualWindow(route, now, dayOfWeek);
  }

  // Ingen tidsplan sat – notificer altid
  return true;
}

function isInManualWindow(route: IRoute, now: Date, dayOfWeek: number): boolean {
  const schedule = route.manualSchedule!;

  // Tjek om det er en aktiv dag
  if (schedule.activeDays && !schedule.activeDays.includes(dayOfWeek)) {
    return false;
  }

  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Morgenvindue
  if (schedule.morningFrom && schedule.morningTo) {
    if (currentTime >= schedule.morningFrom && currentTime <= schedule.morningTo) {
      return true;
    }
  }

  // Eftermiddagsvindue
  if (schedule.afternoonFrom && schedule.afternoonTo) {
    if (currentTime >= schedule.afternoonFrom && currentTime <= schedule.afternoonTo) {
      return true;
    }
  }

  return false;
}

async function isInCalendarWindow(user: UserDocument, now: Date): Promise<boolean> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BASE_URL}/auth/google/callback`
    );

    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Hent begivenheder de næste 2 timer
    const timeMin = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 120 * 60 * 1000).toISOString();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Find begivenheder der slutter snart (inden for 90 min)
    for (const event of events) {
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
      if (!endTime) continue;

      const minutesUntilEnd = (endTime.getTime() - now.getTime()) / 60000;

      // Begivenhed slutter inden for 0-90 minutter = brugeren kører snart hjem
      if (minutesUntilEnd >= -15 && minutesUntilEnd <= 90) {
        return true;
      }

      // Tjek om begivenheden handler om pendling
      const title = (event.summary || '').toLowerCase();
      if (COMMUTE_KEYWORDS.some(kw => title.includes(kw))) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Google Calendar fejl:', err);
    // Fallback: notificer alligevel ved fejl
    return true;
  }
}

export function getGoogleAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/auth/google/callback`
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/auth/google/callback`
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    email: userInfo.data.email!,
    name: userInfo.data.name!,
  };
}
