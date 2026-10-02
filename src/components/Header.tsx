import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MapPin, PhoneCall, Phone, ShoppingCart, User, Menu, X,
  Building, LogIn, LogOut, ClipboardList, AlertCircle, ChevronDown,
  ChevronRight, MessageSquareWarning, CheckCircle2, Loader2, Stethoscope,
  Activity, HeartPulse, ShieldCheck
} from 'lucide-react';
import { CartItem, PatientComplaint } from '../types';
import { useAuth } from '../lib/auth.ts';
import PatientBookingsModal from './PatientBookingsModal.tsx';
import logoImg from '../../logo.jpeg';
import { getAllBranches, getBranchInfo } from '../config/branchConfig.ts';

interface HeaderProps {
  currentTab: 'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings' | 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us';
  setCurrentTab: (tab: 'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings' | 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us') => void;
  cart: CartItem[];
  openCart: () => void;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchFocus: () => void;
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

export default function Header({
  currentTab,
  setCurrentTab,
  cart,
  openCart,
  selectedBranch,
  setSelectedBranch,
  searchQuery,
  setSearchQuery,
  onSearchFocus,
  centers = []
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { user, idToken, loginWithGoogle, logout } = useAuth();

  // Multi-level Dropdown menu states for Services & Health Packages
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [packagesSubDropdownOpen, setPackagesSubDropdownOpen] = useState(false);

  // Mobile accordion expand states
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobilePackagesOpen, setMobilePackagesOpen] = useState(false);

  // Complaint modal state
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<PatientComplaint | null>(null);
  const [modalTab, setModalTab] = useState<'file' | 'track'>('file');
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

  const servicesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoginModalOpen) {
      setLoginError('');
    }
  }, [isLoginModalOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target as Node)) {
        setServicesDropdownOpen(false);
        setPackagesSubDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const branchList = getAllBranches(centers);
  const currentBranchInfo = getBranchInfo(selectedBranch, centers);

  const handleTabClick = (tab: 'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings' | 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us') => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    setPackagesSubDropdownOpen(false);
  };

  const handleLocateUs = () => {
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    // Scroll smoothly to footer centers list or main footer
    const footerEl = document.getElementById('main-footer');
    if (footerEl) {
      footerEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleTabClick('contact-us');
    }
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <header className="sticky top-0 z-50 bg-[#2D006B] border-b border-[#220052] shadow-lg text-white" id="main-header">
      {/* Top Banner Contact/Info - Hidden on mobile */}
      <div className="hidden md:flex bg-[#1A0040] text-slate-200 py-1.5 px-4 text-xs font-medium justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            NABL Accredited & Certified Labs
          </span>
          <span className="hidden md:flex items-center gap-1 text-slate-300 font-serif italic text-[11px]">
            Serving 2 Crore+ Indians with 100% Reliable Reports
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href={`tel:${currentBranchInfo.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
            <PhoneCall className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="font-bold text-red-200">Call: {currentBranchInfo.phone}</span>
          </a>
        </div>
      </div>

      {/* DESKTOP HEADER ROW 1: Logo + Branch + Search + User Actions */}
      <div className="hidden lg:block max-w-[1400px] mx-auto px-4 md:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none flex-shrink-0"
          >
            <img src={logoImg} alt="AssurX Diagnostics" className="h-9 w-auto rounded-lg object-contain bg-white/95 px-1.5 py-0.5" />
            <div className="border-l border-white/30 h-5 pl-2.5">
              <span className="text-[9px] font-black text-[#80CBC4] tracking-widest uppercase block leading-none">Scans & Labs</span>
            </div>
          </div>

          {/* Branch Selector */}
          <div className="relative flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-2.5 py-1 hover:bg-white/15 transition-colors flex-shrink-0">
            <Building className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-0.5"
            >
              {branchList.map((branch) => (
                <option key={branch.code} value={branch.code} className="text-slate-800 bg-white">
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-[220px] xl:max-w-[280px] relative flex-shrink-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-white/60" />
            </div>
            <input
              type="text"
              placeholder="Search Tests (MRI, CBC, etc)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={onSearchFocus}
              className="w-full pl-8 pr-3 py-1.5 border border-white/20 rounded-full text-xs bg-white/10 hover:bg-white/15 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#80CBC4]/25 focus:border-[#80CBC4] transition-all placeholder:text-white/60 text-white font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-white/70 hover:text-white text-[11px] font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right Action Controls (Auth, Admin, Call, Cart) */}
          <div className="flex items-center gap-2 xl:gap-2.5 flex-shrink-0">
            {/* User Auth controls */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full py-1 px-2.5 flex-shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    referrerPolicy="no-referrer"
                    className="w-5.5 h-5.5 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-5.5 h-5.5 rounded-full bg-red-600 text-white font-black text-[9.5px] flex items-center justify-center">
                    {user.email?.[0].toUpperCase() || "U"}
                  </div>
                )}
                <span className="text-[10px] font-bold text-white max-w-[85px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={logout}
                  className="p-0.5 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-colors cursor-pointer"
                  title="Logout Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleTabClick('bookings')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 hover:bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs flex-shrink-0 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 text-white" />
                <span>Sign In</span>
              </button>
            )}

            {/* Admin Panel Button */}
            <button
              onClick={() => handleTabClick('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${currentTab === 'admin'
                ? 'bg-white text-[#2D006B] shadow-md hover:bg-white/95'
                : 'bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-900/10'
                }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>

            {/* Call Us Button */}
            <a
              href="tel:+919830678387"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#AD1457] hover:bg-[#C2185B] text-white rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex-shrink-0 whitespace-nowrap"
              title="Call AssurX Now"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Us</span>
            </a>

            {/* Cart Trigger */}
            <button
              onClick={openCart}
              className="relative flex items-center justify-center p-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer flex-shrink-0"
              id="cart-trigger-btn"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-scale-in">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP ROW 2: MAIN NAVIGATION BAR (Exact Format from Image) */}
      <div className="hidden lg:block bg-[#1D0048] border-t border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-1 xl:gap-2.5 text-xs font-bold uppercase tracking-wider text-white">
            {/* 1. HOME */}
            <button
              onClick={() => handleTabClick('home')}
              className={`px-3.5 py-2.5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${currentTab === 'home' ? 'border-red-500 text-white font-black bg-white/10' : 'border-transparent text-white/90'}`}
            >
              HOME
            </button>

            {/* 2. SERVICES (With multi-level dropdown suboptions) */}
            <div
              className="relative"
              ref={servicesMenuRef}
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => {
                setServicesDropdownOpen(false);
                setPackagesSubDropdownOpen(false);
              }}
            >
              <button
                onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                className={`px-3.5 py-2.5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap border-b-2 flex items-center gap-1.5 ${currentTab === 'scans' || currentTab === 'labs' || currentTab === 'packages' ? 'border-red-500 text-white font-black bg-white/10' : 'border-transparent text-white/90'}`}
              >
                <span>SERVICES</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesDropdownOpen ? 'rotate-180 text-red-400' : 'text-white/70'}`} />
              </button>

              {/* LEVEL 1 SUBOPTION DROPDOWN MENU */}
              {servicesDropdownOpen && (
                <div className="absolute left-0 top-full mt-0 w-64 bg-[#26005E] border border-white/20 rounded-b-2xl shadow-2xl z-50 py-2 divide-y divide-white/10 animate-fade-in text-left">

                  {/* SUBOPTION 1: PATHOLOGY */}
                  <button
                    onClick={() => handleTabClick('labs')}
                    className="w-full px-4 py-2.5 text-left hover:bg-white/15 transition-all flex items-center justify-between text-xs font-bold text-white tracking-wider cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 group-hover:scale-125 transition-transform"></span>
                      <span>PATHOLOGY</span>
                    </div>
                    <span className="text-[9px] bg-red-600/60 text-white px-1.5 py-0.5 rounded font-mono">Blood & Labs</span>
                  </button>

                  {/* SUBOPTION 2: 2D- ECHO */}
                  <button
                    onClick={() => handleTabClick('scans')}
                    className="w-full px-4 py-2.5 text-left hover:bg-white/15 transition-all flex items-center justify-between text-xs font-bold text-white tracking-wider cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#80CBC4] group-hover:scale-125 transition-transform"></span>
                      <span>2D- ECHO</span>
                    </div>
                    <span className="text-[9px] bg-emerald-600/60 text-white px-1.5 py-0.5 rounded font-mono">Cardiac USG</span>
                  </button>

                  {/* SUBOPTION 3: CONSULTATION */}
                  <button
                    onClick={() => handleTabClick('contact-us')}
                    className="w-full px-4 py-2.5 text-left hover:bg-white/15 transition-all flex items-center justify-between text-xs font-bold text-white tracking-wider cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform"></span>
                      <span>CONSULTATION</span>
                    </div>
                    <span className="text-[9px] bg-amber-600/60 text-white px-1.5 py-0.5 rounded font-mono">MD Doctor</span>
                  </button>

                  {/* SUBOPTION 4: ECG TEST */}
                  <button
                    onClick={() => handleTabClick('scans')}
                    className="w-full px-4 py-2.5 text-left hover:bg-white/15 transition-all flex items-center justify-between text-xs font-bold text-white tracking-wider cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform"></span>
                      <span>ECG TEST</span>
                    </div>
                    <span className="text-[9px] bg-blue-600/60 text-white px-1.5 py-0.5 rounded font-mono">Heart Scan</span>
                  </button>

                  {/* SUBOPTION 5: HEALTH PACKAGES (With LEVEL 2 SUBOPTION Flyout) */}
                  <div
                    className="relative"
                    onMouseEnter={() => setPackagesSubDropdownOpen(true)}
                    onMouseLeave={() => setPackagesSubDropdownOpen(false)}
                  >
                    <button
                      onClick={() => handleTabClick('packages')}
                      className="w-full px-4 py-2.5 text-left hover:bg-white/15 transition-all flex items-center justify-between text-xs font-bold text-white tracking-wider cursor-pointer group bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 group-hover:scale-125 transition-transform"></span>
                        <span>HEALTH PACKAGES</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-300 font-black">
                        <span className="text-[8px] bg-red-600 px-1 py-0.5 rounded uppercase">SUBOPTION</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${packagesSubDropdownOpen ? 'translate-x-1' : ''}`} />
                      </div>
                    </button>

                    {/* LEVEL 2 SUBOPTION FLYOUT (WOMEN, GENERAL, SENIORS HEALTH) */}
                    {packagesSubDropdownOpen && (
                      <div className="absolute left-full top-0 ml-0.5 w-60 bg-[#1D0048] border border-white/20 rounded-r-2xl shadow-2xl z-50 py-2 space-y-1 animate-fade-in text-left">
                        <div className="px-3 py-1 text-[9px] font-black text-[#80CBC4] uppercase tracking-widest border-b border-white/10">
                          Package Categories
                        </div>
                        <button
                          onClick={() => handleTabClick('packages')}
                          className="w-full px-4 py-2 text-left hover:bg-white/15 transition-all text-xs font-bold text-white/90 hover:text-white flex items-center gap-2 cursor-pointer"
                        >
                          <span className="text-pink-400">♥</span>
                          <span>WOMEN HEALTH</span>
                        </button>
                        <button
                          onClick={() => handleTabClick('packages')}
                          className="w-full px-4 py-2 text-left hover:bg-white/15 transition-all text-xs font-bold text-white/90 hover:text-white flex items-center gap-2 cursor-pointer"
                        >
                          <span className="text-teal-400">✚</span>
                          <span>GENERAL HEALTH</span>
                        </button>
                        <button
                          onClick={() => handleTabClick('packages')}
                          className="w-full px-4 py-2 text-left hover:bg-white/15 transition-all text-xs font-bold text-white/90 hover:text-white flex items-center gap-2 cursor-pointer"
                        >
                          <span className="text-amber-400">★</span>
                          <span>SENIORS HEALTH</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* 3. MY BOOKINGS */}
            <button
              onClick={() => handleTabClick('bookings')}
              className={`px-3.5 py-2.5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${currentTab === 'bookings' ? 'border-red-500 text-white font-black bg-white/10' : 'border-transparent text-white/90'}`}
            >
              MY BOOKINGS
            </button>

            {/* 4. ABOUT US */}
            <button
              onClick={() => handleTabClick('about-us')}
              className={`px-3.5 py-2.5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${currentTab === 'about-us' ? 'border-red-500 text-white font-black bg-white/10' : 'border-transparent text-white/90'}`}
            >
              ABOUT US
            </button>

            {/* 5. CORPORATE TEST */}
            <button
              onClick={() => handleTabClick('contact-us')}
              className={`px-3.5 py-2.5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${currentTab === 'contact-us' ? 'border-red-500 text-white font-black bg-white/10' : 'border-transparent text-white/90'}`}
            >
              CORPORATE TEST
            </button>

            {/* 6. CONTACT US */}
            <button
              onClick={() => handleTabClick('contact-us')}
              className={`px-3.5 py-2.5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${currentTab === 'contact-us' ? 'border-red-500 text-white font-black bg-white/10' : 'border-transparent text-white/90'}`}
            >
              CONTACT US
            </button>

            {/* 7. LOCATE US */}
            <button
              onClick={handleLocateUs}
              className="px-3.5 py-2.5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap border-b-2 border-transparent text-white/90 hover:text-white"
            >
              LOCATE US
            </button>

            {/* 8. CAREERS */}
            <button
              onClick={() => handleTabClick('hiring')}
              className={`px-3.5 py-2.5 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${currentTab === 'hiring' ? 'border-red-500 text-white font-black bg-white/10' : 'border-transparent text-white/90'}`}
            >
              CAREERS
            </button>

            {/* 9. COMPLAIN REGISTRATION */}
            <button
              onClick={() => setIsComplaintOpen(true)}
              className="px-3.5 py-2.5 hover:bg-red-600/80 bg-red-600 text-white font-black transition-colors cursor-pointer whitespace-nowrap rounded-t-lg ml-auto flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              <span>COMPLAIN REGISTRATION</span>
            </button>
          </nav>
        </div>
      </div>

      {/* MOBILE HEADER BAR */}
      <div className="lg:hidden flex flex-col w-full bg-[#2D006B] border-b border-[#220052] text-white shadow-md">
        {/* Row 1: Logo + Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img src={logoImg} alt="AssurX Diagnostics" className="h-8.5 w-auto rounded-lg object-contain bg-white/95 px-1 py-0.5" />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Admin Console Button - Always visible on mobile */}
            <button
              onClick={() => handleTabClick('admin')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${currentTab === 'admin'
                ? 'bg-white text-[#2D006B] shadow-md'
                : 'bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-900/10'
                }`}
              title="Admin Console"
            >
              <User className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
            <a
              href="tel:+919830678387"
              className="p-1.5 rounded-full bg-[#AD1457] text-white shadow-md"
              title="Call AssurX"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={openCart}
              className="relative p-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Row 2: Search & Branch input */}
        <div className="px-3 py-2 bg-[#1A0040]">
          <div className="flex items-center bg-white/10 border border-white/20 rounded-full p-1 divide-x divide-white/20 shadow-inner">
            <div className="flex items-center gap-1 pl-2 pr-1.5 py-0.5 max-w-[110px] flex-shrink-0">
              <MapPin className="w-3 h-3 text-white flex-shrink-0 animate-pulse" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-[10px] font-extrabold text-white focus:outline-none cursor-pointer pr-1 truncate w-full"
              >
                {branchList.map((branch) => (
                  <option key={branch.code} value={branch.code} className="text-slate-800 bg-white">
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 relative flex items-center pl-2">
              <input
                type="text"
                placeholder="Search Tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={onSearchFocus}
                className="w-full bg-transparent text-[11px] font-semibold text-white placeholder:text-white/60 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="pr-2 text-white/70 hover:text-white text-[10px] font-bold"
                >
                  Clear
                </button>
              ) : (
                <div className="pr-2 text-white/60">
                  <Search className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER NAVIGATION MENU (Formatted exact to user screenshot) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#220052]/98 backdrop-blur-md border-t border-white/10 shadow-2xl absolute w-full left-0 py-4 px-5 space-y-2 flex flex-col z-40 animate-fade-in text-left text-white max-h-[85vh] overflow-y-auto">

          {/* 1. HOME */}
          <button
            onClick={() => handleTabClick('home')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 text-left ${currentTab === 'home' ? 'text-red-400 pl-2 border-l-2 border-red-500' : 'text-white/90 hover:text-white'}`}
          >
            HOME
          </button>

          {/* 2. SERVICES (ACCORDION WITH SUBOPTIONS) */}
          <div className="border-b border-white/10 py-1">
            <button
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="w-full py-1.5 text-xs font-black uppercase tracking-wider flex items-center justify-between text-left text-white/90 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <span>SERVICES</span>
                <span className="text-[8px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded">SUBOPTIONS</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? 'rotate-180 text-red-400' : ''}`} />
            </button>

            {mobileServicesOpen && (
              <div className="pl-3 py-2 space-y-2 border-l-2 border-red-500/50 mt-1 bg-white/5 rounded-r-xl">
                <button
                  onClick={() => handleTabClick('labs')}
                  className="w-full text-left py-1.5 text-xs font-bold text-white/90 hover:text-white flex items-center justify-between pr-2"
                >
                  <span>● PATHOLOGY</span>
                  <span className="text-[9px] text-red-300">Labs</span>
                </button>
                <button
                  onClick={() => handleTabClick('scans')}
                  className="w-full text-left py-1.5 text-xs font-bold text-white/90 hover:text-white flex items-center justify-between pr-2"
                >
                  <span>● 2D- ECHO</span>
                  <span className="text-[9px] text-emerald-300">Cardiac</span>
                </button>
                <button
                  onClick={() => handleTabClick('contact-us')}
                  className="w-full text-left py-1.5 text-xs font-bold text-white/90 hover:text-white flex items-center justify-between pr-2"
                >
                  <span>● CONSULTATION</span>
                  <span className="text-[9px] text-amber-300">Doctor</span>
                </button>
                <button
                  onClick={() => handleTabClick('scans')}
                  className="w-full text-left py-1.5 text-xs font-bold text-white/90 hover:text-white flex items-center justify-between pr-2"
                >
                  <span>● ECG TEST</span>
                  <span className="text-[9px] text-blue-300">Heart</span>
                </button>

                {/* HEALTH PACKAGES SUBOPTION ACCORDION */}
                <div className="pt-1">
                  <button
                    onClick={() => setMobilePackagesOpen(!mobilePackagesOpen)}
                    className="w-full text-left py-1.5 text-xs font-black text-white/90 hover:text-white flex items-center justify-between pr-2 bg-white/5 px-2 rounded-lg"
                  >
                    <span>● HEALTH PACKAGES</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobilePackagesOpen ? 'rotate-180 text-red-400' : ''}`} />
                  </button>

                  {mobilePackagesOpen && (
                    <div className="pl-4 py-2 space-y-1.5 border-l border-red-400/40 mt-1">
                      <button
                        onClick={() => handleTabClick('packages')}
                        className="w-full text-left py-1 text-[11px] font-bold text-pink-300"
                      >
                        ▸ WOMEN HEALTH
                      </button>
                      <button
                        onClick={() => handleTabClick('packages')}
                        className="w-full text-left py-1 text-[11px] font-bold text-teal-300"
                      >
                        ▸ GENERAL HEALTH
                      </button>
                      <button
                        onClick={() => handleTabClick('packages')}
                        className="w-full text-left py-1 text-[11px] font-bold text-amber-300"
                      >
                        ▸ SENIORS HEALTH
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. MY BOOKINGS */}
          <button
            onClick={() => handleTabClick('bookings')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 text-left ${currentTab === 'bookings' ? 'text-red-400 pl-2 border-l-2 border-red-500' : 'text-white/90 hover:text-white'}`}
          >
            MY BOOKINGS
          </button>

          {/* 4. ABOUT US */}
          <button
            onClick={() => handleTabClick('about-us')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 text-left ${currentTab === 'about-us' ? 'text-red-400 pl-2 border-l-2 border-red-500' : 'text-white/90 hover:text-white'}`}
          >
            ABOUT US
          </button>

          {/* 5. CORPORATE TEST */}
          <button
            onClick={() => handleTabClick('contact-us')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 text-left ${currentTab === 'contact-us' ? 'text-red-400 pl-2 border-l-2 border-red-500' : 'text-white/90 hover:text-white'}`}
          >
            CORPORATE TEST
          </button>

          {/* 6. CONTACT US */}
          <button
            onClick={() => handleTabClick('contact-us')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 text-left ${currentTab === 'contact-us' ? 'text-red-400 pl-2 border-l-2 border-red-500' : 'text-white/90 hover:text-white'}`}
          >
            CONTACT US
          </button>

          {/* 7. LOCATE US */}
          <button
            onClick={handleLocateUs}
            className="py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 text-left text-white/90 hover:text-white"
          >
            LOCATE US
          </button>

          {/* 8. CAREERS */}
          <button
            onClick={() => handleTabClick('hiring')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 text-left ${currentTab === 'hiring' ? 'text-red-400 pl-2 border-l-2 border-red-500' : 'text-white/90 hover:text-white'}`}
          >
            CAREERS
          </button>

          {/* 9. COMPLAIN REGISTRATION */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsComplaintOpen(true);
            }}
            className="py-2.5 text-xs font-black uppercase tracking-wider text-left bg-red-600 text-white rounded-xl px-3 flex items-center justify-between mt-1 shadow-md"
          >
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4" />
              <span>COMPLAIN REGISTRATION</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* User Account Login in mobile drawer */}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 px-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center">
                      {user.email?.[0].toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-white/60 font-semibold">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleTabClick('admin');
                  }}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleTabClick('bookings');
                }}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span>Patient Sign In</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* PATIENT BOOKINGS MODAL */}
      <PatientBookingsModal
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
        idToken={idToken}
        userEmail={user?.email || undefined}
      />

      {/* --- PATIENT COMPLAIN REGISTRATION MODAL --- */}
      {isComplaintOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2D006B] via-[#4A1A8A] to-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <MessageSquareWarning className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-serif">Complain Registration Portal</h3>
                  <p className="text-[10px] text-white/70">We resolve patient issues with top priority</p>
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
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${modalTab === 'file'
                    ? 'text-[#2D006B] border-b-2 border-[#2D006B] bg-purple-50/50'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                  Register New Complaint
                </button>
                <button
                  onClick={() => setModalTab('track')}
                  className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${modalTab === 'track'
                    ? 'text-[#2D006B] border-b-2 border-[#2D006B] bg-purple-50/50'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Track Status
                </button>
              </div>
            )}

            {/* TRACK TAB */}
            {modalTab === 'track' && !complaintSubmitted && (
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto text-left">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enter Registered Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      maxLength={10}
                      value={trackPhone}
                      onChange={e => setTrackPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#2D006B] transition-all bg-slate-50/50"
                      onKeyDown={e => { if (e.key === 'Enter') handleTrackComplaints(); }}
                    />
                    <button
                      type="button"
                      onClick={handleTrackComplaints}
                      disabled={trackPhone.length !== 10}
                      className="px-4 py-2.5 bg-[#2D006B] hover:bg-[#1D0048] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Search
                    </button>
                  </div>
                  {trackPhone.length > 0 && trackPhone.length < 10 && (
                    <p className="text-[9px] text-rose-500 font-semibold">{trackPhone.length}/10 digits entered</p>
                  )}
                </div>

                {hasSearched && (
                  <div className="space-y-4">
                    {trackedComplaints.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-2">
                          <MessageSquareWarning className="w-5 h-5 text-slate-300" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-400">No Complaints Found</h4>
                        <p className="text-[10px] text-slate-400 mt-1">No complaints found for mobile number {trackPhone}.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {trackedComplaints.map((c) => (
                          <div key={c.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5">
                            <div className="flex justify-between items-start">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${statusColors[c.status]}`}>
                                {statusLabels[c.status]}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">{c.id}</span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-800">{c.subject}</h5>
                            <p className="text-[10.5px] text-slate-600 line-clamp-2">{c.description}</p>
                            <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-200 flex justify-between">
                              <span>Branch: {c.branch}</span>
                              <span>{new Date(c.timestamp).toLocaleDateString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FILE COMPLAINT TAB */}
            {modalTab === 'file' && complaintSubmitted && submittedComplaint ? (
              <div className="p-8 text-center space-y-4 text-left">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <div className="text-center">
                  <h4 className="text-base font-bold text-slate-900 font-serif">Complaint Registered</h4>
                  <p className="text-xs text-slate-500 mt-1">Ticket ID: <strong className="text-[#2D006B] font-mono">{submittedComplaint.id}</strong></p>
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed text-center">
                  Our patient support officer will get in touch with you at <strong>{submittedComplaint.phone}</strong> within 24 hours.
                </p>
                <div className="text-center pt-2">
                  <button
                    onClick={resetComplaintForm}
                    className="px-6 py-2 bg-[#2D006B] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1D0048] transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : modalTab === 'file' && !complaintSubmitted ? (
              <form onSubmit={handleComplaintSubmit} className="p-5 space-y-3.5 max-h-[65vh] overflow-y-auto text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Patient Name *</label>
                    <input
                      type="text"
                      required
                      value={complaintForm.patientName}
                      onChange={e => setComplaintForm(f => ({ ...f, patientName: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#2D006B] transition-all bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={complaintForm.phone}
                      onChange={e => setComplaintForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#2D006B] transition-all bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch *</label>
                    <select
                      required
                      value={complaintForm.branch}
                      onChange={e => setComplaintForm(f => ({ ...f, branch: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#2D006B] transition-all bg-slate-50/50 cursor-pointer"
                    >
                      <option value="">Select Branch</option>
                      {branchList.map((b, i) => (
                        <option key={i} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                    <select
                      required
                      value={complaintForm.category}
                      onChange={e => setComplaintForm(f => ({ ...f, category: e.target.value as PatientComplaint['category'] }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#2D006B] transition-all bg-slate-50/50 cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {COMPLAINT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.subject}
                    onChange={e => setComplaintForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief summary of complaint"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#2D006B] transition-all bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detailed Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={complaintForm.description}
                    onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe your concern or issue in detail..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#2D006B] transition-all bg-slate-50/50 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
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
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-60 flex items-center gap-1.5"
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

      {/* --- SIGN IN OPTIONS MODAL --- */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-left animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black text-[#2D006B] tracking-widest uppercase block">SECURE PATIENT ACCESS</span>
                <h3 className="text-lg font-serif font-bold text-slate-900">Sign In to AssurX</h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Access your personalized diagnostics console, monitor active lab reports, view order timelines, and securely download certified medical records.
            </p>

            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-150 rounded-2xl text-left space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Google Sign-In Blocked/Failed</span>
                </div>
                <p className="text-[10.5px] text-red-650 leading-relaxed font-semibold">
                  {loginError}. Browser security settings often block pop-up windows inside sandboxed iframes. Please try again or close to explore.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={async () => {
                  setLoginError('');
                  try {
                    await loginWithGoogle();
                    setIsLoginModalOpen(false);
                  } catch (err: any) {
                    console.error("Google sign in failed:", err);
                    setLoginError(err.message || String(err));
                  }
                }}
                className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2.5 shadow-xs hover:border-slate-350 transition-all cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Continue with Google Account</span>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-all underline cursor-pointer"
              >
                Close and explore guest mode
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

