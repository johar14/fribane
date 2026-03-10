import { Router, Request, Response } from 'express';

const router = Router();

// Eksponér Maps API key til frontend (bruges til Places Autocomplete)
router.get('/key', (_req: Request, res: Response): void => {
  res.json({ key: process.env.GOOGLE_MAPS_API_KEY || '' });
});

export default router;
