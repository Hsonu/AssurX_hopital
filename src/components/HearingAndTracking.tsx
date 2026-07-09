import React, { useState, useEffect } from 'react';
import { 
  Ear, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  Printer, 
  ArrowRight, 
  AlertCircle, 
  Volume2, 
  Baby, 
  FileCheck, 
  ClipboardList, 
  Search,
  ShieldCheck,
  FileText,
  Briefcase,
  GraduationCap,
  Building,
  Send
} from 'lucide-react';
import { auth } from '../lib/firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';

// Defined list of hearing care diagnostic services
export interface HearingService {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  preparation: string;
  category: 'hearing';
  icon: any;
}

export const HEARING_SERVICES: HearingService[] = [
  {
    id: 'hear-pta',
    name: 'Pure Tone Audiometry (PTA)',
    price: 1200,
    duration: '30 Mins',
    description: 'Gold-standard behavior test to determine hearing thresholds across speech frequencies in a soundproof booth.',
    preparation: 'No ear-wax blockages. Bring previous audiograms if any.',
    category: 'hearing',
    icon: Ear
  },
  {
    id: 'hear-tymp',
    name: 'Tympanometry & Impedance Audiometry',
    price: 800,
    duration: '15 Mins',
    description: 'Evaluates middle ear health, eardrum mobility, and acoustic reflexes. Crucial for detecting fluid behind the eardrum.',
    preparation: 'No active ear infections or running ears.',
    category: 'hearing',
    icon: Volume2
  },
  {
    id: 'hear-oae',
    name: 'Otoacoustic Emissions (OAE) Newborn Screening',
    price: 1000,
    duration: '20 Mins',
    description: 'Measures inner ear (cochlea) outer hair cell response. Highly recommended for infants to screen congenital hearing loss early.',
    preparation: 'Baby should ideally be asleep or calm during testing.',
    category: 'hearing',
    icon: Baby
  },
  {
    id: 'hear-trial',
    name: 'Premium Digital Hearing Aid Fitting & Trial',
    price: 1500,
    duration: '60 Mins',
    description: 'Includes multi-brand digital programming, real-ear custom trials, and clinical recommendations for invisible / receiver-in-canal aids.',
    preparation: 'Requires a fresh PTA report (less than 3 months old).',
    category: 'hearing',
    icon: FileCheck
  },
  {
    id: 'hear-speech',
    name: 'Speech & Language Diagnostic Consultation',
    price: 2000,
    duration: '45 Mins',
    description: 'Clinical evaluation of speech clarity, voice health, stuttering, or developmental speech delays in adults and children.',
    preparation: 'Patient must be alert and interactive.',
    category: 'hearing',
    icon: User
  }
];

// --- 1. TRACK ORDER & APPOINTMENTS SECTION ---
interface TrackOrderProps {
  onGoToBooking: () => void;
  selectedBranch: string;
}

