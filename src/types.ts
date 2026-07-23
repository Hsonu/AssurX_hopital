export type ServiceCategory = 'scan' | 'lab';

export interface DiagnosticService {
  id: string;
  name: string;
  category: ServiceCategory;
  subCategory: string; // e.g. "MRI Scans", "CT Scans", "Blood Tests", "Thyroid"
  price: number;
  discountPrice?: number;
  description: string;
  preparation: string; // Preparation instructions (e.g., "8-12 hours fasting required")
  duration: string; // Estimated time (e.g., "30-45 mins", "10 mins")
  reportDelivery: string; // Report turnaround (e.g., "Same day", "24 Hours", "12 Hours")
  parametersCount?: number; // For lab tests (e.g., 24 parameters analyzed)
  popular?: boolean;
}

export interface HealthPackage {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  description: string;
  testsCount: number;
  includedTests: string[];
  idealFor: string; // e.g. "Men & Women, 18-80 years"
  frequency: string; // e.g. "Once in 6 months"
  preparation: string;
  popular?: boolean;
}

export interface Patient {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relationship: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
}

export interface CartItem {
  itemId: string; // refers to service ID or package ID
  itemType: 'service' | 'package';
  name: string;
  price: number;
  discountPrice?: number;
  category?: string;
}

export interface Booking {
  id: string;
  bookingId: string; // ASX-XXXXXX
  patient: Patient;
  items: CartItem[];
  appointmentDate: string;
  appointmentTime: string;
  collectionType: 'home' | 'center';
  address?: {
    street: string;
    city: string;
    pincode: string;
  };
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cash_at_center';
  paymentStatus: 'pending' | 'paid';
  bookingStatus: 'booked' | 'sample_collected' | 'processing' | 'report_ready' | 'cancelled';
  totalAmount: number;
  timestamp: string;
  prescriptionName?: string;
  simulatedReportUrl?: string; // To let them view their simulated report PDF
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  location: string;
  date: string;
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle: string;
  category: 'scan' | 'lab' | 'all';
  viewAllTab: 'scans' | 'labs';
  bannerImage: string;
  bannerTag: string;
  bannerTitle: string;
  serviceIds: string[]; // Manual service selection overrides. If empty, auto-filters popular items of the category.
}

export interface ClinicCenter {
  city: string;
  address: string;
  phone: string;
}

export interface PatientComplaint {
  id: string;
  patientName: string;
  phone: string;
  email: string;
  bookingId?: string;
  category: 'service_quality' | 'staff_behavior' | 'billing' | 'report_delay' | 'cleanliness' | 'other';
  subject: string;
  description: string;
  branch: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  timestamp: string;
  adminNotes?: string;
}
