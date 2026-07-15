import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── USER ─────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id: number;           // numeric surrogate for server.ts compatibility
  uid: string;          // Firebase Auth UID
  email: string;
  createdAt: Date;
  activeSession?: string; // Latest valid session ID for single-device enforcement
}

const userSchema = new Schema<IUser>({
  id: { type: Number, unique: true },  // auto-incremented surrogate ID
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  activeSession: { type: String, default: '' },
});

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);


// ─── ADMIN SESSION ────────────────────────────────────────────────────────────
// Singleton document — always _id: "admin" — stores the one active admin session

export interface IAdminSession {
  _id: string;
  activeSession: string;
  updatedAt: Date;
}

const adminSessionSchema = new Schema<IAdminSession>({
  _id: { type: String },
  activeSession: { type: String, required: true, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

export const AdminSessionModel =
  (mongoose.models.AdminSession as mongoose.Model<IAdminSession>) ||
  mongoose.model<IAdminSession>('AdminSession', adminSessionSchema);



// ─── BOOKING ──────────────────────────────────────────────────────────────────

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  id: number;                   // surrogate numeric ID
  bookingId: string;            // ASX-XXXXXX
  userId: number;               // references User.id
  patientId?: mongoose.Types.ObjectId; // references Patient (optional for pre-existing seed data)
  userEmail?: string;           // denormalized for admin view
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientRelationship: string;
  appointmentDate: string;
  appointmentTime: string;
  collectionType: string;
  street?: string;
  city?: string;
  pincode?: string;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  totalAmount: number;
  prescriptionName?: string;
  simulatedReportUrl?: string;
  items: string;    // JSON string of CartItem[]
  timestamp: string;
  doctor?: string;
  department?: string;
  bookingDate?: Date;
}

const bookingSchema = new Schema<IBooking>({
  id: { type: Number, unique: true },
  bookingId: { type: String, required: true, unique: true },
  userId: { type: Number, required: true },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  userEmail: { type: String },
  patientName: { type: String, required: true },
  patientAge: { type: Number, required: true },
  patientGender: { type: String, required: true },
  patientRelationship: { type: String, required: true },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  collectionType: { type: String, required: true },
  street: { type: String },
  city: { type: String },
  pincode: { type: String },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  bookingStatus: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  prescriptionName: { type: String },
  simulatedReportUrl: { type: String },
  items: { type: String, required: true },
  timestamp: { type: String, required: true },
  doctor: { type: String, default: '' },
  department: { type: String, default: '' },
  bookingDate: { type: Date, default: Date.now }
});

export const BookingModel: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);


// ─── PRESCRIPTION ─────────────────────────────────────────────────────────────

export interface IPrescription extends Document {
  _id: mongoose.Types.ObjectId;
  id: number;
  prescriptionId: string;       // PRX-XXXXXX
  userId?: number;
  patientName: string;
  patientPhone: string;
  fileName: string;
  doctorName?: string;
  dontKnowTests: boolean;
  extractedServiceIds?: string; // JSON string
  status: string;
  timestamp: string;
}

const prescriptionSchema = new Schema<IPrescription>({
  id: { type: Number, unique: true },
  prescriptionId: { type: String, required: true, unique: true },
  userId: { type: Number },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  fileName: { type: String, required: true },
  doctorName: { type: String },
  dontKnowTests: { type: Boolean, default: false },
  extractedServiceIds: { type: String },
  status: { type: String, required: true, default: 'pending_call' },
  timestamp: { type: String, required: true },
});

export const PrescriptionModel: Model<IPrescription> =
  mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', prescriptionSchema);


// ─── JOB APPLICATION ──────────────────────────────────────────────────────────

export interface IJobApplication extends Document {
  _id: mongoose.Types.ObjectId;
  id: number;
  applicationId: string;        // APP-XXXXXX
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  resumeLink?: string;
  notes?: string;
  status: string;
  timestamp: string;
}

const jobApplicationSchema = new Schema<IJobApplication>({
  id: { type: Number, unique: true },
  applicationId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  position: { type: String, required: true },
  experience: { type: String, required: true },
  resumeLink: { type: String },
  notes: { type: String },
  status: { type: String, required: true, default: 'applied' },
  timestamp: { type: String, required: true },
});

export const JobApplicationModel: Model<IJobApplication> =
  mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);


// ─── AUTO-INCREMENT COUNTER ───────────────────────────────────────────────────
// Provides numeric IDs compatible with existing server.ts integer expectations

interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel = (mongoose.models.Counter as mongoose.Model<ICounter>) || mongoose.model<ICounter>('Counter', counterSchema);

export async function getNextId(name: string): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, returnDocument: 'after' }
  );
  if (!counter) throw new Error(`Counter ${name} could not be updated.`);
  return counter.seq;
}