export function TrackOrderSection({ onGoToBooking, selectedBranch }: TrackOrderProps) {
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedBooking, setTrackedBooking] = useState<any | null>(null);
  const [activeUserBookings, setActiveUserBookings] = useState<any[]>([]);
  const [loadingUserBookings, setLoadingUserBookings] = useState(false);

  // Load bookings for current user on mount / auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserBookings();
      } else {
        setActiveUserBookings([]);
        setTrackedBooking(null);
        setBookingIdInput('');
        setError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserBookings = async () => {
    const user = auth.currentUser;
    if (!user) {
      setActiveUserBookings([]);
      return;
    }
    try {
      setLoadingUserBookings(true);
      const token = await user.getIdToken();
      const res = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveUserBookings(data);
      }
    } catch (err) {
      console.error("Failed to load user bookings in tracker:", err);
    } finally {
      setLoadingUserBookings(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = bookingIdInput.trim().toUpperCase();
    if (!cleanId) {
      setError("Please enter a valid Booking Reference ID.");
      return;
    }
    setError(null);
    setIsSearching(true);
    setTrackedBooking(null);

    try {
      const headers: any = {};
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/bookings/track/${cleanId}`, {
        headers
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Booking not found or access denied. Please verify your reference ID or sign in.");
      }
      const data = await res.json();
      setTrackedBooking(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusStepClass = (currentStatus: string, step: string) => {
    const statusSequence = ['booked', 'sample_collected', 'processing', 'report_ready'];
    const currentIndex = statusSequence.indexOf(currentStatus);
    const stepIndex = statusSequence.indexOf(step);

    if (currentIndex >= stepIndex) {
      return 'bg-emerald-600 text-white font-extrabold border-emerald-600';
    }
    return 'bg-slate-100 text-slate-400 border-slate-200';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked': return 'Appointment Booked';
      case 'sample_collected': return 'Sample/Details Collected';
      case 'processing': return 'Lab Processing';
      case 'report_ready': return 'Simulated Report Published';
      default: return 'Pending';
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-4" id="order-tracking-center">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-800 flex flex-col gap-8">
        
        {/* Title Block */}
        <div className="text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/15">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Digital Appointment Tracker</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-light tracking-tight">
            Track Patient Bookings & <span className="italic font-medium text-emerald-400">Reports</span>
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl">
            Check live collection updates, operational dispatch statuses, and download simulated clinical report PDFs in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Search & Status Display */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Lookup Form */}
            <div className="bg-slate-900/60 p-5 md:p-6 rounded-2xl border border-slate-800">
              <form onSubmit={handleTrackSubmit} className="space-y-4">
                <label className="block text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Enter Your 10-Digit Booking ID (e.g., ASX-112233)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="ASX-XXXXXXXX" 
                      value={bookingIdInput}
                      onChange={(e) => setBookingIdInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-semibold text-white placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Locate</span>
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/40 rounded-xl text-[11px] text-red-300 text-left">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Live Track Result Panel */}
            {trackedBooking ? (
              <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-950/50 shadow-inner text-left space-y-6 animate-fade-in">
                
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-4 gap-3">
                  <div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase tracking-widest">
                      {trackedBooking.collectionType === 'home' ? 'Home Collection' : 'Walk-In Visit'}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1.5 flex items-center gap-2">
                      <span>Booking:</span>
                      <span className="font-mono text-emerald-400 font-extrabold tracking-wider">{trackedBooking.bookingId}</span>
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block">Total Amount:</span>
                    <span className="text-base font-black text-white">₹{trackedBooking.totalAmount}</span>
                  </div>
                </div>

                {/* Patient Summary Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-900/40 rounded-xl border border-slate-900 text-xs">
                  <div>
                    <span className="text-slate-500 block">Patient Name:</span>
                    <span className="font-bold text-slate-200">{trackedBooking.patient?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Age / Gender:</span>
                    <span className="font-bold text-slate-200">{trackedBooking.patient?.age} Yrs / {trackedBooking.patient?.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date Scheduled:</span>
                    <span className="font-bold text-slate-200">{trackedBooking.appointmentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Time Slot:</span>
                    <span className="font-bold text-slate-200 truncate block">{trackedBooking.appointmentTime}</span>
                  </div>
                </div>

                {/* Booking Items List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Selected Diagnostic Tests:</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {trackedBooking.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/25 p-2.5 rounded-lg border border-slate-900/60 text-xs">
                        <span className="font-semibold text-slate-300">{item.name}</span>
                        <span className="font-mono text-emerald-400 font-bold">₹{item.discountPrice || item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking Progress Serpentine/Horizontal Steps */}
                <div className="space-y-4 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Live Dispatch / Lab Status:</span>
                  
                  <div className="relative pt-1">
                    {/* Visual bar line */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 z-0 hidden sm:block"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                      
                      {/* Step 1: Booked */}
                      <div className="flex items-center sm:flex-col gap-3 sm:gap-2 text-left sm:text-center flex-1 w-full">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${getStatusStepClass(trackedBooking.bookingStatus, 'booked')}`}>
                          1
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-200">Booked</p>
                          <span className="text-[9px] text-slate-500 block">Confirmed</span>
                        </div>
                      </div>

                      {/* Step 2: Collected */}
                      <div className="flex items-center sm:flex-col gap-3 sm:gap-2 text-left sm:text-center flex-1 w-full">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${getStatusStepClass(trackedBooking.bookingStatus, 'sample_collected')}`}>
                          2
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-200">Collected</p>
                          <span className="text-[9px] text-slate-500 block">Sample Taken</span>
                        </div>
                      </div>

                      {/* Step 3: Processing */}
                      <div className="flex items-center sm:flex-col gap-3 sm:gap-2 text-left sm:text-center flex-1 w-full">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${getStatusStepClass(trackedBooking.bookingStatus, 'processing')}`}>
                          3
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-200">In Progress</p>
                          <span className="text-[9px] text-slate-500 block">Lab Testing</span>
                        </div>
                      </div>

                      {/* Step 4: Report Ready */}
                      <div className="flex items-center sm:flex-col gap-3 sm:gap-2 text-left sm:text-center flex-1 w-full">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${getStatusStepClass(trackedBooking.bookingStatus, 'report_ready')}`}>
                          ✓
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-200">Published</p>
                          <span className="text-[9px] text-slate-500 block">Download Ready</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Print/Download and Report Action */}
                <div className="border-t border-slate-900 pt-5 flex flex-col sm:flex-row gap-3 justify-end">
                  <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Receipt</span>
                  </button>

                  {trackedBooking.bookingStatus === 'report_ready' ? (
                    <div className="px-4 py-2 bg-emerald-950/20 text-emerald-400 text-[10.5px] rounded-xl font-bold flex items-center justify-center gap-1.5 border border-emerald-900/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450" />
                      <span>Clinical report compiled & archived securely</span>
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-slate-900 text-slate-500 text-[10.5px] rounded-xl font-bold flex items-center justify-center gap-1.5 border border-slate-850">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Report publishing scheduled shortly</span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-850 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500">
                <Search className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Awaiting Booking Reference Input</p>
                <p className="text-[10.5px] max-w-sm text-slate-500">Enter your Booking ID above to search and live-track diagnostic collection timelines and retrieve medical documents.</p>
              </div>
            )}

          </div>

          {/* Right Column: User Logged-in Sync & Direct Action Card */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Quick-list for Active User Account */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-300 border-b border-slate-850 pb-2">
                Your Authenticated Orders
              </h3>

              {auth.currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                    {auth.currentUser.photoURL ? (
                      <img 
                        src={auth.currentUser.photoURL} 
                        alt="User profile" 
                        className="w-6 h-6 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px]">
                        {auth.currentUser.email?.[0].toUpperCase()}
                      </div>
                    )}
                    <div className="truncate flex-1">
                      <p className="text-[10px] font-black text-slate-300 leading-none">{auth.currentUser.displayName || auth.currentUser.email?.split('@')[0]}</p>
                      <span className="text-[8px] text-slate-500">{auth.currentUser.email}</span>
                    </div>
                    <span className="text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15">Active Sync</span>
                  </div>

                  {loadingUserBookings ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    </div>
                  ) : activeUserBookings.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {activeUserBookings.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setBookingIdInput(b.bookingId);
                            setTrackedBooking(b);
                            setError(null);
                          }}
                          className="w-full text-left bg-slate-950/40 hover:bg-slate-950 hover:border-slate-700 transition-all border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="truncate">
                            <span className="text-[9px] font-mono font-black text-emerald-400 block tracking-wider uppercase">{b.bookingId}</span>
                            <p className="text-[10.5px] font-bold text-slate-300 truncate mt-0.5">{b.patient?.name}</p>
                            <span className="text-[9px] text-slate-500">{b.appointmentDate} • {b.appointmentTime.split(' - ')[0]}</span>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              b.bookingStatus === 'report_ready' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                              b.bookingStatus === 'processing' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/15' :
                              b.bookingStatus === 'sample_collected' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' :
                              'bg-slate-500/10 text-slate-400 border border-slate-800'
                            }`}>
                              {b.bookingStatus === 'report_ready' ? 'Report Published' : b.bookingStatus.replace('_', ' ')}
                            </span>
                            <span className="text-[8px] text-slate-400 font-extrabold group-hover:text-emerald-400 transition-colors flex items-center gap-0.5">
                              <span>Track</span>
                              <ArrowRight className="w-2 h-2" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-600 text-[11px] border border-dashed border-slate-850 rounded-xl">
                      No matching patient bookings found for this email.
                    </div>
                  )}

                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Sign in with Google to dynamically link and track all historical laboratory and imaging orders in one place.
                  </p>
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center gap-2 text-[10.5px] text-slate-500 text-left">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Real-time notifications will automatically update upon sample dispatches.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Info / Book Helper Card */}
            <div className="bg-emerald-950/20 border border-emerald-800/20 rounded-2xl p-5 md:p-6 space-y-3">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Appointment Dispatch Rules</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Home collection dispatch schedules are active from <span className="font-bold text-slate-200">06:30 AM to 08:30 PM</span> daily. 
                Our phlebotomists are dispatched 30 minutes prior to your selected slot. Once samples are registered at our central lab, diagnostics take 4–6 hours depending on specific scan requirements.
              </p>
              <button 
                onClick={onGoToBooking}
                className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>Book Diagnostic Test Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}


