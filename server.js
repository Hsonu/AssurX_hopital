var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// firebase-applet-config.json
var firebase_applet_config_default;
var init_firebase_applet_config = __esm({
  "firebase-applet-config.json"() {
    firebase_applet_config_default = {
      projectId: "assurx-hospital",
      appId: "1:261614998290:web:1d4929b1f1ab7ecd3619cb",
      apiKey: "AIzaSyA2EtnqZQITvYhPfvE5dTaw5OG0E-hKzfA",
      authDomain: "assurx-hospital.firebaseapp.com",
      storageBucket: "assurx-hospital.firebasestorage.app",
      messagingSenderId: "261614998290",
      measurementId: "G-BTB5HD5W0Z"
    };
  }
});

// src/lib/firebase-admin.ts
var firebase_admin_exports = {};
__export(firebase_admin_exports, {
  adminAuth: () => adminAuth
});
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
var adminAuth;
var init_firebase_admin = __esm({
  "src/lib/firebase-admin.ts"() {
    init_firebase_applet_config();
    if (!getApps().length) {
      initializeApp({
        projectId: firebase_applet_config_default.projectId
      });
    }
    adminAuth = getAuth();
  }
});

// src/utils/jwt.ts
var jwt_exports = {};
__export(jwt_exports, {
  generateToken: () => generateToken,
  verifyToken: () => verifyToken
});
import jwt from "jsonwebtoken";
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
var JWT_SECRET;
var init_jwt = __esm({
  "src/utils/jwt.ts"() {
    JWT_SECRET = process.env.JWT_SECRET || "assurx_jwt_secret_2026";
  }
});

// server.ts
import express from "express";
import path from "path";
import http from "http";
import https from "https";
import crypto from "crypto";
import fs from "fs";
import compression from "compression";
import { createServer as createViteServer } from "vite";

// src/middleware/auth.ts
init_firebase_admin();

