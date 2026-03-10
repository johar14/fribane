import User from '../models/User';
import TrafficEvent from '../models/TrafficEvent';
import { sendPushToUser } from './pushService';
import { isUserInWindow } from './calendarService';

// TODO: VD's Dataudveksler bruger AMQP event subscription (ikke REST polling).
// Næste skridt: implementer AMQP-klient der abonnerer på trafikhændelser fra
// businessservice.dataudveksler.app.vd.dk og kalder checkAndNotify() ved nye events.

const POLL_INTERVAL = 60 * 1000; // 60 sekunder (mock fallback)

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
  await processMockTrafficData();
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

      // Tjek om hændelsen er inden for 500m af ruten
      if (!routeIntersectsEvent(route.waypoints, event)) continue;

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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function routeIntersectsEvent(
  waypoints: Array<{ lat: number; lng: number }>,
  event: VDListItem
): boolean {
  if (!event.bounds || !waypoints?.length) return false;
  const centerLat = (event.bounds.southWest.lat + event.bounds.northEast.lat) / 2;
  const centerLng = (event.bounds.southWest.lng + event.bounds.northEast.lng) / 2;
  return waypoints.some(wp => haversineKm(wp.lat, wp.lng, centerLat, centerLng) < 0.5);
}

function formatPushMessage(event: VDListItem): { title: string; body: string } {
  const typeLabels: Record<string, string> = {
    ACCIDENT: '🚨 Uheld',
    ACCIDENT_BLOCKING: '🚨 Uheld – vej spærret',
    ROADBLOCK: '🚧 Vejspærring',
  };

  const label = typeLabels[event.entityType] || '⚠️ Trafikhændelse';

  return {
    title: 'fribane.io',
    body: `${label} på din rute – ${event.description || event.heading || 'Tjek trafikken inden du kører'}`,
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
