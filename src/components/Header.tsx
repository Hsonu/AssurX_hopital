import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, PhoneCall, Phone, ShoppingCart, User, Menu, X, Landmark, Building, LogIn, LogOut, ClipboardList, ShieldCheck, Sparkles, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { CartItem } from '../types';
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
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [healthPackagesOpen, setHealthPackagesOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { user, idToken, loginWithGoogle, logout } = useAuth();

  const menuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoginModalOpen) {
      setLoginError('');
    }
  }, [isLoginModalOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMainMenuOpen(false);
        setServicesOpen(false);
        setHealthPackagesOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const branchList = getAllBranches(centers);
  const currentBranchInfo = getBranchInfo(selectedBranch, centers);

  const handleTabClick = (tab: 'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings' | 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us') => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    setMainMenuOpen(false);
    setServicesOpen(false);
    setHealthPackagesOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#2D006B] border-b border-[#220052] shadow-md text-white" id="main-header">
      {/* Top Banner — ISO Certification Bar */}
      <div className="hidden md:flex bg-[#1A0040] text-slate-200 py-1.5 px-4 text-xs font-medium justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            ISO 9001 CERTIFIED DIAGNOSTIC CHAIN
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold tracking-wider uppercase text-[#80CBC4]">BEST IN QUALITY BUT AFFORDABLE ON PRICE</span>
        </div>
      </div>

      {/* DESKTOP HEADER (Single Row Original UI Layout - Compact & Zero Overflow) */}
      <div className="hidden lg:block max-w-[1400px] mx-auto px-4 md:px-6 py-3">
        {/* Row 1: Logo + Branch + Search + Nav + Actions */}
        <div className="flex items-center justify-between gap-2.5 xl:gap-3.5">
          {/* Logo */}
          <div
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none flex-shrink-0"
          >
            <img src={logoImg} alt="AssurX Diagnostics" className="h-9 w-auto rounded-lg object-contain bg-white/95 px-1.5 py-0.5" />
            <div className="border-l border-white/30 h-5 pl-2.5">
              <span className="text-[9px] font-bold text-[#80CBC4] tracking-widest uppercase block leading-none">Scans & Labs</span>
            </div>
          </div>

          {/* Hamburger Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                setMainMenuOpen(!mainMenuOpen);
                if (mainMenuOpen) { setServicesOpen(false); setHealthPackagesOpen(false); }
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer flex-shrink-0"
              title="Menu"
            >
              {mainMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Dropdown Navigation Menu */}
            {mainMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A0040] border border-[#220052] rounded-xl shadow-2xl z-50 py-2 animate-fade-in">
                <button onClick={() => handleTabClick('home')} className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer ${currentTab === 'home' ? 'text-[#80CBC4] bg-white/5' : 'text-white/90'}`}>HOME</button>

                {/* SERVICES with sub-dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setServicesOpen(!servicesOpen); setHealthPackagesOpen(false); }}
                    className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between ${['scans', 'labs'].includes(currentTab) ? 'text-[#80CBC4] bg-white/5' : 'text-white/90'}`}
                  >
                    <span>SERVICES</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {servicesOpen && (
                    <div className="absolute left-full top-0 ml-1 w-56 bg-[#1A0040] border border-[#220052] rounded-xl shadow-2xl z-50 py-2 animate-fade-in">
                      <button onClick={() => handleTabClick('labs')} className="w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 hover:text-[#80CBC4] transition-colors cursor-pointer">PATHOLOGY</button>
                      <button onClick={() => handleTabClick('scans')} className="w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 hover:text-[#80CBC4] transition-colors cursor-pointer">2D- ECHO</button>
                      <button onClick={() => handleTabClick('scans')} className="w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 hover:text-[#80CBC4] transition-colors cursor-pointer">CONSULTATION</button>
                      <button onClick={() => handleTabClick('scans')} className="w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 hover:text-[#80CBC4] transition-colors cursor-pointer">ECG TEST</button>

                      {/* HEALTH PACKAGES sub-dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setHealthPackagesOpen(!healthPackagesOpen)}
                          className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between ${currentTab === 'packages' ? 'text-[#80CBC4] bg-white/5' : 'text-white/90'}`}
                        >
                          <span>HEALTH PACKAGES</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${healthPackagesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {healthPackagesOpen && (
                          <div className="bg-[#220052]/60 border-t border-[#220052] py-1 animate-fade-in">
                            <button onClick={() => handleTabClick('packages')} className="w-full text-left px-8 py-2 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-[#80CBC4] transition-colors cursor-pointer">WOMEN HEALTH</button>
                            <button onClick={() => handleTabClick('packages')} className="w-full text-left px-8 py-2 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-[#80CBC4] transition-colors cursor-pointer">GENERAL HEALTH</button>
                            <button onClick={() => handleTabClick('packages')} className="w-full text-left px-8 py-2 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 hover:text-[#80CBC4] transition-colors cursor-pointer">SENIORS HEALTH</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => handleTabClick('bookings')} className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer ${currentTab === 'bookings' ? 'text-[#80CBC4] bg-white/5' : 'text-white/90'}`}>MY BOOKINGS</button>
                <button onClick={() => handleTabClick('about-us')} className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer ${currentTab === 'about-us' ? 'text-[#80CBC4] bg-white/5' : 'text-white/90'}`}>ABOUT US</button>
                <button onClick={() => handleTabClick('labs')} className="w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 transition-colors cursor-pointer">CORPORATE TEST</button>
                <button onClick={() => handleTabClick('contact-us')} className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer ${currentTab === 'contact-us' ? 'text-[#80CBC4] bg-white/5' : 'text-white/90'}`}>CONTACT US</button>
                <button onClick={() => handleTabClick('contact-us')} className="w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 transition-colors cursor-pointer">LOCATE US</button>
                <button onClick={() => handleTabClick('hiring')} className={`w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer ${currentTab === 'hiring' ? 'text-[#80CBC4] bg-white/5' : 'text-white/90'}`}>CAREERS</button>
                <button onClick={() => handleTabClick('contact-us')} className="w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 transition-colors cursor-pointer">COMPLAIN REGISTRATION</button>
              </div>
            )}
          </div>

          {/* Branch / Location Selector — Red Pill */}
          <div className="relative flex items-center gap-1.5 bg-red-600 hover:bg-red-500 rounded-full px-3 py-1.5 transition-colors flex-shrink-0 cursor-pointer shadow-md">
            <MapPin className="w-4 h-4 text-white flex-shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 appearance-none"
            >
              {branchList.map((branch) => (
                <option key={branch.code} value={branch.code} className="text-slate-800 bg-white">
                  {branch.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-white/80 flex-shrink-0" />
          </div>

          {/* Search Bar — White background */}
          <div className="flex-1 max-w-[280px] xl:max-w-[380px] relative">
            <div className="flex items-center bg-white rounded-full overflow-hidden shadow-md">
              <div className="pl-3 pr-2 flex items-center">
                <Search className="h-4 w-4 text-[#2D006B]" />
              </div>
              <input
                type="text"
                placeholder="Search Your Test Here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={onSearchFocus}
                className="w-full pr-3 py-2 text-xs font-semibold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="pr-3 flex items-center text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls (Cart, User, Admin, Trust Badge) */}
          <div className="flex items-center gap-2 xl:gap-2.5 flex-shrink-0">
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

            {/* User Profile Icon / Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => {
                  if (user) {
                    setUserDropdownOpen(!userDropdownOpen);
                  } else {
                    handleTabClick('bookings');
                  }
                }}
                className="flex items-center justify-center p-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                title={user ? (user.displayName || 'Profile') : 'Sign In'}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1A0040] border border-[#220052] rounded-xl shadow-2xl z-50 py-2 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-[#220052] text-xs font-bold text-[#80CBC4] uppercase tracking-wider">
                    {user.displayName || user.email?.split('@')[0] || 'USER'}
                  </div>
                  <button onClick={() => { setUserDropdownOpen(false); handleTabClick('bookings'); }} className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 hover:text-[#80CBC4] transition-colors cursor-pointer">EDIT PROFILE</button>
                  <button
                    onClick={() => { setUserDropdownOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-white/10 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    LOG OUT
                  </button>
                </div>
              )}
            </div>

            {/* Admin Icon with Label */}
            <button
              onClick={() => handleTabClick('admin')}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex-shrink-0 ${currentTab === 'admin'
                ? 'bg-white/15 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              title="Admin Console"
            >
              <User className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
            </button>

          </div>
        </div>
      </div>


      {/* MOBILE HEADER (Clean & optimized matching your screenshot) */}
      <div className="lg:hidden flex flex-col w-full bg-[#2D006B] border-b border-[#220052] text-white shadow-md">

        {/* Row 1: Logo + Actions */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
          {/* Brand Logo */}
          <div
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img src={logoImg} alt="AssurX Diagnostics" className="h-9 w-auto rounded-lg object-contain bg-white/95 px-1 py-0.5" />
          </div>

          {/* Right actions: CALL, CART, MENU */}
          <div className="flex items-center gap-2.5">
            {/* Call Us Icon */}
            <a
              href="tel:+919830678387"
              className="p-2 rounded-full bg-[#AD1457] text-white shadow-md"
              title="Call AssurX"
            >
              <Phone className="w-4 h-4" />
            </a>
            {/* Cart Icon */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-white"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Burger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </div>

        {/* Row 2: Premium blue bar with active test actions */}
        <div className="bg-[#1A0040] px-4 py-2 flex items-center justify-center gap-3">
          <button
            onClick={() => handleTabClick('labs')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider text-center rounded-lg transition-all ${currentTab === 'labs' || currentTab === 'scans' || currentTab === 'packages'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
              }`}
          >
            Book A Test
          </button>
          <button
            onClick={() => handleTabClick('admin')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider text-center rounded-lg transition-all ${currentTab === 'admin'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
              }`}
          >
            Admin Panel
          </button>
        </div>

        {/* Row 3: Double capsule for City & Search */}
        <div className="px-4 py-2.5 bg-[#220052]/80 border-b border-[#1A0040]/30">
          <div className="flex items-center bg-white/10 border border-white/20 rounded-full p-1 divide-x divide-white/20 shadow-inner">
            {/* City Selector */}
            <div className="flex items-center gap-1 pl-2.5 pr-2 py-1 max-w-[120px] flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-white flex-shrink-0 animate-pulse" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-[11px] font-extrabold text-white focus:outline-none cursor-pointer pr-1 truncate w-full"
              >
                {branchList.map((branch) => (
                  <option key={branch.code} value={branch.code} className="text-slate-800 bg-white">
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Compact Search input */}
            <div className="flex-1 relative flex items-center pl-3">
              <input
                type="text"
                placeholder="Search Tests (MRI, CBC, etc.)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={onSearchFocus}
                className="w-full bg-transparent text-[11px] font-semibold text-white placeholder:text-white/60 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="pr-2.5 text-white/70 hover:text-white text-[10px] font-bold"
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

      {/* Mobile Navigation Drawer Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#2D006B]/95 backdrop-blur-md border-t border-[#220052] shadow-2xl absolute w-full left-0 py-4 px-6 space-y-3.5 flex flex-col z-40 animate-fade-in text-left text-white">
          <button
            onClick={() => handleTabClick('home')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 ${currentTab === 'home' ? 'text-white pl-2 border-l-2 border-red-500' : 'text-white/75 hover:text-white'}`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabClick('scans')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 ${currentTab === 'scans' ? 'text-white pl-2 border-l-2 border-red-500' : 'text-white/75 hover:text-white'}`}
          >
            Sonography & Scans Services
          </button>
          <button
            onClick={() => handleTabClick('labs')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 ${currentTab === 'labs' ? 'text-white pl-2 border-l-2 border-red-500' : 'text-white/75 hover:text-white'}`}
          >
            Blood & Lab Tests
          </button>
          <button
            onClick={() => handleTabClick('packages')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 ${currentTab === 'packages' ? 'text-white pl-2 border-l-2 border-red-500' : 'text-white/75 hover:text-white'}`}
          >
            Health Packages
          </button>
          <button
            onClick={() => handleTabClick('hiring')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 ${currentTab === 'hiring' ? 'text-white pl-2 border-l-2 border-red-500' : 'text-white/75 hover:text-white'}`}
          >
            Careers & Hiring
          </button>
          <button
            onClick={() => handleTabClick('bookings')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-white/10 ${currentTab === 'bookings' ? 'text-white pl-2 border-l-2 border-red-500' : 'text-white/75 hover:text-white'}`}
          >
            My Bookings
          </button>
          <button
            onClick={() => handleTabClick('admin')}
            className={`py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 ${currentTab === 'admin' ? 'text-white pl-2 border-l-2 border-red-500' : 'text-white/75 hover:text-white'}`}
          >
            <User className="w-4 h-4 text-white/70" />
            <span>Technician Console (Admin)</span>
          </button>

          {/* Mobile Login / User Profile option */}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
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
                    handleTabClick('bookings');
                  }}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer mb-2"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>My Bookings</span>
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
                <span>Patient Login</span>
              </button>
            )}
          </div>
        </div>
      )}

      <PatientBookingsModal
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
        idToken={idToken}
        userEmail={user?.email || undefined}
      />

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
              {/* Google Sign-in */}
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
                {/* Clean inline SVG for Google Icon */}
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
