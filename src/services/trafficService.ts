import User from '../models/User';
import TrafficEvent from '../models/TrafficEvent';
import { sendPushToUser } from './pushService';
import { isUserInWindow } from './calendarService';

const VD_BASE_URL = 'https://data.vd-nap.dk';
const POLL_INTERVAL = 60 * 1000; // 60 sekunder

// Hændelsestyper vi vil notificere om
const ALERT_TYPES = [
  'ACCIDENT',
  'ACCIDENT_BLOCKING',
  'ROADBLOCK',
  'FUTURE_ROADBLOCK',
];

interface VDListItem {
  tag: string;
  heading: string;
  description: string;
  entityType: string;
  bounds?: {
    southWest: { lat: number; lng: number };
    northEast: { lat: number; lng: number };
  };
  timestamp: string;
}

export async function startTrafficMonitor(): Promise<void> {
  console.log('🚦 Trafik-monitor startet');
  await pollTraffic();
  setInterval(pollTraffic, POLL_INTERVAL);
}

async function pollTraffic(): Promise<void> {
  try {
    const apiKey = process.env.VD_API_KEY;
    if (!apiKey || apiKey === 'din-vejdirektoratet-api-noegle') {
      // Brug mock data hvis ingen API nøgle
      await processMockTrafficData();
      return;
    }

    const url = `${VD_BASE_URL}/api/v2/list/snapshot?types=traffic&api_key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('VD API fejl:', response.status);
      return;
    }

    const events: VDListItem[] = await response.json() as VDListItem[];
    await processTrafficEvents(events);
  } catch (err) {
    console.error('Trafik poll fejl:', err);
  }
}

async function processTrafficEvents(events: VDListItem[]): Promise<void> {
  const relevantEvents = events.filter(e => ALERT_TYPES.includes(e.entityType));

  for (const event of relevantEvents) {
    await checkAndNotify(event);
  }
}

async function checkAndNotify(event: VDListItem): Promise<void> {
  // Find eller opret event i DB
  let dbEvent = await TrafficEvent.findOne({ tag: event.tag });

  if (!dbEvent) {
    dbEvent = new TrafficEvent({
      tag: event.tag,
      heading: event.heading,
      description: event.description,
      entityType: event.entityType,
      swLat: event.bounds?.southWest.lat,
      swLng: event.bounds?.southWest.lng,
      neLat: event.bounds?.northEast.lat,
      neLng: event.bounds?.northEast.lng,
      notifiedUsers: [],
    });
    await dbEvent.save();
  } else {
    dbEvent.lastSeen = new Date();
    await dbEvent.save();
  }

  if (!event.bounds) return;

  // Find alle brugere med ruter der overlapper med hændelsen
  const users = await User.find({
    'routes.active': true,
    'pushSubscriptions.0': { $exists: true },
  });

  for (const user of users) {
    // Spring over hvis allerede notificeret om denne hændelse
    if (dbEvent.notifiedUsers.includes(user._id.toString())) continue;

    for (const route of user.routes) {
      if (!route.active) continue;

      // Tjek om hændelsen er inden for rutens bounding box
      if (!boundsOverlap(
        { swLat: route.swLat, swLng: route.swLng, neLat: route.neLat, neLng: route.neLng },
        {
          swLat: event.bounds.southWest.lat,
          swLng: event.bounds.southWest.lng,
          neLat: event.bounds.northEast.lat,
          neLng: event.bounds.northEast.lng,
        }
      )) continue;

      // Tjek om brugeren er i sit kørevindue
      const inWindow = await isUserInWindow(user, route);
      if (!inWindow) continue;

      // Send push
      const message = formatPushMessage(event);
      await sendPushToUser(user, message.title, message.body);

      // Marker som notificeret
      dbEvent.notifiedUsers.push(user._id.toString());
      await dbEvent.save();
      break; // Kun én notifikation per hændelse per bruger
    }
  }
}

function boundsOverlap(
  a: { swLat: number; swLng: number; neLat: number; neLng: number },
  b: { swLat: number; swLng: number; neLat: number; neLng: number }
): boolean {
  return !(
    a.neLat < b.swLat ||
    a.swLat > b.neLat ||
    a.neLng < b.swLng ||
    a.swLng > b.neLng
  );
}

function formatPushMessage(event: VDListItem): { title: string; body: string } {
  const typeLabels: Record<string, string> = {
    ACCIDENT: '🚨 Uheld',
    ACCIDENT_BLOCKING: '🚨 Uheld – vej spærret',
    ROADBLOCK: '🚧 Vejspærring',
  };

  const label = typeLabels[event.entityType] || '⚠️ Trafikhændelse';

  return {
    title: `${label} på din rute`,
    body: event.description || event.heading || 'Tjek trafikken inden du kører',
  };
}

// Mock data til test uden API nøgle
async function processMockTrafficData(): Promise<void> {
  // Simuler et uheld på E45 ved Skanderborg for test
  const mockEvent: VDListItem = {
    tag: `mock-${Date.now()}`,
    heading: 'Uheld på E45',
    description: 'Uheld på E45 Østjyske Motorvej nordgående. Forventet forsinkelse 25 min.',
    entityType: 'ACCIDENT',
    bounds: {
      southWest: { lat: 56.01, lng: 9.90 },
      northEast: { lat: 56.10, lng: 10.05 },
    },
    timestamp: new Date().toISOString(),
  };

  console.log('🔧 Bruger mock trafik-data (ingen API nøgle sat)');
  // Kommenter næste linje ud for at undgå konstante test-notifikationer
  // await checkAndNotify(mockEvent);
}
