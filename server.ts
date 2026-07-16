import express from "express";
import path from "path";
import https from "https";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, updateUserSession, getUserActiveSession } from "./src/db/users.ts";
import { getAdminSession, setAdminSession, clearAdminSession } from "./src/db/adminSession.ts";
import authRoutes from "./src/routes/authRoutes.ts";
import patientRoutes from "./src/routes/patientRoutes.ts";
import { connectDB } from "./src/db/index.ts";
import { DIAGNOSTIC_SERVICES, HEALTH_PACKAGES } from "./src/data.ts";

function pingServer(url: string) {
  try {
    const formattedUrl = url.endsWith("/") ? `${url}api/health` : `${url}/api/health`;
    https.get(formattedUrl, (res) => {
      console.log(`[Self-Ping] Status Code: ${res.statusCode} at ${new Date().toISOString()}`);
    }).on("error", (err) => {
      console.error("[Self-Ping] Error:", err.message);
    });
  } catch (err: any) {
    console.error("[Self-Ping] Exception:", err.message);
  }
}
import {
  createBooking,
  getUserBookings,
  getBookingByBookingId,
  getAllBookings,
  updateBooking,
  deleteBooking,
  createPrescription,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription,
  clearAllData,
  createJobApplication,
  getAllJobApplications,
  updateJobApplicationStatus,
  deleteJobApplication,
} from "./src/db/queries.ts";

const DEFAULT_ADMIN_BOOKINGS_SEED = [
  {
    bookingId: 'ASX-984310',
    patient: { name: 'Vy9892 Patel', age: 29, gender: 'Male', relationship: 'Self' },
    items: [
      { itemId: 'lab-thyroid', itemType: 'service', name: 'Thyroid Profile (T3, T4, Ultra-TSH)', price: 800, discountPrice: 390, category: 'lab' },
      { itemId: 'lab-vitamin-d', itemType: 'service', name: 'Vitamin D (25-Hydroxy)', price: 1500, discountPrice: 690, category: 'lab' }
    ],
    appointmentDate: '2026-07-01',
    appointmentTime: '08:00 AM - 10:00 AM',
    collectionType: 'home',
    address: { street: 'Flat 405, Blue Meadows, S.V. Road', city: 'Malad', pincode: '400064' },
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    bookingStatus: 'report_ready',
    totalAmount: 1230,
    timestamp: '2026-07-01T08:15:00.000Z',
    simulatedReportUrl: '/reports/ASX-984310.pdf'
  },
  {
    bookingId: 'ASX-751294',
    patient: { name: 'Meera Sharma', age: 45, gender: 'Female', relationship: 'Other' },
    items: [
      { itemId: 'scan-xray-chest', itemType: 'service', name: 'Digital X-Ray Chest PA View', price: 600, discountPrice: 350, category: 'scan' }
    ],
    appointmentDate: '2026-07-04',
    appointmentTime: '11:00 AM - 12:00 PM',
    collectionType: 'center',
    address: { street: 'Goregaon Hub Center Visit', city: 'Goregaon', pincode: '400063' },
    paymentMethod: 'card',
    paymentStatus: 'paid',
    bookingStatus: 'sample_collected',
    totalAmount: 350,
    timestamp: '2026-07-04T11:30:00.000Z',
    simulatedReportUrl: '/reports/ASX-751294.pdf'
  },
  {
    bookingId: 'ASX-112399',
    patient: { name: 'Rajesh Mehta', age: 52, gender: 'Male', relationship: 'Other' },
    items: [
      { itemId: 'lab-diabetes', itemType: 'service', name: 'Diabetic Screening Profile', price: 900, discountPrice: 450, category: 'lab' }
    ],
    appointmentDate: '2026-07-06',
    appointmentTime: '09:00 AM - 11:00 AM',
    collectionType: 'center',
    address: { street: 'Malad West Clinic Walk-in', city: 'Malad', pincode: '400064' },
    paymentMethod: 'netbanking',
    paymentStatus: 'paid',
    bookingStatus: 'booked',
    totalAmount: 450,
    timestamp: '2026-07-06T09:10:00.000Z'
  }
];

