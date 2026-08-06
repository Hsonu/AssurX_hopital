import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, MapPin, PhoneCall, ShoppingCart, User, Menu, X,
  ShieldCheck, ClipboardCheck, Users, Calendar, ArrowRight,
  Activity, FileText, BadgeCheck, Trash2, Plus, UserPlus,
  Info, Home, Building, QrCode, CreditCard, Laptop, Landmark,
  CheckCircle2, Loader2, Printer, Clock, Download, Eye,
  LogOut, ArrowLeft, Award, HeartPulse, Sparkles, Filter,
  Check, HelpCircle, Star, Sparkle, AlertTriangle, AlertCircle, ExternalLink,
  ChevronLeft, ChevronRight
} from 'lucide-react';

import { DiagnosticService, HealthPackage, CartItem, Patient, HomepageSection, ClinicCenter, Doctor, Testimonial } from './types';
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
import DirectBookModal from './components/DirectBookModal';
import { TrackOrderSection, HiringCareersSection } from './components/HearingAndTracking';
import MyBookingsSection from './components/MyBookingsSection';
import bloodTestingBanner from '../assets/blood_testing_banner.png';
import LegalPages from './components/LegalPages';
import { CUSTOMER_TESTIMONIALS } from './data';

const getPackageImage = (id: string) => {
  switch (id) {
    case 'pkg-sexual-health-basic':
    case 'pkg-sexual-health-pro':
      return 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop';
    case 'pkg-fever-profile':
      return 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=600&auto=format&fit=crop';
    case 'pkg-sugar-profile':
      return 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?q=80&w=600&auto=format&fit=crop';
    case 'pkg-health-econo-plus':
      return 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop';
    case 'pkg-health-gold':
      return 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop';
    case 'pkg-health-platinum':
    case 'pkg-health-platinum-plus':
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop';
    case 'pkg-health-ultimate':
      return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop';
    case 'pkg-womens-health-essential':
    case 'pkg-womens-health-advance':
      return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=600&auto=format&fit=crop';
    case 'pkg-pain-management':
      return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop';
    case 'pkg-anemia-screening':
      return 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=600&auto=format&fit=crop';
    case 'pkg-pre-operative':
      return 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop';
    case 'pkg-cardiac-profile':
      return 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?q=80&w=600&auto=format&fit=crop';
    case 'pkg-infertility-profile':
      return 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=600&auto=format&fit=crop';
    case 'pkg-hair-loss-profile':
      return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop';
    default:
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop';
  }
};

