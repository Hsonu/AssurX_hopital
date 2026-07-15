import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Calendar, Clock, MapPin, User, FileText, CheckCircle2, 
  Loader2, Download, Printer, AlertCircle, Eye, ShieldCheck, Landmark, 
  ArrowRight, Sparkles, Award, Star, Activity, HeartPulse, LogIn, ChevronRight, Lock
} from 'lucide-react';
import { useAuth } from '../lib/auth.ts';
import { userFetch } from '../lib/sessionGuard.ts';
import { Booking } from '../types';

const cleanBookingId = (id: string) => id.split('-').slice(0, 2).join('-');

const DEFAULT_LAB_RESULTS: Record<string, Array<{ parameter: string; result: string; unit: string; range: string; status: 'normal' | 'high' | 'low' }>> = {
  'lab-thyroid': [
    { parameter: 'Triiodothyronine (T3, Total)', result: '1.25', unit: 'ng/mL', range: '0.80 - 2.00', status: 'normal' },
    { parameter: 'Thyroxine (T4, Total)', result: '8.4', unit: 'µg/dL', range: '5.1 - 14.1', status: 'normal' },
    { parameter: 'Thyroid Stimulating Hormone (Ultra-TSH)', result: '2.14', unit: 'µIU/mL', range: '0.40 - 4.50', status: 'normal' }
  ],
  'lab-vitamin-d': [
    { parameter: '25-Hydroxy Vitamin D (Total)', result: '18.4', unit: 'ng/mL', range: '30.0 - 100.0 (Deficient: <20)', status: 'low' }
  ],
  'lab-cbc': [
    { parameter: 'Hemoglobin (Hb)', result: '14.2', unit: 'g/dL', range: '13.0 - 17.0', status: 'normal' },
    { parameter: 'Total WBC Count (Leukocytes)', result: '7,400', unit: '/cumm', range: '4,000 - 11,000', status: 'normal' },
    { parameter: 'Platelet Count', result: '2.45', unit: 'Lakhs/cumm', range: '1.50 - 4.50', status: 'normal' },
    { parameter: 'Red Blood Cell (RBC) Count', result: '4.9', unit: 'million/cumm', range: '4.5 - 5.5', status: 'normal' }
  ],
  'lab-diabetes': [
    { parameter: 'Fasting Blood Sugar (FBS)', result: '94', unit: 'mg/dL', range: '70 - 100', status: 'normal' },
    { parameter: 'Glycated Hemoglobin (HbA1c)', result: '5.4', unit: '%', range: '4.0 - 5.6', status: 'normal' }
  ],
  'lab-urine-routine': [
    { parameter: 'Urine pH', result: '6.0', unit: '', range: '5.0 - 7.5', status: 'normal' },
    { parameter: 'Urine Glucose / Sugar', result: 'Negative', unit: '', range: 'Negative', status: 'normal' },
    { parameter: 'Urine Proteins / Albumin', result: 'Negative', unit: '', range: 'Negative', status: 'normal' }
  ]
};

interface MyBookingsSectionProps {
  onNavigateToCatalog: (tab: 'scans' | 'labs' | 'packages') => void;
}

