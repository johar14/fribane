import { Router, Response } from 'express';
import User from '../models/User';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// Google Encoded Polyline decoder
function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

// Hent alle ruter
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    res.json(user?.routes || []);
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Tilføj rute – beregn via Google Directions API
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, fromAddress, toAddress, manualSchedule } = req.body;

    if (!name || !fromAddress || !toAddress) {
      res.status(400).json({ error: 'Navn, fra-adresse og til-adresse er påkrævet' });
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Google Maps API nøgle mangler i .env' });
      return;
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${encodeURIComponent(fromAddress)}` +
      `&destination=${encodeURIComponent(toAddress)}` +
      `&key=${apiKey}&language=da&region=dk`;

    const gRes = await fetch(url);
    const gData = await gRes.json() as {
      status: string;
      routes: Array<{ overview_polyline: { points: string } }>;
    };

    if (gData.status !== 'OK' || !gData.routes?.length) {
      console.error('[Directions API] status:', gData.status);
      res.status(400).json({ error: `Kunne ikke beregne rute (${gData.status}) – tjek adresserne eller API-nøglen` });
      return;
    }

    const waypoints = decodePolyline(gData.routes[0].overview_polyline.points);

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    user.routes.push({
      name,
      fromAddress,
      toAddress,
      waypoints,
      manualSchedule,
      active: true,
    });

    await user.save();
    res.json({ success: true, routes: user.routes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Opdater rute
router.put('/:routeId', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    const route = user.routes.find(r => r._id.toString() === req.params.routeId);
    if (!route) {
      res.status(404).json({ error: 'Rute ikke fundet' });
      return;
    }

    const { name, manualSchedule, active } = req.body;
    if (name) route.name = name;
    if (manualSchedule !== undefined) route.manualSchedule = manualSchedule;
    if (active !== undefined) route.active = active;

    await user.save();
    res.json({ success: true, route });
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Slet rute
router.delete('/:routeId', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    user.routes = user.routes.filter(r => r._id.toString() !== req.params.routeId);
    await user.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

export default router;