const resolveBannerImage = (img: string) => {
  if (img === 'bloodTestingBanner') return bloodTestingBanner;
  return img;
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings' | 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us'>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bookingRefreshKey, setBookingRefreshKey] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);

  const homeBanners = React.useMemo(() => [
    { src: '/fever_sugar_profile.png', alt: 'Fever and Sugar Profile Offer', tab: 'packages' as const },
    { src: '/sonography_equipment.png', alt: 'Sonography Scan Equipment Features', tab: 'scans' as const },
    { src: '/family_health_offer.png', alt: 'Family Health Offer - Save up to 50% Off', tab: 'packages' as const },
    { src: '/promo_code_offers.png', alt: 'Tests & Health Packages Promo Codes and Deals', tab: 'packages' as const },
  ], []);

  useEffect(() => {
    if (currentTab === 'home') {
      const interval = setInterval(() => {
        setActiveBanner((prev) => (prev + 1) % homeBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentTab, homeBanners.length]);

  // Dynamic homepage offerings sections
  const [sections, setSections] = useState<HomepageSection[]>(() => {
    const cached = localStorage.getItem('assurx_sections');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.map((sec: any) => {
            if (sec.id === 'section-scans' || sec.title === 'Imagine' || sec.title === 'Popular Scans & Imaging' || sec.title === 'Popular Scans & Diagnostic Imaging' || sec.title === 'Popular Sonography & Scan' || sec.title === 'Popular Sonography & USG Scans') {
              return { 
                ...sec, 
                title: 'Popular Sonography',
                bannerImage: '/sonography_equipment.png'
              };
            }
            return sec;
          });
        }
      } catch (e) {
        // use default if parse failed
      }
    }
    return [
      {
        id: 'section-scans',
        title: 'Popular Sonography',
        subtitle: 'Read by MD Radiologists • Same Day Reports',
        category: 'scan',
        viewAllTab: 'scans',
        bannerImage: '/sonography_equipment.png',
        bannerTag: 'Advanced Sonography Center',
        bannerTitle: 'High-Resolution 3D/4D Sonography (USG) & Advanced Scans',
        serviceIds: []
      },
      {
        id: 'section-labs',
        title: 'Popular Blood & Lab Tests',
        subtitle: 'Sterile Home Collection • Certified Phlebotomists',
        category: 'lab',
        viewAllTab: 'labs',
        bannerImage: 'bloodTestingBanner',
        bannerTag: 'NABL Standard Labs',
        bannerTitle: 'Sterile 1-Click Home Blood Collection with Barcoded Vials',
        serviceIds: []
      }
    ];
  });

  // Sync sections to localStorage
  useEffect(() => {
    localStorage.setItem('assurx_sections', JSON.stringify(sections));
  }, [sections]);

  // Dynamic diagnostic services catalog loaded from database
  const [services, setServices] = useState<DiagnosticService[]>([]);
  // Dynamic health packages loaded from database
  const [packages, setPackages] = useState<HealthPackage[]>([]);

  // Ref and states for packages horizontal scrolling
  const packagesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = useCallback(() => {
    if (packagesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = packagesScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    const el = packagesScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollPosition, { passive: true });
      window.addEventListener('resize', checkScrollPosition, { passive: true });
      // Check initial position
      const timer = setTimeout(checkScrollPosition, 200);
      return () => {
        el.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
        clearTimeout(timer);
      };
    }
  }, [packages, checkScrollPosition]);

  const scrollPackages = (direction: 'left' | 'right') => {
    if (packagesScrollRef.current) {
      const { scrollLeft, clientWidth } = packagesScrollRef.current;
      const scrollAmount = Math.min(420, clientWidth - 24);
      packagesScrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Fetch services
    fetch('/api/services')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load services");
        return res.json();
      })
      .then(data => setServices(data))
      .catch(err => {
        console.error("Error fetching services:", err);
      });

    // Fetch packages
    fetch('/api/packages')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load packages");
        return res.json();
      })
      .then(data => setPackages(data))
      .catch(err => {
        console.error("Error fetching packages:", err);
      });
  }, []);

  // Dynamic clinic centers loaded from MongoDB
  const [centers, setCenters] = useState<ClinicCenter[]>([]);

  // Fetch centers from API
  useEffect(() => {
    fetch('/api/centers')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load centers");
        return res.json();
      })
      .then(data => setCenters(data))
      .catch(err => {
        console.error("Error fetching centers:", err);
      });
  }, []);

  // Dynamic doctors directory loaded from MongoDB
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Fetch doctors from API
  useEffect(() => {
    fetch('/api/doctors')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load doctors");
        return res.json();
      })
      .then(data => setDoctors(data))
      .catch(err => {
        console.error("Error fetching doctors:", err);
      });
  }, []);

  // Dynamic testimonials loaded from MongoDB
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const testimonialScrollRef = useRef<HTMLDivElement>(null);
  const [expandedTestimonialId, setExpandedTestimonialId] = useState<string | null>(null);

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (testimonialScrollRef.current) {
      const { scrollLeft } = testimonialScrollRef.current;
      const cardWidth = 360; // Card width + gap
      const scrollTo = direction === 'left' 
        ? scrollLeft - cardWidth 
        : scrollLeft + cardWidth;
      testimonialScrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Fetch testimonials from API
  useEffect(() => {
    fetch('/api/testimonials')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load testimonials");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
        } else {
          setTestimonials(CUSTOMER_TESTIMONIALS);
        }
      })
      .catch(err => {
        console.error("Error fetching testimonials, falling back to local copy:", err);
        setTestimonials(CUSTOMER_TESTIMONIALS);
      });
  }, []);

  // Dynamic FAQs loaded from MongoDB
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);

  // Fetch FAQs from API
  useEffect(() => {
    fetch('/api/faqs')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load FAQs");
        return res.json();
      })
      .then(data => setFaqs(data))
      .catch(err => {
        console.error("Error fetching FAQs:", err);
      });
  }, []);

  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('All');
  const [doctorBranchFilter, setDoctorBranchFilter] = useState('All');

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

  const handleDirectBook = (item: DiagnosticService | HealthPackage) => {
    if (!user) {
      localStorage.setItem('assurx_pending_direct_booking', JSON.stringify({
        item,
        branch: selectedBranch
      }));
      setCurrentTab('bookings');
      return;
    }
    setDirectBookingItem(item);
  };

  const [selectedBranch, setSelectedBranchState] = useState<string>(() => {
    return localStorage.getItem('assurx_selected_branch') || 'Malad';
  });

  const setSelectedBranch = (branch: string) => {
    setSelectedBranchState(branch);
    localStorage.setItem('assurx_selected_branch', branch);
  };

  const [searchQuery, setSearchQuery] = useState('');

  // Tab-specific filters
  const [selectedScanSub, setSelectedScanSub] = useState('All');
  const [selectedLabSub, setSelectedLabSub] = useState('All');

  const { user, logout } = useAuth();

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
      logout().catch(() => { });
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
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminKey');
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
            setCurrentTab('home');
            localStorage.removeItem('assurx_pending_direct_booking');
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
            setCurrentTab('home');
            localStorage.removeItem('assurx_pending_checkout_booking');
          }
        } catch (e) {
          console.error("Failed to parse pending checkout booking on reload", e);
        }
      }
    }
  }, [user, selectedBranch]);

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
    if (!user) {
      localStorage.setItem('assurx_pending_checkout_booking', JSON.stringify({
        cart,
        bookingDetails: details
      }));
      setIsCartOpen(false);
      setCurrentTab('bookings');
      return;
    }
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
  const scanSubCategories = ['All', 'General Sonography', 'Obstetric Sonography', 'Color Doppler Sonography', 'ECHO (Cardiac Sonography)', 'Interventional Sonography'];
  const filteredScans = services.filter(s => {
    if (s.category !== 'scan') return false;
    const matchesSub = selectedScanSub === 'All' || s.subCategory === selectedScanSub;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSub && matchesSearch;
  });

  // Filter lab subcategories
  const labSubCategories = ['All', 'General Blood Tests', 'Hormone Assays', 'Diabetic Profiles', 'Cardiac Markers', 'Organ Screeners', 'Vitamins & Minerals', 'Infectious Diseases', 'Allergy & Autoimmune', 'Tumor Markers', 'Heavy Metals & Special'];
  const filteredLabs = services.filter(s => {
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
    ...services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    ...packages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ] : [];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                          doc.qualification.toLowerCase().includes(doctorSearchQuery.toLowerCase());
                          
    const matchesSpecialty = doctorSpecialtyFilter === 'All' || doc.specialization === doctorSpecialtyFilter;
    const matchesBranch = doctorBranchFilter === 'All' || doc.branch === doctorBranchFilter;
    
    return matchesSearch && matchesSpecialty && matchesBranch;
  });


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
        centers={centers}
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
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${inCart
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
              onDirectBook={handleDirectBook}
              services={services}
              packages={packages}
              centers={centers}
            />

            {/* ====== OUR SERVICES SECTION ====== */}
            <section className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="h-[3px] w-20 md:w-32 bg-[#009688] rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-slate-900">OUR SERVICES</h2>
                  <div className="h-[3px] w-20 md:w-32 bg-[#009688] rounded-full"></div>
                </div>
              </div>

              <div className="border-t-[3px] border-[#009688] pt-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
                  {/* Pathology */}
                  <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setCurrentTab('labs')}>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#F5F0FA] flex items-center justify-center mb-3 group-hover:bg-[#2D006B] transition-colors">
                      <svg className="w-7 h-7 md:w-8 md:h-8 text-[#2D006B] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                      </svg>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1.5">Pathology</h3>
                    <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed font-medium mb-3 px-1">COMPREHENSIVE LAB TESTING AND DIAGNOSTIC PATHOLOGY SERVICES.</p>
                    <span className="text-xs font-bold text-[#009688] group-hover:text-[#2D006B] transition-colors flex items-center gap-1">
                      Learn More <span className="text-sm">→</span>
                    </span>
                  </div>

                  {/* Sonography */}
                  <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setCurrentTab('scans')}>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#F5F0FA] flex items-center justify-center mb-3 group-hover:bg-[#2D006B] transition-colors">
                      <svg className="w-7 h-7 md:w-8 md:h-8 text-[#2D006B] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1.5">Sonography</h3>
                    <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed font-medium mb-3 px-1">ADVANCED ULTRASOUND IMAGING FOR ACCURATE DIAGNOSTICS.</p>
                    <span className="text-xs font-bold text-[#009688] group-hover:text-[#2D006B] transition-colors flex items-center gap-1">
                      Learn More <span className="text-sm">→</span>
                    </span>
                  </div>

                  {/* OBG Care */}
                  <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setCurrentTab('scans')}>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#F5F0FA] flex items-center justify-center mb-3 group-hover:bg-[#2D006B] transition-colors">
                      <svg className="w-7 h-7 md:w-8 md:h-8 text-[#2D006B] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1.5">OBG Care</h3>
                    <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed font-medium mb-3 px-1">COMPLETE OBSTETRIC AND GYNECOLOGICAL HEALTH SERVICES.</p>
                    <span className="text-xs font-bold text-[#009688] group-hover:text-[#2D006B] transition-colors flex items-center gap-1">
                      Learn More <span className="text-sm">→</span>
                    </span>
                  </div>

                  {/* General Health */}
                  <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setCurrentTab('packages')}>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#F5F0FA] flex items-center justify-center mb-3 group-hover:bg-[#2D006B] transition-colors">
                      <HeartPulse className="w-7 h-7 md:w-8 md:h-8 text-[#2D006B] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1.5">General Health</h3>
                    <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed font-medium mb-3 px-1">PREVENTIVE CARE, CHECKUPS, AND HEALTH PACKAGES.</p>
                    <span className="text-xs font-bold text-[#009688] group-hover:text-[#2D006B] transition-colors flex items-center gap-1">
                      Learn More <span className="text-sm">→</span>
                    </span>
                  </div>

                  {/* Cardio Care */}
                  <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setCurrentTab('scans')}>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#F5F0FA] flex items-center justify-center mb-3 group-hover:bg-[#2D006B] transition-colors">
                      <Activity className="w-7 h-7 md:w-8 md:h-8 text-[#2D006B] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1.5">Cardio Care</h3>
                    <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed font-medium mb-3 px-1">EMERGENCY, ESSENTIAL WITH RANGE OF MARKERS.</p>
                    <span className="text-xs font-bold text-[#009688] group-hover:text-[#2D006B] transition-colors flex items-center gap-1">
                      Learn More <span className="text-sm">→</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[3px] w-full bg-[#009688] rounded-full mt-8"></div>
            </section>

            {/* SEGMENTED TEST CATALOG EXPLORER */}
            {services.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center space-y-2 mb-10">
                  <h2 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">Our Core <span className="italic font-medium text-[#2D006B]">Diagnostic Offerings</span></h2>
                  <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto">Absolute clinical precision with high-end customer care. Select a category below to explore popular tests.</p>
                </div>

                {/* Flex grids of offering panels rendering dynamically based on user sections configuration */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {sections.map((section) => {
                    // Determine tests to display
                    let displayServices: DiagnosticService[] = [];
                    if (section.serviceIds && section.serviceIds.length > 0) {
                      displayServices = section.serviceIds
                        .map(id => services.find(s => s.id === id))
                        .filter((s): s is DiagnosticService => !!s);
                    } else {
                      displayServices = services
                        .filter(s => (section.category === 'all' || s.category === section.category) && s.popular)
                        .slice(0, 4);
                    }

                    const totalCount = section.serviceIds && section.serviceIds.length > 0
                      ? section.serviceIds.length
                      : services.filter(s => section.category === 'all' || s.category === section.category).length;

                    return (
                      <div key={section.id} className="bg-white border border-gray-250/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <div>
                            <h3 className="font-serif italic font-medium text-slate-900 text-base md:text-lg flex items-center gap-2">
                              {section.category === 'scan' ? (
                                <Activity className="w-4 h-4 text-[#AD1457]" />
                              ) : (
                                <ClipboardCheck className="w-4 h-4 text-[#AD1457]" />
                              )}
                              {section.title}
                            </h3>
                            <span className="text-[10px] text-slate-400">{section.subtitle}</span>
                          </div>
                          <button
                            onClick={() => setCurrentTab(section.viewAllTab || 'scans')}
                            className="text-[#DC2626] hover:text-[#B91C1C] font-bold text-xs uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>View All ({totalCount})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Section banner */}
                        <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[16/6] bg-slate-100 border border-slate-100/50 mb-4 shadow-sm">
                          <img
                            src={resolveBannerImage(section.bannerImage)}
                            alt={section.title}
                            className="w-full h-full object-cover select-none"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                          <div className="absolute bottom-3 left-3 right-3 text-left">
                            <span className="bg-emerald-600 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded mb-1 inline-block">
                              {section.bannerTag}
                            </span>
                            <p className="text-white text-[10.5px] font-bold leading-tight">
                              {section.bannerTitle}
                            </p>
                          </div>
                        </div>

                        {/* Services list inside this panel */}
                        <div className="space-y-3.5">
                          {displayServices.map((service) => {
                            const inCart = cart.some(ci => ci.itemId === service.id);
                            return (
                              <div key={service.id} className="border border-gray-100 p-4 rounded-2xl bg-[#fafafa]/40 hover:bg-[#fafafa]/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1 text-left flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-slate-850 text-xs md:text-sm truncate">{service.name}</h4>
                                    {service.parametersCount && (
                                      <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[8px]">
                                        {service.parametersCount} params
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{service.description}</p>
                                  <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 font-semibold rounded text-[9px]">
                                    {service.category === 'scan'
                                      ? `Prep: ${service.preparation.split('.')[0]}`
                                      : `Turnaround: ${service.reportDelivery}`}
                                  </span>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 flex-shrink-0 w-full sm:w-auto">
                                  <div className="text-left sm:text-right">
                                    <span className="text-sm font-black text-slate-800">₹{service.discountPrice || service.price}</span>
                                    {service.discountPrice && <p className="text-[10px] text-slate-400 line-through">₹{service.price}</p>}
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleDirectBook(service)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                                    >
                                      Book Now
                                    </button>
                                    <button
                                      onClick={() => handleAddToCart(service, 'service')}
                                      className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${inCart
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'border border-slate-200 hover:bg-slate-50 text-slate-655 bg-white'
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
                    );
                  })}
                </div>
              </section>
            )}

            {/* ====== ANIMATED PRECISION TESTING BANNER ====== */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#f5efe6] via-[#faf6ee] to-[#efe8da] py-10 md:py-14 border-y border-[#d4c4a0]/40">
              {/* Decorative background patterns */}
              <div className="absolute top-0 right-0 w-40 h-40 md:w-64 md:h-64 opacity-10 pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'80\' fill=\'none\' stroke=\'%238B4513\' stroke-width=\'1\'/%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'60\' fill=\'none\' stroke=\'%238B4513\' stroke-width=\'1\'/%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'40\' fill=\'none\' stroke=\'%238B4513\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat'}}></div>

              <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                {/* Title Section */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold italic text-[#3d2b1f] tracking-tight">
                    Precision Testing for Your Complete Health
                  </h2>
                  <p className="text-xs md:text-sm text-[#6b5744] font-semibold mt-2 tracking-wider">
                    ISO CERTIFIED • Digital Reports in 24 Hours • Free Home Sample Pickup
                  </p>
                </div>

                {/* Scrolling Test Cards */}
                <div className="relative overflow-hidden mb-8">
                  <div className="flex gap-4 md:gap-6 animate-[scroll_20s_linear_infinite] hover:[animation-play-state:paused]" style={{width: 'max-content'}}>
                    {/* Card Set 1 (original) */}
                    {[
                      { name: 'CBC TEST', desc: '24+ Immunity & Anemia Markers', price: 299, mrp: 599, discount: 50 },
                      { name: 'LIPID PROFILE', desc: 'Full Heart Check: Chol, HDL, LDL', price: 399, mrp: 799, discount: 50 },
                      { name: 'THYROID PANEL', desc: 'T3, T4, TSH Screening', price: 349, mrp: 699, discount: 50 },
                      { name: 'LIVER FUNCTION', desc: 'SGPT, SGOT, Bilirubin & More', price: 449, mrp: 899, discount: 50 },
                      { name: 'KIDNEY PROFILE', desc: 'Creatinine, BUN, Uric Acid', price: 399, mrp: 799, discount: 50 },
                      { name: 'VITAMIN D', desc: '25-Hydroxy Vitamin D Test', price: 599, mrp: 1199, discount: 50 },
                    ].map((test, i) => (
                      <div key={`a-${i}`} className="flex-shrink-0 w-56 md:w-64 bg-gradient-to-b from-[#f9f3e8] to-[#efe5d3] border border-[#d4c4a0] rounded-xl p-4 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-[#8B4513]/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-[#8B4513]" />
                          </div>
                          <h3 className="text-sm font-black text-[#3d2b1f] uppercase tracking-wide">{test.name}</h3>
                        </div>
                        <p className="text-[10px] text-[#6b5744] font-medium mb-3 leading-relaxed">{test.desc}</p>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-xl font-black text-[#3d2b1f]">₹{test.price}</span>
                          <span className="text-xs text-[#8B4513]/60 line-through">~₹{test.mrp}</span>
                          <span className="text-[10px] font-bold text-[#8B4513]">~ ({test.discount}% OFF)</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTab('labs');
                          }}
                          className="w-full py-1.5 bg-[#8B4513] hover:bg-[#6d350f] text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          ADD TO CART
                        </button>
                      </div>
                    ))}
                    {/* Card Set 2 (duplicate for seamless loop) */}
                    {[
                      { name: 'CBC TEST', desc: '24+ Immunity & Anemia Markers', price: 299, mrp: 599, discount: 50 },
                      { name: 'LIPID PROFILE', desc: 'Full Heart Check: Chol, HDL, LDL', price: 399, mrp: 799, discount: 50 },
                      { name: 'THYROID PANEL', desc: 'T3, T4, TSH Screening', price: 349, mrp: 699, discount: 50 },
                      { name: 'LIVER FUNCTION', desc: 'SGPT, SGOT, Bilirubin & More', price: 449, mrp: 899, discount: 50 },
                      { name: 'KIDNEY PROFILE', desc: 'Creatinine, BUN, Uric Acid', price: 399, mrp: 799, discount: 50 },
                      { name: 'VITAMIN D', desc: '25-Hydroxy Vitamin D Test', price: 599, mrp: 1199, discount: 50 },
                    ].map((test, i) => (
                      <div key={`b-${i}`} className="flex-shrink-0 w-56 md:w-64 bg-gradient-to-b from-[#f9f3e8] to-[#efe5d3] border border-[#d4c4a0] rounded-xl p-4 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-[#8B4513]/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-[#8B4513]" />
                          </div>
                          <h3 className="text-sm font-black text-[#3d2b1f] uppercase tracking-wide">{test.name}</h3>
                        </div>
                        <p className="text-[10px] text-[#6b5744] font-medium mb-3 leading-relaxed">{test.desc}</p>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-xl font-black text-[#3d2b1f]">₹{test.price}</span>
                          <span className="text-xs text-[#8B4513]/60 line-through">~₹{test.mrp}</span>
                          <span className="text-[10px] font-bold text-[#8B4513]">~ ({test.discount}% OFF)</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTab('labs');
                          }}
                          className="w-full py-1.5 bg-[#8B4513] hover:bg-[#6d350f] text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          ADD TO CART
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom: SHOW ALL TESTS + Trust Badges */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <button
                    onClick={() => setCurrentTab('labs')}
                    className="px-8 py-3 bg-[#009688] hover:bg-[#00796B] text-white rounded-lg text-sm font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:shadow-xl"
                  >
                    SHOW ALL TESTS <span className="text-lg">→</span>
                  </button>

                  <div className="flex items-center gap-6 md:gap-8">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#009688]/10 flex items-center justify-center">
                        <Home className="w-5 h-5 text-[#009688]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3d2b1f] uppercase">Free Home</p>
                        <p className="text-[10px] font-bold text-[#3d2b1f] uppercase">Collection</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[#009688]/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#009688]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3d2b1f] uppercase">Same-Day</p>
                        <p className="text-[10px] font-bold text-[#3d2b1f] uppercase">Digital Reports</p>
                      </div>
                    </div>
                  </div>

                  {/* POPULAR DIAGNOSTIC TESTS badge */}
                  <div className="hidden lg:flex items-center">
                    <div className="bg-[#d4870a] text-white px-4 py-2.5 rounded-lg shadow-lg">
                      <p className="text-[9px] font-black uppercase tracking-widest leading-tight text-center">POPULAR<br/>DIAGNOSTIC<br/>TESTS</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PRE-MADE DISCOUNT HEALTH CHECKUP PACKAGES */}
            {packages.length > 0 && (
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

                  {/* Horizontal slider container wrapper */}
                  <div className="relative group/slider px-2">
                    {/* Left Scroll Button */}
                    <button
                      onClick={() => scrollPackages('left')}
                      disabled={!canScrollLeft}
                      className={`absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 ${
                        canScrollLeft ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                      }`}
                      aria-label="Scroll Left"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Right Scroll Button */}
                    <button
                      onClick={() => scrollPackages('right')}
                      disabled={!canScrollRight}
                      className={`absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 ${
                        canScrollRight ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                      }`}
                      aria-label="Scroll Right"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Horizontal slider of packages */}
                    <div
                      ref={packagesScrollRef}
                      className="flex flex-nowrap overflow-x-auto gap-6 text-left scroll-smooth pb-6 pt-2 snap-x snap-mandatory no-scrollbar"
                      style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                    >
                      {packages.map((pkg) => {
                        const inCart = cart.some(ci => ci.itemId === pkg.id);
                        return (
                          <div
                            key={pkg.id}
                            className="w-[85vw] sm:w-[380px] md:w-[400px] flex-shrink-0 bg-[#16181d] border border-gray-800 rounded-3xl hover:border-emerald-500/50 shadow-xl flex flex-col justify-between overflow-hidden relative group transition-all snap-start"
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
                                    onClick={() => handleDirectBook(pkg)}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-550 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-full transition-all active:scale-[0.98] shadow-md shadow-emerald-950/20 cursor-pointer"
                                  >
                                    Book Now (Pay at Lab)
                                  </button>
                                  <button
                                    onClick={() => handleAddToCart(pkg, 'package')}
                                    className={`px-4 py-3 font-bold uppercase tracking-widest rounded-full text-[10px] transition-all active:scale-[0.98] cursor-pointer ${inCart
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
            )}

            {/* MEET OUR EXPERT DOCTORS (Item 8) */}
            {doctors.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-left space-y-8 animate-fade-in" id="doctors-section">
                {/* Header title block */}
                <div className="space-y-2 text-center pb-4">
                  <span className="inline-block px-3 py-1 bg-teal-50 border border-teal-200/60 rounded-full text-teal-800 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    Consult Top Medical Experts
                  </span>
                  <h2 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">
                    Meet Our <span className="italic font-medium text-[#2D006B]">Specialist Doctors</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto">
                    Book slots or request callbacks for evaluations with our verified specialist team.
                  </p>
                </div>


                {filteredDoctors.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/50 border border-dashed border-gray-200 rounded-3xl w-full">
                    <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500">No doctors match your query or filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {filteredDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white border border-gray-200/80 rounded-3xl shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all duration-300 p-5 flex flex-col justify-between group overflow-hidden"
                      >
                        <div className="space-y-4">
                          {/* Doctor Image / Avatar with dynamic effect */}
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                            <img
                              src={doc.avatar || 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=300&auto=format&fit=crop'}
                              alt={doc.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
                              <span className="bg-teal-700 text-white text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
                                {doc.specialization}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h3 className="font-serif font-bold text-slate-900 text-sm md:text-base leading-snug group-hover:text-teal-700 transition-colors">
                              {doc.name}
                            </h3>
                            <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">
                              {doc.qualification}
                            </p>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              {doc.experience} Years Experience
                            </p>
                          </div>

                          <div className="space-y-1.5 border-t border-gray-100 pt-3 text-[11px] text-slate-500">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-teal-650 flex-shrink-0" />
                              <span>{doc.timing}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              <span className="font-bold text-slate-600">{doc.branch} Branch</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SONOGRAPHY SHOWCASE (Item 9) */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-left" id="sonography-showcase">
              <div 
                onClick={() => setCurrentTab('scans')}
                className="rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500 transition-all duration-300 border border-gray-250 cursor-pointer"
              >
                <img
                  src="/sonography_equipment.png"
                  alt="Sonography & Ultrasound Scans Features"
                  className="w-full h-auto block select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            </section>

            {/* WHY ASSURX & BOOKING GUIDE (Item 10) */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-left" id="why-assurx">
              <div 
                onClick={() => setCurrentTab('packages')}
                className="rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500 transition-all duration-300 border border-gray-250 cursor-pointer"
              >
                <img
                  src="/family_health_offer.png"
                  alt="Why AssurRx and 4 Steps Booking Guide"
                  className="w-full h-auto block select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            </section>

            {/* PROMO CODES & DEALS (Item 11) */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-left" id="promos-section">
              <div 
                onClick={() => setCurrentTab('packages')}
                className="rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500 transition-all duration-300 border border-gray-250 cursor-pointer"
              >
                <img
                  src="/promo_code_offers.png"
                  alt="Tests and Health Packages Promo Codes"
                  className="w-full h-auto block select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            </section>

            {/* SOCIAL & SOCIETY HEALTH CAMPS (Item 12) */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-center space-y-8">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Community Initiative
                </span>
                <h3 className="text-3xl font-serif font-light text-slate-900 tracking-tight">
                  Social & Society <span className="italic font-medium text-[#2D006B]">Health Camps</span>
                </h3>
                <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto">
                  Bringing quality, subsidised, and free diagnostic checkups directly to your neighborhood or housing society.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {/* Camp Card 1 */}
                <div className="bg-[#FFF8F8] border border-red-100 p-6 rounded-3xl space-y-4 hover:shadow-md transition-all duration-300">
                  <h4 className="text-sm font-black text-red-800 uppercase tracking-wider border-b border-red-100 pb-2">
                    Free Health Check-ups
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-red-650 flex-shrink-0" />
                      <span>Blood Pressure & Blood Sugar</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-red-650 flex-shrink-0" />
                      <span>BMI & Weight Evaluation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-red-650 flex-shrink-0" />
                      <span>General Physician Consultation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-red-650 flex-shrink-0" />
                      <span>Personalized Health Advice</span>
                    </li>
                  </ul>
                </div>

                {/* Camp Card 2 */}
                <div className="bg-[#F0FAF7] border border-emerald-100 p-6 rounded-3xl space-y-4 hover:shadow-md transition-all duration-300">
                  <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-2">
                    Diagnostic Camps
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-650 flex-shrink-0" />
                      <span>ECG & Cardiac Screening</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-650 flex-shrink-0" />
                      <span>Subsidised Lipid & Thyroid Profile</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-650 flex-shrink-0" />
                      <span>Kidney & Liver Function Panels</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-650 flex-shrink-0" />
                      <span>Sterile Blood Sample Collection</span>
                    </li>
                  </ul>
                </div>

                {/* Camp Card 3 */}
                <div className="bg-[#F4F2FA] border border-purple-100 p-6 rounded-3xl space-y-4 hover:shadow-md transition-all duration-300">
                  <h4 className="text-sm font-black text-[#2D006B] uppercase tracking-wider border-b border-purple-100 pb-2">
                    Awareness Programs
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#2D006B] flex-shrink-0" />
                      <span>Diabetes & Hypertension Seminars</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#2D006B] flex-shrink-0" />
                      <span>Women's Health & Wellness Guidance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#2D006B] flex-shrink-0" />
                      <span>Pediatric Care & Nutrition Advice</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#2D006B] flex-shrink-0" />
                      <span>Healthy Lifestyle Workshops</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* TESTIMONIALS (PATIENT SUCCESS STORIES) */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 text-left space-y-8 py-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/60 rounded-full text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>5.0 Star Rated on Google Maps</span>
                  </div>
                  <h3 className="font-serif font-light text-slate-900 text-2xl md:text-3xl tracking-tight">Patient <span className="italic font-medium text-[#2D006B]">Success Stories</span></h3>
                  <p className="text-sm text-slate-500">Read authentic positive experiences from our satisfied health patrons.</p>
                </div>
                <a
                  href="https://maps.app.goo.gl/kUPZqcjN3dcsRyNo7?g_st=aw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-white border border-gray-250 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-full transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>View All Google Reviews</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Layout for rating and carousel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                {/* Left Column: Rating Info & Controls */}
                <div className="lg:col-span-4 bg-slate-50 border border-gray-150 p-8 rounded-3xl flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Stars */}
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {/* Big Rating text */}
                    <div>
                      <h4 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                        4.7
                      </h4>
                      <p className="text-lg font-bold text-slate-800 mt-2">
                        Google Rating
                      </p>
                    </div>
                    {/* Trusted text */}
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Trusted Over 10,000+ Doctors
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => scrollTestimonials('left')}
                      className="w-11 h-11 rounded-full border border-gray-250 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 flex items-center justify-center bg-white shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
                      aria-label="Scroll testimonials left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => scrollTestimonials('right')}
                      className="w-11 h-11 rounded-full border border-gray-250 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 flex items-center justify-center bg-white shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
                      aria-label="Scroll testimonials right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Right Column: Sliding Carousel */}
                <div className="lg:col-span-8 overflow-hidden relative flex items-center">
                  <div
                    ref={testimonialScrollRef}
                    className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-4 w-full"
                  >
                    {testimonials.map((testimonial) => {
                      const isExpanded = expandedTestimonialId === testimonial.id;
                      const comment = testimonial.comment || "";
                      const isLong = comment.length > 100;
                      
                      return (
                        <div
                          key={testimonial.id}
                          className="min-w-[290px] md:min-w-[340px] w-[290px] md:w-[340px] snap-start bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          <div className="space-y-3">
                            <p className="text-xs text-slate-600 leading-relaxed italic group-hover:text-slate-900 transition-colors">
                              "{isLong && !isExpanded ? `${comment.substring(0, 100)}...` : comment}"
                            </p>
                            {isLong && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setExpandedTestimonialId(isExpanded ? null : testimonial.id);
                                }}
                                className="text-[11px] font-bold text-teal-600 hover:text-[#2D006B] block transition-colors cursor-pointer text-left"
                              >
                                {isExpanded ? "Read Less" : "Read More"}
                              </button>
                            )}
                          </div>

                          <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <div>
                              <span className="text-slate-800 font-bold block text-xs">{testimonial.name}</span>
                              <span className="text-slate-400 font-medium">{testimonial.date} - {testimonial.location}</span>
                            </div>
                            
                            {/* Rating badge pill (5 ★) */}
                            <div className="bg-amber-500 text-white font-bold px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-0.5 shadow-sm">
                              <span>{testimonial.rating || 5}</span>
                              <Star className="w-2.5 h-2.5 fill-white text-white" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ SECTION */}
            <section className="max-w-4xl mx-auto px-4 md:px-6 text-left space-y-6">
              <h3 className="font-serif font-light text-slate-900 text-2xl md:text-3xl text-center tracking-tight">Frequently Asked <span className="italic font-medium text-[#2D006B]">Questions</span></h3>
              <div className="space-y-3 border border-gray-205 rounded-3xl bg-white p-6 md:p-8 divide-y divide-gray-100 shadow-sm">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                    <h4 className="font-bold text-slate-850 text-sm md:text-base flex items-start gap-2 leading-snug">
                      <HelpCircle className="w-4.5 h-4.5 text-[#AD1457] mt-0.5 flex-shrink-0" />
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
            <div className="border-b border-gray-150 pb-5">
              <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">Popular <span className="italic font-medium text-[#2D006B]">Sonography</span></h1>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 py-1 select-none overflow-x-auto scrollbar-none">
              {scanSubCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedScanSub(sub)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${selectedScanSub === sub
                    ? 'bg-[#2D006B] text-white shadow-md shadow-purple-900/20'
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
                            onClick={() => handleDirectBook(scan)}
                            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-emerald-100 cursor-pointer"
                          >
                            Book Now
                          </button>
                          <button
                            onClick={() => handleAddToCart(scan, 'service')}
                            className={`px-3 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all active:scale-[0.98] cursor-pointer ${inCart
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
              <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">Blood & Pathology <span className="italic font-medium text-[#2D006B]">Lab Tests</span></h1>
              <p className="text-xs md:text-sm text-slate-500">Accurate bio-markers screening including thyroid, blood sugar, liver, kidney, urine, lipid, and vitamins. Sterile Home Collection available.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 py-1 select-none overflow-x-auto scrollbar-none">
              {labSubCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedLabSub(sub)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${selectedLabSub === sub
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
                            onClick={() => handleDirectBook(lab)}
                            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-emerald-100 cursor-pointer"
                          >
                            Book Now
                          </button>
                          <button
                            onClick={() => handleAddToCart(lab, 'service')}
                            className={`px-3 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all active:scale-[0.98] cursor-pointer ${inCart
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
              <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">Full Body <span className="italic font-medium text-[#2D006B]">Health Checkup Packages</span></h1>
              <p className="text-xs md:text-sm text-slate-500">Highly discounted customized preventive screening diagnostics mapping complete vital systems, metabolic markers, and organ safety.</p>
            </div>

            {/* Packages List cards layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {packages.map((pkg) => {
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
                          onClick={() => handleDirectBook(pkg)}
                          className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest font-bold rounded-full transition-all active:scale-[0.98] shadow-md shadow-emerald-100 cursor-pointer"
                        >
                          Book Now
                        </button>
                        <button
                          onClick={() => handleAddToCart(pkg, 'package')}
                          className={`px-3 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all active:scale-[0.98] cursor-pointer ${inCart
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
            services={services}
            onUpdateServices={setServices}
            packages={packages}
            onUpdatePackages={setPackages}
            sections={sections}
            onUpdateSections={setSections}
            centers={centers}
            onUpdateCenters={setCenters}
            doctors={doctors}
            onUpdateDoctors={setDoctors}
          />
        )}
        {/* TAB 6: LEGAL & COMPLIANCE PAGES (Razorpay Requirements) */}
        {['privacy-policy', 'terms-of-use', 'refund-policy', 'shipping-policy', 'about-us', 'contact-us'].includes(currentTab) && (
          <LegalPages
            activeSection={currentTab as any}
            onSectionChange={(section) => setCurrentTab(section)}
          />
        )}

      </main>

      {/* Footer element */}
      <Footer onNavigate={setCurrentTab} centers={centers} selectedBranch={selectedBranch} />

      {/* --- FLOATING PRESCRIPTION DIALOG / PORTAL OVERLAY --- */}
      {isPrescriptionOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <PrescriptionUpload
            onAddItemsToCart={handleAddMultipleToCart}
            onClose={() => setIsPrescriptionOpen(false)}
            services={services}
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
        centers={centers}
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
      <CallbackSticky selectedBranch={selectedBranch} centers={centers} />

    </div>
  );
}
