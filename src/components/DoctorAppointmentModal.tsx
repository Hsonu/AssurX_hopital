import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, ShieldCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Doctor, CartItem, Booking } from '../types';
import { useAuth } from '../lib/auth.ts';
import { userFetch } from '../lib/sessionGuard.ts';

interface DoctorAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  onBookingSuccess: () => void;
}

export default function DoctorAppointmentModal({
  isOpen,
  onClose,
  doctors,
  selectedDoctor,
  onBookingSuccess,
}: DoctorAppointmentModalProps) {
  const { user, idToken, loginWithGoogle } = useAuth();

  // Selected Doctor state
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(selectedDoctor);
  const [selectedBranch, setSelectedBranch] = useState<'All' | 'Malad' | 'Goregaon'>('All');

  // Sync selected doctor prop if it changes
  useEffect(() => {
    if (selectedDoctor) {
      setActiveDoctor(selectedDoctor);
      setSelectedBranch(selectedDoctor.branch as any);
    } else {
      setActiveDoctor(null);
      setSelectedBranch('All');
    }
  }, [selectedDoctor, isOpen]);

  // Form states
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Date and Time slots
  const tomorrowStr = new Date();
  tomorrowStr.setDate(tomorrowStr.getDate() + 1);
  const formattedTomorrow = tomorrowStr.toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState(formattedTomorrow);
  const [appointmentTime, setAppointmentTime] = useState('09:00 AM - 10:00 AM');

  // Flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Sync user info when logged in
  useEffect(() => {
    if (user) {
      if (user.displayName && !patientName) {
        setPatientName(user.displayName);
      }
      if (user.phoneNumber && !phoneNumber) {
        // Strip country code if +91 format
        const clean = user.phoneNumber.replace('+91', '').trim();
        setPhoneNumber(clean);
      }
    }
  }, [user]);

  if (!isOpen) return null;

  // Filter doctors based on selected branch
  const filteredDoctors = doctors.filter(doc => {
    return selectedBranch === 'All' || doc.branch === selectedBranch;
  });

  const handleGoogleLogin = async () => {
    setValidationError('');
    setIsSubmitting(true);
    setSubmitStep("Authenticating with Google...");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setValidationError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!activeDoctor) {
      setValidationError('Please select a doctor for consultation.');
      return;
    }
    if (!patientName.trim()) {
      setValidationError("Please enter patient's full name.");
      return;
    }
    if (!patientAge || isNaN(Number(patientAge)) || Number(patientAge) <= 0) {
      setValidationError('Please enter a valid age.');
      return;
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!appointmentDate) {
      setValidationError('Please select an appointment date.');
      return;
    }

    setIsSubmitting(true);
    const steps = [
      'Checking doctor timing schedule...',
      'Allocating clinic room slot...',
      'Registering appointment with server...',
      'Finalizing offline verification token...'
    ];

    let stepIdx = 0;
    setSubmitStep(steps[stepIdx]);

    const timer = setInterval(async () => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setSubmitStep(steps[stepIdx]);
      } else {
        clearInterval(timer);

        try {
          const cartItem: CartItem = {
            itemId: 'doctor-consultation',
            itemType: 'service',
            name: `Specialist Consultation: ${activeDoctor.name} (${activeDoctor.specialization})`,
            price: 0,
            discountPrice: 0,
            category: 'doctor'
          };

          const bookingIdNum = Math.floor(100000 + Math.random() * 900000);
          const token = idToken || '';

          const response = await userFetch('/api/booking', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
              bookingId: `ASX-DOC-${bookingIdNum}`,
              patientName: patientName,
              patientAge: parseInt(patientAge, 10),
              patientGender: patientGender,
              patientRelationship: 'Self',
              appointmentDate,
              appointmentTime,
              collectionType: 'center',
              street: null,
              city: activeDoctor.branch,
              pincode: null,
              paymentMethod: 'cash_at_center',
              paymentStatus: 'pending',
              bookingStatus: 'booked',
              totalAmount: 0,
              items: [cartItem],
              doctor: activeDoctor.name,
              department: activeDoctor.specialization,
              timestamp: new Date().toISOString()
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errText || response.statusText}`);
          }

          const savedB = await response.json();
          const parsedItems = typeof savedB.items === 'string'
            ? JSON.parse(savedB.items)
            : (Array.isArray(savedB.items) ? savedB.items : []);

          const mappedBooking: Booking = {
            id: String(savedB.id),
            bookingId: savedB.bookingId,
            patient: {
              name: savedB.patientName || '',
              age: savedB.patientAge !== undefined ? savedB.patientAge : 0,
              gender: (savedB.patientGender || 'Male') as any,
              relationship: 'Self'
            },
            items: parsedItems,
            appointmentDate: savedB.appointmentDate,
            appointmentTime: savedB.appointmentTime,
            collectionType: 'center',
            paymentMethod: 'cash_at_center',
            paymentStatus: 'pending',
            bookingStatus: 'booked',
            totalAmount: 0,
            timestamp: savedB.timestamp
          };

          setCreatedBooking(mappedBooking);
          setIsSuccess(true);
        } catch (error: any) {
          console.error("Error creating doctor booking:", error);
          setValidationError(error.message || "Failed to confirm doctor appointment.");
        } finally {
          setIsSubmitting(false);
          setSubmitStep("");
        }
      }
    }, 600);
  };

  const handleModalClose = () => {
    if (isSuccess) {
      onBookingSuccess();
    }
    // Reset state
    setValidationError('');
    setCreatedBooking(null);
    setIsSuccess(false);
    setIsSubmitting(false);
    setSubmitStep('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto" id="doctor-booking-overlay">
      {/* Backdrop */}
      <div
        onClick={isSuccess || isSubmitting ? undefined : handleModalClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Main Dialog Box */}
      <div className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden z-10 border border-slate-100 max-h-[92vh] flex flex-col animate-scale-in">
        
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-red-500 to-[#2D006B]"></div>

        {/* Close Button */}
        {!isSuccess && !isSubmitting && (
          <button
            onClick={handleModalClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content Container */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8">
          
          {/* STEP 1: LOADING STATE */}
          {isSubmitting && (
            <div className="py-16 text-center space-y-5 animate-pulse">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#2D006B] animate-spin" />
                <ShieldCheck className="absolute w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base">Booking Doctor Appointment</h4>
                <p className="text-xs text-slate-500 font-medium">{submitStep}</p>
              </div>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                Connecting with doctor schedules. Consultation fee is payable directly at the laboratory center.
              </p>
            </div>
          )}

          {/* STEP 2: NOT LOGGED IN USER */}
          {!user && !isSubmitting && !isSuccess && (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-[#E54848]">
                <User className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-semibold text-slate-900">
                  Verification Required
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  To book an appointment with our specialist doctors and get instant server confirmation, please verify your account.
                </p>
              </div>

              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 py-3 px-5 bg-white border border-gray-300 hover:border-gray-400 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.76 14.94 1 12 1 7.35 1 3.39 3.65 1.48 7.5l3.77 2.92c.9-2.7 3.42-4.38 6.75-4.38z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.84c2.15-1.98 3.38-4.89 3.38-8.52z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.25 10.42c-.23-.69-.36-1.42-.36-2.17s.13-1.48.36-2.17L1.48 3.16C.53 5.07 0 7.21 0 9.5s.53 4.43 1.48 6.34l3.77-2.92z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 18.96c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.02.68-2.33 1.09-3.99 1.09-3.33 0-5.85-1.68-6.75-4.38l-3.77 2.92c1.91 3.85 5.87 6.12 10.52 6.12z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold transition-colors"
                >
                  Cancel & Go Back
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BOOKING FORM */}
          {user && !isSubmitting && !isSuccess && (
            <form onSubmit={handleBookAppointment} className="space-y-5 text-left">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-50 px-2 py-0.5 rounded-md inline-block">
                  Specialist Consultation
                </span>
                <h3 className="text-xl font-serif font-semibold text-slate-900 mt-2">
                  Book Doctor Consultation
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Secure your slot offline. Fee is payable at the clinic center.
                </p>
              </div>

              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Doctor Details Pre-view */}
              {activeDoctor ? (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4">
                  <img
                    src={activeDoctor.avatar || 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=150&auto=format&fit=crop'}
                    alt={activeDoctor.name}
                    className="w-14 h-14 object-cover rounded-xl border-2 border-[#2D006B] flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug truncate">
                        {activeDoctor.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveDoctor(null)}
                        className="text-[10px] text-red-650 hover:text-red-700 font-bold uppercase tracking-wider underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider mt-0.5">
                      {activeDoctor.specialization} ({activeDoctor.qualification})
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#2D006B]" />
                        {activeDoctor.timing}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-650">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {activeDoctor.branch}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        1. Select Branch
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => {
                          setSelectedBranch(e.target.value as any);
                          setActiveDoctor(null);
                        }}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white text-slate-800 font-semibold"
                      >
                        <option value="All">All Branches</option>
                        <option value="Malad">Malad west</option>
                        <option value="Goregaon">Goregaon east</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        2. Select Specialist
                      </label>
                      <select
                        value={activeDoctor?.id || ''}
                        onChange={(e) => {
                          const doc = doctors.find(d => d.id === e.target.value);
                          if (doc) {
                            setActiveDoctor(doc);
                            setSelectedBranch(doc.branch as any);
                          }
                        }}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white text-slate-800 font-semibold"
                      >
                        <option value="" disabled>-- Select Doctor --</option>
                        {filteredDoctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} ({doc.specialization})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Details */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 -mb-1">
                  Patient Information
                </label>
                
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Patient's Full Name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-gray-300 rounded-xl text-slate-800 font-semibold placeholder-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Age (Years)"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-gray-300 rounded-xl text-slate-800 font-semibold placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value as any)}
                      className="w-full px-4 py-2.5 text-xs border border-gray-300 rounded-xl bg-white text-slate-800 font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    placeholder="10-Digit Mobile Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-gray-300 rounded-xl text-slate-800 font-semibold placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Slot Details */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    required
                    min={formattedTomorrow}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Preferred Time Slot
                  </label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white text-slate-800 font-semibold"
                  >
                    <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                    <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                    <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                    <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                    <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                className="w-full py-3 bg-[#2D006B] hover:bg-[#220052] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer mt-4"
              >
                Confirm Consultation
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {isSuccess && createdBooking && (
            <div className="py-8 text-center space-y-6 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-650 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-serif font-extrabold text-[#2D006B]">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-teal-650 font-extrabold tracking-wider uppercase">
                  Reference: {createdBooking.bookingId}
                </p>
              </div>

              {/* Consultation Details Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left text-xs text-slate-700 font-semibold space-y-2.5 max-w-sm mx-auto shadow-inner">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-slate-400">Specialist:</span>
                  <span className="text-slate-800 font-black">{createdBooking.doctor || activeDoctor?.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-slate-400">Patient Name:</span>
                  <span className="text-slate-800">{createdBooking.patient.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-slate-400">Branch Location:</span>
                  <span className="text-slate-800 font-bold">{activeDoctor?.branch} Branch</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-slate-400">Date & Slot:</span>
                  <span className="text-slate-800">{createdBooking.appointmentDate} ({createdBooking.appointmentTime})</span>
                </div>
                <div className="flex justify-between pt-1 text-[11px] text-teal-700 font-black">
                  <span>Consultation Fee:</span>
                  <span>₹0 (Payable at Center)</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100 max-w-sm mx-auto">
                <p className="text-[10px] text-slate-400 leading-normal font-medium">
                  We have registered your consultation on our central database. Please visit the laboratory counter at {activeDoctor?.branch} branch 10 minutes prior to your timing slot.
                </p>
                <button
                  onClick={handleModalClose}
                  className="w-full py-3 bg-[#E54848] hover:bg-[#d43f3f] text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-xs"
                >
                  Close & Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
