import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPatient extends Document {
  fullName: string;
  email: string;
  googleUid: string;
  profilePhoto?: string;
  provider: 'Google';
  role: 'Patient';
  createdAt: Date;
  lastLogin: Date;
}

const PatientSchema = new Schema<IPatient>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  googleUid: { type: String, required: true, unique: true, index: true },
  profilePhoto: { type: String },
  provider: { type: String, default: 'Google', enum: ['Google'] },
  role: { type: String, default: 'Patient', enum: ['Patient'] },
  lastLogin: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const PatientModel: Model<IPatient> = 
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default PatientModel;