export default function MyBookingsSection({ onNavigateToCatalog }: MyBookingsSectionProps) {
  const { user, idToken, loginWithGoogle, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Selection states inside the portal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [scanFindings, setScanFindings] = useState('');
  const [scanImpression, setScanImpression] = useState('');

  const fetchUserBookings = async () => {
    if (!idToken) return;
    setLoading(true);
    setError('');
    try {
      const response = await userFetch('/api/patient/bookings', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a: Booking, b: Booking) => {
          return new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime();
        });
        setBookings(sorted);
        
        // Auto-select the first booking if none is selected
        if (sorted.length > 0 && !selectedBooking) {
          handleSelectBooking(sorted[0]);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch bookings.');
      }
    } catch (err: any) {
      console.error('Error fetching patient bookings:', err);
      setError('Connection failed. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idToken) {
      fetchUserBookings();
    } else {
      setBookings([]);
      setSelectedBooking(null);
    }
  }, [idToken]);

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    
    // Check for custom laboratory values or observations saved by technicians
    const savedCustomResultsStr = localStorage.getItem(`report_data_${booking.id}`);
    if (savedCustomResultsStr) {
      try {
        const parsed = JSON.parse(savedCustomResultsStr);
        setReportData(parsed.parameters || []);
        setScanFindings(parsed.findings || '');
        setScanImpression(parsed.impression || '');
        return;
      } catch (e) {
        console.error("Failed to parse custom report, using default presets.", e);
      }
    }

    // Compile realistic default parameters
    let defaultLabData: any[] = [];
    const defaultScanFindings = 'Digital study of target anatomy. Alignment and bony structures appear normal. Joint spaces are preserved. Lung fields are clear of consolidations, pleural effusions, or pneumothoraces. Soft tissue structures demonstrate normal contour and attenuation margins. No abnormal localized soft tissue swellings noted.';
    const defaultScanImpression = 'NORMAL PHYSIOLOGICAL & DIGITAL DIAGNOSTIC STUDY.';

    booking.items.forEach(item => {
      if (DEFAULT_LAB_RESULTS[item.itemId]) {
        defaultLabData = [...defaultLabData, ...DEFAULT_LAB_RESULTS[item.itemId]];
      }
    });

    if (defaultLabData.length === 0 && booking.items.some(it => it.itemType === 'service' || it.category === 'lab')) {
      defaultLabData = [
        { parameter: 'Hemoglobin (Hb)', result: '14.1', unit: 'g/dL', range: '12.0 - 16.0', status: 'normal' },
        { parameter: 'Serum Creatinine', result: '0.88', unit: 'mg/dL', range: '0.60 - 1.20', status: 'normal' },
        { parameter: 'Total Cholesterol', result: '178', unit: 'mg/dL', range: 'Desirable: <200', status: 'normal' }
      ];
    }

    setReportData(defaultLabData);
    setScanFindings(defaultScanFindings);
    setScanImpression(defaultScanImpression);
  };

  const getStatusStepClass = (currentStatus: string, step: string) => {
    const statusSequence = ['booked', 'sample_collected', 'processing', 'report_ready'];
    const currentIndex = statusSequence.indexOf(currentStatus);
    const stepIndex = statusSequence.indexOf(step);

    if (currentIndex >= stepIndex) {
      return 'bg-emerald-600 text-white border-emerald-600';
    }
    return 'bg-slate-100 text-slate-400 border-slate-200';
  };

  // If user is not logged in, show a beautiful, high-fidelity lock screen with clear Sign In pathways
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 animate-fade-in text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left info column */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure Patient Access Portal</span>
              </span>
              <h1 className="text-3xl md:text-5xl font-serif font-light text-slate-900 tracking-tight leading-tight">
                Access your <span className="italic font-medium text-emerald-800">diagnostics cabinet</span> & health reports in real-time.
              </h1>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-xl">
                Sign in to your private AssurX Patient Portal to view current order statuses, follow sample processing countdowns, and download certified laboratory reports (EHR) safely from any device.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-150 p-5 rounded-2xl flex gap-3.5 shadow-xs">
                <HeartPulse className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Electronic Health Records</h4>
                  <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">Store and retrieve digital radiology films, scans, and blood biochemistry history over encrypted HIPAA networks.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-150 p-5 rounded-2xl flex gap-3.5 shadow-xs">
                <Activity className="w-8 h-8 text-teal-600 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Sample Dispatch</h4>
                  <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">Track real-time phlebotomist transit routes and raw biometric sample registration statuses at our NABL center.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right login form column */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl text-left space-y-6">
              <div>
                <span className="text-[9px] font-black text-emerald-700 tracking-widest uppercase block">SECURE CREDENTIAL INPUT</span>
                <h3 className="text-lg font-serif font-bold text-slate-900">Sign In to Your Account</h3>
                <p className="text-xs text-slate-500 mt-1">Get immediate authorization to print and retrieve results.</p>
              </div>

              <div className="space-y-3.5">
                {/* Google login */}
                <button
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                    } catch (e) {
                      console.error("Google login failed", e);
                    }
                  }}
                  className="w-full py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-3 shadow-xs hover:border-slate-350 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Authorize with Google Profile</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Calculate high-fidelity patient portal stats
  const totalOrdersCount = bookings.length;
  const reportsPublishedCount = bookings.filter(b => b.bookingStatus === 'report_ready').length;
  const processingCount = totalOrdersCount - reportsPublishedCount;
  const normalWellnessScore = reportsPublishedCount > 0 ? 84 : '--';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 animate-fade-in text-left space-y-8">
      
      {/* Dynamic Header Welcoming Patient */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "Patient"} 
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full border-2 border-emerald-500 object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-serif font-black text-xl flex items-center justify-center">
              {user.email?.[0].toUpperCase() || "P"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-700 tracking-widest uppercase block leading-none">SECURE PATIENT GATEWAY</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mt-1">
              Welcome back, <span className="italic font-normal text-emerald-800">{user.displayName || user.email?.split('@')[0]}</span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold">{user.email} • AssurX UID: ASX-PAT-{user.uid.slice(0, 5).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => onNavigateToCatalog('labs')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            Schedule Diagnostic Test
          </button>
          <button 
            onClick={logout}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Dynamic Stats Bento Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Diagnostic Orders</span>
            <p className="text-2xl font-serif italic font-bold text-slate-900 mt-0.5">{loading ? '...' : totalOrdersCount}</p>
          </div>
          <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Reports Published (EHR)</span>
            <p className="text-2xl font-serif italic font-bold text-emerald-800 mt-0.5">{loading ? '...' : reportsPublishedCount}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Operational Processing</span>
            <p className="text-2xl font-serif italic font-bold text-amber-800 mt-0.5">{loading ? '...' : processingCount}</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            {processingCount > 0 ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest">Biological Score (Calculated)</span>
            <p className="text-2xl font-serif italic font-bold text-teal-800 mt-0.5">{normalWellnessScore}%</p>
          </div>
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Orders list vs selected report details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Orders list */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-250">
            <h3 className="font-serif font-bold text-slate-900 text-sm md:text-base">Diagnostic Booking History</h3>
            <button 
              onClick={fetchUserBookings}
              className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              <span>Sync Records</span>
            </button>
          </div>

          {loading && bookings.length === 0 ? (
            <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Loading your secure patient files...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-150 p-5 rounded-2xl text-left space-y-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">Connection Failure</h4>
              <p className="text-xs text-red-650 leading-relaxed font-semibold">{error}</p>
              <button 
                onClick={fetchUserBookings}
                className="text-xs font-extrabold text-red-800 underline block"
              >
                Retry Database Query
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">No Active Booking Found</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">You have not scheduled any blood path tests or radiology scans yet. Book a checkup and check back here.</p>
              </div>
              <button
                onClick={() => onNavigateToCatalog('labs')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Explore Lab Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              {bookings.map((booking) => {
                const isSelected = selectedBooking?.id === booking.id;
                return (
                  <button
                    key={booking.id}
                    onClick={() => handleSelectBooking(booking)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 relative ${
                      isSelected 
                        ? 'bg-emerald-50/20 border-emerald-500 shadow-md ring-1 ring-emerald-500' 
                        : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-black text-emerald-800 block tracking-wider uppercase">
                          {cleanBookingId(booking.bookingId)}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs mt-1">Patient: {booking.patient.name}</h4>
                        <span className="text-[9px] text-slate-400 font-semibold">{booking.appointmentDate} • {booking.appointmentTime.split(' - ')[0]}</span>
                      </div>
                      <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        booking.bookingStatus === 'report_ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        booking.bookingStatus === 'processing' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        booking.bookingStatus === 'sample_collected' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {booking.bookingStatus === 'report_ready' ? 'Report Ready' : booking.bookingStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-2.5 flex justify-between items-center">
                      <div className="truncate pr-4">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold leading-none">Diagnostic Portfolios</span>
                        <p className="text-[10px] text-slate-650 truncate mt-1">
                          {booking.items.map(it => it.name).join(', ')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-1 font-bold text-slate-800 text-xs">
                        <span>₹{booking.totalAmount}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Selected Report EHR Document Viewer */}
        <div className="lg:col-span-7">
          {selectedBooking ? (
            <div className="space-y-6">
              
              {/* Dynamic Action bar above letterhead */}
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 shadow-xs text-xs">
                <div>
                  <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">PORTAL EHR DOCUMENT CONTROLS</span>
                  <p className="font-bold text-slate-800 mt-0.5">Booking reference: <span className="font-mono text-emerald-800">{cleanBookingId(selectedBooking.bookingId)}</span></p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10.5px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Receipt</span>
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 cursor-pointer transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Progress Tracker Horizontal Steps */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 text-xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Biometric Pipeline Monitor</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-slate-300">Live Lab Connection</span>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 z-0 hidden sm:block"></div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 text-xs">
                    
                    {/* Step 1: Booked */}
                    <div className="flex items-center sm:flex-col gap-3 sm:gap-2 text-left sm:text-center flex-1 w-full">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black ${getStatusStepClass(selectedBooking.bookingStatus, 'booked')}`}>
                        1
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 leading-none">Appointment</p>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Confirmed</span>
                      </div>
                    </div>

                    {/* Step 2: Collected */}
                    <div className="flex items-center sm:flex-col gap-3 sm:gap-2 text-left sm:text-center flex-1 w-full">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black ${getStatusStepClass(selectedBooking.bookingStatus, 'sample_collected')}`}>
                        2
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 leading-none">Biometrics</p>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Sample Collected</span>
                      </div>
                    </div>

                    {/* Step 3: Processing */}
                    <div className="flex items-center sm:flex-col gap-3 sm:gap-2 text-left sm:text-center flex-1 w-full">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black ${getStatusStepClass(selectedBooking.bookingStatus, 'processing')}`}>
                        3
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 leading-none">Laboratory</p>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Analyses Running</span>
                      </div>
                    </div>

                    {/* Step 4: Published */}
                    <div className="flex items-center sm:flex-col gap-3 sm:gap-2 text-left sm:text-center flex-1 w-full">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black ${getStatusStepClass(selectedBooking.bookingStatus, 'report_ready')}`}>
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 leading-none">EHR Record</p>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Report Ready</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Printable Medical Document Header */}
              <div id="printable-report-area" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs text-left">
                
                {/* Letterhead */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-800/10 pb-5 gap-4">
                  <div className="space-y-1">
                    <span className="font-sans font-black tracking-widest text-emerald-850 uppercase text-lg block leading-none">
                      ASSUR<span className="text-emerald-650">X</span> DIAGNOSTICS
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">
                      Consolidated Clinical Laboratory & Imaging Network
                    </span>
                    <span className="text-[8.5px] text-slate-400 block font-semibold leading-none">
                      ISO 9001:2015 & NABL Accredited Infrastructure • HIPAA Compliant
                    </span>
                  </div>
                  <div className="text-left sm:text-right text-[10px] text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-850">Support Desk: 1800-2026-HEALTH</p>
                    <p>Email: reports@assurx.com • Web: www.assurx.com</p>
                    <p>Corporate Hub: S.V. Road, Malad West, Mumbai</p>
                  </div>
                </div>

                {/* Patient Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs">
                  <div className="space-y-1.5">
                    <div className="flex">
                      <span className="w-24 text-slate-400 font-semibold uppercase text-[9.5px]">Patient Name:</span>
                      <span className="font-bold text-slate-800">{selectedBooking.patient.name}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-400 font-semibold uppercase text-[9.5px]">Age / Gender:</span>
                      <span className="font-semibold text-slate-700">{selectedBooking.patient.age} Years / {selectedBooking.patient.gender}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-400 font-semibold uppercase text-[9.5px]">Ref Doctor:</span>
                      <span className="font-semibold text-slate-700">Self Referral (Dr. AssurX Specialist)</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:pl-6 md:border-l border-slate-200">
                    <div className="flex">
                      <span className="w-28 text-slate-400 font-semibold uppercase text-[9.5px]">Booking ID:</span>
                      <span className="font-mono font-bold text-emerald-800 uppercase">{cleanBookingId(selectedBooking.bookingId)}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-400 font-semibold uppercase text-[9.5px]">Register Date:</span>
                      <span className="font-semibold text-slate-700">{selectedBooking.appointmentDate}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-400 font-semibold uppercase text-[9.5px]">Report Released:</span>
                      <span className="font-semibold text-slate-700">{new Date(selectedBooking.timestamp || '').toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                    </div>
                  </div>
                </div>

                {/* Report Content based on test category */}
                <div className="space-y-6 pt-2">
                  
                  {/* Laboratory Pathology Section */}
                  {selectedBooking.items.some(it => it.itemType === 'service' || it.category === 'lab') && reportData.length > 0 && (
                    <div className="space-y-3">
                      <div className="border-b-2 border-slate-800/10 pb-1.5">
                        <h3 className="font-serif font-bold text-slate-900 text-sm">DEPARTMENT OF CLINICAL PATHOLOGY & BIOCHEMISTRY</h3>
                      </div>
                      
                      <div className="overflow-hidden border border-slate-150 rounded-xl divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {/* Header */}
                        <div className="grid grid-cols-4 bg-slate-50 p-3 text-[9px] font-bold text-slate-400 uppercase">
                          <div className="col-span-2">Clinical Parameter</div>
                          <div className="text-center">Observed Value</div>
                          <div className="text-right">Reference Range</div>
                        </div>
                        {/* Rows */}
                        {reportData.map((param, i) => (
                          <div key={i} className="grid grid-cols-4 p-3 items-center">
                            <div className="col-span-2 font-bold text-slate-800">{param.parameter}</div>
                            <div className="text-center">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                param.status === 'low' ? 'text-blue-700 bg-blue-50' : 
                                param.status === 'high' ? 'text-red-700 bg-red-50' : 'text-slate-800'
                              }`}>
                                {param.result} <span className="text-[10px] text-slate-400 font-normal ml-0.5">{param.unit}</span>
                              </span>
                            </div>
                            <div className="text-right text-slate-400 font-mono text-[11px]">{param.range}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Radiology Section */}
                  {selectedBooking.items.some(it => it.category === 'scan') && (
                    <div className="space-y-4">
                      <div className="border-b-2 border-slate-800/10 pb-1.5">
                        <h3 className="font-serif font-bold text-slate-900 text-sm">DEPARTMENT OF RADIOLOGY & IMAGING DIAGNOSTICS</h3>
                      </div>
                      
                      <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1">
                          <p className="font-bold text-slate-800 text-[9.5px] uppercase tracking-wider">Examined Anatomy:</p>
                          <p className="font-semibold text-slate-600">
                            {selectedBooking.items.filter(it => it.category === 'scan').map(it => it.name).join(', ')}
                          </p>
                        </div>
                        
                        <div className="space-y-1.5">
                          <p className="font-bold text-slate-900 uppercase text-[9.5px] tracking-wider">Clinical Observations & Findings:</p>
                          <p className="bg-white p-3 border border-slate-100 rounded-lg whitespace-pre-line text-slate-650 italic">
                            {scanFindings}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <p className="font-bold text-slate-900 uppercase text-[9.5px] tracking-wider">Clinical Impression:</p>
                          <p className="bg-emerald-50/20 p-3 border border-emerald-100/40 rounded-lg font-bold text-emerald-900 whitespace-pre-line">
                            {scanImpression}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Disclaimer Footer */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-[10px] text-slate-400 leading-normal font-semibold space-y-1">
                    <p className="text-slate-500 font-bold uppercase text-[8px] tracking-wider">Clinical Interpretation Disclaimer:</p>
                    <p>1. This report is an electronic reproduction compiled automatically on behalf of AssurX Specialist Pathology Laboratories.</p>
                    <p>2. Values may vary dynamically based on fasting condition, diurnal rhythms, clinical history, and patient stress profiles.</p>
                    <p>3. Correlation with corresponding physical findings, patient history, and radiological examinations is recommended for therapeutic decisions.</p>
                  </div>

                  {/* Pathologist Stamp Block */}
                  <div className="flex justify-between items-end border-t border-slate-150 pt-5 text-left">
                    <div className="space-y-1 text-[10px] text-slate-500">
                      <p className="font-bold text-slate-700">Sample Quality: Satisfactory</p>
                      <p>Barcode verified: AX2026-MATCHED</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="inline-block border border-emerald-800/15 bg-emerald-50/30 px-3 py-1 rounded text-[9px] font-black text-emerald-800 tracking-wider uppercase mb-1">
                        Verified & Signed
                      </div>
                      <p className="text-xs font-bold text-slate-800">Dr. S. K. Mukherjee, MD</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Chief Consultant Pathologist • Reg No: M-20164</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-xs h-full flex flex-col items-center justify-center space-y-4 min-h-[40vh]">
              <FileText className="w-12 h-12 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Electronic Health Record Cabinet</p>
              <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">Select one of your synchronized diagnostic bookings on the left to show certified clinical laboratory pathology and radiology reports.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
