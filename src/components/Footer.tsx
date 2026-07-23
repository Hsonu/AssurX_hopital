import React, { useState } from 'react';
import { ShieldAlert, Award, ShieldCheck, HeartPulse, Sparkles, MapPin, PhoneCall, Mail, X, MessageSquareWarning, CheckCircle2, Loader2, Search, Clock } from 'lucide-react';
import { ASSURX_CENTERS } from '../data';
import { PatientComplaint } from '../types';
import logoImg from '../../logo.jpeg';

interface FooterProps {
  onNavigate: (tab: 'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings' | 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us') => void;
  centers?: Array<{ city: string; address: string; phone: string }>;
}

const COMPLAINT_CATEGORIES: { value: PatientComplaint['category']; label: string }[] = [
  { value: 'service_quality', label: 'Service Quality' },
  { value: 'staff_behavior', label: 'Staff Behavior' },
  { value: 'billing', label: 'Billing Issue' },
  { value: 'report_delay', label: 'Report Delay' },
  { value: 'cleanliness', label: 'Cleanliness / Hygiene' },
  { value: 'other', label: 'Other' },
];

export default function Footer({ onNavigate, centers = [] }: FooterProps) {
  const displayCenters = centers.length > 0 ? centers : ASSURX_CENTERS;

  // Complaint modal state
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<PatientComplaint | null>(null);
  const [modalTab, setModalTab] = useState<'file' | 'track'>('file');
  // Track complaints state
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedComplaints, setTrackedComplaints] = useState<PatientComplaint[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    patientName: '',
    phone: '',
    email: '',
    bookingId: '',
    category: '' as PatientComplaint['category'] | '',
    subject: '',
    description: '',
    branch: '',
  });

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate 10-digit mobile
    const cleanPhone = complaintForm.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!complaintForm.patientName || !complaintForm.category || !complaintForm.subject || !complaintForm.description || !complaintForm.branch) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const complaint: PatientComplaint = {
        id: `CMP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        patientName: complaintForm.patientName,
        phone: complaintForm.phone,
        email: complaintForm.email,
        bookingId: complaintForm.bookingId || undefined,
        category: complaintForm.category as PatientComplaint['category'],
        subject: complaintForm.subject,
        description: complaintForm.description,
        branch: complaintForm.branch,
        status: 'open',
        timestamp: new Date().toISOString(),
      };

      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem('assurx_complaints') || '[]');
      existing.push(complaint);
      localStorage.setItem('assurx_complaints', JSON.stringify(existing));

      setIsSubmitting(false);
      setSubmittedComplaint(complaint);
      setComplaintSubmitted(true);
    }, 1200);
  };

  const resetComplaintForm = () => {
    setComplaintForm({ patientName: '', phone: '', email: '', bookingId: '', category: '', subject: '', description: '', branch: '' });
    setComplaintSubmitted(false);
    setSubmittedComplaint(null);
    setModalTab('file');
    setTrackPhone('');
    setTrackedComplaints([]);
    setHasSearched(false);
    setIsComplaintOpen(false);
  };

  const handleTrackComplaints = () => {
    const cleanPhone = trackPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) return;
    const all: PatientComplaint[] = JSON.parse(localStorage.getItem('assurx_complaints') || '[]');
    const matched = all.filter(c => c.phone === cleanPhone);
    setTrackedComplaints(matched);
    setHasSearched(true);
  };

  const statusColors: Record<PatientComplaint['status'], string> = {
    open: 'bg-rose-50 text-rose-700 border-rose-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const statusLabels: Record<PatientComplaint['status'], string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
  };
  const categoryLabels: Record<PatientComplaint['category'], string> = {
    service_quality: 'Service Quality',
    staff_behavior: 'Staff Behavior',
    billing: 'Billing Issue',
    report_delay: 'Report Delay',
    cleanliness: 'Cleanliness',
    other: 'Other',
  };

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs md:text-sm border-t border-slate-800" id="main-footer">
      
      {/* Brand Trust Bar */}
      <div className="bg-slate-950 border-b border-slate-900 py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-center">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-[#AD1457] flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">NABL Accredited</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Labs fully audited to ISO 15189 standards</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#AD1457] flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">MD Radiologists</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Dual-verified reporting of all scan results</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-[#AD1457] flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">2 Crore+ Patients</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Most trusted name in diagnostics & scans</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#AD1457] flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">Robotic Accuracy</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Minimal human contact for sterile precision</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* Col 1: About - md:col-span-4 */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => onNavigate('home')}>
            <img src={logoImg} alt="AssurX Diagnostics" className="h-10 w-auto rounded-lg object-contain bg-white/10 px-1.5 py-0.5" />
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            AssurX Scans & Labs is India's premier diagnostics and advanced medical imaging network. Bridging clinical expertise with futuristic diagnostic technology, we make high-end MRI, CT scans, and complete laboratory blood analyses affordable and accessible for every citizen.
          </p>
          <div className="space-y-2 text-[11px]">
            <a href="tel:+919830678387" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <PhoneCall className="w-3.5 h-3.5 text-[#009688]" />
              <span className="text-[#80CBC4] font-bold">Helpline: +91 9830678387</span>
            </a>
            <a
              href="https://wa.me/919830678387?text=Hello%20AssurX%20Diagnostics!%20I%20want%20to%20book%20a%20test%20😊"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white font-bold hover:text-emerald-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>WhatsApp Us: 9830678387 😊</span>
            </a>
            <a href="mailto:assurxdiagonistics@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-[#009688]" />
              <span className="text-[#80CBC4]">Care: assurxdiagonistics@gmail.com</span>
            </a>
          </div>
        </div>



        {/* Col 3: Lab Tests Index - md:col-span-2.5 */}
        <div className="md:col-span-2.5 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Laboratory Diagnostics</h4>
          <ul className="space-y-2 text-[11px]">
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Complete Blood Count (CBC)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Thyroid Profiles (T3, T4, TSH)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Diabetes Glycated HbA1c</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Cardiovascular Lipid Panel</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Liver Function Tests (LFT)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Vitamin D & B12 screening</button></li>
          </ul>
        </div>

        {/* Col 4: Top Centers - md:col-span-3 */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Top Mumbai Branches</h4>
          <div className="space-y-2 text-[11px] max-h-48 overflow-y-auto pr-1 text-slate-400">
            {displayCenters.map((center, idx) => (
              <div key={idx} className="border-b border-slate-800/60 pb-1.5 last:border-b-0 last:pb-0">
                <span className="font-bold text-slate-300 block">{center.city} Branch</span>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{center.address}</p>
                <span className="text-[10px] text-[#009688] font-semibold block mt-0.5">Ph: {center.phone}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Copywrite legal info footer */}
      <div className="bg-slate-950 text-slate-550 border-t border-slate-900 py-6 px-4 md:px-6 text-[10px] md:text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 AssurX Scans & Laboratories Pvt. Ltd. All medical rights reserved.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2">
            <button onClick={() => onNavigate('about-us')} className="hover:text-slate-300 transition-colors cursor-pointer">About Us</button>
            <button onClick={() => onNavigate('contact-us')} className="hover:text-slate-300 transition-colors cursor-pointer">Contact Us</button>
            <button onClick={() => onNavigate('privacy-policy')} className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => onNavigate('terms-of-use')} className="hover:text-slate-300 transition-colors cursor-pointer font-semibold">Terms of Use</button>
            <button onClick={() => onNavigate('refund-policy')} className="hover:text-slate-300 transition-colors cursor-pointer">Cancellation & Refund</button>
            <button onClick={() => onNavigate('shipping-policy')} className="hover:text-slate-300 transition-colors cursor-pointer">Service Delivery</button>
            <button
              onClick={() => setIsComplaintOpen(true)}
              className="hover:text-[#80CBC4] transition-colors cursor-pointer flex items-center gap-1 text-[#009688] font-semibold"
            >
              <MessageSquareWarning className="w-3 h-3" />
              Patient Complaint
            </button>
          </div>
        </div>
      </div>

      {/* ── PATIENT COMPLAINT MODAL ─────────────────────────────────────── */}
      {isComplaintOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" style={{ animation: 'fadeIn 0.25s ease' }}>
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden"
            style={{ animation: 'scaleIn 0.3s ease' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <MessageSquareWarning className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-serif">Patient Complaint</h3>
                  <p className="text-[10px] text-white/70">We value your feedback & will act swiftly</p>
                </div>
              </div>
              <button onClick={resetComplaintForm} className="text-white/70 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            {!complaintSubmitted && (
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setModalTab('file')}
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalTab === 'file'
                      ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                  File Complaint
                </button>
                <button
                  onClick={() => setModalTab('track')}
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalTab === 'track'
                      ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Track My Complaints
                </button>
              </div>
            )}

            {/* Body */}
            {/* --- TRACK COMPLAINTS TAB --- */}
            {modalTab === 'track' && !complaintSubmitted && (
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Phone Search */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enter Your 10-Digit Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      maxLength={10}
                      value={trackPhone}
                      onChange={e => setTrackPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50"
                      onKeyDown={e => { if (e.key === 'Enter') handleTrackComplaints(); }}
                    />
                    <button
                      type="button"
                      onClick={handleTrackComplaints}
                      disabled={trackPhone.length !== 10}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Search
                    </button>
                  </div>
                  {trackPhone.length > 0 && trackPhone.length < 10 && (
                    <p className="text-[9px] text-rose-500 font-semibold">{trackPhone.length}/10 digits entered</p>
                  )}
                </div>

                {/* Results */}
                {hasSearched && (
                  <div className="space-y-4">
                    {trackedComplaints.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center mx-auto mb-3">
                          <MessageSquareWarning className="w-6 h-6 text-slate-300" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-400">No Complaints Found</h4>
                        <p className="text-[10px] text-slate-400 mt-1">No complaints registered with this mobile number.</p>
                      </div>
                    ) : (() => {
                      const total = trackedComplaints.length;
                      const openCount = trackedComplaints.filter(c => c.status === 'open').length;
                      const inProgressCount = trackedComplaints.filter(c => c.status === 'in_progress').length;
                      const resolvedCount = trackedComplaints.filter(c => c.status === 'resolved').length;
                      const dismissedCount = trackedComplaints.filter(c => c.status === 'dismissed').length;
                      return (
                        <>
                          {/* Summary Stats */}
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-black text-slate-700">{total}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-black text-rose-700">{openCount}</p>
                              <p className="text-[8px] font-bold text-rose-400 uppercase tracking-wider">Open</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-black text-amber-700">{inProgressCount}</p>
                              <p className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">In Progress</p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
                              <p className="text-lg font-black text-emerald-700">{resolvedCount}</p>
                              <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Resolved</p>
                            </div>
                          </div>

                          {/* Complaint List */}
                          <div className="space-y-2.5">
                            {trackedComplaints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((c, idx) => (
                              <div key={c.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${statusColors[c.status]}`}>
                                          ● {statusLabels[c.status]}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-500">
                                          {categoryLabels[c.category]}
                                        </span>
                                      </div>
                                      <h5 className="text-[11px] font-bold text-slate-800 leading-tight">{c.subject}</h5>
                                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{c.description}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-[8px] text-slate-400 font-semibold block">
                                        {new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-400 border-t border-slate-100 pt-1.5">
                                    <span><strong>ID:</strong> <span className="font-mono text-teal-700">{c.id}</span></span>
                                    <span><strong>Branch:</strong> {c.branch}</span>
                                    {c.bookingId && <span><strong>Booking:</strong> {c.bookingId}</span>}
                                  </div>
                                  {c.adminNotes && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 text-[9px] text-blue-800">
                                      <strong>Admin Response:</strong> {c.adminNotes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* --- FILE COMPLAINT / SUCCESS VIEW --- */}
            {modalTab === 'file' && complaintSubmitted && submittedComplaint ? (
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-serif">Complaint Registered Successfully</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Thank you for bringing this to our attention. Our patient care team will review your complaint and respond within <strong>24-48 hours</strong>.
                  </p>
                </div>

                {/* Complaint Status Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complaint ID</span>
                    <span className="text-[11px] font-black text-teal-700 font-mono">{submittedComplaint.id}</span>
                  </div>
                  <div className="border-t border-slate-200"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</span>
                    <span className="text-[11px] font-bold text-slate-700">{submittedComplaint.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</span>
                    <span className="text-[11px] font-bold text-slate-700">{submittedComplaint.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch</span>
                    <span className="text-[11px] font-bold text-slate-700">{submittedComplaint.branch}</span>
                  </div>
                  <div className="border-t border-slate-200"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                      ● Open
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted</span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {new Date(submittedComplaint.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                      {new Date(submittedComplaint.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={resetComplaintForm}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : modalTab === 'file' && !complaintSubmitted ? (
              <form onSubmit={handleComplaintSubmit} className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Name + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={complaintForm.patientName}
                      onChange={e => setComplaintForm(f => ({ ...f, patientName: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit mobile number"
                      value={complaintForm.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setComplaintForm(f => ({ ...f, phone: val }));
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50"
                    />
                    {complaintForm.phone.length > 0 && complaintForm.phone.length < 10 && (
                      <p className="text-[9px] text-rose-500 font-semibold mt-0.5">{complaintForm.phone.length}/10 digits entered</p>
                    )}
                    {complaintForm.phone.length === 10 && (
                      <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">✓ Valid 10-digit number</p>
                    )}
                  </div>
                </div>

                {/* Email + Booking ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={complaintForm.email}
                      onChange={e => setComplaintForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Booking ID (Optional)</label>
                    <input
                      type="text"
                      value={complaintForm.bookingId}
                      onChange={e => setComplaintForm(f => ({ ...f, bookingId: e.target.value }))}
                      placeholder="ASX-XXXXXX"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Branch + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch *</label>
                    <select
                      required
                      value={complaintForm.branch}
                      onChange={e => setComplaintForm(f => ({ ...f, branch: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50 cursor-pointer"
                    >
                      <option value="">Select Branch</option>
                      {displayCenters.map((c, i) => (
                        <option key={i} value={c.city}>{c.city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                    <select
                      required
                      value={complaintForm.category}
                      onChange={e => setComplaintForm(f => ({ ...f, category: e.target.value as PatientComplaint['category'] }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50 cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {COMPLAINT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.subject}
                    onChange={e => setComplaintForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief summary of your complaint"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detailed Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={complaintForm.description}
                    onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Please describe the issue in detail. Include dates, staff names, and any other relevant information..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all bg-slate-50/50 resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetComplaintForm}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-teal-100 disabled:opacity-60 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Complaint'
                    )}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}

    </footer>
  );
}
