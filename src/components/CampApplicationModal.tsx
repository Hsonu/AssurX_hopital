import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, Users, Calendar, MapPin, Building, Phone, User, Tent, Sparkles, MessageSquare } from 'lucide-react';
import logoImg from '../../logo.jpeg';
import { getWhatsAppUrl } from '../config/branchConfig.ts';

interface CampApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCampType?: string;
  selectedBranch?: string;
  centers?: any[];
}

export default function CampApplicationModal({
  isOpen,
  onClose,
  defaultCampType = 'Free Health Check-up',
  selectedBranch,
  centers = []
}: CampApplicationModalProps) {
  const [campType, setCampType] = useState(defaultCampType);
  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [location, setLocation] = useState(selectedBranch || '');
  const [estimatedPeople, setEstimatedPeople] = useState('50-100');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!applicantName.trim() || !societyName.trim()) {
      alert('Please fill in your name and housing society/organization name.');
      return;
    }

    setIsSubmitting(true);

    const prNum = Math.floor(100000 + Math.random() * 900000);
    const campId = `CAMP-${prNum}`;

    const timestampNow = new Date().toISOString();
    const leadData = {
      id: Date.now(),
      prescriptionId: campId,
      patientName: `[CAMP REQUEST] ${applicantName} (${societyName})`,
      patientPhone: cleanedPhone,
      fileName: `Health Camp Application - ${campType}.pdf`,
      doctorName: `Society: ${societyName} | Type: ${campType} | Est: ${estimatedPeople} | Date: ${preferredDate || 'Flexible'} | Loc: ${location || 'N/A'} | Notes: ${notes || 'None'}`,
      dontKnowTests: true,
      extractedServiceIds: [campType, societyName, estimatedPeople, location || 'N/A', preferredDate || 'Flexible'],
      status: 'pending_call',
      timestamp: timestampNow
    };

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        const saved = await response.json();
        const existingStr = localStorage.getItem('assurx_prescriptions');
        const existing = existingStr ? JSON.parse(existingStr) : [];
        existing.unshift(saved);
        localStorage.setItem('assurx_prescriptions', JSON.stringify(existing));
      } else {
        // Fallback to local storage if offline/guest mode
        const existingStr = localStorage.getItem('assurx_prescriptions');
        const existing = existingStr ? JSON.parse(existingStr) : [];
        existing.unshift(leadData);
        localStorage.setItem('assurx_prescriptions', JSON.stringify(existing));
      }
    } catch (err) {
      console.error('Error submitting camp application:', err);
      // Fallback local storage
      const existingStr = localStorage.getItem('assurx_prescriptions');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(leadData);
      localStorage.setItem('assurx_prescriptions', JSON.stringify(existing));
    } finally {
      setIsSubmitting(false);
      setIsSuccess(true);
    }
  };

  const handleWhatsAppApply = () => {
    const message = `Hello AssurX Diagnostics! I would like to apply/organize a Health Camp.
*Camp Type:* ${campType}
*Applicant:* ${applicantName || 'N/A'}
*Phone:* ${phone || 'N/A'}
*Society/Org:* ${societyName || 'N/A'}
*Location:* ${location || 'N/A'}
*Est. Participants:* ${estimatedPeople}
*Preferred Date:* ${preferredDate || 'Flexible'}
*Notes:* ${notes || 'None'}`;

    const encoded = encodeURIComponent(message);
    const baseUrl = getWhatsAppUrl(selectedBranch, undefined, centers);
    const targetUrl = baseUrl.includes('text=') 
      ? baseUrl.replace(/text=[^&]*/, `text=${encoded}`)
      : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}text=${encoded}`;

    window.open(targetUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8 relative animate-scale-up">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#2D006B] via-[#3B008D] to-[#1A0040] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <img src={logoImg} alt="AssurX Diagnostics" className="h-8 w-auto bg-white/95 rounded-lg px-2 py-0.5 object-contain" />
            <span className="bg-red-500/20 text-red-200 border border-red-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Community Initiative
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
            <Tent className="w-6 h-6 text-red-400" />
            Apply for Health Camp
          </h2>
          <p className="text-xs text-purple-200 mt-1 max-w-md">
            Organize free or subsidized health check-ups, diagnostic screening & wellness seminars in your housing society or office.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Camp Application Received!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Thank you for taking the initiative for your community. An AssurX health camp coordinator will call you back shortly at <span className="font-bold text-[#2D006B]">{phone}</span> to finalize details.
                </p>
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleWhatsAppApply}
                  className="px-6 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Connect Instantly on WhatsApp
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Select Camp Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Camp Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Free Health Check-up', label: 'Free Check-up', color: 'border-red-200 bg-red-50/50 text-red-900' },
                    { id: 'Diagnostic Camps', label: 'Diagnostic Camp', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900' },
                    { id: 'Awareness Programs', label: 'Awareness Seminar', color: 'border-purple-200 bg-purple-50/50 text-purple-900' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setCampType(type.id)}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        campType === type.id
                          ? 'border-[#2D006B] bg-[#2D006B] text-white shadow-md ring-2 ring-[#2D006B]/20'
                          : `${type.color} hover:border-slate-400`
                      }`}
                    >
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid 2 Column */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Applicant Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Name / Role *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma (Secretary)"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#2D006B] focus:ring-2 focus:ring-[#2D006B]/10 outline-none"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit Mobile Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                      maxLength={15}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#2D006B] focus:ring-2 focus:ring-[#2D006B]/10 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Housing Society / Org Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Society / Building / Org *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gokuldham Heights CHS"
                      value={societyName}
                      onChange={(e) => setSocietyName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#2D006B] focus:ring-2 focus:ring-[#2D006B]/10 outline-none"
                    />
                  </div>
                </div>

                {/* Area / Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Area / Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Malad West, Mumbai"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#2D006B] focus:ring-2 focus:ring-[#2D006B]/10 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Est Participants */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estimated Participants
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={estimatedPeople}
                      onChange={(e) => setEstimatedPeople(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#2D006B] focus:ring-2 focus:ring-[#2D006B]/10 outline-none bg-white"
                    >
                      <option value="20-50">20 - 50 People</option>
                      <option value="50-100">50 - 100 People</option>
                      <option value="100-250">100 - 250 People</option>
                      <option value="250+">250+ People</option>
                    </select>
                  </div>
                </div>

                {/* Preferred Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Preferred Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#2D006B] focus:ring-2 focus:ring-[#2D006B]/10 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Tent className="w-4 h-4" />
                      Submit Camp Application
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppApply}
                  className="py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Apply via WhatsApp
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
