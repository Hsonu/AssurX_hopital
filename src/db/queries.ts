import { connectDB } from './index.ts';
import {
  UserModel,
  BookingModel,
  PrescriptionModel,
  JobApplicationModel,
  getNextId,
} from './schema.ts';

// Ensure DB is connected before any query
async function ensureConnected() {
  await connectDB();
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export async function createBooking(data: {
  bookingId: string;
  userId: number;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientRelationship: string;
  appointmentDate: string;
  appointmentTime: string;
  collectionType: string;
  street?: string | null;
  city?: string | null;
  pincode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  totalAmount: number;
  prescriptionName?: string | null;
  simulatedReportUrl?: string | null;
  items: string;
  timestamp: string;
}) {
  await ensureConnected();
  try {
    const id = await getNextId('booking');
    const booking = new BookingModel({ ...data, id });
    await booking.save();
    return mongoDocToPlain(booking);
  } catch (error) {
    console.error('Failed to create booking:', error);
    throw new Error('Failed to save booking to database.', { cause: error });
  }
}

export async function getUserBookings(uid: string) {
  await ensureConnected();
  try {
    // Find the user first, then get their bookings
    const user = await UserModel.findOne({ uid });
    if (!user) return [];
    const bookings = await BookingModel.find({ userId: user.id }).sort({ id: -1 });
    return bookings.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch user bookings:', error);
    throw new Error('Failed to retrieve bookings from database.', { cause: error });
  }
}

export async function getBookingByBookingId(bookingId: string) {
  await ensureConnected();
  try {
    const booking = await BookingModel.findOne({ bookingId });
    if (!booking) return undefined;
    return mongoDocToPlain(booking);
  } catch (error) {
    console.error(`Failed to fetch booking by bookingId ${bookingId}:`, error);
    throw new Error('Failed to retrieve booking by ID from database.', { cause: error });
  }
}

export async function getAllBookings() {
  await ensureConnected();
  try {
    const bookings = await BookingModel.find().sort({ id: -1 });

    // Enrich with userEmail by looking up users
    const userIds = [...new Set(bookings.map((b) => b.userId))];
    const users = await UserModel.find({ id: { $in: userIds } });
    const userMap = new Map(users.map((u) => [u.id, u.email]));

    return bookings.map((b) => ({
      ...mongoDocToPlain(b),
      userEmail: userMap.get(b.userId) || '',
    }));
  } catch (error) {
    console.error('Failed to fetch all bookings:', error);
    throw new Error('Failed to retrieve all bookings from database.', { cause: error });
  }
}

export async function updateBooking(id: number, data: Record<string, unknown>) {
  await ensureConnected();
  try {
    const booking = await BookingModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!booking) throw new Error(`Booking with id ${id} not found`);
    return mongoDocToPlain(booking);
  } catch (error) {
    console.error(`Failed to update booking ${id}:`, error);
    throw new Error('Failed to update booking in database.', { cause: error });
  }
}

export async function deleteBooking(id: number) {
  await ensureConnected();
  try {
    const booking = await BookingModel.findOneAndDelete({ id });
    if (!booking) return null;
    return mongoDocToPlain(booking);
  } catch (error) {
    console.error(`Failed to delete booking ${id}:`, error);
    throw new Error('Failed to delete booking from database.', { cause: error });
  }
}


// ─── PRESCRIPTIONS ────────────────────────────────────────────────────────────

export async function createPrescription(data: {
  prescriptionId: string;
  userId?: number | null;
  patientName: string;
  patientPhone: string;
  fileName: string;
  doctorName?: string | null;
  dontKnowTests: boolean;
  extractedServiceIds?: string | null;
  status: string;
  timestamp: string;
}) {
  await ensureConnected();
  try {
    const id = await getNextId('prescription');
    const prescription = new PrescriptionModel({ ...data, id });
    await prescription.save();
    return mongoDocToPlain(prescription);
  } catch (error) {
    console.error('Failed to create prescription lead:', error);
    throw new Error('Failed to save prescription to database.', { cause: error });
  }
}

export async function getAllPrescriptions() {
  await ensureConnected();
  try {
    const prescriptions = await PrescriptionModel.find().sort({ id: -1 });
    return prescriptions.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch all prescriptions:', error);
    throw new Error('Failed to retrieve prescriptions from database.', { cause: error });
  }
}

export async function updatePrescription(id: number, data: Record<string, unknown>) {
  await ensureConnected();
  try {
    const prescription = await PrescriptionModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!prescription) throw new Error(`Prescription with id ${id} not found`);
    return mongoDocToPlain(prescription);
  } catch (error) {
    console.error(`Failed to update prescription ${id}:`, error);
    throw new Error('Failed to update prescription in database.', { cause: error });
  }
}

export async function deletePrescription(id: number) {
  await ensureConnected();
  try {
    const prescription = await PrescriptionModel.findOneAndDelete({ id });
    if (!prescription) return null;
    return mongoDocToPlain(prescription);
  } catch (error) {
    console.error(`Failed to delete prescription ${id}:`, error);
    throw new Error('Failed to delete prescription from database.', { cause: error });
  }
}


// ─── CLEAR ALL DATA ───────────────────────────────────────────────────────────

export async function clearAllData() {
  await ensureConnected();
  try {
    await BookingModel.deleteMany({});
    await PrescriptionModel.deleteMany({});
    await JobApplicationModel.deleteMany({});
    return { success: true };
  } catch (error) {
    console.error('Failed to clear database tables:', error);
    throw new Error('Failed to clear database tables.', { cause: error });
  }
}


// ─── JOB APPLICATIONS ─────────────────────────────────────────────────────────

export async function createJobApplication(data: {
  applicationId: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  resumeLink?: string;
  notes?: string;
}) {
  await ensureConnected();
  try {
    const id = await getNextId('jobApplication');
    const application = new JobApplicationModel({
      ...data,
      id,
      status: 'applied',
      timestamp: new Date().toISOString(),
    });
    await application.save();
    return mongoDocToPlain(application);
  } catch (error) {
    console.error('Failed to create job application:', error);
    throw new Error('Failed to insert job application into database.', { cause: error });
  }
}

export async function getAllJobApplications() {
  await ensureConnected();
  try {
    const applications = await JobApplicationModel.find().sort({ id: -1 });
    return applications.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch all job applications:', error);
    throw new Error('Failed to retrieve job applications from database.', { cause: error });
  }
}

export async function updateJobApplicationStatus(id: number, status: string) {
  await ensureConnected();
  try {
    const application = await JobApplicationModel.findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: 'after' }
    );
    if (!application) throw new Error(`Job application with id ${id} not found`);
    return mongoDocToPlain(application);
  } catch (error) {
    console.error(`Failed to update job application ${id} status:`, error);
    throw new Error('Failed to update job application status in database.', { cause: error });
  }
}

export async function deleteJobApplication(id: number) {
  await ensureConnected();
  try {
    const application = await JobApplicationModel.findOneAndDelete({ id });
    if (!application) return null;
    return mongoDocToPlain(application);
  } catch (error) {
    console.error(`Failed to delete job application ${id}:`, error);
    throw new Error('Failed to delete job application from database.', { cause: error });
  }
}


// ─── HELPER ───────────────────────────────────────────────────────────────────
// Convert Mongoose document to a plain object compatible with server.ts expectations

function mongoDocToPlain(doc: any): any {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  // Remove MongoDB internal fields, keep our surrogate `id`
  delete obj.__v;
  // Keep _id as string reference but use `id` as the primary numeric identifier
  return obj;
}
