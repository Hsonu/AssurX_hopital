import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, QrCode, CreditCard, Laptop, Landmark, Clipboard, CheckCircle2, Loader2, ArrowRight, Printer, Calendar, Clock, MapPin, User, FileText, Download, AlertCircle } from 'lucide-react';
import { Patient, CartItem, Booking } from '../types';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../lib/auth.ts';
import { userFetch } from '../lib/sessionGuard.ts';


interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  bookingDetails: {
    patient: Patient;
    collectionType: 'home' | 'center';
    appointmentDate: string;
    appointmentTime: string;
    address?: { street: string; city: string; pincode: string };
  };
  grandTotal: number;
  onBookingSuccess: () => void; // Triggered to clear cart, refresh list, etc.
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  bookingDetails,
  grandTotal,
  onBookingSuccess,
}: CheckoutModalProps) {
  const { user, idToken } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cash_at_center'>('upi');
  const [isPaying, setIsPaying] = useState(false);
  const [payStep, setPayStep] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [validationError, setValidationError] = useState('');
  const [showSimulatedGateway, setShowSimulatedGateway] = useState(false);

  const isPopupLoggingIn = useRef(false);

  // Auto-submit effect if there's a pending checkout and the user is now logged in
  useEffect(() => {
    if (isOpen && user && !isPaying && !isSuccess && !isPopupLoggingIn.current) {
      const savedStr = localStorage.getItem('assurx_pending_checkout_booking');
      if (savedStr) {
        try {
          const saved = JSON.parse(savedStr);
          if (saved.bookingDetails?.patient?.name === bookingDetails.patient.name && saved.grandTotal === grandTotal) {
            // Found a matching pending checkout after login. Auto-submit it!
            localStorage.removeItem('assurx_pending_checkout_booking');
            handleSimulatePayment();
          }
        } catch (e) {
          console.error("Auto-submitting pending checkout failed:", e);
        }
      }
    }
  }, [isOpen, user, isPaying, isSuccess]);

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('SBI');

  // UPI Timer countdown
  const [countdown, setCountdown] = useState(180); // 3 minutes

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && paymentMethod === 'upi' && !isPaying && !isSuccess) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 180));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, paymentMethod, isPaying, isSuccess]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const executeDatabaseBooking = async (method: string, payStatus: string) => {
    setIsPaying(true);
    const steps = [
      'Contacting bank gateway securely (HIPAA & PCI-DSS encryption)...',
      'Verifying seat and phlebotomist slots...',
      'Authorizing payment transaction...',
      'Generating unique NABL booking ID and patient profile...',
      'Booking Confirmed! Compiling official receipt...'
    ];

    let currentStepIndex = 0;
    setPayStep(steps[currentStepIndex]);

    const interval = setInterval(async () => {
      currentStepIndex++;
      if (currentStepIndex < steps.length) {
        setPayStep(steps[currentStepIndex]);
      } else {
        clearInterval(interval);
        
        try {
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
              patientName: bookingDetails.patient.name,
              patientAge: bookingDetails.patient.age,
              patientGender: bookingDetails.patient.gender,
              patientRelationship: bookingDetails.patient.relationship || 'Self',
              appointmentDate: bookingDetails.appointmentDate,
              appointmentTime: bookingDetails.appointmentTime,
              collectionType: bookingDetails.collectionType,
              street: bookingDetails.address?.street || null,
              city: bookingDetails.address?.city || null,
              pincode: bookingDetails.address?.pincode || null,
              paymentMethod: method,
              paymentStatus: payStatus,
              bookingStatus: 'booked',
              totalAmount: grandTotal,
              items: cart,
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

          // Fallback storage sync
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

          const existingBookingsStr = localStorage.getItem('assurx_bookings');
          const existingBookings = existingBookingsStr ? JSON.parse(existingBookingsStr) : [];
          existingBookings.unshift(mappedBooking);
          localStorage.setItem('assurx_bookings', JSON.stringify(existingBookings));

          setCreatedBooking(mappedBooking);
          setIsPaying(false);
          setIsSuccess(true);
        } catch (error: any) {
          console.error("Failed to complete database booking:", error);
          alert(`Payment processed, but clinical database synchronization failed. Error: ${error.message}. Our support team will verify this manually.`);
          setIsPaying(false);
        }
      }
    }, 800);
  };
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSimulatePayment = async () => {
    setValidationError('');
    
    if (paymentMethod === 'cash_at_center') {
      executeDatabaseBooking('cash_at_center', 'pending');
      return;
    }

    setIsPaying(true);
    setPayStep("Initializing secure checkout gateway...");
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !(window as any).Razorpay) {
      setIsPaying(false);
      setShowSimulatedGateway(true);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_T009i1fdo0TocB",
      amount: grandTotal * 100, // in paise
      currency: "INR",
      name: "AssurX Scans & Labs",
      description: `Diagnostic Booking - ${bookingDetails.patient.name}`,
      image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=120&auto=format&fit=crop",
      handler: function (response: any) {
        executeDatabaseBooking(paymentMethod, 'paid');
      },
      prefill: {
        name: bookingDetails.patient.name,
        contact: "9876543210"
      },
      notes: {
        address: `${bookingDetails.address?.street || 'Center Visit'}, ${bookingDetails.address?.city || 'Malad'}`
      },
      theme: {
        color: "#059669"
      },
      modal: {
        ondismiss: function () {
          setIsPaying(false);
        }
      }
    };
    
    setPayStep("Opening Razorpay Secure Gateway...");
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handlePrint = () => {
    const element = document.getElementById('official-invoice-frame');
    if (element && (window as any).html2pdf) {
      const opt = {
        margin:       [0.4, 0.4, 0.4, 0.4],
        filename:     `AssurX-Invoice-${createdBooking?.bookingId || 'Token'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      (window as any).html2pdf().from(element).set(opt).save();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto" id="checkout-modal-root">
      {/* Backdrop */}
      <div 
        onClick={isSuccess ? undefined : onClose} // Lock backdrop click on success so they read the invoice or click done
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Main Dialog Box */}
      <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden z-10 border border-slate-100 max-h-[92vh] flex flex-col animate-scale-in">
        
        {/* Blue bar top */}
        <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-500"></div>

        {/* Modal Close - hidden on success */}
        {!isSuccess && !isPaying && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8">
          
          {/* STATE 1: PAYING LOADER */}
          {isPaying && (
            <div className="py-16 text-center space-y-5">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                <ShieldCheck className="absolute w-5 h-5 text-teal-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base">Processing Secure Payment</h4>
                <p className="text-xs text-slate-500 font-medium animate-pulse">{payStep}</p>
              </div>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                Please do not close this window, click back, or refresh the browser. Your transaction is guarded with end-to-end 256-bit SSL technology.
              </p>
            </div>
          )}

          {/* STATE 2: PAYMENT GATEWAY SELECTOR */}
          {!isPaying && !isSuccess && (
            <div className="space-y-6">
              {/* Checkout Title */}
              <div className="text-left">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Secure Checkouts</h3>
                <p className="text-xs text-slate-500 mt-1">Complete your reservation for AssurX scan/lab services.</p>
              </div>

              {/* Order total header summary */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center text-left">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Booking for: <span className="font-bold text-slate-800">{bookingDetails.patient.name}</span></div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{cart.length} test(s) • {bookingDetails.collectionType === 'home' ? 'Home collection' : 'Center visit'}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Grand Total</span>
                  <span className="text-xl font-black text-teal-700">₹{grandTotal}</span>
                </div>
              </div>

              {/* Layout grid for selector vs form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1 text-left">
                {/* Left: Payment Channels */}
                <div className="md:col-span-5 flex flex-row md:flex-col gap-2.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-slate-100 md:pr-4">
                  {/* UPI */}
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-shrink-0 md:w-full p-3 border rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'border-teal-600 bg-teal-50/20 text-teal-800'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-teal-600" />
                    <div>
                      <div className="text-xs font-bold leading-tight">UPI QR Code</div>
                      <span className="text-[9px] text-slate-400 hidden sm:inline">GPay, PhonePe, Paytm</span>
                    </div>
                  </button>

                  {/* CARD */}
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-shrink-0 md:w-full p-3 border rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-teal-600 bg-teal-50/20 text-teal-800'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-teal-600" />
                    <div>
                      <div className="text-xs font-bold leading-tight">Credit / Debit Card</div>
                      <span className="text-[9px] text-slate-400 hidden sm:inline">Visa, Mastercard, RuPay</span>
                    </div>
                  </button>

                  {/* NETBANKING */}
                  <button
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`flex-shrink-0 md:w-full p-3 border rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      paymentMethod === 'netbanking'
                        ? 'border-teal-600 bg-teal-50/20 text-teal-800'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Laptop className="w-5 h-5 text-teal-600" />
                    <div>
                      <div className="text-xs font-bold leading-tight">Net Banking</div>
                      <span className="text-[9px] text-slate-400 hidden sm:inline">SBI, HDFC, ICICI, etc.</span>
                    </div>
                  </button>

                  {/* CASH */}
                  <button
                    onClick={() => setPaymentMethod('cash_at_center')}
                    className={`flex-shrink-0 md:w-full p-3 border rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      paymentMethod === 'cash_at_center'
                        ? 'border-teal-600 bg-teal-50/20 text-teal-800'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Landmark className="w-5 h-5 text-teal-600" />
                    <div>
                      <div className="text-xs font-bold leading-tight">Pay at Center/Visit</div>
                      <span className="text-[9px] text-slate-400 hidden sm:inline">Pay cash/card at lab</span>
                    </div>
                  </button>
                </div>

                {/* Right: Payment Forms */}
                <div className="md:col-span-7 space-y-4">
                  {/* UPI PAYMENT CHANNEL FORM */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-4 animate-fade-in text-center">
                      <h4 className="font-bold text-xs text-slate-700 text-left">Scan UPI QR to Pay</h4>
                      <div className="p-4 bg-slate-55 border border-slate-100 rounded-2xl inline-block mx-auto relative">
                        {/* Dynamic Mock QR Code */}
                        <div className="w-36 h-36 border border-slate-200 bg-white rounded-xl flex flex-col items-center justify-center p-2 mx-auto relative">
                          {/* Simulated QR block layout */}
                          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center rounded p-1">
                            <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-white">
                              {Array.from({ length: 25 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`rounded-xs ${
                                    (i % 3 === 0 && i % 2 === 0) || i === 0 || i === 4 || i === 20 || i === 24 
                                      ? 'bg-slate-900' 
                                      : 'bg-white border border-slate-100'
                                  }`}
                                ></div>
                              ))}
                            </div>
                          </div>
                          {/* Tiny logo center of QR */}
                          <div className="absolute inset-0 m-auto w-8 h-8 rounded-lg bg-teal-600 border-2 border-white text-white font-black text-sm flex items-center justify-center">
                            X
                          </div>
                        </div>
                        
                        <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold text-[9px] uppercase tracking-wider mt-2">
                          UPI Merchant ID: ASSURX@AXIS
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-700">QR Code expires in <span className="text-red-500 font-extrabold">{formatTime(countdown)}</span></div>
                        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                          Open your GPay, PhonePe, Paytm, or any BHIM UPI app and scan the code above to securely authorize the healthcare transaction.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CREDIT/DEBIT CARD FORM */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-3.5 animate-fade-in">
                      <h4 className="font-bold text-xs text-slate-700">Card Payment Details</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Card Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => {
                                // format like 4111 2222 3333 4444
                                const raw = e.target.value.replace(/\D/g, '');
                                const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                                setCardNumber(formatted);
                              }}
                              placeholder="4111 1234 5678 9012"
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            <CreditCard className="absolute right-3 top-2 w-4 h-4 text-slate-400" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Expiry Date</label>
                            <input
                              type="text"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                if (raw.length >= 2) {
                                  setCardExpiry(`${raw.substring(0, 2)}/${raw.substring(2, 4)}`);
                                } else {
                                  setCardExpiry(raw);
                                }
                              }}
                              placeholder="MM/YY"
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">CVV / CVN</label>
                            <input
                              type="password"
                              maxLength={3}
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                              placeholder="***"
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Cardholder Name</label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Enter name exactly as on card"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NETBANKING FORM */}
                  {paymentMethod === 'netbanking' && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-bold text-xs text-slate-700">Select Bank Account</h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Yes Bank'].map((bank) => (
                          <button
                            key={bank}
                            onClick={() => setSelectedBank(bank)}
                            className={`p-2.5 border rounded-lg text-xs font-bold text-left flex items-center gap-2 transition-colors cursor-pointer ${
                              selectedBank === bank
                                ? 'border-teal-600 bg-teal-55/15 text-teal-850'
                                : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CASH AT CENTER FORM */}
                  {paymentMethod === 'cash_at_center' && (
                    <div className="space-y-4 bg-teal-50/20 border border-teal-100/30 p-4 rounded-xl text-left animate-fade-in">
                      {/* Section Image Banner */}
                      <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 border border-teal-100/20">
                        <img 
                          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop" 
                          alt="Professional medical sample collection at home" 
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-teal-800 flex items-center gap-1.5">
                          <Landmark className="w-4 h-4 text-teal-600" />
                          Pay on Sample Collection / Visit
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          No advance payment needed! Pay securely when you visit our scanning diagnostic center, or pay cash/UPI to our phlebotomist directly at your home during sample collection.
                        </p>
                      </div>
                      <ul className="text-[10px] text-slate-500 space-y-1 list-disc list-inside leading-normal">
                        <li>We accept cash, credit cards, or UPI scanning at all centers</li>
                        <li>Phlebotomists carry portable UPI code panels</li>
                        <li>An email & SMS booking confirmation link is generated instantly</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust disclaimer */}
              <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span>Protected by PCI-DSS Security Compliance & HIPAA health laws.</span>
              </div>

              {/* Validation/Auth error summary */}
              {validationError && (
                <div className="space-y-2 mt-4 text-left">
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{validationError}</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.98]"
                >
                  Change details
                </button>
                <button
                  onClick={handleSimulatePayment}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-600/15 hover:shadow-lg hover:from-teal-700 hover:to-cyan-700 transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <span>{paymentMethod === 'cash_at_center' ? 'Confirm Booking' : `Pay ₹${grandTotal} & Book`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: BOOKING INVOICE / RECEIPT SUCCESS PAGE */}
          {isSuccess && createdBooking && (
            <div className="space-y-6 text-left animate-fade-in" id="printable-receipt-panel">
              {/* Giant Confirmation header */}
              <div className="text-center space-y-2.5 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Booking Confirmed!</h3>
                  <p className="text-xs text-slate-500">Your reservation has been locked with ID <span className="font-extrabold text-teal-700">{createdBooking.bookingId}</span></p>
                </div>
                <div className="inline-block px-3 py-1 bg-teal-50 text-teal-800 text-[10px] font-bold rounded-full border border-teal-100">
                  SMS & WhatsApp Confirmation sent to Registered Mobile Number
                </div>
              </div>

              {/* Printable Invoice Block */}
              <div className="border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4 bg-slate-55/10 relative overflow-hidden" id="official-invoice-frame">
                {/* Simulated watermark background */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none flex items-center justify-center select-none font-black text-6xl text-slate-900 uppercase">
                  ASSURX LABS
                </div>

                <div className="relative z-10 space-y-4">
                  {/* Top Invoice Metadata */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-1 font-black text-base text-slate-900">
                        <span className="text-teal-600">ASSURX</span> SCANS & LABS
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">Egmore Central Hub, Chennai - 600008<br />NABL Registration: MC-2849</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold text-slate-700">Receipt No: #{createdBooking.bookingId}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date(createdBooking.timestamp).toLocaleDateString()}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold mt-1.5 ${
                        createdBooking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {createdBooking.paymentStatus === 'paid' ? 'PAID ONLINE' : 'PAY ON VISIT'}
                      </span>
                    </div>
                  </div>

                  {/* Patient & Slot Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
                    <div className="space-y-1.5 text-left">
                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Patient Demographics</div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        <span>{createdBooking.patient.name} ({createdBooking.patient.age} yrs • {createdBooking.patient.gender})</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Relationship: {createdBooking.patient.relationship}</p>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Appointment Details</div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{createdBooking.appointmentDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>{createdBooking.appointmentTime}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-tight">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>
                          {createdBooking.collectionType === 'home' && createdBooking.address 
                            ? `Home Collection: ${createdBooking.address.street}, ${createdBooking.address.city} - ${createdBooking.address.pincode}`
                            : 'Center Visit: Main Diagnostic Center (Egmore Hub)'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booked tests summary list table */}
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Booked Tests & Fees</div>
                    <div className="space-y-1.5 text-xs">
                      {createdBooking.items.map((item) => (
                        <div key={item.itemId} className="flex justify-between items-center text-slate-700">
                          <span>{item.name}</span>
                          <span className="font-bold">₹{item.discountPrice || item.price}</span>
                        </div>
                      ))}
                      
                      {createdBooking.collectionType === 'home' && (
                        <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1">
                          <span>Phlebotomist Home Collection Fee</span>
                          <span>₹150</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-500 text-[11px]">
                        <span>Healthcare Cess & GST (5%)</span>
                        <span>₹{Math.round(createdBooking.totalAmount * 0.05)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-dashed border-slate-200 pt-2">
                        <span>Grand Total Paid</span>
                        <span className="text-teal-700">₹{createdBooking.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Preparations note */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] text-slate-500 space-y-1.5">
                    <div className="font-bold text-slate-700 uppercase tracking-wide text-[9px] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      Patient Instructions For Appointment Day
                    </div>
                    <ul className="list-disc list-inside leading-normal space-y-0.5">
                      {cart.some(item => /sugar|fasting|lipid|pkg-assurx/i.test(item.name)) && (
                        <li><span className="font-bold text-slate-700">Fasting Mandatory:</span> 10-12 hours strict fasting is required before the appointment. Do not consume tea, coffee, or milk. Water is permitted.</li>
                      )}
                      {cart.some(item => /mri/i.test(item.name)) && (
                        <li><span className="font-bold text-slate-700">No Metal:</span> MRI scans require removal of all metallic jewelry, watches, keys, or cards. Standard cotton hospital gowns are provided.</li>
                      )}
                      {cart.some(item => /ultrasound|usg/i.test(item.name)) && (
                        <li><span className="font-bold text-slate-700">Full Bladder:</span> For ultrasound abdomen, drink 4-5 glasses of water 1 hour prior to your slot and hold urine.</li>
                      )}
                      <li>Please keep your doctor’s physical prescription note handy if uploaded.</li>
                    </ul>
                  </div>

                  {/* Barcode representation using custom styled lines */}
                  <div className="flex flex-col items-center justify-center pt-2.5 border-t border-slate-100 gap-1 select-none">
                    <div className="flex gap-[1px] h-8 items-center bg-white p-1 rounded">
                      {[1,3,1,2,4,1,3,2,1,2,3,1,4,1,2,3,1,1,2,4,1,3,1,2,4,1,1,3,2,1,4,1,1].map((w, idx) => (
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

              {/* Success navigation CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end items-center border-t border-slate-100 pt-5">
                <button
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={onBookingSuccess} // Closes modal, clears cart, redirects to admin
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-600/15 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <span>Track Status on Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Razorpay Sandbox Overlay */}
      {showSimulatedGateway && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-left animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 animate-scale-in animate-fade-in">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                RP
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight text-white">Razorpay Secure Sandbox</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mock Integration Sandbox Mode</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Payment for</span>
                <span className="text-xs font-bold text-slate-800">AssurX Clinical Diagnostics</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Amount to Pay</span>
                <span className="text-lg font-black text-emerald-700 font-mono">₹{grandTotal}</span>
              </div>
              
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-[10.5px] text-amber-850 font-medium leading-relaxed text-left">
                ℹ️ The live Razorpay SDK was blocked by an AdBlocker or local firewall. We have automatically launched the secure sandbox simulation so you can continue testing.
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setShowSimulatedGateway(false);
                    executeDatabaseBooking(paymentMethod, 'paid');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center cursor-pointer"
                >
                  Simulate Successful Payment
                </button>
                <button
                  onClick={() => {
                    setShowSimulatedGateway(false);
                    setIsPaying(false);
                  }}
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
                >
                  Cancel Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
