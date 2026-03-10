import { google } from 'googleapis';
import User from '../models/User';
import { sendPushToUser } from './pushService';

function getOAuthClient(refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const oauth2Client = new google.auth.OAuth2(
    isProd ? process.env.GOOGLE_CLIENT_ID_PROD : process.env.GOOGLE_CLIENT_ID,
    isProd ? process.env.GOOGLE_CLIENT_SECRET_PROD : process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/auth/google/callback`
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

// Løs match: tjek om event-lokation nævner keywords fra rutens toAddress
function locationMatchesRoute(eventLocation: string, routeAddress: string): boolean {
  const norm = (s: string) => s.toLowerCase().trim();
  const evLoc = norm(eventLocation);
  const routeParts = routeAddress.split(',').map(norm).filter(p => p.length > 3);
  return routeParts.some(part => evLoc.includes(part));
}

async function estimateTravelMinutes(origin: string, destination: string): Promise<number> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return 30;
    const url = `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&key=${apiKey}&language=da&region=dk`;
    const res = await fetch(url);
    const data = await res.json() as { routes?: Array<{ legs?: Array<{ duration?: { value: number } }> }> };
    const secs = data.routes?.[0]?.legs?.[0]?.duration?.value;
    if (secs) return Math.ceil(secs / 60);
  } catch (err) {
    console.error('Smart Kalender: Directions API fejl:', err);
  }
  return 30; // fallback
}

export async function checkCalendarForDeparture(userId: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user?.googleRefreshToken || !user.calendarConnected) return;

  const calRoutes = user.routes.filter(r => r.active && r.scheduleMode === 'calendar');
  if (!calRoutes.length) return;

  try {
    const auth = getOAuthClient(user.googleRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (response.data.items || []).filter(
      e => e.location && e.start?.dateTime
    );

    if (!events.length) return;

    for (const route of calRoutes) {
      for (const event of events) {
        const location = event.location!;

        if (!locationMatchesRoute(location, route.toAddress)) continue;

        const eventStart = new Date(event.start!.dateTime!);
        const origin = user.homeAddress || route.fromAddress;
        const travelMins = await estimateTravelMinutes(origin, location);
        const departureTime = new Date(eventStart.getTime() - (travelMins + 15) * 60_000);

        if (departureTime <= now) continue;

        const msUntil = departureTime.getTime() - now.getTime();
        const fmt = (d: Date) =>
          `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

        const eventTimeStr = fmt(eventStart);
        const departureStr = fmt(departureTime);

        setTimeout(async () => {
          try {
            await sendPushToUser(
              user,
              'fribane.io',
              `Du har ${event.summary || 'et møde'} kl. ${eventTimeStr} på ${location}. Sæt afsted senest kl. ${departureStr}.`
            );
          } catch (err) {
            console.error('Smart Kalender: push fejl:', err);
          }
        }, msUntil);

        console.log(`⏰ Smart Kalender: ${user.email} → afgang kl. ${departureStr} (${route.name})`);
        break; // Én notifikation per rute per dag
      }
    }
  } catch (err) {
    console.error(`Smart Kalender: fejl for ${user.email}:`, err);
  }
}

function scheduleDaily(hour: number, minute: number, fn: () => Promise<void>): void {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const msUntilFirst = next.getTime() - now.getTime();

  setTimeout(() => {
    fn();
    setInterval(fn, 24 * 60 * 60 * 1000);
  }, msUntilFirst);
}

export function startCalendarScheduler(): void {
  scheduleDaily(6, 0, async () => {
    console.log('📅 Smart Kalender: Tjekker kalender-ruter...');
    try {
      const users = await User.find({
        calendarConnected: true,
        googleRefreshToken: { $exists: true },
        routes: { $elemMatch: { active: true, scheduleMode: 'calendar' } },
      });
      for (const user of users) {
        await checkCalendarForDeparture(user._id.toString());
      }
      console.log(`📅 Smart Kalender: ${users.length} bruger(e) tjekket`);
    } catch (err) {
      console.error('Smart Kalender scheduler fejl:', err);
    }
  });
  console.log('📅 Smart Kalender scheduler startet (kører dagligt kl. 06:00)');
}
