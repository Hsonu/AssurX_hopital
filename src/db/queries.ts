import mongoose from 'mongoose';
import { connectDB } from './index.ts';
import {
  UserModel,
  BookingModel,
  PrescriptionModel,
  JobApplicationModel,
  DiagnosticServiceModel,
  HealthPackageModel,
  TestimonialModel,
  FAQModel,
  CenterModel,
  DoctorModel,
  getNextId,
} from './schema.ts';
import {
  DIAGNOSTIC_SERVICES,
  HEALTH_PACKAGES,
  SEED_TESTIMONIALS,
  SEED_FAQS,
  SEED_CENTERS,
  SEED_DOCTORS,
} from './seedData.ts';

// Ensure DB is connected before any query
async function ensureConnected() {
  await connectDB();
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export function formatBookingDoc(doc: any): any {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };

  let itemsObj: any[] = [];
  if (obj.items) {
    if (typeof obj.items === 'string') {
      try {
        itemsObj = JSON.parse(obj.items);
      } catch {
        itemsObj = [];
      }
    } else if (Array.isArray(obj.items)) {
      itemsObj = obj.items;
    }
  }

  const patientObj = {
    name: obj.patientName || (obj.patient && obj.patient.name) || '',
    age: obj.patientAge !== undefined ? Number(obj.patientAge) : (obj.patient && obj.patient.age) || 0,
    gender: obj.patientGender || (obj.patient && obj.patient.gender) || 'Male',
    relationship: obj.patientRelationship || (obj.patient && obj.patient.relationship) || 'Self',
  };

  const addressObj = {
    street: obj.street || (obj.address && obj.address.street) || '',
    city: obj.city || (obj.address && obj.address.city) || '',
    pincode: obj.pincode || (obj.address && obj.address.pincode) || '',
  };

  return {
    id: String(obj.id !== undefined ? obj.id : obj._id),
    bookingId: obj.bookingId || '',
    patient: patientObj,
    items: itemsObj,
    appointmentDate: obj.appointmentDate || '',
    appointmentTime: obj.appointmentTime || '',
    collectionType: obj.collectionType || 'home',
    address: addressObj,
    paymentMethod: obj.paymentMethod || 'upi',
    paymentStatus: obj.paymentStatus || 'pending',
    bookingStatus: obj.bookingStatus || 'booked',
    totalAmount: Number(obj.totalAmount) || 0,
    prescriptionName: obj.prescriptionName || undefined,
    simulatedReportUrl: obj.simulatedReportUrl || undefined,
    timestamp: obj.timestamp || new Date().toISOString(),
    doctor: obj.doctor || '',
    department: obj.department || '',
    bookingDate: obj.bookingDate || undefined,
    userEmail: obj.userEmail || '',
  };
}

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
    return formatBookingDoc(booking);
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
    return bookings.map(formatBookingDoc);
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
    return formatBookingDoc(booking);
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
      ...formatBookingDoc(b),
      userEmail: userMap.get(b.userId) || '',
    }));
  } catch (error) {
    console.error('Failed to fetch all bookings:', error);
    throw new Error('Failed to retrieve all bookings from database.', { cause: error });
  }
}

export async function updateBooking(id: number | string, data: Record<string, unknown>) {
  await ensureConnected();
  try {
    const isNum = typeof id === 'number' || /^\d+$/.test(String(id));
    const filter: any = isNum ? { id: Number(id) } : { bookingId: String(id) };

    let booking = await BookingModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: 'after' }
    );

    if (!booking && !isNum) {
      const numId = parseInt(String(id), 10);
      if (!isNaN(numId)) {
        booking = await BookingModel.findOneAndUpdate(
          { id: numId },
          { $set: data },
          { returnDocument: 'after' }
        );
      }
    }

    if (!booking) throw new Error(`Booking with id ${id} not found`);
    return formatBookingDoc(booking);
  } catch (error) {
    console.error(`Failed to update booking ${id}:`, error);
    throw new Error('Failed to update booking in database.', { cause: error });
  }
}

