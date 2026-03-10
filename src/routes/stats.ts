import { Router, Request, Response } from 'express';
import User from '../models/User';
import Config from '../models/Config';

const router = Router();

const INITIAL_SLOTS = 137;
const DECREMENT_AMOUNT = 2;
const DECREMENT_DAYS = 3;

// Offentlig endpoint til landing page countdown
router.get('/slots', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Hent eller opret config-dokument
    let config = await Config.findOne({ key: 'betaSlotsRemaining' });
    if (!config) {
      config = new Config({
        key: 'betaSlotsRemaining',
        value: INITIAL_SLOTS,
        lastDecrement: new Date(),
      });
      await config.save();
    }

    // Auto-decrement: træk 2 fra hver 3. dag
    const now = new Date();
    const daysSince = (now.getTime() - config.lastDecrement.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince >= DECREMENT_DAYS && config.value > DECREMENT_AMOUNT) {
      config.value = Math.max(0, config.value - DECREMENT_AMOUNT);
      config.lastDecrement = now;
      await config.save();
    }

    const used = await User.countDocuments();
    const remaining = config.value;

    // Bar viser scarcity – sættes til mindst 88% fuld
    const rawPercent = used + remaining > 0
      ? Math.round((used / (used + remaining)) * 100)
      : 0;
    const percentFull = Math.min(95, Math.max(88, rawPercent));

    res.json({ used, remaining, percentFull });
  } catch {
    res.status(500).json({ error: 'Serverfejl' });
  }
});

export default router;
