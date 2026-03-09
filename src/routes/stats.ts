import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

// Offentlig endpoint til landing page countdown
router.get('/slots', async (_req: Request, res: Response): Promise<void> => {
  try {
    const maxFree = parseInt(process.env.MAX_FREE_SLOTS || '1000');
    const used = await User.countDocuments({ freeSlot: true });
    const remaining = Math.max(0, maxFree - used);

    res.json({
      total: maxFree,
      used,
      remaining,
      percentFull: Math.round((used / maxFree) * 100),
    });
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

export default router;
