import { Request, Response } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import PatientModel from '../models/Patient.ts';
import { generateToken } from '../utils/jwt.ts';

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Missing ID token' });
    }

    // Verify token using Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google profile' });
    }

    // Check if patient exists
    let patient = await PatientModel.findOne({ googleUid: uid });

    if (!patient) {
      // Check by email as fallback or secondary match
      patient = await PatientModel.findOne({ email });
    }

    if (!patient) {
      // Create new patient
      patient = new PatientModel({
        fullName: name || 'Google User',
        email: email,
        googleUid: uid,
        profilePhoto: picture || '',
        provider: 'Google',
        role: 'Patient',
        lastLogin: new Date(),
      });
      await patient.save();
    } else {
      // Update last login & optionally update info if changed
      patient.lastLogin = new Date();
      if (name && patient.fullName !== name) patient.fullName = name;
      if (picture && patient.profilePhoto !== picture) patient.profilePhoto = picture;
      // Update googleUid if matched by email earlier
      if (!patient.googleUid) patient.googleUid = uid;
      await patient.save();
    }

    // Generate custom JWT
    const jwtToken = generateToken({
      patientId: String(patient._id),
      email: patient.email,
      googleUid: patient.googleUid,
      role: 'Patient',
    });

    res.json({
      jwtToken,
      patient: {
        id: String(patient._id),
        fullName: patient.fullName,
        email: patient.email,
        profilePhoto: patient.profilePhoto,
        role: patient.role,
        createdAt: patient.createdAt,
        lastLogin: patient.lastLogin,
      },
    });
  } catch (error: any) {
    console.error('Error during Google verification & auth:', error);
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