// --- 2. CAREERS, JOBS & HIRING SECTION ---
export interface JobRole {
  id: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  type: string;
  experience: string;
  description: string;
  requirements: string[];
}

export const OPEN_JOBS: JobRole[] = [
  {
    id: 'job-phleb',
    title: 'Home Collection Phlebotomist',
    department: 'Diagnostics & Operations',
    location: 'Malad / Goregaon Center',
    salary: '₹18,000 - ₹25,000 / month',
    type: 'Full-Time',
    experience: '1-3 Years',
    description: 'Responsible for visiting patients at home to perform professional, sterile blood and sample draws, ensuring maximum patient comfort and absolute sample integrity.',
    requirements: [
      'DMLT (Diploma in Medical Laboratory Technology) or BSc MLT required',
      'Valid driving license and personal two-wheeler for efficient home collection routing',
      'Excellent communication and patient-handling skills',
      'Sound knowledge of vacutainer color codes, sterile sample handling, and storage standards'
    ]
  },
  {
    id: 'job-labtech',
    title: 'Senior Laboratory Technologist',
    department: 'Pathology & Biochemistry Lab',
    location: 'Malad Central Lab',
    salary: '₹22,000 - ₹32,000 / month',
    type: 'Full-Time',
    experience: '2-5 Years',
    description: 'Executes advanced chemical assays, hematology screening, and biochemistry examinations on state-of-the-art fully automated analyzers. Calibrates equipment and signs off quality control.',
    requirements: [
      'BSc or MSc in Medical Laboratory Technology (MLT) with state registration',
      'Hands-on experience with fully automated biochemistry and hematology platforms (Roche, Abbott, etc.)',
      'Rigorous commitment to NABL accreditation standards and quality control protocols',
      'Ability to process critical and urgent samples with speed and accuracy'
    ]
  },
  {
    id: 'job-radiotech',
    title: 'Radio-imaging Technician (MRI/CT)',
    department: 'Radiology',
    location: 'Goregaon Diagnostics Center',
    salary: '₹35,000 - ₹50,000 / month',
    type: 'Full-Time',
    experience: '3+ Years',
    description: 'Operates high-Tesla MRI systems and advanced multi-slice CT scanners to capture high-definition diagnostic imaging. Ensures complete radiation protection and patient safety protocols.',
    requirements: [
      'Diploma or Bachelor degree in Medical Imaging Technology / Radiology (BRIT/DRIT)',
      'Proven expertise in positioning patients and adjusting console parameters for MRI, CT, and digital X-Rays',
      'Strict adherence to AERB safety guidelines and radiation protection procedures',
      'Strong patient care skills to alleviate anxiety during imaging procedures'
    ]
  },
  {
    id: 'job-frontdesk',
    title: 'Front Office Executive & Patient Coordinator',
    department: 'Customer Relations',
    location: 'Malad / Goregaon',
    salary: '₹15,000 - ₹20,000 / month',
    type: 'Full-Time',
    experience: '0-2 Years (Freshers Welcome)',
    description: 'Greets visiting patients, manages the desk reception, registers bookings in the HIS system, receives cash/digital payments, and resolves client queries politely and efficiently.',
    requirements: [
      'Bachelor’s degree in any discipline with pleasant communication and front-office etiquettes',
      'Fluency in English, Hindi, and Marathi',
      'Basic computer literacy, typing speed, and familiarity with diagnostic billing software or spreadsheets',
      'Customer-centric approach with a warm, welcoming presence'
    ]
  }
];

