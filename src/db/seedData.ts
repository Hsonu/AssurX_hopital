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
}

export const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: "Rajesh Kumar",
    rating: 5,
    comment: "Excellent experience. Booked an USG scan for my father. Staff was very polite and supportive. MD Radiologist report was ready within 2 hours. Best diagnostic center in Malad with affordable rates!",
    location: "Malad West, Mumbai",
    date: "12 days ago"
  },
  {
    id: 't-2',
    name: "Sneha Deshmukh",
    rating: 5,
    comment: "The Phlebotomist arrived right on time for the Home Blood Collection. He was highly skilled, used sterile sealed equipment, and took the sample painless. Got accurate digital reports on WhatsApp the same evening!",
    location: "Goregaon East, Mumbai",
    date: "1 week ago"
  },
  {
    id: 't-3',
    name: "Amit Patel",
    rating: 5,
    comment: "Very neat, clean, and modern diagnostic center with high-tech equipment. Extremely polite staff and seamless online booking. Highly recommended for all ultrasound scans and blood checkups!",
    location: "Malad East, Mumbai",
    date: "3 days ago"
  }
];

export const SEED_FAQS: SeedFAQ[] = [
  {
    q: "Why are your rates significantly lower than other diagnostic centers?",
    a: "At AssurX, our mission is to make high-quality, trusted diagnostics affordable for every Indian. By utilizing high-throughput, state-of-the-art robotic machines in our centralized NABL labs and reducing administrative overheads, we pass 100% of the cost savings directly to our patients. We offer the exact same diagnostic accuracy and technology at up to 50% lower prices."
  },
  {
    q: "How does the Home Sample Collection service work?",
    a: "Once you book a blood test or health package and choose 'Home Collection', a certified, experienced medical Phlebotomist is assigned to your booking. They will visit your home at your chosen time slot, extract samples using sterile vacuum tubes, store them immediately in cold-chain transport boxes, and safely deliver them to our laboratory. Home collection is free or has a very nominal charge depending on your booking."
  },
  {
    q: "How and when will I get my diagnostic reports?",
    a: "Our diagnostic lab systems are highly automated. As soon as your report is ready, certified, and digitally signed by our doctors, you will receive an SMS and WhatsApp notification with a link. You can also view and download all historical reports instantly by logging into your Patient Portal/Dashboard on this website using your registered mobile number."
  },
  {
    q: "Are AssurX Scans and Lab reports valid in all hospitals?",
    a: "Absolutely! All AssurX laboratory reports are generated from NABL-accredited, state-of-the-art facilities and comply strictly with ISO standards. All scan images (MRI, CT, Ultrasound) are read and reported by highly experienced MD Radiologists. Our reports are 100% trusted and accepted by all major hospitals, clinicians, and health insurance providers across India."
  },
  {
    q: "What is the preparation required for an MRI or CT Scan?",
    a: "For general MRI, ensure no metal accessories are worn. For CT Whole Abdomen/Contrast scans or Whole Abdomen Ultrasounds, fasting for 6 hours is mandatory. For contrast CT scans, a recent Serum Creatinine lab report is required to verify kidney safety. Specific instructions for your booked test are shown clearly on your digital booking confirmation."
  }
];

export const SEED_CENTERS: SeedCenter[] = [
  { city: "Malad", address: "Shop 1-3, SV Road, Opp. Malad Railway Station, Malad West, Mumbai - 400064", phone: "022-50117701" },
  { city: "Goregaon", address: "G-4, Sun Plaza, SV Road, Near Goregaon East Metro, Goregaon, Mumbai - 400063", phone: "022-50117702" }
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
