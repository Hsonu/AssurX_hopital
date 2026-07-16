import { Router } from 'express';
import { requirePatientAuth } from '../middleware/jwtAuth.ts';
import { getProfile, updateProfile, getBookings, createBooking, getBookingById, cancelBooking } from '../controllers/patientController.ts';

const router = Router();

router.get('/patient/profile', requirePatientAuth, getProfile);
router.put('/patient/profile', requirePatientAuth, updateProfile);
router.get('/patient/bookings', requirePatientAuth, getBookings);
router.post('/booking', requirePatientAuth, createBooking);
router.get('/booking/:id', requirePatientAuth, getBookingById);
router.post('/booking/:id/cancel', requirePatientAuth, cancelBooking);

export default router;
