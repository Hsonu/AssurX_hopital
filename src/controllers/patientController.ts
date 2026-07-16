import { Response } from 'express';
import { PatientAuthRequest } from '../middleware/jwtAuth.ts';
import PatientModel from '../models/Patient.ts';
import { BookingModel, getNextId } from '../db/schema.ts';
import mongoose from 'mongoose';
import { DIAGNOSTIC_SERVICES, HEALTH_PACKAGES } from '../data.ts';

// GET /patient/profile
export const getProfile = async (req: PatientAuthRequest, res: Response) => {
  try {
    const patientId = req.patient?.patientId;
    if (!patientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      fullName: patient.fullName,
      email: patient.email,
      profilePhoto: patient.profilePhoto,
      createdAt: patient.createdAt,
      lastLogin: patient.lastLogin,
    });
  } catch (error: any) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
};

// PUT /patient/profile
export const updateProfile = async (req: PatientAuthRequest, res: Response) => {
  try {
    const patientId = req.patient?.patientId;
    const { fullName, profilePhoto } = req.body;

    if (!patientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (fullName !== undefined) {
      patient.fullName = String(fullName).trim();
    }
    if (profilePhoto !== undefined) {
      patient.profilePhoto = String(profilePhoto).trim();
    }

    await patient.save();

    res.json({
      fullName: patient.fullName,
      email: patient.email,
      profilePhoto: patient.profilePhoto,
      createdAt: patient.createdAt,
      lastLogin: patient.lastLogin,
    });
  } catch (error: any) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};

// GET /patient/bookings
export const getBookings = async (req: PatientAuthRequest, res: Response) => {
  try {
    const patientId = req.patient?.patientId;
    if (!patientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bookings = await BookingModel.find({ patientId }).sort({ id: -1 });

    const formatted = bookings.map((b) => {
      let itemsObj = [];
      try {
        itemsObj = typeof b.items === 'string' ? JSON.parse(b.items) : b.items;
      } catch {
        itemsObj = [];
      }

      return {
        id: String(b.id),
        bookingId: b.bookingId,
        patient: {
          name: b.patientName,
          age: b.patientAge,
          gender: b.patientGender,
          relationship: b.patientRelationship,
        },
        items: itemsObj,
        appointmentDate: b.appointmentDate,
        appointmentTime: b.appointmentTime,
        collectionType: b.collectionType,
        address: {
          street: b.street || "",
          city: b.city || "",
          pincode: b.pincode || "",
        },
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        bookingStatus: b.bookingStatus,
        totalAmount: b.totalAmount,
        prescriptionName: b.prescriptionName || undefined,
        simulatedReportUrl: b.simulatedReportUrl || undefined,
        timestamp: b.timestamp,
        doctor: b.doctor || '',
        department: b.department || '',
        bookingDate: b.bookingDate,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};

// Helper for XSS sanitization
const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, "");
};

// POST /booking
export const createBooking = async (req: PatientAuthRequest, res: Response) => {
  try {
    const patientId = req.patient?.patientId;
    if (!patientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient account not found' });
    }

    const bookingId = String(req.body.bookingId || "").trim();
    const patientName = String(req.body.patientName || "").trim().substring(0, 100);
    const patientAge = parseInt(req.body.patientAge, 10);
    const patientGender = String(req.body.patientGender || "").trim().substring(0, 20);
    const patientRelationship = String(req.body.patientRelationship || "").trim().substring(0, 50);
    const appointmentDate = String(req.body.appointmentDate || "").trim();
    const appointmentTime = String(req.body.appointmentTime || "").trim();
    const collectionType = String(req.body.collectionType || "").trim();
    const paymentMethod = String(req.body.paymentMethod || "").trim();
    const paymentStatus = String(req.body.paymentStatus || "").trim();
    const bookingStatus = String(req.body.bookingStatus || "").trim();
    const totalAmount = parseInt(req.body.totalAmount, 10);
    const items = req.body.items;
    
    // Doctor & Department fields from request if supplied
    const doctorName = req.body.doctor ? String(req.body.doctor).trim() : '';
    const departmentName = req.body.department ? String(req.body.department).trim() : '';

    if (
      !bookingId ||
      !patientName ||
      isNaN(patientAge) ||
      !patientGender ||
      !patientRelationship ||
      !appointmentDate ||
      !appointmentTime ||
      !collectionType ||
      !paymentMethod ||
      !paymentStatus ||
      !bookingStatus ||
      isNaN(totalAmount) ||
      !Array.isArray(items)
    ) {
      return res.status(400).json({ error: "Validation failed: Missing or malformed parameters." });
    }

    if (patientAge < 0 || patientAge > 150) {
      return res.status(400).json({ error: "Validation failed: Invalid patient age." });
    }
    if (totalAmount < 0) {
      return res.status(400).json({ error: "Validation failed: Invalid total amount." });
    }

    // Server-side price calculation & validation (Check 4)
    try {
      let itemsTotal = 0;
      for (const item of items) {
        const matchedService = DIAGNOSTIC_SERVICES.find(s => s.id === item.itemId);
        const matchedPackage = HEALTH_PACKAGES.find(p => p.id === item.itemId);
        const catalogItem = matchedService || matchedPackage;
        if (!catalogItem) {
          throw new Error(`Item ${item.itemId} not found in catalog.`);
        }
        const price = catalogItem.discountPrice !== undefined ? catalogItem.discountPrice : catalogItem.price;
        itemsTotal += price;
      }
      const collectionCharge = collectionType === 'home' ? 150 : 0;
      const surcharge = Math.round(itemsTotal * 0.05);
      const expectedTotal = itemsTotal + collectionCharge + surcharge;

      if (totalAmount !== expectedTotal) {
        return res.status(400).json({ error: `Validation failed: Price mismatch. Expected ₹${expectedTotal}, but received ₹${totalAmount}.` });
      }
    } catch (err: any) {
      return res.status(400).json({ error: `Validation failed: ${err.message}` });
    }

    const surrogateId = await getNextId('booking');

    const newBooking = new BookingModel({
      id: surrogateId,
      bookingId: sanitizeString(bookingId),
      userId: 9999, // Surrogate userId for backward compatibility with Drizzle/User logic
      patientId: new mongoose.Types.ObjectId(patientId),
      userEmail: patient.email,
      patientName: sanitizeString(patientName),
      patientAge,
      patientGender: sanitizeString(patientGender),
      patientRelationship: sanitizeString(patientRelationship),
      appointmentDate: sanitizeString(appointmentDate),
      appointmentTime: sanitizeString(appointmentTime),
      collectionType: sanitizeString(collectionType),
      street: req.body.street ? sanitizeString(String(req.body.street).trim()).substring(0, 200) : null,
      city: req.body.city ? sanitizeString(String(req.body.city).trim()).substring(0, 100) : null,
      pincode: req.body.pincode ? sanitizeString(String(req.body.pincode).trim()).substring(0, 10) : null,
      paymentMethod: sanitizeString(paymentMethod),
      paymentStatus: sanitizeString(paymentStatus),
      bookingStatus: sanitizeString(bookingStatus),
      totalAmount,
      prescriptionName: req.body.prescriptionName ? sanitizeString(String(req.body.prescriptionName).trim()).substring(0, 200) : null,
      simulatedReportUrl: req.body.simulatedReportUrl ? sanitizeString(String(req.body.simulatedReportUrl).trim()).substring(0, 500) : null,
      items: JSON.stringify(items),
      timestamp: req.body.timestamp ? sanitizeString(String(req.body.timestamp).trim()) : new Date().toISOString(),
      doctor: sanitizeString(doctorName),
      department: sanitizeString(departmentName),
      bookingDate: new Date(),
    });

    await newBooking.save();

    res.status(201).json(newBooking);
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
};

// GET /booking/:id
export const getBookingById = async (req: PatientAuthRequest, res: Response) => {
  try {
    const patientId = req.patient?.patientId;
    const { id } = req.params;

    if (!patientId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let booking;
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await BookingModel.findOne({ _id: id, patientId });
    } else if (/^\d+$/.test(id)) {
      booking = await BookingModel.findOne({ id: parseInt(id, 10), patientId });
    } else {
      booking = await BookingModel.findOne({ bookingId: id, patientId });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or access denied' });
    }

    let itemsObj = [];
    try {
      itemsObj = typeof booking.items === 'string' ? JSON.parse(booking.items) : booking.items;
    } catch {
      itemsObj = [];
    }

    res.json({
      id: String(booking.id),
      bookingId: booking.bookingId,
      patient: {
        name: booking.patientName,
        age: booking.patientAge,
        gender: booking.patientGender,
        relationship: booking.patientRelationship,
      },
      items: itemsObj,
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      collectionType: booking.collectionType,
      address: {
        street: booking.street || "",
        city: booking.city || "",
        pincode: booking.pincode || "",
      },
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      totalAmount: booking.totalAmount,
      prescriptionName: booking.prescriptionName || undefined,
      simulatedReportUrl: booking.simulatedReportUrl || undefined,
      timestamp: booking.timestamp,
      doctor: booking.doctor || '',
      department: booking.department || '',
      bookingDate: booking.bookingDate,
    });
  } catch (error: any) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch booking details' });
  }
};
