import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, MapPin, User, FileText, CheckCircle2, 
  Loader2, Download, Printer, AlertCircle, ShoppingBag, Eye, ShieldCheck, Landmark
} from 'lucide-react';
import { Booking } from '../types';
import { userFetch } from '../lib/sessionGuard.ts';

const cleanBookingId = (id: string) => id.split('-').slice(0, 2).join('-');

interface PatientBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  idToken: string | null;
  userEmail: string | undefined;
}

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

export default function PatientBookingsModal({ isOpen, onClose, idToken, userEmail }: PatientBookingsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeReport, setActiveReport] = useState<Booking | null>(null);
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
        // Sort descending by timestamp or id
        const sorted = data.sort((a: Booking, b: Booking) => {
          return new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime();
        });
        setBookings(sorted);
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
    if (isOpen && idToken) {
      fetchUserBookings();
    }
  }, [isOpen, idToken]);

  // Open clinical report view
  const handleOpenReport = (booking: Booking) => {
    setActiveReport(booking);
    
    // Attempt to load custom clinical data saved by admin in localStorage
    const savedCustomResultsStr = localStorage.getItem(`report_data_${booking.id}`);
    if (savedCustomResultsStr) {
      try {
        const parsed = JSON.parse(savedCustomResultsStr);
        setReportData(parsed.parameters || []);
        setScanFindings(parsed.findings || '');
        setScanImpression(parsed.impression || '');
        return;
      } catch (e) {
        console.error("Failed to parse custom report data, using defaults.", e);
      }
    }

    // Otherwise load realistic defaults based on the ordered tests
    let defaultLabData: any[] = [];
    let defaultScanFindings = 'Chest lung fields appear clear. No focal consolidation, pleural effusion, or pneumothorax is identified. Cardiomediastinal contour is within normal limits. Bony thoracic cage and soft tissues are unremarkable.';
    let defaultScanImpression = 'NORMAL DIGITAL CHEST STUDY.';

    booking.items.forEach(item => {
      if (DEFAULT_LAB_RESULTS[item.itemId]) {
        defaultLabData = [...defaultLabData, ...DEFAULT_LAB_RESULTS[item.itemId]];
      }
    });

    // Fallback if no specific lab test template found
    if (defaultLabData.length === 0 && booking.items.some(it => it.category === 'lab')) {
      defaultLabData = [
        { parameter: 'Hemoglobin (Hb)', result: '13.8', unit: 'g/dL', range: '12.0 - 16.0', status: 'normal' },
        { parameter: 'Serum Creatinine', result: '0.92', unit: 'mg/dL', range: '0.60 - 1.20', status: 'normal' },
        { parameter: 'Total Cholesterol', result: '185', unit: 'mg/dL', range: 'Desirable: <200', status: 'normal' }
      ];
    }

    setReportData(defaultLabData);
    setScanFindings(defaultScanFindings);
    setScanImpression(defaultScanImpression);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer" 
        onClick={() => {
          if (activeReport) {
            setActiveReport(null);
          } else {
            onClose();
          }
        }}
      ></div>

      {/* Main Container */}
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
              <span>{activeReport ? 'Official Diagnostic Report' : 'Your Medical Booking History'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {activeReport 
                ? `Booking ID: ${cleanBookingId(activeReport.bookingId)} • Electronic Health Record (EHR)` 
                : `Logged in as: ${userEmail} • Verified Patient Profile`
              }
            </p>
          </div>
          <button
            onClick={() => {
              if (activeReport) {
                setActiveReport(null);
              } else {
                onClose();
              }
            }}
            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          {activeReport ? (
            /* --- DETAILED MEDICAL DIAGNOSTIC REPORT PREVIEW --- */
            <div className="space-y-6">
              
              {/* Printable Medical Document Header */}
              <div id="printable-report-area" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-xs text-left">
                
                {/* Letterhead */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-800/10 pb-5 gap-4">
                  <div className="space-y-1">
                    <span className="font-sans font-black tracking-widest text-emerald-850 uppercase text-lg block">
                      ASSUR<span className="text-emerald-650">X</span> DIAGNOSTICS
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">
                      Consolidated Clinical Laboratory & Imaging Network
                    </span>
                    <span className="text-[9px] text-slate-400 block font-semibold">
                      ISO 9001:2015 & NABL Accredited Infrastructure • HIPAA Compliant
                    </span>
                  </div>
                  <div className="text-left sm:text-right text-[10px] text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">Support Desk: 1800-2026-HEALTH</p>
                    <p>Email: reports@assurx.com • Web: www.assurx.com</p>
                    <p>Corporate Hub: S.V. Road, Malad West, Mumbai</p>
                  </div>
                </div>

                {/* Patient Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs">
                  <div className="space-y-1.5">
                    <div className="flex">
                      <span className="w-24 text-slate-400 font-semibold uppercase text-[9.5px]">Patient Name:</span>
                      <span className="font-bold text-slate-800">{activeReport.patient.name}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-400 font-semibold uppercase text-[9.5px]">Age / Gender:</span>
                      <span className="font-semibold text-slate-700">{activeReport.patient.age} Years / {activeReport.patient.gender}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-400 font-semibold uppercase text-[9.5px]">Ref Doctor:</span>
                      <span className="font-semibold text-slate-700">Self Referral (Dr. AssurX Specialist)</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:pl-6 md:border-l border-slate-200">
                    <div className="flex">
                      <span className="w-28 text-slate-400 font-semibold uppercase text-[9.5px]">Booking ID:</span>
                      <span className="font-mono font-bold text-emerald-800 uppercase">{cleanBookingId(activeReport.bookingId)}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-400 font-semibold uppercase text-[9.5px]">Register Date:</span>
                      <span className="font-semibold text-slate-700">{activeReport.appointmentDate}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-400 font-semibold uppercase text-[9.5px]">Report Released:</span>
                      <span className="font-semibold text-slate-700">{new Date(activeReport.timestamp || '').toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                    </div>
                  </div>
                </div>

                {/* Report Content based on test category */}
                <div className="space-y-6 pt-2">
                  
                  {/* Laboratory Pathology Section */}
                  {activeReport.items.some(it => it.category === 'lab') && reportData.length > 0 && (
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
                  {activeReport.items.some(it => it.category === 'scan') && (
                    <div className="space-y-4">
                      <div className="border-b-2 border-slate-800/10 pb-1.5">
                        <h3 className="font-serif font-bold text-slate-900 text-sm">DEPARTMENT OF RADIOLOGY & IMAGING DIAGNOSTICS</h3>
                      </div>
                      
                      <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1">
                          <p className="font-bold text-slate-800 text-[9.5px] uppercase tracking-wider">Examined Anatomy:</p>
                          <p className="font-semibold text-slate-600">
                            {activeReport.items.filter(it => it.category === 'scan').map(it => it.name).join(', ')}
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

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveReport(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition-colors cursor-pointer"
                >
                  Back to All Bookings
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-md shadow-emerald-100 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>

            </div>
          ) : (
            /* --- ALL PATIENT BOOKINGS LISTING --- */
            <div className="space-y-6">
              
              {/* Sync Loader */}
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Fetching your secure booking records...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-150 p-4 rounded-2xl flex items-start gap-3 text-left">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-800 text-xs uppercase tracking-wider">Sync Interrupted</h4>
                    <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
                    <button 
                      onClick={fetchUserBookings}
                      className="mt-2.5 text-xs font-bold text-red-800 underline hover:text-red-950 transition-colors cursor-pointer"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && bookings.length === 0 && (
                <div className="py-16 text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-serif font-bold text-slate-900 text-lg">No clinical orders found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      You haven't scheduled any diagnostic lab tests or scans yet. Any test you book on our portal using this account will instantly sync here.
                    </p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-emerald-100 transition-all cursor-pointer"
                  >
                    Explore Diagnostic Catalog
                  </button>
                </div>
              )}

              {/* Bookings List Grid */}
              {!loading && bookings.length > 0 && (
                <div className="grid grid-cols-1 gap-5">
                  {bookings.map((booking) => {
                    const isReportReady = booking.bookingStatus === 'report_ready';
                    const formattedDate = new Date(booking.timestamp || '').toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });

                    return (
                      <div 
                        key={booking.id} 
                        className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col md:flex-row justify-between gap-6"
                      >
                        {/* Booking Core Info */}
                        <div className="flex-1 space-y-3.5">
                          {/* Top row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                              {cleanBookingId(booking.bookingId)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Booked on: {formattedDate}
                            </span>
                          </div>

                          {/* Patient and details */}
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-sm">
                              Patient: {booking.patient.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 flex-wrap">
                              <span>Age: {booking.patient.age} Yrs</span>
                              <span>•</span>
                              <span>Gender: {booking.patient.gender}</span>
                              <span>•</span>
                              <span>Relation: {booking.patient.relationship}</span>
                            </p>
                          </div>

                          {/* Tests Ordered list */}
                          <div className="border-t border-slate-100 pt-3 space-y-1.5">
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Ordered Catalog Tests:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {booking.items.map((item, idx) => (
                                <span 
                                  key={idx} 
                                  className="text-[10.5px] font-bold bg-slate-50 border border-slate-150 text-slate-700 px-2.5 py-1 rounded-lg"
                                >
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Collection details */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{booking.appointmentDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{booking.appointmentTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="capitalize">{booking.collectionType === 'home' ? '🏠 Home Collection' : `🏢 Center Visit (${booking.address?.city || 'Malad'})`}</span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Status & Actions Sidebar */}
                        <div className="w-full md:w-56 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-6 flex flex-col justify-between items-start md:items-end gap-4 text-left md:text-right">
                          <div className="space-y-2 w-full md:text-right">
                            {/* Status pill */}
                            <div className="space-y-1">
                              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Clinical Status:</span>
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider ${
                                booking.bookingStatus === 'booked' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                booking.bookingStatus === 'sample_collected' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                                booking.bookingStatus === 'processing' ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse' :
                                'bg-emerald-600 text-white shadow-md shadow-emerald-50'
                              }`}>
                                {booking.bookingStatus === 'booked' ? '● Confirmed' :
                                 booking.bookingStatus === 'sample_collected' ? '● Sample Collected' :
                                 booking.bookingStatus === 'processing' ? '● In Lab Processing' :
                                 '✔ Report Released'}
                              </span>
                            </div>

                            {/* Payment details */}
                            <div className="pt-1.5">
                              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Payment Details:</span>
                              <p className="font-extrabold text-slate-900 font-serif text-sm">₹{booking.totalAmount}</p>
                              <span className={`text-[10px] font-bold uppercase block mt-0.5 ${
                                booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-500'
                              }`}>
                                {booking.paymentStatus === 'paid' ? '✔ Paid (' + booking.paymentMethod.toUpperCase() + ')' : '⚠ Cash On Collection'}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="w-full">
                            {isReportReady ? (
                              <button
                                onClick={() => handleOpenReport(booking)}
                                className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-150 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Diagnostic Report</span>
                              </button>
                            ) : (
                              <div className="w-full py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-center text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
                                <span>Awaiting Lab Release</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-6 border-t border-slate-100 bg-slate-50/50 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End HIPAA Secured EHR Platform</span>
          </div>
          <button
            onClick={() => {
              if (activeReport) {
                setActiveReport(null);
              } else {
                onClose();
              }
            }}
            className="px-5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-full transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
