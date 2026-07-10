import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, MapPin, PhoneCall, ShoppingCart, User, Menu, X, 
  ShieldCheck, ClipboardCheck, Users, Calendar, ArrowRight, 
  Activity, FileText, BadgeCheck, Trash2, Plus, UserPlus, 
  Info, Home, Building, QrCode, CreditCard, Laptop, Landmark, 
  CheckCircle2, Loader2, Printer, Clock, Download, Eye, 
  LogOut, ArrowLeft, Award, HeartPulse, Sparkles, Filter, 
  Check, HelpCircle, Star, Sparkle, AlertTriangle
} from 'lucide-react';

import { DiagnosticService, HealthPackage, CartItem, Patient } from './types';
import { DIAGNOSTIC_SERVICES, HEALTH_PACKAGES, FREQUENT_QUESTIONS, CUSTOMER_TESTIMONIALS, ASSURX_CENTERS } from './data';
import { auth } from './lib/firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './lib/auth.ts';
import { onSessionKicked, getUserSessionId, getAdminSessionId } from './lib/sessionGuard.ts';
import Header from './components/Header';
import Hero from './components/Hero';
import PrescriptionUpload from './components/PrescriptionUpload';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import CallbackSticky from './components/CallbackSticky';
import WindingStats from './components/WindingStats';
import DirectBookModal from './components/DirectBookModal';
import { TrackOrderSection, HiringCareersSection } from './components/HearingAndTracking';
import MyBookingsSection from './components/MyBookingsSection';
import bloodTestingBanner from '../assets/blood_testing_banner.png';

