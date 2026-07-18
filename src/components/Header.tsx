import React, { useState, useEffect } from 'react';
import { Search, MapPin, PhoneCall, ShoppingCart, User, Menu, X, Landmark, Building, LogIn, LogOut, ClipboardList, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';
import { useAuth } from '../lib/auth.ts';
import PatientBookingsModal from './PatientBookingsModal.tsx';

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
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { user, idToken, loginWithGoogle, logout } = useAuth();

  useEffect(() => {
    if (!isLoginModalOpen) {
      setLoginError('');
    }
  }, [isLoginModalOpen]);
  const branches = centers.length > 0 ? centers.map(c => c.city) : ['Malad', 'Goregaon'];

  const handleTabClick = (tab: 'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings' | 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us') => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm" id="main-header">
      {/* Top Banner Contact/Info - Hidden on mobile to save space */}
      <div className="hidden md:flex bg-slate-900 text-slate-300 py-2 px-4 text-xs font-medium justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            NABL Accredited & Certified Labs
          </span>
          <span className="hidden md:flex items-center gap-1 text-slate-400 font-serif italic">
            Serving 2 Crore+ Indians with 100% Reliable Reports
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="tel:18001201100" className="flex items-center gap-1 hover:text-white transition-colors">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Emergency Toll-Free: +91 9830678387 </span>
          </a>
        </div>
      </div>

      {/* DESKTOP HEADER (Hidden on mobile) */}
      <div className="hidden lg:flex max-w-7xl mx-auto px-4 md:px-6 py-4 items-center justify-between gap-4">
        {/* Logo */}
        <div
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <span className="text-3xl font-serif italic font-bold tracking-tighter text-emerald-800">AssurX</span>
          <div className="border-l border-gray-250 h-5 pl-3">
            <span className="text-[9px] font-bold text-gray-500 tracking-widest uppercase block leading-none">Scans & Labs</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search scans (MRI, CT), blood tests or packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onSearchFocus}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all placeholder:text-slate-450 font-semibold"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-450 hover:text-slate-700 text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-4">
          {/* Branch Selector */}
          <div className="relative flex items-center gap-1.5 bg-slate-50 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-slate-100/70 transition-colors">
            <Building className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              {branches.map((branch) => (
                <option key={branch} value={branch} className="text-slate-800 bg-white">
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-500">
            <button
              onClick={() => handleTabClick('home')}
              className={`hover:text-emerald-700 transition-colors py-1 cursor-pointer ${currentTab === 'home' ? 'text-emerald-800 border-b-2 border-emerald-700 font-black' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => handleTabClick('scans')}
              className={`hover:text-emerald-700 transition-colors py-1 cursor-pointer ${currentTab === 'scans' ? 'text-emerald-800 border-b-2 border-emerald-700 font-black' : ''}`}
            >
              Scans
            </button>
            <button
              onClick={() => handleTabClick('labs')}
              className={`hover:text-emerald-700 transition-colors py-1 cursor-pointer ${currentTab === 'labs' ? 'text-emerald-800 border-b-2 border-emerald-700 font-black' : ''}`}
            >
              Labs
            </button>
            <button
              onClick={() => handleTabClick('packages')}
              className={`hover:text-emerald-700 transition-colors py-1 cursor-pointer ${currentTab === 'packages' ? 'text-emerald-800 border-b-2 border-emerald-700 font-black' : ''}`}
            >
              Packages
            </button>
            <button
              onClick={() => handleTabClick('bookings')}
              className={`hover:text-emerald-700 transition-colors py-1 cursor-pointer ${currentTab === 'bookings' ? 'text-emerald-800 border-b-2 border-emerald-700 font-black' : ''}`}
            >
              My Bookings
            </button>
            <button
              onClick={() => handleTabClick('hiring')}
              className={`hover:text-emerald-700 transition-colors py-1 cursor-pointer ${currentTab === 'hiring' ? 'text-emerald-800 border-b-2 border-emerald-700 font-black' : ''}`}
            >
              Careers
            </button>
          </nav>

          {/* User Auth controls */}
          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-full py-1 pl-1.5 pr-3.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-slate-100"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
              )}
              <div className="text-left hidden xl:block">
                <p className="text-[10px] font-black text-slate-800 truncate max-w-[100px] leading-none">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest block mt-0.5">Patient Account</span>
              </div>
              <button
                onClick={() => handleTabClick('bookings')}
                className="px-2.5 py-1.5 bg-emerald-750 hover:bg-emerald-850 text-white text-[9.5px] font-black uppercase tracking-wider rounded-full transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                title="View your diagnostic booking history and published reports"
              >
                <ClipboardList className="w-3 h-3" />
                <span>My Bookings</span>
              </button>
              <button
                onClick={logout}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                title="Logout Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleTabClick('bookings')}
              className="flex items-center gap-1.5 px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sign In</span>
            </button>
          )}

          {/* Admin Panel Button */}
          <button
            onClick={() => handleTabClick('admin')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${currentTab === 'admin'
                ? 'bg-emerald-950 text-white shadow-md'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100'
              }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={openCart}
            className="relative flex items-center justify-center p-2 rounded-full border border-gray-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            id="cart-trigger-btn"
          >
            <ShoppingCart className="w-4.5 h-4.5 text-slate-800" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-scale-in">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>


      {/* MOBILE HEADER (Clean & optimized matching your screenshot) */}
      <div className="lg:hidden flex flex-col w-full bg-white">

        {/* Row 1: Logo + Actions */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-50">
          {/* Brand Logo */}
          <div
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            {/* Green visual mark */}
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-serif italic font-black text-lg shadow-sm shadow-emerald-100">A</div>
            <span className="text-2xl font-serif italic font-bold tracking-tighter text-emerald-850">AssurX</span>
          </div>

          {/* Right actions: CART, MENU */}
          <div className="flex items-center gap-2.5">
            {/* Cart Icon */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-full border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-800"
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
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </div>

        {/* Row 2: Green Bar with "BOOK A TEST" and "REPORTS / ADMIN" */}
        <div className="bg-emerald-800 px-4 py-2 flex items-center justify-center gap-3">
          <button
            onClick={() => handleTabClick('labs')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider text-center rounded-lg transition-all ${currentTab === 'labs' || currentTab === 'scans' || currentTab === 'packages'
                ? 'bg-amber-400 text-slate-900 shadow-md'
                : 'bg-white text-emerald-900 hover:bg-slate-50'
              }`}
          >
            Book A Test
          </button>
          <button
            onClick={() => handleTabClick('admin')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider text-center rounded-lg transition-all ${currentTab === 'admin'
                ? 'bg-amber-400 text-slate-900 shadow-md'
                : 'bg-white text-emerald-900 hover:bg-slate-50'
              }`}
          >
            Admin Panel
          </button>
        </div>

        {/* Row 3: Double capsule for City & Search */}
        <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-150">
          <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 divide-x divide-slate-200 shadow-inner">
            {/* City Selector */}
            <div className="flex items-center gap-1 pl-2.5 pr-2 py-1 max-w-[120px] flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-[11px] font-extrabold text-slate-750 focus:outline-none cursor-pointer pr-1 truncate w-full"
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch} className="text-slate-800 bg-white">
                    {branch}
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
                className="w-full bg-transparent text-[11px] font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="pr-2.5 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                >
                  Clear
                </button>
              ) : (
                <div className="pr-2 text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Navigation Drawer Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-150 shadow-2xl absolute w-full left-0 py-4 px-6 space-y-3.5 flex flex-col z-40 animate-fade-in text-left">
          <button
            onClick={() => handleTabClick('home')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-slate-50 ${currentTab === 'home' ? 'text-emerald-700 pl-2 border-l-2 border-emerald-750' : 'text-slate-600'}`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabClick('scans')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-slate-50 ${currentTab === 'scans' ? 'text-emerald-700 pl-2 border-l-2 border-emerald-750' : 'text-slate-600'}`}
          >
            Scans & Imaging Services
          </button>
          <button
            onClick={() => handleTabClick('labs')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-slate-50 ${currentTab === 'labs' ? 'text-emerald-700 pl-2 border-l-2 border-emerald-750' : 'text-slate-600'}`}
          >
            Blood & Lab Tests
          </button>
          <button
            onClick={() => handleTabClick('packages')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-slate-50 ${currentTab === 'packages' ? 'text-emerald-700 pl-2 border-l-2 border-emerald-750' : 'text-slate-600'}`}
          >
            Health Packages
          </button>
          <button
            onClick={() => handleTabClick('hiring')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-slate-50 ${currentTab === 'hiring' ? 'text-emerald-700 pl-2 border-l-2 border-emerald-750' : 'text-slate-600'}`}
          >
            Careers & Hiring
          </button>
          <button
            onClick={() => handleTabClick('bookings')}
            className={`py-2 text-xs font-black uppercase tracking-wider border-b border-slate-50 ${currentTab === 'bookings' ? 'text-emerald-700 pl-2 border-l-2 border-emerald-750' : 'text-slate-600'}`}
          >
            My Bookings
          </button>
          <button
            onClick={() => handleTabClick('admin')}
            className={`py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 ${currentTab === 'admin' ? 'text-emerald-700 pl-2 border-l-2 border-emerald-750' : 'text-slate-650'}`}
          >
            <User className="w-4 h-4 text-emerald-750" />
            <span>Technician Console (Admin)</span>
          </button>

          {/* Mobile Login / User Profile option */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 px-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                      {user.email?.[0].toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleTabClick('bookings');
                  }}
                  className="w-full py-2 bg-emerald-750 hover:bg-emerald-850 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer mb-2"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>My Bookings</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-150 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-750" />
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
                <span className="text-[9px] font-black text-emerald-700 tracking-widest uppercase block">SECURE PATIENT ACCESS</span>
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