// src/db/index.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
var MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://bmandal1997_db_user:Sonu%40123456789@cluster0.6aeqnar.mongodb.net/assurx?retryWrites=true&w=majority&appName=Cluster0";
if (!process.env.MONGODB_URI) {
  console.warn("\u26A0\uFE0F WARNING: MONGODB_URI environment variable is NOT set! Falling back to cloud database.");
}
var isConnected = false;
var MAX_RETRIES = 5;
var INITIAL_RETRY_DELAY_MS = 2e3;
async function connectDB() {
  if (isConnected) {
    return;
  }
  const maskedURI = MONGODB_URI.includes("@") ? MONGODB_URI.replace(/:([^:@]+)@/, ":***@") : MONGODB_URI;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Connecting to MongoDB (attempt ${attempt}/${MAX_RETRIES}): ${maskedURI}`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 15e3,
        // 15s for slow networks
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 9e4,
        // 90s for slow networks
        connectTimeoutMS: 2e4,
        // 20s for slow networks
        autoIndex: false,
        heartbeatFrequencyMS: 3e4,
        // Check connection health every 30s
        retryWrites: true,
        retryReads: true,
        // Buffer commands when disconnected (prevents crashes during reconnection)
        bufferCommands: true,
        // Enable connection compression for faster data transfer on slow networks
        compressors: ["zlib", "snappy"],
        // DNS caching to reduce DNS resolution time on subsequent connections
        family: 4
        // Force IPv4 to avoid IPv6 resolution delays
      });
      isConnected = true;
      console.log(`\u2705 MongoDB connected successfully.`);
      return;
    } catch (error) {
      console.error(`\u274C MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`\u23F3 Retrying in ${delay / 1e3} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("\u274C All MongoDB connection attempts failed.");
        throw error;
      }
    }
  }
}
mongoose.connection.on("disconnected", () => {
  console.warn("\u26A0\uFE0F MongoDB disconnected. Attempting to reconnect...");
  isConnected = false;
  setTimeout(() => {
    connectDB().catch((err) => {
      console.error("\u274C MongoDB auto-reconnection failed:", err.message);
    });
  }, 5e3);
});
mongoose.connection.on("reconnected", () => {
  console.log("\u2705 MongoDB reconnected successfully.");
  isConnected = true;
});
mongoose.connection.on("error", (err) => {
  console.error("\u274C MongoDB connection error:", err.message);
  isConnected = false;
});
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed.");
  process.exit(0);
});

// src/db/schema.ts
import mongoose2, { Schema } from "mongoose";
var userSchema = new Schema({
  id: { type: Number, unique: true },
  // auto-incremented surrogate ID
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  activeSession: { type: String, default: "" }
});
var UserModel = mongoose2.models.User || mongoose2.model("User", userSchema);
var adminSessionSchema = new Schema({
  _id: { type: String },
  activeSessions: { type: [String], default: [] },
  activeSession: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
});
var AdminSessionModel = mongoose2.models.AdminSession || mongoose2.model("AdminSession", adminSessionSchema);
var bookingSchema = new Schema({
  id: { type: Number, unique: true },
  bookingId: { type: String, required: true, unique: true },
  userId: { type: Number, required: true },
  patientId: {
    type: mongoose2.Schema.Types.ObjectId,
    ref: "Patient",
    required: false
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
  doctor: { type: String, default: "" },
  department: { type: String, default: "" },
  bookingDate: { type: Date, default: Date.now }
});
var BookingModel = mongoose2.models.Booking || mongoose2.model("Booking", bookingSchema);
var prescriptionSchema = new Schema({
  id: { type: Number, unique: true },
  prescriptionId: { type: String, required: true, unique: true },
  userId: { type: Number },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  fileName: { type: String, required: true },
  doctorName: { type: String },
  dontKnowTests: { type: Boolean, default: false },
  extractedServiceIds: { type: String },
  status: { type: String, required: true, default: "pending_call" },
  timestamp: { type: String, required: true }
});
var PrescriptionModel = mongoose2.models.Prescription || mongoose2.model("Prescription", prescriptionSchema);
var jobApplicationSchema = new Schema({
  id: { type: Number, unique: true },
  applicationId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  position: { type: String, required: true },
  experience: { type: String, required: true },
  resumeLink: { type: String },
  notes: { type: String },
  status: { type: String, required: true, default: "applied" },
  timestamp: { type: String, required: true }
});
var JobApplicationModel = mongoose2.models.JobApplication || mongoose2.model("JobApplication", jobApplicationSchema);
var counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
var CounterModel = mongoose2.models.Counter || mongoose2.model("Counter", counterSchema);
async function getNextId(name) {
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  if (!counter) throw new Error(`Counter ${name} could not be updated.`);
  return counter.seq;
}
var diagnosticServiceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ["scan", "lab"] },
  subCategory: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  description: { type: String, required: true },
  preparation: { type: String, required: true },
  duration: { type: String, required: true },
  reportDelivery: { type: String, required: true },
  parametersCount: { type: Number },
  popular: { type: Boolean, default: false }
});
var DiagnosticServiceModel = mongoose2.models.DiagnosticService || mongoose2.model("DiagnosticService", diagnosticServiceSchema);
var healthPackageSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  description: { type: String, required: true },
  testsCount: { type: Number, required: true },
  includedTests: { type: [String], required: true },
  idealFor: { type: String, required: true },
  frequency: { type: String, required: true },
  preparation: { type: String, required: true },
  popular: { type: Boolean, default: false }
});
var HealthPackageModel = mongoose2.models.HealthPackage || mongoose2.model("HealthPackage", healthPackageSchema);
var testimonialSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true }
});
var TestimonialModel = mongoose2.models.Testimonial || mongoose2.model("Testimonial", testimonialSchema);
var faqSchema = new Schema({
  q: { type: String, required: true },
  a: { type: String, required: true }
});
var FAQModel = mongoose2.models.FAQ || mongoose2.model("FAQ", faqSchema);
var centerSchema = new Schema({
  city: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  whatsappNumber: { type: String, required: false }
});
var CenterModel = mongoose2.models.Center || mongoose2.model("Center", centerSchema);
var doctorSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  qualification: { type: String, required: true },
  timing: { type: String, required: true },
  branch: { type: String, required: true },
  avatar: { type: String, required: true }
});
var DoctorModel = mongoose2.models.Doctor || mongoose2.model("Doctor", doctorSchema);
var promoAdSchema = new Schema({
  id: { type: String, required: true, unique: true, default: "main_promo" },
  title: { type: String, default: "AssurX Diagnostics Promotional Camp" },
  imageUrl: { type: String, default: "/promotional_camp.jpg" },
  targetTab: { type: String, default: "labs" },
  targetUrl: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});
var PromoAdModel = mongoose2.models.PromoAd || mongoose2.model("PromoAd", promoAdSchema);

// src/db/users.ts
async function getOrCreateUser(uid, email) {
  await connectDB();
  try {
    let user = await UserModel.findOne({ uid });
    if (user) {
      if (user.email !== email) {
        user.email = email;
        await user.save();
      }
      return { id: user.id, uid: user.uid, email: user.email, createdAt: user.createdAt };
    }
    const id = await getNextId("user");
    user = new UserModel({ uid, email, id });
    await user.save();
    return { id: user.id, uid: user.uid, email: user.email, createdAt: user.createdAt };
  } catch (error) {
    console.error("Failed to get or create user in DB:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
async function updateUserSession(uid, sessionId) {
  await connectDB();
  await UserModel.updateOne({ uid }, { $set: { activeSession: sessionId } });
}
async function getUserActiveSession(uid) {
  await connectDB();
  const user = await UserModel.findOne({ uid }, { activeSession: 1 }).lean();
  return user?.activeSession || "";
}

// src/middleware/auth.ts
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const jwt2 = await import("jsonwebtoken");
    const decoded = jwt2.default.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      return res.status(401).json({ error: "Unauthorized: Invalid token format" });
    }
  } catch (err) {
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const incomingSession = req.headers["x-user-session"];
    const storedSession = await getUserActiveSession(uid);
    if (storedSession && incomingSession !== storedSession) {
      return res.status(401).json({
        error: "Your account has been logged in on another device. Please log in again."
      });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// src/db/adminSession.ts
var ADMIN_DOC_ID = "admin";
async function isValidAdminSession(email = ADMIN_DOC_ID, sessionId) {
  if (!sessionId) return false;
  await connectDB();
  const doc = await AdminSessionModel.findById(email.trim().toLowerCase()).lean();
  if (!doc) return false;
  const sessions = doc?.activeSessions || [];
  const singleSession = doc?.activeSession || "";
  return sessions.includes(sessionId) || singleSession === sessionId;
}
async function addAdminSession(email = ADMIN_DOC_ID, sessionId) {
  if (!sessionId) return;
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();
  await AdminSessionModel.findByIdAndUpdate(
    normalizedEmail,
    {
      $addToSet: { activeSessions: sessionId },
      $set: { activeSession: sessionId, updatedAt: /* @__PURE__ */ new Date() }
    },
    { upsert: true, returnDocument: "after" }
  );
}
async function removeAdminSession(email = ADMIN_DOC_ID, sessionId) {
  if (!sessionId) return;
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();
  await AdminSessionModel.findByIdAndUpdate(
    normalizedEmail,
    {
      $pull: { activeSessions: sessionId },
      $set: { updatedAt: /* @__PURE__ */ new Date() }
    }
  );
}
async function clearAdminSession(email = ADMIN_DOC_ID) {
  await connectDB();
  const normalizedEmail = email.trim().toLowerCase();
  await AdminSessionModel.findByIdAndUpdate(
    normalizedEmail,
    { $set: { activeSessions: [], activeSession: "", updatedAt: /* @__PURE__ */ new Date() } }
  );
}

// src/routes/authRoutes.ts
import { Router } from "express";

// src/controllers/authController.ts
init_firebase_admin();
import mongoose4 from "mongoose";

// src/models/Patient.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var PatientSchema = new Schema2({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  googleUid: { type: String, required: true, unique: true, index: true },
  profilePhoto: { type: String },
  provider: { type: String, default: "Google", enum: ["Google"] },
  role: { type: String, default: "Patient", enum: ["Patient"] },
  lastLogin: { type: Date, default: Date.now }
}, {
  timestamps: true
});
var PatientModel = mongoose3.models.Patient || mongoose3.model("Patient", PatientSchema);
var Patient_default = PatientModel;

// src/controllers/authController.ts
init_jwt();
var googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing ID token" });
    }
    let uid;
    let email;
    let name;
    let picture;
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      email = decodedToken.email;
      name = decodedToken.name;
      picture = decodedToken.picture;
    } catch (adminError) {
      console.warn("Firebase Admin verification failed, trying local decode fallback:", adminError.message);
      try {
        const parts = idToken.split(".");
        if (parts.length !== 3) {
          throw new Error("Invalid JWT format");
        }
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
        const now = Math.floor(Date.now() / 1e3);
        if (payload.exp && payload.exp < now) {
          throw new Error("Google token has expired");
        }
        uid = payload.user_id || payload.sub;
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (fallbackError) {
        throw new Error("Authentication token verification failed: " + adminError.message);
      }
    }
    if (!email) {
      return res.status(400).json({ error: "Email is required from Google profile" });
    }
    let patient = null;
    try {
      if (mongoose4.connection.readyState === 1) {
        patient = await Patient_default.findOne({ googleUid: uid });
        if (!patient) {
          patient = await Patient_default.findOne({ email });
        }
      }
    } catch (dbErr) {
      console.warn("Database connection issue during patient search, using memory fallback:", dbErr);
    }
    if (!patient) {
      const mockPatient = {
        _id: "mock_pat_" + Math.random().toString(36).substr(2, 9),
        fullName: name || "Google User",
        email,
        googleUid: uid,
        profilePhoto: picture || "",
        provider: "Google",
        role: "Patient",
        createdAt: /* @__PURE__ */ new Date(),
        lastLogin: /* @__PURE__ */ new Date()
      };
      if (mongoose4.connection.readyState === 1) {
        try {
          patient = new Patient_default(mockPatient);
          await patient.save();
        } catch (saveErr) {
          console.warn("Failed to save patient to DB, using memory fallback:", saveErr);
          patient = mockPatient;
        }
      } else {
        patient = mockPatient;
      }
    } else {
      if (mongoose4.connection.readyState === 1) {
        try {
          patient.lastLogin = /* @__PURE__ */ new Date();
          if (name && patient.fullName !== name) patient.fullName = name;
          if (picture && patient.profilePhoto !== picture) patient.profilePhoto = picture;
          if (!patient.googleUid) patient.googleUid = uid;
          await patient.save();
        } catch (updateErr) {
          console.warn("Failed to update patient in database:", updateErr);
        }
      }
    }
    const jwtToken = generateToken({
      patientId: String(patient._id),
      email: patient.email,
      googleUid: patient.googleUid,
      role: "Patient"
    });
    res.json({
      jwtToken,
      patient: {
        id: String(patient._id),
        fullName: patient.fullName,
        email: patient.email,
        profilePhoto: patient.profilePhoto,
        role: patient.role,
        createdAt: patient.createdAt || /* @__PURE__ */ new Date(),
        lastLogin: patient.lastLogin || /* @__PURE__ */ new Date()
      }
    });
  } catch (error) {
    console.error("Error during Google verification & auth:", error);
    res.status(401).json({ error: error.message || "Authentication failed" });
  }
};
var logout = async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

// src/routes/authRoutes.ts
var router = Router();
router.post("/google", googleAuth);
router.post("/logout", logout);
var authRoutes_default = router;

// src/routes/patientRoutes.ts
import { Router as Router2 } from "express";

// src/middleware/jwtAuth.ts
init_jwt();
var requirePatientAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split("Bearer ")[1];
  if (!token || token === "undefined" || token === "null" || token === "") {
    return res.status(401).json({ error: "Unauthorized: Empty token" });
  }
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "Patient") {
      return res.status(401).json({ error: "Unauthorized: Invalid token role" });
    }
    req.patient = decoded;
    next();
  } catch (error) {
    console.error("JWT validation failed:", error.message);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

// src/controllers/patientController.ts
import mongoose6 from "mongoose";

// src/db/queries.ts
import mongoose5 from "mongoose";

// src/data.ts
var DIAGNOSTIC_SERVICES = [
  // --- GENERAL ULTRASOUND (USG) ---
  {
    id: "scan-usg-whole-abd-pelvis",
    name: "Whole Abdomen/Pelvis + Abdomen",
    category: "scan",
    subCategory: "General Sonography",
    price: 2500,
    discountPrice: 1300,
    description: "Detailed USG examination of upper & lower abdominal organs, pelvic structures, kidneys, liver, gallbladder, and urinary tract.",
    preparation: "Overnight or 6 hours fasting mandatory. Full bladder required.",
    duration: "15-20 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-usg-upper-abd-kub",
    name: "Upper Abdomen/Pelvis/KUB",
    category: "scan",
    subCategory: "General Sonography",
    price: 2e3,
    discountPrice: 1e3,
    description: "Ultrasound screening of upper abdomen organs, liver, kidneys, ureters, and bladder (KUB).",
    preparation: "Fasting 6 hours mandatory. Full bladder required for KUB evaluation.",
    duration: "15 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-usg-pelvis-ta-tvs",
    name: "USG Pelvis (TA & TVS)",
    category: "scan",
    subCategory: "General Sonography",
    price: 2e3,
    discountPrice: 1e3,
    description: "Transabdominal and Transvaginal ultrasound for in-depth evaluation of uterus, ovaries, and pelvic anatomy.",
    preparation: "Full bladder required for TA scan. Empty bladder for TVS scan.",
    duration: "15-20 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-usg-neck",
    name: "USG Neck",
    category: "scan",
    subCategory: "General Sonography",
    price: 2500,
    discountPrice: 1300,
    description: "Ultrasound imaging of neck structures including thyroid gland, parotid, submandibular glands, and cervical lymph nodes.",
    preparation: "No fasting required. Avoid wearing neck jewelry.",
    duration: "15 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-usg-scrotum",
    name: "USG Scrotum",
    category: "scan",
    subCategory: "General Sonography",
    price: 2500,
    discountPrice: 1300,
    description: "High-frequency ultrasound evaluation of testes, epididymis, and scrotal tissues for varicoceles, hydroceles, or lesions.",
    preparation: "No fasting required.",
    duration: "15 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-usg-breast-unilateral",
    name: "USG Breast (Unilateral)",
    category: "scan",
    subCategory: "General Sonography",
    price: 2800,
    discountPrice: 1500,
    description: "Focused ultrasound scan of single breast tissue and axillary lymph nodes to evaluate lumps, cysts, or localized pain.",
    preparation: "No talcum powder or lotion on skin on scan day.",
    duration: "15 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-usg-breast-bilateral",
    name: "USG Breast (Bilateral)",
    category: "scan",
    subCategory: "General Sonography",
    price: 3800,
    discountPrice: 2e3,
    description: "Complete high-resolution ultrasound screening of both breasts and axillae for cyst, fibroadenoma, or tissue assessment.",
    preparation: "Do not apply powders or deodorants on chest area.",
    duration: "20 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-usg-small-part-unilateral",
    name: "USG Small Part (Unilateral)/Local Part/Chest",
    category: "scan",
    subCategory: "General Sonography",
    price: 2500,
    discountPrice: 1300,
    description: "High-frequency superficial tissue or localized part ultrasound (chest wall, lipoma, swelling, or single site organ).",
    preparation: "No special preparation needed.",
    duration: "15 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-usg-local-part-bilateral",
    name: "USG Local Part (Bilateral)",
    category: "scan",
    subCategory: "General Sonography",
    price: 3500,
    discountPrice: 2e3,
    description: "Bilateral superficial tissue scan covering paired local body regions or structures.",
    preparation: "No special preparation needed.",
    duration: "20 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-usg-articular-msk",
    name: "Articular joints/MSK joints",
    category: "scan",
    subCategory: "General Sonography",
    price: 2800,
    discountPrice: 1500,
    description: "Musculoskeletal ultrasound scan evaluating joint cartilage, tendons, ligaments, synovium, and soft tissue fluid collections.",
    preparation: "No fasting required.",
    duration: "15-20 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  // --- OBSTETRICS SCANS ---
  {
    id: "scan-obs-1st-trimester",
    name: "1st Trimester",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 2200,
    discountPrice: 1200,
    description: "Early pregnancy ultrasound to confirm intrauterine viability, gestational age, cardiac activity, and single/twin pregnancy.",
    preparation: "Moderate full bladder required.",
    duration: "15 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-obs-2nd-trimester",
    name: "2nd Trimester",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 2200,
    discountPrice: 1200,
    description: "Routine second trimester fetal growth evaluation, placenta location, and amniotic fluid check.",
    preparation: "No fasting required.",
    duration: "15-20 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-obs-routine-trimester",
    name: "Routine Trimester",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 2200,
    discountPrice: 1200,
    description: "Regular antenatal growth and wellbeing scan monitoring fetal parameters, weight estimate, and liquor level.",
    preparation: "No fasting required.",
    duration: "15 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-obs-3d-pregnancy",
    name: "3D Pregnancy",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 3600,
    discountPrice: 2e3,
    description: "Advanced 3D surface rendering volumetric ultrasound of fetus providing realistic facial and physical anatomical visualization.",
    preparation: "No fasting required. Stay hydrated.",
    duration: "20-25 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-obs-nt-scan",
    name: "NT Scan",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 3600,
    discountPrice: 2e3,
    description: "Specialized 11-13.6 week pregnancy scan measuring nuchal translucency and nasal bone for chromosomal abnormality screening.",
    preparation: "Moderately full bladder.",
    duration: "20-30 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-obs-anomaly-scan",
    name: "Anomaly Scan",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 4500,
    discountPrice: 2500,
    description: "Comprehensive detailed level-II anatomical scan done at 18-22 weeks to evaluate organ structures, spine, heart, brain, and limbs.",
    preparation: "No fasting. Eat light meal before scan.",
    duration: "30-40 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-obs-follicular-single",
    name: "Follicular Study (Single)",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 1e3,
    discountPrice: 500,
    description: "Single TVS ultrasound visit to measure ovarian follicle growth, endometrial thickness, and ovulation tracking.",
    preparation: "Empty bladder before procedure.",
    duration: "10 mins",
    reportDelivery: "Immediate (within 30 mins)"
  },
  {
    id: "scan-obs-follicular-package",
    name: "Follicular Study (Package)",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 3600,
    discountPrice: 2e3,
    description: "Package covering multiple serial TVS ultrasound visits throughout menstrual cycle to track follicle maturation and ovulation day.",
    preparation: "Empty bladder before each visit.",
    duration: "Multiple sittings",
    reportDelivery: "Cumulative Report",
    popular: true
  },
  {
    id: "scan-obs-twins-pregnancy",
    name: "Twins Scan (Pregnancy)",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 3600,
    discountPrice: 2e3,
    description: "Specialized antenatal ultrasound growth evaluation for twin (multiple) gestations.",
    preparation: "No fasting required.",
    duration: "25 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-obs-twins-anomaly",
    name: "Twins Scan (Anomaly)",
    category: "scan",
    subCategory: "Obstetric Sonography",
    price: 6e3,
    discountPrice: 3500,
    description: "Detailed level-II anomaly scan evaluating complete anatomical organ structures for twin fetuses.",
    preparation: "No fasting required.",
    duration: "45 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  // --- DOPPLER SCANS ---
  {
    id: "scan-doppler-scrotal",
    name: "Scrotal Doppler",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 3600,
    discountPrice: 2e3,
    description: "Color Doppler ultrasound measuring blood vascular flow in testicular arteries/veins for varicocele, torsion, or ischemia.",
    preparation: "No fasting required.",
    duration: "20 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-doppler-small-part",
    name: "Small Part",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 3200,
    discountPrice: 1800,
    description: "Vascular Doppler study for localized superficial mass, tissue inflammation, or thyroid/gland blood flow.",
    preparation: "No special preparation.",
    duration: "15-20 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-doppler-renal",
    name: "Renal Doppler",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 4500,
    discountPrice: 2500,
    description: "Renal artery Color Doppler to diagnose renal artery stenosis, renovascular hypertension, or transplant kidney perfusion.",
    preparation: "Strict 6-8 hours fasting required.",
    duration: "25 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-doppler-neck-carotid",
    name: "Neck/Carotid Doppler",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 3600,
    discountPrice: 2e3,
    description: "Color Doppler assessment of carotid and vertebral arteries to screen stroke risk, plaque, and vessel stenosis.",
    preparation: "No neck accessories or high collar clothing.",
    duration: "20 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-doppler-obstetric",
    name: "Obstetric Doppler",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 3200,
    discountPrice: 1800,
    description: "Umbilical, Uterine, and Middle Cerebral Artery (MCA) Doppler evaluating fetoplacental blood circulation and IUGR.",
    preparation: "No fasting required.",
    duration: "20 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  {
    id: "scan-doppler-artery-venous-unilateral",
    name: "Artery/Venous Doppler (Unilateral)",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 3600,
    discountPrice: 2e3,
    description: "Color Doppler examination of arterial OR venous system of single upper or lower limb.",
    preparation: "Wear loose clothing.",
    duration: "20-30 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-doppler-artery-venous-bilateral",
    name: "Artery/Venous Doppler (Bilateral)",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 6e3,
    discountPrice: 3500,
    description: "Color Doppler study of arterial OR venous flow in both legs or arms.",
    preparation: "Wear loose clothing.",
    duration: "35-45 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-doppler-art-ven-unilateral",
    name: "Artery + Venous Doppler (Unilateral)",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 6500,
    discountPrice: 3800,
    description: "Combined arterial AND venous vascular Doppler evaluation of single upper or lower limb.",
    preparation: "Wear comfortable loose clothing.",
    duration: "30-40 mins",
    reportDelivery: "Immediate (within 1 hour)"
  },
  {
    id: "scan-doppler-art-ven-bilateral",
    name: "Artery + Venous Doppler (Bilateral)",
    category: "scan",
    subCategory: "Color Doppler Sonography",
    price: 12e3,
    discountPrice: 7e3,
    description: "Full comprehensive combined arterial AND venous Color Doppler scan of both upper or lower limbs.",
    preparation: "Wear loose clothing.",
    duration: "50-60 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  // --- ECHO (CARDIOLOGY) ---
  {
    id: "scan-echo-2d",
    name: "2D-ECHO",
    category: "scan",
    subCategory: "ECHO (Cardiac Sonography)",
    price: 4e3,
    discountPrice: 2200,
    description: "2D Echocardiogram with Color Doppler evaluating heart chamber dimensions, valve function, wall motion, and Ejection Fraction.",
    preparation: "No fasting needed. Wear loose clothing.",
    duration: "15-20 mins",
    reportDelivery: "Immediate (within 30 mins)",
    popular: true
  },
  {
    id: "scan-echo-foetal",
    name: "Foetal ECHO",
    category: "scan",
    subCategory: "ECHO (Cardiac Sonography)",
    price: 5500,
    discountPrice: 3e3,
    description: "Specialized ultrasound examination of fetal heart structures, cardiac chambers, valves, and congenital anomaly screening.",
    preparation: "No fasting required.",
    duration: "30 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  // --- USG GUIDED PROCEDURES ---
  {
    id: "scan-procedure-fnac",
    name: "USG Guided FNAC",
    category: "scan",
    subCategory: "Interventional Sonography",
    price: 5500,
    discountPrice: 3e3,
    description: "Ultrasound-guided fine needle aspiration cytology procedure for precise diagnostic cell sampling of thyroid, breast, or neck lesions.",
    preparation: "Prior doctor prescription & coagulation report (PT/INR) required.",
    duration: "20-30 mins",
    reportDelivery: "24-48 Hours"
  },
  {
    id: "scan-procedure-biopsy",
    name: "USG Guided Biopsy",
    category: "scan",
    subCategory: "Interventional Sonography",
    price: 1e4,
    discountPrice: 6e3,
    description: "Real-time ultrasound-guided tissue core needle biopsy procedure performed by expert Radiologist.",
    preparation: "Fasting 4 hours, doctor referral note, PT-INR & CBC reports mandatory.",
    duration: "30-45 mins",
    reportDelivery: "48-72 Hours"
  },
  // --- LAB / BLOOD TESTS & OFFICIAL ASSURX PATHOLOGY CATALOG ---
  {
    id: "lab-cbc",
    name: "Complete Blood Count (CBC) with ESR",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 500,
    discountPrice: 290,
    description: "Vital screening measuring RBC, WBC, Platelets, Hemoglobin, and ESR.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "Same Day (within 6 hours)",
    parametersCount: 24,
    popular: true
  },
  {
    id: "lab-thyroid",
    name: "Thyroid Profile (T3, T4, Ultra-TSH)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 800,
    discountPrice: 390,
    description: "Measures key thyroid hormones to evaluate thyroid gland activity.",
    preparation: "Fasting preferred.",
    duration: "10 mins",
    reportDelivery: "Same Day",
    parametersCount: 3,
    popular: true
  },
  {
    id: "lab-diabetes",
    name: "Diabetes Screen (HbA1c & Fasting Blood Sugar)",
    category: "lab",
    subCategory: "Diabetic Profiles",
    price: 600,
    discountPrice: 299,
    description: "Combines Blood Sugar Fasting with HbA1c to estimate average glucose.",
    preparation: "8-10 hours fasting required.",
    duration: "10 mins",
    reportDelivery: "Same Day",
    parametersCount: 2,
    popular: true
  },
  {
    id: "lab-lipid",
    name: "Lipid Profile (Cholesterol & Triglycerides)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 900,
    discountPrice: 450,
    description: "Measures Total Cholesterol, HDL, LDL, VLDL, and Triglycerides.",
    preparation: "10-12 hours overnight fasting strictly required.",
    duration: "10 mins",
    reportDelivery: "Same Day",
    parametersCount: 7
  },
  {
    id: "lab-liver-lft",
    name: "Liver Function Test (LFT)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 1100,
    discountPrice: 550,
    description: "Analyzes Bilirubin, SGOT, SGPT, Alkaline Phosphatase, Albumin, Globulin.",
    preparation: "Fasting of 8 hours recommended.",
    duration: "10 mins",
    reportDelivery: "Same Day",
    parametersCount: 11
  },
  {
    id: "lab-kidney-kft",
    name: "Kidney Function Test (KFT / RFT)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 1e3,
    discountPrice: 490,
    description: "Measures Blood Urea, Serum Creatinine, Uric Acid, and Electrolytes.",
    preparation: "Stay hydrated.",
    duration: "10 mins",
    reportDelivery: "Same Day",
    parametersCount: 8
  },
  {
    id: "lab-vitamin-d",
    name: "Vitamin D (25-Hydroxy)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 1500,
    discountPrice: 600,
    description: "Measures Vitamin D concentration in blood via CLIA method.",
    preparation: "Fasting not required.",
    duration: "10 mins",
    reportDelivery: "6 Hours",
    parametersCount: 1,
    popular: true
  },
  {
    id: "lab-vitamin-b12",
    name: "Vitamin B12 (Cobalamin)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 1600,
    discountPrice: 1200,
    description: "Checks levels of Vitamin B12 via CLIA assay.",
    preparation: "Fasting preferred.",
    duration: "10 mins",
    reportDelivery: "8 Hours",
    parametersCount: 1
  },
  {
    id: "lab-urine-routine",
    name: "Urine Routine & Microscopy (URM)",
    category: "lab",
    subCategory: "General Lab Tests",
    price: 250,
    discountPrice: 100,
    description: "Evaluates physical, chemical, and microscopic properties of urine.",
    preparation: "Clean morning urine sample.",
    duration: "5 mins",
    reportDelivery: "6 Hours",
    parametersCount: 18,
    popular: true
  },
  {
    id: "lab-heavy-metals-lead",
    name: "Lead Level - Blood (A344)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 1600,
    discountPrice: 1200,
    description: "ICP-MS quantitative heavy metal evaluation for Lead in EDTA blood sample.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-heavy-metals-mercury",
    name: "Mercury Level - Blood (A344)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 1600,
    discountPrice: 1200,
    description: "ICP-MS heavy metal assessment for Mercury exposure.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-heavy-metals-zinc",
    name: "Zinc Level - Blood (A344)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 1600,
    discountPrice: 1200,
    description: "ICP-MS mineral evaluation of Serum/EDTA Zinc concentration.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-heavy-metals-copper",
    name: "Copper Level - Blood (A228)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 1600,
    discountPrice: 1200,
    description: "ICP-MS analysis of Serum/EDTA Copper level.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-dengue-profile",
    name: "Dengue Profile (NS1, IgG, IgM) (A359)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 1500,
    discountPrice: 1e3,
    description: "Rapid Card screening for Dengue NS1 Antigen, IgG and IgM Antibodies.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours",
    popular: true
  },
  {
    id: "lab-insulin-serum",
    name: "Insulin - Fasting / Random (A344)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1e3,
    discountPrice: 600,
    description: "CLIA quantitative evaluation of Serum Insulin levels.",
    preparation: "Fasting 8-10 hours required for Fasting Insulin.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-electrolytes-sodium",
    name: "Serum Sodium (A51)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 250,
    discountPrice: 169,
    description: "Ion Selective Electrode measurement of Serum Sodium.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-electrolytes-potassium",
    name: "Serum Potassium (A81)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 250,
    discountPrice: 169,
    description: "Ion Selective Electrode assay for Serum Potassium.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-acth-hormone",
    name: "ACTH - Adrenocorticotropic Hormone (A89)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1500,
    discountPrice: 1100,
    description: "CLIA assessment of pituitary ACTH hormone concentration.",
    preparation: "Morning blood sample preferred.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-amh-hormone",
    name: "AMH - Anti-Mullerian Hormone (A82)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 2500,
    discountPrice: 1800,
    description: "CLIA quantitative evaluation of ovarian reserve and fertility potential.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours",
    popular: true
  },
  {
    id: "lab-ana-autoantibody",
    name: "ANA - Anti-Nuclear Antibody (A220)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 1e3,
    discountPrice: 700,
    description: "CLIA autoimmune antibody screening for Lupus, RA, and connective tissue disorders.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-anti-tpo",
    name: "Anti-TPO Thyroid Antibodies (A68)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1750,
    discountPrice: 1100,
    description: "CLIA evaluation for Hashimoto thyroiditis and autoimmune thyroid diseases.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-anti-ccp",
    name: "Anti-CCP Antibody (A222)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 1700,
    discountPrice: 1200,
    description: "CLIA specific marker for early and aggressive Rheumatoid Arthritis.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-allergy-full-panel",
    name: "Allergy Full Panel (Food + Inhalant + Drug + Non-Veg) (A255)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 2e4,
    discountPrice: 1e4,
    description: "Comprehensive 100+ allergen screening covering food, dust, pollen, drugs, and non-veg proteins.",
    preparation: "No fasting required.",
    duration: "15 mins",
    reportDelivery: "72 Hours",
    popular: true
  },
  {
    id: "lab-allergy-food-panel",
    name: "Allergy Panel - Food (A250)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 9e3,
    discountPrice: 3800,
    description: "Serum allergy screening for common food allergens, gluten, dairy, nuts, and spices.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "72 Hours"
  },
  {
    id: "lab-afp-tumor-marker",
    name: "Alpha-Fetoprotein (AFP) Tumor Marker (A99)",
    category: "lab",
    subCategory: "Tumor Markers",
    price: 1200,
    discountPrice: 800,
    description: "CLIA tumor marker screening for liver, germ cell, and testicular neoplasms.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "8 Hours"
  },
  {
    id: "lab-ca-125",
    name: "CA 125 Ovarian Tumor Marker (A95)",
    category: "lab",
    subCategory: "Tumor Markers",
    price: 1e3,
    discountPrice: 750,
    description: "CLIA diagnostic marker for ovarian cancer screening and monitoring.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-ca-19-9",
    name: "CA 19-9 Pancreatic & GI Marker (A96)",
    category: "lab",
    subCategory: "Tumor Markers",
    price: 1e3,
    discountPrice: 750,
    description: "CLIA screening for pancreatic, gallbladder, and gastrointestinal cancers.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-cea-marker",
    name: "CEA - Carcinoembryonic Antigen (A98)",
    category: "lab",
    subCategory: "Tumor Markers",
    price: 1200,
    discountPrice: 800,
    description: "CLIA broad-spectrum tumor marker for colorectal and GI tract cancers.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-beta-hcg",
    name: "Beta-hCG Total Quantitative (A92)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1e3,
    discountPrice: 800,
    description: "CLIA pregnancy confirmation and gestational age measurement.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours",
    popular: true
  },
  {
    id: "lab-double-marker-fmf",
    name: "Double Marker 1st Trimester (FMF Certified) (A420)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 4e3,
    discountPrice: 2500,
    description: "FMF certified 8-13 week maternal screening for Down syndrome risk assessment.",
    preparation: "Ultrasound NT scan report required.",
    duration: "10 mins",
    reportDelivery: "48 Hours"
  },
  {
    id: "lab-esr-westergren",
    name: "ESR - Erythrocyte Sedimentation Rate (A06)",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 200,
    discountPrice: 100,
    description: "Modified Westergren method evaluating systemic inflammation and infection.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-ferritin-serum",
    name: "Serum Ferritin (A35)",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 1e3,
    discountPrice: 650,
    description: "CLIA iron storage level measurement for anemia or iron overload evaluation.",
    preparation: "Fasting preferred.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-folic-acid",
    name: "Folate / Vitamin B9 (A93)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 1300,
    discountPrice: 1e3,
    description: "CLIA assessment of Serum Folate concentration for megaloblastic anemia.",
    preparation: "8 hours fasting preferred.",
    duration: "10 mins",
    reportDelivery: "8 Hours"
  },
  {
    id: "lab-fsh-lh-prl",
    name: "FSH - Follicle Stimulating Hormone (A76)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 600,
    discountPrice: 400,
    description: "CLIA evaluation of pituitary FSH for fertility, PCOS, and menstrual cycle.",
    preparation: "Day 2-5 of menstrual cycle preferred.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-lh-hormone",
    name: "LH - Luteinizing Hormone (A121)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 600,
    discountPrice: 350,
    description: "CLIA measurement of LH for ovulation timing and reproductive hormone health.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-prolactin",
    name: "Prolactin (A169)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1e3,
    discountPrice: 500,
    description: "CLIA evaluation of pituitary Prolactin level for hyperprolactinemia.",
    preparation: "Morning sample 2 hours after waking up.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-progesterone",
    name: "Progesterone (A37)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1e3,
    discountPrice: 600,
    description: "CLIA luteal phase progesterone measurement for ovulation check.",
    preparation: "Day 21 of menstrual cycle preferred.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-testosterone-total",
    name: "Testosterone Total (A63)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1e3,
    discountPrice: 600,
    description: "Measurement of total testosterone for androgenic health.",
    preparation: "Morning fasting blood sample.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-psa-prostate",
    name: "PSA - Prostate Specific Antigen (A71)",
    category: "lab",
    subCategory: "Tumor Markers",
    price: 1e3,
    discountPrice: 550,
    description: "CLIA screening for prostate health and prostate cancer risk in men.",
    preparation: "Avoid heavy exercise 24 hours prior.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-pt-inr",
    name: "PT / INR Prothrombin Time (A422)",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 400,
    discountPrice: 250,
    description: "Photo optical clot detection measuring blood coagulation time and INR.",
    preparation: "No special fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-ra-factor",
    name: "Rheumatoid Factor (RF Quantitative) (A126)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 600,
    discountPrice: 450,
    description: "Immunoturbidimetry quantitative test for Rheumatoid Arthritis.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-torch-panel-8",
    name: "TORCH Panel (All 8 Tests) (A55)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 3500,
    discountPrice: 2500,
    description: "Complete IgG & IgM antibody screening for Toxoplasma, Rubella, CMV, and HSV 1&2 in pregnancy.",
    preparation: "No fasting required.",
    duration: "15 mins",
    reportDelivery: "18 Hours",
    popular: true
  },
  {
    id: "lab-widal-typhoid",
    name: "Widal Test for Typhoid (A430)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 300,
    discountPrice: 200,
    description: "Slide & tube agglutination screening for Salmonella Typhi antibodies.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-super-healthy-diamond",
    name: "Super Healthy Profile Diamond (122 Tests) (A166)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 4e3,
    discountPrice: 2e3,
    description: "Full body master health checkup covering 122 bio-markers including CBC, LFT, KFT, Lipid, Thyroid, HbA1c, Electrolytes, Vitamins.",
    preparation: "10-12 hours fasting mandatory.",
    duration: "15 mins",
    reportDelivery: "18 Hours",
    popular: true
  },
  {
    id: "lab-super-healthy-gold",
    name: "Super Healthy Profile Gold (47 Tests) (A151)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 2e3,
    discountPrice: 1200,
    description: "Essential full body health package with 47 parameters.",
    preparation: "10-12 hours fasting mandatory.",
    duration: "15 mins",
    reportDelivery: "18 Hours"
  },
  {
    id: "lab-sports-fitness-advanced",
    name: "Sports Fitness Advanced (143 Tests) (A242)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 1e4,
    discountPrice: 7e3,
    description: "Ultra comprehensive athletic, cardiac, metabolic, and muscle recovery profile.",
    preparation: "10-12 hours fasting mandatory.",
    duration: "15 mins",
    reportDelivery: "24 Hours"
  },
  {
    id: "lab-ada-ascitic-fluid",
    name: "Adenosine Deaminase (ADA) - Ascitic Fluid (A258)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 950,
    discountPrice: 500,
    description: "Photometry assay of ADA in Ascitic Fluid to screen abdominal tuberculosis.",
    preparation: "Doctor referral required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-ada-csf",
    name: "Adenosine Deaminase (ADA) - CSF (A264)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 950,
    discountPrice: 500,
    description: "Photometry measurement of ADA level in Cerebrospinal Fluid (CSF).",
    preparation: "Clinical procedure required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-ada-pleural",
    name: "Adenosine Deaminase (ADA) - Pleural Fluid (A262)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 950,
    discountPrice: 500,
    description: "Photometry assessment of Pleural Fluid ADA for tubercular pleurisy.",
    preparation: "Clinical sample required.",
    duration: "10 mins",
    reportDelivery: "8 Hours"
  },
  {
    id: "lab-ada-synovial",
    name: "Adenosine Deaminase (ADA) - Synovial Fluid (A263)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 950,
    discountPrice: 500,
    description: "Photometry evaluation of Synovial Fluid ADA.",
    preparation: "Clinical sample required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-acetylcholine-receptor",
    name: "Acetylcholine Receptor Autoantibody (A189)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 4e3,
    discountPrice: 2800,
    description: "Non-Isotopic Assay for Myasthenia Gravis diagnosis.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "72 Hours"
  },
  {
    id: "lab-afb-smear-zn",
    name: "AFB Smear (Z-N Stain) (A259)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 500,
    discountPrice: 300,
    description: "Microscopic Ziehl-Neelsen stain evaluation for Acid-Fast Bacilli (TB).",
    preparation: "Early morning deep cough sputum sample.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-sgpt-alt",
    name: "Alanine Transaminase (SGPT / ALT) (A41)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 200,
    discountPrice: 149,
    description: "Photometry measurement of SGPT liver enzyme activity.",
    preparation: "Fasting preferred.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-sgot-ast",
    name: "Aspartate Aminotransferase (SGOT / AST) (A40)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 200,
    discountPrice: 150,
    description: "Photometry evaluation of SGOT cardiac and hepatic tissue enzyme.",
    preparation: "Fasting preferred.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-albumin-serum",
    name: "Albumin - Serum (A44)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 200,
    discountPrice: 150,
    description: "BCG method quantitative analysis of Serum Albumin level.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-alkaline-phosphatase",
    name: "Alkaline Phosphatase (ALP) (A42)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 200,
    discountPrice: 150,
    description: "Modified IFCC method measuring ALP enzyme for liver and bone health.",
    preparation: "Fasting preferred.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-allergy-drug",
    name: "Allergy Panel - Drug (A249)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 9e3,
    discountPrice: 3500,
    description: "Serum allergy screening for common pharmaceutical and antibiotic sensitivities.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "72 Hours"
  },
  {
    id: "lab-allergy-inhalant",
    name: "Allergy Panel - Inhalant (A251)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 8e3,
    discountPrice: 3200,
    description: "Serum allergy panel testing airborne dust mites, pollens, fungi, and pet dander.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "72 Hours"
  },
  {
    id: "lab-allergy-nonveg",
    name: "Allergy Panel - Non Veg (A254)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 7e3,
    discountPrice: 2900,
    description: "Serum allergy panel testing egg, fish, chicken, mutton, and seafood proteins.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "72 Hours"
  },
  {
    id: "lab-amino-acid-profile",
    name: "Amino Acid Profile (35 Parameters) (A373)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 3e3,
    discountPrice: 2e3,
    description: "LC-MS/MS advanced screening for inborn errors of metabolism and amino acid disorders.",
    preparation: "10-12 hours fasting required.",
    duration: "15 mins",
    reportDelivery: "24 Hours"
  },
  {
    id: "lab-amylase-serum",
    name: "Amylase - Serum (A393)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 500,
    discountPrice: 350,
    description: "Enzymatic Colorimetric Test measuring pancreatic Amylase enzyme in blood.",
    preparation: "Fasting of 8 hours recommended.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-anemia-profile-basic",
    name: "Anemia Profile - Basic (69 Tests) (A374)",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 3500,
    discountPrice: 2500,
    description: "Comprehensive screening for iron deficiency, megaloblastic, and hemolytic anemia.",
    preparation: "Overnight fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours",
    popular: true
  },
  {
    id: "lab-anemia-profile-advanced",
    name: "Anemia Profile - Advanced (102 Tests) (A383)",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 6e3,
    discountPrice: 4500,
    description: "Master anemia diagnostic panel covering 102 biomarkers including hemoglobin variants and iron studies.",
    preparation: "Overnight fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-anti-chlamydia-igg",
    name: "Anti Chlamydia Antibody IgG (A115)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 800,
    discountPrice: 400,
    description: "ELISA screening for Chlamydia trachomatis past or chronic infection.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "32 Hours"
  },
  {
    id: "lab-anti-chlamydia-igm",
    name: "Anti Chlamydia Antibody IgM (A152)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 800,
    discountPrice: 400,
    description: "ELISA detection of active acute Chlamydia infection antibodies.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "32 Hours"
  },
  {
    id: "lab-anti-dsdna",
    name: "Anti-dsDNA Antibody (A269)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 1200,
    discountPrice: 800,
    description: "ELISA specific confirmatory biomarker for Systemic Lupus Erythematosus (SLE).",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "24 Hours"
  },
  {
    id: "lab-apolipoprotein-a1-b",
    name: "Apolipoprotein A1 & B (A102/A104)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 1560,
    discountPrice: 1200,
    description: "Immunoturbidimetry ratio measurement evaluating atherogenic risk and heart disease profile.",
    preparation: "10-12 hours fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-arthritis-profile-basic",
    name: "Arthritis Profile - Basic (A388)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 5e3,
    discountPrice: 2800,
    description: "Joint pain diagnostic profile including RA Factor, Uric Acid, CRP, ESR, and CBC.",
    preparation: "Fasting preferred.",
    duration: "10 mins",
    reportDelivery: "24 Hours"
  },
  {
    id: "lab-arthritis-profile-advanced",
    name: "Arthritis Profile - Advanced (A389)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 6e3,
    discountPrice: 4200,
    description: "Master joint inflammation panel covering Anti-CCP, ANA, RA Factor, CRP, Uric Acid, Calcium, and Phosphorus.",
    preparation: "Fasting preferred.",
    duration: "15 mins",
    reportDelivery: "24 Hours"
  },
  {
    id: "lab-beta-2-microglobulin",
    name: "Beta-2 Microglobulin (A100)",
    category: "lab",
    subCategory: "Tumor Markers",
    price: 1200,
    discountPrice: 800,
    description: "ELISA tumor marker evaluating multiple myeloma, lymphoma, and renal tubular function.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-blood-glucose-fasting",
    name: "Blood Glucose - Fasting (A26)",
    category: "lab",
    subCategory: "Diabetic Profiles",
    price: 150,
    discountPrice: 50,
    description: "GOD-POD enzymatic plasma glucose estimation after 8-10 hours fasting.",
    preparation: "Strict 8-10 hours overnight fasting required.",
    duration: "5 mins",
    reportDelivery: "3 Hours",
    popular: true
  },
  {
    id: "lab-blood-glucose-pp",
    name: "Blood Glucose - Postprandial (PP) (A27)",
    category: "lab",
    subCategory: "Diabetic Profiles",
    price: 150,
    discountPrice: 50,
    description: "GOD-POD enzymatic plasma glucose estimation exactly 2 hours post meal.",
    preparation: "Blood sample 2 hours after breakfast/meal.",
    duration: "5 mins",
    reportDelivery: "3 Hours"
  },
  {
    id: "lab-rbs-glucose",
    name: "Random Blood Glucose (RBS) (A23)",
    category: "lab",
    subCategory: "Diabetic Profiles",
    price: 150,
    discountPrice: 50,
    description: "GOD-POD enzymatic instant random blood sugar test.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-blood-grouping",
    name: "Blood Grouping & Rh Typing (A192)",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 200,
    discountPrice: 100,
    description: "Agglutination method determination of ABO blood group and Rh factor D positivity.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-bun-blood-urea",
    name: "Blood Urea Nitrogen (BUN) (A47)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 200,
    discountPrice: 150,
    description: "Calculated BUN assay evaluating renal clearance and protein breakdown.",
    preparation: "Stay hydrated.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-calcium-serum",
    name: "Calcium - Serum (A30)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 250,
    discountPrice: 150,
    description: "Photometry quantitative measurement of total serum Calcium.",
    preparation: "Fasting preferred.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-calcitonin",
    name: "Calcitonin (A74)",
    category: "lab",
    subCategory: "Tumor Markers",
    price: 1e3,
    discountPrice: 650,
    description: "CLIA thyroid C-cell tumor marker for medullary thyroid carcinoma.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-chikungunya-ab",
    name: "Chikungunya IgM/IgG Antibody (A127)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 1200,
    discountPrice: 600,
    description: "Immunoassay screening for acute or previous Chikungunya viral fever.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-cpk-ck-total",
    name: "Creatine Phosphokinase (CK / CPK Total) (A39)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 500,
    discountPrice: 300,
    description: "DGKC method enzyme marker for muscle dystrophy, injury, or cardiac strain.",
    preparation: "Avoid strenuous physical activity prior to test.",
    duration: "5 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-ck-mb-cardiac",
    name: "CK-MB Cardiac Isoenzyme (A116)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 1200,
    discountPrice: 700,
    description: "CLIA specific cardiac biomarker for myocardial ischemia evaluation.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-d-dimer-coagulation",
    name: "D-Dimer (A38)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 1500,
    discountPrice: 1e3,
    description: "CLIA fibrin degradation fragment assay to rule out DVT, pulmonary embolism, or DIC.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-dheas-adrenal",
    name: "Dehydroepiandrosterone Sulfate (DHEAS) (A83)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 2e3,
    discountPrice: 1200,
    description: "CLIA adrenal androgen evaluation for hirsutism, PCOS, and adrenal tumors.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-diabetic-profile-platinum",
    name: "Diabetic Profile - Platinum (48 Tests) (A376)",
    category: "lab",
    subCategory: "Diabetic Profiles",
    price: 2e3,
    discountPrice: 1200,
    description: "Master diabetes monitoring panel including HbA1c, Fasting & PP Glucose, Lipid Profile, KFT, and Urine Microalbumin.",
    preparation: "10 hours overnight fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-diabetic-profile-diamond",
    name: "Diabetic Profile - Diamond (52 Tests) (A377)",
    category: "lab",
    subCategory: "Diabetic Profiles",
    price: 3e3,
    discountPrice: 2e3,
    description: "Advanced diabetic organ complication screener with 52 bio-markers.",
    preparation: "10 hours overnight fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-hba1c-hplc",
    name: "HbA1c (HPLC Method with Graph) (A204)",
    category: "lab",
    subCategory: "Diabetic Profiles",
    price: 750,
    discountPrice: 450,
    description: "Gold-standard NGSP-certified HPLC method for 3-month average blood glucose.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours",
    popular: true
  },
  {
    id: "lab-hbsag-hepatitis-b",
    name: "HBsAg (Hepatitis B Surface Antigen) (A182)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 800,
    discountPrice: 500,
    description: "CLIA diagnostic screening for active Hepatitis B viral infection.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-hcv-hepatitis-c",
    name: "Hepatitis C Virus (HCV Antibody) (A113)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 800,
    discountPrice: 500,
    description: "CLIA diagnostic screening for Hepatitis C antibodies.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-hiv-western-blot",
    name: "HIV - Western Blot Confirmatory (A94)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 5e3,
    discountPrice: 3e3,
    description: "Paper Chromatography confirmatory test for HIV 1 & 2 infection.",
    preparation: "Doctor referral required.",
    duration: "15 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-hla-b27-pcr",
    name: "HLA B27 Qualitative PCR (A103)",
    category: "lab",
    subCategory: "Allergy & Autoimmune",
    price: 5e3,
    discountPrice: 2400,
    description: "Real-time PCR genetic assay for Ankylosing Spondylitis and autoimmune arthritis.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "80 Hours"
  },
  {
    id: "lab-homocysteine",
    name: "Homocysteine (A212)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 1500,
    discountPrice: 1e3,
    description: "Photometry assay evaluating vascular stroke, thrombosis, and cardiac risk.",
    preparation: "10 hours fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-hs-crp",
    name: "hs-CRP (High Sensitivity C-Reactive Protein) (A210)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 700,
    discountPrice: 500,
    description: "CLIA high-sensitivity marker for cardiac vascular inflammation.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-pth-parathyroid",
    name: "INTACT Parathyroid Hormone (PTH) (A34)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1600,
    discountPrice: 1200,
    description: "CLIA assessment of PTH for calcium metabolism and parathyroid disease.",
    preparation: "Morning blood sample preferred.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-iron-deficiency-profile",
    name: "Iron Deficiency Profile (Serum Iron, TIBC, Ferritin) (A418)",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 800,
    discountPrice: 600,
    description: "Complete iron panel measuring Serum Iron, TIBC, UIBC, and Ferritin.",
    preparation: "Fasting preferred.",
    duration: "10 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-kidney-profile-full",
    name: "Kidney Profile Full (14 Tests) (A312)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 2e3,
    discountPrice: 1400,
    description: "Comprehensive renal evaluation measuring Urea, Creatinine, Uric Acid, BUN, Sodium, Potassium, Chloride, Calcium, and Phosphorus.",
    preparation: "Stay hydrated.",
    duration: "10 mins",
    reportDelivery: "8 Hours"
  },
  {
    id: "lab-ldh-total",
    name: "Lactate Dehydrogenase (LDH) (A57)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 500,
    discountPrice: 300,
    description: "Photometry measurement of tissue LDH enzyme for tissue breakdown monitoring.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-lipid-profile-full",
    name: "Lipid Profile Full (A174)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 700,
    discountPrice: 500,
    description: "Complete lipid profile evaluating Cholesterol, HDL, LDL, VLDL, Triglycerides, and Risk Ratios.",
    preparation: "12 hours overnight fasting strictly required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-lft-liver-full",
    name: "Liver Function Test (LFT Full) (A199)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 950,
    discountPrice: 450,
    description: "Complete liver panel measuring Bilirubin Total/Direct/Indirect, SGOT, SGPT, ALP, Total Protein, Albumin, and Globulin.",
    preparation: "Fasting 8 hours recommended.",
    duration: "10 mins",
    reportDelivery: "6 Hours",
    popular: true
  },
  {
    id: "lab-magnesium-serum",
    name: "Magnesium - Serum (A49)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 750,
    discountPrice: 500,
    description: "Photometry quantitative measurement of Serum Magnesium.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-malaria-antigen-mpda",
    name: "Malaria Antigen Detection (Rapid Card / MPDA) (A389)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 550,
    discountPrice: 450,
    description: "Rapid immunochromatographic card detection for P. falciparum and P. vivax.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours",
    popular: true
  },
  {
    id: "lab-mantoux-test",
    name: "Mantoux Test (Tuberculin Skin Test) (A09)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 500,
    discountPrice: 250,
    description: "Intradermal tuberculin injection with reading after 48-72 hours for TB exposure.",
    preparation: "Requires in-center visit for injection & 48-72h reading.",
    duration: "15 mins",
    reportDelivery: "48-72 Hours"
  },
  {
    id: "lab-measles-igg-igm",
    name: "Measles IgG / IgM Antibody (A424/A425)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 1e3,
    discountPrice: 650,
    description: "ELISA screening for Rubeola (Measles) viral immunity and active infection.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-mumps-igg-igm",
    name: "Mumps IgG / IgM Antibody (A118/A172)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 1e3,
    discountPrice: 800,
    description: "ELISA screening for Mumps viral antibodies.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "8 Hours"
  },
  {
    id: "lab-occult-blood-urine",
    name: "Occult Blood Test - Urine (A385)",
    category: "lab",
    subCategory: "General Lab Tests",
    price: 500,
    discountPrice: 200,
    description: "Rapid assay screening for microscopic hematuria in urine.",
    preparation: "Fresh morning urine sample.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-pap-smear",
    name: "PAP Smear (Cervical Cytology) (A07)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 1e3,
    discountPrice: 600,
    description: "Microscopic cervical smear screening for precancerous lesions and dysplastic cells.",
    preparation: "Avoid douching 48 hours prior.",
    duration: "15 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-phosphorus-serum",
    name: "Phosphorus - Serum (A164)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 250,
    discountPrice: 200,
    description: "Photometry quantitative analysis of Serum Inorganic Phosphorus.",
    preparation: "Fasting preferred.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-progesterone-serum",
    name: "Progesterone (A37)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1e3,
    discountPrice: 600,
    description: "CLIA luteal phase progesterone assay evaluating ovulation status.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-quadruple-marker",
    name: "Quadruple Marker 2nd Trimester (14-22 Weeks) (A12)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 4500,
    discountPrice: 3250,
    description: "Maternal serum screening measuring AFP, hCG, uE3, and Inhibin-A for fetal neural tube and chromosomal risk.",
    preparation: "Ultrasound gestational age report required.",
    duration: "10 mins",
    reportDelivery: "48 Hours"
  },
  {
    id: "lab-rubella-igg-igm",
    name: "Rubella IgG / IgM Antibody (A280/A133)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 600,
    discountPrice: 320,
    description: "ELISA screening for German Measles (Rubella) immunity in antenatal care.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-semen-analysis",
    name: "Semen Analysis (A344)",
    category: "lab",
    subCategory: "Heavy Metals & Special",
    price: 1e3,
    discountPrice: 700,
    description: "Microscopic evaluation of sperm count, motility, morphology, and liquefaction time.",
    preparation: "Abstinence of 3-5 days strictly required.",
    duration: "20 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-shbg-hormone",
    name: "Sex Hormone Binding Globulin (SHBG) (A398)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 1500,
    discountPrice: 1e3,
    description: "CLIA measurement of SHBG binding protein for free testosterone calculation.",
    preparation: "Morning blood sample.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-smokers-panel-basic",
    name: "Smokers Panel - Basic (A415)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 3500,
    discountPrice: 2500,
    description: "Targeted health screening for smokers evaluating CBC, Lipid, Carboxyhemoglobin, and Vitamin C/D.",
    preparation: "10 hours fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-sports-fitness-gold",
    name: "Sports Fitness - Gold (92 Tests) (A156)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 2700,
    discountPrice: 2e3,
    description: "Comprehensive athlete fitness panel covering metabolic, muscle, liver, renal, and vitamin profiles.",
    preparation: "10 hours fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-tb-gold-igra",
    name: "TB Gold (QuantiFERON IGRA) (A107)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 4500,
    discountPrice: 4e3,
    description: "Interferon Gamma Release Assay (IGRA) blood test for latent Mycobacterium tuberculosis.",
    preparation: "Special blood collection tubes.",
    duration: "15 mins",
    reportDelivery: "72 Hours",
    popular: true
  },
  {
    id: "lab-thyroid-profile-t3-t4-tsh",
    name: "Thyroid Profile Total (T3, T4, TSH) (A37)",
    category: "lab",
    subCategory: "Hormone Assays",
    price: 700,
    discountPrice: 600,
    description: "CLIA quantitative measurement of Total T3, Total T4, and TSH.",
    preparation: "Morning sample preferred.",
    duration: "5 mins",
    reportDelivery: "6 Hours",
    popular: true
  },
  {
    id: "lab-total-cholesterol",
    name: "Total Cholesterol (A133)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 200,
    discountPrice: 130,
    description: "Photometry measurement of serum total cholesterol concentration.",
    preparation: "10-12 hours fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-total-protein-albumin-globulin",
    name: "Total Protein & Albumin / Globulin Ratio (A183)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 200,
    discountPrice: 150,
    description: "Photometry measurement of Serum Total Protein, Albumin, Globulin, and A/G Ratio.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-transferrin-serum",
    name: "Transferrin (A58)",
    category: "lab",
    subCategory: "General Blood Tests",
    price: 1e3,
    discountPrice: 600,
    description: "Nephelometry measurement of iron transport protein Transferrin.",
    preparation: "Fasting preferred.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-troponin-i-quantitative",
    name: "Troponin-I (Quantitative Cardiac Marker) (A72)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 1500,
    discountPrice: 1e3,
    description: "CLIA high-sensitivity Troponin-I assay to rule out acute myocardial infarction.",
    preparation: "Emergency biomarker, no fasting.",
    duration: "10 mins",
    reportDelivery: "6 Hours",
    popular: true
  },
  {
    id: "lab-troponin-t-quantitative",
    name: "Troponin-T (Quantitative Cardiac Marker) (A38)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 1200,
    discountPrice: 1e3,
    description: "CLIA quantitative measurement of Cardiac Troponin-T.",
    preparation: "Emergency biomarker.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-typhi-dot-igm-igg",
    name: "Typhi Dot IgM/IgG (A179)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 450,
    discountPrice: 300,
    description: "ELISA screening for Outer Membrane Protein (OMP) antibodies of Salmonella Typhi.",
    preparation: "No fasting required.",
    duration: "10 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-uric-acid-serum",
    name: "Serum Uric Acid (A173)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 250,
    discountPrice: 150,
    description: "Photometry quantitative measurement of Serum Uric Acid for Gout and kidney screening.",
    preparation: "Fasting preferred.",
    duration: "5 mins",
    reportDelivery: "72 Hours"
  },
  {
    id: "lab-vdrl-syphilis",
    name: "VDRL / Syphilis Flocculation Test (A337)",
    category: "lab",
    subCategory: "Infectious Diseases",
    price: 400,
    discountPrice: 250,
    description: "Flocculation screening test for Treponema pallidum / Syphilis antibody.",
    preparation: "No fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-vitamin-a-lcms",
    name: "Vitamin A (Retinol) (A338)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 2500,
    discountPrice: 1850,
    description: "LC-MS/MS precision measurement of Serum Vitamin A.",
    preparation: "10 hours fasting required.",
    duration: "10 mins",
    reportDelivery: "8 Hours"
  },
  {
    id: "lab-vitamin-e-lcms",
    name: "Vitamin E (Tocopherol) (A123)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 2200,
    discountPrice: 1850,
    description: "LC-MS/MS measurement of Serum Vitamin E antioxidant level.",
    preparation: "10 hours fasting required.",
    duration: "10 mins",
    reportDelivery: "8 Hours"
  },
  {
    id: "lab-vitamin-k-lcms",
    name: "Vitamin K (Phylloquinone) (A431)",
    category: "lab",
    subCategory: "Vitamins & Minerals",
    price: 2200,
    discountPrice: 1850,
    description: "LC-MS/MS assay for Vitamin K level.",
    preparation: "10 hours fasting required.",
    duration: "10 mins",
    reportDelivery: "8 Hours"
  },
  {
    id: "lab-vldl-cholesterol",
    name: "VLDL Cholesterol (A429)",
    category: "lab",
    subCategory: "Cardiac Markers",
    price: 200,
    discountPrice: 129,
    description: "Photometry calculation of Very Low-Density Lipoprotein Cholesterol.",
    preparation: "12 hours fasting required.",
    duration: "5 mins",
    reportDelivery: "6 Hours"
  },
  {
    id: "lab-winter-profile-gold",
    name: "Winter Profile - GOLD (68 Tests) (A386)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 1800,
    discountPrice: 1200,
    description: "Seasonal winter health screener for immunity, viral fever, CBC, Vitamin D, and Lipid.",
    preparation: "10 hours fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-winter-profile-diamond",
    name: "Winter Profile - DIAMOND (101 Tests) (A387)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 3e3,
    discountPrice: 2e3,
    description: "Master winter profile covering 101 parameters including full organ screeners and immunity markers.",
    preparation: "10 hours fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-women-basic-profile",
    name: "Women Basic Profile (A133)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 3e3,
    discountPrice: 1700,
    description: "Tailored health checkup for women evaluating CBC, Thyroid, Calcium, Iron, and Urine Routine.",
    preparation: "10 hours fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours"
  },
  {
    id: "lab-women-advanced-profile",
    name: "Women Advanced Profile (A302)",
    category: "lab",
    subCategory: "Organ Screeners",
    price: 3500,
    discountPrice: 2200,
    description: "Comprehensive wellness profile for women including hormones (FSH, LH, Prolactin), Thyroid, Vitamins, and Bone Density markers.",
    preparation: "10 hours fasting required.",
    duration: "15 mins",
    reportDelivery: "12 Hours",
    popular: true
  },
  // --- X-RAY ---
  {
    id: "scan-xray-chest",
    name: "Digital X-Ray Chest PA View",
    category: "scan",
    subCategory: "X-Ray (Digital Radiography)",
    price: 600,
    discountPrice: 350,
    description: "High-resolution digital chest X-Ray for lung, cardiac, and mediastinal evaluation. Detects pneumonia, TB, pleural effusion, and cardiomegaly.",
    preparation: "Remove metallic jewelry and clothing above the waist. Wear hospital gown.",
    duration: "5-10 mins",
    reportDelivery: "Immediate (within 30 mins)",
    popular: true
  },
  {
    id: "scan-xray-spine",
    name: "Digital X-Ray Spine (Cervical/Lumbar)",
    category: "scan",
    subCategory: "X-Ray (Digital Radiography)",
    price: 800,
    discountPrice: 450,
    description: "Digital AP and Lateral radiographic views of cervical or lumbosacral spine for disc disease, spondylosis, and fractures.",
    preparation: "Remove metallic accessories. No special fasting.",
    duration: "10 mins",
    reportDelivery: "Immediate (within 30 mins)"
  },
  {
    id: "scan-xray-joint",
    name: "Digital X-Ray Joint (Knee/Shoulder/Wrist)",
    category: "scan",
    subCategory: "X-Ray (Digital Radiography)",
    price: 600,
    discountPrice: 350,
    description: "Digital radiography for single joint evaluation \u2014 arthritis, fracture, dislocation, and bone deformity assessment.",
    preparation: "Remove metallic items from the area.",
    duration: "5-10 mins",
    reportDelivery: "Immediate (within 30 mins)"
  },
  {
    id: "scan-xray-abdomen",
    name: "Digital X-Ray Abdomen",
    category: "scan",
    subCategory: "X-Ray (Digital Radiography)",
    price: 700,
    discountPrice: 400,
    description: "Abdominal X-Ray for bowel obstruction, kidney stones, free gas under diaphragm, and calcifications.",
    preparation: "No special preparation.",
    duration: "5-10 mins",
    reportDelivery: "Immediate (within 30 mins)"
  },
  // --- CT SCAN ---
  {
    id: "scan-ct-brain",
    name: "CT Scan Brain (Plain)",
    category: "scan",
    subCategory: "CT Scan (Computed Tomography)",
    price: 5e3,
    discountPrice: 3e3,
    description: "Non-contrast computed tomography of the brain to evaluate stroke, hemorrhage, tumors, head injury, and hydrocephalus.",
    preparation: "No fasting for plain CT. Remove hair clips and earrings.",
    duration: "15-20 mins",
    reportDelivery: "2-4 Hours",
    popular: true
  },
  {
    id: "scan-ct-chest",
    name: "CT Scan Chest (HRCT)",
    category: "scan",
    subCategory: "CT Scan (Computed Tomography)",
    price: 6e3,
    discountPrice: 3500,
    description: "High-Resolution CT of thorax for interstitial lung disease, COVID sequelae, pulmonary fibrosis, and mediastinal pathology.",
    preparation: "Fasting 4 hours if contrast may be needed. Remove metallic accessories.",
    duration: "20 mins",
    reportDelivery: "2-4 Hours",
    popular: true
  },
  {
    id: "scan-ct-abdomen",
    name: "CT Scan Abdomen & Pelvis",
    category: "scan",
    subCategory: "CT Scan (Computed Tomography)",
    price: 8e3,
    discountPrice: 5e3,
    description: "Comprehensive abdominal and pelvic CT for liver, kidney, pancreatic, bowel, and adnexal pathology evaluation.",
    preparation: "Fasting 6 hours. Drink oral contrast as instructed. Creatinine report required.",
    duration: "25-30 mins",
    reportDelivery: "4-6 Hours"
  },
  // --- MRI ---
  {
    id: "scan-mri-brain",
    name: "MRI Brain (Plain)",
    category: "scan",
    subCategory: "MRI (Magnetic Resonance Imaging)",
    price: 8e3,
    discountPrice: 5e3,
    description: "High-field 1.5T MRI of brain for demyelination, tumors, infarcts, vascular malformations, and epilepsy evaluation.",
    preparation: "No metallic implants allowed. Remove all metallic items. No fasting needed.",
    duration: "30-45 mins",
    reportDelivery: "4-6 Hours",
    popular: true
  },
  {
    id: "scan-mri-spine",
    name: "MRI Spine (Cervical/Lumbar)",
    category: "scan",
    subCategory: "MRI (Magnetic Resonance Imaging)",
    price: 8e3,
    discountPrice: 5e3,
    description: "MRI of cervical or lumbosacral spine for disc herniation, canal stenosis, cord compression, and nerve root impingement.",
    preparation: "Screening for metallic implants mandatory. Wear comfortable clothing.",
    duration: "30-45 mins",
    reportDelivery: "4-6 Hours",
    popular: true
  },
  {
    id: "scan-mri-knee",
    name: "MRI Knee Joint",
    category: "scan",
    subCategory: "MRI (Magnetic Resonance Imaging)",
    price: 8e3,
    discountPrice: 5e3,
    description: "Detailed MRI evaluation of knee menisci, cruciate ligaments, collateral ligaments, cartilage, and bone marrow edema.",
    preparation: "No metallic items. No knee braces with metal during scan.",
    duration: "30-40 mins",
    reportDelivery: "4-6 Hours"
  },
  {
    id: "scan-mri-shoulder",
    name: "MRI Shoulder Joint",
    category: "scan",
    subCategory: "MRI (Magnetic Resonance Imaging)",
    price: 8e3,
    discountPrice: 5e3,
    description: "MRI assessment of rotator cuff, labrum, glenohumeral joint, and subacromial space pathology.",
    preparation: "No metallic items. Remove jewelry and watches.",
    duration: "30-40 mins",
    reportDelivery: "4-6 Hours"
  },
  // --- MAMMOGRAPHY ---
  {
    id: "scan-mammography-bilateral",
    name: "Digital Mammography (Bilateral)",
    category: "scan",
    subCategory: "Mammography",
    price: 3500,
    discountPrice: 2e3,
    description: "Full-field digital mammography screening for early breast cancer detection, microcalcifications, and tissue density evaluation.",
    preparation: "No deodorant, powder, or lotion on chest area. Schedule 5-10 days after period starts.",
    duration: "15-20 mins",
    reportDelivery: "2-4 Hours",
    popular: true
  },
  // --- DEXA (Bone Density) ---
  {
    id: "scan-dexa-bone-density",
    name: "DEXA Bone Density Scan",
    category: "scan",
    subCategory: "DEXA (Bone Densitometry)",
    price: 3e3,
    discountPrice: 1800,
    description: "Dual-Energy X-Ray Absorptiometry (DXA) for osteoporosis diagnosis. Measures bone mineral density at hip and lumbar spine.",
    preparation: "No calcium supplements 24 hours before. Avoid barium studies 7 days prior.",
    duration: "15-20 mins",
    reportDelivery: "2 Hours",
    popular: true
  },
  // --- ECG / EKG ---
  {
    id: "scan-ecg-12-lead",
    name: "ECG / EKG (12-Lead)",
    category: "scan",
    subCategory: "Cardiac Diagnostics",
    price: 500,
    discountPrice: 300,
    description: "Standard 12-lead electrocardiogram recording heart rhythm, rate, conduction abnormalities, and ischemic changes.",
    preparation: "No caffeine 2 hours before. Wear loose clothing for chest electrode placement.",
    duration: "10 mins",
    reportDelivery: "Immediate (within 15 mins)",
    popular: true
  },
  // --- STRESS TEST (TMT) ---
  {
    id: "scan-tmt-stress-test",
    name: "TMT / Treadmill Stress Test",
    category: "scan",
    subCategory: "Cardiac Diagnostics",
    price: 3500,
    discountPrice: 2e3,
    description: "Exercise stress ECG test monitoring cardiac response during graded treadmill exercise for coronary artery disease screening.",
    preparation: "Wear comfortable shoes. Light meal 2 hours before. Avoid beta-blockers 48 hours prior (consult doctor).",
    duration: "30-45 mins",
    reportDelivery: "Immediate (within 1 hour)",
    popular: true
  },
  // --- HOLTER MONITOR ---
  {
    id: "scan-holter-monitor-24h",
    name: "Holter Monitor (24-Hour)",
    category: "scan",
    subCategory: "Cardiac Diagnostics",
    price: 4e3,
    discountPrice: 2500,
    description: "Continuous 24-hour ambulatory ECG recording for intermittent arrhythmia, palpitation, and syncope evaluation.",
    preparation: "Shower before fitting. Avoid magnets, electric blankets. Keep a symptom diary.",
    duration: "24 hours (device worn)",
    reportDelivery: "24-48 Hours"
  },
  // --- PFT (Pulmonary Function Test) ---
  {
    id: "scan-pft-spirometry",
    name: "Pulmonary Function Test (PFT / Spirometry)",
    category: "scan",
    subCategory: "Pulmonary Diagnostics",
    price: 1500,
    discountPrice: 800,
    description: "Spirometry-based lung function assessment measuring FVC, FEV1, and PEFR for asthma, COPD, and restrictive lung disease.",
    preparation: "No bronchodilator inhaler 6 hours before. Avoid heavy meals. No smoking 4 hours prior.",
    duration: "15-20 mins",
    reportDelivery: "Immediate (within 30 mins)",
    popular: true
  },
  // --- AUDIOMETRY ---
  {
    id: "scan-audiometry-pta",
    name: "Audiometry / Pure Tone Audiogram (PTA)",
    category: "scan",
    subCategory: "ENT Diagnostics",
    price: 1200,
    discountPrice: 700,
    description: "Pure Tone Audiometry hearing assessment across frequencies to detect sensorineural and conductive hearing loss.",
    preparation: "Avoid loud noise exposure 12 hours before test. Clean ears (no wax blockage).",
    duration: "20-30 mins",
    reportDelivery: "Immediate (within 30 mins)"
  },
  // --- OPG (Dental X-Ray) ---
  {
    id: "scan-opg-dental",
    name: "OPG / Dental Panoramic X-Ray",
    category: "scan",
    subCategory: "Dental Diagnostics",
    price: 1e3,
    discountPrice: 600,
    description: "Orthopantomogram (OPG) panoramic radiograph of entire jaw, teeth, TMJ, and sinuses for dental and maxillofacial evaluation.",
    preparation: "Remove earrings, necklace, spectacles, and dentures.",
    duration: "5-10 mins",
    reportDelivery: "Immediate (within 30 mins)"
  }
];
var HEALTH_PACKAGES = [
  {
    id: "pkg-sexual-health-basic",
    name: "Sexual Health Package - Basic",
    price: 2500,
    discountPrice: 1250,
    description: "Basic sexual health screening package covering major STI/STD markers and general blood count.",
    testsCount: 6,
    includedTests: [
      "HIV 1&2",
      "HbsAg",
      "Anti-HCV",
      "VDRL",
      "CBC",
      "Chlamydia IgG"
    ],
    idealFor: "Adults seeking essential screening for common sexually transmitted infections.",
    frequency: "As Needed / Annual",
    preparation: "No specific fasting required.",
    popular: true
  },
  {
    id: "pkg-sexual-health-pro",
    name: "Sexual Health Package - Pro",
    price: 9500,
    discountPrice: 5500,
    description: "Advanced comprehensive sexual health package testing for complete STI panel, antibodies, and immune cell status.",
    testsCount: 9,
    includedTests: [
      "HIV 1&2",
      "HBSAG",
      "ANTI-HCV",
      "VDRL",
      "Anti Chlamydia IgM",
      "Anti Chlamydia IgG",
      "HSV I & II (IgM+IgG)",
      "TPHA & TP Antibody",
      "CD3, CD4, CD8"
    ],
    idealFor: "Adults needing a complete diagnostic panel for sexual health and viral/bacterial markers.",
    frequency: "As Needed",
    preparation: "No specific preparation required.",
    popular: false
  },
  {
    id: "pkg-fever-profile",
    name: "Fever Profile",
    price: 3e3,
    discountPrice: 1700,
    description: "Screening profile to diagnose underlying causes of acute or persistent fever including malaria, dengue, typhoid, and infection markers.",
    testsCount: 7,
    includedTests: [
      "CBC WITH ESR",
      "CRP",
      "WIDAL TEST",
      "MALARIA TEST",
      "URINE R/M/E",
      "DENGUE AG/AB",
      "DENGUE NS1"
    ],
    idealFor: "Individuals experiencing acute fever, chills, body pain, or seasonal infection symptoms.",
    frequency: "Immediate / On Symptoms",
    preparation: "No fasting required.",
    popular: true
  },
  {
    id: "pkg-sugar-profile",
    name: "Sugar Profile",
    price: 2e3,
    discountPrice: 1e3,
    description: "Comprehensive diabetic profile testing blood glucose, long-term glycemic control, insulin, kidney function, and lipids.",
    testsCount: 6,
    includedTests: [
      "FBS (Fasting Blood Sugar)",
      "PPBS (Post Prandial Blood Sugar)",
      "HbA1c",
      "Insulin",
      "Creatinine",
      "Triglycerides"
    ],
    idealFor: "Diabetic & pre-diabetic patients, or those with family history of diabetes.",
    frequency: "Every 3 to 6 Months",
    preparation: "8-10 hours fasting required for FBS, followed by sample 2 hours after meals for PPBS.",
    popular: true
  },
  {
    id: "pkg-health-econo-plus",
    name: "Comprehensive Health Package - ECONO +",
    price: 1200,
    discountPrice: 500,
    description: "Economical entry-level health screening covering essential blood count, blood sugar, renal function, cholesterol, and urine parameters.",
    testsCount: 5,
    includedTests: [
      "Blood Sugar",
      "Serum Cholesterol",
      "Serum Creatinine",
      "Urine R/M/E",
      "Complete Blood Count"
    ],
    idealFor: "Routine basic health checkup for all age groups.",
    frequency: "Every 6 Months",
    preparation: "8-10 hours fasting required.",
    popular: true
  },
  {
    id: "pkg-health-gold",
    name: "Comprehensive Health Package - GOLD",
    price: 3500,
    discountPrice: 1500,
    description: "Popular full-body checkup covering blood count, diabetes, liver, kidney, thyroid, lipid profile, and urine routine.",
    testsCount: 8,
    includedTests: [
      "Complete Blood Count",
      "Blood Sugar",
      "Lipid Profile",
      "Liver Function Test",
      "Thyroid Profile",
      "Kidney Function Test",
      "HbA1C with Graph",
      "Urine R/M/E"
    ],
    idealFor: "Adults looking for thorough annual preventive health checkup.",
    frequency: "Annually",
    preparation: "10-12 hours overnight fasting required.",
    popular: true
  },
  {
    id: "pkg-health-platinum",
    name: "Comprehensive Health Package - PLATINUM",
    price: 4800,
    discountPrice: 2250,
    description: "Extended health screening adding key vitamins (Vitamin D & B12) and electrolytes to Gold package parameters.",
    testsCount: 11,
    includedTests: [
      "Complete Blood Count",
      "Blood Sugar",
      "Vitamin D",
      "Vitamin B12",
      "Lipid Profile",
      "Liver Function Test",
      "Thyroid Profile",
      "Electrolytes",
      "Kidney Function Test",
      "HbA1C with Graph",
      "Urine R/M/E"
    ],
    idealFor: "Adults and working professionals needing deep metabolic and vitamin assessment.",
    frequency: "Annually",
    preparation: "10-12 hours overnight fasting required.",
    popular: true
  },
  {
    id: "pkg-health-platinum-plus",
    name: "Health Package - PLATINUM +",
    price: 5200,
    discountPrice: 2500,
    description: "All-inclusive full-body checkup adding complete Iron Profile along with vitamins, organ panels, and HbA1c.",
    testsCount: 12,
    includedTests: [
      "Complete Blood Count",
      "Blood Sugar (FBS+PPBS)",
      "Vitamin D",
      "Vitamin B12",
      "Lipid Profile",
      "Liver Function Test",
      "Thyroid Profile",
      "Electrolytes",
      "Kidney Function Test",
      "HbA1C with Graph",
      "Urine R/M/E",
      "IRON PROFILE"
    ],
    idealFor: "Individuals wanting full body evaluation including anemia and iron storage markers.",
    frequency: "Annually",
    preparation: "10-12 hours overnight fasting required.",
    popular: true
  },
  {
    id: "pkg-health-ultimate",
    name: "Health Package - ULTIMATE",
    price: 6500,
    discountPrice: 3200,
    description: "Ultimate diagnostic suite including cardiac markers, joint markers (RA factor, ESR, CRP), iron profile, vitamins, and organ function tests.",
    testsCount: 15,
    includedTests: [
      "Complete Blood Count",
      "Blood Sugar",
      "Vitamin D",
      "Vitamin B12",
      "Lipid Profile",
      "Liver Function Test",
      "Thyroid Profile",
      "Electrolytes",
      "Kidney Function Test",
      "HbA1C",
      "Iron Profile",
      "RA Factor",
      "ESR",
      "CRP",
      "Cardiac Markers"
    ],
    idealFor: "Comprehensive body scan for senior adults, executives, or individuals with chronic symptoms.",
    frequency: "Annually",
    preparation: "10-12 hours overnight fasting required.",
    popular: true
  },
  {
    id: "pkg-womens-health-essential",
    name: "Women's Health - ESSENTIAL",
    price: 5e3,
    discountPrice: 2500,
    description: "Essential hormonal and metabolic checkup tailored for women covering thyroid, female reproductive hormones, calcium, and blood count.",
    testsCount: 11,
    includedTests: [
      "Blood Sugar",
      "FSH",
      "Prolactin",
      "LH",
      "Estradiol E2",
      "Progesterone",
      "Serum Calcium",
      "HbA1c With Graph",
      "Free Thyroid Function Test (FT3,FT4,TSH)",
      "Complete Blood Count",
      "Serum Iron"
    ],
    idealFor: "Women of all ages screening for hormonal balance, menstrual irregularities, or fatigue.",
    frequency: "Annually",
    preparation: "Overnight fasting required.",
    popular: true
  },
  {
    id: "pkg-womens-health-advance",
    name: "Women's Health - ADVANCE",
    price: 8500,
    discountPrice: 4500,
    description: "Advanced women's health panel including detailed androgen profile (Testosterone, DHEAS), Beta HCG, Ferritin, SGPT/SGOT, and complete iron profile.",
    testsCount: 17,
    includedTests: [
      "Blood Sugar",
      "FSH",
      "Prolactin",
      "LH",
      "Estradiol E2",
      "Progesterone",
      "Serum Calcium",
      "HbA1c With Graph",
      "Free Thyroid Function Test (FT3,FT4,TSH)",
      "Complete Blood Count",
      "Iron Profile",
      "Total Testosterone",
      "Beta HCG",
      "DHEAS",
      "Ferritin",
      "SGPT, SGOT"
    ],
    idealFor: "Women seeking full gynecological, hormonal, PCOD/PCOS, and metabolic health evaluation.",
    frequency: "Annually",
    preparation: "Overnight fasting required.",
    popular: false
  },
  {
    id: "pkg-pain-management",
    name: "Pain Management Package",
    price: 6800,
    discountPrice: 3450,
    description: "Specialized diagnostic panel for investigating joint pain, arthritis, autoimmune markers (ANA, Anti-CCP, RA factor), bone minerals, and kidney function.",
    testsCount: 12,
    includedTests: [
      "VITAMIN D",
      "VITAMIN B12",
      "CALCITONIN",
      "CALCIUM",
      "RA FACTOR",
      "URIC ACID",
      "ANA",
      "ANTI-CCP",
      "CBC & ESR",
      "CRP",
      "KFT",
      "ELECTROLYTE"
    ],
    idealFor: "Patients experiencing joint pain, arthritis, swelling, muscle soreness, or autoimmune symptoms.",
    frequency: "As Advised by Physician",
    preparation: "No specific fasting needed, morning sample preferred.",
    popular: false
  },
  {
    id: "pkg-anemia-screening",
    name: "Anemia Screening Package",
    price: 3500,
    discountPrice: 1700,
    description: "Targeted screening package for diagnosing causes of anemia, low hemoglobin, ferritin levels, hemoglobinopathies, and liver function.",
    testsCount: 8,
    includedTests: [
      "FASTING BLOOD",
      "COMPLETE HEMOGRAM & ESR",
      "IRON PROFILE",
      "Hb-ELECTROFORESIS",
      "PERIPHERAL BLOOD",
      "FERRITIN",
      "LIVER FUNCTION TEST",
      "AMYLASE-LIPASE"
    ],
    idealFor: "Patients with persistent fatigue, pale skin, weakness, or unexplained low hemoglobin.",
    frequency: "As Needed",
    preparation: "Fasting blood sample required.",
    popular: false
  },
  {
    id: "pkg-pre-operative",
    name: "Pre-Operative Package",
    price: 5e3,
    discountPrice: 2700,
    description: "Essential diagnostic pre-surgical clearance profile testing blood coagulation, viral markers, blood grouping, organ function, and ECG.",
    testsCount: 11,
    includedTests: [
      "CBC+ESR",
      "FBS , PPBS",
      "PT - INR",
      "HIV 1 & 2, ECG",
      "HBsAg",
      "ANTI - HCV",
      "RFT",
      "ABO GROUP",
      "BT-CT",
      "ELECTROLYTES",
      "LIVER FUNCTION TEST"
    ],
    idealFor: "Patients scheduled for surgery or medical procedures requiring pre-op clearance.",
    frequency: "Before Surgery",
    preparation: "Overnight fasting required.",
    popular: false
  },
  {
    id: "pkg-cardiac-profile",
    name: "Cardiac Profile",
    price: 5800,
    discountPrice: 3e3,
    description: "Comprehensive cardiac screening assessing heart muscle markers (Trop I, CPK, CK-MB), blood sugar, ECG, D-Dimer, and liver/cardiac enzymes.",
    testsCount: 7,
    includedTests: [
      "FBS , PPBS",
      "CBC, ECG",
      "CPK",
      "CK - MB",
      "TROP I",
      "D-DIMER",
      "SGOT , LDH"
    ],
    idealFor: "Individuals experiencing chest discomfort, breathlessness, hypertension, or heart risk monitoring.",
    frequency: "As Needed / Annually",
    preparation: "Fasting sample required.",
    popular: true
  },
  {
    id: "pkg-infertility-profile",
    name: "Infertility Profile (Male & Female)",
    price: 9800,
    discountPrice: 4950,
    description: "Complete reproductive and fertility evaluation panel for couples, covering male and female hormonal panels and semen analysis.",
    testsCount: 17,
    includedTests: [
      "Female Panel: FBS, CBC, FSH, LH, Estradiol, Progesterone, Prolactin, SGPT, Thyroid Profile, Urine R/M/E",
      "Male Panel: FBS, CBC, FSH, LH, Prolactin, Testosterone (Free & Total), Semen Analysis"
    ],
    idealFor: "Couples planning pregnancy or evaluating fertility health.",
    frequency: "As Needed",
    preparation: "Specific cycle day timing for females and 3-5 days abstinence for semen analysis.",
    popular: false
  },
  {
    id: "pkg-hair-loss-profile",
    name: "Hair Loss Profile",
    price: 8900,
    discountPrice: 4750,
    description: "Specialized diagnostic panel for identifying root causes of alopecia and excessive hair fall, evaluating hormones, thyroid, biotin, and androgen status.",
    testsCount: 10,
    includedTests: [
      "FSH",
      "PROLACTIN",
      "LH",
      "FASTING INSULIN",
      "ESTRADIOL",
      "TESTOSTERONE (FREE AND TOTAL)",
      "SEX HORMONE BINDING GLOBULIN (SHBG)",
      "BIOTIN",
      "THYROID PROFILE",
      "DHEAS"
    ],
    idealFor: "Men and women experiencing severe hair thinning, hair loss, or scalp issues.",
    frequency: "As Needed",
    preparation: "Fasting blood sample required.",
    popular: false
  }
];

// src/db/seedData.ts
var SEED_TESTIMONIALS = [
  {
    id: "t-1",
    name: "Varun Dubey",
    rating: 5,
    comment: "I recently had the pleasure of using the services provided by AssurX, and I must say I was thoroughly satisfied.",
    location: "Mumbai",
    date: "15 May 2023"
  },
  {
    id: "t-2",
    name: "Arti Shrivastva",
    rating: 5,
    comment: "Prompt service and they perform only things they want to test. More comparative with other peers online in price.",
    location: "Mumbai",
    date: "16 Jun 2023"
  },
  {
    id: "t-3",
    name: "Rajesh Kumar",
    rating: 5,
    comment: "Excellent experience. Booked an USG scan for my father. Staff was very polite and supportive. MD Radiologist report was ready within 2 hours. Best diagnostic center in Malad with affordable rates!",
    location: "Malad West, Mumbai",
    date: "12 days ago"
  },
  {
    id: "t-4",
    name: "Sneha Deshmukh",
    rating: 5,
    comment: "The Phlebotomist arrived right on time for the Home Blood Collection. He was highly skilled, used sterile sealed equipment, and took the sample painless. Got accurate digital reports on WhatsApp the same evening!",
    location: "Goregaon East, Mumbai",
    date: "1 week ago"
  },
  {
    id: "t-5",
    name: "Amit Patel",
    rating: 5,
    comment: "Very neat, clean, and modern diagnostic center with high-tech equipment. Extremely polite staff and seamless online booking. Highly recommended for all ultrasound scans and blood checkups!",
    location: "Malad East, Mumbai",
    date: "3 days ago"
  }
];
var SEED_FAQS = [
  {
    q: "Do I need an appointment, or can I walk in?",
    a: "Walk-ins are welcome for routine blood and urine tests. However, we strongly recommend booking an appointment in advance for imaging procedures ECHO, Ultrasounds, and Mammograms to minimize your wait time and ensure proper preparation."
  },
  {
    q: "What are your operating hours and report pickup timings?",
    a: "Our sample collection counter is open Monday \u2013 Sunday: 7:30 AM \u2013 10:00 PM. Reports can be collected physically during working hours or downloaded 24/7 via our e-reports Services."
  },
  {
    q: "How do I know if I need to fast before my blood test?",
    a: "Tests such as Fasting Blood Sugar (FBS), Lipid Profile, Liver Function Test (LFT), and Metabolic Panels typically require 8 to 12 hours of overnight fasting. Only plain water is allowed during this period. Do not consume tea, coffee, juice, or food until your blood is drawn."
  },
  {
    q: "Can I take my regular medications before a test?",
    a: "In most cases, yes\u2014you may take daily prescription medications with water unless specifically instructed otherwise by your doctor (e.g., thyroid medication or insulin before fasting tests). Always inform our phlebotomist/technician about any medications you have taken."
  },
  {
    q: "What preparation is required for an Ultrasound or Imaging scan?",
    a: "Preparation depends on the body region. Abdominal Ultrasound: Requires 6\u20138 hours of fasting. Pelvic/OB Ultrasound: Requires a full bladder (drink 3\u20134 glasses of water 1 hour before and do not empty your bladder)."
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
var SEED_CENTERS = [
  { city: "Malad", address: "Shop 1-3, SV Road, Opp. Malad Railway Station, Malad West, Mumbai - 400064", phone: "022-50117701", whatsappNumber: "919830678387" },
  { city: "Goregaon", address: "G-4, Sun Plaza, SV Road, Near Goregaon East Metro, Goregaon, Mumbai - 400063", phone: "022-50117702", whatsappNumber: "919830678387" }
];
var SEED_DOCTORS = [
  {
    id: "doc-alok-sharma",
    name: "Dr. Alok Sharma",
    specialization: "Cardiologist",
    experience: 15,
    qualification: "MD, DM (Cardiology)",
    timing: "09:00 AM - 01:00 PM",
    branch: "Malad",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "doc-reena-mehta",
    name: "Dr. Reena Mehta",
    specialization: "Gynecologist",
    experience: 10,
    qualification: "MD (Gynecology)",
    timing: "02:00 PM - 06:00 PM",
    branch: "Malad",
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "doc-s-iyer",
    name: "Dr. S. Iyer",
    specialization: "Neurologist",
    experience: 18,
    qualification: "DM (Neurology)",
    timing: "10:00 AM - 02:00 PM",
    branch: "Goregaon",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "doc-priya-patel",
    name: "Dr. Priya Patel",
    specialization: "Pediatrician",
    experience: 8,
    qualification: "MD (Pediatrics)",
    timing: "04:00 PM - 08:00 PM",
    branch: "Goregaon",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "doc-shreyas-masrani",
    name: "Dr. Shreyas Masrani",
    specialization: "Radiologist",
    experience: 30,
    qualification: "MD (Radio-Diagnosis)",
    timing: "11:00 AM - 03:00 PM",
    branch: "Goregaon",
    avatar: "/shreyas_masrani.jpg"
  },
  {
    id: "doc-biswajit-mondal",
    name: "Dr. Biswajit Mondal",
    specialization: "General Physician",
    experience: 6,
    qualification: "MBBS",
    timing: "10:00 AM - 02:00 PM",
    branch: "Malad",
    avatar: "/biswajit_mondal.png"
  }
];

// src/db/queries.ts
async function ensureConnected() {
  await connectDB();
}
function formatBookingDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  let itemsObj = [];
  if (obj.items) {
    if (typeof obj.items === "string") {
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
    name: obj.patientName || obj.patient && obj.patient.name || "",
    age: obj.patientAge !== void 0 ? Number(obj.patientAge) : obj.patient && obj.patient.age || 0,
    gender: obj.patientGender || obj.patient && obj.patient.gender || "Male",
    relationship: obj.patientRelationship || obj.patient && obj.patient.relationship || "Self"
  };
  const addressObj = {
    street: obj.street || obj.address && obj.address.street || "",
    city: obj.city || obj.address && obj.address.city || "",
    pincode: obj.pincode || obj.address && obj.address.pincode || ""
  };
  return {
    id: String(obj.id !== void 0 ? obj.id : obj._id),
    bookingId: obj.bookingId || "",
    patient: patientObj,
    items: itemsObj,
    appointmentDate: obj.appointmentDate || "",
    appointmentTime: obj.appointmentTime || "",
    collectionType: obj.collectionType || "home",
    address: addressObj,
    paymentMethod: obj.paymentMethod || "upi",
    paymentStatus: obj.paymentStatus || "pending",
    bookingStatus: obj.bookingStatus || "booked",
    totalAmount: Number(obj.totalAmount) || 0,
    prescriptionName: obj.prescriptionName || void 0,
    simulatedReportUrl: obj.simulatedReportUrl || void 0,
    timestamp: obj.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
    doctor: obj.doctor || "",
    department: obj.department || "",
    bookingDate: obj.bookingDate || void 0,
    userEmail: obj.userEmail || ""
  };
}
async function createBooking(data) {
  await ensureConnected();
  try {
    const id = await getNextId("booking");
    const booking = new BookingModel({ ...data, id });
    await booking.save();
    return formatBookingDoc(booking);
  } catch (error) {
    console.error("Failed to create booking:", error);
    throw new Error("Failed to save booking to database.", { cause: error });
  }
}
async function getUserBookings(uid) {
  await ensureConnected();
  try {
    const user = await UserModel.findOne({ uid });
    if (!user) return [];
    const bookings = await BookingModel.find({ userId: user.id }).sort({ id: -1 });
    return bookings.map(formatBookingDoc);
  } catch (error) {
    console.error("Failed to fetch user bookings:", error);
    throw new Error("Failed to retrieve bookings from database.", { cause: error });
  }
}
async function getBookingByBookingId(bookingId) {
  await ensureConnected();
  try {
    const booking = await BookingModel.findOne({ bookingId });
    if (!booking) return void 0;
    return formatBookingDoc(booking);
  } catch (error) {
    console.error(`Failed to fetch booking by bookingId ${bookingId}:`, error);
    throw new Error("Failed to retrieve booking by ID from database.", { cause: error });
  }
}
async function getAllBookings() {
  await ensureConnected();
  try {
    const bookings = await BookingModel.find().sort({ id: -1 });
    const userIds = [...new Set(bookings.map((b) => b.userId))];
    const users = await UserModel.find({ id: { $in: userIds } });
    const userMap = new Map(users.map((u) => [u.id, u.email]));
    return bookings.map((b) => ({
      ...formatBookingDoc(b),
      userEmail: userMap.get(b.userId) || ""
    }));
  } catch (error) {
    console.error("Failed to fetch all bookings:", error);
    throw new Error("Failed to retrieve all bookings from database.", { cause: error });
  }
}
async function updateBooking(id, data) {
  await ensureConnected();
  try {
    const isNum = typeof id === "number" || /^\d+$/.test(String(id));
    const filter = isNum ? { id: Number(id) } : { bookingId: String(id) };
    let booking = await BookingModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: "after" }
    );
    if (!booking && !isNum) {
      const numId = parseInt(String(id), 10);
      if (!isNaN(numId)) {
        booking = await BookingModel.findOneAndUpdate(
          { id: numId },
          { $set: data },
          { returnDocument: "after" }
        );
      }
    }
    if (!booking) throw new Error(`Booking with id ${id} not found`);
    return formatBookingDoc(booking);
  } catch (error) {
    console.error(`Failed to update booking ${id}:`, error);
    throw new Error("Failed to update booking in database.", { cause: error });
  }
}
async function deleteBooking(id) {
  await ensureConnected();
  try {
    const isNum = typeof id === "number" || /^\d+$/.test(String(id));
    const filter = isNum ? { id: Number(id) } : { bookingId: String(id) };
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
    throw new Error("Failed to delete booking from database.", { cause: error });
  }
}
async function createPrescription(data) {
  await ensureConnected();
  try {
    const id = await getNextId("prescription");
    const prescription = new PrescriptionModel({ ...data, id });
    await prescription.save();
    return mongoDocToPlain(prescription);
  } catch (error) {
    console.error("Failed to create prescription lead:", error);
    throw new Error("Failed to save prescription to database.", { cause: error });
  }
}
async function getAllPrescriptions() {
  await ensureConnected();
  try {
    const prescriptions = await PrescriptionModel.find().sort({ id: -1 });
    return prescriptions.map(mongoDocToPlain);
  } catch (error) {
    console.error("Failed to fetch all prescriptions:", error);
    throw new Error("Failed to retrieve prescriptions from database.", { cause: error });
  }
}
async function updatePrescription(id, data) {
  await ensureConnected();
  try {
    const prescription = await PrescriptionModel.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: "after" }
    );
    if (!prescription) throw new Error(`Prescription with id ${id} not found`);
    return mongoDocToPlain(prescription);
  } catch (error) {
    console.error(`Failed to update prescription ${id}:`, error);
    throw new Error("Failed to update prescription in database.", { cause: error });
  }
}
async function deletePrescription(id) {
  await ensureConnected();
  try {
    const prescription = await PrescriptionModel.findOneAndDelete({ id });
    if (!prescription) return null;
    return mongoDocToPlain(prescription);
  } catch (error) {
    console.error(`Failed to delete prescription ${id}:`, error);
    throw new Error("Failed to delete prescription from database.", { cause: error });
  }
}
async function clearAllData() {
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
    console.error("Failed to clear database tables:", error);
    throw new Error("Failed to clear database tables.", { cause: error });
  }
}
async function createJobApplication(data) {
  await ensureConnected();
  try {
    const id = await getNextId("jobApplication");
    const application = new JobApplicationModel({
      ...data,
      id,
      status: "applied",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    await application.save();
    return mongoDocToPlain(application);
  } catch (error) {
    console.error("Failed to create job application:", error);
    throw new Error("Failed to insert job application into database.", { cause: error });
  }
}
async function getAllJobApplications() {
  await ensureConnected();
  try {
    const applications = await JobApplicationModel.find().sort({ id: -1 });
    return applications.map(mongoDocToPlain);
  } catch (error) {
    console.error("Failed to fetch all job applications:", error);
    throw new Error("Failed to retrieve job applications from database.", { cause: error });
  }
}
async function updateJobApplicationStatus(id, status) {
  await ensureConnected();
  try {
    const application = await JobApplicationModel.findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    if (!application) throw new Error(`Job application with id ${id} not found`);
    return mongoDocToPlain(application);
  } catch (error) {
    console.error(`Failed to update job application ${id} status:`, error);
    throw new Error("Failed to update job application status in database.", { cause: error });
  }
}
async function deleteJobApplication(id) {
  await ensureConnected();
  try {
    const application = await JobApplicationModel.findOneAndDelete({ id });
    if (!application) return null;
    return mongoDocToPlain(application);
  } catch (error) {
    console.error(`Failed to delete job application ${id}:`, error);
    throw new Error("Failed to delete job application from database.", { cause: error });
  }
}
function mongoDocToPlain(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.__v;
  return obj;
}
async function seedCatalog() {
  await ensureConnected();
  try {
    const serviceCount = await DiagnosticServiceModel.countDocuments();
    if (serviceCount === 0) {
      console.log("\u{1F331} Seeding diagnostic services into MongoDB...");
      await DiagnosticServiceModel.insertMany(DIAGNOSTIC_SERVICES);
    }
    const packageCount = await HealthPackageModel.countDocuments();
    if (packageCount === 0) {
      console.log("\u{1F331} Seeding health packages into MongoDB...");
      await HealthPackageModel.insertMany(HEALTH_PACKAGES);
    }
    console.log("\u{1F331} Seeding/updating testimonials in MongoDB...");
    for (const test of SEED_TESTIMONIALS) {
      await TestimonialModel.updateOne(
        { id: test.id },
        { $set: test },
        { upsert: true }
      );
    }
    console.log("\u{1F331} Seeding/updating FAQs in MongoDB...");
    await FAQModel.deleteMany({});
    await FAQModel.insertMany(SEED_FAQS);
    const centerCount = await CenterModel.countDocuments();
    if (centerCount === 0) {
      console.log("\u{1F331} Seeding centers into MongoDB...");
      await CenterModel.insertMany(SEED_CENTERS);
    }
    const doctorCount = await DoctorModel.countDocuments();
    if (doctorCount === 0) {
      console.log("\u{1F331} Seeding doctors into MongoDB...");
      await DoctorModel.insertMany(SEED_DOCTORS);
    }
    const bookingCount = await BookingModel.countDocuments();
    if (bookingCount === 0) {
      console.log("\u{1F331} Seeding initial bookings into MongoDB...");
      const initialBookings = [
        {
          bookingId: "ASX-984310",
          userId: 1,
          patientName: "Vy9892 Patel",
          patientAge: 29,
          patientGender: "Male",
          patientRelationship: "Self",
          appointmentDate: "2026-07-01",
          appointmentTime: "08:00 AM - 10:00 AM",
          collectionType: "home",
          street: "Flat 405, Blue Meadows, S.V. Road",
          city: "Malad",
          pincode: "400064",
          paymentMethod: "upi",
          paymentStatus: "paid",
          bookingStatus: "report_ready",
          totalAmount: 1700,
          simulatedReportUrl: "/reports/ASX-984310.pdf",
          items: JSON.stringify([
            { itemId: "pkg-fever-profile", itemType: "package", name: "Fever Profile", price: 3e3, discountPrice: 1700, category: "package" }
          ]),
          timestamp: "2026-07-01T08:15:00.000Z"
        },
        {
          bookingId: "ASX-751294",
          userId: 1,
          patientName: "Meera Sharma",
          patientAge: 45,
          patientGender: "Female",
          patientRelationship: "Other",
          appointmentDate: "2026-07-04",
          appointmentTime: "11:00 AM - 12:00 PM",
          collectionType: "center",
          street: "Goregaon Hub Center Visit",
          city: "Goregaon",
          pincode: "400063",
          paymentMethod: "card",
          paymentStatus: "paid",
          bookingStatus: "sample_collected",
          totalAmount: 2500,
          simulatedReportUrl: "/reports/ASX-751294.pdf",
          items: JSON.stringify([
            { itemId: "pkg-womens-health-essential", itemType: "package", name: "Women's Health - ESSENTIAL", price: 5e3, discountPrice: 2500, category: "package" }
          ]),
          timestamp: "2026-07-04T11:30:00.000Z"
        },
        {
          bookingId: "ASX-112399",
          userId: 1,
          patientName: "Rajesh Mehta",
          patientAge: 52,
          patientGender: "Male",
          patientRelationship: "Other",
          appointmentDate: "2026-07-06",
          appointmentTime: "09:00 AM - 11:00 AM",
          collectionType: "center",
          street: "Malad West Clinic Walk-in",
          city: "Malad",
          pincode: "400064",
          paymentMethod: "netbanking",
          paymentStatus: "paid",
          bookingStatus: "booked",
          totalAmount: 1e3,
          items: JSON.stringify([
            { itemId: "pkg-sugar-profile", itemType: "package", name: "Sugar Profile", price: 2e3, discountPrice: 1e3, category: "package" }
          ]),
          timestamp: "2026-07-06T09:10:00.000Z"
        }
      ];
      for (const b of initialBookings) {
        try {
          await createBooking(b);
        } catch (bErr) {
          console.error("Initial booking seed error:", bErr);
        }
      }
    }
  } catch (error) {
    console.error("Failed to seed catalog data:", error);
  }
}
function buildIdFilter(identifier, alternativeKey = "id") {
  if (mongoose5.Types.ObjectId.isValid(identifier)) {
    return { $or: [{ [alternativeKey]: identifier }, { _id: identifier }] };
  }
  return { [alternativeKey]: identifier };
}
async function getAllServices() {
  await ensureConnected();
  try {
    const services = await DiagnosticServiceModel.find({});
    return services.map(mongoDocToPlain);
  } catch (error) {
    console.error("Failed to fetch services:", error);
    throw new Error("Failed to retrieve services from database.", { cause: error });
  }
}
async function createService(serviceData) {
  await ensureConnected();
  try {
    const newService = new DiagnosticServiceModel(serviceData);
    await newService.save();
    return mongoDocToPlain(newService);
  } catch (error) {
    console.error("Failed to create service:", error);
    throw new Error("Failed to create service in database.", { cause: error });
  }
}
async function updateService(id, serviceData) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, "id");
    const service = await DiagnosticServiceModel.findOneAndUpdate(
      filter,
      { $set: serviceData },
      { returnDocument: "after" }
    );
    if (!service) throw new Error(`Service ${id} not found`);
    return mongoDocToPlain(service);
  } catch (error) {
    console.error(`Failed to update service ${id}:`, error);
    throw new Error("Failed to update service in database.", { cause: error });
  }
}
async function deleteService(id) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, "id");
    const service = await DiagnosticServiceModel.findOneAndDelete(filter);
    if (!service) return null;
    return mongoDocToPlain(service);
  } catch (error) {
    console.error(`Failed to delete service ${id}:`, error);
    throw new Error("Failed to delete service from database.", { cause: error });
  }
}
async function getAllPackages() {
  await ensureConnected();
  try {
    const packages = await HealthPackageModel.find({});
    return packages.map(mongoDocToPlain);
  } catch (error) {
    console.error("Failed to fetch health packages:", error);
    throw new Error("Failed to retrieve health packages from database.", { cause: error });
  }
}
async function createPackage(packageData) {
  await ensureConnected();
  try {
    const newPackage = new HealthPackageModel(packageData);
    await newPackage.save();
    return mongoDocToPlain(newPackage);
  } catch (error) {
    console.error("Failed to create package:", error);
    throw new Error("Failed to create package in database.", { cause: error });
  }
}
async function updatePackage(id, packageData) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, "id");
    const pkg = await HealthPackageModel.findOneAndUpdate(
      filter,
      { $set: packageData },
      { returnDocument: "after" }
    );
    if (!pkg) throw new Error(`Health package ${id} not found`);
    return mongoDocToPlain(pkg);
  } catch (error) {
    console.error(`Failed to update package ${id}:`, error);
    throw new Error("Failed to update health package in database.", { cause: error });
  }
}
async function deletePackage(id) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, "id");
    const pkg = await HealthPackageModel.findOneAndDelete(filter);
    if (!pkg) return null;
    return mongoDocToPlain(pkg);
  } catch (error) {
    console.error(`Failed to delete package ${id}:`, error);
    throw new Error("Failed to delete health package from database.", { cause: error });
  }
}
async function getAllTestimonials() {
  await ensureConnected();
  try {
    const testimonials = await TestimonialModel.find({});
    return testimonials.map(mongoDocToPlain);
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    throw new Error("Failed to retrieve testimonials from database.", { cause: error });
  }
}
async function createTestimonial(data) {
  await ensureConnected();
  try {
    const testimonial = new TestimonialModel(data);
    await testimonial.save();
    return mongoDocToPlain(testimonial);
  } catch (error) {
    console.error("Failed to create testimonial:", error);
    throw new Error("Failed to create testimonial in database.", { cause: error });
  }
}
async function updateTestimonial(id, data) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, "id");
    const testimonial = await TestimonialModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: "after" }
    );
    if (!testimonial) throw new Error(`Testimonial ${id} not found`);
    return mongoDocToPlain(testimonial);
  } catch (error) {
    console.error(`Failed to update testimonial ${id}:`, error);
    throw new Error("Failed to update testimonial in database.", { cause: error });
  }
}
async function deleteTestimonial(id) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, "id");
    const testimonial = await TestimonialModel.findOneAndDelete(filter);
    if (!testimonial) return null;
    return mongoDocToPlain(testimonial);
  } catch (error) {
    console.error(`Failed to delete testimonial ${id}:`, error);
    throw new Error("Failed to delete testimonial from database.", { cause: error });
  }
}
async function getAllFAQs() {
  await ensureConnected();
  try {
    const faqs = await FAQModel.find({});
    return faqs.map(mongoDocToPlain);
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    throw new Error("Failed to retrieve FAQs from database.", { cause: error });
  }
}
async function createFAQ(data) {
  await ensureConnected();
  try {
    const faq = new FAQModel(data);
    await faq.save();
    return mongoDocToPlain(faq);
  } catch (error) {
    console.error("Failed to create FAQ:", error);
    throw new Error("Failed to create FAQ in database.", { cause: error });
  }
}
async function updateFAQ(identifier, data) {
  await ensureConnected();
  try {
    const filter = mongoose5.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { q: identifier };
    const faq = await FAQModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: "after" }
    );
    if (!faq) throw new Error(`FAQ ${identifier} not found`);
    return mongoDocToPlain(faq);
  } catch (error) {
    console.error(`Failed to update FAQ ${identifier}:`, error);
    throw new Error("Failed to update FAQ in database.", { cause: error });
  }
}
async function deleteFAQ(identifier) {
  await ensureConnected();
  try {
    const filter = mongoose5.Types.ObjectId.isValid(identifier) ? { _id: identifier } : { q: identifier };
    const faq = await FAQModel.findOneAndDelete(filter);
    if (!faq) return null;
    return mongoDocToPlain(faq);
  } catch (error) {
    console.error(`Failed to delete FAQ ${identifier}:`, error);
    throw new Error("Failed to delete FAQ from database.", { cause: error });
  }
}
async function getAllCenters() {
  await ensureConnected();
  try {
    const centers = await CenterModel.find({});
    return centers.map(mongoDocToPlain);
  } catch (error) {
    console.error("Failed to fetch centers:", error);
    throw new Error("Failed to retrieve centers from database.", { cause: error });
  }
}
async function createCenter(data) {
  await ensureConnected();
  try {
    const center = new CenterModel(data);
    await center.save();
    return mongoDocToPlain(center);
  } catch (error) {
    console.error("Failed to create center:", error);
    throw new Error("Failed to create center in database.", { cause: error });
  }
}
async function updateCenter(identifier, data) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(identifier, "city");
    const center = await CenterModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: "after" }
    );
    if (!center) throw new Error(`Center ${identifier} not found`);
    return mongoDocToPlain(center);
  } catch (error) {
    console.error(`Failed to update center ${identifier}:`, error);
    throw new Error("Failed to update center in database.", { cause: error });
  }
}
async function deleteCenter(identifier) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(identifier, "city");
    const center = await CenterModel.findOneAndDelete(filter);
    if (!center) return null;
    return mongoDocToPlain(center);
  } catch (error) {
    console.error(`Failed to delete center ${identifier}:`, error);
    throw new Error("Failed to delete center from database.", { cause: error });
  }
}
async function getAllDoctors() {
  await ensureConnected();
  try {
    const doctors = await DoctorModel.find({});
    return doctors.map(mongoDocToPlain);
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    throw new Error("Failed to retrieve doctors from database.", { cause: error });
  }
}
async function createDoctor(data) {
  await ensureConnected();
  try {
    const doctor = new DoctorModel(data);
    await doctor.save();
    return mongoDocToPlain(doctor);
  } catch (error) {
    console.error("Failed to create doctor:", error);
    throw new Error("Failed to create doctor in database.", { cause: error });
  }
}
async function updateDoctor(id, data) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, "id");
    const doctor = await DoctorModel.findOneAndUpdate(
      filter,
      { $set: data },
      { returnDocument: "after" }
    );
    if (!doctor) throw new Error(`Doctor ${id} not found`);
    return mongoDocToPlain(doctor);
  } catch (error) {
    console.error(`Failed to update doctor ${id}:`, error);
    throw new Error("Failed to update doctor in database.", { cause: error });
  }
}
async function deleteDoctor(id) {
  await ensureConnected();
  try {
    const filter = buildIdFilter(id, "id");
    const doctor = await DoctorModel.findOneAndDelete(filter);
    if (!doctor) return null;
    return mongoDocToPlain(doctor);
  } catch (error) {
    console.error(`Failed to delete doctor ${id}:`, error);
    throw new Error("Failed to delete doctor from database.", { cause: error });
  }
}
async function getPromoAd() {
  await ensureConnected();
  try {
    let promo = await PromoAdModel.findOne({ id: "main_promo" });
    if (!promo) {
      promo = await PromoAdModel.create({
        id: "main_promo",
        title: "AssurX Diagnostics Promotional Camp",
        imageUrl: "/promotional_camp.jpg",
        targetTab: "labs",
        targetUrl: "",
        isActive: true,
        updatedAt: /* @__PURE__ */ new Date()
      });
    }
    return {
      id: promo.id,
      title: promo.title,
      imageUrl: promo.imageUrl,
      targetTab: promo.targetTab,
      targetUrl: promo.targetUrl,
      isActive: promo.isActive,
      updatedAt: promo.updatedAt
    };
  } catch (error) {
    console.error("Failed to get promo ad from database:", error);
    return {
      id: "main_promo",
      title: "AssurX Diagnostics Promotional Camp",
      imageUrl: "/promotional_camp.jpg",
      targetTab: "labs",
      targetUrl: "",
      isActive: true,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
}
async function updatePromoAd(data) {
  await ensureConnected();
  try {
    const updated = await PromoAdModel.findOneAndUpdate(
      { id: "main_promo" },
      { $set: { ...data, updatedAt: /* @__PURE__ */ new Date() } },
      { upsert: true, returnDocument: "after" }
    );
    return updated ? {
      id: updated.id,
      title: updated.title,
      imageUrl: updated.imageUrl,
      targetTab: updated.targetTab,
      targetUrl: updated.targetUrl,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt
    } : null;
  } catch (error) {
    console.error("Failed to update promo ad in database:", error);
    throw new Error("Failed to save promo ad configuration in database.", { cause: error });
  }
}

// src/controllers/patientController.ts
var getProfile = async (req, res) => {
  try {
    const patientId = req.patient?.patientId;
    if (!patientId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const patient = await Patient_default.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json({
      fullName: patient.fullName,
      email: patient.email,
      profilePhoto: patient.profilePhoto,
      createdAt: patient.createdAt,
      lastLogin: patient.lastLogin
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res.status(500).json({ error: error.message || "Failed to fetch profile" });
  }
};
var updateProfile = async (req, res) => {
  try {
    const patientId = req.patient?.patientId;
    const { fullName, profilePhoto } = req.body;
    if (!patientId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const patient = await Patient_default.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (fullName !== void 0) {
      patient.fullName = String(fullName).trim();
    }
    if (profilePhoto !== void 0) {
      patient.profilePhoto = String(profilePhoto).trim();
    }
    await patient.save();
    res.json({
      fullName: patient.fullName,
      email: patient.email,
      profilePhoto: patient.profilePhoto,
      createdAt: patient.createdAt,
      lastLogin: patient.lastLogin
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
};
var getBookings = async (req, res) => {
  try {
    const patientId = req.patient?.patientId;
    if (!patientId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const bookings = await BookingModel.find({ patientId }).sort({ id: -1 });
    res.json(bookings.map(formatBookingDoc));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: error.message || "Failed to fetch bookings" });
  }
};
var sanitizeString = (str) => {
  return str.replace(/[<>]/g, "");
};
var createBooking2 = async (req, res) => {
  try {
    const patientId = req.patient?.patientId;
    if (!patientId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const patient = await Patient_default.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient account not found" });
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
    const doctorName = req.body.doctor ? String(req.body.doctor).trim() : "";
    const departmentName = req.body.department ? String(req.body.department).trim() : "";
    if (!bookingId || !patientName || isNaN(patientAge) || !patientGender || !patientRelationship || !appointmentDate || !appointmentTime || !collectionType || !paymentMethod || !paymentStatus || !bookingStatus || isNaN(totalAmount) || !Array.isArray(items)) {
      return res.status(400).json({ error: "Validation failed: Missing or malformed parameters." });
    }
    if (patientAge < 0 || patientAge > 150) {
      return res.status(400).json({ error: "Validation failed: Invalid patient age." });
    }
    if (totalAmount < 0) {
      return res.status(400).json({ error: "Validation failed: Invalid total amount." });
    }
    try {
      let itemsTotal = 0;
      const dbServices = await getAllServices();
      const dbPackages = await getAllPackages();
      for (const item of items) {
        if (item.itemId === "doctor-consultation") {
          itemsTotal += item.discountPrice !== void 0 ? item.discountPrice : item.price || 0;
          continue;
        }
        const matchedService = dbServices.find((s) => s.id === item.itemId);
        const matchedPackage = dbPackages.find((p) => p.id === item.itemId);
        const catalogItem = matchedService || matchedPackage;
        if (!catalogItem) {
          throw new Error(`Item ${item.itemId} not found in catalog.`);
        }
        const price = catalogItem.discountPrice !== void 0 ? catalogItem.discountPrice : catalogItem.price;
        itemsTotal += price;
      }
      const collectionCharge = collectionType === "home" ? 150 : 0;
      const surcharge = Math.round(itemsTotal * 0.05);
      const expectedTotal = itemsTotal + collectionCharge + surcharge;
      if (totalAmount !== expectedTotal) {
        return res.status(400).json({ error: `Validation failed: Price mismatch. Expected \u20B9${expectedTotal}, but received \u20B9${totalAmount}.` });
      }
    } catch (err) {
      return res.status(400).json({ error: `Validation failed: ${err.message}` });
    }
    const surrogateId = await getNextId("booking");
    const newBooking = new BookingModel({
      id: surrogateId,
      bookingId: sanitizeString(bookingId),
      userId: 9999,
      // Surrogate userId for backward compatibility with Drizzle/User logic
      patientId: new mongoose6.Types.ObjectId(patientId),
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
      timestamp: req.body.timestamp ? sanitizeString(String(req.body.timestamp).trim()) : (/* @__PURE__ */ new Date()).toISOString(),
      doctor: sanitizeString(doctorName),
      department: sanitizeString(departmentName),
      bookingDate: /* @__PURE__ */ new Date()
    });
    await newBooking.save();
    res.status(201).json(formatBookingDoc(newBooking));
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: error.message || "Failed to create booking" });
  }
};
var getBookingById = async (req, res) => {
  try {
    const patientId = req.patient?.patientId;
    const { id } = req.params;
    if (!patientId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let booking;
    if (mongoose6.Types.ObjectId.isValid(id)) {
      booking = await BookingModel.findOne({ _id: id, patientId });
    } else if (/^\d+$/.test(id)) {
      booking = await BookingModel.findOne({ id: parseInt(id, 10), patientId });
    } else {
      booking = await BookingModel.findOne({ bookingId: id, patientId });
    }
    if (!booking) {
      return res.status(404).json({ error: "Booking not found or access denied" });
    }
    res.json(formatBookingDoc(booking));
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ error: error.message || "Failed to fetch booking details" });
  }
};
var cancelBooking = async (req, res) => {
  try {
    const patientId = req.patient?.patientId;
    const { id } = req.params;
    if (!patientId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let booking;
    if (mongoose6.Types.ObjectId.isValid(id)) {
      booking = await BookingModel.findOne({ _id: id, patientId });
    } else if (/^\d+$/.test(id)) {
      booking = await BookingModel.findOne({ id: parseInt(id, 10), patientId });
    } else {
      booking = await BookingModel.findOne({ bookingId: id, patientId });
    }
    if (!booking) {
      return res.status(404).json({ error: "Booking not found or access denied" });
    }
    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }
    if (booking.bookingStatus === "report_ready") {
      return res.status(400).json({ error: "Cannot cancel booking after report has been released" });
    }
    booking.bookingStatus = "cancelled";
    await booking.save();
    res.json({ success: true, bookingStatus: "cancelled" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: error.message || "Failed to cancel booking" });
  }
};

// src/routes/patientRoutes.ts
var router2 = Router2();
router2.get("/patient/profile", requirePatientAuth, getProfile);
router2.put("/patient/profile", requirePatientAuth, updateProfile);
router2.get("/patient/bookings", requirePatientAuth, getBookings);
router2.post("/booking", requirePatientAuth, createBooking2);
router2.get("/booking/:id", requirePatientAuth, getBookingById);
router2.post("/booking/:id/cancel", requirePatientAuth, cancelBooking);
var patientRoutes_default = router2;

// server.ts
var DEFAULT_ADMIN_BOOKINGS_SEED = [
  {
    bookingId: "ASX-984310",
    patient: { name: "Vy9892 Patel", age: 29, gender: "Male", relationship: "Self" },
    items: [
      { itemId: "pkg-fever-profile", itemType: "package", name: "Fever Profile", price: 3e3, discountPrice: 1700, category: "package" }
    ],
    appointmentDate: "2026-07-01",
    appointmentTime: "08:00 AM - 10:00 AM",
    collectionType: "home",
    address: { street: "Flat 405, Blue Meadows, S.V. Road", city: "Malad", pincode: "400064" },
    paymentMethod: "upi",
    paymentStatus: "paid",
    bookingStatus: "report_ready",
    totalAmount: 1700,
    timestamp: "2026-07-01T08:15:00.000Z",
    simulatedReportUrl: "/reports/ASX-984310.pdf"
  },
  {
    bookingId: "ASX-751294",
    patient: { name: "Meera Sharma", age: 45, gender: "Female", relationship: "Other" },
    items: [
      { itemId: "pkg-womens-health-essential", itemType: "package", name: "Women's Health - ESSENTIAL", price: 5e3, discountPrice: 2500, category: "package" }
    ],
    appointmentDate: "2026-07-04",
    appointmentTime: "11:00 AM - 12:00 PM",
    collectionType: "center",
    address: { street: "Goregaon Hub Center Visit", city: "Goregaon", pincode: "400063" },
    paymentMethod: "card",
    paymentStatus: "paid",
    bookingStatus: "sample_collected",
    totalAmount: 2500,
    timestamp: "2026-07-04T11:30:00.000Z",
    simulatedReportUrl: "/reports/ASX-751294.pdf"
  },
  {
    bookingId: "ASX-112399",
    patient: { name: "Rajesh Mehta", age: 52, gender: "Male", relationship: "Other" },
    items: [
      { itemId: "pkg-sugar-profile", itemType: "package", name: "Sugar Profile", price: 2e3, discountPrice: 1e3, category: "package" }
    ],
    appointmentDate: "2026-07-06",
    appointmentTime: "09:00 AM - 11:00 AM",
    collectionType: "center",
    address: { street: "Malad West Clinic Walk-in", city: "Malad", pincode: "400064" },
    paymentMethod: "netbanking",
    paymentStatus: "paid",
    bookingStatus: "booked",
    totalAmount: 1e3,
    timestamp: "2026-07-06T09:10:00.000Z"
  }
];
var dynamicAdminKey = "";
function updateEnvFile(updates) {
  const envPath = path.join(process.cwd(), ".env");
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  }
  const lines = content.split(/\r?\n/);
  for (const [key, val] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*`);
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        lines[i] = `${key}="${val}"`;
        found = true;
        break;
      }
    }
    if (!found) {
      lines.push(`${key}="${val}"`);
    }
  }
  fs.writeFileSync(envPath, lines.join("\n"), "utf8");
}
var adminList = [];
function isValidAdminKey(key) {
  if (typeof key !== "string" || !key) return false;
  const cleanIncoming = key.trim().replace(/^\((.*)\)$/, "$1");
  return adminList.some((admin) => {
    const cleanAdminKey = admin.key.trim().replace(/^\((.*)\)$/, "$1");
    return cleanIncoming === cleanAdminKey || key === admin.key;
  });
}
process.on("uncaughtException", (err) => {
  console.error("\u274C UNCAUGHT EXCEPTION (server still running):", err.message);
  console.error(err.stack);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("\u274C UNHANDLED REJECTION (server still running):", reason);
});
var httpServer = null;
process.on("SIGTERM", () => {
  console.log("\u{1F6D1} SIGTERM received. Shutting down gracefully...");
  if (httpServer) {
    httpServer.close(() => {
      console.log("\u2705 HTTP server closed. Exiting.");
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1e4);
  } else {
    process.exit(0);
  }
});
async function startServer() {
  const defaultEmail = process.env.ADMIN_EMAIL || "superadmin@assurx.com";
  const defaultPassword = process.env.ADMIN_PASSWORD || "assurx_super_2026";
  if (!process.env.ADMIN_API_KEY) {
    dynamicAdminKey = crypto.randomUUID();
    console.warn(`\u26A0\uFE0F SECURITY WARNING: ADMIN_API_KEY environment variable is NOT set! A dynamic fallback key has been generated for this session: ${dynamicAdminKey}`);
  } else {
    dynamicAdminKey = process.env.ADMIN_API_KEY;
  }
  adminList = [
    {
      email: defaultEmail.trim().toLowerCase(),
      password: defaultPassword.trim(),
      key: dynamicAdminKey.trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_1 || "admin1@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_1 || "assurx_adm1_7f8d9b").trim(),
      key: (process.env.ADMIN_KEY_1 || "key_adm1_9f8e7d").trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_2 || "admin2@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_2 || "assurx_adm2_4c3b2a").trim(),
      key: (process.env.ADMIN_KEY_2 || "key_adm2_8a7b6c").trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_3 || "admin3@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_3 || "assurx_adm3_1e2f3g").trim(),
      key: (process.env.ADMIN_KEY_3 || "key_adm3_5d4e3f").trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_4 || "admin4@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_4 || "assurx_adm4_8h9i0j").trim(),
      key: (process.env.ADMIN_KEY_4 || "key_adm4_2g1h0i").trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_5 || "admin5@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_5 || "assurx_adm5_3k4l5m").trim(),
      key: (process.env.ADMIN_KEY_5 || "key_adm5_6n7o8p").trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_6 || "admin6@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_6 || "assurx_adm6_9q0r1s").trim(),
      key: (process.env.ADMIN_KEY_6 || "key_adm6_4t5u6v").trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_7 || "admin7@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_7 || "assurx_adm7_2w3x4y").trim(),
      key: (process.env.ADMIN_KEY_7 || "key_adm7_7z8a9b").trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_8 || "admin8@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_8 || "assurx_adm8_5c6d7e").trim(),
      key: (process.env.ADMIN_KEY_8 || "key_adm8_0f1g2h").trim()
    },
    {
      email: (process.env.ADMIN_EMAIL_9 || "admin9@assurx.com").trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD_9 || "assurx_adm9_8i9j0k").trim(),
      key: (process.env.ADMIN_KEY_9 || "key_adm9_3l4m5n").trim()
    }
  ];
  try {
    await connectDB();
    await seedCatalog();
  } catch (error) {
    console.error("\u26A0\uFE0F WARNING: MongoDB connection failed on startup. Starting server in offline mode. Database features will be unavailable.");
  }
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use((req, res, next) => {
    res.setHeader("Alt-Svc", "clear");
    res.setHeader("Alt-Used", req.headers.host || "");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Keep-Alive", "timeout=120");
    res.setHeader("X-Accel-Buffering", "no");
    next();
  });
  app.use(compression({
    level: 6,
    // Good balance of speed vs compression ratio
    threshold: 1024,
    // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers.accept === "text/event-stream") return false;
      return compression.filter(req, res);
    }
  }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://checkout.razorpay.com https://*.razorpay.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://*.google.com https://*.googleusercontent.com https://*.unsplash.com https://*.razorpay.com; connect-src 'self' https://assurx.co.in https://*.assurx.co.in https://*.google.com https://*.googleapis.com ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* https://*.firebaseapp.com https://api.razorpay.com https://*.razorpay.com; frame-src 'self' https://*.google.com https://*.ai.studio https://*.run.app https://*.firebaseapp.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com; frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://*.ai.studio;"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    next();
  });
  const sanitizeString2 = (str) => {
    return str.replace(/[<>]/g, "");
  };
  const calculateTotalAmount = async (items, collectionType) => {
    let itemsTotal = 0;
    const dbServices = await getAllServices();
    const dbPackages = await getAllPackages();
    for (const item of items) {
      if (item.itemId === "doctor-consultation") {
        itemsTotal += item.discountPrice !== void 0 ? item.discountPrice : item.price || 0;
        continue;
      }
      const matchedService = dbServices.find((s) => s.id === item.itemId);
      const matchedPackage = dbPackages.find((p) => p.id === item.itemId);
      const catalogItem = matchedService || matchedPackage;
      if (!catalogItem) {
        throw new Error(`Item ${item.itemId} not found in catalog.`);
      }
      const price = catalogItem.discountPrice !== void 0 ? catalogItem.discountPrice : catalogItem.price;
      itemsTotal += price;
    }
    const collectionCharge = collectionType === "home" ? 150 : 0;
    const surcharge = Math.round(itemsTotal * 0.05);
    return itemsTotal + collectionCharge + surcharge;
  };
  const rateLimitWindowMs = 15 * 60 * 1e3;
  const rateLimitMaxRequests = 2e3;
  const rateLimitMap = /* @__PURE__ */ new Map();
  const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip.includes("127.0.0.1")) {
      return next();
    }
    const now = Date.now();
    let info = rateLimitMap.get(ip);
    if (!info || now > info.resetTime) {
      info = { count: 1, resetTime: now + rateLimitWindowMs };
      rateLimitMap.set(ip, info);
    } else {
      info.count++;
    }
    res.setHeader("X-RateLimit-Limit", rateLimitMaxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, rateLimitMaxRequests - info.count));
    res.setHeader("X-RateLimit-Reset", new Date(info.resetTime).toISOString());
    if (info.count > rateLimitMaxRequests) {
      return res.status(429).json({ error: "Too many requests. Please try again after 15 minutes." });
    }
    next();
  };
  app.use("/api/", (req, res, next) => {
    if (req.path === "/health") {
      return next();
    }
    rateLimiter(req, res, next);
  });
  const authRateLimitMap = /* @__PURE__ */ new Map();
  const authRateLimiter = (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();
    let info = authRateLimitMap.get(ip);
    const windowMs = 60 * 1e3;
    const maxRequests = 5;
    if (!info || now > info.resetTime) {
      info = { count: 1, resetTime: now + windowMs };
      authRateLimitMap.set(ip, info);
    } else {
      info.count++;
    }
    if (info.count > maxRequests) {
      return res.status(429).json({ error: "Too many authentication attempts. Please try again after 1 minute." });
    }
    next();
  };
  app.use("/api/admin/login", authRateLimiter);
  app.use("/api/auth/google", authRateLimiter);
  app.use("/auth/google", authRateLimiter);
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  let initDataCache = null;
  const INIT_CACHE_TTL = 6e4;
  app.get("/api/init", async (req, res) => {
    try {
      const now = Date.now();
      if (initDataCache && now - initDataCache.timestamp < INIT_CACHE_TTL) {
        res.setHeader("X-Cache", "HIT");
        return res.json(initDataCache.data);
      }
      const [services, packages, centers, doctors, testimonials, faqs, promoAdData] = await Promise.all([
        getAllServices().catch(() => []),
        getAllPackages().catch(() => []),
        getAllCenters().catch(() => []),
        getAllDoctors().catch(() => []),
        getAllTestimonials().catch(() => []),
        getAllFAQs().catch(() => []),
        getPromoAd().catch(() => null)
      ]);
      const data = { services, packages, centers, doctors, testimonials, faqs, promoAd: promoAdData };
      initDataCache = { data, timestamp: now };
      res.setHeader("X-Cache", "MISS");
      res.json(data);
    } catch (error) {
      console.error("Error in /api/init:", error);
      res.status(500).json({ error: "Failed to load initial data" });
    }
  });
  app.post("/api/payments/create-order", async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(Number(amount))) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_live_THjqoa9dwRMlXq";
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "0whX8Ck0YxPnbymio2ICyqpk";
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const postData = JSON.stringify({
        amount: Math.round(Number(amount) * 100),
        // convert to paise
        currency: "INR",
        receipt: `rcpt_${Math.floor(Math.random() * 1e6)}`
      });
      const options = {
        hostname: "api.razorpay.com",
        port: 443,
        path: "/v1/orders",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`,
          "Content-Length": Buffer.byteLength(postData)
        }
      };
      const request = https.request(options, (apiRes) => {
        let body = "";
        apiRes.on("data", (chunk) => {
          body += chunk;
        });
        apiRes.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (apiRes.statusCode === 200 || apiRes.statusCode === 201) {
              res.json({ orderId: data.id });
            } else {
              console.error("Razorpay order creation failed:", data);
              res.status(apiRes.statusCode || 400).json({ error: data.error?.description || "Razorpay API authentication or request error" });
            }
          } catch (e) {
            console.error("Error parsing Razorpay response:", e);
            res.status(500).json({ error: "Failed to parse payment server response" });
          }
        });
      });
      request.on("error", (e) => {
        console.error("HTTP client error when connecting to Razorpay:", e);
        res.status(500).json({ error: "Failed to contact Razorpay servers" });
      });
      request.write(postData);
      request.end();
    } catch (err) {
      console.error("Error creating payment order:", err);
      res.status(500).json({ error: err.message || "Failed to create payment order" });
    }
  });
  app.post("/api/payments/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required payment verification parameters" });
      }
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "0whX8Ck0YxPnbymio2ICyqpk";
      const generatedSignature = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      if (generatedSignature === razorpay_signature) {
        res.json({ success: true, verified: true });
      } else {
        console.error("Razorpay signature mismatch:", { expected: generatedSignature, received: razorpay_signature });
        res.status(400).json({ error: "Invalid payment signature. Transaction authentication failed." });
      }
    } catch (err) {
      console.error("Error verifying payment signature:", err);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });
  app.use("/api/auth", authRoutes_default);
  app.use("/auth", authRoutes_default);
  app.use("/api", patientRoutes_default);
  app.use("/", patientRoutes_default);
  app.post("/api/franchise/apply", async (req, res) => {
    try {
      const { pincode, name, phone, email, investment, experience } = req.body;
      if (!pincode || !name || !phone || !email) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const fs2 = await import("fs");
      const filePath = path.join(process.cwd(), "franchise_applications.json");
      let applications = [];
      if (fs2.existsSync(filePath)) {
        try {
          const content = fs2.readFileSync(filePath, "utf-8");
          applications = JSON.parse(content);
        } catch (e) {
          applications = [];
        }
      }
      const newApplication = {
        id: Date.now(),
        pincode,
        name,
        phone,
        email,
        investment,
        experience,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      applications.push(newApplication);
      fs2.writeFileSync(filePath, JSON.stringify(applications, null, 2));
      console.log(`[Franchise] New application received for Pincode ${pincode} from ${name}`);
      res.json({ success: true, application: newApplication });
    } catch (err) {
      console.error("Error saving franchise application:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/users/sync", requireAuth, async (req, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "";
      if (!uid) {
        return res.status(400).json({ error: "Missing user UID" });
      }
      const user = await getOrCreateUser(uid, email);
      const userBookings = await getUserBookings(uid);
      if (userBookings.length === 0) {
        const maskedEmail = email.replace(/(..)(.*)(@.*)/, "$1***$3");
        console.log(`Pre-seeding clinical records for newly synced user ID: ${user.id} (${maskedEmail})`);
        for (const seed of DEFAULT_ADMIN_BOOKINGS_SEED) {
          try {
            const uniqueBookingId = `${seed.bookingId}-${user.id}`;
            await createBooking({
              bookingId: uniqueBookingId,
              userId: user.id,
              patientName: seed.patient.name,
              patientAge: seed.patient.age,
              patientGender: seed.patient.gender,
              patientRelationship: seed.patient.relationship,
              appointmentDate: seed.appointmentDate,
              appointmentTime: seed.appointmentTime,
              collectionType: seed.collectionType,
              street: seed.address?.street || null,
              city: seed.address?.city || null,
              pincode: seed.address?.pincode || null,
              paymentMethod: seed.paymentMethod,
              paymentStatus: seed.paymentStatus,
              bookingStatus: seed.bookingStatus,
              totalAmount: seed.totalAmount,
              simulatedReportUrl: seed.simulatedReportUrl ? `${seed.simulatedReportUrl}` : null,
              items: JSON.stringify(seed.items),
              timestamp: seed.timestamp || (/* @__PURE__ */ new Date()).toISOString()
            });
          } catch (seedErr) {
            console.log(`Swallowing unique-key/duplicate seed error for ${seed.bookingId}:`, seedErr);
          }
        }
      }
      res.json(user);
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });
  app.post("/api/bookings", async (req, res, next) => {
    const adminKey = req.headers["x-admin-key"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split("Bearer ")[1] : null);
    if (isValidAdminKey(adminKey)) {
      req.user = {
        uid: "admin-walk-in",
        email: "admin@assurx.com"
      };
      return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split("Bearer ")[1] === "undefined" || authHeader.split("Bearer ")[1] === "") {
      return res.status(401).json({ error: "Unauthorized: Patient login required to book." });
    }
    return requireAuth(req, res, next);
  }, async (req, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "";
      if (!uid) {
        return res.status(400).json({ error: "Unauthorized" });
      }
      const user = await getOrCreateUser(uid, email);
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
      if (!bookingId || !patientName || isNaN(patientAge) || !patientGender || !patientRelationship || !appointmentDate || !appointmentTime || !collectionType || !paymentMethod || !paymentStatus || !bookingStatus || isNaN(totalAmount) || !Array.isArray(items)) {
        return res.status(400).json({ error: "Validation failed: Missing or malformed parameters." });
      }
      if (patientAge < 0 || patientAge > 150) {
        return res.status(400).json({ error: "Validation failed: Invalid patient age." });
      }
      if (totalAmount < 0) {
        return res.status(400).json({ error: "Validation failed: Invalid total amount." });
      }
      try {
        const expectedTotal = await calculateTotalAmount(items, collectionType);
        if (totalAmount !== expectedTotal) {
          return res.status(400).json({ error: `Validation failed: Price mismatch. Expected \u20B9${expectedTotal}, but received \u20B9${totalAmount}.` });
        }
      } catch (err) {
        return res.status(400).json({ error: `Validation failed: ${err.message}` });
      }
      const bookingData = {
        bookingId: sanitizeString2(bookingId),
        userId: user.id,
        patientName: sanitizeString2(patientName),
        patientAge,
        patientGender: sanitizeString2(patientGender),
        patientRelationship: sanitizeString2(patientRelationship),
        appointmentDate: sanitizeString2(appointmentDate),
        appointmentTime: sanitizeString2(appointmentTime),
        collectionType: sanitizeString2(collectionType),
        street: req.body.street ? sanitizeString2(String(req.body.street).trim()).substring(0, 200) : null,
        city: req.body.city ? sanitizeString2(String(req.body.city).trim()).substring(0, 100) : null,
        pincode: req.body.pincode ? sanitizeString2(String(req.body.pincode).trim()).substring(0, 10) : null,
        paymentMethod: sanitizeString2(paymentMethod),
        paymentStatus: sanitizeString2(paymentStatus),
        bookingStatus: sanitizeString2(bookingStatus),
        totalAmount,
        prescriptionName: req.body.prescriptionName ? sanitizeString2(String(req.body.prescriptionName).trim()).substring(0, 200) : null,
        simulatedReportUrl: req.body.simulatedReportUrl ? sanitizeString2(String(req.body.simulatedReportUrl).trim()).substring(0, 500) : null,
        items: JSON.stringify(items),
        timestamp: req.body.timestamp ? sanitizeString2(String(req.body.timestamp).trim()) : (/* @__PURE__ */ new Date()).toISOString()
      };
      const newB = await createBooking(bookingData);
      res.status(201).json(newB);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: error.message || "Failed to save booking" });
    }
  });
  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(400).json({ error: "Unauthorized" });
      }
      const bookingsList = await getUserBookings(uid);
      res.json(bookingsList);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve bookings" });
    }
  });
  app.get("/api/bookings/track/:bookingId", async (req, res) => {
    try {
      const bookingId = String(req.params.bookingId || "").trim().toUpperCase();
      if (!bookingId) {
        return res.status(400).json({ error: "Booking ID is required" });
      }
      const b = await getBookingByBookingId(bookingId);
      if (!b) {
        return res.status(404).json({ error: "Booking not found with that reference ID" });
      }
      const adminKey = req.headers["x-admin-key"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split("Bearer ")[1] : null);
      const isAdmin = isValidAdminKey(adminKey);
      if (!isAdmin) {
        const guestUser = await getOrCreateUser("guest-user", "guest@assurx.com");
        const isGuestBooking = b.userId === guestUser.id;
        if (!isGuestBooking) {
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: Please sign in to track and view your booking." });
          }
          const token = authHeader.split("Bearer ")[1];
          let decodedUser = null;
          let isCustomJwt = false;
          let patientIdStr = "";
          let googleUidStr = "";
          let emailStr = "";
          try {
            const { verifyToken: verifyToken2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
            const decoded = verifyToken2(token);
            if (decoded && decoded.role === "Patient") {
              isCustomJwt = true;
              patientIdStr = decoded.patientId;
              googleUidStr = decoded.googleUid;
              emailStr = decoded.email;
            }
          } catch (jwtErr) {
          }
          if (isCustomJwt) {
            if (b.patientId) {
              if (String(b.patientId) !== patientIdStr) {
                return res.status(403).json({ error: "Forbidden: You are not authorized to view this booking. Only the owner can view this." });
              }
            } else {
              const dbUser = await getOrCreateUser(googleUidStr, emailStr);
              if (b.userId !== dbUser.id) {
                return res.status(403).json({ error: "Forbidden: You are not authorized to view this booking. Only the owner can view this." });
              }
            }
          } else {
            try {
              const { adminAuth: adminAuth2 } = await Promise.resolve().then(() => (init_firebase_admin(), firebase_admin_exports));
              decodedUser = await adminAuth2.verifyIdToken(token);
            } catch (jwtErr) {
              console.error("Firebase ID token verification failed in tracker:", jwtErr);
              return res.status(401).json({ error: "Unauthorized: Invalid or expired session token." });
            }
            if (!decodedUser || !decodedUser.uid) {
              return res.status(401).json({ error: "Unauthorized: User session invalid." });
            }
            const dbUser = await getOrCreateUser(decodedUser.uid, decodedUser.email || "");
            if (b.userId !== dbUser.id) {
              return res.status(403).json({ error: "Forbidden: You are not authorized to view this booking. Only the booking person can view this order." });
            }
          }
        }
      }
      res.json(b);
    } catch (error) {
      console.error("Error tracking booking:", error);
      res.status(500).json({ error: error.message || "Failed to find booking" });
    }
  });
  app.post("/api/prescriptions", async (req, res) => {
    try {
      let dbUserId = void 0;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        try {
          const { adminAuth: adminAuth2 } = await Promise.resolve().then(() => (init_firebase_admin(), firebase_admin_exports));
          const decodedToken = await adminAuth2.verifyIdToken(token);
          const email = decodedToken.email || "";
          const userObj = await getOrCreateUser(decodedToken.uid, email);
          dbUserId = userObj.id;
        } catch (err) {
          console.warn("Invalid auth token on prescription submit, proceeding as guest", err);
        }
      }
      const prescriptionId = String(req.body.prescriptionId || "").trim();
      const patientName = String(req.body.patientName || "").trim().substring(0, 100);
      const patientPhone = String(req.body.patientPhone || "").trim();
      const fileName = String(req.body.fileName || "").trim().substring(0, 200);
      if (!prescriptionId || !patientName || !patientPhone || !fileName) {
        return res.status(400).json({ error: "Validation failed: Missing required prescription parameters." });
      }
      if (!/^\d{10}$/.test(patientPhone)) {
        return res.status(400).json({ error: "Validation failed: Phone number must be exactly 10 digits." });
      }
      const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
      const ext = path.extname(fileName).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ error: "Validation failed: Unsupported file extension." });
      }
      const prescriptionData = {
        prescriptionId: sanitizeString2(prescriptionId),
        userId: dbUserId || null,
        patientName: sanitizeString2(patientName),
        patientPhone: sanitizeString2(patientPhone),
        fileName: sanitizeString2(fileName),
        doctorName: req.body.doctorName ? sanitizeString2(String(req.body.doctorName).trim()).substring(0, 100) : null,
        dontKnowTests: !!req.body.dontKnowTests,
        extractedServiceIds: req.body.extractedServiceIds ? JSON.stringify(req.body.extractedServiceIds) : null,
        status: req.body.status ? sanitizeString2(String(req.body.status).trim()).substring(0, 50) : "pending_call",
        timestamp: req.body.timestamp ? sanitizeString2(String(req.body.timestamp).trim()) : (/* @__PURE__ */ new Date()).toISOString()
      };
      const newPrx = await createPrescription(prescriptionData);
      res.status(201).json(newPrx);
    } catch (error) {
      console.error("Error creating prescription:", error);
      res.status(500).json({ error: error.message || "Failed to save prescription lead" });
    }
  });
  app.post("/api/users/session", requireAuth, async (req, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(400).json({ error: "Missing user UID" });
      const { sessionId } = req.body;
      if (typeof sessionId !== "string") {
        return res.status(400).json({ error: "sessionId is required" });
      }
      await updateUserSession(uid, sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user session:", error);
      res.status(500).json({ error: error.message || "Failed to update session" });
    }
  });
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, key } = req.body;
      if (typeof email !== "string" || typeof password !== "string" || typeof key !== "string") {
        return res.status(401).json({ error: "Invalid administrator credentials or security key." });
      }
      const matchedAdmin = adminList.find(
        (a) => a.email === email.trim().toLowerCase() && a.password === password.trim() && a.key === key.trim()
      );
      if (!matchedAdmin) {
        return res.status(401).json({ error: "Invalid administrator credentials or security key." });
      }
      const sessionId = crypto.randomUUID();
      await addAdminSession(matchedAdmin.email, sessionId);
      res.json({ success: true, sessionId });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: error.message || "Admin login failed" });
    }
  });
  app.post("/api/admin/logout", async (req, res) => {
    try {
      const incomingSession = req.headers["x-admin-session"];
      const adminEmail = req.headers["x-admin-email"];
      let emailToClear = adminEmail ? adminEmail.trim().toLowerCase() : "";
      if (!emailToClear && incomingSession) {
        const doc = await AdminSessionModel.findOne({
          $or: [
            { activeSessions: incomingSession },
            { activeSession: incomingSession }
          ]
        }).lean();
        if (doc) {
          emailToClear = doc._id;
        }
      }
      if (emailToClear && incomingSession) {
        await removeAdminSession(emailToClear, incomingSession);
      } else if (emailToClear) {
        await clearAdminSession(emailToClear);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error during admin logout:", error);
      res.status(500).json({ error: error.message || "Admin logout failed" });
    }
  });
  const requireAdminAuth = async (req, res, next) => {
    const adminKey = req.headers["x-admin-key"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split("Bearer ")[1] : null);
    if (!isValidAdminKey(adminKey)) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid admin key" });
    }
    const adminEmail = req.headers["x-admin-email"];
    if (adminEmail) {
      const matchedAdmin = adminList.find((a) => a.email === adminEmail.trim().toLowerCase());
      if (!matchedAdmin || matchedAdmin.key !== adminKey) {
        return res.status(401).json({ error: "Unauthorized: Invalid key for this admin account" });
      }
    }
    try {
      const incomingSession = req.headers["x-admin-session"];
      const adminEmail2 = req.headers["x-admin-email"];
      if (adminEmail2 && incomingSession) {
        const isValid = await isValidAdminSession(adminEmail2, incomingSession);
        if (!isValid) {
          return res.status(401).json({
            error: "Admin session is invalid or has expired. Please log in again."
          });
        }
      } else if (incomingSession) {
        const doc = await AdminSessionModel.findOne({
          $or: [
            { activeSessions: incomingSession },
            { activeSession: incomingSession }
          ]
        }).lean();
        if (!doc) {
          return res.status(401).json({
            error: "Admin session is invalid or has expired. Please log in again."
          });
        }
      }
    } catch (sessionErr) {
      console.warn("Admin session check skipped due to DB error:", sessionErr);
    }
    return next();
  };
  app.post("/api/admin/reset", requireAdminAuth, async (req, res) => {
    try {
      await clearAllData();
      res.json({ success: true, message: "All admin bookings and prescriptions cleared from database." });
    } catch (error) {
      console.error("Error resetting database:", error);
      res.status(500).json({ error: error.message || "Failed to reset database" });
    }
  });
  app.post("/api/admin/update-credentials", requireAdminAuth, async (req, res) => {
    try {
      const { newPassword, newKey } = req.body;
      const adminEmail = req.headers["x-admin-email"];
      if (!adminEmail) {
        return res.status(400).json({ error: "Missing admin identity header." });
      }
      const matchedAdmin = adminList.find((a) => a.email === adminEmail.trim().toLowerCase());
      if (!matchedAdmin) {
        return res.status(404).json({ error: "Administrator account not found." });
      }
      const updates = {};
      if (newPassword && typeof newPassword === "string" && newPassword.trim()) {
        matchedAdmin.password = newPassword.trim();
        if (matchedAdmin.email === (process.env.ADMIN_EMAIL || "sonusonuraj415@gmail.com").trim().toLowerCase()) {
          updates["ADMIN_PASSWORD"] = newPassword.trim();
          process.env.ADMIN_PASSWORD = newPassword.trim();
        } else if (matchedAdmin.email === (process.env.ADMIN_EMAIL_1 || "admin1@assurx.com").trim().toLowerCase()) {
          updates["ADMIN_PASSWORD_1"] = newPassword.trim();
          process.env.ADMIN_PASSWORD_1 = newPassword.trim();
        } else if (matchedAdmin.email === (process.env.ADMIN_EMAIL_2 || "admin2@assurx.com").trim().toLowerCase()) {
          updates["ADMIN_PASSWORD_2"] = newPassword.trim();
          process.env.ADMIN_PASSWORD_2 = newPassword.trim();
        }
      }
      if (newKey && typeof newKey === "string" && newKey.trim()) {
        matchedAdmin.key = newKey.trim();
        if (matchedAdmin.email === (process.env.ADMIN_EMAIL || "sonusonuraj415@gmail.com").trim().toLowerCase()) {
          updates["ADMIN_API_KEY"] = newKey.trim();
          process.env.ADMIN_API_KEY = newKey.trim();
          dynamicAdminKey = newKey.trim();
        } else if (matchedAdmin.email === (process.env.ADMIN_EMAIL_1 || "admin1@assurx.com").trim().toLowerCase()) {
          updates["ADMIN_KEY_1"] = newKey.trim();
          process.env.ADMIN_KEY_1 = newKey.trim();
        } else if (matchedAdmin.email === (process.env.ADMIN_EMAIL_2 || "admin2@assurx.com").trim().toLowerCase()) {
          updates["ADMIN_KEY_2"] = newKey.trim();
          process.env.ADMIN_KEY_2 = newKey.trim();
        }
      }
      if (Object.keys(updates).length > 0) {
        updateEnvFile(updates);
      }
      res.json({ success: true, message: "Credentials updated successfully." });
    } catch (error) {
      console.error("Error updating admin credentials:", error);
      res.status(500).json({ error: error.message || "Failed to update administrator credentials." });
    }
  });
  app.get("/api/services", async (req, res) => {
    try {
      const services = await getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: error.message || "Failed to fetch services" });
    }
  });
  app.post("/api/admin/services", requireAdminAuth, async (req, res) => {
    try {
      const newService = await createService(req.body);
      res.json(newService);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ error: error.message || "Failed to create service" });
    }
  });
  app.put("/api/admin/services/:id", requireAdminAuth, async (req, res) => {
    try {
      const updatedService = await updateService(req.params.id, req.body);
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: error.message || "Failed to update service" });
    }
  });
  app.delete("/api/admin/services/:id", requireAdminAuth, async (req, res) => {
    try {
      const deletedService = await deleteService(req.params.id);
      res.json(deletedService);
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: error.message || "Failed to delete service" });
    }
  });
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await getAllPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ error: error.message || "Failed to fetch packages" });
    }
  });
  app.post("/api/admin/packages", requireAdminAuth, async (req, res) => {
    try {
      const newPackage = await createPackage(req.body);
      res.json(newPackage);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ error: error.message || "Failed to create package" });
    }
  });
  app.put("/api/admin/packages/:id", requireAdminAuth, async (req, res) => {
    try {
      const updatedPackage = await updatePackage(req.params.id, req.body);
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).json({ error: error.message || "Failed to update package" });
    }
  });
  app.delete("/api/admin/packages/:id", requireAdminAuth, async (req, res) => {
    try {
      const deletedPackage = await deletePackage(req.params.id);
      res.json(deletedPackage);
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ error: error.message || "Failed to delete package" });
    }
  });
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await getAllTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ error: error.message || "Failed to fetch testimonials" });
    }
  });
  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await getAllFAQs();
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: error.message || "Failed to fetch FAQs" });
    }
  });
  app.get("/api/centers", async (req, res) => {
    try {
      const centers = await getAllCenters();
      res.json(centers);
    } catch (error) {
      console.error("Error fetching centers:", error);
      res.status(500).json({ error: error.message || "Failed to fetch centers" });
    }
  });
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await getAllDoctors();
      res.json(doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ error: error.message || "Failed to fetch doctors" });
    }
  });
  app.post("/api/admin/doctors", requireAdminAuth, async (req, res) => {
    try {
      const doc = await createDoctor(req.body);
      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating doctor:", error);
      res.status(500).json({ error: error.message || "Failed to create doctor" });
    }
  });
  app.put("/api/admin/doctors/:id", requireAdminAuth, async (req, res) => {
    try {
      const doc = await updateDoctor(req.params.id, req.body);
      res.json(doc);
    } catch (error) {
      console.error("Error updating doctor:", error);
      res.status(500).json({ error: error.message || "Failed to update doctor" });
    }
  });
  app.delete("/api/admin/doctors/:id", requireAdminAuth, async (req, res) => {
    try {
      const deleted = await deleteDoctor(req.params.id);
      res.json(deleted || { success: true });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      res.status(500).json({ error: error.message || "Failed to delete doctor" });
    }
  });
  app.post("/api/admin/centers", requireAdminAuth, async (req, res) => {
    try {
      const center = await createCenter(req.body);
      res.status(201).json(center);
    } catch (error) {
      console.error("Error creating center:", error);
      res.status(500).json({ error: error.message || "Failed to create center" });
    }
  });
  app.put("/api/admin/centers/:id", requireAdminAuth, async (req, res) => {
    try {
      const center = await updateCenter(req.params.id, req.body);
      res.json(center);
    } catch (error) {
      console.error("Error updating center:", error);
      res.status(500).json({ error: error.message || "Failed to update center" });
    }
  });
  app.delete("/api/admin/centers/:id", requireAdminAuth, async (req, res) => {
    try {
      const deleted = await deleteCenter(req.params.id);
      res.json(deleted || { success: true });
    } catch (error) {
      console.error("Error deleting center:", error);
      res.status(500).json({ error: error.message || "Failed to delete center" });
    }
  });
  app.post("/api/admin/testimonials", requireAdminAuth, async (req, res) => {
    try {
      const testimonial = await createTestimonial(req.body);
      res.status(201).json(testimonial);
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ error: error.message || "Failed to create testimonial" });
    }
  });
  app.put("/api/admin/testimonials/:id", requireAdminAuth, async (req, res) => {
    try {
      const testimonial = await updateTestimonial(req.params.id, req.body);
      res.json(testimonial);
    } catch (error) {
      console.error("Error updating testimonial:", error);
      res.status(500).json({ error: error.message || "Failed to update testimonial" });
    }
  });
  app.delete("/api/admin/testimonials/:id", requireAdminAuth, async (req, res) => {
    try {
      const deleted = await deleteTestimonial(req.params.id);
      res.json(deleted || { success: true });
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      res.status(500).json({ error: error.message || "Failed to delete testimonial" });
    }
  });
  app.post("/api/admin/faqs", requireAdminAuth, async (req, res) => {
    try {
      const faq = await createFAQ(req.body);
      res.status(201).json(faq);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(500).json({ error: error.message || "Failed to create FAQ" });
    }
  });
  app.put("/api/admin/faqs/:id", requireAdminAuth, async (req, res) => {
    try {
      const faq = await updateFAQ(req.params.id, req.body);
      res.json(faq);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      res.status(500).json({ error: error.message || "Failed to update FAQ" });
    }
  });
  app.delete("/api/admin/faqs/:id", requireAdminAuth, async (req, res) => {
    try {
      const deleted = await deleteFAQ(req.params.id);
      res.json(deleted || { success: true });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      res.status(500).json({ error: error.message || "Failed to delete FAQ" });
    }
  });
  app.get("/api/promo-ad", async (req, res) => {
    try {
      const promo = await getPromoAd();
      res.json(promo);
    } catch (error) {
      console.error("Error fetching promo ad:", error);
      res.json({
        id: "main_promo",
        title: "AssurX Diagnostics Promotional Camp",
        imageUrl: "/promotional_camp.jpg",
        targetTab: "labs",
        targetUrl: "",
        isActive: true
      });
    }
  });
  app.post("/api/admin/promo-ad", requireAdminAuth, async (req, res) => {
    try {
      const { title, imageUrl, targetTab, targetUrl, isActive } = req.body;
      const updated = await updatePromoAd({
        title: typeof title === "string" ? title.trim() : void 0,
        imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : void 0,
        targetTab: typeof targetTab === "string" ? targetTab.trim() : void 0,
        targetUrl: typeof targetUrl === "string" ? targetUrl.trim() : void 0,
        isActive: typeof isActive === "boolean" ? isActive : void 0
      });
      res.json({ success: true, promo: updated });
    } catch (error) {
      console.error("Error updating promo ad:", error);
      res.status(500).json({ error: error.message || "Failed to update promo ad" });
    }
  });
  app.get("/api/admin/bookings", requireAdminAuth, async (req, res) => {
    try {
      const bookingsList = await getAllBookings();
      res.json(bookingsList);
    } catch (error) {
      console.error("Error admin fetching bookings:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve bookings" });
    }
  });
  app.patch("/api/admin/bookings/:id", requireAdminAuth, async (req, res) => {
    try {
      const rawId = req.params.id;
      if (!rawId) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }
      const id = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : rawId;
      const updateData = {};
      if (req.body.bookingStatus !== void 0) updateData.bookingStatus = sanitizeString2(String(req.body.bookingStatus).trim()).substring(0, 50);
      if (req.body.paymentStatus !== void 0) updateData.paymentStatus = sanitizeString2(String(req.body.paymentStatus).trim()).substring(0, 50);
      if (req.body.simulatedReportUrl !== void 0) updateData.simulatedReportUrl = sanitizeString2(String(req.body.simulatedReportUrl).trim()).substring(0, 500);
      if (req.body.patientName !== void 0) updateData.patientName = sanitizeString2(String(req.body.patientName).trim()).substring(0, 100);
      if (req.body.patientAge !== void 0) {
        const age = parseInt(req.body.patientAge, 10);
        if (isNaN(age) || age < 0 || age > 150) {
          return res.status(400).json({ error: "Invalid patient age value" });
        }
        updateData.patientAge = age;
      }
      if (req.body.patientGender !== void 0) updateData.patientGender = sanitizeString2(String(req.body.patientGender).trim()).substring(0, 20);
      if (req.body.patientRelationship !== void 0) updateData.patientRelationship = sanitizeString2(String(req.body.patientRelationship).trim()).substring(0, 50);
      if (req.body.appointmentDate !== void 0) updateData.appointmentDate = sanitizeString2(String(req.body.appointmentDate).trim());
      if (req.body.appointmentTime !== void 0) updateData.appointmentTime = sanitizeString2(String(req.body.appointmentTime).trim());
      if (req.body.collectionType !== void 0) updateData.collectionType = sanitizeString2(String(req.body.collectionType).trim());
      if (req.body.street !== void 0) updateData.street = sanitizeString2(String(req.body.street).trim()).substring(0, 200);
      if (req.body.city !== void 0) updateData.city = sanitizeString2(String(req.body.city).trim()).substring(0, 100);
      if (req.body.pincode !== void 0) updateData.pincode = sanitizeString2(String(req.body.pincode).trim()).substring(0, 10);
      const updated = await updateBooking(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: error.message || "Failed to update booking" });
    }
  });
  app.delete("/api/admin/bookings/:id", requireAdminAuth, async (req, res) => {
    try {
      const rawId = req.params.id;
      if (!rawId) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }
      const id = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : rawId;
      const deleted = await deleteBooking(id);
      res.json(deleted || { success: true });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ error: error.message || "Failed to delete booking" });
    }
  });
  app.get("/api/admin/prescriptions", requireAdminAuth, async (req, res) => {
    try {
      const prescriptionsList = await getAllPrescriptions();
      const parsed = prescriptionsList.map((p) => {
        let extIds = [];
        if (p.extractedServiceIds) {
          try {
            extIds = JSON.parse(p.extractedServiceIds);
          } catch {
            extIds = [];
          }
        }
        return {
          id: String(p.id),
          // String format for UI compatibility
          prescriptionId: p.prescriptionId,
          patientName: p.patientName,
          patientPhone: p.patientPhone,
          fileName: p.fileName,
          doctorName: p.doctorName,
          dontKnowTests: p.dontKnowTests,
          extractedServiceIds: extIds,
          status: p.status,
          timestamp: p.timestamp
        };
      });
      res.json(parsed);
    } catch (error) {
      console.error("Error admin fetching prescriptions:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve prescriptions" });
    }
  });
  app.patch("/api/admin/prescriptions/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid prescription ID" });
      }
      const updateData = {};
      if (req.body.status !== void 0) {
        updateData.status = sanitizeString2(String(req.body.status).trim()).substring(0, 50);
      }
      const updated = await updatePrescription(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating prescription:", error);
      res.status(500).json({ error: error.message || "Failed to update prescription" });
    }
  });
  app.delete("/api/admin/prescriptions/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid prescription ID" });
      }
      const deleted = await deletePrescription(id);
      res.json(deleted || { success: true });
    } catch (error) {
      console.error("Error deleting prescription:", error);
      res.status(500).json({ error: error.message || "Failed to delete prescription" });
    }
  });
  app.post("/api/careers/apply", async (req, res) => {
    try {
      const { fullName, email, phone, position, experience, resumeLink, notes } = req.body;
      if (!fullName || !email || !phone || !position || !experience) {
        return res.status(400).json({ error: "Missing required job application fields" });
      }
      const digits = Math.floor(1e5 + Math.random() * 9e5);
      const applicationId = `APP-${digits}`;
      const application = await createJobApplication({
        applicationId,
        fullName,
        email,
        phone,
        position,
        experience,
        resumeLink: resumeLink || "",
        notes: notes || ""
      });
      res.status(201).json({ success: true, application });
    } catch (error) {
      console.error("Error creating job application:", error);
      res.status(500).json({ error: error.message || "Failed to submit job application" });
    }
  });
  app.get("/api/admin/careers", requireAdminAuth, async (req, res) => {
    try {
      const list = await getAllJobApplications();
      res.json(list);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ error: error.message || "Failed to fetch job applications" });
    }
  });
  app.patch("/api/admin/careers/:id/status", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (isNaN(id) || !status) {
        return res.status(400).json({ error: "Invalid parameters" });
      }
      const updated = await updateJobApplicationStatus(id, status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ error: error.message || "Failed to update status" });
    }
  });
  app.delete("/api/admin/careers/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }
      const deleted = await deleteJobApplication(id);
      res.json(deleted || { success: true });
    } catch (error) {
      console.error("Error deleting job application:", error);
      res.status(500).json({ error: error.message || "Failed to delete job application" });
    }
  });
  app.use((err, req, res, next) => {
    console.error(`\u274C Route Error [${req.method} ${req.path}]:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error. Please try again." });
    }
  });
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production" || hasDist;
  if (!isProduction) {
    console.log("\u{1F680} Starting Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("\u26A1 Serving production static build from ./dist");
    app.use(express.static(distPath, {
      maxAge: "7d",
      // Cache static files for 7 days
      etag: true,
      // Enable ETag for cache validation
      lastModified: true,
      // Enable Last-Modified header
      immutable: true
      // Hashed assets never change
    }));
    app.get("/{*splat}", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    httpServer = server;
    console.log(`\u2705 Server running on http://localhost:${PORT}`);
    console.log(`\u{1F4CC} Environment: ${process.env.NODE_ENV || "development"}`);
    setInterval(() => {
      try {
        http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
          res.resume();
        }).on("error", () => {
        });
      } catch (e) {
      }
    }, 2 * 60 * 1e3);
    const localPingUrl = `http://127.0.0.1:${PORT}/api/health`;
    const externalPingUrl = process.env.APP_URL ? `${process.env.APP_URL.replace(/\/$/, "")}/api/health` : null;
    const performKeepAlivePing = () => {
      try {
        http.get(localPingUrl, { timeout: 5e3 }, (res) => {
          res.resume();
        }).on("error", () => {
        });
      } catch (e) {
      }
      if (externalPingUrl && !externalPingUrl.includes("localhost") && !externalPingUrl.includes("127.0.0.1")) {
        try {
          const client = externalPingUrl.startsWith("https") ? https : http;
          const req = client.get(externalPingUrl, { timeout: 8e3 }, (res) => {
            res.resume();
            console.log(`[Keep-Alive 5-Min Ping] External ping OK: ${res.statusCode} at ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`);
          });
          req.on("timeout", () => {
            req.destroy();
          });
          req.on("error", () => {
          });
        } catch (e) {
        }
      }
    };
    setTimeout(performKeepAlivePing, 15e3);
    setInterval(performKeepAlivePing, 5 * 60 * 1e3);
    setInterval(() => {
      if (global.gc) global.gc();
    }, 5 * 60 * 1e3);
    if (process.env.NODE_ENV === "production") {
      setInterval(() => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor(uptime % 3600 / 60);
        const mem = process.memoryUsage();
        console.log(`[Health] Uptime: ${hours}h ${mins}m | RSS: ${Math.round(mem.rss / 1024 / 1024)}MB | Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB | ${(/* @__PURE__ */ new Date()).toISOString()}`);
      }, 10 * 60 * 1e3);
    }
  });
  server.keepAliveTimeout = 125e3;
  server.headersTimeout = 126e3;
  server.requestTimeout = 12e4;
  server.timeout = 12e4;
  server.on("connection", (socket) => {
    socket.on("error", (err) => {
      const ignoredCodes = ["ECONNRESET", "ECONNABORTED", "EPIPE", "ECANCELED", "ETIMEDOUT", "ERR_STREAM_PREMATURE_CLOSE"];
      if (!ignoredCodes.includes(err.code)) {
        console.warn(`[Socket] Connection error: ${err.code || err.message}`);
      }
    });
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\u274C Port ${PORT} is already in use by another running process.`);
      console.error(`\u{1F449} Solution: Port 3000 par pehle se server chal raha hai. Aap apne purane terminal ko band karein ya 'npx kill-port 3000' run karein.`);
    } else {
      console.error("Server startup error:", err);
    }
  });
}
startServer().catch((err) => {
  console.error("\u274C FATAL: Server failed to start:", err);
  setTimeout(() => {
    console.log("\u{1F504} Retrying server startup...");
    startServer().catch((retryErr) => {
      console.error("\u274C FATAL: Server retry also failed:", retryErr);
      process.exit(1);
    });
  }, 5e3);
});
//# sourceMappingURL=server.js.map