const getPackageImage = (id: string) => {
  switch (id) {
    case 'pkg-assurx-essential':
      return 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop';
    case 'pkg-assurx-premium':
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop';
    case 'pkg-assurx-women':
      return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=600&auto=format&fit=crop';
    case 'pkg-assurx-cardiac':
      return 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop';
    case 'pkg-assurx-senior':
      return 'https://images.unsplash.com/photo-1584515901107-568436142e00?q=80&w=600&auto=format&fit=crop';
    default:
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop';
  }
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings'>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bookingRefreshKey, setBookingRefreshKey] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutBookingDetails, setCheckoutBookingDetails] = useState<{
    patient: Patient;
    collectionType: 'home' | 'center';
    appointmentDate: string;
    appointmentTime: string;
    address?: { street: string; city: string; pincode: string };
  } | null>(null);

  // Direct Book Pay-at-lab State
  const [directBookingItem, setDirectBookingItem] = useState<DiagnosticService | HealthPackage | null>(null);

  const [selectedBranch, setSelectedBranch] = useState('Malad');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab-specific filters
  const [selectedScanSub, setSelectedScanSub] = useState('All');
  const [selectedLabSub, setSelectedLabSub] = useState('All');

  const { logout } = useAuth();

  // ── Session-kicked state: set when the server rejects our session ────────────
  // null = not kicked, 'user' = user session conflict, 'admin' = admin session conflict
  const [sessionKickedType, setSessionKickedType] = useState<'user' | 'admin' | null>(null);

  // Register global session-kick handlers once on mount
  useEffect(() => {
    const unsubUser = onSessionKicked('user', () => {
      // Auto-logout the user
      const storedUserId = localStorage.getItem('userSession');
      const myUserId = getUserSessionId();
      if (!storedUserId || storedUserId === myUserId) {
        localStorage.removeItem('userSession');
        localStorage.removeItem('assurx_demo_user');
      }
      logout().catch(() => {});
      setCurrentTab('home');
      setSessionKickedType('user');
    });

    const unsubAdmin = onSessionKicked('admin', () => {
      // Auto-logout the admin
      const storedAdminId = localStorage.getItem('adminSession');
      const myAdminId = getAdminSessionId();
      if (!storedAdminId || storedAdminId === myAdminId) {
        localStorage.removeItem('adminSession');
        localStorage.removeItem('assurx_admin_auth');
      }
      sessionStorage.removeItem('assurx_admin_auth');
      setCurrentTab('home');
      setSessionKickedType('admin');
    });

    return () => {
      unsubUser();
      unsubAdmin();
    };
  }, [logout]);

  // Toggle feedback alert when item is added to cart
  const [addedItemFeedback, setAddedItemFeedback] = useState<string | null>(null);

  // Auto scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  // Restore pending direct bookings or checkouts from localStorage upon successful sign-in / state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 1. Check for pending direct booking
        const pendingDirectStr = localStorage.getItem('assurx_pending_direct_booking');
        if (pendingDirectStr) {
          try {
            const saved = JSON.parse(pendingDirectStr);
            if (saved.item) {
              setDirectBookingItem(saved.item);
              if (saved.branch) {
                setSelectedBranch(saved.branch);
              }
            }
          } catch (e) {
            console.error("Failed to parse pending direct booking on reload", e);
          }
        }

        // 2. Check for pending checkout booking
        const pendingCheckoutStr = localStorage.getItem('assurx_pending_checkout_booking');
        if (pendingCheckoutStr) {
          try {
            const saved = JSON.parse(pendingCheckoutStr);
            if (saved.cart && saved.bookingDetails) {
              setCart(saved.cart);
              setCheckoutBookingDetails(saved.bookingDetails);
              setIsCheckoutOpen(true);
            }
          } catch (e) {
            console.error("Failed to parse pending checkout booking on reload", e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [selectedBranch]);

  // Handle adding a single service or package to cart
  const handleAddToCart = (item: DiagnosticService | HealthPackage, type: 'service' | 'package') => {
    // Check if already in cart
    if (cart.some(ci => ci.itemId === item.id)) {
      setAddedItemFeedback(`"${item.name}" is already in your cart!`);
      setTimeout(() => setAddedItemFeedback(null), 3000);
      setIsCartOpen(true);
      return;
    }

    const newItem: CartItem = {
      itemId: item.id,
      itemType: type,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      category: type === 'service' ? (item as DiagnosticService).category : undefined
    };

    setCart([...cart, newItem]);
    
    // Show toast notification
    setAddedItemFeedback(`Successfully added "${item.name}" to cart!`);
    setTimeout(() => setAddedItemFeedback(null), 3000);
  };

  // Handle adding multiple items from prescription upload
  const handleAddMultipleToCart = (items: CartItem[]) => {
    const existingIds = cart.map(c => c.itemId);
    const uniqueNewItems = items.filter(item => !existingIds.includes(item.itemId));
    
    if (uniqueNewItems.length > 0) {
      setCart([...cart, ...uniqueNewItems]);
      setAddedItemFeedback(`Added ${uniqueNewItems.length} prescription tests to your cart!`);
    } else {
      setAddedItemFeedback(`All selected tests are already in your cart!`);
    }
    setTimeout(() => setAddedItemFeedback(null), 3500);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(ci => ci.itemId !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Initiated from Cart Drawer "Proceed to Checkout"
  const handleCartProceed = (details: typeof checkoutBookingDetails) => {
    setCheckoutBookingDetails(details);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Payment simulated successfully -> clear cart, stay on home page
  const handleCheckoutSuccess = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setBookingRefreshKey(prev => prev + 1); // Keep AdminPanel data fresh for next admin visit
    setCurrentTab('home');
  };

  // Filter scan subcategories
  const scanSubCategories = ['All', 'MRI Scans', 'CT Scans', 'Ultrasound Scans', 'Digital X-Rays', 'Cardiology Tests', 'Bone Density'];
  const filteredScans = DIAGNOSTIC_SERVICES.filter(s => {
    if (s.category !== 'scan') return false;
    const matchesSub = selectedScanSub === 'All' || s.subCategory === selectedScanSub;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSub && matchesSearch;
  });

  // Filter lab subcategories
  const labSubCategories = ['All', 'General Blood Tests', 'Hormone Assays', 'Diabetic Profiles', 'Cardiac Markers', 'Organ Screeners', 'Vitamins & Minerals'];
  const filteredLabs = DIAGNOSTIC_SERVICES.filter(s => {
    if (s.category !== 'lab') return false;
    const matchesSub = selectedLabSub === 'All' || s.subCategory === selectedLabSub;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSub && matchesSearch;
  });

  // Global search matching scans, labs, packages
  const handleGlobalSearchFocus = () => {
    // If they focus on search, they might want to view the tab that has the matches
  };

  const globalSearchMatches = searchQuery.trim() ? [
    ...DIAGNOSTIC_SERVICES.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    ...HEALTH_PACKAGES.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col font-sans" id="app-root-frame">
      
      {/* ── Session Kicked Popup ─────────────────────────────────────────── */}
      {sessionKickedType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-amber-100 p-6 space-y-4 text-center animate-scale-in">
            <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">Session Ended</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                You have been logged out because your {sessionKickedType === 'admin' ? 'admin account' : 'account'} was signed in on another device.
              </p>
            </div>
            <button
              onClick={() => setSessionKickedType(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}

      {/* Toast Cart Added Alert Feedback */}
      {addedItemFeedback && (
        <div className="fixed top-24 right-4 z-50 bg-slate-900 border border-slate-800 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-xs md:max-w-md animate-slide-left">
          <Sparkle className="w-4 h-4 text-teal-400 animate-spin" />
          <span>{addedItemFeedback}</span>
        </div>
      )}

      {/* Header component */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        cart={cart}
        openCart={() => setIsCartOpen(true)}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchFocus={handleGlobalSearchFocus}
      />

      {/* VIEWPORT CONTROLLER */}
      <main className="flex-1">

        {/* --- GLOBAL SEARCH DROP-DOWN (Overlays above home when querying) --- */}
        {searchQuery.trim().length > 0 && (
          <div className="bg-white border-b border-slate-100 shadow-lg py-6 px-4 text-left animate-fade-in relative z-30">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Results for "{searchQuery}" ({globalSearchMatches.length} matches)</span>
                <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-teal-600 hover:underline">Clear Search</button>
              </div>

              {globalSearchMatches.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No scans, blood tests, or packages match your query. Try searching for "MRI", "Thyroid", "CBC", or "Full Body".</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {globalSearchMatches.map((item) => {
                    const isPackage = 'testsCount' in item;
                    const inCart = cart.some(ci => ci.itemId === item.id);
                    return (
                      <div key={item.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/30 flex justify-between items-center gap-4">
                        <div className="min-w-0">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide bg-teal-50 text-teal-700">
                            {isPackage ? 'Health Package' : (item as DiagnosticService).category === 'scan' ? 'Diagnostic Scan' : 'Pathology Test'}
                          </span>
                          <h4 className="font-bold text-slate-800 text-xs mt-1 truncate">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-800">₹{item.discountPrice || item.price}</span>
                            {item.discountPrice && <p className="text-[9px] text-slate-400 line-through">₹{item.price}</p>}
                          </div>
                          <button
                            onClick={() => {
                              handleAddToCart(item, isPackage ? 'package' : 'service');
                              setSearchQuery('');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                              inCart 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                            }`}
                          >
                            {inCart ? 'Added' : 'Book'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: HOMEPAGE */}
        {currentTab === 'home' && (
          <div className="space-y-12 animate-fade-in">
            {/* Hero Banner with Action Cards */}
            <Hero 
              onNavigate={setCurrentTab} 
              onOpenPrescription={() => setIsPrescriptionOpen(true)} 
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              onAddToCart={handleAddToCart}
              onDirectBook={(item) => setDirectBookingItem(item)}
            />

            {/* SEGMENTED TEST CATALOG EXPLORER */}
            <section className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="text-center space-y-2 mb-10">
                <h2 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">Our Core <span className="italic font-medium text-emerald-800">Diagnostic Offerings</span></h2>
                <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto">Absolute clinical precision with high-end customer care. Select a category below to explore popular tests.</p>
              </div>
 
              {/* Flex grids of popular scans and lab tests side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Popular Scans Panel */}
                <div className="bg-white border border-gray-250/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-serif italic font-medium text-slate-900 text-base md:text-lg flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        Popular Scans & Imaging
                      </h3>
                      <span className="text-[10px] text-slate-400">Read by MD Radiologists • Same Day Reports</span>
                    </div>
                    <button 
                      onClick={() => setCurrentTab('scans')}
                      className="text-emerald-600 hover:text-emerald-700 font-bold text-xs uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View All ({DIAGNOSTIC_SERVICES.filter(s=>s.category==='scan').length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Radiology Banners */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[16/6] bg-slate-100 border border-slate-100/50 mb-4 shadow-sm">
                    <img 
                      src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200&auto=format&fit=crop" 
                      alt="High Precision Radiology Scans"
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <span className="bg-emerald-600 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded mb-1 inline-block">Advanced Imaging Center</span>
                      <p className="text-white text-[10.5px] font-bold leading-tight">3D High-Field MRI & Low-Dose Multi-Slice CT Scanner</p>
                    </div>
                  </div>
 
                  {/* Scans list */}
                  <div className="space-y-3.5">
                    {DIAGNOSTIC_SERVICES.filter(s => s.category === 'scan' && s.popular).slice(0, 4).map((scan) => {
                      const inCart = cart.some(ci => ci.itemId === scan.id);
                      return (
                        <div key={scan.id} className="border border-gray-100 p-4 rounded-2xl bg-[#fafafa]/40 hover:bg-[#fafafa]/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 text-left flex-1 min-w-0">
                            <h4 className="font-bold text-slate-850 text-xs md:text-sm truncate">{scan.name}</h4>
                            <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{scan.description}</p>
                            <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 font-semibold rounded text-[9px]">
                              Prep: {scan.preparation.split('.')[0]}
                            </span>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 flex-shrink-0 w-full sm:w-auto">
                            <div className="text-left sm:text-right">
                              <span className="text-sm font-black text-slate-800">₹{scan.discountPrice || scan.price}</span>
                              {scan.discountPrice && <p className="text-[10px] text-slate-400 line-through">₹{scan.price}</p>}
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setDirectBookingItem(scan)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                              >
                                Book Now
                              </button>
                              <button
                                onClick={() => handleAddToCart(scan, 'service')}
                                className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                                  inCart 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'border border-slate-200 hover:bg-slate-50 text-slate-650 bg-white'
                                }`}
                              >
                                {inCart ? 'Added' : '+ Cart'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
 
                {/* Popular Pathology Lab Tests Panel */}
                <div className="bg-white border border-gray-250/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-serif italic font-medium text-slate-900 text-base md:text-lg flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                        Popular Blood & Lab Tests
                      </h3>
                      <span className="text-[10px] text-slate-400">Sterile Home Collection • Certified Phlebotomists</span>
                    </div>
                    <button 
                      onClick={() => setCurrentTab('labs')}
                      className="text-emerald-600 hover:text-emerald-700 font-bold text-xs uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View All ({DIAGNOSTIC_SERVICES.filter(s=>s.category==='lab').length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[16/6] bg-slate-100 border border-slate-100/50 mb-4 shadow-sm">
                    <img 
                      src={bloodTestingBanner} 
                      alt="State-of-the-art blood testing and pathology"
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <span className="bg-teal-600 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded mb-1 inline-block">NABL Standard Labs</span>
                      <p className="text-white text-[10.5px] font-bold leading-tight">Sterile 1-Click Home Blood Collection with Barcoded Vials</p>
                    </div>
                  </div>
 
                  {/* Lab tests list */}
                  <div className="space-y-3.5">
                    {DIAGNOSTIC_SERVICES.filter(s => s.category === 'lab' && s.popular).slice(0, 4).map((lab) => {
                      const inCart = cart.some(ci => ci.itemId === lab.id);
                      return (
                        <div key={lab.id} className="border border-gray-100 p-4 rounded-2xl bg-[#fafafa]/40 hover:bg-[#fafafa]/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 text-left flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-850 text-xs md:text-sm truncate">{lab.name}</h4>
                              {lab.parametersCount && (
                                <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[8px]">
                                  {lab.parametersCount} params
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{lab.description}</p>
                            <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 font-semibold rounded text-[9px]">
                              Turnaround: {lab.reportDelivery}
                            </span>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 flex-shrink-0 w-full sm:w-auto">
                            <div className="text-left sm:text-right">
                              <span className="text-sm font-black text-slate-800">₹{lab.discountPrice || lab.price}</span>
                              {lab.discountPrice && <p className="text-[10px] text-slate-400 line-through">₹{lab.price}</p>}
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setDirectBookingItem(lab)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                              >
                                Book Now
                              </button>
                              <button
                                onClick={() => handleAddToCart(lab, 'service')}
                                className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                                  inCart 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'border border-slate-200 hover:bg-slate-50 text-slate-650 bg-white'
                                }`}
                              >
                                {inCart ? 'Added' : '+ Cart'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
 
              </div>
            </section>

            {/* PRE-MADE DISCOUNT HEALTH CHECKUP PACKAGES */}
            <section className="bg-[#0f1115] text-slate-350 py-20 px-4 md:px-6 relative overflow-hidden border-b border-gray-900">
              {/* background ambient blur dots */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
              
              <div className="max-w-7xl mx-auto space-y-10 relative z-10">
                <div className="text-center space-y-3">
                  <span className="inline-block px-3 py-1 bg-[#16181d] border border-gray-800 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                    Recommended Preventive Screening
                  </span>
                  <h2 className="text-3xl md:text-4xl font-serif font-light text-white tracking-tight">Popular <span className="italic font-medium text-emerald-400">Health Checkup Packages</span></h2>
                  <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">Get comprehensive biological screening covering major vital systems under our highly subsidized medical health panels.</p>
                </div>
 
                {/* Horizontal slider of packages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {HEALTH_PACKAGES.slice(0, 3).map((pkg) => {
                    const inCart = cart.some(ci => ci.itemId === pkg.id);
                    return (
                      <div 
                        key={pkg.id} 
                        className="bg-[#16181d] border border-gray-800 rounded-3xl hover:border-emerald-500/50 shadow-xl flex flex-col justify-between overflow-hidden relative group transition-all"
                      >
                        {/* Package Thumbnail Image */}
                        <div className="relative aspect-[16/7] w-full bg-gray-900 overflow-hidden">
                          <img 
                            src={getPackageImage(pkg.id)} 
                            alt={pkg.name} 
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500 select-none"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#16181d] via-transparent to-transparent"></div>
                          {pkg.popular && (
                            <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-md z-10">
                              Best Value
                            </span>
                          )}
                        </div>

                        <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div>
                              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block">{pkg.testsCount} TESTS / PARAMETERS</span>
                              <h3 className="font-serif font-light text-white text-lg md:text-xl tracking-tight mt-1 group-hover:text-emerald-400 transition-colors">{pkg.name}</h3>
                              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{pkg.description}</p>
                            </div>
 
                            {/* list of subset tests included */}
                            <div className="space-y-1.5 border-t border-gray-800 pt-4">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Includes Lab Portfolios:</span>
                              <div className="space-y-1 text-[11px] text-slate-400">
                                {pkg.includedTests.slice(0, 4).map((test, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0"></span>
                                    <span className="truncate">{test}</span>
                                  </div>
                                ))}
                                {pkg.includedTests.length > 4 && (
                                  <span className="text-[10px] text-emerald-400 font-bold block pl-2.5">+{pkg.includedTests.length - 4} more profiles included</span>
                                )}
                              </div>
                            </div>
                          </div>
 
                          <div className="space-y-4 pt-4 border-t border-gray-800">
                            <div className="flex justify-between items-end">
                              <div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase block">Special Panel Rate</span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-2xl font-serif italic text-white">₹{pkg.discountPrice}</span>
                                  <span className="text-xs text-slate-500 line-through">₹{pkg.price}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-500">Save {Math.round(((pkg.price - pkg.discountPrice!) / pkg.price) * 100)}% Off</span>
                            </div>
 
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDirectBookingItem(pkg)}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-550 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-full transition-all active:scale-[0.98] shadow-md shadow-emerald-950/20 cursor-pointer"
                              >
                                Book Now (Pay at Lab)
                              </button>
                              <button
                                onClick={() => handleAddToCart(pkg, 'package')}
                                className={`px-4 py-3 font-bold uppercase tracking-widest rounded-full text-[10px] transition-all active:scale-[0.98] cursor-pointer ${
                                  inCart 
                                    ? 'bg-emerald-800 text-emerald-400 border border-emerald-950' 
                                    : 'bg-[#1e2129] hover:bg-[#252a35] text-white border border-gray-850'
                                }`}
                              >
                                {inCart ? 'Added' : '+ Cart'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
 
                <div className="text-center pt-2">
                  <button 
                    onClick={() => setCurrentTab('packages')}
                    className="px-6 py-3 border border-gray-800 hover:border-gray-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest rounded-full transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>View All Health Packages</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>

            {/* HIGH-FIDELITY PRESCRIPTION UPLOAD ACTION CARD */}
            <section className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="bg-slate-50 border border-gray-205 rounded-3xl p-6 md:p-10 text-left grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative overflow-hidden">
                <div className="md:col-span-8 space-y-3 relative z-10">
                  <div className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
                    Prescription Assistant
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-light text-slate-900 tracking-tight">Confused about what your <span className="italic font-medium text-emerald-800">doctor wrote?</span></h3>
                  <p className="text-xs md:text-sm text-slate-650 leading-relaxed max-w-xl">
                    Simply upload your handwritten or digital doctor prescription note. Our advanced diagnostics system reads and translates handwriting directly into NABL catalog tests, adding them to your booking cart in 5 seconds!
                  </p>
                  <button
                    onClick={() => setIsPrescriptionOpen(true)}
                    className="px-6 py-3 bg-[#1a1a1a] hover:bg-gray-800 text-white font-bold uppercase tracking-widest rounded-full text-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload & Extract Prescription Tests</span>
                  </button>
                </div>

                <div className="md:col-span-4 flex justify-center relative">
                  {/* abstract medical paper drawing */}
                  <div className="w-36 h-48 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex flex-col justify-between rotate-6 relative z-10">
                    <div className="space-y-1.5">
                      <div className="h-2 w-10 bg-slate-200 rounded"></div>
                      <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                      <div className="h-1.5 w-5/6 bg-slate-100 rounded"></div>
                    </div>
                    {/* handwritten script simulation */}
                    <div className="border-t border-dashed border-gray-200 py-3 space-y-2">
                      <div className="h-3 w-3/4 bg-emerald-50/50 rounded italic text-[7px] text-emerald-700 font-bold px-1 select-none">Rx: Thyroid Profile</div>
                      <div className="h-3 w-1/2 bg-emerald-50/50 rounded italic text-[7px] text-emerald-700 font-bold px-1 select-none">Rx: Vitamin D</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-2 w-6 bg-slate-200 rounded"></div>
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px]">✓</div>
                    </div>
                  </div>
                  <div className="absolute top-4 w-32 h-44 bg-emerald-100/20 rounded-2xl -rotate-3 z-0"></div>
                </div>
              </div>
            </section>

            {/* TRUST ELEMENTS SECTION (SERPENTINE DESIGN) */}
            <WindingStats />

            {/* TESTIMONIALS */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 text-left space-y-8">
              <div className="text-center md:text-left space-y-1">
                <h3 className="font-serif font-light text-slate-900 text-2xl md:text-3xl tracking-tight">Patient <span className="italic font-medium text-emerald-800">Success Stories</span></h3>
                <p className="text-xs text-slate-500">Read about the experiences of our satisfied health patrons.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CUSTOMER_TESTIMONIALS.map((testimonial) => (
                  <div key={testimonial.id} className="bg-[#fafafa]/50 border border-gray-200 p-6 rounded-3xl shadow-xs space-y-4 hover:bg-white transition-colors">
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-655 leading-relaxed italic">"{testimonial.comment}"</p>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <div>
                        <span className="text-slate-800 font-bold block">{testimonial.name}</span>
                        <span>{testimonial.location}</span>
                      </div>
                      <span>{testimonial.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ SECTION */}
            <section className="max-w-4xl mx-auto px-4 md:px-6 text-left space-y-6">
              <h3 className="font-serif font-light text-slate-900 text-2xl md:text-3xl text-center tracking-tight">Frequently Asked <span className="italic font-medium text-emerald-800">Questions</span></h3>
              <div className="space-y-3 border border-gray-205 rounded-3xl bg-white p-6 md:p-8 divide-y divide-gray-100 shadow-sm">
                {FREQUENT_QUESTIONS.map((faq, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                    <h4 className="font-bold text-slate-850 text-sm md:text-base flex items-start gap-2 leading-snug">
                      <HelpCircle className="w-4.5 h-4.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{faq.q}</span>
                    </h4>
                    <p className="text-xs text-slate-550 pl-6 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: SCANS AND IMAGING TAB */}
        {currentTab === 'scans' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-8 animate-fade-in text-left">
            <div className="space-y-2 border-b border-gray-150 pb-5">
              <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">Diagnostic <span className="italic font-medium text-emerald-800">Imaging & Scans</span></h1>
              <p className="text-xs md:text-sm text-slate-500">Browse MRI, CT Scan, Ultrasound, Mammogram, Digital X-Ray and cardiology tests. Read by certified MD Radiologists.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 py-1 select-none">
              {scanSubCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedScanSub(sub)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                    selectedScanSub === sub
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                      : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Scan Catalog List Grid */}
            {filteredScans.length === 0 ? (
              <div className="py-16 text-center bg-white border border-gray-205 rounded-3xl text-slate-400">
                No scan matches found. Try another category or adjust your search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredScans.map((scan) => {
                  const inCart = cart.some(ci => ci.itemId === scan.id);
                  return (
                    <div 
                      key={scan.id} 
                      className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-emerald-500/40 hover:shadow-lg transition-all flex flex-col justify-between gap-5 text-left"
                    >
                      <div className="space-y-3.5">
                        <div>
                          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-[9px] uppercase tracking-widest">
                            {scan.subCategory}
                          </span>
                          <h3 className="font-serif font-light text-slate-900 text-base md:text-lg tracking-tight mt-2">{scan.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{scan.description}</p>
                        
                        {/* Meta boxes */}
                        <div className="space-y-1.5 border-t border-gray-100 pt-3 text-[10px] text-slate-500 font-medium">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-400">Duration:</span>
                            <span>{scan.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-400">Reports:</span>
                            <span>{scan.reportDelivery}</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-400 flex-shrink-0">Prep:</span>
                            <span className="text-right leading-tight">{scan.preparation}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold leading-none uppercase tracking-wider">AssurX Rate</span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-lg font-serif italic font-bold text-slate-900">₹{scan.discountPrice || scan.price}</span>
                            {scan.discountPrice && <span className="text-[10px] text-slate-400 line-through">₹{scan.price}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setDirectBookingItem(scan)}
                            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-emerald-100 cursor-pointer"
                          >
                            Book Now
                          </button>
                          <button
                            onClick={() => handleAddToCart(scan, 'service')}
                            className={`px-3 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all active:scale-[0.98] cursor-pointer ${
                              inCart 
                                ? 'bg-emerald-55 text-emerald-700 border border-emerald-100' 
                                : 'border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                            }`}
                          >
                            {inCart ? 'Added' : '+ Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BLOOD & LAB TESTS TAB */}
        {currentTab === 'labs' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-8 animate-fade-in text-left">
            <div className="space-y-2 border-b border-gray-150 pb-5">
              <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">Blood & Pathology <span className="italic font-medium text-emerald-800">Lab Tests</span></h1>
              <p className="text-xs md:text-sm text-slate-500">Accurate bio-markers screening including thyroid, blood sugar, liver, kidney, urine, lipid, and vitamins. Sterile Home Collection available.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 py-1 select-none">
              {labSubCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedLabSub(sub)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                    selectedLabSub === sub
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                      : 'bg-white border border-gray-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Lab Catalog List Grid */}
            {filteredLabs.length === 0 ? (
              <div className="py-16 text-center bg-white border border-gray-200 rounded-3xl text-slate-400">
                No lab tests match the selected filters. Adjust filters or search keywords.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLabs.map((lab) => {
                  const inCart = cart.some(ci => ci.itemId === lab.id);
                  return (
                    <div 
                      key={lab.id} 
                      className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-emerald-500/40 hover:shadow-lg transition-all flex flex-col justify-between gap-5 text-left"
                    >
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-[9px] uppercase tracking-widest">
                            {lab.subCategory}
                          </span>
                          {lab.parametersCount && (
                            <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-800 font-bold rounded text-[8.5px] uppercase tracking-wider">
                              {lab.parametersCount} Tests Included
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif font-light text-slate-900 text-base md:text-lg tracking-tight">{lab.name}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{lab.description}</p>
                        
                        {/* Meta boxes */}
                        <div className="space-y-1.5 border-t border-gray-105 pt-3 text-[10px] text-slate-500 font-medium">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-400">Sample Type:</span>
                            <span>🩸 Blood (or Urine)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-400">Report Turnaround:</span>
                            <span>{lab.reportDelivery}</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-400 flex-shrink-0">Fasting:</span>
                            <span className="text-right leading-tight">{lab.preparation}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-105">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold leading-none uppercase tracking-wider">AssurX Rate</span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-lg font-serif italic font-bold text-slate-900">₹{lab.discountPrice || lab.price}</span>
                            {lab.discountPrice && <span className="text-[10px] text-slate-400 line-through">₹{lab.price}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setDirectBookingItem(lab)}
                            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-emerald-100 cursor-pointer"
                          >
                            Book Now
                          </button>
                          <button
                            onClick={() => handleAddToCart(lab, 'service')}
                            className={`px-3 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all active:scale-[0.98] cursor-pointer ${
                              inCart 
                                ? 'bg-emerald-55 text-emerald-700 border border-emerald-100' 
                                : 'border border-slate-200 hover:bg-slate-55 text-slate-600 bg-white'
                            }`}
                          >
                            {inCart ? 'Added' : '+ Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: HEALTH PACKAGES TAB */}
        {currentTab === 'packages' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-8 animate-fade-in text-left">
            <div className="space-y-2 border-b border-gray-150 pb-5">
              <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">Full Body <span className="italic font-medium text-emerald-800">Health Checkup Packages</span></h1>
              <p className="text-xs md:text-sm text-slate-500">Highly discounted customized preventive screening diagnostics mapping complete vital systems, metabolic markers, and organ safety.</p>
            </div>

            {/* Packages List cards layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {HEALTH_PACKAGES.map((pkg) => {
                const inCart = cart.some(ci => ci.itemId === pkg.id);
                return (
                  <div 
                    key={pkg.id} 
                    className="bg-white border border-gray-205 rounded-3xl hover:border-emerald-500/40 hover:shadow-lg transition-all text-left flex flex-col justify-between overflow-hidden relative shadow-sm"
                  >
                    {/* Package Banner Image */}
                    <div className="relative aspect-[16/6] w-full bg-slate-50 overflow-hidden">
                      <img 
                        src={getPackageImage(pkg.id)} 
                        alt={pkg.name} 
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                      {pkg.popular && (
                        <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[8px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-md z-10">
                          Bestseller Checkup
                        </span>
                      )}
                    </div>

                    <div className="p-6 md:p-8 space-y-4">
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest block">{pkg.testsCount} TESTS INCLUDED</span>
                        <h2 className="font-serif font-light text-slate-900 text-lg md:text-xl tracking-tight mt-1">{pkg.name}</h2>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{pkg.description}</p>
                      </div>

                      {/* demographic targets */}
                      <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl text-[10.5px] text-slate-650 font-semibold border border-gray-150">
                        <div>
                          <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Ideal Demographics</span>
                          <span className="text-slate-800 leading-tight mt-0.5 block">{pkg.idealFor}</span>
                        </div>
                        <div>
                          <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Frequency Cycle</span>
                          <span className="text-slate-800 leading-tight mt-0.5 block">{pkg.frequency}</span>
                        </div>
                      </div>

                      {/* Full checklists of tests included */}
                      <div className="space-y-2 border-t border-gray-100 pt-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Included Lab Test Portfolios:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-650">
                          {pkg.includedTests.map((test, index) => (
                            <div key={index} className="flex items-start gap-1.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                              <span className="truncate">{test}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prep notes */}
                      <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-800 leading-relaxed">
                        <span className="font-bold">Required Preparation:</span> {pkg.preparation}
                      </div>
                    </div>

                    {/* bottom action price row */}
                    <div className="p-6 md:p-8 pt-0 border-t border-gray-100 flex justify-between items-center mt-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold leading-none uppercase tracking-wider">Subsidy Rate</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl font-serif italic font-bold text-slate-900">₹{pkg.discountPrice}</span>
                          <span className="text-sm text-slate-450 line-through">₹{pkg.price}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setDirectBookingItem(pkg)}
                          className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-emerald-100 cursor-pointer"
                        >
                          Book Now
                        </button>
                        <button
                          onClick={() => handleAddToCart(pkg, 'package')}
                          className={`px-3 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all active:scale-[0.98] cursor-pointer ${
                            inCart 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'border border-slate-200 hover:bg-slate-50 text-slate-650 bg-white'
                          }`}
                        >
                          {inCart ? 'Added' : '+ Cart'}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4.5: HIRING & CAREERS */}
        {currentTab === 'hiring' && (
          <HiringCareersSection 
            selectedBranch={selectedBranch}
          />
        )}

        {/* TAB 4.8: MY PATIENT BOOKINGS PORTAL */}
        {currentTab === 'bookings' && (
          <MyBookingsSection 
            onNavigateToCatalog={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* TAB 5: ADMIN PANEL CONSOLE */}
        {currentTab === 'admin' && (
          <AdminPanel 
            currentTab={currentTab} 
            setCurrentTab={setCurrentTab}
            bookingRefreshKey={bookingRefreshKey}
          />
        )}

      </main>

      {/* Footer element */}
      <Footer onNavigate={setCurrentTab} />

      {/* --- FLOATING PRESCRIPTION DIALOG / PORTAL OVERLAY --- */}
      {isPrescriptionOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <PrescriptionUpload
            onAddItemsToCart={handleAddMultipleToCart}
            onClose={() => setIsPrescriptionOpen(false)}
          />
        </div>
      )}

      {/* --- SIDE-DRAWER SHOPPING CART CONTROL --- */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleCartProceed}
      />

      {/* --- checkout billing payment success modal overlays --- */}
      {isCheckoutOpen && checkoutBookingDetails && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          bookingDetails={checkoutBookingDetails}
          grandTotal={
            cart.reduce((acc, item) => acc + (item.discountPrice || item.price), 0) + 
            (checkoutBookingDetails.collectionType === 'home' ? 150 : 0) + 
            Math.round(cart.reduce((acc, item) => acc + (item.discountPrice || item.price), 0) * 0.05)
          }
          onBookingSuccess={handleCheckoutSuccess}
        />
      )}

      {/* --- DIRECT BOOKING MODAL (PAY AT LAB) --- */}
      {directBookingItem && (
        <DirectBookModal
          isOpen={!!directBookingItem}
          onClose={() => setDirectBookingItem(null)}
          selectedItem={directBookingItem}
          selectedBranch={selectedBranch}
          onBookingSuccess={() => {
            setDirectBookingItem(null);
            setBookingRefreshKey(prev => prev + 1); // Keep AdminPanel data fresh for next admin visit
            setCurrentTab('home');
          }}
        />
      )}

      {/* --- FLOATING PERSISTENT BOTTOM CALLBACK WIDGET --- */}
      <CallbackSticky />

    </div>
  );
}
