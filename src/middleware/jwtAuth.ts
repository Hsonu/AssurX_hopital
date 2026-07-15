import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.ts';

export interface PatientAuthRequest extends Request {
  patient?: JWTPayload;
}

export const requirePatientAuth = (
  req: PatientAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token || token === 'undefined' || token === 'null' || token === '') {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'Patient') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token role' });
    }
    req.patient = decoded;
    next();
  } catch (error: any) {
    console.error('JWT validation failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
