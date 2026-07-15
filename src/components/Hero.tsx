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
      const popularPackages = HEALTH_PACKAGES.filter(p => p.id === 'pkg-assurx-essential').map(p => ({ ...p, type: 'package' as const }));
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
      // Open booking with the most popular test as default instead of an annoying alert
      const defaultService = services.find(s => s.id === 'lab-cbc') || services[0];
      onDirectBook(defaultService);
    }
  };

  const indianCities = [
    { code: 'Malad', name: 'Mumbai (Malad)' },
    { code: 'Goregaon', name: 'Mumbai (Goregaon)' }
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#d4f3f6]/90 via-[#f0fcfd]/80 to-[#fdfde2]/40 py-10 md:py-16 px-4 md:px-6" id="hero-section">
      {/* Background yellow circles to match the exact look in the screenshot */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-yellow-300/30"></div>
        <div className="absolute top-1/4 right-8 w-44 h-44 rounded-full bg-yellow-350/40"></div>
        <div className="absolute bottom-12 right-24 w-60 h-60 rounded-full bg-yellow-300/30"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Column: Heading and Checklist */}
        <div className="lg:col-span-7 space-y-5 md:space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-850 text-[10px] font-black uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Monsoon Health Subsidy Active</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-light leading-[1.1] text-slate-900 tracking-tight">
            <span className="font-extrabold text-emerald-600">Save 60%</span> <span className="font-normal">on</span> <br />
            <span className="italic font-medium text-emerald-800">Scans & Blood tests</span>
          </h1>

          {/* Checklist Bullet List matching the exact look in second screenshot */}
          <ul className="space-y-3 text-xs sm:text-sm md:text-base text-slate-700 font-bold">
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-black shadow-md shadow-emerald-200">✓</span>
              <span>200+ state-of-the-art diagnostic centres across India</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-black shadow-md shadow-emerald-200">✓</span>
              <span>Trusted by over 2+ crore Indian citizens</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-black shadow-md shadow-emerald-200">✓</span>
              <span>Accurate digital lab reports in under 6 hours</span>
            </li>
          </ul>

          {/* Quick Upload Rx trigger */}
          <div className="pt-2">
            <button
              onClick={onOpenPrescription}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>Have a Prescription? Upload Here</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Portrait + Floating Interactive Card Form */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center w-full relative">
          
          {/* Base Layout with Portrait image of a male diagnostic professional */}
          <div className="relative w-full max-w-[360px] aspect-[4/3] sm:aspect-square mb-6 lg:mb-10 rounded-[36px] md:rounded-[48px] overflow-hidden bg-transparent flex items-end justify-center group">
            {/* Soft decorative golden circles in backdrop */}
            <div className="absolute top-10 right-4 w-40 h-40 rounded-full bg-amber-400/10 blur-2xl group-hover:scale-110 transition-transform"></div>
            
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
              <div className="space-y-1 relative text-left" ref={suggestionRef}>
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
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 font-bold transition-all placeholder:text-slate-400 text-slate-800"
                  />
                </div>

                {/* Autocomplete Suggestions Panel */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-50 py-1">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex justify-between items-center gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-wide bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">
                            {item.type === 'package' ? 'Package' : (item as any).category === 'scan' ? 'Scan' : 'Blood Test'}
                          </span>
                          <p className="text-xs font-bold text-slate-800 mt-1 truncate">{item.name}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-700 flex-shrink-0 font-mono">₹{item.discountPrice || item.price}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 font-extrabold text-slate-800 transition-all appearance-none cursor-pointer"
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
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
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
