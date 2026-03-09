import { Router, Response } from 'express';
import User from '../models/User';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// Hent alle ruter
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    res.json(user?.routes || []);
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

// Tilføj rute
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, swLat, swLng, neLat, neLng, manualSchedule } = req.body;

    if (!name || swLat === undefined || swLng === undefined || neLat === undefined || neLng === undefined) {
      res.status(400).json({ error: 'Navn og koordinater er påkrævet' });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    user.routes.push({
      _id: new Date().getTime().toString(),
      name,
      swLat: parseFloat(swLat),
      swLng: parseFloat(swLng),
      neLat: parseFloat(neLat),
      neLng: parseFloat(neLng),
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
