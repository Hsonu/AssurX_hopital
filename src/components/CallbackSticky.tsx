import React, { useState } from 'react';
import { Phone, X, CheckCircle2, Loader2 } from 'lucide-react';

export default function CallbackSticky() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    
    // Simple 10-digit validation for Indian mobile numbers
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    
    const prNum = Math.floor(100000 + Math.random() * 900000);
    const cbId = `CBK-${prNum}`;

    try {
      // Save callback request as a prescription/lead entry
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: cbId,
          patientName: 'Quick Callback Request',
          patientPhone: cleaned,
          fileName: 'Sticky Callback Widget.pdf',
          dontKnowTests: true,
          extractedServiceIds: []
        })
      });

      if (response.ok) {
        const savedCb = await response.json();

        // Also update local storage for instant offline/admin panel synchronization
        const existingStr = localStorage.getItem('assurx_prescriptions');
        const existing = existingStr ? JSON.parse(existingStr) : [];
        existing.unshift(savedCb);
        localStorage.setItem('assurx_prescriptions', JSON.stringify(existing));
      } else {
        console.error("Failed to sync callback request with PostgreSQL database");
      }
    } catch (err) {
      console.error("Error submitting callback request:", err);
    } finally {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPhoneNumber('');
      }, 6000);
    }
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-50 animate-bounce-in font-sans" id="callback-sticky-widget">
      
      {/* SUCCESS POPUP STATE */}
      {isSuccess ? (
        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500"></div>
          <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-400">Callback Registered!</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
              An AssurX healthcare care representative will call you back shortly. Thank you!
            </p>
          </div>
          <button 
            onClick={() => setIsSuccess(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* PERSISTENT FLOATING STICKY CALLBACK INPUT */
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl rounded-2xl px-4 py-3.5 flex items-center justify-between gap-4 transition-all duration-350 relative group">
          
          {/* Subtle logo badge on the left matching the look */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#AD1457] animate-ping absolute"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#AD1457] relative"></div>
            <div className="text-left select-none">
              <span className="text-sm font-serif italic font-bold tracking-tight text-[#2D006B] block">AssurX</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none block -mt-0.5">Callback</span>
            </div>
          </div>

          {/* Form inside with phone call trigger */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 relative">
            <input
              type="tel"
              placeholder="Get a call back (10-digit number)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
              maxLength={15}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 border border-slate-200 focus:border-[#2D006B] focus:outline-none focus:ring-2 focus:ring-[#2D006B]/10 rounded-xl text-xs font-semibold placeholder:text-slate-400 text-slate-800 bg-slate-50/50 focus:bg-white transition-all"
            />
            
            <button
              type="submit"
              disabled={isSubmitting || !phoneNumber}
              aria-label="Submit callback request"
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-red-100 transition-all duration-300 cursor-pointer ${
                phoneNumber 
                  ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Phone className="w-4 h-4 fill-current" />
              )}
            </button>
          </form>

          {/* Minimal dismiss 'x' */}
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss callback bar"
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

        </div>
      )}

    </div>
  );
}
