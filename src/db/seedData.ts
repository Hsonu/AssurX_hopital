// ─── SEED DATA ────────────────────────────────────────────────────────────────
// This file contains initial seed data for MongoDB collections.
// It is ONLY used by seedCatalog() in queries.ts when collections are empty.
// It is NOT imported by any frontend component or API route.

import { DiagnosticService, HealthPackage, Testimonial, Doctor } from '../types';

// Re-export types for seed usage
export interface SeedFAQ {
  q: string;
  a: string;
}

export interface SeedCenter {
  city: string;
  address: string;
  phone: string;
  whatsappNumber?: string;
}

export const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: "Varun Dubey",
    rating: 5,
    comment: "I recently had the pleasure of using the services provided by AssurX, and I must say I was thoroughly satisfied.",
    location: "Mumbai",
    date: "15 May 2023"
  },
  {
    id: 't-2',
    name: "Arti Shrivastva",
    rating: 5,
    comment: "Prompt service and they perform only things they want to test. More comparative with other peers online in price.",
    location: "Mumbai",
    date: "16 Jun 2023"
  },
  {
    id: 't-3',
    name: "Rajesh Kumar",
    rating: 5,
    comment: "Excellent experience. Booked an USG scan for my father. Staff was very polite and supportive. MD Radiologist report was ready within 2 hours. Best diagnostic center in Malad with affordable rates!",
    location: "Malad West, Mumbai",
    date: "12 days ago"
  },
  {
    id: 't-4',
    name: "Sneha Deshmukh",
    rating: 5,
    comment: "The Phlebotomist arrived right on time for the Home Blood Collection. He was highly skilled, used sterile sealed equipment, and took the sample painless. Got accurate digital reports on WhatsApp the same evening!",
    location: "Goregaon East, Mumbai",
    date: "1 week ago"
  },
  {
    id: 't-5',
    name: "Amit Patel",
    rating: 5,
    comment: "Very neat, clean, and modern diagnostic center with high-tech equipment. Extremely polite staff and seamless online booking. Highly recommended for all ultrasound scans and blood checkups!",
    location: "Malad East, Mumbai",
    date: "3 days ago"
  }
];

export const SEED_FAQS: SeedFAQ[] = [
  {
    q: "Do I need an appointment, or can I walk in?",
    a: "Walk-ins are welcome for routine blood and urine tests. However, we strongly recommend booking an appointment in advance for imaging procedures ECHO, Ultrasounds, and Mammograms to minimize your wait time and ensure proper preparation."
  },
  {
    q: "What are your operating hours and report pickup timings?",
    a: "Our sample collection counter is open Monday – Sunday: 7:30 AM – 10:00 PM. Reports can be collected physically during working hours or downloaded 24/7 via our e-reports Services."
  },
  {
    q: "How do I know if I need to fast before my blood test?",
    a: "Tests such as Fasting Blood Sugar (FBS), Lipid Profile, Liver Function Test (LFT), and Metabolic Panels typically require 8 to 12 hours of overnight fasting. Only plain water is allowed during this period. Do not consume tea, coffee, juice, or food until your blood is drawn."
  },
  {
    q: "Can I take my regular medications before a test?",
    a: "In most cases, yes—you may take daily prescription medications with water unless specifically instructed otherwise by your doctor (e.g., thyroid medication or insulin before fasting tests). Always inform our phlebotomist/technician about any medications you have taken."
  },
  {
    q: "What preparation is required for an Ultrasound or Imaging scan?",
    a: "Preparation depends on the body region. Abdominal Ultrasound: Requires 6–8 hours of fasting. Pelvic/OB Ultrasound: Requires a full bladder (drink 3–4 glasses of water 1 hour before and do not empty your bladder)."
  },
  {
    q: "Do you offer home sample collection services?",
    a: "Yes. We offer home blood collection for all. You can schedule a home visit by calling our helpline or booking through our website. We are at your doorsteps just 60 Minutes."
  },
  {
    q: "Is home ECG as accurate as taking it in the diagnostic center?",
    a: "Yes. We use hospital-grade, 12-lead portable digital ECG machines that offer identical accuracy and precision to stationary clinical devices."
  },
  {
    q: "What does ISO certification mean for a diagnostic center?",
    a: "ISO certification is an official endorsement that a laboratory follows strict global standards for test accuracy, equipment calibration, hygiene, sample handling, and patient data confidentiality. It assures patients and doctors that test results are accurate and reproducible."
  }
];

export const SEED_CENTERS: SeedCenter[] = [
  { city: "Malad", address: "Shop 1-3, SV Road, Opp. Malad Railway Station, Malad West, Mumbai - 400064", phone: "022-50117701", whatsappNumber: "919830678387" },
  { city: "Goregaon", address: "G-4, Sun Plaza, SV Road, Near Goregaon East Metro, Goregaon, Mumbai - 400063", phone: "022-50117702", whatsappNumber: "919830678387" }
];

export const SEED_DOCTORS: Doctor[] = [
  {
    id: 'doc-alok-sharma',
    name: 'Dr. Alok Sharma',
    specialization: 'Cardiologist',
    experience: 15,
    qualification: 'MD, DM (Cardiology)',
    timing: '09:00 AM - 01:00 PM',
    branch: 'Malad',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'doc-reena-mehta',
    name: 'Dr. Reena Mehta',
    specialization: 'Gynecologist',
    experience: 10,
    qualification: 'MD (Gynecology)',
    timing: '02:00 PM - 06:00 PM',
    branch: 'Malad',
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'doc-s-iyer',
    name: 'Dr. S. Iyer',
    specialization: 'Neurologist',
    experience: 18,
    qualification: 'DM (Neurology)',
    timing: '10:00 AM - 02:00 PM',
    branch: 'Goregaon',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'doc-priya-patel',
    name: 'Dr. Priya Patel',
    specialization: 'Pediatrician',
    experience: 8,
    qualification: 'MD (Pediatrics)',
    timing: '04:00 PM - 08:00 PM',
    branch: 'Goregaon',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'doc-shreyas-masrani',
    name: 'Dr. Shreyas Masrani',
    specialization: 'Radiologist',
    experience: 30,
    qualification: 'MD (Radio-Diagnosis)',
    timing: '11:00 AM - 03:00 PM',
    branch: 'Goregaon',
    avatar: '/shreyas_masrani.jpg'
  },
  {
    id: 'doc-biswajit-mondal',
    name: 'Dr. Biswajit Mondal',
    specialization: 'General Physician',
    experience: 6,
    qualification: 'MBBS',
    timing: '10:00 AM - 02:00 PM',
    branch: 'Malad',
    avatar: '/biswajit_mondal.png'
  }
];

// The DIAGNOSTIC_SERVICES and HEALTH_PACKAGES seed data is imported from the
// original data.ts during the migration. After the first seed, this data lives
// only in MongoDB and is managed via admin CRUD APIs.
export { DIAGNOSTIC_SERVICES, HEALTH_PACKAGES } from '../data.ts';
