import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const ADMIN_EMAIL = 'jonas.harlev@gmail.com';

export const adminAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.redirect('/pages/landing.html');
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (payload.email !== ADMIN_EMAIL) {
      res.redirect('/pages/landing.html');
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.redirect('/pages/landing.html');
  }
};

export const adminApiAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Ikke autoriseret' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (payload.email !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Adgang nægtet' });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Ugyldig token' });
  }
};
