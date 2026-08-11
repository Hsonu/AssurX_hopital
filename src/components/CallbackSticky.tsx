import React, { useState } from 'react';
import { Phone, X, CheckCircle2, Loader2, Tent } from 'lucide-react';
import { getWhatsAppUrl, getBranchWhatsAppNumber } from '../config/branchConfig.ts';
import logoImg from '../../logo.jpeg';

interface CallbackStickyProps {
  selectedBranch?: string;
  centers?: any[];
  onOpenCampModal?: (campType?: string) => void;
}

export default function CallbackSticky({ selectedBranch, centers, onOpenCampModal }: CallbackStickyProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const whatsappUrl = getWhatsAppUrl(selectedBranch, undefined, centers);
  const whatsappNumber = getBranchWhatsAppNumber(selectedBranch, centers);

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
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat on WhatsApp ${whatsappNumber}`}
        title={`Chat on WhatsApp: ${whatsappNumber}`}
        className={`fixed ${!isDismissed ? 'bottom-[115px]' : 'bottom-5'} right-5 z-50 w-14 h-14 md:w-15 md:h-15 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(37,211,102,0.55)] transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white cursor-pointer group`}
      >
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-35"></span>
        <svg className="w-8 h-8 fill-white relative z-10" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.149-.173.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          <path d="M12.004 2c-5.517 0-9.997 4.48-9.997 9.997 0 1.763.459 3.48 1.332 5.003l-1.417 5.176 5.297-1.389c1.474.803 3.136 1.226 4.785 1.226 5.517 0 9.998-4.48 9.998-9.997C22.002 6.48 17.521 2 12.004 2zm0 18.257c-1.488 0-2.949-.4-4.232-1.157l-.304-.18-3.146.825.839-3.067-.198-.315c-.832-1.32-1.272-2.846-1.272-4.366 0-4.551 3.703-8.254 8.254-8.254 4.55 0 8.254 3.703 8.254 8.254 0 4.551-3.704 8.254-8.254 8.254z"/>
        </svg>
      </a>

      {/* Floating Callback Bar (Dismissable) */}
      {!isDismissed && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:w-[420px] z-40 animate-bounce-in font-sans" id="callback-sticky-widget">
          {isSuccess ? (
            <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3.5 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500"></div>
              <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-800">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-400">Callback Registered!</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  An AssurX healthcare representative will call you back shortly. Thank you!
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
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl px-3.5 py-3 flex flex-col gap-2 transition-all duration-350 relative group">
              {/* Top Row: AssurX Logo + Callback Form + Dismiss */}
              <div className="flex items-center justify-between gap-3">
                {/* AssurX Logo with Ping Dot */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="relative flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#AD1457] animate-ping absolute -top-1 -right-1 z-10"></span>
                    <img 
                      src={logoImg} 
                      alt="AssurX Diagnostics Logo" 
                      className="h-8 sm:h-9 w-auto max-w-[95px] object-contain rounded-lg bg-white border border-slate-200 p-0.5 shadow-xs" 
                    />
                  </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-1.5 relative">
                  <input
                    type="tel"
                    placeholder="Get a call back (10-digit number)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                    maxLength={15}
                    disabled={isSubmitting}
                    className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#2D006B] focus:outline-none focus:ring-2 focus:ring-[#2D006B]/10 rounded-xl text-xs font-semibold placeholder:text-slate-400 text-slate-800 bg-slate-50/50 focus:bg-white transition-all"
                  />
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !phoneNumber}
                    aria-label="Submit callback request"
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-300 cursor-pointer ${
                      phoneNumber 
                        ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Phone className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                </form>

                {/* Close Button */}
                <button
                  onClick={() => setIsDismissed(true)}
                  aria-label="Dismiss callback bar"
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Quick Bar: Apply for Camp Button */}
              {onOpenCampModal && (
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Society Health Camp?
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenCampModal()}
                    className="px-2.5 py-0.5 bg-[#2D006B] hover:bg-[#3B008D] text-white text-[10px] font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Tent className="w-3 h-3 text-red-400" />
                    <span>Apply for Camp</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

