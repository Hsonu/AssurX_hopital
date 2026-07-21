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

  return (
    <>
      {/* Permanent Fixed Circular WhatsApp Button - Positioned ABOVE Callback Bar */}
      <a
        href="https://wa.me/919830678387?text=Hello%20AssurX%20Diagnostics!%20I%20want%20to%20book%20a%20test%20😊"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp 9830678387"
        title="Chat on WhatsApp: 9830678387"
        className={`fixed ${!isDismissed ? 'bottom-[105px]' : 'bottom-5'} right-5 z-50 w-14 h-14 md:w-15 md:h-15 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(37,211,102,0.55)] transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white cursor-pointer group`}
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-35"></span>
        <svg className="w-8 h-8 fill-current relative drop-shadow-xs" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>

      {/* Floating Callback Bar (Dismissable) */}
      {!isDismissed && (
        <div className="fixed bottom-4 right-4 md:right-5 md:w-[380px] z-40 animate-bounce-in font-sans" id="callback-sticky-widget">
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
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl rounded-2xl px-4 py-3.5 flex items-center justify-between gap-4 transition-all duration-350 relative group">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#AD1457] animate-ping absolute"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#AD1457] relative"></div>
                <div className="text-left select-none">
                  <span className="text-sm font-serif italic font-bold tracking-tight text-[#2D006B] block">AssurX</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none block -mt-0.5">Callback</span>
                </div>
              </div>

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
      )}
    </>
  );
}