export async function deleteBooking(id: number | string) {
  await ensureConnected();
  try {
    const isNum = typeof id === 'number' || /^\d+$/.test(String(id));
    const filter: any = isNum ? { id: Number(id) } : { bookingId: String(id) };

    let booking = await BookingModel.findOneAndDelete(filter);

    if (!booking && !isNum) {
      const numId = parseInt(String(id), 10);
      if (!isNaN(numId)) {
        booking = await BookingModel.findOneAndDelete({ id: numId });
      }
    }

    if (!booking) return null;
    return formatBookingDoc(booking);
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
    await DiagnosticServiceModel.deleteMany({});
    await HealthPackageModel.deleteMany({});
    await seedCatalog();
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


// ─── SERVICES & PACKAGES CRUD ───────────────────────────────────────────────

export async function seedCatalog() {
  await ensureConnected();
  try {
    const serviceCount = await DiagnosticServiceModel.countDocuments();
    if (serviceCount === 0) {
      console.log("🌱 Seeding diagnostic services into MongoDB...");
      await DiagnosticServiceModel.insertMany(DIAGNOSTIC_SERVICES);
    }
    const packageCount = await HealthPackageModel.countDocuments();
    if (packageCount === 0) {
      console.log("🌱 Seeding health packages into MongoDB...");
      await HealthPackageModel.insertMany(HEALTH_PACKAGES);
    }
    const testimonialCount = await TestimonialModel.countDocuments();
    if (testimonialCount === 0) {
      console.log("🌱 Seeding testimonials into MongoDB...");
      await TestimonialModel.insertMany(SEED_TESTIMONIALS);
    }
    const faqCount = await FAQModel.countDocuments();
    if (faqCount === 0) {
      console.log("🌱 Seeding FAQs into MongoDB...");
      await FAQModel.insertMany(SEED_FAQS);
    }
    const centerCount = await CenterModel.countDocuments();
    if (centerCount === 0) {
      console.log("🌱 Seeding centers into MongoDB...");
      await CenterModel.insertMany(SEED_CENTERS);
    }
    const doctorCount = await DoctorModel.countDocuments();
    if (doctorCount === 0) {
      console.log("🌱 Seeding doctors into MongoDB...");
      await DoctorModel.insertMany(SEED_DOCTORS);
    }
  } catch (error) {
    console.error("Failed to seed catalog data:", error);
  }
}

// Helper to create flexible query filter for custom id OR Mongo _id
function buildIdFilter(identifier: string, alternativeKey: string = 'id') {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return { $or: [{ [alternativeKey]: identifier }, { _id: identifier }] };
  }
  return { [alternativeKey]: identifier };
}

// Diagnostic Services Queries
export async function getAllServices() {
  await ensureConnected();
  try {
    const services = await DiagnosticServiceModel.find({});
    return services.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw new Error('Failed to retrieve services from database.', { cause: error });
  }
}

export async function createService(serviceData: any) {
  await ensureConnected();
  try {
    const newService = new DiagnosticServiceModel(serviceData);
    await newService.save();
    return mongoDocToPlain(newService);
  } catch (error) {
    console.error('Failed to create service:', error);
    throw new Error('Failed to create service in database.', { cause: error });
  }
}

export async function updateService(id: string, serviceData: any) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, 'id');
    const service = await DiagnosticServiceModel.findOneAndUpdate(
      filter,
      { $set: serviceData },
      { returnDocument: 'after' }
    );
    if (!service) throw new Error(`Service ${id} not found`);
    return mongoDocToPlain(service);
  } catch (error) {
    console.error(`Failed to update service ${id}:`, error);
    throw new Error('Failed to update service in database.', { cause: error });
  }
}

export async function deleteService(id: string) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, 'id');
    const service = await DiagnosticServiceModel.findOneAndDelete(filter);
    if (!service) return null;
    return mongoDocToPlain(service);
  } catch (error) {
    console.error(`Failed to delete service ${id}:`, error);
    throw new Error('Failed to delete service from database.', { cause: error });
  }
}

// Health Packages Queries
export async function getAllPackages() {
  await ensureConnected();
  try {
    const packages = await HealthPackageModel.find({});
    return packages.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch health packages:', error);
    throw new Error('Failed to retrieve health packages from database.', { cause: error });
  }
}

export async function createPackage(packageData: any) {
  await ensureConnected();
  try {
    const newPackage = new HealthPackageModel(packageData);
    await newPackage.save();
    return mongoDocToPlain(newPackage);
  } catch (error) {
    console.error('Failed to create package:', error);
    throw new Error('Failed to create package in database.', { cause: error });
  }
}

export async function updatePackage(id: string, packageData: any) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, 'id');
    const pkg = await HealthPackageModel.findOneAndUpdate(
      filter,
      { $set: packageData },
      { returnDocument: 'after' }
    );
    if (!pkg) throw new Error(`Health package ${id} not found`);
    return mongoDocToPlain(pkg);
  } catch (error) {
    console.error(`Failed to update package ${id}:`, error);
    throw new Error('Failed to update health package in database.', { cause: error });
  }
}

export async function deletePackage(id: string) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, 'id');
    const pkg = await HealthPackageModel.findOneAndDelete(filter);
    if (!pkg) return null;
    return mongoDocToPlain(pkg);
  } catch (error) {
    console.error(`Failed to delete package ${id}:`, error);
    throw new Error('Failed to delete health package from database.', { cause: error });
  }
}


// ─── TESTIMONIALS CRUD ────────────────────────────────────────────────────────

export async function getAllTestimonials() {
  await ensureConnected();
  try {
    const testimonials = await TestimonialModel.find({});
    return testimonials.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    throw new Error('Failed to retrieve testimonials from database.', { cause: error });
  }
}

export async function createTestimonial(data: any) {
  await ensureConnected();
  try {
    const testimonial = new TestimonialModel(data);
    await testimonial.save();
    return mongoDocToPlain(testimonial);
  } catch (error) {
    console.error('Failed to create testimonial:', error);
    throw new Error('Failed to create testimonial in database.', { cause: error });
  }
}

