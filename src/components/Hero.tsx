import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Check, Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';
import { HEALTH_PACKAGES } from '../data';
import { DiagnosticService } from '../types';
import smilingSpecialist from '@/assets/smiling_specialist.png';

interface HeroProps {
  onNavigate: (tab: 'home' | 'scans' | 'labs' | 'packages' | 'admin') => void;
  onOpenPrescription: () => void;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  onAddToCart: (item: any, type: 'service' | 'package') => void;
  onDirectBook: (item: any) => void;
  services: DiagnosticService[];
}

export default function Hero({
  onNavigate,
  onOpenPrescription,
  selectedBranch,
  setSelectedBranch,
  onAddToCart,
  onDirectBook,
  services
}: HeroProps) {
  const [testSearch, setTestSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

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
      const popularPackages = HEALTH_PACKAGES.filter(p => p.popular).map(p => ({ ...p, type: 'package' as const }));
      return [...popularServices, ...popularPackages].slice(0, 5);
    }
    const query = testSearch.toLowerCase();

    const matchedServices = services.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.subCategory && s.subCategory.toLowerCase().includes(query))
    ).map(s => ({ ...s, type: 'service' as const }));

    const matchedPackages = HEALTH_PACKAGES.filter(p =>
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
      const exactMatch = [...services, ...HEALTH_PACKAGES].find(
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

  const indianCities = [
    { code: 'Malad', name: 'Mumbai (Malad)' },
    { code: 'Goregaon', name: 'Mumbai (Goregaon)' }
  ];

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

          {/* Overlapping Booking Interactive Form Card */}
          <div className="w-full max-w-[380px] bg-white border border-slate-200 shadow-xl rounded-2xl md:rounded-3xl p-5 md:p-6 relative lg:absolute lg:-bottom-12 lg:-right-2 z-20 transition-all hover:shadow-2xl">

            <div className="space-y-4">
              {/* Box 1: Test / Scan input field */}
              <div className="space-y-1 text-left" ref={suggestionRef}>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Test / Scan Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. MRI Brain, CBC, Thyroid, Lipid"
                    value={testSearch}
                    onChange={(e) => {
                      setTestSearch(e.target.value);
                      setShowSuggestions(true);
                      if (selectedItem && e.target.value !== selectedItem.name) {
                        setSelectedItem(null);
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D006B]/10 focus:border-[#2D006B] font-bold transition-all placeholder:text-slate-400 text-slate-800"
                  />

                  {/* Autocomplete Suggestions Panel - Positioned relative to the input box */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 py-1">
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex justify-between items-center gap-2 border-0 bg-transparent outline-none focus:outline-none"
                        >
                          <div className="min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-wide bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">
                              {item.type === 'package' ? 'Package' : (item as any).category === 'scan' ? 'Scan' : 'Blood Test'}
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-1 truncate">{item.name}</p>
                          </div>
                          <span className="text-xs font-black text-[#2D006B] flex-shrink-0 font-mono">₹{item.discountPrice || item.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: City Select Dropdown */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Select City</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </span>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D006B]/10 focus:border-[#2D006B] font-extrabold text-slate-800 transition-all appearance-none cursor-pointer"
                  >
                    {indianCities.map((city) => (
                      <option key={city.code} value={city.code}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Box 3: Book Your Test/Scan CTA Button */}
              <button
                type="button"
                onClick={handleBookNow}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
              >
                <span>Book Now (Pay at Lab)</span>
              </button>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
