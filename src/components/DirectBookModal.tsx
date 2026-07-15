import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, MapPin, User, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Printer, AlertCircle } from 'lucide-react';
import { Patient, CartItem, Booking } from '../types';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../lib/auth.ts';
import { userFetch } from '../lib/sessionGuard.ts';


interface DirectBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: any; // DiagnosticService or HealthPackage
  selectedBranch: string;
  onBookingSuccess: () => void;
}

export default function DirectBookModal({
  isOpen,
  onClose,
  selectedItem,
  selectedBranch,
  onBookingSuccess,
}: DirectBookModalProps) {
  const { user, idToken } = useAuth();

  // Helper to safely get pending booking details from localStorage
  const getPendingBooking = () => {
    try {
      const saved = localStorage.getItem('assurx_pending_direct_booking');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading pending direct booking", e);
    }
    return null;
  };

  const pending = getPendingBooking();

  // Patient details state initialized from pending state if present
  const [patientName, setPatientName] = useState(pending?.patientName || '');
  const [patientAge, setPatientAge] = useState(pending?.patientAge || '');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>(pending?.patientGender || 'Male');
  const [phoneNumber, setPhoneNumber] = useState(pending?.phoneNumber || '');
  const [collectionType, setCollectionType] = useState<'home' | 'center'>(pending?.collectionType || 'center');
  
  // Date and Time slot
  const tomorrowStr = new Date();
  tomorrowStr.setDate(tomorrowStr.getDate() + 1);
  const formattedTomorrow = tomorrowStr.toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState(pending?.appointmentDate || formattedTomorrow);
  const [appointmentTime, setAppointmentTime] = useState(pending?.appointmentTime || '08:00 AM - 09:00 AM');

  // Home collection address (if 'home' is selected)
  const [streetAddress, setStreetAddress] = useState(pending?.streetAddress || '');
  const [pincode, setPincode] = useState(pending?.pincode || '');
  const [city, setCity] = useState(pending?.city || selectedBranch);

  // Flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const isPopupLoggingIn = useRef(false);

  // Auto-submit effect if there's a pending booking and the user is now logged in
  useEffect(() => {
    if (isOpen && selectedItem && user && !isSubmitting && !isSuccess && !isPopupLoggingIn.current) {
      const savedStr = localStorage.getItem('assurx_pending_direct_booking');
      if (savedStr) {
        try {
          const saved = JSON.parse(savedStr);
          if (saved.item && saved.item.id === selectedItem.id) {
            // Found a matching pending booking for this item after login. Auto-submit it!
            localStorage.removeItem('assurx_pending_direct_booking');
            handleBookAndPayAtLab();
          }
        } catch (e) {
          console.error("Auto-submitting pending booking failed:", e);
        }
      }
    }
  }, [isOpen, selectedItem, user, isSubmitting, isSuccess]);

  if (!isOpen || !selectedItem) return null;

  const isPackage = 'testsCount' in selectedItem;
  const isScanItem = !isPackage && (
    selectedItem.category === 'scan' || 
    /mri|ct|ultrasound|usg|x-ray|mammogram|echo|dexa/i.test(selectedItem.name)
  );

  const activeCollectionType = isScanItem ? 'center' : collectionType;

  // Pricing math
  const basePrice = selectedItem.discountPrice || selectedItem.price;
  const homeCollectionFee = activeCollectionType === 'home' ? 150 : 0;
  const gstAmount = Math.round(basePrice * 0.05);
  const grandTotal = basePrice + homeCollectionFee + gstAmount;

  const handleBookAndPayAtLab = async (e?: React.FormEvent, bypassedUser?: any) => {
    if (e) e.preventDefault();
    setValidationError('');

    // Form Validations
    if (!patientName.trim()) {
      setValidationError('Please enter patient\'s full name.');
      return;
    }
    if (!patientAge || isNaN(Number(patientAge)) || Number(patientAge) <= 0) {
      setValidationError('Please enter a valid age.');
      return;
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!appointmentDate) {
      setValidationError('Please select an appointment date.');
      return;
    }
    if (activeCollectionType === 'home') {
      if (!streetAddress.trim()) {
        setValidationError('Please enter your home address for sample collection.');
        return;
      }
      if (!pincode.trim() || pincode.trim().length < 6) {
        setValidationError('Please enter a valid 6-digit PIN code.');
        return;
      }
    }

    setIsSubmitting(true);
    const steps = [
      'Validating pathology slots with central lab...',
      'Assigning medical representative...',
      'Securing appointment on server...',
      'Finalizing Pay-at-Lab diagnostic token...'
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
          // Map selectedItem to CartItem interface
          const isPackage = 'testsCount' in selectedItem;
          const cartItem: CartItem = {
            itemId: selectedItem.id,
            itemType: isPackage ? 'package' : 'service',
            name: selectedItem.name,
            price: selectedItem.price,
            discountPrice: selectedItem.discountPrice,
            category: isPackage ? undefined : selectedItem.category,
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
              bookingId: `ASX-${bookingIdNum}`,
              patientName: patientName,
              patientAge: parseInt(patientAge, 10),
              patientGender: patientGender,
              patientRelationship: 'Self',
              appointmentDate,
              appointmentTime,
              collectionType: activeCollectionType,
              street: activeCollectionType === 'home' ? streetAddress : null,
              city: activeCollectionType === 'home' ? city : null,
              pincode: activeCollectionType === 'home' ? pincode : null,
              paymentMethod: 'cash_at_center',
              paymentStatus: 'pending',
              bookingStatus: 'booked',
              totalAmount: grandTotal,
              items: [cartItem],
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
              name: savedB.patientName || (savedB.patient && savedB.patient.name) || '',
              age: savedB.patientAge !== undefined ? savedB.patientAge : (savedB.patient && savedB.patient.age) || 0,
              gender: (savedB.patientGender || (savedB.patient && savedB.patient.gender) || 'Male') as any,
              relationship: (savedB.patientRelationship || (savedB.patient && savedB.patient.relationship) || 'Self') as any
            },
            items: parsedItems,
            appointmentDate: savedB.appointmentDate,
            appointmentTime: savedB.appointmentTime,
            collectionType: savedB.collectionType as any,
            address: {
              street: savedB.street || (savedB.address && savedB.address.street) || '',
              city: savedB.city || (savedB.address && savedB.address.city) || '',
              pincode: savedB.pincode || (savedB.address && savedB.address.pincode) || ''
            },
            paymentMethod: savedB.paymentMethod as any,
            paymentStatus: savedB.paymentStatus as any,
            bookingStatus: savedB.bookingStatus as any,
            totalAmount: savedB.totalAmount,
            timestamp: savedB.timestamp,
            simulatedReportUrl: savedB.simulatedReportUrl || `/reports/ASX-${bookingIdNum}.pdf`
          };

          // Save to LocalStorage fallback
          const existingBookingsStr = localStorage.getItem('assurx_bookings');
          const existingBookings = existingBookingsStr ? JSON.parse(existingBookingsStr) : [];
          existingBookings.unshift(mappedBooking);
          localStorage.setItem('assurx_bookings', JSON.stringify(existingBookings));

          setCreatedBooking(mappedBooking);
          setIsSubmitting(false);
          setIsSuccess(true);
          // Do NOT call onBookingSuccess() here immediately! Let the user read the receipt first,
          // then when they click "Go to Dispatch Terminal", we can trigger the cleanup and tab switch.
        } catch (error: any) {
          console.error("Direct book failed:", error);
          setValidationError(`Database booking synchronization failed. Error: ${error.message}. Please try again.`);
          setIsSubmitting(false);
        }
      }
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto" id="direct-booking-overlay">
      {/* Backdrop */}
      <div 
        onClick={isSuccess || isSubmitting ? undefined : onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Main Dialog Box */}
      <div className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden z-10 border border-slate-100 max-h-[92vh] flex flex-col animate-scale-in">
        
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

        {/* Close Button */}
        {!isSuccess && !isSubmitting && (
          <button 
            onClick={onClose}
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
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <ShieldCheck className="absolute w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base">Booking Appointment</h4>
                <p className="text-xs text-slate-500 font-medium">{submitStep}</p>
              </div>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                Connecting with live phlebotomist slots. No card details or pre-payments required. Your slots are protected.
              </p>
            </div>
          )}

          {/* STEP 2: BOOKING ENTRY FORM */}
          {!isSubmitting && !isSuccess && (
            <form onSubmit={handleBookAndPayAtLab} className="space-y-6 text-left">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                  Direct Booking (Pay at Lab)
                </span>
                <h3 className="text-xl font-serif font-semibold text-slate-900 mt-2">
                  Confirm Your Appointment
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Complete this form to schedule your medical visit. pay cash or UPI at the lab during sample collection.
                </p>
              </div>

              {/* Selected test brief card */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Selected Diagnostics</span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">{selectedItem.name}</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-1">
                    {'testsCount' in selectedItem ? `${selectedItem.testsCount} tests included` : selectedItem.preparation}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Price</span>
                  <span className="text-lg font-black text-emerald-700">₹{basePrice}</span>
                </div>
              </div>

              {/* Validation error summary */}
              {validationError && (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100 text-left">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{validationError}</span>
                  </p>
                </div>
              )}

              {/* Form Input Fields */}
              <div className="space-y-4">
                {/* Section header: Patient Information */}
                <div className="border-b border-slate-100 pb-1 flex items-center gap-1 text-slate-400">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Patient Demographics</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Patient Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 bg-slate-50/30 transition-all text-slate-850"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Age (Years) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 45"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 bg-slate-50/30 text-slate-850"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Gender *</label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value as any)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 bg-white text-slate-850 cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Mobile Phone Number *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400 select-none pointer-events-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 bg-slate-50/30 text-slate-850"
                      />
                    </div>
                  </div>
                </div>

                {/* Section header: Appointment Booking */}
                <div className="border-b border-slate-100 pb-1 flex items-center gap-1 text-slate-400 pt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Appointment Logistics</span>
                </div>

                <div className="space-y-3.5">
                  {/* Collection type switcher */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Sample Collection Method</label>
                    {isScanItem ? (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-left">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 leading-relaxed">
                          <span className="font-extrabold">Center Appointment Required:</span> Your selected scan ({selectedItem.name}) must be conducted on-site at our diagnostic imaging center. Home sample collection is not available for imaging scans.
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setCollectionType('center')}
                          className={`py-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeCollectionType === 'center'
                              ? 'border-emerald-600 bg-emerald-50/20 text-emerald-800'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                          }`}
                        >
                          Visit Diagnostic Center
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollectionType('home')}
                          className={`py-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeCollectionType === 'home'
                              ? 'border-emerald-600 bg-emerald-50/20 text-emerald-800'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                          }`}
                        >
                          Home Blood Collection (+₹150)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Home collection address parameters */}
                  {activeCollectionType === 'home' && (
                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-3 animate-fade-in">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Street Address / House No. / Landmark *</label>
                        <input
                          type="text"
                          placeholder="e.g. 104, Blue Ocean Residency, Malad West"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white text-slate-850"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">PIN Code (6 Digits) *</label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="e.g. 400064"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white text-slate-850"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">City</label>
                          <input
                            type="text"
                            value={city}
                            disabled
                            className="w-full px-3 py-2 border border-slate-150 rounded-lg text-xs font-bold bg-slate-100 text-slate-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date and Time selectors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Preferred Date *</label>
                      <input
                        type="date"
                        min={formattedTomorrow}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 bg-white text-slate-850 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Preferred Slot *</label>
                      <select
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 bg-white text-slate-850 cursor-pointer"
                      >
                        <option value="06:00 AM - 07:00 AM">06:00 AM - 07:00 AM</option>
                        <option value="07:00 AM - 08:00 AM">07:00 AM - 08:00 AM</option>
                        <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM (Recommended)</option>
                        <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                        <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                        <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                        <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                        <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                        <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home collection info banner */}
              {collectionType === 'home' && (
                <div className="relative h-24 w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center p-3 gap-3 animate-fade-in">
                  <img 
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop" 
                    alt="Safe Home Sample Collection" 
                    className="w-20 h-16 object-cover rounded-xl flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-850">Free Home Visit Booking</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">Certified phlebotomist will arrive with sterile collection kits. Pay securely on-site after collection is completed.</p>
                  </div>
                </div>
              )}

              {/* Price Breakdown display list */}
              <div className="bg-emerald-50/15 border border-emerald-100/40 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Diagnostics Rate ({selectedItem.name})</span>
                  <span className="font-semibold text-slate-800">₹{basePrice}</span>
                </div>
                {collectionType === 'home' && (
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Phlebotomist Home Visit Charge</span>
                    <span className="font-semibold text-slate-800">₹150</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Healthcare cess & GST (5%)</span>
                  <span className="font-semibold text-slate-800">₹{gstAmount}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-sm text-slate-900 border-t border-dashed border-slate-200 pt-2">
                  <span className="text-slate-850">Total Payable at Collection</span>
                  <span className="text-emerald-700 font-extrabold text-base">₹{grandTotal}</span>
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed pt-1.5 flex items-start gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>No prepayment is requested. You will only pay once sample collection begins, using Cash, Card, or mobile UPI scanning.</span>
                </p>
              </div>

              {/* Submit triggers */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
                >
                  <span>Confirm Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: BOOKING INVOICE / SUCCESS PAGE */}
          {isSuccess && createdBooking && (
            <div className="space-y-6 text-left animate-fade-in" id="printable-receipt-panel-direct">
              {/* Header confirmation */}
              <div className="text-center space-y-2 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Booking Secured!</h3>
                  <p className="text-xs text-slate-500">Your appointment is scheduled. Token ID: <span className="font-extrabold text-emerald-700">{createdBooking.bookingId}</span></p>
                </div>
                <div className="inline-block px-3 py-1 bg-teal-50 text-teal-800 text-[10px] font-bold rounded-full border border-teal-100">
                  SMS & WhatsApp Confirmation sent with details
                </div>
              </div>

              {/* Printable receipt card */}
              <div className="border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4 bg-slate-55/10 relative overflow-hidden" id="official-receipt-frame">
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none flex items-center justify-center select-none font-black text-5xl text-slate-900 uppercase">
                  ASSURX SECURE
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <div className="font-black text-sm text-slate-900 flex items-center gap-1">
                        <span className="text-emerald-600">ASSURX</span> SCANS & LABS
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">
                        India's Safest Diagnostics Network<br />
                        NABL ISO 15189 Certified Labs
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">Token ID: #{createdBooking.bookingId}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date(createdBooking.timestamp).toLocaleDateString()}</p>
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-black uppercase mt-1">
                        PAY ON VISIT (AT LAB)
                      </span>
                    </div>
                  </div>

                  {/* Demographics details */}
                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
                    <div className="space-y-1 text-left">
                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Patient Profile</div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{createdBooking.patient.name} ({createdBooking.patient.age} yrs • {createdBooking.patient.gender})</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Mobile: +91 {phoneNumber.replace(/.(?=.{4})/g, '*')}</p>
                    </div>

                    <div className="space-y-1 text-left">
                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Appointment Logistics</div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{createdBooking.appointmentDate}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">Slot: {createdBooking.appointmentTime}</p>
                      <div className="text-[9px] text-slate-400 flex items-start gap-1 leading-normal mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>
                          {createdBooking.collectionType === 'home' && createdBooking.address
                            ? `Home Address: ${createdBooking.address.street}, ${createdBooking.address.pincode}`
                            : `Diagnostic Center Visit: ${selectedBranch} Hub`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing math */}
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Test & Service Breakdown</div>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span>{selectedItem.name}</span>
                        <span className="font-bold">₹{basePrice}</span>
                      </div>
                      {createdBooking.collectionType === 'home' && (
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Phlebotomist home collection fee</span>
                          <span>₹150</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Healthcare Cess & GST (5%)</span>
                        <span>₹{gstAmount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-dashed border-slate-200 pt-2 mt-1">
                        <span>Total Due at Visit</span>
                        <span className="text-emerald-700 font-black text-base">₹{createdBooking.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Instructions Note */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] text-slate-500 space-y-1">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Preparations Required:</div>
                    <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
                      {selectedItem.preparation && (
                        <li><span className="font-bold text-slate-700">Pre-test Instruction:</span> {selectedItem.preparation}</li>
                      )}
                      <li>Keep a light liquid diet or fast if mandatory.</li>
                      <li>Bring your doctor's recommendation physical prescription sheet if available.</li>
                    </ul>
                  </div>

                  {/* Barcode */}
                  <div className="flex flex-col items-center justify-center pt-2 border-t border-slate-100 gap-1 select-none">
                    <div className="flex gap-[1px] h-8 items-center bg-white p-1 rounded">
                      {[1,4,1,2,3,1,2,1,4,3,1,1,2,2,3,1,4,1,2,1,1,3,2,1,4,2,1,1].map((w, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-900 h-full" 
                          style={{ width: `${w}px` }}
                        ></div>
                      ))}
                    </div>
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">*{createdBooking.bookingId}*</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end items-center border-t border-slate-100 pt-5">
                <button
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print Appointment Token</span>
                </button>
                <button
                  onClick={onBookingSuccess}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <span>Go to Dispatch Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