export async function updateTestimonial(id: string, data: any) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, 'id');
    const testimonial = await TestimonialModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!testimonial) throw new Error(`Testimonial ${id} not found`);
    return mongoDocToPlain(testimonial);
  } catch (error) {
    console.error(`Failed to update testimonial ${id}:`, error);
    throw new Error('Failed to update testimonial in database.', { cause: error });
  }
}

export async function deleteTestimonial(id: string) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, 'id');
    const testimonial = await TestimonialModel.findOneAndDelete(filter);
    if (!testimonial) return null;
    return mongoDocToPlain(testimonial);
  } catch (error) {
    console.error(`Failed to delete testimonial ${id}:`, error);
    throw new Error('Failed to delete testimonial from database.', { cause: error });
  }
}


// ─── FAQS CRUD ────────────────────────────────────────────────────────────────

export async function getAllFAQs() {
  await ensureConnected();
  try {
    const faqs = await FAQModel.find({});
    return faqs.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    throw new Error('Failed to retrieve FAQs from database.', { cause: error });
  }
}

export async function createFAQ(data: any) {
  await ensureConnected();
  try {
    const faq = new FAQModel(data);
    await faq.save();
    return mongoDocToPlain(faq);
  } catch (error) {
    console.error('Failed to create FAQ:', error);
    throw new Error('Failed to create FAQ in database.', { cause: error });
  }
}

export async function updateFAQ(identifier: string, data: any) {
  await ensureConnected();
  try {
    const filter = mongoose.Types.ObjectId.isValid(identifier)
      ? { _id: identifier }
      : { q: identifier };
    const faq = await FAQModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!faq) throw new Error(`FAQ ${identifier} not found`);
    return mongoDocToPlain(faq);
  } catch (error) {
    console.error(`Failed to update FAQ ${identifier}:`, error);
    throw new Error('Failed to update FAQ in database.', { cause: error });
  }
}

export async function deleteFAQ(identifier: string) {
  await ensureConnected();
  try {
    const filter = mongoose.Types.ObjectId.isValid(identifier)
      ? { _id: identifier }
      : { q: identifier };
    const faq = await FAQModel.findOneAndDelete(filter);
    if (!faq) return null;
    return mongoDocToPlain(faq);
  } catch (error) {
    console.error(`Failed to delete FAQ ${identifier}:`, error);
    throw new Error('Failed to delete FAQ from database.', { cause: error });
  }
}


// ─── CENTERS CRUD ─────────────────────────────────────────────────────────────

export async function getAllCenters() {
  await ensureConnected();
  try {
    const centers = await CenterModel.find({});
    return centers.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch centers:', error);
    throw new Error('Failed to retrieve centers from database.', { cause: error });
  }
}

export async function createCenter(data: any) {
  await ensureConnected();
  try {
    const center = new CenterModel(data);
    await center.save();
    return mongoDocToPlain(center);
  } catch (error) {
    console.error('Failed to create center:', error);
    throw new Error('Failed to create center in database.', { cause: error });
  }
}

export async function updateCenter(identifier: string, data: any) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(identifier, 'city');
    const center = await CenterModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!center) throw new Error(`Center ${identifier} not found`);
    return mongoDocToPlain(center);
  } catch (error) {
    console.error(`Failed to update center ${identifier}:`, error);
    throw new Error('Failed to update center in database.', { cause: error });
  }
}

export async function deleteCenter(identifier: string) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(identifier, 'city');
    const center = await CenterModel.findOneAndDelete(filter);
    if (!center) return null;
    return mongoDocToPlain(center);
  } catch (error) {
    console.error(`Failed to delete center ${identifier}:`, error);
    throw new Error('Failed to delete center from database.', { cause: error });
  }
}


// ─── DOCTORS CRUD ─────────────────────────────────────────────────────────────

export async function getAllDoctors() {
  await ensureConnected();
  try {
    const doctors = await DoctorModel.find({});
    return doctors.map(mongoDocToPlain);
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    throw new Error('Failed to retrieve doctors from database.', { cause: error });
  }
}

export async function createDoctor(data: any) {
  await ensureConnected();
  try {
    const doctor = new DoctorModel(data);
    await doctor.save();
    return mongoDocToPlain(doctor);
  } catch (error) {
    console.error('Failed to create doctor:', error);
    throw new Error('Failed to create doctor in database.', { cause: error });
  }
}

export async function updateDoctor(id: string, data: any) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, 'id');
    const doctor = await DoctorModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!doctor) throw new Error(`Doctor ${id} not found`);
    return mongoDocToPlain(doctor);
  } catch (error) {
    console.error(`Failed to update doctor ${id}:`, error);
    throw new Error('Failed to update doctor in database.', { cause: error });
  }
}

export async function deleteDoctor(id: string) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, 'id');
    const doctor = await DoctorModel.findOneAndDelete(filter);
    if (!doctor) return null;
    return mongoDocToPlain(doctor);
  } catch (error) {
    console.error(`Failed to delete doctor ${id}:`, error);
    throw new Error('Failed to delete doctor from database.', { cause: error });
  }
}