let dynamicAdminKey = "";

interface AdminInfo {
  email: string;
  password: string;
  key: string;
}

let adminList: AdminInfo[] = [];

function isValidAdminKey(key: any): boolean {
  if (typeof key !== "string" || !key) return false;
  const cleanIncoming = key.trim().replace(/^\((.*)\)$/, "$1");
  return adminList.some(admin => {
    const cleanAdminKey = admin.key.trim().replace(/^\((.*)\)$/, "$1");
    return cleanIncoming === cleanAdminKey || key === admin.key;
  });
}

async function startServer() {
  const defaultEmail = process.env.ADMIN_EMAIL || "sonusonuraj415@gmail.com";
  const defaultPassword = process.env.ADMIN_PASSWORD || "assurxlab2026";

  if (!process.env.ADMIN_API_KEY) {
    dynamicAdminKey = crypto.randomUUID();
    console.warn(`⚠️ SECURITY WARNING: ADMIN_API_KEY environment variable is NOT set! A dynamic fallback key has been generated for this session: ${dynamicAdminKey}`);
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
    }
  ];

  try {
    await connectDB();
  } catch (error) {
    console.error("⚠️ WARNING: MongoDB connection failed on startup. Starting server in offline mode. Database features will be unavailable.");
  }
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());


  // --- SECURITY ENHANCEMENTS: SECURITY HEADERS & RATE LIMITER ---

  // 1. Secure HTTP Headers Middleware
  app.use((req, res, next) => {
    // Content Security Policy (CSP) tailored for medical applet & Google AI Studio embedding compatibility
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://checkout.razorpay.com https://*.razorpay.com https://cdnjs.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data: https://*.google.com https://*.googleusercontent.com https://*.unsplash.com https://*.razorpay.com; " +
      "connect-src 'self' https://*.google.com https://*.googleapis.com ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* https://*.firebaseapp.com https://api.razorpay.com https://*.razorpay.com; " +
      "frame-src 'self' https://*.google.com https://*.ai.studio https://*.run.app https://*.firebaseapp.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com; " +
      "frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://*.ai.studio;"
    );
    // Prevent MIME-sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Prevent Clickjacking (Check 3 requirement)
    res.setHeader("X-Frame-Options", "DENY");
    // Control referrer info
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Enable browser XSS filtering
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Strict-Transport-Security (HSTS) in production
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    next();
  });

  // Helper function for XSS sanitization (removing HTML brackets to prevent tag injection)
  const sanitizeString = (str: string): string => {
    return str.replace(/[<>]/g, "");
  };

  // Server-side price calculation & verification helper (Check 4)
  const calculateTotalAmount = (items: any[], collectionType: string): number => {
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
    return itemsTotal + collectionCharge + surcharge;
  };

  // 2. Memory-Based API Rate Limiting Middleware
  const rateLimitWindowMs = 15 * 60 * 1000; // 15 mins window
  const rateLimitMaxRequests = 300; // max 300 requests per IP per window
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
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

  // Apply rate limiting specifically on API endpoints (excluding the health endpoint)
  app.use("/api/", (req, res, next) => {
    if (req.path === "/health") {
      return next();
    }
    rateLimiter(req, res, next);
  });

  // Stricter rate limiting for authentication routes (5 attempts per minute max - Check 3 & Check 5)
  const authRateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const authRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();
    let info = authRateLimitMap.get(ip);
    const windowMs = 60 * 1000; // 1 minute
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

  // --- API ROUTES ---

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mount Patient authentication and functional routers
  app.use("/api/auth", authRoutes);
  app.use("/auth", authRoutes);
  app.use("/api", patientRoutes);
  app.use("/", patientRoutes);

  // 1. Sync User / Get Surrogate DB ID
  app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "";
      if (!uid) {
        return res.status(400).json({ error: "Missing user UID" });
      }
      const user = await getOrCreateUser(uid, email);

      // Check if this user already has any bookings in the database
      const userBookings = await getUserBookings(uid);
      if (userBookings.length === 0) {
        const maskedEmail = email.replace(/(..)(.*)(@.*)/, "$1***$3");
        console.log(`Pre-seeding clinical records for newly synced user ID: ${user.id} (${maskedEmail})`);
        for (const seed of DEFAULT_ADMIN_BOOKINGS_SEED) {
          try {
            // Append user ID suffix to ensure uniqueness across different users in the database
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
              timestamp: seed.timestamp || new Date().toISOString()
            });
          } catch (seedErr) {
            console.log(`Swallowing unique-key/duplicate seed error for ${seed.bookingId}:`, seedErr);
          }
        }
      }

      res.json(user);
    } catch (error: any) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });

  // 2. Create Booking
  app.post("/api/bookings", async (req, res, next) => {
    // Check if authorized via Admin Key first!
    const adminKey = req.headers["x-admin-key"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split("Bearer ")[1] : null);

    if (isValidAdminKey(adminKey)) {
      // Authenticated as Admin! Assign a surrogate admin user context
      (req as any).user = {
        uid: "admin-walk-in",
        email: "admin@assurx.com"
      };
      return next();
    }
    // Reject guest bookings
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split("Bearer ")[1] === "undefined" || authHeader.split("Bearer ")[1] === "") {
      return res.status(401).json({ error: "Unauthorized: Patient login required to book." });
    }

    // Otherwise require normal auth
    return requireAuth(req as any, res, next);
  }, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "";
      if (!uid) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      // First sync and get surrogate user ID
      const user = await getOrCreateUser(uid, email);

      // --- SERVER-SIDE INPUT VALIDATION & SANITIZATION ---
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

      // Basic presence checks
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

      // Range validation
      if (patientAge < 0 || patientAge > 150) {
        return res.status(400).json({ error: "Validation failed: Invalid patient age." });
      }
      if (totalAmount < 0) {
        return res.status(400).json({ error: "Validation failed: Invalid total amount." });
      }

      // Server-side price calculation & validation (Check 4)
      try {
        const expectedTotal = calculateTotalAmount(items, collectionType);
        if (totalAmount !== expectedTotal) {
          return res.status(400).json({ error: `Validation failed: Price mismatch. Expected ₹${expectedTotal}, but received ₹${totalAmount}.` });
        }
      } catch (err: any) {
        return res.status(400).json({ error: `Validation failed: ${err.message}` });
      }

      const bookingData = {
        bookingId: sanitizeString(bookingId),
        userId: user.id,
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
      };

      const newB = await createBooking(bookingData);
      res.status(201).json(newB);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: error.message || "Failed to save booking" });
    }
  });

  // 3. Get User Bookings
  app.get("/api/bookings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(400).json({ error: "Unauthorized" });
      }
      const bookingsList = await getUserBookings(uid);

      // Parse items back and nest patient details to match Booking interface exactly
      const parsedBookings = bookingsList.map((b) => {
        let itemsObj = [];
        try {
          itemsObj = JSON.parse(b.items);
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
        };
      });

      res.json(parsedBookings);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve bookings" });
    }
  });

  // 3b. Securely track booking by Booking ID with owner-only access (or Admin bypass)
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

      // Check if it's an admin requesting (via header)
      const adminKey = req.headers["x-admin-key"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split("Bearer ")[1] : null);

      const isAdmin = isValidAdminKey(adminKey);

      if (!isAdmin) {
        // If not admin, check if this is a guest booking first
        const guestUser = await getOrCreateUser("guest-user", "guest@assurx.com");
        const isGuestBooking = b.userId === guestUser.id;

        if (!isGuestBooking) {
          // If not guest booking, standard users MUST be authenticated and must be the owner of the booking
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: Please sign in to track and view your booking." });
          }

          const token = authHeader.split("Bearer ")[1];
          let decodedUser: any = null;
          let isCustomJwt = false;
          let patientIdStr = "";
          let googleUidStr = "";
          let emailStr = "";

          // Try custom JWT verification first
          try {
            const { verifyToken } = await import("./src/utils/jwt.ts");
            const decoded = verifyToken(token);
            if (decoded && decoded.role === 'Patient') {
              isCustomJwt = true;
              patientIdStr = decoded.patientId;
              googleUidStr = decoded.googleUid;
              emailStr = decoded.email;
            }
          } catch (jwtErr) {
            // Fall back to Firebase verification
          }

          if (isCustomJwt) {
            if (b.patientId) {
              if (String(b.patientId) !== patientIdStr) {
                return res.status(403).json({ error: "Forbidden: You are not authorized to view this booking. Only the owner can view this." });
              }
            } else {
              // Legacy/seeded booking: verify the user's DB ID matches the booking's userId (Check 5 IDOR Fix)
              const dbUser = await getOrCreateUser(googleUidStr, emailStr);
              if (b.userId !== dbUser.id) {
                return res.status(403).json({ error: "Forbidden: You are not authorized to view this booking. Only the owner can view this." });
              }
            }
          } else {
            try {
              const { adminAuth } = await import("./src/lib/firebase-admin.ts");
              decodedUser = await adminAuth.verifyIdToken(token);
            } catch (jwtErr) {
              console.error("Firebase ID token verification failed in tracker:", jwtErr);
              return res.status(401).json({ error: "Unauthorized: Invalid or expired session token." });
            }

            if (!decodedUser || !decodedUser.uid) {
              return res.status(401).json({ error: "Unauthorized: User session invalid." });
            }

            // Get database user ID
            const dbUser = await getOrCreateUser(decodedUser.uid, decodedUser.email || "");
            if (b.userId !== dbUser.id) {
              return res.status(403).json({ error: "Forbidden: You are not authorized to view this booking. Only the booking person can view this order." });
            }
          }
        }
      }

      let itemsObj = [];
      try {
        itemsObj = JSON.parse(b.items);
      } catch {
        itemsObj = [];
      }

      res.json({
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
      });
    } catch (error: any) {
      console.error("Error tracking booking:", error);
      res.status(500).json({ error: error.message || "Failed to find booking" });
    }
  });

  // 4. Create Prescription Lead (Auth optional)
  app.post("/api/prescriptions", async (req, res) => {
    try {
      let dbUserId: number | undefined = undefined;

      // Check if auth token header exists
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        try {
          const { adminAuth } = await import("./src/lib/firebase-admin.ts");
          const decodedToken = await adminAuth.verifyIdToken(token);
          const email = decodedToken.email || "";
          const userObj = await getOrCreateUser(decodedToken.uid, email);
          dbUserId = userObj.id;
        } catch (err) {
          console.warn("Invalid auth token on prescription submit, proceeding as guest", err);
        }
      }

      // --- SERVER-SIDE INPUT VALIDATION & SANITIZATION ---
      const prescriptionId = String(req.body.prescriptionId || "").trim();
      const patientName = String(req.body.patientName || "").trim().substring(0, 100);
      const patientPhone = String(req.body.patientPhone || "").trim();
      const fileName = String(req.body.fileName || "").trim().substring(0, 200);

      if (!prescriptionId || !patientName || !patientPhone || !fileName) {
        return res.status(400).json({ error: "Validation failed: Missing required prescription parameters." });
      }

      // Validate phone number format (exactly 10 digits)
      if (!/^\d{10}$/.test(patientPhone)) {
        return res.status(400).json({ error: "Validation failed: Phone number must be exactly 10 digits." });
      }

      // Validate allowed simulated file extensions
      const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
      const ext = path.extname(fileName).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ error: "Validation failed: Unsupported file extension." });
      }

      const prescriptionData = {
        prescriptionId: sanitizeString(prescriptionId),
        userId: dbUserId || null,
        patientName: sanitizeString(patientName),
        patientPhone: sanitizeString(patientPhone),
        fileName: sanitizeString(fileName),
        doctorName: req.body.doctorName ? sanitizeString(String(req.body.doctorName).trim()).substring(0, 100) : null,
        dontKnowTests: !!req.body.dontKnowTests,
        extractedServiceIds: req.body.extractedServiceIds ? JSON.stringify(req.body.extractedServiceIds) : null,
        status: req.body.status ? sanitizeString(String(req.body.status).trim()).substring(0, 50) : "pending_call",
        timestamp: req.body.timestamp ? sanitizeString(String(req.body.timestamp).trim()) : new Date().toISOString(),
      };

      const newPrx = await createPrescription(prescriptionData);
      res.status(201).json(newPrx);
    } catch (error: any) {
      console.error("Error creating prescription:", error);
      res.status(500).json({ error: error.message || "Failed to save prescription lead" });
    }
  });


  // --- USER SESSION MANAGEMENT ---

  // Register / replace active user session (called immediately after login)
  app.post("/api/users/session", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(400).json({ error: "Missing user UID" });
      const { sessionId } = req.body;
      if (typeof sessionId !== "string") {
        return res.status(400).json({ error: "sessionId is required" });
      }
      await updateUserSession(uid, sessionId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating user session:", error);
      res.status(500).json({ error: error.message || "Failed to update session" });
    }
  });


  // --- ADMIN OPERATIONS ---

  // Admin Login — validates credentials server-side and issues a session ID.
  // This is the ONLY way to create a valid admin session.
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, key } = req.body;

      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof key !== "string"
      ) {
        return res.status(401).json({ error: "Invalid administrator credentials or security key." });
      }

      const matchedAdmin = adminList.find(
        (a) =>
          a.email === email.trim().toLowerCase() &&
          a.password === password.trim() &&
          a.key === key.trim()
      );

      if (!matchedAdmin) {
        return res.status(401).json({ error: "Invalid administrator credentials or security key." });
      }

      // Generate a new session ID, replacing any previous admin session
      const sessionId = crypto.randomUUID();
      await setAdminSession(sessionId);

      res.json({ success: true, sessionId });
    } catch (error: any) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: error.message || "Admin login failed" });
    }
  });

  // Admin Logout — invalidates the active session in the database.
  app.post("/api/admin/logout", async (req, res) => {
    try {
      const incomingSession = req.headers["x-admin-session"] as string | undefined;
      const storedSession = await getAdminSession();
      // Only clear if the requesting device owns the current session
      if (incomingSession && incomingSession === storedSession) {
        await clearAdminSession();
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error during admin logout:", error);
      res.status(500).json({ error: error.message || "Admin logout failed" });
    }
  });

  // Secure admin authorization middleware: validates both admin key AND active session
  const requireAdminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const adminKey = req.headers["x-admin-key"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split("Bearer ")[1] : null);

    if (!isValidAdminKey(adminKey)) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid admin key" });
    }

    // ── Single-session enforcement for admin ────────────────────────────────
    try {
      const incomingSession = req.headers["x-admin-session"] as string | undefined;
      const storedSession = await getAdminSession();

      // Only enforce if a session has been established (non-empty stored session)
      if (storedSession && incomingSession !== storedSession) {
        return res.status(401).json({
          error: "Your account has been logged in on another device. Please log in again."
        });
      }
    } catch (sessionErr) {
      // If DB is unavailable for session check, allow through (key still validated above)
      console.warn("Admin session check skipped due to DB error:", sessionErr);
    }

    return next();
  };

  // Secure Reset Database API
  app.post("/api/admin/reset", requireAdminAuth, async (req, res) => {
    try {
      await clearAllData();
      res.json({ success: true, message: "All admin bookings and prescriptions cleared from database." });
    } catch (error: any) {
      console.error("Error resetting database:", error);
      res.status(500).json({ error: error.message || "Failed to reset database" });
    }
  });

  // 1. Get all Bookings
  app.get("/api/admin/bookings", requireAdminAuth, async (req, res) => {
    try {
      const bookingsList = await getAllBookings();

      const parsedBookings = bookingsList.map((b) => {
        try {
          return {
            id: String(b.id), // Ensure string-compatible ID for UI React key
            bookingId: b.bookingId,
            patient: {
              name: b.patientName,
              age: b.patientAge,
              gender: b.patientGender,
              relationship: b.patientRelationship,
            },
            items: JSON.parse(b.items),
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
            timestamp: b.timestamp,
            simulatedReportUrl: b.simulatedReportUrl,
            userEmail: b.userEmail,
          };
        } catch {
          return {
            ...b,
            id: String(b.id),
            patient: { name: b.patientName, age: b.patientAge, gender: b.patientGender, relationship: b.patientRelationship },
            items: [],
            address: { street: b.street || "", city: b.city || "", pincode: b.pincode || "" },
          };
        }
      });
      res.json(parsedBookings);
    } catch (error: any) {
      console.error("Error admin fetching bookings:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve bookings" });
    }
  });

  // 2. Update Booking Status, findings or patient details
  app.patch("/api/admin/bookings/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }
      const updateData: any = {};

      if (req.body.bookingStatus !== undefined) updateData.bookingStatus = sanitizeString(String(req.body.bookingStatus).trim()).substring(0, 50);
      if (req.body.paymentStatus !== undefined) updateData.paymentStatus = sanitizeString(String(req.body.paymentStatus).trim()).substring(0, 50);
      if (req.body.simulatedReportUrl !== undefined) updateData.simulatedReportUrl = sanitizeString(String(req.body.simulatedReportUrl).trim()).substring(0, 500);

      // Patient and appointment details
      if (req.body.patientName !== undefined) updateData.patientName = sanitizeString(String(req.body.patientName).trim()).substring(0, 100);
      if (req.body.patientAge !== undefined) {
        const age = parseInt(req.body.patientAge, 10);
        if (isNaN(age) || age < 0 || age > 150) {
          return res.status(400).json({ error: "Invalid patient age value" });
        }
        updateData.patientAge = age;
      }
      if (req.body.patientGender !== undefined) updateData.patientGender = sanitizeString(String(req.body.patientGender).trim()).substring(0, 20);
      if (req.body.patientRelationship !== undefined) updateData.patientRelationship = sanitizeString(String(req.body.patientRelationship).trim()).substring(0, 50);
      if (req.body.appointmentDate !== undefined) updateData.appointmentDate = sanitizeString(String(req.body.appointmentDate).trim());
      if (req.body.appointmentTime !== undefined) updateData.appointmentTime = sanitizeString(String(req.body.appointmentTime).trim());
      if (req.body.collectionType !== undefined) updateData.collectionType = sanitizeString(String(req.body.collectionType).trim());
      if (req.body.street !== undefined) updateData.street = sanitizeString(String(req.body.street).trim()).substring(0, 200);
      if (req.body.city !== undefined) updateData.city = sanitizeString(String(req.body.city).trim()).substring(0, 100);
      if (req.body.pincode !== undefined) updateData.pincode = sanitizeString(String(req.body.pincode).trim()).substring(0, 10);

      const updated = await updateBooking(id, updateData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: error.message || "Failed to update booking" });
    }
  });

  // 3. Delete Booking
  app.delete("/api/admin/bookings/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }
      const deleted = await deleteBooking(id);
      res.json(deleted || { success: true });
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ error: error.message || "Failed to delete booking" });
    }
  });

  // 4. Get all Prescriptions
  app.get("/api/admin/prescriptions", requireAdminAuth, async (req, res) => {
    try {
      const prescriptionsList = await getAllPrescriptions();

      const parsed = prescriptionsList.map((p) => {
        let extIds: string[] = [];
        if (p.extractedServiceIds) {
          try {
            extIds = JSON.parse(p.extractedServiceIds);
          } catch {
            extIds = [];
          }
        }
        return {
          id: String(p.id), // String format for UI compatibility
          prescriptionId: p.prescriptionId,
          patientName: p.patientName,
          patientPhone: p.patientPhone,
          fileName: p.fileName,
          doctorName: p.doctorName,
          dontKnowTests: p.dontKnowTests,
          extractedServiceIds: extIds,
          status: p.status,
          timestamp: p.timestamp,
        };
      });
      res.json(parsed);
    } catch (error: any) {
      console.error("Error admin fetching prescriptions:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve prescriptions" });
    }
  });

  // 5. Update Prescription Status
  app.patch("/api/admin/prescriptions/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid prescription ID" });
      }
      const updateData: any = {};
      if (req.body.status !== undefined) {
        updateData.status = sanitizeString(String(req.body.status).trim()).substring(0, 50);
      }

      const updated = await updatePrescription(id, updateData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating prescription:", error);
      res.status(500).json({ error: error.message || "Failed to update prescription" });
    }
  });

  // 6. Delete Prescription
  app.delete("/api/admin/prescriptions/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid prescription ID" });
      }
      const deleted = await deletePrescription(id);
      res.json(deleted || { success: true });
    } catch (error: any) {
      console.error("Error deleting prescription:", error);
      res.status(500).json({ error: error.message || "Failed to delete prescription" });
    }
  });


  // --- CAREERS & JOB APPLICATIONS ENDPOINTS ---

  // Submit Job Application
  app.post("/api/careers/apply", async (req, res) => {
    try {
      const { fullName, email, phone, position, experience, resumeLink, notes } = req.body;

      if (!fullName || !email || !phone || !position || !experience) {
        return res.status(400).json({ error: "Missing required job application fields" });
      }

      // Generate random APP-XXXXXX ID
      const digits = Math.floor(100000 + Math.random() * 900000);
      const applicationId = `APP-${digits}`;

      const application = await createJobApplication({
        applicationId,
        fullName,
        email,
        phone,
        position,
        experience,
        resumeLink: resumeLink || "",
        notes: notes || "",
      });

      res.status(201).json({ success: true, application });
    } catch (error: any) {
      console.error("Error creating job application:", error);
      res.status(500).json({ error: error.message || "Failed to submit job application" });
    }
  });

  // Get All Applications (Admin Only)
  app.get("/api/admin/careers", requireAdminAuth, async (req, res) => {
    try {
      const list = await getAllJobApplications();
      res.json(list);
    } catch (error: any) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ error: error.message || "Failed to fetch job applications" });
    }
  });

  // Update Application Status (Admin Only)
  app.patch("/api/admin/careers/:id/status", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (isNaN(id) || !status) {
        return res.status(400).json({ error: "Invalid parameters" });
      }
      const updated = await updateJobApplicationStatus(id, status);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating application status:", error);
      res.status(500).json({ error: error.message || "Failed to update status" });
    }
  });

  // Delete Application (Admin Only)
  app.delete("/api/admin/careers/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }
      const deleted = await deleteJobApplication(id);
      res.json(deleted || { success: true });
    } catch (error: any) {
      console.error("Error deleting job application:", error);
      res.status(500).json({ error: error.message || "Failed to delete job application" });
    }
  });



  // --- VITE INTERFACES & STATIC FILES ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Self-pinging routine to keep the Render instance awake (only in production)
    const APP_URL = process.env.APP_URL || "https://assurx-hopital-g2wu.onrender.com/";
    if (process.env.NODE_ENV === "production" && APP_URL) {
      console.log(`Initializing self-ping to ${APP_URL} every 5 minutes`);
      // Ping once shortly after boot (10 seconds delay)
      setTimeout(() => {
        pingServer(APP_URL);
      }, 10000);

      // Ping every 5 minutes
      setInterval(() => {
        pingServer(APP_URL);
      }, 5 * 60 * 1000);
    }
  });
}

startServer();
