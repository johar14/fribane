import { ServiceBusClient } from '@azure/service-bus';
import { ClientSecretCredential } from '@azure/identity';
import User from '../models/User';
import TrafficEvent from '../models/TrafficEvent';
import { sendPushToUser } from './pushService';
import { isUserInWindow } from './calendarService';

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
  const tenantId = process.env.VD_AMQP_TENANT_ID;
  const clientId = process.env.VD_AMQP_CLIENT_ID;
  const clientSecret = process.env.VD_AMQP_CLIENT_SECRET;
  const fullyQualifiedNamespace = process.env.VD_AMQP_URL?.replace('amqps://', '');
  const entityPath = process.env.VD_AMQP_ENTITY;

  if (!tenantId || !clientId || !clientSecret || !fullyQualifiedNamespace || !entityPath) {
    console.warn('⚠️  VD AMQP credentials mangler – trafik-monitor ikke startet');
    return;
  }

  console.log('🚦 Trafik-monitor startet (VD Dataudveksler AMQP)');

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const sbClient = new ServiceBusClient(fullyQualifiedNamespace, credential);

  // entityPath er "topic/subscriptions/subscription-id"
  const [topicName, , subscriptionName] = entityPath.split('/');
  const receiver = sbClient.createReceiver(topicName, subscriptionName, {
    receiveMode: 'receiveAndDelete',
  });

  receiver.subscribe({
    async processMessage(message) {
      try {
        const body = message.body;
        const event: VDListItem = typeof body === 'string' ? JSON.parse(body) : body;
        if (ALERT_TYPES.includes(event.entityType)) {
          await checkAndNotify(event);
        }
      } catch (err) {
        console.error('VD besked kunne ikke parses:', err);
      }
    },
    async processError(err) {
      console.error('VD AMQP fejl:', err.error);
      // Service Bus klienten genopretter forbindelsen automatisk
    },
  });

  // Hold processen oppe og log status hvert 5. minut
  setInterval(() => {
    console.log('🚦 VD AMQP lytter aktiv');
  }, 5 * 60 * 1000);
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

  // Find alle brugere med aktive ruter og push-subscriptions
  const users = await User.find({
    'routes.active': true,
    'pushSubscriptions.0': { $exists: true },
  });

  for (const user of users) {
    if (dbEvent.notifiedUsers.includes(user._id.toString())) continue;

    for (const route of user.routes) {
      if (!route.active) continue;
      if (!routeIntersectsEvent(route.waypoints, event)) continue;

      const inWindow = await isUserInWindow(user, route);
      if (!inWindow) continue;

      const message = formatPushMessage(event);
      await sendPushToUser(user, message.title, message.body);

      dbEvent.notifiedUsers.push(user._id.toString());
      await dbEvent.save();
      break;
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
    FUTURE_ROADBLOCK: '🚧 Kommende vejspærring',
  };

  const label = typeLabels[event.entityType] || '⚠️ Trafikhændelse';

  return {
    title: 'fribane.io',
    body: `${label} på din rute – ${event.description || event.heading || 'Tjek trafikken inden du kører'}`,
  };
}