interface HiringCareersSectionProps {
  selectedBranch: string;
}

export function HiringCareersSection({ selectedBranch }: HiringCareersSectionProps) {
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState(OPEN_JOBS[0].title);
  const [experience, setExperience] = useState('Freshers');
  const [resumeLink, setResumeLink] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successApplication, setSuccessApplication] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessApplication(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone.trim().length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          position,
          experience,
          resumeLink,
          notes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Application submission failed.");
      }

      const data = await res.json();
      setSuccessApplication(data.application);
      
      // Clear Form on Success
      setFullName('');
      setEmail('');
      setPhone('');
      setResumeLink('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || "Failed to submit job application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerPrintReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-left space-y-12">
      
      {/* Hero Banner Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-4 max-w-xl relative z-10">
          <div className="inline-block px-2.5 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-md">
            Careers & Hiring Portal
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-light tracking-tight leading-tight">
            Build Your Career in <span className="italic font-medium text-amber-300">Modern Diagnostics</span>
          </h2>
          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
            Join the fastest-growing laboratory and radio-imaging ecosystem at AssurX. We are currently hiring for critical clinical, diagnostic, and operations roles in <span className="font-extrabold text-amber-200">{selectedBranch}</span> and surrounding areas. Grow your skills on state-of-the-art medical systems.
          </p>
        </div>
        
        {/* Unsplash Image */}
        <div className="w-full md:w-80 h-44 rounded-2xl overflow-hidden shadow-md border border-emerald-700">
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600&auto=format&fit=crop" 
            alt="Medical research team working in lab" 
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Educational Content & Job List */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Why Work With Us */}
          <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-lg font-serif italic font-medium text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-750" />
              Why AssurX Diagnostics?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              At AssurX, our workforce is our pride. We offer supportive medical policies, professional development budgets, calibrated career timelines, and an safe, inclusive environment that fosters medical excellence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                <span className="font-black text-xs text-slate-800">🏥 Premium Clinical Facilities</span>
                <p className="text-[10.5px] text-slate-550 leading-relaxed">Work with high-Tesla MRI machines, multi-slice CT consoles, and fully-automated biochemistry sample channels.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                <span className="font-black text-xs text-slate-800">📈 Competitive Growth & Benefits</span>
                <p className="text-[10.5px] text-slate-550 leading-relaxed">Enjoy PF, ESI benefits, performance-linked monthly incentive payouts, and strict limits on shifts for safety.</p>
              </div>
            </div>
          </div>

          {/* Job Openings */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest pl-1">Active Job Openings</h3>
            <div className="grid grid-cols-1 gap-4">
              {OPEN_JOBS.map((job) => (
                <div key={job.id} className="bg-white border border-gray-200 p-5 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-50/20 transition-all flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">{job.title}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{job.department}</span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{job.type}</span>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-850 px-2 py-0.5 rounded">Exp: {job.experience}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Salary Package</span>
                      <span className="font-black text-sm text-emerald-800">{job.salary}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="text-slate-600 leading-relaxed">{job.description}</p>
                    
                    <div className="space-y-1">
                      <span className="font-black text-slate-700 text-[10px] uppercase tracking-wider block">Candidate Requirements:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[11px] leading-relaxed pl-1">
                        {job.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{job.location}</span>
                    </span>
                    <button 
                      onClick={() => {
                        setPosition(job.title);
                        // Scroll to form
                        const formEl = document.getElementById('career-form-element');
                        if (formEl) {
                          formEl.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-xs cursor-pointer active:scale-[0.98] transition-colors flex items-center gap-1"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Job Application Form / Success Display */}
        <div className="lg:col-span-5" id="career-form-element">
          
          {successApplication ? (
            <div className="bg-white border-2 border-emerald-500/20 p-6 rounded-3xl shadow-xl text-left space-y-6 animate-scale-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
                <p className="text-xs text-slate-500 font-medium">Thank you for applying. Our talent acquisition HR team will review your credentials and contact you within 3 business days.</p>
              </div>

              {/* Printable receipt card */}
              <div className="border border-slate-100 bg-[#fafafa]/50 p-5 rounded-2xl space-y-4" id="printable-receipt-panel-direct">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">ASSURX DIAGNOSTICS</h4>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">Careers & HR Division</p>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    {successApplication.applicationId}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Applicant Name:</span>
                    <span className="font-bold text-slate-700 text-right">{successApplication.fullName}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Position Applied:</span>
                    <span className="font-extrabold text-emerald-800 text-right">{successApplication.position}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Experience Tier:</span>
                    <span className="font-bold text-slate-700 text-right">{successApplication.experience}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Contact Email:</span>
                    <span className="font-bold text-slate-700 text-right truncate pl-2">{successApplication.email}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">Phone Number:</span>
                    <span className="font-bold text-slate-700 text-right">{successApplication.phone}</span>
                  </div>
                  <div className="grid grid-cols-2 border-t border-slate-100 pt-2 font-bold text-[10.5px]">
                    <span className="text-slate-800">Application Status:</span>
                    <span className="text-emerald-700 uppercase tracking-wider text-right">Applied / Pending HR Review</span>
                  </div>
                </div>

                {/* Patient Preparations Note */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] text-slate-500 space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Important Instructions:</div>
                  <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
                    <li>Please keep a digital PDF copy of your updated resume ready.</li>
                    <li>If short-listed, you will receive an invitation on your registered email for an online technical video interview.</li>
                  </ul>
                </div>

                {/* Barcode representation */}
                <div className="flex flex-col items-center justify-center pt-2.5 border-t border-slate-100 gap-1 select-none">
                  <div className="flex gap-[1px] h-6 items-center bg-white p-1 rounded">
                    {[1,3,1,2,3,1,1,4,2,1,1,3,2,1,4,2,1,1,2,3,1,4].map((w, idx) => (
                      <div key={idx} className="bg-slate-900 h-full" style={{ width: `${w}px` }}></div>
                    ))}
                  </div>
                  <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">*{successApplication.applicationId}*</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={triggerPrintReceipt}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print Receipt</span>
                </button>
                <button 
                  onClick={() => setSuccessApplication(null)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                >
                  <span>Apply for Another Role</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-3xl shadow-lg text-left space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Job Application Form</h3>
                <span className="text-xs text-slate-400">Fill in the fields below to submit your profile directly to our HR database.</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Your Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. Amit Patil" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-800 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Contact Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. amit.patil@gmail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-800 transition-all"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">10-Digit Mobile Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 9876543210" 
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-800 transition-all"
                    required
                  />
                </div>

                {/* Applying for Position */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Applying For Position</label>
                  <select 
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-bold text-slate-700 transition-all"
                  >
                    {OPEN_JOBS.map((job) => (
                      <option key={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Select */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Work Experience Tier</label>
                  <select 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-bold text-slate-700 transition-all"
                  >
                    <option>Freshers (No experience)</option>
                    <option>1 - 2 Years</option>
                    <option>3 - 5 Years</option>
                    <option>5+ Years</option>
                  </select>
                </div>

                {/* Resume Link */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Resume Link / Portfolio URL (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="e.g. Google Drive link or Dropbox PDF link" 
                    value={resumeLink}
                    onChange={(e) => setResumeLink(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-800 transition-all"
                  />
                  <p className="text-[10px] text-slate-400">Share a public Google Drive / Dropbox link to your CV.</p>
                </div>

                {/* Cover Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Brief Cover Notes / Why should we hire you?</label>
                  <textarea 
                    placeholder="Describe any relevant experience, certifications, or notice period..." 
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs font-semibold text-slate-800 transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-950 disabled:bg-slate-300 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-700/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
                  ) : (
                    <Send className="w-4 h-4 text-amber-300" />
                  )}
                  <span>Submit Job Application</span>
                </button>

              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
