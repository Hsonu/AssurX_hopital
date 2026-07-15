import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'assurx_jwt_secret_2026';

export interface JWTPayload {
  patientId: string;
  email: string;
  googleUid: string;
  role: 'Patient';
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
