import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Check, Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';
import { DiagnosticService, HealthPackage } from '../types';
import smilingSpecialist from '@/assets/smiling_specialist.png';

import { getAllBranches } from '../config/branchConfig.ts';

interface HeroProps {
  onNavigate: (tab: 'home' | 'scans' | 'labs' | 'packages' | 'admin') => void;
  onOpenPrescription: () => void;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  onAddToCart: (item: any, type: 'service' | 'package') => void;
  onDirectBook: (item: any) => void;
  services: DiagnosticService[];
  packages: HealthPackage[];
  centers?: any[];
}

export default function Hero({
  onNavigate,
  onOpenPrescription,
  selectedBranch,
  setSelectedBranch,
  onAddToCart,
  onDirectBook,
  services,
  packages,
  centers = []
}: HeroProps) {
  const [testSearch, setTestSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [pincode, setPincode] = useState('');
  const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    investment: '5-10',
    experience: 'no'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleApplyPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      alert('Please enter a valid 6-digit Pincode.');
      return;
    }
    setIsFranchiseModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/franchise/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode, ...formData })
      });
      if (response.ok) {
        setIsSuccess(true);
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter tests and packages for autocomplete suggestions
  const suggestions = (() => {
    if (!testSearch.trim()) {
      // Show popular items by default when search is empty
      const popularServices = services.filter(s => s.popular).map(s => ({ ...s, type: 'service' as const }));
      const popularPackages = packages.filter(p => p.popular).map(p => ({ ...p, type: 'package' as const }));
      return [...popularServices, ...popularPackages].slice(0, 5);
    }
    const query = testSearch.toLowerCase();

    const matchedServices = services.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.subCategory && s.subCategory.toLowerCase().includes(query))
    ).map(s => ({ ...s, type: 'service' as const }));

    const matchedPackages = packages.filter(p =>
      p.name.toLowerCase().includes(query)
    ).map(p => ({ ...p, type: 'package' as const }));

    return [...matchedServices, ...matchedPackages].slice(0, 5);
  })();

  const handleSelectSuggestion = (item: any) => {
    setSelectedItem(item);
    setTestSearch(item.name);
    setShowSuggestions(false);
  };

  const handleBookNow = () => {
    if (selectedItem) {
      onDirectBook(selectedItem);
      setTestSearch('');
      setSelectedItem(null);
    } else if (testSearch.trim()) {
      // Fallback search trigger
      const exactMatch = [...services, ...packages].find(
        item => item.name.toLowerCase().includes(testSearch.toLowerCase())
      );
      if (exactMatch) {
        onDirectBook(exactMatch);
        setTestSearch('');
      } else {
        alert(`We couldn't find an exact match for "${testSearch}". Redirecting you to our Lab Tests catalog to explore available options.`);
        onNavigate('labs');
      }
    } else {
      const defaultService = services.find(s => s.id === 'lab-cbc') || services[0];
      if (defaultService) {
        onDirectBook(defaultService);
      } else {
        onNavigate('labs');
      }
    }
  };

  const indianCities = getAllBranches(centers);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F5F0FA]/90 via-[#F7FAFC]/80 to-[#FEF2F2]/30 py-10 md:py-16 px-4 md:px-6" id="hero-section">
      {/* Background themed accent circles */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#2D006B]/8"></div>
        <div className="absolute top-1/4 right-8 w-44 h-44 rounded-full bg-[#4A1A8A]/5"></div>
        <div className="absolute bottom-12 right-24 w-60 h-60 rounded-full bg-[#DC2626]/6"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">

        {/* Left Column: Heading and Checklist */}
        <div className="lg:col-span-7 space-y-5 md:space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F0FA] border border-[#E8DEFF] rounded-full text-[#2D006B] text-[10px] font-black uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-[#AD1457]" />
            <span>Monsoon Health Subsidy Active</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-light leading-[1.1] text-slate-900 tracking-tight">
            <span className="font-extrabold text-red-600">Save 60%</span> <span className="font-normal">on</span> <br />
            <span className="italic font-medium text-[#2D006B]">Scans & Blood tests</span>
          </h1>

          {/* Floating Trust Badge - Absolute horizontally and vertically centered relative to display on desktop, flow inline on mobile */}
          <div className="lg:absolute lg:left-1/2 lg:top-[42%] lg:-translate-x-1/2 lg:-translate-y-1/2 z-25 mt-6 lg:mt-0 w-full lg:w-auto flex justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-lg rounded-2xl p-4 flex flex-col items-center justify-center text-center w-[250px] sm:w-[280px]">
              <div className="flex gap-1.5 mb-2.5">
                <div className="w-7 h-7 rounded-full bg-[#F5F0FA] border border-[#E8DEFF] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D006B]" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] sm:text-[11px] font-black text-slate-800 leading-snug">
                  ISO 9001 Certified Lab
                </p>
                <div className="w-12 h-[1px] bg-slate-200 mx-auto my-1"></div>
                <p className="text-[10px] sm:text-[11px] font-black text-[#2D006B] leading-snug">
                  5 Lakh+ Smiling Indians in 10 Months
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Portrait + Floating Interactive Card Form */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center w-full relative">

          {/* Base Layout with Portrait image of a male diagnostic professional */}
          <div className="relative w-full max-w-[360px] aspect-[4/3] sm:aspect-square -mb-12 lg:mb-10 rounded-[36px] md:rounded-[48px] overflow-hidden bg-transparent flex items-end justify-center group">
            {/* Soft decorative blue circles in backdrop */}
            <div className="absolute top-10 right-4 w-40 h-40 rounded-full bg-[#2D006B]/10 blur-2xl group-hover:scale-110 transition-transform"></div>

            <img
              src={smilingSpecialist}
              alt="Smiling Diagnostic Specialist / Radiologist"
              className="w-full h-full object-cover object-top select-none transition-transform duration-500 hover:scale-102 mix-blend-multiply"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Overlapping Franchise Partner Form Card */}
          <form 
            onSubmit={handleApplyPincode}
            className="w-full max-w-[380px] bg-[#111827] border-2 border-slate-800 shadow-2xl rounded-2xl md:rounded-3xl p-6 relative lg:absolute lg:-bottom-12 lg:-right-2 z-20 transition-all hover:shadow-2xl text-white space-y-5"
          >
            <div className="space-y-3">
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#BFA15F] uppercase text-center block">
                Partner With AssurRx
              </span>
              <p className="text-xs sm:text-sm font-black tracking-wider text-slate-100 uppercase leading-relaxed text-center block">
                APPLY FOR A FREE FRANCHISE-PARTNER OPPORTUNITY AND GROW WITH US
              </p>
            </div>

            {/* Brutalist Gold/Beige Pincode Input */}
            <div className="flex border-2 border-black rounded-lg overflow-hidden h-11 shadow-sm">
              <div className="bg-[#BFA15F] px-4 flex items-center justify-center border-r-2 border-black">
                <Search className="w-4 h-4 text-black" />
              </div>
              <input
                type="text"
                placeholder="PINCODE"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-[#E3D4B6] px-4 text-sm font-black text-[#C2410C] placeholder:text-[#C2410C]/60 focus:outline-none tracking-widest text-center"
                maxLength={6}
                required
              />
            </div>

            {/* Brutalist Red Apply Now Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] border-2 border-black text-white font-extrabold text-xs uppercase tracking-widest rounded-lg transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer border-0"
            >
              APPLY NOW
            </button>
          </form>

        </div>

      </div>

      {/* FRANCHISE APPLICATION MODAL */}
      {isFranchiseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111827] border-4 border-black text-white rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-[8px_8px_0px_0px_rgba(191,161,95,1)]">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsFranchiseModalOpen(false);
                setIsSuccess(false);
                setFormData({ name: '', phone: '', email: '', investment: '5-10', experience: 'no' });
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-black text-lg cursor-pointer border-0 bg-transparent"
            >
              ✕
            </button>

            {!isSuccess ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-black text-[#BFA15F] uppercase">
                    Franchise Application
                  </h3>
                  <p className="text-xs text-slate-350 font-semibold">
                    Apply for Pincode: <span className="text-white font-black tracking-widest">{pincode}</span>
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-[#BFA15F] text-white"
                      required
                    />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-[#BFA15F] text-white"
                      maxLength={10}
                      required
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-[#BFA15F] text-white"
                      required
                    />
                  </div>

                  {/* Investment dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Investment Budget</label>
                    <select
                      value={formData.investment}
                      onChange={(e) => setFormData({ ...formData, investment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-[#BFA15F] text-white bg-slate-900"
                    >
                      <option value="5-10">₹5 Lakhs - ₹10 Lakhs</option>
                      <option value="10-20">₹10 Lakhs - ₹20 Lakhs</option>
                      <option value="above-20">Above ₹20 Lakhs</option>
                    </select>
                  </div>

                  {/* Experience checkbox */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Healthcare Experience</label>
                    <select
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-855 rounded-xl text-xs focus:outline-none focus:border-[#BFA15F] text-white bg-slate-900"
                    >
                      <option value="yes">Yes, I have prior experience</option>
                      <option value="no">No, I am new to healthcare</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#BFA15F] hover:bg-[#a88d4c] text-black font-extrabold text-xs uppercase tracking-widest rounded-lg transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'SUBMIT APPLICATION'}
                </button>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-[#BFA15F]/20 text-[#BFA15F] border-2 border-[#BFA15F] rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-serif font-black text-white uppercase">
                    Application Received!
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold max-w-sm mx-auto">
                    Thank you for applying. Our franchise development team will verify the availability for Pincode <span className="text-[#BFA15F] font-black">{pincode}</span> and contact you within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsFranchiseModalOpen(false);
                    setIsSuccess(false);
                    setFormData({ name: '', phone: '', email: '', investment: '5-10', experience: 'no' });
                    setPincode('');
                  }}
                  className="px-6 py-2 bg-[#BFA15F] text-black font-extrabold text-xs uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
